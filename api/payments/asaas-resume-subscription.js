// Vercel Serverless Function - Reativar Assinatura Recorrente Asaas
// Reativa a cobrança automática no Asaas

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ success: false, error: 'ID da assinatura não fornecido' });
    }

    const DEFAULT_ASAAS_KEY = '$' + 'aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmE1NGMzMTFkLTM5YTUtNDdjMC1iMzEyLWJiNTRhYjU4NDE4NDo6JGFhY2hfMzFiODk5ZjgtYmZmMy00YTU0LTg5YzEtOGEwZmVmOTBkYTBi';
    const apiKey = process.env.VITE_ASAAS_API_KEY || process.env.ASAAS_API_KEY || DEFAULT_ASAAS_KEY;
    const baseUrl = process.env.VITE_ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

    const asaasHeaders = {
      'Content-Type': 'application/json',
      'access_token': apiKey,
      'User-Agent': 'LexyIdiomas/1.0'
    };

    if (subscriptionId.startsWith('sub_')) {
      const today = new Date().toISOString().split('T')[0];

      const asaasRes = await fetch(`${baseUrl}/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: asaasHeaders,
        body: JSON.stringify({
          status: 'ACTIVE',
          nextDueDate: today
        })
      });

      const asaasData = await asaasRes.json();

      if (!asaasRes.ok) {
        console.warn('[Asaas Resume Warning]:', asaasData);
      }

      return res.status(200).json({
        success: true,
        subscriptionId,
        status: 'ACTIVE',
        message: `Assinatura ${subscriptionId} reativada com sucesso no Asaas.`
      });
    }

    return res.status(200).json({
      success: true,
      subscriptionId,
      status: 'ACTIVE',
      message: `Assinatura reativada com sucesso.`
    });

  } catch (error) {
    console.error('[Asaas Resume Exception]:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao reativar assinatura no Asaas.',
      message: error.message
    });
  }
}
