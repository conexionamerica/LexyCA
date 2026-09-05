// Vercel Serverless Function - Verificar Status Real do Pagamento no Asaas API v3
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { payment_id } = req.query;
  if (!payment_id) {
    return res.status(400).json({ error: 'ID do pagamento Asaas é obrigatório.' });
  }

  const apiKey = process.env.VITE_ASAAS_API_KEY || process.env.ASAAS_API_KEY || '';
  const baseUrl = process.env.VITE_ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

  try {
    const response = await fetch(`${baseUrl}/payments/${payment_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'LexyIdiomas/1.0'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.errors?.[0]?.description || 'Erro ao consultar pagamento no Asaas',
        details: data
      });
    }

    const isPaid = data.status === 'RECEIVED' || data.status === 'CONFIRMED' || data.status === 'RECEIVED_IN_CASH';
    return res.status(200).json({
      success: true,
      paymentId: data.id,
      status: data.status,
      paid: isPaid,
      value: data.value,
      billingType: data.billingType,
      invoiceUrl: data.invoiceUrl,
      rawResponse: data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro de comunicação com servidor Asaas.',
      details: error.message
    });
  }
}
