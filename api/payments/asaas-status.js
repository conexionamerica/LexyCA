// Vercel Serverless Function - Consultar status real de uma cobrança no Asaas
import { applyCors, requireUser, asaasFetch, asaasErrorMessage, sendError, HttpError } from '../_lib/server.js';

export default async function handler(req, res) {
  if (applyCors(req, res, 'GET,OPTIONS')) return;
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Método não permitido' });

  try {
    const { user, profile } = await requireUser(req);
    const paymentId = String(req.query?.payment_id || '').trim();
    if (!/^[A-Za-z0-9_-]{4,64}$/.test(paymentId)) throw new HttpError(400, 'ID do pagamento inválido.');

    const payRes = await asaasFetch(`/payments/${encodeURIComponent(paymentId)}`);
    if (!payRes.ok) {
      throw new HttpError(payRes.status === 404 ? 404 : 502, asaasErrorMessage(payRes.data, 'Erro ao consultar pagamento no Asaas.'));
    }
    const data = payRes.data;

    // Conferir se a cobrança é do usuário: pela referência (cobranças novas) ou pelo email do cliente.
    if (profile?.role !== 'admin') {
      const ref = String(data.externalReference || '');
      let owns = ref.includes(user.id);
      if (!owns && data.customer) {
        const cust = await asaasFetch(`/customers/${encodeURIComponent(data.customer)}`);
        owns = cust.ok && String(cust.data?.email || '').toLowerCase() === String(user.email || '').toLowerCase();
      }
      if (!owns) throw new HttpError(403, 'Esta cobrança não pertence à sua conta.');
    }

    const paid = data.status === 'RECEIVED' || data.status === 'CONFIRMED' || data.status === 'RECEIVED_IN_CASH';
    return res.status(200).json({
      success: true,
      paymentId: data.id,
      status: data.status,
      paid,
      value: data.value,
      billingType: data.billingType,
      invoiceUrl: data.invoiceUrl
    });
  } catch (err) {
    return sendError(res, err, 'Asaas Status');
  }
}
