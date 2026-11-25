// Vercel Serverless Function - Cancelar assinatura recorrente no Asaas (DELETE /v3/subscriptions/{id})
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

    const asaasRes = await asaasFetch(`/subscriptions/${encodeURIComponent(asaasId)}`, { method: 'DELETE' });
    if (!asaasRes.ok) {
      console.error('[Asaas Cancel Error]:', asaasRes.data);
      // Antes este erro era ignorado e o aluno via "cancelado", mas continuava sendo cobrado.
      throw new HttpError(502, asaasErrorMessage(asaasRes.data, 'O Asaas não confirmou o cancelamento. Tente novamente.'));
    }

    await rememberAsaasSubscriptionId(supabase, row, asaasId);

    return res.status(200).json({
      success: true,
      subscriptionId: asaasId,
      status: 'CANCELED',
      message: 'Assinatura cancelada no Asaas. Não haverá novas cobranças.'
    });
  } catch (err) {
    return sendError(res, err, 'Asaas Cancel');
  }
}
