/**
 * Servicio para integrar Evolution API (WhatsApp)
 * Documentación oficial: https://evolution-api.com/
 */

const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'https://api.tu-servidor-evolution.com';
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || 'tu-api-key-global';
const INSTANCE_NAME = import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || 'LexyIdiomas';

/**
 * Función genérica para enviar mensajes vía Evolution API
 */
async function sendWhatsAppMessage(phone, message) {
  try {
    // En modo demo/local, solo hacemos un log para no fallar
    console.log(`[EVOLUTION API MOCK] Enviando a ${phone}:`, message);
    
    // Si estuviéramos en producción y con las variables seteadas, haríamos el fetch:
    /*
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: phone,
        options: {
          delay: 1200,
          presence: 'composing',
        },
        textMessage: {
          text: message
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error Evolution API: ${response.statusText}`);
    }
    return await response.json();
    */
    return { success: true, mock: true };
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    return { success: false, error };
  }
}

/**
 * Alerta: 1 hora antes de la clase
 */
export async function sendClassReminder(phone, studentName, meetUrl, startTime) {
  const message = `*¡Hola ${studentName}!* 🎓\n\nTu clase en *Lexy Idiomas* está a punto de comenzar (en 1 hora aprox).\n\n📹 *Link de la sala:* ${meetUrl}\n\n¡Prepárate y mucho éxito en tu aprendizaje!`;
  return await sendWhatsAppMessage(phone, message);
}

/**
 * Alerta: Saldo Cero / Recarga
 */
export async function sendZeroBalanceAlert(phone, studentName) {
  const message = `*¡Hola ${studentName}!* ⚠️\n\nQueríamos avisarte que tu saldo en *Lexy Idiomas* ha llegado a *R$ 0.00*.\n\nPara seguir agendando clases y no perder el ritmo, te invitamos a recargar tu billetera virtual directamente desde la plataforma:\n🔗 https://marketplace-tutores.vercel.app/dashboard/student/wallet\n\n¡Te esperamos!`;
  return await sendWhatsAppMessage(phone, message);
}

/**
 * Alerta: Profesor Aprobado
 */
export async function sendTeacherApprovalAlert(phone, teacherName) {
  const message = `*¡Felicidades ${teacherName}!* 🎉\n\nTu perfil en *Lexy Idiomas* ha sido *aprobado* por nuestro equipo de administración.\n\nYa estás visible en nuestro catálogo de tutores. Asegúrate de tener tus horarios actualizados en tu panel.\n🔗 https://marketplace-tutores.vercel.app/dashboard/teacher\n\n¡Mucho éxito en tus clases!`;
  return await sendWhatsAppMessage(phone, message);
}
