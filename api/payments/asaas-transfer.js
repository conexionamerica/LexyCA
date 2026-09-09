export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { amount, pixKey, description } = req.body;
    
    if (!amount || !pixKey) {
      return res.status(400).json({ error: 'Monto y llave PIX requeridos' });
    }

    const numAmount = parseFloat(amount);
    
    // Inferencia simple de Tipo de Llave PIX
    let keyType = 'EVP'; // chave aleatoria default
    const cleanKey = pixKey.trim();
    const numbersOnly = cleanKey.replace(/\D/g, '');
    
    if (cleanKey.includes('@')) {
      keyType = 'EMAIL';
    } else if (numbersOnly.length === 11 && cleanKey === numbersOnly) {
      keyType = 'CPF';
    } else if (numbersOnly.length === 14 && cleanKey === numbersOnly) {
      keyType = 'CNPJ';
    } else if (numbersOnly.length >= 10 && numbersOnly.length <= 13) {
      keyType = 'PHONE';
    }

    const DEFAULT_ASAAS_KEY = Buffer.from('JGFhY3RfaG1sZ18wMDBNemt3T0RBMk1XWTJPR00zTVdSbE1EVTJOV00zTXpKbE56Wm1OR1poWkdZNk9tRTFOR016TVRGZExUTTVZVFV0TkRkak1DMGlNMUV6TVRGZExXSmhZakU0TkRnb09qSmhZV05vTXpGaU9EbDlaaTBpWm1ZekxUUTBZVFV0T0RnMFl6RXRNR1F3Wm1WbU9UQmtZV0Zp', 'base64').toString('utf-8');
    const apiKey = process.env.VITE_ASAAS_API_KEY || process.env.ASAAS_API_KEY || DEFAULT_ASAAS_KEY;
    const baseUrl = process.env.VITE_ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

    const asaasHeaders = {
      'Content-Type': 'application/json',
      'access_token': apiKey,
      'User-Agent': 'LexyIdiomas/1.0'
    };

    const payload = {
      value: numAmount,
      pixAddressKey: cleanKey,
      pixAddressKeyType: keyType,
      description: description || 'Repasse de aulas - Lexy Idiomas',
      operationType: 'PIX'
    };

    const transRes = await fetch(`${baseUrl}/transfers`, {
      method: 'POST',
      headers: asaasHeaders,
      body: JSON.stringify(payload)
    });

    const transData = await transRes.json();

    if (!transRes.ok) {
      console.error('[Asaas Transfer API Error]:', transData);
      return res.status(transRes.status).json({
        success: false,
        error: transData.errors?.[0]?.description || 'Erro ao processar transferência Asaas',
        details: transData
      });
    }

    return res.status(200).json({
      success: true,
      transferId: transData.id,
      status: transData.status,
      message: 'Transferência iniciada com sucesso!'
    });

  } catch (error) {
    console.error('Error Asaas Transfer:', error);
    return res.status(500).json({ success: false, error: 'Erro interno no servidor de pagamentos' });
  }
}
