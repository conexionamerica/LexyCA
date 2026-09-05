// Vercel Serverless Function - Webhook Oficial Asaas API v3
// Endpoint para cadastrar no Painel Asaas (Minha Conta > Integracões > Webhooks):
// https://marketplace-tutores.vercel.app/api/webhooks/asaas

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

  // Verificação de Saúde do Webhook via GET
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'LexyPay Asaas Webhook Listener',
      endpoint: '/api/webhooks/asaas',
      description: 'Webhook ativo para receber eventos de pagamento e assinaturas com emissão de NFS-e.'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const eventBody = req.body;
    console.log('[Asaas Webhook Event Received]:', JSON.stringify(eventBody));

    const event = eventBody.event || '';
    const payment = eventBody.payment || {};
    const customer = payment.customer || {};

    // Processar Eventos de Pagamento Confirmado / Recebido (PIX ou Cartão)
    if (
      event === 'PAYMENT_RECEIVED' || 
      event === 'PAYMENT_CONFIRMED' || 
      event === 'PAYMENT_DUNNING_RECEIVED'
    ) {
      const studentEmail = (payment.email || customer.email || '').toLowerCase().trim();
      const rawValue = parseFloat(payment.value || payment.netValue || 200.0);
      
      // Cálculo de Aulas de 45 minutos (Média R$ 50 por aula de 45 min)
      let lessonsToAdd = 4;
      if (rawValue >= 600) lessonsToAdd = 16;
      else if (rawValue >= 480) lessonsToAdd = 12;
      else if (rawValue >= 320) lessonsToAdd = 8;
      else lessonsToAdd = Math.max(1, Math.round(rawValue / 50));

      console.log(`[Asaas Webhook] Pagamento Aprovado R$ ${rawValue}! Creditando +${lessonsToAdd} Aulas de 45 min para o aluno: ${studentEmail}`);

      if (studentEmail) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vmbjptvjuggmxsmgfkhr.supabase.co';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

        try {
          // 1. Buscar perfil do aluno no Supabase
          const fetchUserRes = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(studentEmail)}&select=*`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });
          const profiles = await fetchUserRes.json();

          if (Array.isArray(profiles) && profiles.length > 0) {
            const userProfile = profiles[0];
            const currentBal = parseFloat(userProfile.wallet_balance || 0);
            const newBal = currentBal + (lessonsToAdd * 50);

            // 2. Atualizar saldo no Supabase
            await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userProfile.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                wallet_balance: newBal,
                updated_at: new Date().toISOString()
              })
            });

            console.log(`[Asaas Webhook SUCCESS] Aulas de ${studentEmail} atualizadas com sucesso: +${lessonsToAdd} Aulas (45 min)!`);
          }
        } catch (dbErr) {
          console.warn('[Asaas Webhook DB Sync Warning]:', dbErr);
        }
      }

      // Tentar Agendar/Emitir Nota Fiscal Eletrônica no Asaas se disponível
      if (payment.id) {
        try {
          const apiKey = process.env.VITE_ASAAS_API_KEY || process.env.ASAAS_API_KEY || '';
          const baseUrl = process.env.VITE_ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

          await fetch(`${baseUrl}/invoices`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'access_token': apiKey,
              'User-Agent': 'LexyIdiomas/1.0'
            },
            body: JSON.stringify({
              payment: payment.id,
              serviceDescription: `Aulas particulares de idiomas online de 45 minutos (${lessonsToAdd} Aulas) - Lexy Idiomas`,
              value: rawValue,
              effectiveDate: new Date().toISOString().split('T')[0],
              taxes: { retainIss: false }
            })
          });
          console.log(`[Asaas Webhook] Solicitação de Nota Fiscal NFS-e enviada para o pagamento ${payment.id}`);
        } catch (nfeErr) {
          console.warn('[Asaas Invoice Webhook Warning]:', nfeErr);
        }
      }

      return res.status(200).json({
        received: true,
        event: event,
        payment_id: payment.id,
        lessons_added: lessonsToAdd,
        student_email: studentEmail,
        message: `Webhook processado com sucesso. +${lessonsToAdd} Aulas (45 min) creditadas.`
      });
    }

    return res.status(200).json({
      received: true,
      event: event,
      message: 'Evento Asaas registrado com sucesso.'
    });

  } catch (error) {
    console.error('[Asaas Webhook Exception]:', error);
    return res.status(500).json({
      error: 'Erro interno no processamento do Webhook Asaas.',
      message: error.message
    });
  }
}
