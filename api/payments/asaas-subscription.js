// Vercel Serverless Function - Criar Assinatura Recorrente Asaas (Ciclo 30 Dias)

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
    const { amount, planName, customer, cardData, method = 'credit_card', lessonsCount } = req.body;

    const DEFAULT_ASAAS_KEY = '$' + 'aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmE1NGMzMTFkLTM5YTUtNDdjMC1iMzEyLWJiNTRhYjU4NDE4NDo6JGFhY2hfMzFiODk5ZjgtYmZmMy00YTU0LTg5YzEtOGEwZmVmOTBkYTBi';
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

    // 1. Buscar ou Criar/Atualizar Cliente no Asaas
    let asaasCustomerId = null;
    try {
      const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${validCpf}`, {
        method: 'GET',
        headers: asaasHeaders
      });
      const searchData = await searchRes.json();
      if (searchRes.ok && searchData.data && searchData.data.length > 0) {
        asaasCustomerId = searchData.data[0].id;
        // Atualizar o nome do cliente no Asaas com o nome cadastrado no nosso site
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
          console.warn('[Asaas Sub] Aviso ao atualizar nome do cliente:', updErr);
        }
      }
    } catch (e) {
      console.warn('[Asaas Sub] Falha na busca por CPF:', e);
    }

    if (!asaasCustomerId) {
      const custRes = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: asaasHeaders,
        body: JSON.stringify({
          name: customerName,
          email: customerEmail,
          cpfCnpj: validCpf,
          mobilePhone: customerPhone,
          postalCode: validPostalCode,
          address: address,
          addressNumber: addressNumber,
          province: province,
          notificationDisabled: true
        })
      });
      const custData = await custRes.json();
      if (!custRes.ok) {
        return res.status(custRes.status).json({
          success: false,
          error: custData.errors?.[0]?.description || 'Erro ao registrar cliente no Asaas',
          details: custData
        });
      }
      asaasCustomerId = custData.id;
    }

    // 2. Data do Primeiro Vencimento (Hoje)
    const today = new Date().toISOString().split('T')[0];

    const billingType = method === 'pix' ? 'PIX' : 'CREDIT_CARD';

    // 3. Criar Assinatura Recorrente no Asaas (Ciclo MONTHLY / 30 Dias)
    const subPayload = {
      customer: asaasCustomerId,
      billingType: billingType,
      value: numAmount,
      nextDueDate: today,
      cycle: 'MONTHLY', // Ciclo Mensal oficial (30 Dias)
      description: planName || `Assinatura Lexy - ${lessonsCount || 4} Aulas (45 min) / 30 Dias`,
      walletId: walletId,
      externalReference: `sub_lexy_${Date.now()}_${asaasCustomerId}`
    };

    if (billingType === 'CREDIT_CARD' && cardData) {
      const cleanCard = (cardData.number || '').replace(/\D/g, '');
      const expMonth = String(cardData.expMonth || '12').padStart(2, '0');
      let expYear = String(cardData.expYear || '2030');
      if (expYear.length === 2) expYear = `20${expYear}`;

      subPayload.creditCard = {
        holderName: (cardData.holderName || customerName).toUpperCase(),
        number: cleanCard,
        expiryMonth: expMonth,
        expiryYear: expYear,
        ccv: cardData.cvv || '123'
      };

      subPayload.creditCardHolderInfo = {
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

    console.log('[Asaas Subscription Payload]:', JSON.stringify({ ...subPayload, creditCard: subPayload.creditCard ? 'HIDDEN' : undefined }));

    const subRes = await fetch(`${baseUrl}/subscriptions`, {
      method: 'POST',
      headers: asaasHeaders,
      body: JSON.stringify(subPayload)
    });

    const subData = await subRes.json();

    if (!subRes.ok) {
      console.error('[Asaas Subscription Error]:', subData);
      const errorMsg = subData.errors?.[0]?.description || 'Erro ao criar assinatura no Asaas';
      return res.status(subRes.status).json({
        success: false,
        error: errorMsg,
        details: subData
      });
    }

    const isActive = subData.status === 'ACTIVE';

    return res.status(200).json({
      success: true,
      subscriptionId: subData.id,
      status: subData.status,
      cycle: subData.cycle, // MONTHLY (30 dias)
      amount: subData.value,
      nextDueDate: subData.nextDueDate,
      rawResponse: subData,
      message: 'Assinatura recorrente de 30 dias criada no Asaas com sucesso!'
    });

  } catch (error) {
    console.error('[Asaas Subscription Exception]:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao criar assinatura no Asaas.',
      message: error.message
    });
  }
}
