-- =================================================================================================
-- LEXY IDIOMAS - Esquema base (projeto Supabase novo)                              2026-11-24
-- =================================================================================================
-- Cria todas as tabelas, colunas e índices que o frontend e as funções /api usam.
-- Inventário feito a partir do código (inserts, updates, filtros e ordenações).
--
-- É idempotente (IF NOT EXISTS): pode rodar em um banco vazio ou em um banco que já tenha
-- parte das tabelas. As políticas de segurança (RLS), funções e triggers ficam na migração
-- seguinte: 20261125000000_seguranca_rls.sql. Rode as duas, nesta ordem.
--
-- Substitui os arquivos antigos supabase_schema.sql, supabase/schema.sql e
-- supabase_migration_*.sql, que se contradiziam e tinham erros de sintaxe.
-- =================================================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------------------------------------------------
-- PROFILES: um registro por usuário do Supabase Auth (alunos, professores e admin)
-- -------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'student',
  status TEXT,                                -- aprovação de professores: NULL | 'approved' | 'rejected'
  phone TEXT,
  document_number TEXT,
  cpf TEXT,
  residence_country TEXT DEFAULT 'Brasil',
  postal_code TEXT,
  address TEXT,
  address_number TEXT,
  complement TEXT,
  province TEXT,
  city TEXT,
  state TEXT,
  -- aluno
  study_language TEXT,
  language_level TEXT,
  study_motivation TEXT,
  matricula_code TEXT,
  wallet_balance NUMERIC NOT NULL DEFAULT 0,  -- créditos de aulas (protegido por trigger)
  wallet_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- professor
  subject_taught TEXT,
  headline TEXT,
  bio TEXT,
  video_url TEXT,
  languages_spoken JSONB,
  specialties JSONB,
  weekly_schedule JSONB,
  hourly_rate NUMERIC DEFAULT 20,
  earned_balance NUMERIC NOT NULL DEFAULT 0,
  total_lessons INT NOT NULL DEFAULT 0,
  -- geral
  avatar_url TEXT,
  is_first_login BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Colunas que podem faltar em bancos criados pelos scripts antigos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS complement TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS matricula_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_history JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subject_taught TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages_spoken JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialties JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_schedule JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS earned_balance NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_lessons INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- -------------------------------------------------------------------------------------------------
