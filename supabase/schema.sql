-- Schema para Marketplace de Tutores 2.0 (Sitio Hermano)
-- Ejecutar este script en el SQL Editor de tu nuevo proyecto de Supabase.

-- Habilitar UUID si no está habilitado
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- TABLA: teachers (Perfiles de Profesores)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    bio TEXT,
    video_url TEXT,
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
    commission_tier NUMERIC(5, 2) DEFAULT 0.20, -- Retención de la plataforma (ej. 0.20 = 20%)
    timezone TEXT DEFAULT 'UTC',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar seguridad a nivel de fila (RLS) en teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para teachers
CREATE POLICY "Permitir lectura pública de perfiles de profesores" ON public.teachers
    FOR SELECT USING (true);

CREATE POLICY "Permitir a profesores actualizar su propio perfil" ON public.teachers
    FOR UPDATE USING (auth.uid() = id);

-- =========================================================================
-- TABLA: students (Billetera Virtual y Datos del Alumno)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (wallet_balance >= 0.00),
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para students
CREATE POLICY "Permitir a estudiantes ver su propio perfil" ON public.students
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Permitir a estudiantes actualizar su propio perfil" ON public.students
    FOR UPDATE USING (auth.uid() = id);

-- =========================================================================
-- TABLA: bookings (Motor de Agendamiento)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_teacher UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    id_student UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    credit_cost NUMERIC(10, 2) NOT NULL CHECK (credit_cost >= 0.00),
    meeting_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para bookings
CREATE POLICY "Ver sus propias reservas (estudiantes)" ON public.bookings
    FOR SELECT USING (auth.uid() = id_student);

CREATE POLICY "Ver sus propias reservas (profesores)" ON public.bookings
    FOR SELECT USING (auth.uid() = id_teacher);

CREATE POLICY "Crear reservas (estudiantes)" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = id_student);

CREATE POLICY "Actualizar reservas propias (estudiantes y profesores)" ON public.bookings
    FOR UPDATE USING (auth.uid() = id_student OR auth.uid() = id_teacher);

-- =========================================================================
-- TABLA: wallet_transactions (Historial Transaccional)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_student UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL, -- Positivo para recargas, negativo para débitos de clases
    type TEXT NOT NULL CHECK (type IN ('top-up', 'class-booking', 'class-refund')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver transacciones propias (estudiantes)" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = id_student);

-- =========================================================================
-- FUNCIONES Y TRIGGERS DE BASE DE DATOS (Transacciones automáticas)
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
BEGIN
    -- Obtener saldo del alumno
    SELECT wallet_balance INTO v_balance FROM public.students WHERE id = p_student_id FOR UPDATE;
    
    IF v_balance IS NULL THEN
        RAISE EXCEPTION 'Estudiante no encontrado.';
    END IF;

    -- Validar saldo suficiente
    IF v_balance < p_cost THEN
        RAISE EXCEPTION 'Saldo insuficiente en billetera virtual (R$ %, costo: R$ %).', v_balance, p_cost;
    END IF;

    -- Descontar créditos de la billetera
    UPDATE public.students 
    SET wallet_balance = wallet_balance - p_cost 
    WHERE id = p_student_id;

    -- Registrar la transacción
    INSERT INTO public.wallet_transactions (id_student, amount, type, description)
    VALUES (p_student_id, -p_cost, 'class-booking', 'Débito por clase agendada');

    -- Crear la reserva
    INSERT INTO public.bookings (id_teacher, id_student, start_time, end_time, credit_cost, status)
    VALUES (p_teacher_id, p_student_id, p_start_time, p_end_time, p_cost, 'pending')
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
    -- Obtener detalles de la reserva
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

    -- Actualizar estado a cancelado
    UPDATE public.bookings SET status = 'cancelled' WHERE id = p_booking_id;

    -- Devolver créditos a la billetera
    UPDATE public.students 
    SET wallet_balance = wallet_balance + v_cost 
    WHERE id = v_student_id;

    -- Registrar transacción de reembolso
    INSERT INTO public.wallet_transactions (id_student, amount, type, description)
    VALUES (v_student_id, v_cost, 'class-refund', 'Reembolso por clase cancelada');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
