// Vercel Serverless Function - Webhook Oficial Stone / Pagar.me v5
// URL para cadastrar no Painel Pagar.me (Configurações > Webhooks):
// https://marketplace-tutores.vercel.app/api/webhooks/stone

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

  // Responder a requisições GET para verificação de saúde do Webhook
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'LexyPay Stone Webhook Listener',
      endpoint: '/api/webhooks/stone',
      description: 'Webhook pronto para receber notificações automáticas de assinaturas e faturas da Stone S.A.'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const event = req.body;
    console.log('[Stone Webhook Event Received]:', JSON.stringify(event));

    const eventType = event.type || event.event || '';
    const eventData = event.data || event;

    // Processar Eventos de Fatura/Cobrança Paga Automática (Recorrência Mês 2 em diante)
    if (eventType === 'invoice.paid' || eventType === 'charge.paid' || eventType === 'subscription.created') {
      const customer = eventData.customer || {};
      const metadata = eventData.metadata || customer.metadata || {};
      const studentEmail = (customer.email || metadata.user_email || '').toLowerCase().trim();

      const rawAmount = eventData.amount || eventData.paid_amount || eventData.charge?.amount || 10000;
      const creditsToAdd = Math.max(1, Math.round(rawAmount / 100)); // Valor em Reais
      const hoursToAdd = creditsToAdd / 50; // Horas de Aula

      console.log(`[Stone Webhook] Creditando +${hoursToAdd.toFixed(1)} Horas de Aula (R$ ${creditsToAdd}) para o aluno: ${studentEmail}`);

      if (studentEmail) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vmbjptvjuggmxsmgfkhr.supabase.co';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

        // Buscar saldo atual do aluno na tabela 'profiles' de Supabase
        try {
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
            const newBal = currentBal + creditsToAdd;
            const currentHours = currentBal / 50;
            const newHours = newBal / 50;

            // Atualizar novo saldo no Supabase
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

            console.log(`[Stone Webhook SUCCESS] Horas de ${studentEmail} atualizadas com sucesso: +${hoursToAdd.toFixed(1)} hrs (${currentHours.toFixed(1)} hrs -> ${newHours.toFixed(1)} hrs)!`);
          }
        } catch (dbErr) {
          console.warn('[Stone Webhook DB Sync Warning]:', dbErr);
        }
      }

      return res.status(200).json({
        received: true,
        event: eventType,
        credits_added: creditsToAdd,
        hours_added: hoursToAdd,
        student_email: studentEmail,
        message: `Webhook processado com sucesso. +${hoursToAdd.toFixed(1)} Horas de Aula creditadas para ${studentEmail}.`
      });
    }

    // Outros eventos (ex: assinatura cancelada ou falha na renovação)
    return res.status(200).json({
      received: true,
      event: eventType,
      message: 'Evento registrado com sucesso.'
    });

  } catch (error) {
    console.error('[Stone Webhook Exception]:', error);
    return res.status(500).json({
      error: 'Erro interno no processamento do Webhook Stone.',
      message: error.message
    });
  }
}
