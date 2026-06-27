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
    const { teacher_id, amount, payment_method } = req.body;

    if (!teacher_id || amount === undefined) {
      return res.status(400).json({ error: 'Missing required parameters (teacher_id, amount)' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Crear el registro del payout en la tabla 'payouts'
    const { data: payout, error: payoutError } = await supabaseAdmin
      .from('payouts')
      .insert({
        id_teacher: teacher_id,
        amount: parsedAmount,
        payment_method: payment_method || 'PIX'
      })
      .select()
      .single();

    if (payoutError || !payout) {
      console.error('Error inserting payout record:', payoutError);
      return res.status(500).json({ error: 'Failed to create payout record in database' });
    }

    const newPayoutId = payout.id;

    // 2. Vincular todos los bookings 'completed' de este profesor que tengan payout_id nulo
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ payout_id: newPayoutId })
      .eq('id_teacher', teacher_id)
      .eq('status', 'completed')
      .is('payout_id', null);

    if (updateError) {
      console.error('Error linking bookings to payout:', updateError);
      return res.status(500).json({ error: 'Payout logged but failed to link past bookings' });
    }

    return res.status(200).json({
      success: true,
      payout_id: newPayoutId,
      amount: parsedAmount,
      message: 'Payout marked as paid and completed bookings linked successfully.'
    });

  } catch (error) {
    console.error('Error in create payout route:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
