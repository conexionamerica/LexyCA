import { createClient } from '@supabase/supabase-js';

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
    const { student_id, teacher_id, start_time, end_time, cost } = req.body;

    // Validar parámetros obligatorios
    if (!student_id || !teacher_id || !start_time || !end_time || cost === undefined) {
      return res.status(400).json({ error: 'Missing required parameters (student_id, teacher_id, start_time, end_time, cost)' });
    }

    const parsedCost = Number(cost);
    if (isNaN(parsedCost) || parsedCost < 0) {
      return res.status(400).json({ error: 'Invalid cost parameter' });
    }

    // Inicializar cliente Supabase con Service Role (para omitir RLS y actualizar el saldo con seguridad)
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase keys are not defined in env variables.');
      return res.status(500).json({ error: 'Database credentials missing in server config' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Obtener saldo actual del alumno de forma segura
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('wallet_balance')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      console.error('Error fetching student wallet:', studentError);
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const currentBalance = Number(student.wallet_balance || 0);

    // 2. Validación de saldo crítica
    if (currentBalance < parsedCost) {
      return res.status(400).json({ 
        error: 'Saldo insuficiente', 
        balance: currentBalance, 
        required: parsedCost 
      });
    }

    // 3. Ejecutar la reserva llamando a la función RPC segura 'book_class'
    // Esta función realiza la transacción (descuenta saldo, inserta booking y registra logs) de forma atómica en Postgres.
    const { data: bookingId, error: rpcError } = await supabaseAdmin.rpc('book_class', {
      p_student_id: student_id,
      p_teacher_id: teacher_id,
      p_start_time: start_time,
      p_end_time: end_time,
      p_cost: parsedCost
    });

    if (rpcError) {
      console.error('RPC book_class execution error:', rpcError);
      return res.status(500).json({ error: 'Failed to complete transaction in database', details: rpcError.message });
    }

    return res.status(200).json({ 
      success: true, 
      booking_id: bookingId,
      message: 'Class booked successfully and credits deducted',
      new_balance: currentBalance - parsedCost
    });

  } catch (error) {
    console.error('Error in create booking API Route:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
