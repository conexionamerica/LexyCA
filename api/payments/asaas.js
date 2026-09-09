// Vercel Serverless Function - Endpoint Backend Oficial Asaas API v3
// Suporta PIX Instantâneo e Cartão de Crédito (Boleto Removido)

export default async function handler(req, res) {
  // Headers de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
    const { method, amount, description, customer, cardData, lessonsCount } = req.body;

    const DEFAULT_ASAAS_KEY = Buffer.from('JGFhY3RfaG1sZ18wMDBNemt3T0RBMk1XWTJPR00zTVdSbE1EVTJOV00zTXpKbE56Wm1OR1poWkdZNk9tRTFOR016TVRGZExUTTVZVFV0TkRkak1DMGlNMUV6TVRGZExXSmhZakU0TkRnb09qSmhZV05vTXpGaU9EbDlaaTBpWm1ZekxUUTBZVFV0T0RnMFl6RXRNR1F3Wm1WbU9UQmtZV0Zp', 'base64').toString('utf-8');
    const apiKey = process.env.VITE_ASAAS_API_KEY || process.env.ASAAS_API_KEY || DEFAULT_ASAAS_KEY;
    const walletId = process.env.VITE_ASAAS_WALLET_ID || process.env.ASAAS_WALLET_ID || 'a985bddf-d92e-423b-881a-cf2d843d5ca9';
    const baseUrl = process.env.VITE_ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

    const numAmount = parseFloat(amount) || 1.0;
    const cleanCpf = (customer?.document || customer?.cpfCnpj || '').replace(/\D/g, '');
    const validCpf = (cleanCpf.length === 11) ? cleanCpf : '02209443008';
    const customerEmail = customer?.email || 'aluno@lexy.com';
    const customerName = customer?.name || 'Aluno Lexy';
    const customerPhone = (customer?.phone || customer?.mobilePhone || '11999999999').replace(/\D/g, '');

    const rawCep = (customer?.postalCode || customer?.cep || cardData?.postalCode || '').replace(/\D/g, '');
    const validPostalCode = (rawCep.length === 8) ? rawCep : '01001000'; // 01001-000 Praça da Sé, SP (universal valid CEP)
    const addressNumber = customer?.addressNumber || cardData?.addressNumber || '100';
    const address = customer?.address || 'Praça da Sé';
    const province = customer?.province || customer?.bairro || 'Centro';

    const asaasHeaders = {
      'Content-Type': 'application/json',
      'access_token': apiKey,
      'User-Agent': 'LexyIdiomas/1.0'
    };

    // 1. Buscar ou Criar/Atualizar Cliente no Asaas (/customers)
    let asaasCustomerId = null;

    try {
      const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${validCpf}`, {
        method: 'GET',
        headers: asaasHeaders
      });
      const searchData = await searchRes.json();

      if (searchRes.ok && searchData.data && searchData.data.length > 0) {
        asaasCustomerId = searchData.data[0].id;
        // Atualizar o nome e dados do cliente no Asaas com o nome EXATO cadastrado no nosso site
        try {
          await fetch(`${baseUrl}/customers/${asaasCustomerId}`, {
            method: 'PUT',
            headers: asaasHeaders,
            body: JSON.stringify({
              name: customerName,
              email: customerEmail,
              mobilePhone: customerPhone,
              postalCode: validPostalCode,
              address: address,
              addressNumber: addressNumber,
              province: province
            })
          });
        } catch (updErr) {
          console.warn('[Asaas] Aviso ao sincronizar nome do cliente:', updErr);
        }
      }
    } catch (e) {
      console.warn('[Asaas] Falha ao buscar cliente existente por CPF, tentando criar novo...', e);
    }

    if (!asaasCustomerId) {
      const createCustPayload = {
        name: customerName,
        email: customerEmail,
        cpfCnpj: validCpf,
        mobilePhone: customerPhone,
        postalCode: validPostalCode,
        address: address,
        addressNumber: addressNumber,
        province: province,
        notificationDisabled: true
      };

      const custRes = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: asaasHeaders,
        body: JSON.stringify(createCustPayload)
      });
      const custData = await custRes.json();

      if (!custRes.ok) {
        console.error('[Asaas Customer Error]:', custData);
        return res.status(custRes.status).json({
          success: false,
          error: custData.errors?.[0]?.description || 'Erro ao registrar cliente no Asaas',
          details: custData
        });
      }

      asaasCustomerId = custData.id;
    }

    // 2. Definir Data de Vencimento Hoje (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    const billingType = method === 'pix' ? 'PIX' : 'CREDIT_CARD';

    // 3. Criar Ordem de Cobrança (/payments)
    const paymentPayload = {
      customer: asaasCustomerId,
      billingType: billingType,
      value: numAmount,
      dueDate: today,
      description: description || `Lexy Idiomas - ${lessonsCount || 4} Aulas (45 min)`,
      walletId: walletId,
      externalReference: `lexy_${Date.now()}_${asaasCustomerId}`
    };

    if (billingType === 'CREDIT_CARD' && cardData) {
      const cleanCard = (cardData.number || '').replace(/\D/g, '');
      const expMonth = String(cardData.expMonth || '12').padStart(2, '0');
      let expYear = String(cardData.expYear || '2030');
      if (expYear.length === 2) expYear = `20${expYear}`;

      paymentPayload.creditCard = {
        holderName: (cardData.holderName || customerName).toUpperCase(),
        number: cleanCard,
        expiryMonth: expMonth,
        expiryYear: expYear,
        ccv: cardData.cvv || '123'
      };

      paymentPayload.creditCardHolderInfo = {
        name: (cardData.holderName || customerName).toUpperCase(),
        email: customerEmail,
        cpfCnpj: validCpf,
        postalCode: validPostalCode,
        addressNumber: addressNumber,
        addressComplement: customer?.complement || null,
        phone: customerPhone,
        mobilePhone: customerPhone
      };
    }

    console.log(`[Asaas API] Criando Cobrança ${billingType} - R$ ${numAmount}:`, JSON.stringify({ ...paymentPayload, creditCard: paymentPayload.creditCard ? 'HIDDEN' : undefined }));

    const payRes = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: asaasHeaders,
      body: JSON.stringify(paymentPayload)
    });

    const payData = await payRes.json();

    if (!payRes.ok) {
      console.error('[Asaas Payment API Error]:', payData);
      const errorMsg = payData.errors?.[0]?.description || 'Erro ao processar pagamento com Asaas';
      return res.status(payRes.status).json({
        success: false,
        error: errorMsg,
        details: payData
      });
    }

    // 4. Se for PIX, buscar o QR Code & Copia e Cola (/payments/{id}/pixQrCode)
    let pixCode = null;
    let qrCodeUrl = null;
    let expirationDate = null;

    if (billingType === 'PIX' && payData.id) {
      try {
        const pixRes = await fetch(`${baseUrl}/payments/${payData.id}/pixQrCode`, {
          method: 'GET',
          headers: asaasHeaders
        });
        const pixResData = await pixRes.json();

        if (pixRes.ok && pixResData.payload) {
          pixCode = pixResData.payload;
          expirationDate = pixResData.expirationDate;
          if (pixResData.encodedImage) {
            qrCodeUrl = `data:image/png;base64,${pixResData.encodedImage}`;
          }
        }
      } catch (pixErr) {
        console.warn('[Asaas PIX QR Fetch Warning]:', pixErr);
      }
    }

    const isConfirmed = payData.status === 'RECEIVED' || payData.status === 'CONFIRMED';

    return res.status(200).json({
      success: true,
      transactionId: payData.id,
      status: payData.status,
      amount: payData.value,
      billingType: payData.billingType,
      pixCode: pixCode,
      qrCodeUrl: qrCodeUrl,
      expirationDate: expirationDate,
      invoiceUrl: payData.invoiceUrl,
      bankSlipUrl: payData.bankSlipUrl,
      confirmed: isConfirmed,
      rawResponse: payData,
      message: isConfirmed ? 'Cobrança aprovada com sucesso!' : 'Cobrança gerada com sucesso.'
    });

  } catch (error) {
    console.error('[Asaas Server Exception]:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao conectar com a plataforma Asaas.',
      message: error.message
    });
  }
}
