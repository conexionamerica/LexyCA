// Vercel Serverless Function - Criar assinatura recorrente Asaas (ciclo mensal / 30 dias)
import {
  applyCors, requireUser, asaasFetch, asaasErrorMessage, findOrCreateAsaasCustomer,
  getAsaasConfig, sendError, HttpError
} from '../_lib/server.js';
import { buildCustomer, buildCreditCard } from '../_lib/payments.js';

const MAX_AMOUNT = 10000;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método não permitido' });

  try {
    const { user, profile } = await requireUser(req);
    const body = req.body || {};
    const { planName, lessonsCount } = body;
    const method = body.method || 'credit_card';

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
      throw new HttpError(400, 'Valor da assinatura inválido.');
    }

    const billingType = method === 'pix' ? 'PIX' : 'CREDIT_CARD';
    const customer = buildCustomer(user, profile, body, { requireAddress: billingType === 'CREDIT_CARD' });
    const asaasCustomerId = await findOrCreateAsaasCustomer(customer);
    const { walletId } = getAsaasConfig();

    const subPayload = {
      customer: asaasCustomerId,
      billingType,
      value: Number(amount.toFixed(2)),
      nextDueDate: new Date().toISOString().split('T')[0],
      cycle: 'MONTHLY',
      description: planName || `Assinatura Lexy - ${lessonsCount || 4} Aulas (45 min) / 30 Dias`,
      externalReference: `sub_lexy_${user.id}_${Date.now()}`,
      ...(walletId ? { walletId } : {})
    };

    if (billingType === 'CREDIT_CARD') {
      Object.assign(subPayload, buildCreditCard(body.cardData || {}, customer));
    }

    const subRes = await asaasFetch('/subscriptions', { method: 'POST', body: JSON.stringify(subPayload) });
    if (!subRes.ok) {
      console.error('[Asaas Subscription Error]:', subRes.data);
      throw new HttpError(subRes.status >= 500 ? 502 : 400, asaasErrorMessage(subRes.data, 'Erro ao criar assinatura no Asaas.'));
    }
    const subData = subRes.data;

    // Criar a assinatura não significa que o cartão foi cobrado: conferir a primeira cobrança.
    let firstPaymentId = null;
    let firstPaymentStatus = null;
    const firstPay = await asaasFetch(`/subscriptions/${subData.id}/payments`);
    if (firstPay.ok && Array.isArray(firstPay.data?.data) && firstPay.data.data.length > 0) {
      firstPaymentId = firstPay.data.data[0].id;
      firstPaymentStatus = firstPay.data.data[0].status;
    }
    const confirmed = firstPaymentStatus === 'CONFIRMED' || firstPaymentStatus === 'RECEIVED';

    return res.status(200).json({
      success: true,
      subscriptionId: subData.id,
      status: subData.status,
      cycle: subData.cycle,
      amount: subData.value,
      nextDueDate: subData.nextDueDate,
      transactionId: firstPaymentId,
      firstPaymentId,
      firstPaymentStatus,
      confirmed,
      message: confirmed ? 'Assinatura criada e primeira cobrança aprovada.' : 'Assinatura criada; aguardando aprovação da primeira cobrança.'
    });
  } catch (err) {
    return sendError(res, err, 'Asaas Subscription');
  }
}
