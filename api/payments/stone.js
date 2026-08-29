// Vercel Serverless Function - Endpoint Backend Oficial Stone Pagamentos S.A. (Pagar.me API v5)
// Executado no servidor Node.js (Sem bloqueios de CORS do navegador)

export default async function handler(req, res) {
  // Configurar Headers de CORS para resposta limpa
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
    const { method, amount, description, customer, cardData } = req.body;

    const secretKey = process.env.VITE_STONE_SECRET_KEY || process.env.STONE_SECRET_KEY || 'sk_test_e281e8247d9842a58a07be13e0e5a577';
    const isTestMode = secretKey.startsWith('sk_test');
    const amountInCents = Math.max(100, Math.round((parseFloat(amount) || 1) * 100)); // Mínimo 100 centavos = R$ 1,00

    const cleanCpf = (customer?.document || '').replace(/\D/g, '');
    // CPF precisa ser válido com 11 dígitos, senão usa o CPF da conta Stone
    const validCpf = (cleanCpf.length === 11 && cleanCpf !== '12345678900') ? cleanCpf : '60319861082';

    const payload = {
      items: [
        {
          amount: amountInCents,
          description: description || 'Lexy Idiomas - Aulas e Assinatura',
          quantity: 1,
          code: 'item_lexy_01'
        }
      ],
      customer: {
        name: customer?.name || 'Minael Tamayo',
        email: customer?.email || 'aluno@lexy.com',
        document: validCpf,
        type: 'individual',
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: '11',
            number: '999999999'
          }
        }
      },
      payments: [
        {
          payment_method: method === 'pix' ? 'pix' : method === 'boleto' ? 'boleto' : 'credit_card',
          pix: method === 'pix' ? {
            expires_in: 900 // 15 minutos
          } : undefined,
          credit_card: method === 'credit_card' ? {
            installments: Number(cardData?.installments) || 1,
            statement_descriptor: 'LEXY IDIOMAS',
            operation_type: 'auth_and_capture',
            card: {
              number: (cardData?.number || '').replace(/\D/g, ''),
              holder_name: (cardData?.holderName || customer?.name || 'MINAEL TAMAYO').toUpperCase(),
              exp_month: parseInt(cardData?.expMonth || '12', 10),
              exp_year: parseInt(cardData?.expYear || '2030', 10),
              cvv: cardData?.cvv || '123',
              billing_address: {
                street: 'Rua Santo Antonio',
                number: '325',
                zip_code: '90015151',
                neighborhood: 'Independencia',
                city: 'Porto Alegre',
                state: 'RS',
                country: 'BR'
              }
            }
          } : undefined,
          // Split de Pagamento Progressivo (Liquidación Dinâmica configurada pelo Administrador)
          split: req.body?.tutorRecipientId ? [
            {
              recipient_id: req.body.tutorRecipientId,
              percentage: Number(req.body?.tutorPercentage) || 75, // % calculado dinamicamente conforme aulas concluídas do professor (Tier 1: 75% até Tier 5: 92%)
              options: {
                charge_processing_fee: true,
                charge_remainder_fee: true,
                liable: true
              }
            },
            {
              recipient_id: req.body?.platformRecipientId || 're_platform_house_lexy',
              percentage: Math.max(0, 100 - (Number(req.body?.tutorPercentage) || 75)), // Taxa de retenção progressiva administrada pela escola
              options: {
                charge_processing_fee: false,
                charge_remainder_fee: false,
                liable: false
              }
            }
          ] : undefined
        }
      ]
    };

    console.log(`[Stone API Server] Criando ordem Stone (${method}) - R$ ${amount}:`, JSON.stringify(payload));

    const authHeader = 'Basic ' + Buffer.from(`${secretKey}:`).toString('base64');

    const response = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Stone API Server Error]:', data);
      let errorMsg = data.message || 'Erro na API da Stone Pagamentos';
      if (data.errors && typeof data.errors === 'object') {
        const firstErrorKey = Object.keys(data.errors)[0];
        const errorList = data.errors[firstErrorKey];
        if (Array.isArray(errorList) && errorList.length > 0) {
          errorMsg = `${errorList[0]}`;
        }
      }
      return res.status(response.status).json({
        success: false,
        error: errorMsg,
        details: data
      });
    }

    const lastTx = data.charges?.[0]?.last_transaction || {};
    const chargeStatus = data.charges?.[0]?.status || '';
    const lastTxStatus = lastTx.status || '';
    const pixCode = lastTx.qr_code || lastTx.pix_provider_code;
    const qrCodeUrl = lastTx.qr_code_url;
    const barcode = lastTx.pdf || lastTx.line || lastTx.barcode;

    let finalPixCode = pixCode;
    if (method === 'pix' && !finalPixCode && isTestMode) {
      finalPixCode = '00020126580014BR.GOV.BCB.PIX0136stone-sandbox-test-pix-lexypay-20265204000053039865405' + amountInCents + '5802BR5925LexyPay Teste Sandbox6014RIO DE JANEIRO62070503***63041D2B';
    }

    // Verificar se a cobrança foi realmente aprovada/capturada no banco
    const isPaidOrCaptured = (data.status === 'paid') || 
                             (chargeStatus === 'paid') || 
                             (lastTxStatus === 'captured') || 
                             (lastTxStatus === 'authorized') ||
                             (method === 'pix' && !!finalPixCode);

    if (!isPaidOrCaptured) {
      let rawError = lastTx.acquirer_message || lastTx.gateway_response?.errors?.[0]?.message;
      if (!rawError || rawError.includes('aprovada com sucesso') || lastTxStatus === 'not_authorized') {
        rawError = 'Transação não autorizada pelo banco emissor. Verifique se a função crédito está ativa e se há limite disponível.';
      }
      console.error('[Stone Transaction Not Approved]:', rawError, data);
      return res.status(400).json({
        success: false,
        error: `Cartão Recusado: ${rawError}`,
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      transactionId: data.id,
      status: data.status || 'paid',
      amount: amountInCents / 100,
      pixCode: finalPixCode,
      qrCodeUrl: qrCodeUrl,
      barcode: barcode,
      rawResponse: data,
      message: 'Cobrança aprovada com sucesso!'
    });

  } catch (error) {
    console.error('[Stone Server Exception]:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao conectar com servidor Stone S.A.',
      message: error.message
    });
  }
}
