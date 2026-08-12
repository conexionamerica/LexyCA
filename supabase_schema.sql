-- ── ESQUEMA DE SEGURIDAD Y TABLAS DE SUPABASE PARA LEXY ──
-- Ejecuta este script en el Editor SQL de tu proyecto en Supabase (https://app.supabase.com)

-- 1. Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  document_number TEXT,
  residence_country TEXT,
  hourly_rate NUMERIC(10, 2) DEFAULT 20.00,
  avatar_url TEXT,
  pix_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Seguridad por Fila (RLS) en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad RLS para profiles
CREATE POLICY "Permitir lectura de perfiles autenticados" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Permitir actualización de perfil propio" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Permitir inserción de perfil propio" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Crear tabla de clases reservadas (bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'no_show', 'cancelled')),
  amount NUMERIC(10, 2) NOT NULL,
  teacher_payout NUMERIC(10, 2) NOT NULL,
  is_trial BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir ver clases a involucrados" ON public.bookings
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() = teacher_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- 4. Trigger automático para sincronizar auth.users con public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, document_number, residence_country, hourly_rate, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'documentNumber', ''),
    COALESCE(new.raw_user_meta_data->>'residenceCountry', 'Brasil 🇧🇷'),
    COALESCE((new.raw_user_meta_data->>'hourlyRate')::numeric, 20.00),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger tras crear usuario en Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
