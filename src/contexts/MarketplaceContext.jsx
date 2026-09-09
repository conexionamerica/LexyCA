import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { mockTutors as initialMockTutors } from '../data/mockTutors';

const MarketplaceContext = createContext(undefined);

const LOCAL_STORAGE_KEY_TUTORS = 'lexy_market_tutors_v2';
const LOCAL_STORAGE_KEY_BOOKINGS = 'lexy_market_bookings_v2';
const LOCAL_STORAGE_KEY_STUDENT = 'lexy_market_student_v2';

const LOCAL_STORAGE_KEY_SUBSCRIPTIONS = 'lexy_market_subscriptions_v2';
const LOCAL_STORAGE_KEY_FEE = 'lexy_market_platform_fee_v2';
const LOCAL_STORAGE_KEY_ANNOUNCEMENTS = 'lexy_market_announcements_v2';

const LOCAL_STORAGE_KEY_TIER_RATES = 'lexy_market_tier_rates_v2';
const LOCAL_STORAGE_KEY_PACKAGE_DISCOUNTS = 'lexy_market_package_discounts_v2';

export const DEFAULT_PACKAGE_DISCOUNTS = {
  global: {
    'pkg-trial': 50, // 50% de Desconto por padrão no agendamento da 1ª Aula Experimental
    'pkg-4h': 0,
    'pkg-8h': 0,
    'pkg-12h': 0,
    'pkg-16h': 0
  },
  byTutor: {}
};

export const getTutorPackageDiscount = (packageDiscounts, tutorId, pkgId) => {
  if (!packageDiscounts) return pkgId === 'pkg-trial' ? 50 : 0;
  
  // 1. Ver se existe desconto específico para este tutor
  if (tutorId && packageDiscounts.byTutor && packageDiscounts.byTutor[tutorId]) {
    const tutorDisc = packageDiscounts.byTutor[tutorId][pkgId];
    if (tutorDisc !== undefined && tutorDisc !== null) {
      return Number(tutorDisc);
    }
  }

  // 2. Ver se existe no nível global
  if (packageDiscounts.global && packageDiscounts.global[pkgId] !== undefined) {
    return Number(packageDiscounts.global[pkgId] || 0);
  }

  // 3. Suporte a formato plano de objeto anterior
  if (packageDiscounts[pkgId] !== undefined) {
    return Number(packageDiscounts[pkgId] || 0);
  }

  return pkgId === 'pkg-trial' ? 50 : 0;
};

export const DEFAULT_TIER_RATES = {
  trial: 10, // Aula Experimental: 10% Ganho do Professor (90% Retenção Lexy)
  tier1: 75, // 0 a 7 Aulas: 75% Ganho
  tier2: 80, // 8 a 15 Aulas: 80% Ganho
  tier3: 85, // 16 a 20 Aulas: 85% Ganho
  tier4: 90, // 21 a 50 Aulas: 90% Ganho
  tier5: 92  // > 50 Aulas: 92% Ganho
};

