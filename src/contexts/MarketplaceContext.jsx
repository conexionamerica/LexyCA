import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { mockTutors as initialMockTutors } from '../data/mockTutors';

const MarketplaceContext = createContext(undefined);

const LOCAL_STORAGE_KEY_TUTORS = 'lexy_market_tutors_v2';
const LOCAL_STORAGE_KEY_BOOKINGS = 'lexy_market_bookings_v2';
const LOCAL_STORAGE_KEY_STUDENT = 'lexy_market_student_v2';
const LOCAL_STORAGE_KEY_TRIALS = 'lexy_market_used_trials_v2';
const LOCAL_STORAGE_KEY_SUBSCRIPTIONS = 'lexy_market_subscriptions_v2';
const LOCAL_STORAGE_KEY_FEE = 'lexy_market_platform_fee_v2';
const LOCAL_STORAGE_KEY_ANNOUNCEMENTS = 'lexy_market_announcements_v2';
const LOCAL_STORAGE_KEY_DIRECT_CHAT = 'lexy_market_direct_chat_v2';
const LOCAL_STORAGE_KEY_TIER_RATES = 'lexy_market_tier_rates_v2';
const LOCAL_STORAGE_KEY_PACKAGE_DISCOUNTS = 'lexy_market_package_discounts_v2';

export const DEFAULT_PACKAGE_DISCOUNTS = {
  global: {
    'pkg-4h': 0,
    'pkg-8h': 0,
    'pkg-12h': 0,
    'pkg-16h': 0
  },
  byTutor: {}
};

