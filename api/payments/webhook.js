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
    // 1. Obtener los parámetros de Mercado Pago
    // El webhook de Mercado Pago puede mandar los datos en el query param o en el body
    const { query, body } = req;
    
    // Mercado Pago envía el ID de pago en query.id o en body.data.id
    const paymentId = query.id || (body.data && body.data.id) || body.id;
    const action = query.topic || body.type || body.action;

    console.log(`Webhook received - Action: ${action}, Payment ID: ${paymentId}`);

    if (!paymentId || (action !== 'payment' && action !== 'payment.updated' && action !== 'payment.created')) {
      // Retornamos 200 de todas formas para avisar que recibimos el evento
      return res.status(200).json({ received: true, message: 'Ignored non-payment action' });
    }

    const mercadopagoAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mercadopagoAccessToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN is missing.');
      return res.status(500).json({ error: 'Internal Server Configuration Error' });
    }

    // 2. Consultar detalles de pago en Mercado Pago API
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mercadopagoAccessToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching payment details from MercadoPago:', errorData);
      return res.status(500).json({ error: 'Failed to retrieve payment details' });
    }

    const paymentDetails = await response.json();
    const { status, status_detail, transaction_amount, external_reference } = paymentDetails;

    console.log(`Payment details: Status=${status}, StudentID=${external_reference}, Amount=${transaction_amount}`);

    // Si el pago no está aprobado, no hacemos nada y retornamos 200
    if (status !== 'approved') {
      return res.status(200).json({ status, message: 'Payment is not approved yet' });
    }

    // Si no hay ID de alumno (external_reference), no podemos acreditar el dinero
    if (!external_reference) {
      console.error('No external_reference (student ID) found in payment metadata.');
      return res.status(400).json({ error: 'Missing student ID in payment metadata' });
    }

    // 3. Conectarse a Supabase utilizando la llave Service Role (omite RLS para actualizaciones backend seguras)
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials are not defined.');
      return res.status(500).json({ error: 'Internal Server Database Configuration Error' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Evitar duplicar la misma recarga (idempotencia)
    const uniqueTxDescription = `Recarga aprobada (Mercado Pago ID: ${paymentId})`;
    const { data: existingTx, error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id')
      .eq('id_student', external_reference)
      .eq('description', uniqueTxDescription)
      .maybeSingle();

    if (txError) {
      console.error('Database query error checking duplicate tx:', txError);
      return res.status(500).json({ error: 'Database check failed' });
    }

    if (existingTx) {
      console.log(`Payment ${paymentId} has already been credited.`);
      return res.status(200).json({ success: true, message: 'Payment already processed' });
    }

    // 5. Acreditar saldo en la billetera del estudiante y registrar transacción
    // Hacemos un select del saldo actual para sumarlo de manera segura
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('wallet_balance')
      .eq('id', external_reference)
      .single();

    if (studentError || !student) {
      console.error('Error fetching student profile:', studentError);
      return res.status(404).json({ error: 'Student not found in database' });
    }

    const currentBalance = Number(student.wallet_balance || 0);
    const topupAmount = Number(transaction_amount);
    const newBalance = currentBalance + topupAmount;

    // Actualizar billetera del alumno
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({ wallet_balance: newBalance })
      .eq('id', external_reference);

    if (updateError) {
      console.error('Error updating student wallet balance:', updateError);
      return res.status(500).json({ error: 'Failed to update balance' });
    }

    // Registrar en transacciones de billetera
    const { error: logError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        id_student: external_reference,
        amount: topupAmount,
        type: 'top-up',
        description: uniqueTxDescription
      });

    if (logError) {
      console.error('Wallet update succeeded but log failed:', logError);
      // No fallamos el webhook ya que la recarga fue exitosa, pero dejamos registro del error
    }

    console.log(`Wallet updated successfully. Student: ${external_reference}, New Balance: R$ ${newBalance}`);
    
    return res.status(200).json({ success: true, payment_id: paymentId, credited_amount: topupAmount, new_balance: newBalance });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