// HELPER: GENERAR CÓDIGO ÚNICO DE AULA (FORMATO AULA-2026-XXXXXX)
export const generateLessonCode = (id = '', isTrial = false) => {
  const prefix = isTrial ? 'EXP' : 'AULA';
  if (!id) return `${prefix}-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const positiveNum = Math.abs(hash) % 900000 + 100000;
  return `${prefix}-2026-${positiveNum}`;
};

// HELPER: OBTENER EL PORCENTAJE QUE EL PROFESOR GANA (MOSTRAR SÓLO GANHO DO PROFESSOR)
export const getTeacherEarnPercent = (totalLessons, isTrial = false, customTierRates = DEFAULT_TIER_RATES) => {
  const rates = customTierRates || DEFAULT_TIER_RATES;
  if (isTrial) return rates.trial || 75;
  const lessons = totalLessons || 0;
  if (lessons > 50) return rates.tier5 || 92;
  if (lessons > 20) return rates.tier4 || 90;
  if (lessons >= 16) return rates.tier3 || 85;
  if (lessons >= 8) return rates.tier2 || 80;
  return rates.tier1 || 75;
};

export const MarketplaceProvider = ({ children }) => {
  // Configuração Global de Porcentagens de Repasse ao Professor (Editável no Admin)
  const [tierRates, setTierRatesState] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TIER_RATES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error cargando tierRates', e);
      }
    }
    return DEFAULT_TIER_RATES;
  });

  const updateTierRates = (newRates) => {
    setTierRatesState(newRates);
    localStorage.setItem(LOCAL_STORAGE_KEY_TIER_RATES, JSON.stringify(newRates));
  };

  // Descontos Promocionais de Pacotes (Configuráveis pelo Administrador)
  const [packageDiscounts, setPackageDiscountsState] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PACKAGE_DISCOUNTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error cargando descuentos de paquetes', e);
      }
    }
    return DEFAULT_PACKAGE_DISCOUNTS;
  });

  const updatePackageDiscounts = (newDiscounts) => {
    setPackageDiscountsState(newDiscounts);
    localStorage.setItem(LOCAL_STORAGE_KEY_PACKAGE_DISCOUNTS, JSON.stringify(newDiscounts));
  };

  // Taxa de Comissão Padrão da Plataforma
  const [platformFeePercent, setPlatformFeePercentState] = useState(25);

  const setPlatformFeePercent = (newFee) => {
    setPlatformFeePercentState(Number(newFee));
  };

  // Comunicados & Anúncios Globais
  const [announcements, setAnnouncements] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ANNOUNCEMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error cargando anuncios', e);
      }
    }
    return [
      {
        id: 'ann-1',
        target: 'students',
        title: '🎉 Bem-vindo à Plataforma Lexy PRO!',
        content: 'Aproveite nossa garantia de satisfação nas aulas experimentais e faça seu agendamento direto com os professores nativos.',
        level: 'info',
        createdAt: new Date().toLocaleDateString()
      },
      {
        id: 'ann-teacher-1',
        target: 'teachers',
        title: '🚀 Visibilidade e Novos Alunos!',
        content: 'Após a aprovação do seu perfil pela coordenação, ele será exibido para centenas de alunos interessados em agendar aulas com você.',
        level: 'info',
        createdAt: new Date().toLocaleDateString()
      }
    ];
  });

  const addAnnouncement = ({ target, title, content, level }) => {
    const newAnn = {
      id: `ann-${Date.now()}`,
      target: target || 'all',
      title,
      content,
      level: level || 'info',
      createdAt: new Date().toLocaleDateString()
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    return newAnn;
  };

  const deleteAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

const isFakeMockTutor = (t) => {
  if (!t) return true;
  const fakeIds = ['tutor-1', 'tutor-2', 'tutor-3', 'tutor-4', 'tutor-5', 'tutor-6'];
  const fakeNames = ['María Fernández', 'David Miller', 'Sarah Jenkins', 'Carlos Rodríguez', 'Lucía Fernández', 'Alex Rivera'];
  return fakeIds.includes(t.id) || fakeNames.includes(t.name);
};

  // Chat Direto por Aluno Selecionado
  const [directChatMessages, setDirectChatMessages] = useState([]);

  const sendDirectMessage = async (payload, roleFallback, studentIdFallback, nameFallback) => {
    let studentId = 'stud-1';
    let tutorId = 'tutor-1';
    let senderName = 'Aluno';
    let senderRole = 'student';
    let text = '';

    if (payload && typeof payload === 'object') {
      studentId = payload.studentId || studentIdFallback || 'stud-1';
      tutorId = payload.tutorId || 'tutor-1';
      senderRole = payload.senderRole || roleFallback || 'student';
      senderName = payload.senderName || nameFallback || (senderRole === 'teacher' ? 'Tutor' : 'Aluno');
      text = payload.text || payload.content || '';
    } else if (typeof payload === 'string') {
      text = payload;
      senderRole = roleFallback || 'student';
      senderName = nameFallback || (senderRole === 'teacher' ? 'Tutor' : 'Aluno');
      studentId = studentIdFallback || 'stud-1';
    }

    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Optimistic UI update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      studentId,
      tutorId,
      senderName,
      senderRole,
      sender: senderRole,
      text,
      timestamp: timestampStr
    };
    setDirectChatMessages(prev => [...prev, tempMsg]);

    // Send to Supabase
    try {
      const { error } = await supabase.from('direct_messages').insert({
        student_id: studentId,
        tutor_id: tutorId,
        sender_role: senderRole,
        sender_name: senderName,
        text,
        timestamp: timestampStr
      });
      if (error) {
        console.error('Error sending message:', error);
      }
    } catch (err) {
      console.error(err);
    }
    
    return tempMsg;
  };

  // Tutores (Cadastros reais de professores)
  const [tutors, setTutors] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TUTORS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(t => !isFakeMockTutor(t));
        }
      } catch (e) {
        console.error('Error cargando tutores de localStorage', e);
      }
    }
    return [];
  });

  // Sincronizar tutores cadastrados via Supabase Auth / Profiles (Stale-While-Revalidate)
  useEffect(() => {
    let active = true;
    async function syncTeachersFromSupabase() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or('role.eq.teacher,role.eq.professor');

        if (!error && data && active) {
          const fetchedTutors = data.map(dbT => {
            const savedEarned = localStorage.getItem(`lexy_earned_balance_${dbT.id}`) || localStorage.getItem(`lexy_earned_balance_${dbT.email}`);
            const savedLessons = localStorage.getItem(`lexy_total_lessons_${dbT.id}`) || localStorage.getItem(`lexy_total_lessons_${dbT.email}`);

            const earnedVal = Number(dbT.earned_balance || dbT.wallet_balance || dbT.earnedBalance || savedEarned || 0);
            const lessonsVal = Number(dbT.total_lessons || dbT.totalLessons || savedLessons || 0);

            return {
              id: dbT.id,
              name: dbT.full_name || dbT.name || dbT.email?.split('@')[0] || 'Professor',
              email: dbT.email,
              phone: dbT.phone || dbT.document_number || '',
              title: dbT.headline || 'Professor(a) Nativo(a) de Idiomas',
              country: dbT.residence_country || 'Brasil',
              countryCode: 'BR',
              flag: '🌐',
              avatar: dbT.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
              nativeSpeaker: true,
              isSuperTutor: false,
              isVerified: dbT.status === 'approved' || !dbT.status,
              status: dbT.status || 'approved',
              subject: dbT.subject_taught || dbT.study_language || 'Idiomas',
              hourlyRate: Number(dbT.hourly_rate || 20),
              trialRate: Number(dbT.hourly_rate || 20) * 0.5,
              rating: 5.0,
              reviewCount: 0,
              totalLessons: lessonsVal,
              total_lessons: lessonsVal,
              activeStudents: 0,
              responseTime: 'Responde em <1 hora',
              videoUrl: dbT.video_url || '',
              headline: dbT.headline || '',
              bio: dbT.bio || '',
              specialties: dbT.specialties || ['Conversação'],
              languagesSpoken: dbT.languages_spoken || [{ language: dbT.subject_taught || 'Espanhol', level: 'Nativo' }],
              weeklySchedule: dbT.weekly_schedule || {},
              earnedBalance: earnedVal,
              earned_balance: earnedVal,
              walletBalance: earnedVal,
              wallet_balance: earnedVal,
              reviews: dbT.reviews || []
            };
          }).filter(t => !isFakeMockTutor(t));

          setTutors(fetchedTutors);
          localStorage.setItem(LOCAL_STORAGE_KEY_TUTORS, JSON.stringify(fetchedTutors));
        } else if (!error && data && data.length === 0 && active) {
          setTutors([]);
          localStorage.setItem(LOCAL_STORAGE_KEY_TUTORS, JSON.stringify([]));
        }
      } catch (err) {
        console.warn('Error synchronizing teachers from Supabase:', err);
      }
    }

    syncTeachersFromSupabase();

    return () => {
      active = false;
    };
  }, []);

  // Alumno
  const [student, setStudent] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_STUDENT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error cargando alumno', e);
      }
    }
    return {
      id: 'student-user',
      name: 'Aluno Lexy',
      email: 'aluno@lexy.com',
      walletBalance: 0
    };
  });

  // Trials
  const [usedTrials, setUsedTrials] = useState([]);



  // Suscripciones
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    async function fetchSubscriptions() {
      // 🔒 AISLAMIENTO: Solo descargar las suscripciones del usuario autenticado
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const userId = currentSession?.user?.id;
      let query = supabase.from('subscriptions').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('student_id', userId);
      }
      const { data, error } = await query;
      if (!error && data) {
        setSubscriptions(data);
      }
    }
    fetchSubscriptions();
  }, []);

  const isFakeBooking = (b) => {
    if (!b || !b.id) return true;
    const fakeIds = ['booking-demo-01', 'booking-pending-01', 'booking-sub-w'];
    const fakeNames = ['Gabriel Alumno', 'Luciana Martins', 'Roberto Silva', 'Luky Snaider', 'Luky'];
    const fakeEmails = ['gabriel@test.com', 'luciana@test.com', 'roberto@test.com', 'luky@test.com'];
    if (fakeIds.some(fid => String(b.id).includes(fid))) return true;
    if (fakeNames.includes(String(b.studentName || b.name || ''))) return true;
    if (fakeEmails.includes(String(b.studentEmail || b.email || b.studentId || '').toLowerCase())) return true;
    return false;
  };

  const getTutorFreeSlotsList = (tutorObj) => {
    const schedule = tutorObj?.weeklySchedule || tutorObj?.availability || {};
    const slots = [];
    Object.keys(schedule).forEach(day => {
      const times = schedule[day];
      if (Array.isArray(times) && times.length > 0) {
        times.forEach(time => {
          slots.push({ day, time });
        });
      }
    });
    if (slots.length > 0) return slots;
    return [
      { day: 'Segunda-feira', time: '10:00' },
      { day: 'Quarta-feira', time: '16:00' }
    ];
  };

  const getDefaultCycleBookings = (tutorObj, planHoursVal = 8) => {
    const tutor = tutorObj || (tutors && tutors.length > 0 ? tutors[0] : null);
    if (!tutor) return [];

    const planHours = Number(planHoursVal) || 8;
    const baseSlots = getTutorFreeSlotsList(tutor);

    const generated = [];
    const numSlots = baseSlots.length;
    const numWeeks = Math.ceil(planHours / numSlots);
    let count = 0;

    for (let week = 1; week <= numWeeks; week++) {
      for (let sIdx = 0; sIdx < numSlots; sIdx++) {
        if (count >= planHours) break;
        count++;
        const s = baseSlots[sIdx];
        const bId = `booking-sub-w${week}-s${sIdx}-${count}`;
        const lCode = generateLessonCode(bId);

        generated.push({
          id: bId,
          lesson_code: lCode,
          tutorId: tutor.id,
          tutorName: tutor.name,
          tutorAvatar: tutor.avatar,
          tutorSubject: tutor.subject || 'Idioma',
          studentId: student?.id || 'student-user',
          day: s.day,
          time: s.time,
          bookingType: 'subscription',
          amount: tutor.hourlyRate || 20,
          status: 'confirmed',
          createdAt: new Date().toISOString()
        });
      }
    }
    return generated;
  };

  // Bookings (Agenda de Aulas Nativa Real em Supabase)
  const [bookings, setBookings] = useState([]);

  // Sincronizar reservas e agendamentos reais exclusivamente via Supabase (Tabela public.aulas)
  useEffect(() => {
    let active = true;
    async function syncBookingsFromSupabase() {
      try {
        let localBookings = [];
        try {
          // 🔒 AISLAMIENTO: Cargar solo bookings locales del usuario actual
          const { data: { session: lsSession } } = await supabase.auth.getSession();
          const lsUserId = lsSession?.user?.id || 'anon';
          const userBookingsKey = `${LOCAL_STORAGE_KEY_BOOKINGS}_${lsUserId}`;
          const saved = localStorage.getItem(userBookingsKey);
          if (saved) localBookings = JSON.parse(saved);
        } catch (e) {}

        // 🔒 Cargar todas as aulas registradas no Supabase (tabela public.aulas)
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const userEmail = (currentSession?.user?.email || '').toLowerCase().trim();
        const userId = (currentSession?.user?.id || '').toLowerCase().trim();
        
        const { data, error } = await supabase.from('aulas').select('*').order('created_at', { ascending: false });

        if (!error && data && active) {
          const filteredData = data.filter(dbApt => {
            const dayStr = String(dbApt.day_name || dbApt.day || '');
            if (dayStr.includes('Semana 2') || dayStr.includes('Semana 3') || dayStr.includes('Semana 4') || dayStr.includes('Semana 5')) {
              if (dbApt.id) {
                supabase.from('aulas').delete().eq('id', dbApt.id).then(() => {}).catch(e => console.warn(e));
              }
              return false;
            }
            return true;
          });

          const fetchedBookings = filteredData.map(dbApt => ({
            id: dbApt.id,
            lesson_code: dbApt.lesson_code || generateLessonCode(dbApt.id),
            tutorId: dbApt.tutor_id || dbApt.teacher_id,
            tutorName: dbApt.tutor_name || dbApt.teacher_name || 'Professor',
            tutorEmail: dbApt.tutor_email || dbApt.teacher_email || '',
            tutorAvatar: dbApt.teacher_avatar || dbApt.avatar_url || '',
            tutorSubject: dbApt.subject || 'Espanhol',
            studentId: dbApt.student_id || dbApt.user_id,
            studentEmail: dbApt.student_email || dbApt.email || '',
            studentName: dbApt.student_name || dbApt.full_name || 'Aluno Cadastrado',
            studentMatricula: dbApt.student_matricula || '',
            studentAvatar: dbApt.student_avatar || '',
            day: (dbApt.day_name || dbApt.day || 'Segunda-feira').replace(' (Semana 1)', ''),
            isoDateStr: dbApt.date || dbApt.iso_date || '',
            time: dbApt.time_slot || dbApt.time || '10:00',
            bookingType: dbApt.booking_type || 'regular',
            amount: Number(dbApt.amount || dbApt.price || 0),
            status: dbApt.status || 'confirmed',
            createdAt: dbApt.created_at || new Date().toISOString()
          }));

          // Cargar exclusivamente los datos reales de Supabase
          setBookings(fetchedBookings);
          
          // Actualizar localStorage como cache secundario sincronizado
          const saveUserId = userId || 'anon';
          localStorage.setItem(`${LOCAL_STORAGE_KEY_BOOKINGS}_${saveUserId}`, JSON.stringify(fetchedBookings));
          localStorage.setItem(LOCAL_STORAGE_KEY_BOOKINGS, JSON.stringify(fetchedBookings));
        } else if (active && (!data || data.length === 0)) {
          setBookings([]);
        }
      } catch (err) {
        console.warn('Error syncing aulas from Supabase:', err);
      }
    }

    syncBookingsFromSupabase();

    // Supabase Realtime Listener exclusivo na tabela 'aulas'
    const channel = supabase
      .channel('realtime_aulas_exclusive')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aulas' }, () => {
        syncBookingsFromSupabase();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);
  const [teacherAvailability, setTeacherAvailability] = useState(() => {
    try {
      const cached = localStorage.getItem('lexy_market_availability_cache');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    let active = true;
    async function syncAvailabilityFromSupabase() {
      try {
        const { data, error } = await supabase
          .from('teacher_availability')
          .select('*');

        if (!error && data && active) {
          setTeacherAvailability(data);
          localStorage.setItem('lexy_market_availability_cache', JSON.stringify(data));
        } else if (!error && data && data.length === 0 && active) {
          setTeacherAvailability([]);
          localStorage.removeItem('lexy_market_availability_cache');
        }
      } catch (err) {
        console.warn('Tabela teacher_availability no Supabase:', err);
      }
    }

    syncAvailabilityFromSupabase();
    return () => { active = false; };
  }, []);

  const saveAvailabilitySlot = async ({ teacherId, date, time, status = 'blocked', obs = '' }) => {
    const slotData = {
      teacher_id: teacherId,
      date,
      time,
      status,
      obs: obs || null
    };

    setTeacherAvailability(prev => {
      const filtered = prev.filter(a => !(a.teacher_id === teacherId && a.date === date && a.time === time));
      return [...filtered, slotData];
    });

    try {
      const { data, error } = await supabase
        .from('teacher_availability')
        .upsert(slotData, { onConflict: 'teacher_id,date,time' })
        .select();

      if (!error && data && data.length > 0) {
        setTeacherAvailability(prev => {
          const filtered = prev.filter(a => !(a.teacher_id === teacherId && a.date === date && a.time === time));
          return [...filtered, data[0]];
        });
      }
    } catch (err) {
      console.warn('Erro ao salvar em teacher_availability:', err);
    }
  };

  const removeAvailabilitySlot = async ({ teacherId, date, time }) => {
    setTeacherAvailability(prev => 
      prev.filter(a => !(a.teacher_id === teacherId && a.date === date && a.time === time))
    );

    try {
      await supabase
        .from('teacher_availability')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('date', date)
        .eq('time', time);
    } catch (err) {
      console.warn('Erro ao deletar em teacher_availability:', err);
    }
  };

  // Persistencia
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_TUTORS, JSON.stringify(tutors));
  }, [tutors]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_STUDENT, JSON.stringify(student));
  }, [student]);

  useEffect(() => {
    let active = true;
    async function fetchUsedTrials() {
      if (!student?.id) return;
      const { data, error } = await supabase
        .from('used_trials')
        .select('tutor_id')
        .eq('student_id', student.id);
      
      if (!error && data && active) {
        setUsedTrials(data.map(t => t.tutor_id));
      }
    }
    fetchUsedTrials();
    return () => { active = false; };
  }, [student?.id]);





  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    let active = true;
    async function fetchMessages() {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (active && !error && data) {
        const formatted = data.map(m => ({
          id: m.id,
          studentId: m.student_id,
          tutorId: m.tutor_id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          sender: m.sender_role,
          text: m.text,
          timestamp: m.timestamp || new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setDirectChatMessages(formatted);
      }
    }
    
    fetchMessages();

    const channel = supabase.channel('public:direct_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, payload => {
        const m = payload.new;
        const newMsg = {
          id: m.id,
          studentId: m.student_id,
          tutorId: m.tutor_id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          sender: m.sender_role,
          text: m.text,
          timestamp: m.timestamp || new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setDirectChatMessages(prev => {
          if (prev.some(msg => msg.text === newMsg.text && msg.studentId === newMsg.studentId && msg.timestamp === newMsg.timestamp && msg.id.startsWith('temp-'))) {
             return prev.map(msg => (msg.text === newMsg.text && msg.id.startsWith('temp-') ? newMsg : msg));
          }
          if (prev.find(x => x.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_TIER_RATES, JSON.stringify(tierRates));
  }, [tierRates]);

  const maxFreeTrials = 3;

  // Cliclos de Aulas Experimentais com persistência estrita no Supabase (Tabela public.aulas)
  // Obter todas as aulas experimentais do aluno registradas no Supabase ordenadas por data
  const studentTrialBookingsFromDb = useMemo(() => {
    return (bookings || []).filter(b => {
      const isTrial = b.bookingType === 'trial' || (b.planName && b.planName.toLowerCase().includes('experimental'));
      const isNotCanceled = b.status !== 'canceled' && b.status !== 'cancelada';
      return isTrial && isNotCanceled;
    }).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [bookings]);

  // Verificar se o aluno já CONCLUIU pelo menos 1 aula experimental paga no seu histórico do Supabase
  const hasCompletedFirstTrial = useMemo(() => {
    return (bookings || []).some(b => {
      const isTrial = b.bookingType === 'trial' || (b.planName && b.planName.toLowerCase().includes('experimental'));
      const isCompleted = b.status === 'concluida' || b.status === 'completed';
      return isTrial && isCompleted;
    });
  }, [bookings]);

  // Contar cuántas aulas experimentales gratis han sido agendadas en el ciclo actual
  // A partir de la 2ª aula experimental (después de la 1ª concluida/paga), se cuentan como de las 3 gratis de garantía
  const currentCycleFreeTrialsCount = useMemo(() => {
    if (!hasCompletedFirstTrial) return 0;
    // Las clases agendadas después de la 1ª paga (índice > 0) son las gratuitas de garantía
    return Math.max(0, studentTrialBookingsFromDb.length - 1);
  }, [studentTrialBookingsFromDb, hasCompletedFirstTrial]);

  // Estado de simulação rápida para teste dos 3 meses de renovação da Garantia
  const [simulate3MonthsPassed, setSimulate3MonthsPassed] = useState(() => {
    return localStorage.getItem('lexy_simulated_3_months') === 'true';
  });

  const toggleSimulate3Months = () => {
    setSimulate3MonthsPassed(prev => {
      const next = !prev;
      localStorage.setItem('lexy_simulated_3_months', String(next));
      return next;
    });
  };

  // Regla de Cooldown de 3 Meses: Verificar la fecha en que se consumió la 3ª aula gratis
  const isGuaranteeInCooldown = useMemo(() => {
    if (simulate3MonthsPassed) return false; // Se a simulação de 3 meses estiver ativa, ignora o cooldown!

    if (studentTrialBookingsFromDb.length < 4) return false; // 1 paga + 3 gratis = 4 en total
    
    // La 4ª aula agendada en total (índice 3) fue la 3ª aula gratis de garantía
    const thirdFreeTrial = studentTrialBookingsFromDb[3];
    if (!thirdFreeTrial?.createdAt) return true;

    const thirdTrialDate = new Date(thirdFreeTrial.createdAt);
    const now = new Date();

    // Calcular diferencia en meses
    const diffMonths = (now.getFullYear() - thirdTrialDate.getFullYear()) * 12 + (now.getMonth() - thirdTrialDate.getMonth());
    return diffMonths < 3;
  }, [studentTrialBookingsFromDb, simulate3MonthsPassed]);

  // Aulas experimentais gratuitas restantes no ciclo atual (0 se em cooldown de 3 meses ou se 1ª aula não foi concluída)
  const remainingFreeTrials = useMemo(() => {
    if (simulate3MonthsPassed) return 3; // Se simular 3 meses passados, força 3 aulas grátis ativas!
    if (!hasCompletedFirstTrial) return 0;
    if (isGuaranteeInCooldown) return 0;
    return Math.max(0, maxFreeTrials - currentCycleFreeTrialsCount);
  }, [hasCompletedFirstTrial, isGuaranteeInCooldown, currentCycleFreeTrialsCount, simulate3MonthsPassed]);

  const getTrialEligibility = (tutorId) => {
    const hasUsedWithThisTutor = (usedTrials || []).includes(tutorId);

    if (hasUsedWithThisTutor) {
      return {
        allowed: false,
        isFree: false,
        remaining: remainingFreeTrials,
        reason: 'already_used_with_tutor',
        message: 'Você já utilizou sua Aula Experimental única com este professor. Escolha um plano de assinatura de 30 dias para continuar.'
      };
    }

    // Regla 1: Si el alumno AÚN NO ha completado su 1ª Aula Experimental paga (comprada), la 1ª aula se cobra.
    if (!hasCompletedFirstTrial) {
      return {
        allowed: true,
        isFree: false,
        remaining: 0,
        reason: 'first_paid_trial',
        message: '1ª Aula Experimental Comprada (Valor Promocional com Desconto). Se não gostar após a conclusão, você ganha 3 Aulas Experimentais Gratuitas de Garantia de Satisfação!'
      };
    }

    // Regla 2: Si consumió sus 3 aulas gratis y está dentro del periodo de Cooldown de 3 meses:
    if (isGuaranteeInCooldown || currentCycleFreeTrialsCount >= maxFreeTrials) {
      return {
        allowed: true,
        isFree: false,
        remaining: 0,
        reason: 'cooldown_paid_trial',
        message: 'Você já utilizou suas 3 Aulas Experimentais Gratuitas de Garantia de Satisfação neste trimestre. Você pode agendar aulas experimentais adicionais pelo valor promocional (pago).'
      };
    }

    // Regla 3: Si tiene aulas gratis disponibles en su ciclo actual:
    return {
      allowed: true,
      isFree: true,
      remaining: remainingFreeTrials,
      reason: 'free_guarantee',
      message: `Garantia de Satisfação Lexy: Esta Aula Experimental é 100% GRÁTIS! (Restam ${remainingFreeTrials} de ${maxFreeTrials} aulas gratuitas)`
    };
  };

  const canBookTrial = (tutorId) => {
    return getTrialEligibility(tutorId).allowed;
  };

  const registerTutor = (tutorData) => {
    const newTutor = {
      id: `tutor-${Date.now()}`,
      name: tutorData.full_name,
      email: tutorData.email,
      phone: tutorData.phone,
      title: tutorData.headline,
      country: tutorData.country,
      countryCode: tutorData.country === 'Espanha' ? 'ES' : tutorData.country === 'México' ? 'MX' : tutorData.country === 'Colômbia' ? 'CO' : 'US',
      flag: tutorData.country === 'Espanha' ? '🇪🇸' : tutorData.country === 'México' ? '🇲🇽' : tutorData.country === 'Colômbia' ? '🇨🇴' : '🇺🇸',
      avatar: tutorData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      nativeSpeaker: tutorData.native_language === tutorData.subject_taught,
      isSuperTutor: false,
      isVerified: false,
      status: 'pending',
      subject: tutorData.subject_taught,
      hourlyRate: Number(tutorData.hourly_rate),
      trialRate: Number(tutorData.hourly_rate) * 0.5,
      rating: 5.0,
      reviewCount: 0,
      totalLessons: 0,
      activeStudents: 0,
      responseTime: 'Responde em <1 hora',
      videoUrl: tutorData.video_url,
      videoThumbnail: tutorData.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
      headline: tutorData.headline,
      bio: tutorData.bio,
      certifications: tutorData.certifications,
      experienceYears: tutorData.experience_years,
      languagesSpoken: [{ language: tutorData.native_language, level: 'Nativo' }],
      specialties: tutorData.specialties || ['Conversação'],
      weeklySchedule: tutorData.weeklySchedule || {},
      earnedBalance: 0,
      reviews: []
    };

    setTutors(prev => [newTutor, ...prev]);
    return newTutor;
  };

  const approveTutor = async (tutorId) => {
    setTutors(prev => prev.map(t => t.id === tutorId ? { ...t, status: 'approved', isVerified: true } : t));
    try {
      await supabase.from('profiles').update({ status: 'approved' }).eq('id', tutorId);
    } catch (e) {
      console.warn('Error updating tutor status in Supabase:', e);
    }
  };

  const rejectTutor = async (tutorId) => {
    setTutors(prev => prev.map(t => t.id === tutorId ? { ...t, status: 'rejected' } : t));
    try {
      await supabase.from('profiles').update({ status: 'rejected' }).eq('id', tutorId);
    } catch (e) {
      console.warn('Error updating tutor status in Supabase:', e);
    }
  };

  const updateTutorSchedule = async (tutorId, newSchedule) => {
    setTutors(prev => prev.map(t => t.id === tutorId ? { ...t, weeklySchedule: newSchedule } : t));
    try {
      await supabase
        .from('profiles')
        .update({ weekly_schedule: newSchedule })
        .eq('id', tutorId);
    } catch (e) {
      console.warn('Error updating tutor weekly_schedule in Supabase:', e);
    }
  };

  const incrementTutorLessons = (tutorId) => {
    setTutors(prev => prev.map(t => {
      if (t.id === tutorId) {
        return { ...t, totalLessons: (t.totalLessons || 0) + 1 };
      }
      return t;
    }));
  };

  const registerStudentAccount = (studentData) => {
    const newStudent = {
      id: `student-${Date.now()}`,
      name: studentData.name,
      email: studentData.email,
      password: studentData.password,
      residenceCountry: studentData.residenceCountry || 'Brasil',
      documentType: studentData.documentType || 'cpf',
      documentNumber: studentData.documentNumber,
      walletBalance: 0.00
    };
    setStudent(newStudent);
    return newStudent;
  };

  const topUpWallet = (amount) => {
    setStudent(prev => ({
      ...prev,
      walletBalance: Number((prev.walletBalance + Number(amount)).toFixed(2))
    }));
  };

  const activateSubscriptionAndCredits = ({ tutorId, planHours = 8, planName = 'Plano Pro', amount, studentId, studentEmail, studentMatricula, studentName }) => {
    const tutor = tutors.find(t => t.id === tutorId || t.email === tutorId) || {
      id: tutorId || 'tutor-current',
      name: 'Professor Lexy',
      subject: 'Idioma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      hourlyRate: 20
    };
    const now = new Date();
    const cycleEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const hoursToCredit = Number(planHours) || 8;

    const effectiveStudentId = studentId || student?.id || 'student-user';
    const effectiveStudentEmail = studentEmail || student?.email || '';
    const effectiveStudentName = studentName || student?.name || '';
    const effectiveStudentMatricula = studentMatricula || student?.matricula_code || '';

    const newSub = {
      id: `sub-${Date.now()}`,
      studentId: effectiveStudentId,
      studentEmail: effectiveStudentEmail,
      studentName: effectiveStudentName,
      studentMatricula: effectiveStudentMatricula,
      tutorId: tutor?.id || 'tutor-1',
      tutorName: tutor?.name || 'Professor Nativo',
      tutorAvatar: tutor?.avatar,
      tutorSubject: tutor?.subject || 'Idioma',
      planName: planName || 'Plano de Aulas Lexy',
      planHours: hoursToCredit,
      hoursRemaining: hoursToCredit,
      monthlyPrice: amount || 360,
      cycleStartDate: now.toISOString(),
      nextBillingDate: cycleEndDate.toISOString(),
      cycleEndDate: cycleEndDate.toISOString(),
      status: 'active'
    };

    setSubscriptions(prev => [newSub, ...prev]);

    // Creditar Horas de Aula na Carteira
    setStudent(prev => {
      const base = prev || { id: 'student-user', name: 'Aluno Lexy', email: 'aluno@lexy.com', walletBalance: 0 };
      return {
        ...base,
        walletBalance: Number(((base.walletBalance || 0) + hoursToCredit).toFixed(2))
      };
    });

    // Gerar a agenda de aulas para o ciclo com base na disponibilidade real do professor
    const baseSlots = getTutorFreeSlotsList(tutor);

    const generatedBookings = [];
    const numSlots = baseSlots.length;
    const numWeeks = Math.ceil(hoursToCredit / numSlots);
    let count = 0;

    for (let week = 1; week <= numWeeks; week++) {
      for (let sIdx = 0; sIdx < numSlots; sIdx++) {
        if (count >= hoursToCredit) break;
        count++;
        const s = baseSlots[sIdx];
        const bId = `booking-${Date.now()}-w${week}-s${sIdx}-${count}`;
        const lCode = generateLessonCode(bId);

        generatedBookings.push({
          id: bId,
          lesson_code: lCode,
          tutorId: tutor.id,
          tutorName: tutor.name,
          tutorEmail: tutor.email || '',
          tutorAvatar: tutor.avatar,
          tutorSubject: tutor.subject,
          studentId: effectiveStudentId,
          studentEmail: effectiveStudentEmail,
          studentName: effectiveStudentName,
          studentMatricula: effectiveStudentMatricula,
          day: s.day,
          time: s.time,
          bookingType: 'subscription',
          amount: tutor.hourlyRate || 20,
          status: 'confirmed',
          createdAt: new Date().toISOString()
        });
      }
    }

    setBookings(prev => [...generatedBookings, ...prev]);

    // Persistir no Supabase (tabela public.aulas)
    try {
      const dbPayload = generatedBookings.map(b => ({
        lesson_code: b.lesson_code,
        student_id: b.studentId || null,
        tutor_id: b.tutorId || null,
        student_name: b.studentName || 'Aluno Lexy',
        student_email: b.studentEmail || '',
        student_matricula: b.studentMatricula || '',
        tutor_name: b.tutorName || 'Professor Lexy',
        teacher_name: b.tutorName || 'Professor Lexy',
        tutor_email: b.tutorEmail || '',
        teacher_email: b.tutorEmail || '',
        subject: b.tutorSubject || 'Espanhol',
        day: b.day || 'Segunda-feira',
        time: b.time || '10:00',
        booking_type: b.bookingType || 'subscription',
        amount: Number(b.amount || 0),
        status: b.status || 'confirmed'
      }));

      supabase.from('aulas').insert(dbPayload).then(({ error }) => {
        if (error) {
          console.error('❌ Error inserting subscription into aulas:', error);
          const minPayload = generatedBookings.map(b => ({
            lesson_code: b.lesson_code,
            student_name: b.studentName || 'Aluno',
            tutor_name: b.tutorName || 'Prof',
            day: b.day || '',
            time: b.time || ''
          }));
          supabase.from('aulas').insert(minPayload).catch(e => console.warn(e));
        } else {
          console.log('✅ Subscription aulas inserted successfully:', dbPayload);
        }
      }).catch(err => console.error('Supabase subscription insert catch:', err));
    } catch (e) {
      console.error('Subscription DB sync catch:', e);
    }

    return newSub;
  };

  const pauseSubscription = async (subscriptionId, days = 20) => {
    const pausedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    setSubscriptions(prev => prev.map(s => {
      if (s.id === subscriptionId) {
        return {
          ...s,
          status: 'paused',
          pausedUntil,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));

    try {
      await supabase
        .from('subscriptions')
        .update({
          status: 'paused',
          paused_until: pausedUntil,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);
    } catch (err) {
      console.warn('Erro ao atualizar pausa no Supabase:', err);
    }

    return { success: true, status: 'paused', pausedUntil };
  };

  const resumeSubscription = async (subscriptionId) => {
    setSubscriptions(prev => prev.map(s => {
      if (s.id === subscriptionId) {
        return {
          ...s,
          status: 'active',
          pausedUntil: null,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));

    try {
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          paused_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);
    } catch (err) {
      console.warn('Erro ao atualizar reativação no Supabase:', err);
    }

    return { success: true, status: 'active' };
  };

  const cancelSubscription = async (subscriptionId, reason = 'Cancelamento solicitado pelo aluno') => {
    setSubscriptions(prev => prev.map(s => {
      if (s.id === subscriptionId) {
        return {
          ...s,
          status: 'canceled',
          cancelReason: reason,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));

    try {
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);
    } catch (err) {
      console.warn('Erro ao atualizar cancelamento no Supabase:', err);
    }

    return { success: true, status: 'canceled' };
  };

  const createBooking = async ({ tutorId, day, time, allSlots, bookingType, planHours, planName, totalAmount, bypassWallet = false, studentId, studentEmail, studentName, studentMatricula }) => {
    const tutor = tutors.find(t => t.id === tutorId);
    if (!tutor) return { success: false, error: 'Tutor não encontrado' };

    const effectiveStudentId = studentId || student?.id;
    const effectiveStudentEmail = studentEmail || student?.email;
    const effectiveStudentName = studentName || student?.name;
    const effectiveStudentMatricula = studentMatricula || student?.matricula_code;

    if (bookingType === 'trial' && !bypassWallet) {
      if (usedTrials.includes(tutorId)) {
        return {
          success: false,
          error: 'trial_already_used',
          message: 'Você já utilizou sua Aula Experimental única com este professor. Escolha um plano de assinatura de 30 dias para continuar.'
        };
      }
    }

    const isTrialBooking = (
      bookingType === 'trial' || 
      bookingType === 'experimental' || 
      (planName && planName.toLowerCase().includes('experimental')) ||
      (planName && planName.toLowerCase().includes('teste')) ||
      Number(totalAmount) <= 30 ||
      Number(planHours) === 1
    );

    const totalContractedHours = isTrialBooking ? 1 : (Number(planHours) || 8);

    const baseSlots = isTrialBooking
      ? [{ day: day || 'Segunda-feira', time: time || '10:00' }]
      : ((Array.isArray(allSlots) && allSlots.length > 0) 
        ? allSlots 
        : [{ day: day || 'Segunda-feira', time: time || '10:00' }]);

    if (!bypassWallet) {
      if ((student?.walletBalance || 0) < totalContractedHours && !isTrialBooking) {
        return { 
          success: false, 
          error: 'insufficient_funds', 
          required: totalContractedHours, 
          current: student?.walletBalance || 0 
        };
      }

      // Descontar saldo de horas de aula usando RPC seguro en Supabase
      if (!isTrialBooking) {
        if (effectiveStudentId) {
          const { error: deductError } = await supabase.rpc('deduct_wallet_balance', { cost: totalContractedHours });
          
          if (deductError) {
            console.error('Erro ao deduzir saldo no Supabase:', deductError);
            return { 
              success: false, 
              error: 'insufficient_funds', 
              required: totalContractedHours
            };
          }

          // Atualizar o estado local com o valor deduzido
          const newBalance = Math.max(0, Number(((student?.walletBalance || 0) - totalContractedHours).toFixed(2)));
          setStudent(prev => {
            const base = prev || { id: 'student-user', name: 'Aluno Lexy', email: 'aluno@lexy.com', walletBalance: 0 };
            return {
              ...base,
              walletBalance: newBalance
            };
          });
        }
      }
    } else {
      // Se pagamento foi aprovado via Stone (bypassWallet = true): Liberar Horas Contratadas
      setStudent(prev => {
        const base = prev || { id: 'student-user', name: 'Aluno Lexy', email: 'aluno@lexy.com', walletBalance: 0 };
        return {
          ...base,
          walletBalance: Number((base.walletBalance || 0).toFixed(2))
        };
      });
    }

    if (isTrialBooking) {
      setUsedTrials(prev => [...prev, tutorId]);
      // Sincronizar trial usado con Supabase
      if (effectiveStudentId) {
        supabase.from('used_trials')
          .insert({ student_id: effectiveStudentId, tutor_id: tutorId })
          .then(({ error }) => {
            if (error) console.error('Erro ao salvar trial na Supabase:', error);
          });
      }
    }

    if (!isTrialBooking && (bookingType === 'package' || bookingType === 'subscription')) {
      const now = new Date();
      const cycleEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const newSub = {
        id: `sub-${Date.now()}`,
        studentId: effectiveStudentId,
        studentEmail: effectiveStudentEmail,
        studentName: effectiveStudentName,
        studentMatricula: effectiveStudentMatricula,
        tutorId,
        tutorName: tutor.name,
        tutorAvatar: tutor.avatar,
        tutorSubject: tutor.subject,
        planName: planName || `Plano de Aulas (${totalContractedHours} Horas / 30 Dias)`,
        planHours: totalContractedHours,
        hoursRemaining: totalContractedHours,
        monthlyPrice: totalAmount,
        cycleStartDate: now.toISOString(),
        nextBillingDate: cycleEndDate.toISOString(),
        cycleEndDate: cycleEndDate.toISOString(),
        status: 'active'
      };
      setSubscriptions(prev => [newSub, ...prev]);
    }

    // Gerar todas as aulas do ciclo de 30 dias conforme a frequência contratada
    const createdBookings = [];
    const numSlots = baseSlots.length;
    const numWeeks = isTrialBooking ? 1 : Math.ceil(totalContractedHours / numSlots);
    let count = 0;

    for (let week = 1; week <= numWeeks; week++) {
      if (isTrialBooking && count >= 1) break;
      for (let sIdx = 0; sIdx < numSlots; sIdx++) {
        if (count >= totalContractedHours) break;
        count++;
        const s = baseSlots[sIdx];
        const bId = `booking-${Date.now()}-w${week}-s${sIdx}-${count}`;
        const lCode = generateLessonCode(bId, isTrialBooking);

        const dayFormatted = (numWeeks > 1 && !isTrialBooking) 
          ? `${s.day || day} (Semana ${week})` 
          : (s.day || day);

        const bookingItem = {
          id: bId,
          lesson_code: lCode,
          tutorId,
          tutorName: tutor.name,
          tutorEmail: tutor.email || '',
          tutorAvatar: tutor.avatar,
          tutorSubject: tutor.subject,
          studentId: effectiveStudentId || 'student-user',
          studentEmail: effectiveStudentEmail || '',
          studentName: effectiveStudentName || '',
          studentMatricula: effectiveStudentMatricula || '',
          day: dayFormatted,
          time: s.time || time,
          bookingType: isTrialBooking ? 'trial' : (bookingType || 'regular'),
          amount: totalAmount,
          status: 'confirmed',
          createdAt: new Date().toISOString()
        };
        createdBookings.push(bookingItem);

        if (tutor.weeklySchedule && tutor.weeklySchedule[s.day || day]) {
          const targetDay = s.day || day;
          const targetTime = s.time || time;
          const updatedSchedule = {
            ...tutor.weeklySchedule,
            [targetDay]: tutor.weeklySchedule[targetDay].filter(slot => slot !== targetTime)
          };
          updateTutorSchedule(tutorId, updatedSchedule);
        }
      }
    }

    if (isTrialBooking) {
      createdBookings.splice(1);
    }

    setBookings(prev => [...createdBookings, ...prev]);

    // Persistir as aulas (incluindo aulas experimentais / trial e paquetes) no Supabase de forma sincrona
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const sessionUserId = currentSession?.user?.id;
      const sessionUserEmail = currentSession?.user?.email;

      const finalStudentId = sessionUserId || (effectiveStudentId && effectiveStudentId.includes('-') && effectiveStudentId.length > 20 ? effectiveStudentId : null);
      const finalTutorId = tutorId && tutorId.includes('-') && tutorId.length > 20 ? tutorId : null;

      const targetBookingsForDb = isTrialBooking ? createdBookings.slice(0, 1) : createdBookings;
      const dbPayload = targetBookingsForDb.map(b => ({
        lesson_code: b.lesson_code,
        student_id: finalStudentId,
        tutor_id: finalTutorId,
        student_name: b.studentName || 'Aluno Lexy',
        student_email: sessionUserEmail || b.studentEmail || '',
        student_matricula: b.studentMatricula || '',
        tutor_name: b.tutorName || 'Professor Lexy',
        teacher_name: b.tutorName || 'Professor Lexy',
        tutor_email: b.tutorEmail || '',
        teacher_email: b.tutorEmail || '',
        subject: b.tutorSubject || 'Espanhol',
        day: (b.day || 'Segunda-feira').replace(/ \(Semana \d+\)/g, ''),
        time: b.time || '10:00',
        booking_type: isTrialBooking ? 'trial' : (b.bookingType || 'regular'),
        amount: Number(b.amount || 0),
        status: b.status || 'confirmed'
      }));

      const { data: insertedData, error: insertErr } = await supabase.from('aulas').insert(dbPayload).select();
      if (insertErr) {
        console.error('❌ Error inserting booking into aulas table:', insertErr);
        // Fallback sem IDs se houver incompatibilidade de formato UUID
        const fallbackPayload = dbPayload.map(item => ({
          ...item,
          student_id: sessionUserId || null,
          tutor_id: null
        }));
        await supabase.from('aulas').insert(fallbackPayload);
      } else {
        console.log('✅ Supabase aulas insert succeeded!', insertedData);
      }
    } catch (e) {
      console.error('createBooking DB sync catch:', e);
    }

    return { success: true, booking: createdBookings[0] };
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    if (!bookingId) return;
    const cleanSearchId = String(bookingId).trim().toLowerCase();

    setBookings(prev => prev.map(b => {
      if (
        String(b.id || '').trim().toLowerCase() === cleanSearchId || 
        String(b.lesson_code || '').trim().toLowerCase() === cleanSearchId
      ) {
        return { ...b, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return b;
    }));

    try {
      await supabase.from('aulas')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .or(`id.eq.${bookingId},lesson_code.eq.${bookingId}`);
    } catch (e) {
      console.warn('Erro ao atualizar status na Supabase:', e);
    }
  };

  // 🔄 FUNÇÃO DE REAGENDAMENTO COM PERSISTÊNCIA EM SUPABASE E NOTIFICAÇÃO DIRETA AO PROFESSOR
  const rescheduleBooking = async (bookingId, newDay, newTime, studentName) => {
    if (!bookingId) return false;
    const cleanId = String(bookingId).trim();

    let targetBooking = null;
    setBookings(prev => prev.map(b => {
      if (String(b.id || '').trim() === cleanId || String(b.lesson_code || '').trim() === cleanId) {
        targetBooking = b;
        return { 
          ...b, 
          day: newDay, 
          date: newDay,
          time: newTime, 
          status: 'rescheduled',
          updatedAt: new Date().toISOString() 
        };
      }
      return b;
    }));

    // Actualizar en Supabase (tabla 'aulas' y/o 'bookings')
    try {
      await supabase.from('aulas')
        .update({ 
          day: newDay, 
          date: newDay,
          time: newTime, 
          status: 'rescheduled', 
          updated_at: new Date().toISOString() 
        })
        .or(`id.eq.${cleanId},lesson_code.eq.${cleanId}`);
    } catch (e) {
      console.warn('Erro ao persisitir reagendamento no Supabase:', e);
    }

    if (targetBooking) {
      const tutorId = targetBooking.tutorId || targetBooking.tutor_id;
      const originalDay = targetBooking.day || targetBooking.date || 'data anterior';
      const originalTime = targetBooking.time || 'horário anterior';
      const sName = studentName || targetBooking.studentName || targetBooking.student_name || 'Aluno';
      const sId = targetBooking.studentId || targetBooking.student_id || 'stud-1';

      // 1. Enviar Mensaje Directo al Chat con el Professor
      const messageText = `🔄 AVISO DE REAGENDAMENTO: O aluno(a) ${sName} reagendou a aula (Código: ${targetBooking.lesson_code || cleanId}). Data/Hora Original: ${originalDay} às ${originalTime} ➡️ Nova Data/Hora: ${newDay} às ${newTime}. O reagendamento foi confirmado com sucesso pois o novo horário encontra-se 100% disponível em sua agenda!`;
      
      await sendDirectMessage({
        studentId: sId,
        tutorId: tutorId,
        senderRole: 'system',
        senderName: 'Lexy Notificações',
        text: messageText
      });

      // 2. Enviar Anúncio/Notificação no Painel do Professor
      addAnnouncement({
        target: 'teachers',
        title: `🔄 Aula Reagendada: ${sName}`,
        content: `O aluno(a) ${sName} reagendou a aula (Código: ${targetBooking.lesson_code || cleanId}) de ${originalDay} às ${originalTime} para ${newDay} às ${newTime}. O horário estava disponível em sua agenda.`,
        level: 'info'
      });
    }

    return true;
  };

  const completeBooking = (bookingId) => {
    if (!bookingId) return;
    const cleanSearchId = String(bookingId).trim().toLowerCase();

    setBookings(prev => {
      const target = prev.find(b => 
        String(b.id || '').trim().toLowerCase() === cleanSearchId || 
        String(b.lesson_code || '').trim().toLowerCase() === cleanSearchId
      );

      if (target) {
        const targetTutorId = target.tutorId || target.tutor_id;
        const isTrial = target.bookingType === 'trial' || target.booking_type === 'trial';

        setTutors(tList => tList.map(t => {
          if (
            String(t.id || '').toLowerCase() === String(targetTutorId || '').toLowerCase() || 
            String(t.email || '').toLowerCase() === String(target.tutorEmail || '').toLowerCase()
          ) {
            // USAR A TARIFA POR HORA CONFIGURADA PELO PROFESSOR (ex: R$ 20/h, R$ 30/h)
            const teacherRate = Number(t.hourlyRate || t.hourly_rate || target.amount || 20);
            const currentLessons = (t.totalLessons || t.total_lessons || 0) + 1;
            const earnPercent = getTeacherEarnPercent(currentLessons, isTrial, tierRates);
            const netEarned = Number((teacherRate * (earnPercent / 100)).toFixed(2));

            const currentEarned = Number(t.earnedBalance || t.earned_balance || t.walletBalance || 0);
            const newEarned = Number((currentEarned + netEarned).toFixed(2));

            // Salvar no localStorage por ID e E-mail para NUNCA perder ao recarregar a página
            try {
              if (t.id) {
                localStorage.setItem(`lexy_earned_balance_${t.id}`, newEarned.toString());
                localStorage.setItem(`lexy_total_lessons_${t.id}`, currentLessons.toString());
              }
              if (t.email) {
                localStorage.setItem(`lexy_earned_balance_${t.email}`, newEarned.toString());
                localStorage.setItem(`lexy_total_lessons_${t.email}`, currentLessons.toString());
              }
            } catch (e) {}

            // Persistir atualização de ganhos e total de aulas no Supabase (tabela profiles)
            try {
              supabase.from('profiles').update({
                total_lessons: currentLessons,
                earned_balance: newEarned,
                wallet_balance: newEarned
              }).eq('id', t.id).then(() => {}).catch(() => {});
            } catch (e) {}

            return {
              ...t,
              totalLessons: currentLessons,
              total_lessons: currentLessons,
              earnedBalance: newEarned,
              earned_balance: newEarned,
              walletBalance: newEarned,
              wallet_balance: newEarned
            };
          }
          return t;
        }));

        // Atualizar status na tabela 'aulas' do Supabase para 'concluida'
        try {
          supabase.from('aulas')
            .update({ status: 'concluida', completed_at: new Date().toISOString() })
            .or(`id.eq.${target.id},lesson_code.eq.${target.lesson_code || bookingId}`)
            .then(() => {}).catch(() => {});
        } catch (e) {}
      }

      return prev.map(b => {
        if (
          String(b.id || '').trim().toLowerCase() === cleanSearchId || 
          String(b.lesson_code || '').trim().toLowerCase() === cleanSearchId
        ) {
          return { ...b, status: 'concluida', completedAt: new Date().toISOString() };
        }
        return b;
      });
    });
  };

  const autoPurge30DaysHistory = () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    setBookings(prev => prev.filter(b => {
      if (b.status === 'completed' || b.status === 'no_show') {
        const date = new Date(b.completedAt || b.createdAt);
        return date >= thirtyDaysAgo;
      }
      return true;
    }));
  };

  const acceptBookingRequest = (bookingId) => {
    let acceptedBooking = null;
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        acceptedBooking = { ...b, status: 'confirmed', updatedAt: new Date().toISOString() };
        return acceptedBooking;
      }
      return b;
    }));

    if (acceptedBooking) {
      const tutor = tutors.find(t => t.id === acceptedBooking.tutorId);
      if (tutor && tutor.weeklySchedule && acceptedBooking.day && acceptedBooking.time) {
        const day = acceptedBooking.day;
        const time = acceptedBooking.time;
        if (tutor.weeklySchedule[day]) {
          const updatedSchedule = {
            ...tutor.weeklySchedule,
            [day]: tutor.weeklySchedule[day].filter(slot => slot !== time)
          };
          updateTutorSchedule(acceptedBooking.tutorId, updatedSchedule);
        }
      }

      const dateText = acceptedBooking.colDateStr || acceptedBooking.day || 'sua aula';
      sendDirectMessage({
        studentId: acceptedBooking.studentId || 'stud-1',
        tutorId: acceptedBooking.tutorId,
        senderName: acceptedBooking.tutorName ? `${acceptedBooking.tutorName} (Tutor)` : 'Tutor',
        senderRole: 'teacher',
        text: `🎉 Sua solicitação de aula (${acceptedBooking.bookingType === 'trial' ? 'Aula Experimental' : 'Plano de Aulas'}) para ${dateText} às ${acceptedBooking.time} foi ACEITA! O horário está confirmado em sua agenda.`
      });
    }

    return acceptedBooking;
  };

  const rejectBookingRequest = (bookingId) => {
    let rejectedBooking = null;
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        rejectedBooking = { ...b, status: 'rejected', updatedAt: new Date().toISOString() };
        return rejectedBooking;
      }
      return b;
    }));

    if (rejectedBooking) {
      const dateText = rejectedBooking.colDateStr || rejectedBooking.day || 'sua aula';
      sendDirectMessage({
        studentId: rejectedBooking.studentId || 'stud-1',
        tutorId: rejectedBooking.tutorId,
        senderName: rejectedBooking.tutorName ? `${rejectedBooking.tutorName} (Tutor)` : 'Tutor',
        senderRole: 'teacher',
        text: `⚠️ Sua solicitação de aula para ${dateText} às ${rejectedBooking.time} foi recusada pelo tutor. Por favor, selecione outro horário disponível.`
      });
    }

    return rejectedBooking;
  };

  const updateTutorProfile = async (tutorId, updatedFields) => {
    // 1. Atualizar o estado local de tutores
    setTutors(prev => {
      const updated = prev.map(t => {
        if (t.id === tutorId || (t.email && updatedFields.email && t.email === updatedFields.email)) {
          const newRate = updatedFields.hourlyRate !== undefined 
            ? Number(updatedFields.hourlyRate) 
            : (updatedFields.hourly_rate !== undefined ? Number(updatedFields.hourly_rate) : t.hourlyRate);
          return {
            ...t,
            ...updatedFields,
            hourlyRate: newRate,
            hourly_rate: newRate,
            trialRate: Number((newRate * 0.5).toFixed(2))
          };
        }
        return t;
      });
      localStorage.setItem(LOCAL_STORAGE_KEY_TUTORS, JSON.stringify(updated));
      return updated;
    });

    // 2. Persistir no Supabase (tabelas public.tutors e public.profiles)
    try {
      if (tutorId) {
        const rateNum = updatedFields.hourlyRate || updatedFields.hourly_rate;
        if (rateNum) {
          await supabase.from('tutors').update({
            hourly_rate: rateNum,
            headline: updatedFields.headline,
            bio: updatedFields.bio,
            video_url: updatedFields.videoUrl || updatedFields.video_url,
            subject: updatedFields.subject,
            country: updatedFields.country,
            timezone: updatedFields.timezone,
            updated_at: new Date().toISOString()
          }).eq('id', tutorId);

          await supabase.from('profiles').update({
            hourly_rate: rateNum,
            phone: updatedFields.phone,
            updated_at: new Date().toISOString()
          }).eq('id', tutorId);
        }
      }
    } catch (err) {
      console.warn('Error saving updated tutor profile to Supabase:', err);
    }
  };

  return (
    <MarketplaceContext.Provider value={{
      tutors,
      updateTutorProfile,
      student,
      usedTrials,
      teacherAvailability,
      saveAvailabilitySlot,
      removeAvailabilitySlot,
      subscriptions,
      bookings,
      platformFeePercent,
      setPlatformFeePercent,
      tierRates,
      updateTierRates,
      packageDiscounts,
      updatePackageDiscounts,
      getTutorPackageDiscount,
      announcements,
      addAnnouncement,
      deleteAnnouncement,
      directChatMessages,
      sendDirectMessage,
      acceptBookingRequest,
      rejectBookingRequest,
      canBookTrial,
      getTrialEligibility,
      maxFreeTrials,
      remainingFreeTrials,
      simulate3MonthsPassed,
      toggleSimulate3Months,
      registerTutor,
      approveTutor,
      rejectTutor,
      updateTutorSchedule,
      incrementTutorLessons,
      registerStudentAccount,
      topUpWallet,
      activateSubscriptionAndCredits,
      pauseSubscription,
      resumeSubscription,
      cancelSubscription,
      createBooking,
      generateLessonCode,
      completeBooking,
      updateBookingStatus,
      rescheduleBooking,
      autoPurge30DaysHistory
    }}>
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace deve ser usado dentro de um MarketplaceProvider');
  }
  return context;
};
