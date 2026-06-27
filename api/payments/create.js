export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const paymentData = req.body;
    const { transaction_amount, token, description, installments, payment_method_id, payer, student_id } = paymentData;

    // Validate required fields
    if (!transaction_amount || !token || !payment_method_id || !payer || !payer.email || !student_id) {
      return res.status(400).json({ error: 'Missing required payment parameters', details: paymentData });
    }

    const mercadopagoAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mercadopagoAccessToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN is not defined in environment variables.');
      return res.status(500).json({ error: 'Internal Server Configuration Error' });
    }

    const payload = {
      transaction_amount: Number(transaction_amount),
      token: token,
      description: description || 'Recarga de Saldo - Marketplace de Tutores',
      installments: Number(installments) || 1,
      payment_method_id: payment_method_id,
      external_reference: student_id, // Asociamos el ID del alumno para el webhook
      payer: {
        email: payer.email,
        identification: payer.identification
      }
    };

    console.log('Sending payment to MercadoPago:', JSON.stringify({ ...payload, token: 'HIDDEN' }));

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadopagoAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': Date.now().toString()
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MercadoPago API Error:', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
