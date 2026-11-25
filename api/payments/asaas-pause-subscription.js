// Vercel Serverless Function - Pausar assinatura recorrente no Asaas (inativa e adia o vencimento)
import { applyCors, requireUser, getSupabaseAdmin, asaasFetch, asaasErrorMessage, sendError, HttpError } from '../_lib/server.js';
import { resolveOwnedAsaasSubscription, rememberAsaasSubscriptionId } from '../_lib/payments.js';

export default async function handler(req, res) {
  if (applyCors(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método não permitido' });

  try {
    const { user, profile } = await requireUser(req);
    const supabase = getSupabaseAdmin();
    const { subscriptionId } = req.body || {};
    const pauseDays = Number(req.body?.pauseDays ?? 20);
    if (!Number.isInteger(pauseDays) || pauseDays < 1 || pauseDays > 90) {
      throw new HttpError(400, 'Período de pausa inválido (1 a 90 dias).');
    }

    const { asaasId, row } = await resolveOwnedAsaasSubscription({ supabase, asaasFetch, user, profile, subscriptionId });

    if (!asaasId) {
      return res.status(200).json({ success: true, subscriptionId: null, status: 'NO_RECURRING_BILLING', message: 'Não há cobrança recorrente no Asaas para esta assinatura.' });
    }

    const nextDueDate = new Date(Date.now() + pauseDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const asaasRes = await asaasFetch(`/subscriptions/${encodeURIComponent(asaasId)}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'INACTIVE', nextDueDate })
    });
    if (!asaasRes.ok) {
      console.error('[Asaas Pause Error]:', asaasRes.data);
      throw new HttpError(502, asaasErrorMessage(asaasRes.data, 'O Asaas não confirmou a pausa. Tente novamente.'));
    }

    await rememberAsaasSubscriptionId(supabase, row, asaasId);

    return res.status(200).json({
      success: true,
      subscriptionId: asaasId,
      status: 'INACTIVE',
      nextDueDate,
      message: `Assinatura pausada por ${pauseDays} dias.`
    });
  } catch (err) {
    return sendError(res, err, 'Asaas Pause');
  }
}
