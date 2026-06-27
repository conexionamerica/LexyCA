export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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
    const { type, recipient_phone, data } = req.body;

    if (!type || !recipient_phone || !data) {
      return res.status(400).json({ error: 'Missing parameters (type, recipient_phone, data)' });
    }

    let messageText = '';

    // 1. Formatear mensajes según requerimientos de Fase 9
    if (type === 'class-reminder') {
      const { time_label, meet_url } = data;
      messageText = `¡Hola! Tu clase en Conexión América Idiomas comienza en ${time_label || '1 hora'}. Enlace para conectarte: ${meet_url || 'https://meet.google.com'}`;
    } else if (type === 'wallet-empty') {
      messageText = `Has agotado tus créditos de aprendizaje. Recarga tu billetera hoy mismo en tu panel para seguir agendando clases y no perder el ritmo.`;
    } else {
      messageText = data.text || 'Notificación de Conexión América';
    }

    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionToken = process.env.EVOLUTION_API_TOKEN;
    const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME || 'ConexionAmerica';

    console.log(`Sending WhatsApp (${type}) to ${recipient_phone}: "${messageText}"`);

    // 2. Si las variables de Evolution API están configuradas, hacer el fetch real
    if (evolutionUrl && evolutionToken) {
      const cleanedPhone = recipient_phone.replace(/\D/g, ''); // Eliminar no numéricos
      const endpoint = `${evolutionUrl}/message/sendText/${evolutionInstance}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionToken
        },
        body: JSON.stringify({
          number: cleanedPhone,
          text: messageText,
          delay: 1200 // retraso de 1.2 segundos para simular comportamiento humano
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        console.error('Error sending message to Evolution API:', resData);
        return res.status(response.status).json({ error: 'Evolution API failed', details: resData });
      }

      return res.status(200).json({ success: true, api_response: resData });
    } else {
      // Modo Demo/Simulado en desarrollo
      console.log('Evolution API variables are not set. Simulated notification logged successfully.');
      return res.status(200).json({
        success: true,
        simulated: true,
        message: 'Notification processed in Sandbox Simulation Mode',
        text: messageText
      });
    }

  } catch (error) {
    console.error('Webhook error processing WhatsApp notifications:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
