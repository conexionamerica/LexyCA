// Vercel Serverless Function - Cobrança avulsa Asaas API v3 (PIX ou Cartão de Crédito)
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
    const { method, description, lessonsCount } = body;

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
      throw new HttpError(400, 'Valor da cobrança inválido.');
    }

    const billingType = method === 'pix' ? 'PIX' : 'CREDIT_CARD';
    const customer = buildCustomer(user, profile, body, { requireAddress: billingType === 'CREDIT_CARD' });
    const asaasCustomerId = await findOrCreateAsaasCustomer(customer);
    const { walletId } = getAsaasConfig();

    const paymentPayload = {
      customer: asaasCustomerId,
      billingType,
      value: Number(amount.toFixed(2)),
      dueDate: new Date().toISOString().split('T')[0],
      description: description || `Lexy Idiomas - ${lessonsCount || 4} Aulas (45 min)`,
      // Vincula a cobrança ao usuário: usado para conferir o dono em asaas-status e no webhook
      externalReference: `lexy_${user.id}_${Date.now()}`,
      ...(walletId ? { walletId } : {})
    };

    if (billingType === 'CREDIT_CARD') {
      Object.assign(paymentPayload, buildCreditCard(body.cardData || {}, customer));
    }

    const payRes = await asaasFetch('/payments', { method: 'POST', body: JSON.stringify(paymentPayload) });
    if (!payRes.ok) {
      console.error('[Asaas Payment API Error]:', payRes.data);
      throw new HttpError(payRes.status >= 500 ? 502 : 400, asaasErrorMessage(payRes.data, 'Erro ao processar pagamento com Asaas.'));
    }
    const payData = payRes.data;

    let pixCode = null;
    let qrCodeUrl = null;
    let expirationDate = null;
    if (billingType === 'PIX' && payData.id) {
      const pixRes = await asaasFetch(`/payments/${payData.id}/pixQrCode`);
      if (pixRes.ok && pixRes.data.payload) {
        pixCode = pixRes.data.payload;
        expirationDate = pixRes.data.expirationDate;
        if (pixRes.data.encodedImage) qrCodeUrl = `data:image/png;base64,${pixRes.data.encodedImage}`;
      }
    }

    const confirmed = payData.status === 'RECEIVED' || payData.status === 'CONFIRMED';

    return res.status(200).json({
      success: true,
      transactionId: payData.id,
      status: payData.status,
      amount: payData.value,
      billingType: payData.billingType,
      pixCode,
      qrCodeUrl,
      expirationDate,
      invoiceUrl: payData.invoiceUrl,
      confirmed,
      message: confirmed ? 'Cobrança aprovada com sucesso!' : 'Cobrança gerada com sucesso.'
    });
  } catch (err) {
    return sendError(res, err, 'Asaas Payment');
  }
}