-- TUTORS: dados complementares do professor (o catálogo lê de profiles; mantida por compatibilidade)
-- -------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tutors (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  hourly_rate NUMERIC,
  headline TEXT,
  bio TEXT,
  video_url TEXT,
  subject TEXT,
  country TEXT,
  timezone TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------------------------------------------------
-- AULAS: cada aula agendada (experimental, pacote ou assinatura)
--   Ids como TEXT: o frontend às vezes filtra por ids locais (não-UUID), o que com UUID
--   derrubava a consulta inteira.
-- -------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aulas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lesson_code TEXT,
  student_id TEXT,
  tutor_id TEXT,
  student_name TEXT,
  student_email TEXT,
  student_matricula TEXT,
  tutor_name TEXT,
  teacher_name TEXT,
  tutor_email TEXT,
  teacher_email TEXT,
  subject TEXT DEFAULT 'Espanhol',
  day TEXT,
  day_name TEXT,
  date TEXT,
  time TEXT,
  time_slot TEXT,
  booking_type TEXT DEFAULT 'trial',
  amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC,
  status TEXT DEFAULT 'confirmed',
  feedback TEXT,
  teacher_notes TEXT,
  student_presence BOOLEAN DEFAULT false,
  student_joined_at TIMESTAMPTZ,
  teacher_presence BOOLEAN DEFAULT false,
  teacher_joined_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS paid_amount NUMERIC;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS teacher_notes TEXT;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS student_presence BOOLEAN DEFAULT false;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS student_joined_at TIMESTAMPTZ;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS teacher_presence BOOLEAN DEFAULT false;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS teacher_joined_at TIMESTAMPTZ;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS aulas_student_id_idx ON public.aulas (student_id);
CREATE INDEX IF NOT EXISTS aulas_tutor_id_idx ON public.aulas (tutor_id);
CREATE INDEX IF NOT EXISTS aulas_lesson_code_idx ON public.aulas (lesson_code);
CREATE INDEX IF NOT EXISTS aulas_created_at_idx ON public.aulas (created_at DESC);

-- -------------------------------------------------------------------------------------------------
-- SUBSCRIPTIONS: planos mensais (30 dias)
-- -------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_email TEXT,
  student_name TEXT,
  student_matricula TEXT,
  tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tutor_name TEXT,
  tutor_avatar TEXT,
  tutor_subject TEXT,
  plan_name TEXT,
  plan_hours INT NOT NULL DEFAULT 8,
  hours_remaining INT NOT NULL DEFAULT 8,
  monthly_price NUMERIC DEFAULT 0,
  cycle_start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  cycle_end_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  next_billing_date TIMESTAMPTZ,
  paused_until TIMESTAMPTZ,
  cancel_reason TEXT,
  asaas_subscription_id TEXT,
  payment_method TEXT DEFAULT 'pix',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'canceled', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS student_matricula TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS tutor_name TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS tutor_avatar TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS tutor_subject TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS monthly_price NUMERIC DEFAULT 0;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS paused_until TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pix';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS subscriptions_student_id_idx ON public.subscriptions (student_id);
CREATE INDEX IF NOT EXISTS subscriptions_asaas_id_idx ON public.subscriptions (asaas_subscription_id);

-- -------------------------------------------------------------------------------------------------
-- DIRECT_MESSAGES: chat aluno <-> professor (e mensagens do sistema)
-- -------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  tutor_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'teacher', 'admin')),
  sender_name TEXT,
  text TEXT NOT NULL,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS direct_messages_student_idx ON public.direct_messages (student_id);
CREATE INDEX IF NOT EXISTS direct_messages_tutor_idx ON public.direct_messages (tutor_id);

-- -------------------------------------------------------------------------------------------------
-- USED_TRIALS: aulas experimentais já usadas por aluno/professor
-- -------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.used_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  tutor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, tutor_id)
);

-- -------------------------------------------------------------------------------------------------
-- TEACHER_AVAILABILITY: horários liberados/bloqueados pelo professor
-- -------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'blocked',
  obs TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (teacher_id, date, time)   -- usado pelo upsert(onConflict: 'teacher_id,date,time')
);

-- -------------------------------------------------------------------------------------------------
-- REVIEWS: avaliações dos professores feitas pelos alunos
-- -------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT,
  tutor_id TEXT,
  tutor_name TEXT,
  student_id TEXT,
  student_name TEXT,
  student_email TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_tutor_idx ON public.reviews (tutor_id);

-- -------------------------------------------------------------------------------------------------
-- PAYOUT_REQUESTS: saques solicitados pelos professores
-- -------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID,
  tutor_name TEXT,
  amount NUMERIC NOT NULL,
  net_amount NUMERIC,
  method TEXT,
  pix_key TEXT,
  bank_info TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- -------------------------------------------------------------------------------------------------
-- WEBRTC_SIGNALS: sinalização da sala de aula virtual
-- -------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webrtc_signals (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  room_key TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  sender_name TEXT,
  signal_type TEXT NOT NULL,
  payload TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS webrtc_signals_room_idx ON public.webrtc_signals (room_key, created_at);

-- -------------------------------------------------------------------------------------------------
-- RLS ligado em todas as tabelas (as políticas ficam na migração de segurança).
-- Sem políticas, nada é acessível pelo navegador: é o padrão seguro.
-- -------------------------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.used_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webrtc_signals ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------------------------------
-- Realtime: o app escuta mudanças em aulas e direct_messages
-- -------------------------------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY['aulas', 'direct_messages'] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;
