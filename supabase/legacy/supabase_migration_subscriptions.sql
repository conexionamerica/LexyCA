-- ============================================================
-- MIGRATION: Atualizar tabela subscriptions
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Adicionar colunas que faltam na tabela subscriptions
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
  ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pix',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Corrigir o CHECK constraint do status para incluir 'paused' e 'canceled'
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'paused', 'canceled', 'cancelled', 'expired'));

-- 3. Adicionar políticas RLS para UPDATE (sem elas, o update não funciona!)
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Política adicional para atualizar via student_email (caso student_id seja null)
DROP POLICY IF EXISTS "Users can update subscriptions by email" ON public.subscriptions;
CREATE POLICY "Users can update subscriptions by email" ON public.subscriptions
  FOR UPDATE USING (
    auth.uid() = student_id OR
    student_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = student_id OR
    student_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 4. Política para INSERT (alunos podem criar assinaturas)
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (
    auth.uid() = student_id OR
    student_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 5. Atualizar o campo updated_at automaticamente ao fazer UPDATE
CREATE OR REPLACE FUNCTION public.handle_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_subscriptions_updated_at();

-- ============================================================
-- VERIFICAÇÃO: Execute para confirmar as colunas da tabela
-- ============================================================
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'subscriptions' AND table_schema = 'public'
-- ORDER BY ordinal_position;
