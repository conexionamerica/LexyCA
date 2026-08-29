// Vercel Serverless Function - Verificar Status Real da Ordem na Stone Pagamentos S.A.
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

  const { order_id } = req.query;
  if (!order_id) {
    return res.status(400).json({ error: 'ID da ordem Stone é obrigatório.' });
  }

  const secretKey = process.env.VITE_STONE_SECRET_KEY || process.env.STONE_SECRET_KEY || 'sk_test_e281e8247d9842a58a07be13e0e5a577';
  const authHeader = 'Basic ' + Buffer.from(`${secretKey}:`).toString('base64');

  try {
    const response = await fetch(`https://api.pagar.me/core/v5/orders/${order_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Erro ao consultar ordem na Stone',
        details: data
      });
    }

    const isPaid = data.status === 'paid';
    return res.status(200).json({
      success: true,
      orderId: data.id,
      status: data.status,
      paid: isPaid,
      charges: data.charges
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro de comunicação com Stone Pagamentos S.A.',
      details: error.message
    });
  }
}
