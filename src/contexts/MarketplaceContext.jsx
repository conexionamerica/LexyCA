import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const DEFAULT_TIER_RATES = {
  trial: 75, // Aula Experimental: 75% Ganho
  tier1: 75, // 0 a 7 Aulas: 75% Ganho
  tier2: 80, // 8 a 15 Aulas: 80% Ganho
  tier3: 85, // 16 a 20 Aulas: 85% Ganho
  tier4: 90, // 21 a 50 Aulas: 90% Ganho
  tier5: 92  // > 50 Aulas: 92% Ganho
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

  // Tutores (Apenas cadastros reais de teste)
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
      id: 'student-demo-1',
      name: 'Gabriel Alumno',
      email: 'aluno@lexy.com',
      walletBalance: 0.00
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

  // Helper for generating initial bookings dynamically matching current week
  const getInitialDefaultBookings = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - currentDay);

    const getDateStr = (dayOffset) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + dayOffset);
      return d.toISOString().split('T')[0];
    };

    return [
      {
        id: 'booking-101',
        tutorId: 'tutor-1',
        studentId: 'stud-1',
        studentName: 'Willyam Giovanni Soares de Castro',
        studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        studentLevel: 'Iniciante',
        day: 'Segunda',
        isoDateStr: getDateStr(1),
        time: '19:15',
        bookingType: 'subscription',
        status: 'agendada',
        createdAt: new Date().toISOString()
      },
      {
        id: 'booking-102',
        tutorId: 'tutor-1',
        studentId: 'stud-1',
        studentName: 'Willyam Giovanni Soares de Castro',
        studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        studentLevel: 'Iniciante',
        day: 'Terça',
        isoDateStr: getDateStr(2),
        time: '19:15',
        bookingType: 'trial',
        status: 'agendada',
        createdAt: new Date().toISOString()
      },
      {
        id: 'booking-103',
        tutorId: 'tutor-1',
        studentId: 'stud-1',
        studentName: 'Willyam Giovanni Soares de Castro',
        studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        studentLevel: 'Iniciante',
        day: 'Terça',
        isoDateStr: getDateStr(2),
        time: '20:00',
        bookingType: 'subscription',
        status: 'agendada',
        createdAt: new Date().toISOString()
      },
      {
        id: 'booking-104',
        tutorId: 'tutor-1',
        studentId: 'stud-2',
        studentName: 'Bruno Heitor de Oliveira',
        studentAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
        studentLevel: 'Intermediário',
        day: 'Terça',
        isoDateStr: getDateStr(2),
        time: '21:00',
        bookingType: 'subscription',
        status: 'agendada',
        createdAt: new Date().toISOString()
      },
      {
        id: 'booking-105',
        tutorId: 'tutor-1',
        studentId: 'stud-1',
        studentName: 'Willyam Giovanni Soares de Castro',
        studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        studentLevel: 'Iniciante',
        day: 'Quarta',
        isoDateStr: getDateStr(3),
        time: '20:00',
        bookingType: 'trial',
        status: 'falta',
        createdAt: new Date().toISOString()
      },
      {
        id: 'booking-106',
        tutorId: 'tutor-1',
        studentId: 'stud-3',
        studentName: 'Gabriel Alumno Silva',
        studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        studentLevel: 'B2 Intermediário',
        day: 'Quinta',
        isoDateStr: getDateStr(4),
        time: '19:15',
        bookingType: 'subscription',
        status: 'cancelada',
        createdAt: new Date().toISOString()
      },
      {
        id: 'booking-107',
        tutorId: 'tutor-1',
        studentId: 'stud-2',
        studentName: 'Bruno Heitor de Oliveira',
        studentAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
        studentLevel: 'Intermediário',
        day: 'Quinta',
        isoDateStr: getDateStr(4),
        time: '21:00',
        bookingType: 'subscription',
        status: 'agendada',
        createdAt: new Date().toISOString()
      },
      {
        id: 'booking-pending-1',
        tutorId: 'tutor-1',
        studentId: 'stud-3',
        studentName: 'Mariana Costa Ferreira',
        studentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        studentLevel: 'Iniciante (A1)',
        day: 'Sexta',
        isoDateStr: getDateStr(5),
        time: '18:00',
        bookingType: 'trial',
        amount: 15.00,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: 'booking-pending-2',
        tutorId: 'tutor-1',
        studentId: 'stud-2',
        studentName: 'Carlos Eduardo Silveira',
        studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        studentLevel: 'Intermediário (B1)',
        day: 'Sábado',
        isoDateStr: getDateStr(6),
        time: '10:00',
        bookingType: 'subscription',
        amount: 23.00,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];
  };

  // Bookings
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BOOKINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error cargando reservas', e);
      }
    }
    return getInitialDefaultBookings();
  });

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
      weeklySchedule: tutorData.weeklySchedule || {
        'Segunda': ['09:00', '10:00', '14:00', '15:00'],
        'Terça': ['09:00', '10:00', '14:00', '15:00'],
        'Quarta': ['09:00', '10:00', '14:00', '15:00'],
        'Quinta': ['09:00', '10:00', '14:00', '15:00'],
        'Sexta': ['09:00', '10:00', '14:00', '15:00']
      },
      earnedBalance: 0,
      reviews: []
    };

    setTutors(prev => [newTutor, ...prev]);
    return newTutor;
  };

  const approveTutor = (tutorId) => {
    setTutors(prev => prev.map(t => t.id === tutorId ? { ...t, status: 'approved', isVerified: true } : t));
  };

  const rejectTutor = (tutorId) => {
    setTutors(prev => prev.map(t => t.id === tutorId ? { ...t, status: 'rejected' } : t));
  };

  const updateTutorSchedule = (tutorId, newSchedule) => {
    setTutors(prev => prev.map(t => t.id === tutorId ? { ...t, weeklySchedule: newSchedule } : t));
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

  const createBooking = ({ tutorId, day, time, bookingType, planHours, totalAmount }) => {
    const tutor = tutors.find(t => t.id === tutorId);
    if (!tutor) return { success: false, error: 'Tutor não encontrado' };

    if (bookingType === 'trial') {
      if (usedTrials.includes(tutorId)) {
        return {
          success: false,
          error: 'trial_already_used',
          message: 'Você já utilizou sua Aula Experimental única com este professor. Escolha um plano de assinatura de 28 dias para continuar.'
        };
      }
    }

    if (student.walletBalance < totalAmount) {
      return { 
        success: false, 
        error: 'insufficient_funds', 
        required: totalAmount, 
        current: student.walletBalance 
      };
    }

    setStudent(prev => ({
      ...prev,
      walletBalance: Number((prev.walletBalance - totalAmount).toFixed(2))
    }));

    if (bookingType === 'trial') {
      setUsedTrials(prev => [...prev, tutorId]);
    }

    if (bookingType === 'package' || bookingType === 'subscription') {
      const now = new Date();
      const cycleEndDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

      const newSub = {
        id: `sub-${Date.now()}`,
        tutorId,
        tutorName: tutor.name,
        tutorAvatar: tutor.avatar,
        tutorSubject: tutor.subject,
        planHours: planHours || 8,
        hoursRemaining: planHours || 8,
        cycleStartDate: now.toISOString(),
        cycleEndDate: cycleEndDate.toISOString(),
        status: 'active'
      };
      setSubscriptions(prev => [newSub, ...prev]);
    }

    const newBooking = {
      id: `booking-${Date.now()}`,
      tutorId,
      tutorName: tutor.name,
      tutorAvatar: tutor.avatar,
      tutorSubject: tutor.subject,
      studentId: student.id,
      day,
      time,
      bookingType,
      amount: totalAmount,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    setBookings(prev => [newBooking, ...prev]);

    if (tutor.weeklySchedule && tutor.weeklySchedule[day]) {
      const updatedSchedule = {
        ...tutor.weeklySchedule,
        [day]: tutor.weeklySchedule[day].filter(slot => slot !== time)
      };
      updateTutorSchedule(tutorId, updatedSchedule);
    }

    return { success: true, booking: newBooking };
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
    updateBookingStatus(bookingId, 'completed');
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

  return (
    <MarketplaceContext.Provider value={{
      tutors,
      student,
      usedTrials,
      subscriptions,
      bookings,
      platformFeePercent,
      setPlatformFeePercent,
      tierRates,
      updateTierRates,
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
      createBooking,
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
