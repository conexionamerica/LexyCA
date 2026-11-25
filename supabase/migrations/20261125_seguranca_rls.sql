-- =================================================================================================
-- LEXY IDIOMAS - Migração de segurança (RLS e proteção de perfis)  - 2026-11-25
-- =================================================================================================
-- O QUE CORRIGE:
--   1. Ninguém pode virar 'admin' sozinho (nem no cadastro, nem editando o próprio perfil).
--   2. Professores não podem se autoaprovar (coluna status) e alunos não podem alterar o
--      próprio saldo de aulas (wallet_balance).
--   3. CPF, telefone, endereço e email dos ALUNOS deixam de ser públicos.
--   4. Chats privados, aulas, solicitações de saque e aulas experimentais usadas passam a ser
--      visíveis apenas para os participantes e para o admin.
--   5. Sinalização WebRTC deixa de ser acessível a visitantes anônimos.
--   6. Recria as funções deduct_wallet_balance e request_tutor_payout (a versão anterior em
--      supabase_schema.sql tinha sintaxe inválida "$$$" e pode não existir no banco).
--
-- COMO APLICAR:
--   * Faça um backup antes (Supabase > Database > Backups).
--   * Cole este arquivo inteiro no SQL Editor do Supabase e execute. Ele roda em uma transação:
--     se algo falhar, nada é alterado.
--   * ANTES de publicar o frontend novo, crie a conta de admin (veja o final deste arquivo).
--
-- Esta migração REMOVE todas as políticas RLS existentes nas tabelas abaixo e recria um
-- conjunto conhecido, porque políticas são combinadas com OR: uma única política antiga
-- "USING (true)" esquecida deixaria tudo aberto de novo.
-- =================================================================================================

BEGIN;

-- -------------------------------------------------------------------------------------------------
-- 0. Funções auxiliares
-- -------------------------------------------------------------------------------------------------

-- Retorna true se o usuário autenticado tem role = 'admin' na tabela profiles.
-- SECURITY DEFINER: lê profiles sem passar pelo RLS (evita recursão nas políticas de profiles).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- Remove todas as políticas de uma tabela (para recriar um conjunto conhecido).
CREATE OR REPLACE FUNCTION pg_temp.drop_all_policies(target_table text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = target_table
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, target_table);
  END LOOP;
END;
$$;

-- -------------------------------------------------------------------------------------------------
-- 1. PROFILES
-- -------------------------------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS earned_balance NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_lessons INT DEFAULT 0;

-- 1a. Cadastro: o papel vem do metadata do usuário (controlado pelo próprio usuário),
--     então só aceitamos 'student' ou 'teacher'. Admin só é concedido manualmente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text := lower(coalesce(new.raw_user_meta_data->>'role', 'student'));
  safe_role text;
BEGIN
  safe_role := CASE WHEN requested_role IN ('teacher', 'professor', 'tutor') THEN 'teacher' ELSE 'student' END;

  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    safe_role,
    CASE
      WHEN safe_role = 'teacher' THEN 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      ELSE 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 1b. Colunas sensíveis: só admin, service_role/servidor ou funções SECURITY DEFINER
--     (ex.: deduct_wallet_balance) podem alterá-las.
--     IMPORTANTE: esta função NÃO é SECURITY DEFINER, para que current_user reflita quem chamou.
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  privileged boolean := current_user NOT IN ('anon', 'authenticated') OR public.is_admin();
BEGIN
  IF privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NULL OR NEW.role NOT IN ('student', 'teacher') THEN
      NEW.role := 'student';
    END IF;
    NEW.status := NULL;
    NEW.wallet_balance := 0;
    RETURN NEW;
  END IF;

  -- UPDATE por usuário comum: preservar os valores protegidos
  NEW.role := OLD.role;
  NEW.status := OLD.status;
  NEW.wallet_balance := OLD.wallet_balance;
  RETURN NEW;
END;
$$;

