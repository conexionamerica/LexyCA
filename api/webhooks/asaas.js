// Vercel Serverless Function - Webhook Asaas API v3
// Configurar no painel Asaas (Integrações > Webhooks):
//   URL: https://www.lexyidiomas.com.br/api/webhooks/asaas
//   Token de autenticação: o mesmo valor da variável de ambiente ASAAS_WEBHOOK_TOKEN
//
// O que faz:
//   * Rejeita qualquer chamada sem o token correto (antes qualquer pessoa podia simular um pagamento).
//   * Registra cada evento na tabela public.asaas_payments (idempotente: o mesmo evento repetido
//     não gera efeito duplicado).
//   * Na primeira confirmação de um pagamento, solicita a emissão da NFS-e.
//
// NÃO credita aulas automaticamente: as aulas são criadas no checkout quando o pagamento é
// confirmado. A versão anterior "adivinhava" a quantidade de aulas pelo valor e, por usar a anon
// key, nunca conseguia gravar no banco.
import crypto from 'node:crypto';
import { getSupabaseAdmin, asaasFetch } from '../_lib/server.js';

const CONFIRMED_EVENTS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_DUNNING_RECEIVED']);
const CONFIRMED_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED']);

function tokenMatches(received, expected) {
  const a = Buffer.from(String(received || ''));
  const b = Buffer.from(String(expected || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expectedToken) {
    console.error('[Asaas Webhook] ASAAS_WEBHOOK_TOKEN não configurado: evento rejeitado.');
    return res.status(500).json({ error: 'Webhook não configurado.' });
  }
  if (!tokenMatches(req.headers['asaas-access-token'], expectedToken)) {
    return res.status(401).json({ error: 'Token inválido.' });
  }

  try {
    const body = req.body || {};
    const event = String(body.event || '');
    const payment = body.payment || {};

    if (!payment.id) {
      return res.status(200).json({ received: true, ignored: true });
    }

    const supabase = getSupabaseAdmin();

    const { data: previous } = await supabase
      .from('asaas_payments')
      .select('status, invoice_requested_at')
      .eq('id', payment.id)
      .maybeSingle();

    const { error: upsertError } = await supabase.from('asaas_payments').upsert({
      id: payment.id,
      last_event: event,
      status: payment.status || null,
      value: payment.value ?? null,
      net_value: payment.netValue ?? null,
      billing_type: payment.billingType || null,
      customer_id: payment.customer || null,
      subscription_id: payment.subscription || null,
      external_reference: payment.externalReference || null,
      raw: body,
      updated_at: new Date().toISOString()
    });

    if (upsertError) {
      console.error('[Asaas Webhook] Falha ao registrar evento:', upsertError);
      // 500 faz o Asaas reenviar o evento depois
      return res.status(500).json({ error: 'Falha ao registrar evento.' });
    }

    const isConfirmed = CONFIRMED_EVENTS.has(event) || CONFIRMED_STATUSES.has(payment.status);
    const firstConfirmation = isConfirmed && !previous?.invoice_requested_at;

    if (firstConfirmation) {
      try {
        const invoiceRes = await asaasFetch('/invoices', {
          method: 'POST',
          body: JSON.stringify({
            payment: payment.id,
            serviceDescription: `Aulas particulares de idiomas online - Lexy Idiomas${payment.description ? ` (${payment.description})` : ''}`,
            observations: 'Aulas online de idiomas.',
            value: payment.value,
            effectiveDate: new Date().toISOString().split('T')[0],
            taxes: { retainIss: false }
          })
        });
        if (!invoiceRes.ok) console.warn('[Asaas Webhook] NFS-e não emitida:', invoiceRes.data);
      } catch (nfeErr) {
        console.warn('[Asaas Webhook] Erro ao solicitar NFS-e:', nfeErr);
      }
      await supabase
        .from('asaas_payments')
        .update({ invoice_requested_at: new Date().toISOString() })
        .eq('id', payment.id);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Asaas Webhook Exception]:', error);
    return res.status(500).json({ error: 'Erro interno no processamento do webhook.' });
  }
}
