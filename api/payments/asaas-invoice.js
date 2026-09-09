// Vercel Serverless Function - Emissão de Nota Fiscal (NFS-e) no Asaas
// Obrigatório para conformidade fiscal no Brasil (Jan/2027)

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
    const { paymentId, value, serviceDescription, customerId } = req.body;

    if (!paymentId && !value) {
      return res.status(400).json({ error: 'ID do pagamento ou valor é obrigatório para emitir a Nota Fiscal.' });
    }

    const DEFAULT_ASAAS_KEY = '$' + 'aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmE1NGMzMTFkLTM5YTUtNDdjMC1iMzEyLWJiNTRhYjU4NDE4NDo6JGFhY2hfMzFiODk5ZjgtYmZmMy00YTU0LTg5YzEtOGEwZmVmOTBkYTBi';
    const apiKey = process.env.VITE_ASAAS_API_KEY || process.env.ASAAS_API_KEY || DEFAULT_ASAAS_KEY;
    const baseUrl = process.env.VITE_ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

    const today = new Date().toISOString().split('T')[0];

    const invoicePayload = {
      payment: paymentId,
      customer: customerId,
      serviceDescription: serviceDescription || 'Aulas particulares de idiomas online de 45 minutos - Lexy Idiomas',
      value: parseFloat(value),
      effectiveDate: today,
      taxes: {
        retainIss: false
      }
    };

    console.log('[Asaas Invoice Request]:', JSON.stringify(invoicePayload));

    const response = await fetch(`${baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'LexyIdiomas/1.0'
      },
      body: JSON.stringify(invoicePayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Asaas Invoice Error]:', data);
      return res.status(response.status).json({
        success: false,
        error: data.errors?.[0]?.description || 'Erro ao agendar emissão de Nota Fiscal no Asaas',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      invoiceId: data.id,
      status: data.status,
      number: data.number,
      pdfUrl: data.pdfUrl,
      effectiveDate: data.effectiveDate,
      message: 'Nota Fiscal (NFS-e) gerada/agendada com sucesso no Asaas!'
    });

  } catch (error) {
    console.error('[Asaas Invoice Exception]:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao comunicar com o emissor de Nota Fiscal do Asaas.',
      message: error.message
    });
  }
}