-- Substitui o trigger antigo (que usava a sintaxe inválida "$$$")
DROP TRIGGER IF EXISTS protect_profile_balances_trigger ON public.profiles;
DROP TRIGGER IF EXISTS protect_profile_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_fields_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- 1c. Políticas de profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
SELECT pg_temp.drop_all_policies('profiles');

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.is_admin());
-- Catálogo público de professores (alunos NÃO são mais públicos)
CREATE POLICY "profiles_select_teachers_public" ON public.profiles
  FOR SELECT USING (role IN ('teacher', 'professor'));

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Admin aprova/recusa professores (antes isso falhava silenciosamente por falta de política)
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- -------------------------------------------------------------------------------------------------
-- 2. DIRECT_MESSAGES (chat privado aluno <-> professor)
-- -------------------------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.direct_messages') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY';
    PERFORM pg_temp.drop_all_policies('direct_messages');
    EXECUTE $p$
      CREATE POLICY "dm_select_participants" ON public.direct_messages
        FOR SELECT USING (
          auth.uid()::text IN (student_id::text, tutor_id::text) OR public.is_admin()
        )
    $p$;
    EXECUTE $p$
      CREATE POLICY "dm_insert_participants" ON public.direct_messages
        FOR INSERT WITH CHECK (
          auth.uid()::text IN (student_id::text, tutor_id::text) OR public.is_admin()
        )
    $p$;
  END IF;
END $$;

-- -------------------------------------------------------------------------------------------------
-- 3. AULAS (agendamentos)
-- -------------------------------------------------------------------------------------------------
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS tutor_id UUID;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS tutor_email TEXT;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS teacher_email TEXT;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
SELECT pg_temp.drop_all_policies('aulas');

CREATE OR REPLACE FUNCTION public.is_aula_participant(a public.aulas)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    a.student_id::text = auth.uid()::text
    OR a.tutor_id::text = auth.uid()::text
    OR lower(coalesce(a.student_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '#'))
    OR lower(coalesce(a.tutor_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '#'))
    OR lower(coalesce(a.teacher_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '#'));
$$;

CREATE POLICY "aulas_select_participants" ON public.aulas
  FOR SELECT USING (public.is_aula_participant(aulas) OR public.is_admin());
CREATE POLICY "aulas_insert_participants" ON public.aulas
  FOR INSERT WITH CHECK (public.is_aula_participant(aulas) OR public.is_admin());
CREATE POLICY "aulas_update_participants" ON public.aulas
  FOR UPDATE USING (public.is_aula_participant(aulas) OR public.is_admin());
CREATE POLICY "aulas_delete_participants" ON public.aulas
  FOR DELETE USING (public.is_aula_participant(aulas) OR public.is_admin());

-- Agenda pública: SOMENTE professor + dia + horário + status, sem dados do aluno.
-- Usada pelo frontend para saber quais horários já estão ocupados.
-- (View sem security_invoker: roda com os privilégios do dono, por isso ignora o RLS de aulas
--  e expõe apenas as colunas listadas.)
DROP VIEW IF EXISTS public.agenda_ocupada;
CREATE VIEW public.agenda_ocupada AS
  SELECT id, tutor_id, tutor_email, teacher_email, day, day_name, time, time_slot, status, created_at
  FROM public.aulas;
REVOKE ALL ON public.agenda_ocupada FROM PUBLIC;
GRANT SELECT ON public.agenda_ocupada TO anon, authenticated;

-- -------------------------------------------------------------------------------------------------
-- 4. PAYOUT_REQUESTS (saques de professores)
-- -------------------------------------------------------------------------------------------------
-- supabase_schema.sql define esta tabla DUAS vezes; a primeira versão (a que é criada de fato)
-- não tem net_amount/method, então request_tutor_payout() sempre falhava e nenhum professor
-- conseguia solicitar saque. Além disso tutor_id apontava para public.tutors, mas os professores
-- se cadastram em public.profiles.
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS net_amount NUMERIC;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS method TEXT;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS pix_key TEXT;

DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
    WHERE con.conrelid = 'public.payout_requests'::regclass
      AND con.contype = 'f'
      AND att.attname = 'tutor_id'
  LOOP
    EXECUTE format('ALTER TABLE public.payout_requests DROP CONSTRAINT %I', fk.conname);
  END LOOP;
END $$;
-- NOT VALID: não verifica linhas antigas (que podem apontar para public.tutors)
ALTER TABLE public.payout_requests
  ADD CONSTRAINT payout_requests_tutor_id_profiles_fkey
  FOREIGN KEY (tutor_id) REFERENCES public.profiles(id) NOT VALID;

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
SELECT pg_temp.drop_all_policies('payout_requests');

CREATE POLICY "payouts_select_own_or_admin" ON public.payout_requests
  FOR SELECT USING (auth.uid() = tutor_id OR public.is_admin());
-- Inserção direta bloqueada para professores: o saque deve passar por request_tutor_payout(),
-- que valida e desconta o saldo. Apenas o admin pode inserir manualmente.
CREATE POLICY "payouts_insert_admin" ON public.payout_requests
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "payouts_update_admin" ON public.payout_requests
  FOR UPDATE USING (public.is_admin());

-- -------------------------------------------------------------------------------------------------
-- 5. USED_TRIALS (aulas experimentais já usadas)
-- -------------------------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.used_trials') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.used_trials ENABLE ROW LEVEL SECURITY';
    PERFORM pg_temp.drop_all_policies('used_trials');
    EXECUTE $p$
      CREATE POLICY "trials_select_own" ON public.used_trials
        FOR SELECT USING (student_id::text = auth.uid()::text OR public.is_admin())
    $p$;
    EXECUTE $p$
      CREATE POLICY "trials_insert_own" ON public.used_trials
        FOR INSERT WITH CHECK (student_id::text = auth.uid()::text)
    $p$;
  END IF;
END $$;

-- -------------------------------------------------------------------------------------------------
-- 6. WEBRTC_SIGNALS (sala de aula virtual)
--    Por enquanto: apenas usuários autenticados (antes qualquer visitante anônimo lia e apagava).
--    PENDENTE: restringir aos participantes da aula quando room_key for vinculado ao id da aula.
-- -------------------------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.webrtc_signals') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.webrtc_signals ENABLE ROW LEVEL SECURITY';
    PERFORM pg_temp.drop_all_policies('webrtc_signals');
    EXECUTE $p$ CREATE POLICY "webrtc_select_auth" ON public.webrtc_signals FOR SELECT TO authenticated USING (true) $p$;
    EXECUTE $p$ CREATE POLICY "webrtc_insert_auth" ON public.webrtc_signals FOR INSERT TO authenticated WITH CHECK (true) $p$;
    EXECUTE $p$ CREATE POLICY "webrtc_delete_auth" ON public.webrtc_signals FOR DELETE TO authenticated USING (true) $p$;
  END IF;
END $$;

-- -------------------------------------------------------------------------------------------------
-- 7. ADMIN_CONFIG: leitura pública (taxas/descontos exibidos no site), escrita só admin
-- -------------------------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.admin_config') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY';
    PERFORM pg_temp.drop_all_policies('admin_config');
    EXECUTE $p$ CREATE POLICY "admin_config_select_public" ON public.admin_config FOR SELECT USING (true) $p$;
    EXECUTE $p$ CREATE POLICY "admin_config_write_admin" ON public.admin_config FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;
END $$;

