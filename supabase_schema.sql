-- =============================================
-- LEXY IDIOMAS - Schema Completo Supabase
-- =============================================

-- 1. Profiles (extended)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  phone TEXT,
  document_number TEXT,
  residence_country TEXT DEFAULT 'Brasil',
  study_language TEXT,
  language_level TEXT,
  study_motivation TEXT,
  avatar_url TEXT,
  hourly_rate NUMERIC DEFAULT 20,
  is_first_login BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable insert for authenticated users" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);

-- 2. Tutors (extended teacher data)
CREATE TABLE IF NOT EXISTS public.tutors (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  video_url TEXT,
  photo_url TEXT,
  subject TEXT,
  native_language TEXT,
  other_languages TEXT,
  specialties TEXT[],
  certifications TEXT,
  experience_years INT DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 20,
  country TEXT,
  country_code TEXT DEFAULT 'BR',
  flag TEXT DEFAULT '🇧🇷',
  timezone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_verified BOOLEAN DEFAULT false,
  is_super_tutor BOOLEAN DEFAULT false,
  weekly_schedule JSONB DEFAULT '{}'::jsonb,
  earned_balance NUMERIC DEFAULT 0,
  total_lessons INT DEFAULT 0,
  active_students INT DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  review_count INT DEFAULT 0,
  google_meet_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutors are publicly viewable" ON public.tutors FOR SELECT USING (true);
CREATE POLICY "Tutors can update own data" ON public.tutors FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Tutors can insert own data" ON public.tutors FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID REFERENCES public.tutors(id),
  student_id UUID REFERENCES public.profiles(id),
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('trial', 'package', 'subscription')),
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
  vocabulary_of_day TEXT[],
  teacher_feedback TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = student_id OR auth.uid() = tutor_id);
CREATE POLICY "Students can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Booking participants can update" ON public.bookings FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- 4. Payout Requests
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID REFERENCES public.tutors(id),
  tutor_name TEXT,
  amount NUMERIC NOT NULL,
  pix_key TEXT,
  bank_info TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutors can view own payouts" ON public.payout_requests FOR SELECT USING (auth.uid() = tutor_id);
CREATE POLICY "Tutors can create payouts" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = tutor_id);

-- 5. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target TEXT DEFAULT 'all' CHECK (target IN ('all', 'landing', 'students', 'teachers')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  level TEXT DEFAULT 'info' CHECK (level IN ('info', 'warning', 'success', 'promo')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements are publicly viewable" ON public.announcements FOR SELECT USING (true);

-- 6. Wallet Transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('pix', 'credit_card', 'bonus')),
  payment_status TEXT DEFAULT 'completed',
  mp_payment_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 7. Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id),
  receiver_id UUID REFERENCES public.profiles(id),
  booking_id UUID REFERENCES public.bookings(id),
  message TEXT NOT NULL,
  sender_name TEXT,
  sender_role TEXT,
  is_system BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat participants can view messages" ON public.chat_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 8. Subscriptions (28-day plans)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id),
  tutor_id UUID REFERENCES public.tutors(id),
  plan_hours INT NOT NULL,
  hours_remaining INT NOT NULL,
  cycle_start_date TIMESTAMPTZ NOT NULL,
  cycle_end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- 9. Admin Configuration
CREATE TABLE IF NOT EXISTS public.admin_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin config is publicly readable" ON public.admin_config FOR SELECT USING (true);

-- Seed default admin config
INSERT INTO public.admin_config (key, value) VALUES
  ('tier_rates', '{"trial": 75, "tier1": 75, "tier2": 80, "tier3": 85, "tier4": 90, "tier5": 92}'::jsonb),
  ('recommended_rate', '23'::jsonb),
  ('platform_fee', '25'::jsonb),
  ('whatsapp_support', '"5511999999999"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 10. Tutor Reviews
CREATE TABLE IF NOT EXISTS public.tutor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID REFERENCES public.tutors(id),
  student_id UUID REFERENCES public.profiles(id),
  booking_id UUID REFERENCES public.bookings(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tutor_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are publicly viewable" ON public.tutor_reviews FOR SELECT USING (true);
CREATE POLICY "Students can create reviews" ON public.tutor_reviews FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 11. Used Trials tracking
CREATE TABLE IF NOT EXISTS public.used_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id),
  tutor_id UUID REFERENCES public.tutors(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, tutor_id)
);

ALTER TABLE public.used_trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own trials" ON public.used_trials FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Users can insert trials" ON public.used_trials FOR INSERT WITH CHECK (auth.uid() = student_id);

-- FUNCTION: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE
      WHEN new.raw_user_meta_data->>'role' = 'teacher' THEN 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      ELSE 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 12. Tabla public.aulas (Aulas Experimentales e Agendamentos Realizados)
-- =============================================
CREATE TABLE IF NOT EXISTS public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_code TEXT UNIQUE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT,
  student_email TEXT,
  student_matricula TEXT,
  tutor_id UUID REFERENCES public.tutors(id) ON DELETE SET NULL,
  teacher_id UUID,
  tutor_name TEXT,
  teacher_name TEXT,
  tutor_email TEXT,
  teacher_email TEXT,
  subject TEXT DEFAULT 'Espanhol',
  day TEXT NOT NULL,
  day_name TEXT,
  time TEXT NOT NULL,
  time_slot TEXT,
  booking_type TEXT DEFAULT 'trial',
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aulas public view" ON public.aulas FOR SELECT USING (true);
CREATE POLICY "Aulas insert" ON public.aulas FOR INSERT WITH CHECK (true);
CREATE POLICY "Aulas update" ON public.aulas FOR UPDATE USING (true);

