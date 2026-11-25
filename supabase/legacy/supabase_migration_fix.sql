-- ============================================================
-- MIGRATION CORRIGIDA - Execute no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar colunas que faltam
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS student_email TEXT,
  ADD COLUMN IF NOT EXISTS student_name TEXT,
  ADD COLUMN IF NOT EXISTS student_matricula TEXT,
  ADD COLUMN IF NOT EXISTS tutor_name TEXT,
  ADD COLUMN IF NOT EXISTS tutor_avatar TEXT,
  ADD COLUMN IF NOT EXISTS tutor_subject TEXT,
  ADD COLUMN IF NOT EXISTS plan_name TEXT,
  ADD COLUMN IF NOT EXISTS monthly_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paused_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Corrigir CHECK constraint para aceitar 'paused' e 'canceled'
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'paused', 'canceled', 'cancelled', 'expired'));

-- 3. Política de UPDATE (DROP primeiro, depois CREATE)
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (
    auth.uid() = student_id
    OR student_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = student_id
    OR student_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 4. Política de INSERT
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (
    auth.uid() = student_id
    OR student_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 5. Verificar resultado
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscriptions' AND table_schema = 'public'
ORDER BY ordinal_position;