-- -------------------------------------------------------------------------------------------------
-- 8. Funções RPC de saldo (recriadas com sintaxe válida)
-- -------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(cost NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  IF cost IS NULL OR cost <= 0 THEN
    RAISE EXCEPTION 'Valor inválido';
  END IF;

  UPDATE public.profiles
  SET wallet_balance = wallet_balance - cost
  WHERE id = auth.uid() AND wallet_balance >= cost;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Saldo insuficiente ou usuário não encontrado';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_wallet_balance(NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deduct_wallet_balance(NUMERIC) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_tutor_payout(payout_amount NUMERIC, payout_method TEXT, target_pix_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_earned NUMERIC;
  net_value NUMERIC;
  platform_fee_percent NUMERIC := 25; -- Comissão da plataforma: 25% (professor recebe 75%)
  new_req_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- FOR UPDATE: evita dois saques simultâneos usando o mesmo saldo
  SELECT earned_balance INTO current_earned FROM public.profiles WHERE id = auth.uid() FOR UPDATE;

  IF current_earned IS NULL OR payout_amount IS NULL OR payout_amount > current_earned OR payout_amount < 10 THEN
    RAISE EXCEPTION 'Saldo inválido ou insuficiente para o resgate solicitado';
  END IF;

  net_value := ROUND(payout_amount * ((100 - platform_fee_percent) / 100.0), 2);

  UPDATE public.profiles
  SET earned_balance = earned_balance - payout_amount
  WHERE id = auth.uid();

  INSERT INTO public.payout_requests (tutor_id, amount, net_amount, method, pix_key, status)
  VALUES (auth.uid(), payout_amount, net_value, payout_method, target_pix_key, 'pending')
  RETURNING id INTO new_req_id;

  RETURN jsonb_build_object('id', new_req_id, 'amount', payout_amount, 'net_amount', net_value, 'status', 'pending');
END;
$$;

REVOKE ALL ON FUNCTION public.request_tutor_payout(NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_tutor_payout(NUMERIC, TEXT, TEXT) TO authenticated;

-- -------------------------------------------------------------------------------------------------
-- 9. ASAAS_PAYMENTS: registro dos eventos do webhook do Asaas (somente o servidor acessa)
-- -------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.asaas_payments (
  id TEXT PRIMARY KEY,                 -- id da cobrança no Asaas (pay_...)
  last_event TEXT,
  status TEXT,
  value NUMERIC,
  net_value NUMERIC,
  billing_type TEXT,
  customer_id TEXT,
  subscription_id TEXT,
  external_reference TEXT,
  invoice_requested_at TIMESTAMPTZ,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.asaas_payments ENABLE ROW LEVEL SECURITY;
SELECT pg_temp.drop_all_policies('asaas_payments');
-- Sem políticas para anon/authenticated: só a service role (servidor) lê e grava.
-- O admin pode consultar pelo painel do Supabase.
CREATE POLICY "asaas_payments_select_admin" ON public.asaas_payments
  FOR SELECT USING (public.is_admin());

-- -------------------------------------------------------------------------------------------------
-- 10. SUBSCRIPTIONS: tutor_id apontava para public.tutors (professores ficam em profiles),
--     o que fazia o insert da assinatura falhar. Também garante a coluna do id do Asaas.
-- -------------------------------------------------------------------------------------------------
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;

DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
    WHERE con.conrelid = 'public.subscriptions'::regclass
      AND con.contype = 'f'
      AND att.attname = 'tutor_id'
  LOOP
    EXECUTE format('ALTER TABLE public.subscriptions DROP CONSTRAINT %I', fk.conname);
  END LOOP;
END $$;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_tutor_id_profiles_fkey
  FOREIGN KEY (tutor_id) REFERENCES public.profiles(id) NOT VALID;

COMMIT;

-- =================================================================================================
-- CONTA DE ADMIN (executar uma vez, DEPOIS da migração e ANTES de publicar o frontend novo)
-- =================================================================================================
-- 1. No Supabase: Authentication > Users > "Add user" > crie o usuário com o email do admin e
--    uma senha NOVA e forte (a senha antiga vazou no código e não deve ser reutilizada).
-- 2. Execute (trocando o email):
--
--    UPDATE public.profiles SET role = 'admin' WHERE email = 'EMAIL_DO_ADMIN';
--
-- 3. Verifique quem tem acesso de admin hoje e rebaixe quem não deveria ter:
--
--    SELECT id, email, role, created_at FROM public.profiles WHERE role = 'admin';
--    -- UPDATE public.profiles SET role = 'student' WHERE id = '...';
-- =================================================================================================
