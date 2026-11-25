// Vercel Serverless Function - Reativar assinatura recorrente no Asaas
import { applyCors, requireUser, getSupabaseAdmin, asaasFetch, asaasErrorMessage, sendError, HttpError } from '../_lib/server.js';
import { resolveOwnedAsaasSubscription, rememberAsaasSubscriptionId } from '../_lib/payments.js';

export default async function handler(req, res) {
  if (applyCors(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método não permitido' });

  try {
    const { user, profile } = await requireUser(req);
    const supabase = getSupabaseAdmin();
    const { subscriptionId } = req.body || {};

    const { asaasId, row } = await resolveOwnedAsaasSubscription({ supabase, asaasFetch, user, profile, subscriptionId });

    if (!asaasId) {
      return res.status(200).json({ success: true, subscriptionId: null, status: 'NO_RECURRING_BILLING', message: 'Não há cobrança recorrente no Asaas para esta assinatura.' });
    }

    // Mantém o comportamento anterior: ao reativar, a próxima cobrança vence hoje.
    const today = new Date().toISOString().split('T')[0];
    const asaasRes = await asaasFetch(`/subscriptions/${encodeURIComponent(asaasId)}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'ACTIVE', nextDueDate: today })
    });
    if (!asaasRes.ok) {
      console.error('[Asaas Resume Error]:', asaasRes.data);
      throw new HttpError(502, asaasErrorMessage(asaasRes.data, 'O Asaas não confirmou a reativação. Tente novamente.'));
    }

    await rememberAsaasSubscriptionId(supabase, row, asaasId);

    return res.status(200).json({
      success: true,
      subscriptionId: asaasId,
      status: 'ACTIVE',
      message: 'Assinatura reativada.'
    });
  } catch (err) {
    return sendError(res, err, 'Asaas Resume');
  }
}
