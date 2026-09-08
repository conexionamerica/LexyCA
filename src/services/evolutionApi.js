import { supabase } from '../lib/supabaseClient';

/**
 * Servicio para integrar Notificaciones en la Plataforma
 * Reemplaza el antiguo mock de WhatsApp por mensajes directos en la aplicacin.
 */

/**
 * Función genérica para enviar mensajes vía Chat Interno (Supabase)
 */
async function sendSystemMessage(studentId, message) {
  try {
    const { data, error } = await supabase.from('direct_messages').insert([{
      student_id: studentId,
      tutor_id: 'system',
      sender_role: 'admin',
      sender_name: 'Sistema Lexy',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    if (error) {
      console.error('Error enviando notificacion de sistema:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (error) {
    console.error('Catch enviando notificacion de sistema:', error);
    return { success: false, error };
  }
}

/**
 * Alerta: 1 hora antes de la clase
 */
export async function sendClassReminder(studentId, studentName, meetUrl, startTime) {
  const message = `*¡Hola ${studentName}!* 🎓\n\nTu clase en *Lexy Idiomas* está a punto de comenzar (en 1 hora aprox).\n\n📹 *Link de la sala:* ${meetUrl}\n\n¡Prepárate y mucho éxito en tu aprendizaje!`;
  return await sendSystemMessage(studentId, message);
}

/**
 * Alerta: Saldo Cero / Recarga
 */
export async function sendZeroBalanceAlert(studentId, studentName) {
  const message = `*¡Hola ${studentName}!* ⚠️\n\nQueríamos avisarte que tu saldo en *Lexy Idiomas* ha llegado a *R$ 0.00*.\n\nPara seguir agendando clases y no perder el ritmo, te invitamos a recargar tu billetera virtual en la plataforma.\n\n¡Te esperamos!`;
  return await sendSystemMessage(studentId, message);
}

/**
 * Alerta: Profesor Aprobado
 */
export async function sendTeacherApprovalAlert(teacherId, teacherName) {
  const message = `*¡Felicidades ${teacherName}!* 🎉\n\nTu perfil en *Lexy Idiomas* ha sido *aprobado* por nuestro equipo de administración.\n\nYa estás visible en nuestro catálogo de tutores. Asegúrate de tener tus horarios actualizados en tu panel.\n\n¡Mucho éxito en tus clases!`;
  // Para tutores, el student_id puede ser el tutor_id o system. Usaremos student_id = teacherId
  return await sendSystemMessage(teacherId, message);
}