export const getTutorPackageDiscount = (packageDiscounts, tutorId, pkgId) => {
  if (!packageDiscounts) return 0;
  if (packageDiscounts[pkgId] !== undefined) {
    return Number(packageDiscounts[pkgId] || 0);
  }
  return 0;
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
export const generateLessonCode = (id = '') => {
  if (!id) return `AULA-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const positiveNum = Math.abs(hash) % 900000 + 100000;
  return `AULA-2026-${positiveNum}`;
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
  const [directChatMessages, setDirectChatMessages] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DIRECT_CHAT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error cargando chat directo', e);
      }
    }
    return [];
  });

  const sendDirectMessage = (payload, roleFallback, studentIdFallback, nameFallback) => {
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

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentId,
      tutorId,
      senderName,
      senderRole,
      sender: senderRole,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setDirectChatMessages(prev => [...prev, newMsg]);
    return newMsg;
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
          const fetchedTutors = data.map(dbT => ({
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
            totalLessons: 0,
            activeStudents: 0,
            responseTime: 'Responde em <1 hora',
            videoUrl: dbT.video_url || '',
            headline: dbT.headline || '',
            bio: dbT.bio || '',
            specialties: dbT.specialties || ['Conversação'],
            languagesSpoken: dbT.languages_spoken || [{ language: dbT.subject_taught || 'Espanhol', level: 'Nativo' }],
            weeklySchedule: dbT.weekly_schedule || {},
            earnedBalance: 0,
            reviews: dbT.reviews || []
          })).filter(t => !isFakeMockTutor(t));

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
  const [usedTrials, setUsedTrials] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TRIALS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error cargando historial de aulas experimentales', e);
      }
    }
    return [];
  });

  // Suscripciones
  const [subscriptions, setSubscriptions] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SUBSCRIPTIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error cargando suscripciones de 28 días', e);
      }
    }
    return [];
  });

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

  const getDefaultCycleBookings = (tutorObj, planHoursVal = 8) => {
    const tutor = tutorObj || (tutors && tutors.length > 0 ? tutors[0] : null);
    if (!tutor) return [];

    const planHours = Number(planHoursVal) || 8;
    const baseSlots = [
      { day: 'Segunda-feira', time: '10:00' },
      { day: 'Quarta-feira', time: '16:00' }
    ];

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
          day: `${s.day} (Semana ${week})`,
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
        const { data, error } = await supabase.from('aulas').select('*');

        if (!error && data && active) {
          const filteredData = data.filter(dbApt => {
            const dayStr = String(dbApt.day_name || dbApt.day || '');
            // Eliminar registros antigos duplicados com (Semana 2), (Semana 3), etc.
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

          setBookings(fetchedBookings);
          localStorage.setItem(LOCAL_STORAGE_KEY_BOOKINGS, JSON.stringify(fetchedBookings));
        } else if (active) {
          setBookings([]);
          localStorage.setItem(LOCAL_STORAGE_KEY_BOOKINGS, JSON.stringify([]));
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
    localStorage.setItem(LOCAL_STORAGE_KEY_TRIALS, JSON.stringify(usedTrials));
  }, [usedTrials]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_DIRECT_CHAT, JSON.stringify(directChatMessages));
  }, [directChatMessages]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_TIER_RATES, JSON.stringify(tierRates));
  }, [tierRates]);

  const canBookTrial = (tutorId) => {
    return !usedTrials.includes(tutorId);
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
    const tutor = tutors.find(t => t.id === tutorId) || tutors[0];
    const now = new Date();
    const cycleEndDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
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

    // Gerar a agenda completa de aulas para o ciclo de 28 dias (ex: 8 aulas)
    const baseSlots = [
      { day: 'Segunda-feira', time: '10:00' },
      { day: 'Quarta-feira', time: '16:00' }
    ];

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
          day: `${s.day} (Semana ${week})`,
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

  const createBooking = ({ tutorId, day, time, allSlots, bookingType, planHours, planName, totalAmount, bypassWallet = false, studentId, studentEmail, studentName, studentMatricula }) => {
    const tutor = tutors.find(t => t.id === tutorId);
    if (!tutor) return { success: false, error: 'Tutor não encontrado' };

    const effectiveStudentId = studentId || student?.id;
    const effectiveStudentEmail = studentEmail || student?.email;
    const effectiveStudentName = studentName || student?.name;
    const effectiveStudentMatricula = studentMatricula || student?.matricula_code;

    if (bookingType === 'trial') {
      if (usedTrials.includes(tutorId)) {
        return {
          success: false,
          error: 'trial_already_used',
          message: 'Você já utilizou sua Aula Experimental única com este professor. Escolha um plano de assinatura de 28 dias para continuar.'
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

      // Descontar saldo de horas de aula
      if (!isTrialBooking) {
        setStudent(prev => {
          const base = prev || { id: 'student-user', name: 'Aluno Lexy', email: 'aluno@lexy.com', walletBalance: 0 };
          return {
            ...base,
            walletBalance: Math.max(0, Number(((base.walletBalance || 0) - totalContractedHours).toFixed(2)))
          };
        });
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
    }

    if (!isTrialBooking && (bookingType === 'package' || bookingType === 'subscription')) {
      const now = new Date();
      const cycleEndDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

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
        planName: planName || `Plano de Aulas (${totalContractedHours} Horas / 28 Dias)`,
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

    // Gerar todas as aulas do ciclo de 28 dias conforme a frequência contratada
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
        const lCode = generateLessonCode(bId);

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

    // Persistir as aulas (incluindo aulas experimentais / trial e paquetes) no Supabase
    try {
      const dbPayload = createdBookings.map(b => ({
        lesson_code: b.lesson_code,
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
        booking_type: b.bookingType || 'trial',
        amount: Number(b.amount || 0),
        status: b.status || 'confirmed'
      }));

      supabase.from('aulas').insert(dbPayload).then(({ error }) => {
        if (error) {
          console.error('❌ Error inserting booking into aulas table:', error);
          const minPayload = createdBookings.map(b => ({
            lesson_code: b.lesson_code,
            student_name: b.studentName || 'Aluno',
            tutor_name: b.tutorName || 'Prof',
            day: b.day || '',
            time: b.time || ''
          }));
          supabase.from('aulas').insert(minPayload).then(({ error: minErr }) => {
            if (minErr) console.error('❌ Supabase minimal insert error:', minErr);
            else console.log('✅ Supabase minimal insert succeeded!');
          });
        } else {
          console.log('✅ Supabase aulas insert succeeded!', dbPayload);
        }
      }).catch(err => console.error('Supabase createBooking insert catch:', err));
    } catch (e) {
      console.error('createBooking DB sync catch:', e);
    }

    return { success: true, booking: createdBookings[0] };
  };

  const updateBookingStatus = (bookingId, newStatus) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return b;
    }));
  };

  const completeBooking = (bookingId) => {
    setBookings(prev => {
      const target = prev.find(b => b.id === bookingId);
      if (target) {
        const tutor = tutors.find(t => t.id === target.tutorId);
        const earned = Number(target.amount || tutor?.hourlyRate || 20);
        
        // Creditar na carteira do professor
        if (target.tutorId) {
          setTutors(tList => tList.map(t => {
            if (t.id === target.tutorId) {
              const currentBal = Number(t.walletBalance || t.wallet_balance || 0);
              const updatedBal = currentBal + earned;
              return {
                ...t,
                walletBalance: updatedBal,
                wallet_balance: updatedBal
              };
            }
            return t;
          }));
        }
      }
      return prev.map(b => b.id === bookingId ? { ...b, status: 'completed', completedAt: new Date().toISOString() } : b);
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
      registerTutor,
      approveTutor,
      rejectTutor,
      updateTutorSchedule,
      incrementTutorLessons,
      registerStudentAccount,
      topUpWallet,
      activateSubscriptionAndCredits,
      createBooking,
      generateLessonCode,
      completeBooking,
      updateBookingStatus,
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
