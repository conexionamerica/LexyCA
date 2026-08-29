// Vercel Serverless Function - Criar Assinatura Recorrente Stone / Pagar.me v5
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
    const { amount, planName, customer, cardData, interval = 'day', intervalCount = 28 } = req.body;

    const secretKey = process.env.VITE_STONE_SECRET_KEY || process.env.STONE_SECRET_KEY || 'sk_test_e281e8247d9842a58a07be13e0e5a577';
    const authHeader = 'Basic ' + Buffer.from(`${secretKey}:`).toString('base64');
    const amountInCents = Math.max(100, Math.round((parseFloat(amount) || 100) * 100)); // R$ 100 = 10000 centavos

    const cleanCpf = (customer?.document || '').replace(/\D/g, '');
    const validCpf = (cleanCpf.length === 11 && cleanCpf !== '12345678900') ? cleanCpf : '02209443008';

    // 1. Criar Plano na Pagar.me v5 para esta Recorrência (ex: a cada 28 dias)
    const planPayload = {
      name: planName || `Plano Lexy R$ ${Math.round(amountInCents / 100)} (A cada ${intervalCount} dias)`,
      interval: interval,
      interval_count: parseInt(intervalCount, 10) || 28,
      billing_type: 'prepaid',
      payment_methods: ['credit_card'],
      items: [
        {
          name: `Assinatura Lexy - R$ ${Math.round(amountInCents / 100)}`,
          quantity: 1,
          pricing_scheme: {
            price: amountInCents
          }
        }
      ]
    };

    const planRes = await fetch('https://api.pagar.me/core/v5/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(planPayload)
    });

    const planData = await planRes.json();
    if (!planRes.ok) {
      console.error('[Stone Plan Creation Error]:', planData);
      return res.status(planRes.status).json({
        success: false,
        error: planData.message || planData.errors?.[0]?.message || 'Erro ao criar plano na Stone',
        details: planData
      });
    }

    // 2. Criar a Assinatura (Subscription) associada ao Plano
    const subPayload = {
      plan_id: planData.id,
      payment_method: 'credit_card',
      card: {
        number: (cardData?.number || '').replace(/\D/g, ''),
        holder_name: (cardData?.holderName || customer?.name || 'ALUNO LEXY').toUpperCase(),
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
      },
      customer: {
        name: customer?.name || 'Aluno Lexy',
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
      metadata: {
        user_email: customer?.email || 'aluno@lexy.com',
        user_name: customer?.name || 'Aluno Lexy',
        monthly_credits: (amountInCents / 100).toString()
      },
      // Split de Pagamento Progressivo (Liquidación Dinâmica configurada pelo Administrador)
      split: req.body?.tutorRecipientId ? [
        {
          recipient_id: req.body.tutorRecipientId,
          percentage: Number(req.body?.tutorPercentage) || 75, // % calculado dinamicamente conforme nível/aulas do professor (Admin Tier Rates)
          options: {
            charge_processing_fee: true,
            charge_remainder_fee: true,
            liable: true
          }
        },
        {
          recipient_id: req.body?.platformRecipientId || 're_platform_house_lexy',
          percentage: Math.max(0, 100 - (Number(req.body?.tutorPercentage) || 75)), // Retenção progressiva calculada pela plataforma
          options: {
            charge_processing_fee: false,
            charge_remainder_fee: false,
            liable: false
          }
        }
      ] : undefined
    };

    console.log('[Stone Subscription Payload]:', JSON.stringify(subPayload));

    const subRes = await fetch('https://api.pagar.me/core/v5/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(subPayload)
    });

    const subData = await subRes.json();

    if (!subRes.ok) {
      console.error('[Stone Subscription Error]:', subData);
      const errorMsg = subData.message || subData.errors?.[0]?.message || 'Erro ao ativar assinatura na Stone S.A.';
      return res.status(subRes.status).json({
        success: false,
        error: `Erro Assinatura Stone: ${errorMsg}`,
        details: subData
      });
    }

    const isSubActive = subData.status === 'active' || subData.status === 'billed';

    return res.status(200).json({
      success: isSubActive,
      subscriptionId: subData.id,
      planId: planData.id,
      status: subData.status,
      amount: amountInCents / 100,
      nextBillingAt: subData.next_billing_at,
      message: 'Assinatura recorrente Stone criada com sucesso!'
    });

  } catch (error) {
    console.error('[Stone Subscription Exception]:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao criar assinatura recorrente Stone.',
      message: error.message
    });
  }
}
