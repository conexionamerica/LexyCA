-- Schema para Marketplace de Tutores 2.0 (Sitio Hermano)
-- Ejecutar este script en el SQL Editor de tu nuevo proyecto de Supabase.

-- Habilitar UUID si no está habilitado
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- TABLA: profiles (Perfiles de Usuario Unificados vinculados a Auth.Users)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')) DEFAULT 'student',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de perfiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Modificación de perfil propio" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- =========================================================================
-- TABLA: teachers (Perfiles de Profesores vinculados a Profiles)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    bio TEXT,
    video_url TEXT,
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
    commission_tier NUMERIC(5, 2) DEFAULT 0.20, -- Retención de la plataforma (ej. 0.20 = 20%)
    status TEXT NOT NULL CHECK (status IN ('pending_approval', 'active')) DEFAULT 'pending_approval',
    timezone TEXT DEFAULT 'UTC',
    avatar_url TEXT,
    meeting_link TEXT DEFAULT 'https://meet.google.com/tmi-xwmg-kua',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para teachers
CREATE POLICY "Lectura pública de profesores" ON public.teachers
    FOR SELECT USING (true);

CREATE POLICY "Modificación de perfiles de profesores" ON public.teachers
    FOR ALL USING (auth.uid() = id);

-- =========================================================================
-- TABLA: students (Billetera Virtual vinculada a Profiles)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (wallet_balance >= 0.00),
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    phone TEXT DEFAULT '+5511999999999',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de estudiantes" ON public.students
    FOR SELECT USING (true);

CREATE POLICY "Modificación de perfiles de estudiantes" ON public.students
    FOR ALL USING (auth.uid() = id);

-- =========================================================================
-- TABLA: payouts (Historial de Liquidaciones de Profesores)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_teacher UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0.00),
    payment_method TEXT DEFAULT 'PIX',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en payouts
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura y creación completa de liquidaciones" ON public.payouts
    FOR ALL USING (true);

-- =========================================================================
-- TABLA: bookings (Motor de Agendamiento)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_teacher UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    id_student UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    payout_id UUID REFERENCES public.payouts(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    credit_cost NUMERIC(10, 2) NOT NULL CHECK (credit_cost >= 0.00),
    meeting_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura y escritura completa de reservas" ON public.bookings
    FOR ALL USING (true);

-- =========================================================================
-- TABLA: wallet_transactions (Historial Transaccional)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_student UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('top-up', 'class-booking', 'class-refund')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura y escritura completa de transacciones" ON public.wallet_transactions
    FOR ALL USING (true);

-- =========================================================================
-- FUNCIONES Y TRIGGERS DE BASE DE DATOS
-- =========================================================================

-- Función para procesar la reserva y restar créditos
CREATE OR REPLACE FUNCTION public.book_class(
    p_student_id UUID,
    p_teacher_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_cost NUMERIC(10, 2)
) RETURNS UUID AS $$
DECLARE
    v_balance NUMERIC(10, 2);
    v_booking_id UUID;
    v_meet_link TEXT;
BEGIN
    SELECT meeting_link INTO v_meet_link FROM public.teachers WHERE id = p_teacher_id;
    SELECT wallet_balance INTO v_balance FROM public.students WHERE id = p_student_id FOR UPDATE;
    
    IF v_balance IS NULL THEN
        RAISE EXCEPTION 'Estudiante no encontrado.';
    END IF;

    IF v_balance < p_cost THEN
        RAISE EXCEPTION 'Saldo insuficiente en billetera virtual (R$ %, costo: R$ %).', v_balance, p_cost;
    END IF;

    UPDATE public.students 
    SET wallet_balance = wallet_balance - p_cost 
    WHERE id = p_student_id;

    INSERT INTO public.wallet_transactions (id_student, amount, type, description)
    VALUES (p_student_id, -p_cost, 'class-booking', 'Débito por clase agendada');

    INSERT INTO public.bookings (id_teacher, id_student, start_time, end_time, credit_cost, status, meeting_link)
    VALUES (p_teacher_id, p_student_id, p_start_time, p_end_time, p_cost, 'pending', v_meet_link)
    RETURNING id INTO v_booking_id;

    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para reembolsar saldo si la reserva se cancela
CREATE OR REPLACE FUNCTION public.cancel_booking(
    p_booking_id UUID
) RETURNS VOID AS $$
DECLARE
    v_student_id UUID;
    v_cost NUMERIC(10, 2);
    v_status TEXT;
BEGIN
    SELECT id_student, credit_cost, status INTO v_student_id, v_cost, v_status
    FROM public.bookings WHERE id = p_booking_id FOR UPDATE;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'Reserva no encontrada.';
    END IF;

    IF v_status = 'cancelled' THEN
        RAISE EXCEPTION 'La reserva ya se encuentra cancelada.';
    END IF;

    IF v_status = 'completed' THEN
        RAISE EXCEPTION 'No se puede cancelar una clase ya completada.';
    END IF;

    UPDATE public.bookings SET status = 'cancelled' WHERE id = p_booking_id;

    UPDATE public.students 
    SET wallet_balance = wallet_balance + v_cost 
    WHERE id = v_student_id;

    INSERT INTO public.wallet_transactions (id_student, amount, type, description)
    VALUES (v_student_id, v_cost, 'class-refund', 'Reembolso por clase cancelada');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
