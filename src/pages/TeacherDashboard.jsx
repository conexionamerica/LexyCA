import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMarketplace, getTeacherEarnPercent } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, Clock, DollarSign, Users, Star, 
  CheckCircle2, Video, Sparkles, Settings, Save, AlertCircle, 
  MessageSquare, ChevronRight, UserCheck, ShieldCheck, ArrowRight, X, ExternalLink, Wallet, ArrowUpRight, Check, Award, FileText, Megaphone, Send, TrendingUp, HelpCircle, User, Home,
  ChevronLeft, Grid3x3, List, RefreshCw, Search
} from 'lucide-react';

export default function TeacherDashboard() {
  const { 
    tutors, updateTutorSchedule, bookings, completeBooking, updateBookingStatus, 
    announcements, directChatMessages, sendDirectMessage, acceptBookingRequest, rejectBookingRequest, incrementTutorLessons, tierRates 
  } = useMarketplace();
  
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'inicio';
  const setActiveTab = (tab) => setSearchParams({ tab });

  const MIN_RATE = 13;
  const MAX_RATE = 40;
  const RECOMMENDED_RATE = 23;

  const myStudentsList = [
    {
      id: 'stud-1',
      name: 'Gabriel Alumno Silva',
      email: 'aluno@lexy.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      level: 'B2 Intermediário',
      lessonsCount: 6,
      phone: '+55 (11) 98541-8357'
    },
    {
      id: 'stud-2',
      name: 'Luciana Martins',
      email: 'luciana.martins@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      level: 'A2 Básico',
      lessonsCount: 4,
      phone: '+55 (21) 97412-5589'
    },
    {
      id: 'stud-3',
      name: 'Roberto Santos',
      email: 'roberto.santos@bol.com.br',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      level: 'C1 Avançado',
      lessonsCount: 12,
      phone: '+55 (31) 99823-1122'
    }
  ];

  const [selectedStudentId, setSelectedStudentId] = useState('stud-1');
  const selectedStudent = myStudentsList.find(s => s.id === selectedStudentId) || myStudentsList[0];

  const activeStudentMessages = directChatMessages.filter(msg => 
    msg.studentId === selectedStudentId || (!msg.studentId && selectedStudentId === 'stud-1')
  );

  const teacherMessagesContainerRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'chat' && teacherMessagesContainerRef.current) {
      teacherMessagesContainerRef.current.scrollTop = teacherMessagesContainerRef.current.scrollHeight;
    }
  }, [directChatMessages, selectedStudentId, activeTab]);

  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(() => {
    try {
      const saved = localStorage.getItem('lexy_teacher_dismissed_announcements_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleDismissAnnouncement = (annId) => {
    setDismissedAnnouncements(prev => {
      const updated = [...prev, annId];
      localStorage.setItem('lexy_teacher_dismissed_announcements_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const teacherAnnouncements = (announcements || [])
    .filter(a => a.target === 'teachers')
    .filter(a => !dismissedAnnouncements.includes(a.id));

  const tutor = tutors.find(t => t.email === profile?.email || t.id === profile?.id) || tutors[0] || {
    id: 'tutor-1',
    name: 'María Fernández',
    status: 'approved',
    hourlyRate: 23,
    totalLessons: 12,
    meetUrl: 'https://meet.google.com/abc-defg-hij',
    earnedBalance: 240.00,
    weeklySchedule: {
      'Segunda': ['09:00', '10:00', '14:00', '15:00'],
      'Terça': ['09:00', '10:00', '14:00', '15:00']
    }
  };

  const totalLessons = tutor.totalLessons || 12;
  const currentEarnPercent = getTeacherEarnPercent(totalLessons, false, tierRates);

  const getNextTierInfo = (lessons) => {
    const rates = tierRates || { tier1: 75, tier2: 80, tier3: 85, tier4: 90, tier5: 92 };
    if (lessons < 8) return { target: 8, nextEarn: rates.tier2, remaining: 8 - lessons };
    if (lessons < 16) return { target: 16, nextEarn: rates.tier3, remaining: 16 - lessons };
    if (lessons < 21) return { target: 21, nextEarn: rates.tier4, remaining: 21 - lessons };
    if (lessons < 51) return { target: 51, nextEarn: rates.tier5, remaining: 51 - lessons };
    return { target: 51, nextEarn: rates.tier5, remaining: 0 };
  };

  const nextTier = getNextTierInfo(totalLessons);
  const [earnedBalance, setEarnedBalance] = useState(tutor.earnedBalance || 240.00);

  const [hourlyRate, setHourlyRate] = useState(tutor.hourlyRate || 23);
  const [meetUrl, setMeetUrl] = useState(tutor.meetUrl || 'https://meet.google.com/abc-defg-hij');
  const [isRateSaved, setIsRateSaved] = useState(false);
  const [rateErrorMsg, setRateErrorMsg] = useState('');

  const [schedule, setSchedule] = useState(tutor.weeklySchedule || {});
  const [isScheduleSaved, setIsScheduleSaved] = useState(false);

  const [teacherChatMessage, setTeacherChatMessage] = useState('');

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(100);
  const [payoutMethod, setPayoutMethod] = useState('PIX Brasil 🇧🇷');
  const [pixKey, setPixKey] = useState('maria.tutor@pix.com.br');
  const [payoutRequests, setPayoutRequests] = useState([
    {
      id: 'pay-1',
      date: '10/08/2026',
      amount: 80.00,
      method: 'PIX Brasil 🇧🇷',
      status: 'approved',
      processedAt: '10/08/2026 14:20'
    }
  ]);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('Excelente aula! Gabriel praticou conversação fluida e tempo verbal passado. Demonstrou ótimo domínio do vocabulário corporativo.');
  const [studyTips, setStudyTips] = useState('Revisar a pronúncia das palavras terminadas em -ción e rever o vocabulário de reuniões.');
  const [isClassCompletedState, setIsClassCompletedState] = useState(false);

  // New Dashboard States
  const [agendaViewMode, setAgendaViewMode] = useState('grid'); // 'grid' (Horários de Aula) | 'config' (Editor de Disponibilidade)
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [selectedBookingForModal, setSelectedBookingForModal] = useState(null);

  // Virtual Room & Booking Management States (aluno.conexionamerica.com.br system style)
  const [isVirtualRoomActive, setIsVirtualRoomActive] = useState(false);
  const [roomElapsedSeconds, setRoomElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer = null;
    if (isVirtualRoomActive) {
      timer = setInterval(() => {
        setRoomElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRoomElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVirtualRoomActive]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  const [rescheduleNewDate, setRescheduleNewDate] = useState('');
  const [rescheduleNewTime, setRescheduleNewTime] = useState('');
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [evalRatings, setEvalRatings] = useState({ fala: 5, vocabulario: 4, pronuncia: 4, gramatica: 5 });

  // Dynamic Date calculation helper for 7-day week view
  const getWeekDays = (offset = 0) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, ...
    
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - currentDay + (offset * 7));
    sunday.setHours(0, 0, 0, 0);

    const daysList = [];
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);

      const isToday = d.toDateString() === now.toDateString();
      const dayName = dayNames[d.getDay()];
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = `${dayNum}/${monthNum}`;
      const isoDateStr = `${d.getFullYear()}-${monthNum}-${dayNum}`;

      daysList.push({
        dateObj: d,
        dayName,
        dateStr,
        isoDateStr,
        dayNum: d.getDate(),
        monthName: monthNames[d.getMonth()],
        year: d.getFullYear(),
        isToday
      });
    }

    const firstDay = daysList[0];
    const lastDay = daysList[6];
    let monthYearHeader = `${firstDay.monthName.toLowerCase()} ${firstDay.year}`;
    if (firstDay.monthName !== lastDay.monthName) {
      monthYearHeader = `${firstDay.monthName.toLowerCase()} - ${lastDay.monthName.toLowerCase()} ${lastDay.year}`;
    }

    const rangeBannerStr = `${firstDay.dayNum} de ${firstDay.monthName.toLowerCase()} - ${lastDay.dayNum} de ${lastDay.monthName.toLowerCase()} ${lastDay.year}`;

    return { daysList, monthYearHeader, rangeBannerStr };
  };

  const { daysList, monthYearHeader, rangeBannerStr } = getWeekDays(selectedWeekOffset);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'agendada':
      case 'confirmed':
        return {
          label: 'Agendada',
          bg: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400'
        };
      case 'falta':
      case 'no_show':
        return {
          label: 'Falta / Ausência',
          bg: 'bg-rose-500/20 border-rose-500/50 text-rose-200',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400'
        };
      case 'cancelada':
      case 'canceled':
        return {
          label: 'Cancelada',
          bg: 'bg-amber-500/20 border-amber-500/50 text-amber-200',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400'
        };
      case 'completed':
      case 'concluida':
        return {
          label: 'Concluída',
          bg: 'bg-sky-500/20 border-sky-500/50 text-sky-200',
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          dot: 'bg-sky-400'
        };
      default:
        return {
          label: 'Agendada',
          bg: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400'
        };
    }
  };

  const [welcomeDismissed, setWelcomeDismissed] = useState(
    () => localStorage.getItem('lexy_teacher_welcome_dismissed') === 'true'
  );

  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const ALL_SLOTS = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', 
    '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  const handleDismissWelcome = () => {
    localStorage.setItem('lexy_teacher_welcome_dismissed', 'true');
    setWelcomeDismissed(true);
  };

  const toggleSlot = (day, slot) => {
    setSchedule(prev => {
      const currentSlots = prev[day] || [];
      const updated = currentSlots.includes(slot)
        ? currentSlots.filter(s => s !== slot)
        : [...currentSlots, slot].sort();
      return { ...prev, [day]: updated };
    });
  };

  const handleSelectAllDay = (day) => {
    setSchedule(prev => ({ ...prev, [day]: [...ALL_SLOTS] }));
  };

  const handleClearDay = (day) => {
    setSchedule(prev => ({ ...prev, [day]: [] }));
  };

  const handleSaveSchedule = () => {
    updateTutorSchedule(tutor.id, schedule);
    setIsScheduleSaved(true);
    setTimeout(() => setIsScheduleSaved(false), 3000);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setRateErrorMsg('');

    const rateNum = Number(hourlyRate);
    if (rateNum < MIN_RATE || rateNum > MAX_RATE) {
      setRateErrorMsg(`❌ A tarifa por hora deve estar entre R$ ${MIN_RATE},00 e R$ ${MAX_RATE},00 por hora.`);
      return;
    }

    tutor.hourlyRate = rateNum;
    tutor.meetUrl = meetUrl;
    setIsRateSaved(true);
    setTimeout(() => setIsRateSaved(false), 3000);
  };

  const handleSendTeacherChat = (e) => {
    e.preventDefault();
    if (!teacherChatMessage.trim()) return;

    sendDirectMessage({
      studentId: selectedStudentId,
      senderName: `${tutor.name} (Tutor)`,
      senderRole: 'teacher',
      text: teacherChatMessage
    });
    setTeacherChatMessage('');
  };

  const handleRequestPayout = (e) => {
    e.preventDefault();
    if (payoutAmount > earnedBalance || payoutAmount < 10) return;

    const netValueToReceive = Number((payoutAmount * (currentEarnPercent / 100)).toFixed(2));

    const newReq = {
      id: `pay-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      amount: Number(payoutAmount),
      netAmount: netValueToReceive,
      method: payoutMethod,
      pixKey,
      status: 'pending',
      requestedAt: new Date().toLocaleString()
    };

    setPayoutRequests(prev => [newReq, ...prev]);
    setIsPayoutModalOpen(false);
    setPayoutSuccessMsg(`⌛ Solicitação de resgate de $${payoutAmount} USD enviada à administração! Você receberá $${netValueToReceive} USD em até 24h.`);
    setTimeout(() => setPayoutSuccessMsg(''), 6000);
  };

  const handleSimulateAdminApprove = (reqId) => {
    setPayoutRequests(prev => prev.map(r => {
      if (r.id === reqId && r.status === 'pending') {
        setEarnedBalance(current => Math.max(0, current - r.amount));
        return {
          ...r,
          status: 'approved',
          processedAt: new Date().toLocaleString()
        };
      }
      return r;
    }));
  };

  const [earningsHistory, setEarningsHistory] = useState([
    {
      id: 'earn-101',
      studentName: 'Gabriel Alumno Silva',
      studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      date: '11/08/2026 às 15:00',
      classType: 'Assinatura 28 dias',
      durationMinutes: 50,
      durationFormatted: '50 min',
      grossAmount: 23.00,
      fee: 0,
      netAmount: Number((23.00 * (currentEarnPercent / 100)).toFixed(2)),
      status: 'Liberado (Feedback Enviado ✓)',
      feedback: 'Excelente aula! Praticamos conversação fluida.'
    }
  ]);

  const [nowTimer, setNowTimer] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimer(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const getBookingCountdownAndStatus = (booking) => {
    if (!booking) return { statusText: '', isExpired: false, isLive: false, timeBadge: '' };

    let targetDate = null;
    if (booking.isoDateStr && booking.time) {
      const [hours, minutes] = booking.time.split(':').map(Number);
      const [year, month, day] = booking.isoDateStr.split('-').map(Number);
      targetDate = new Date(year, month - 1, day, hours || 0, minutes || 0);
    } else if (booking.time) {
      const [hours, minutes] = booking.time.split(':').map(Number);
      const now = new Date();
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours || 0, minutes || 0);
    }

    if (!targetDate || isNaN(targetDate.getTime())) {
      return { 
        statusText: `Hoje às ${booking.time || '19:00'}`, 
        isExpired: false, 
        isLive: false, 
        timeBadge: `⏱️ Inicia em breve` 
      };
    }

    const now = new Date(nowTimer);
    const diffMs = targetDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < -10) {
      return {
        statusText: 'Aula Concluída / Passou de 10 min',
        isExpired: true,
        isLive: false,
        timeBadge: '⏱️ Encerrada'
      };
    }

    if (diffMins <= 0 && diffMins >= -10) {
      const elapsed = Math.abs(diffMins);
      return {
        statusText: `🔴 AO VIVO • Iniciou há ${elapsed === 0 ? 'poucos segundos' : `${elapsed} min`} (Exibindo no destaque)`,
        isExpired: false,
        isLive: true,
        timeBadge: `🔴 AO VIVO (${elapsed} min)`
      };
    }

    if (diffMins < 60) {
      return {
        statusText: `⏱️ Inicia em ${diffMins} minuto${diffMins > 1 ? 's' : ''}`,
        isExpired: false,
        isLive: false,
        timeBadge: `⏱️ Inicia em ${diffMins} min`
      };
    }

    const hoursLeft = Math.floor(diffMins / 60);
    const minsLeft = diffMins % 60;
    if (hoursLeft < 24) {
      return {
        statusText: `⏱️ Inicia em ${hoursLeft}h ${minsLeft > 0 ? `${minsLeft}m` : ''}`,
        isExpired: false,
        isLive: false,
        timeBadge: `⏱️ Inicia em ${hoursLeft}h`
      };
    }

    const daysLeft = Math.floor(hoursLeft / 24);
    return {
      statusText: `📅 Inicia em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`,
      isExpired: false,
      isLive: false,
      timeBadge: `📅 Inicia em ${daysLeft}d`
    };
  };

  const generateTimeSlots15Min = () => {
    const slots = [];
    for (let hour = 7; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 23 && minute > 45) break;
        slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
      }
    }
    return slots;
  };
  const TIME_SLOTS_15MIN = generateTimeSlots15Min();

  const userTimeZone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
  const [currentTimeStr, setCurrentTimeStr] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  const [agendaDisplayMode, setAgendaDisplayMode] = useState('week'); // 'week' | 'list'
  const currentTimeRef = useRef(null);
  const gridContainerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getCurrentTimePosition = () => {
    const [hours, minutes] = currentTimeStr.split(':').map(Number);
    const currentTotalMinutes = hours * 60 + minutes;
    const slotStartMinutes = 7 * 60;
    const slotEndMinutes = 24 * 60;

    if (currentTotalMinutes < slotStartMinutes || currentTotalMinutes > slotEndMinutes) {
      return null;
    }

    const minutesSinceStart = currentTotalMinutes - slotStartMinutes;
    const slotIndex = Math.floor(minutesSinceStart / 15);
    const minutesIntoSlot = minutesSinceStart % 15;
    const percentageIntoSlot = (minutesIntoSlot / 15) * 100;

    return { slotIndex, percentageIntoSlot };
  };

  useEffect(() => {
    if (currentTimeRef.current && gridContainerRef.current && selectedWeekOffset === 0) {
      setTimeout(() => {
        currentTimeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }, [agendaViewMode, agendaDisplayMode, selectedWeekOffset]);

  const [gridFilterMode, setGridFilterMode] = useState('all');

  const getGridTimeSlots = () => {
    const fullDaySlots = [
      '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
      '19:00', '19:15', '19:30', '19:45',
      '20:00', '20:15', '20:30', '20:45',
      '21:00', '21:15', '22:00', '23:00'
    ];

    const bookedTimes = bookings.map(b => b.time).filter(Boolean);
    const configSlots = Object.values(schedule || {}).flat().filter(Boolean);
    const allSlotsCombined = Array.from(new Set([...fullDaySlots, ...bookedTimes, ...configSlots]));

    const sortedSlots = allSlotsCombined.sort((a, b) => {
      const [hA, mA] = a.split(':').map(Number);
      const [hB, mB] = b.split(':').map(Number);
      if (hA !== hB) return hA - hB;
      return mA - mB;
    });

    if (gridFilterMode === 'active_only') {
      const activeTimesSet = new Set([...bookedTimes, ...configSlots]);
      const filtered = sortedSlots.filter(s => activeTimesSet.has(s));
      return filtered.length > 0 ? filtered : sortedSlots;
    }

    return sortedSlots;
  };

  const gridTimeSlots = getGridTimeSlots();

  const pendingRequests = bookings.filter(b => (b.tutorId === tutor.id || true) && (b.status === 'pending' || b.status === 'solicitada'));
  const tutorBookings = bookings.filter(b => (b.tutorId === tutor.id || true) && (b.status === 'confirmed' || b.status === 'agendada' || b.status === 'rescheduled'));
  
  // Filter active bookings that are NOT expired by more than 10 mins and NOT completed
  const activeTutorBookings = tutorBookings.filter(b => {
    if (b.status === 'completed' || b.status === 'concluida' || b.status === 'rejected' || b.status === 'cancelada') return false;
    const timing = getBookingCountdownAndStatus(b);
    return !timing.isExpired;
  });

  const nextBooking = activeTutorBookings[0] || tutorBookings[0] || {
    id: 'booking-demo-1',
    studentName: 'Gabriel Alumno',
    studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    day: 'Hoje',
    time: '15:00',
    amount: tutor.hourlyRate || hourlyRate || 23,
    bookingType: 'subscription',
    status: 'confirmed'
  };

  const nextBookingTiming = getBookingCountdownAndStatus(nextBooking);
  const upcomingBookings = tutorBookings.filter(b => b.id !== nextBooking?.id && b.status !== 'completed' && b.status !== 'concluida');

  const handleAcceptRequest = (reqId, studentName, day, time) => {
    acceptBookingRequest(reqId);
    setPayoutSuccessMsg(`🎉 Solicitação de ${studentName} aceita! A aula foi agendada para ${day} às ${time} e o horário foi reservado em sua agenda.`);
    setTimeout(() => setPayoutSuccessMsg(''), 6000);
  };

  const handleRejectRequest = (reqId, studentName) => {
    rejectBookingRequest(reqId);
    setPayoutSuccessMsg(`⚠️ Solicitação de ${studentName} recusada. Notificação enviada ao aluno.`);
    setTimeout(() => setPayoutSuccessMsg(''), 6000);
  };

  const isNextTrial = nextBooking.bookingType === 'trial';
  const classEarnPercent = getTeacherEarnPercent(totalLessons, isNextTrial, tierRates);
  const rawNextAmount = Number(nextBooking.amount || tutor.hourlyRate || hourlyRate || 23);
  const netEarningsNextClass = isNaN(rawNextAmount * (classEarnPercent / 100))
    ? (23 * (classEarnPercent / 100)).toFixed(2)
    : (rawNextAmount * (classEarnPercent / 100)).toFixed(2);

  const handleOpenFeedbackModal = () => {
    setIsFeedbackModalOpen(true);
  };

  const handleSubmitFeedbackAndCompleteClass = (e) => {
    e.preventDefault();

    const durationMins = nextBooking.durationMinutes || 50;

    incrementTutorLessons(tutor.id);
    setEarnedBalance(prev => Number((prev + netEarningsNextClass).toFixed(2)));

    const newEarnItem = {
      id: `earn-${Date.now()}`,
      studentName: nextBooking.studentName,
      studentAvatar: nextBooking.studentAvatar,
      date: `${nextBooking.day} às ${nextBooking.time}`,
      classType: isNextTrial ? 'Aula Experimental' : 'Assinatura 28 dias',
      durationMinutes: durationMins,
      durationFormatted: `${durationMins} min`,
      grossAmount: nextBooking.amount,
      fee: 0,
      netAmount: netEarningsNextClass,
      status: 'Liberado (Feedback Enviado ✓)',
      feedback: feedbackText
    };

    setEarningsHistory(prev => [newEarnItem, ...prev]);
    setIsClassCompletedState(true);
    setIsFeedbackModalOpen(false);
    
    completeBooking(nextBooking.id);

    setPayoutSuccessMsg(`🎉 Aula Concluída & Feedback Obrigatório Enviado! Tempo contabilizado: ${durationMins} min. +$${netEarningsNextClass} USD adicionados ao seu Saldo Payout!`);
    setTimeout(() => setPayoutSuccessMsg(''), 6000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4 animate-fade-in-up">

      {/* HEADER DE BIENVENIDA Y SALUDO (MOSTRADO ÚNICAMENTE EN LA PESTAÑA INÍCIO) */}
      {activeTab === 'inicio' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-3.5">
            <img
              src={(tutor.avatar && tutor.avatar.length > 10) ? tutor.avatar : (profile?.avatar_url && profile.avatar_url.length > 10) ? profile.avatar_url : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
              alt={tutor.name || profile?.full_name || 'Professor'}
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'; }}
              className="w-12 h-12 rounded-full border border-amber-400/50 object-cover ring-2 ring-amber-500/40 shrink-0"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white">
                Olá, {profile?.full_name || tutor.name || 'Professor'}! 👋
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Painel do Tutor • Gerencie sua agenda, acompanhe alunos e solicite saques.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              tutor.status === 'approved' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {tutor.status === 'approved' ? '● Tutor Verificado' : '⌛ Perfil em Análise'}
            </span>
          </div>
        </div>
      )}

      {/* CONTEÚDO DAS ABAS */}
      <div className="mt-4">
        
        {/* ABA 1: INÍCIO (DISPOSIÇÃO 2 COLUNAS LIMPAS) */}
        {activeTab === 'inicio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* COLUNA PRINCIPAL (span-2) */}
            <div className="lg:col-span-2 space-y-4">
              
              {tutor.status === 'pending' && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-xl flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white text-xs">Perfil em Análise pela Coordenação</h3>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      Seu cadastro foi recebido. Você já pode configurar seus horários e tarifa.
                    </p>
                  </div>
                </div>
              )}

              {!welcomeDismissed && (
                <div className="bg-slate-900/40 backdrop-blur-md border border-amber-500/20 rounded-xl p-4 relative space-y-2">
                  <button onClick={handleDismissWelcome} className="absolute top-3 right-3 text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-semibold uppercase">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Bem-vindo ao Painel do Professor</span>
                  </div>
                  <h2 className="text-sm font-semibold text-white">Pronto para começar a lecionar na Lexy?</h2>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    1. Acesse a aba <strong>Agenda</strong> para definir sua disponibilidade. 
                    2. Vá em <strong>Perfil</strong> para configurar sua tarifa. 
                    3. Na aba <strong>Ganhos</strong>, você acompanha e solicita seus resgates por PIX!
                  </p>
                </div>
              )}

              {payoutSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-xl flex items-center gap-2 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{payoutSuccessMsg}</span>
                </div>
              )}

              {teacherAnnouncements.map(ann => (
                <div key={ann.id} className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl flex items-center justify-between gap-3 relative group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-xs">{ann.title}</h3>
                      <p className="text-[11px] text-slate-300 mt-0.5">{ann.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-medium">
                      Anúncio
                    </span>
                    <button
                      onClick={() => handleDismissAnnouncement(ann.id)}
                      title="Fechar anúncio"
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4 text-slate-400 hover:text-white" />
                    </button>
                  </div>
                </div>
              ))}



              {/* HERO CARD PRÓXIMA AULA */}
              {nextBooking ? (
                <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800/80 shadow-xl shadow-black/40 rounded-xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        ● Próxima Aula
                      </span>
                      {nextBookingTiming.timeBadge && (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          nextBookingTiming.isLive 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}>
                          {nextBookingTiming.timeBadge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      Repasse: <strong className="text-emerald-400">${netEarningsNextClass} USD</strong> ({classEarnPercent}%)
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img 
                        src={nextBooking.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} 
                        alt={nextBooking.studentName}
                        className="w-12 h-12 rounded-full border border-amber-400/50 object-cover ring-2 ring-amber-500/40 shrink-0" 
                      />
                      <div>
                        <h3 className="text-base font-semibold text-white">Aluno: {nextBooking.studentName}</h3>
                        <p className="text-amber-400 text-xs font-medium">
                          Aula Individual • Nível Intermediário
                        </p>
                        <p className="text-slate-300 text-xs mt-0.5 flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{nextBooking.colDateStr || nextBooking.day} às {nextBooking.time}</span>
                        </p>
                        {nextBookingTiming.statusText && (
                          <p className={`text-[11px] font-bold mt-1 flex items-center gap-1 ${
                            nextBookingTiming.isLive ? 'text-rose-400 animate-pulse' : 'text-amber-300'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{nextBookingTiming.statusText}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <a
                        href={`/classroom/${nextBooking.id}`}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-md text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Entrar na Aula</span>
                      </a>

                      {!isClassCompletedState ? (
                        <button
                          onClick={handleOpenFeedbackModal}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Concluir Aula</span>
                        </button>
                      ) : (
                        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1">
                          ✓ Concluída
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 shadow-xl shadow-black/40 rounded-xl p-5 text-center space-y-2">
                  <Calendar className="w-8 h-8 text-amber-400 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">Nenhuma aula agendada para hoje 🌟</h3>
                  <p className="text-xs text-slate-400">Verifique sua agenda e mantenha seus horários abertos para novos alunos!</p>
                </div>
              )}

              {/* CARD AULAS A SEGUIR / PRÓXIMAS AULAS AGENDADAS */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 shadow-xl shadow-black/40 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>Aulas Agendadas a Seguir</span>
                  </h3>
                  <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                    {upcomingBookings.length} aulas encontradas
                  </span>
                </div>

                {upcomingBookings.length === 0 ? (
                  <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">Nenhuma outra aula agendada a seguir</p>
                    <p className="text-[11px] text-slate-500">Mantenha seus horários atualizados na aba Agenda para receber novos agendamentos.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {upcomingBookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        className="bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={booking.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} 
                            alt={booking.studentName} 
                            className="w-10 h-10 rounded-full object-cover border border-cyan-400/40 shrink-0" 
                          />
                          <div>
                            <h4 className="font-bold text-white text-xs">{booking.studentName}</h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="text-cyan-300 font-semibold">{booking.studentLevel || 'Aluno'}</span>
                              <span>• {booking.bookingType === 'trial' ? 'Aula Experimental' : 'Aula Individual'}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>{booking.colDateStr || booking.day} às {booking.time}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => setSelectedBookingForModal(booking)}
                            className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                          >
                            Detalhes
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBookingForModal(booking);
                              setIsVirtualRoomActive(true);
                            }}
                            className="flex-1 sm:flex-initial bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black px-4 py-1.5 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Entrar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* COLUNA LATERAL (SIDEBAR DE STATUS & CONFIGURAÇÕES RÁPIDAS) */}
            <div className="space-y-4">
              
              {/* CARD SOLICITAÇÕES DE AULAS PENDENTES (MOVIDO PARA A DIREITA) */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-amber-500/30 shadow-xl shadow-black/40 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Solicitações Pendentes</span>
                  </h3>
                  <span className="text-[10px] text-amber-300 font-extrabold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    {pendingRequests.length} solicitações
                  </span>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">Nenhuma solicitação pendente</p>
                    <p className="text-[11px] text-slate-500">Novas solicitações de alunos aparecerão aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((req) => (
                      <div 
                        key={req.id} 
                        className="bg-slate-950/80 border border-amber-500/20 hover:border-amber-500/40 rounded-xl p-3.5 space-y-3 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={req.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} 
                            alt={req.studentName} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-amber-400/50 shrink-0" 
                          />
                          <div>
                            <h4 className="font-bold text-white text-xs">{req.studentName}</h4>
                            <span className="inline-block bg-amber-500/20 text-amber-300 text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-amber-500/30 mt-0.5">
                              {req.bookingType === 'trial' ? '⭐ Aula Experimental' : '📦 Plano Mensal'}
                            </span>
                            <p className="text-[11px] text-amber-200 mt-1 flex items-center gap-1 font-bold">
                              <Calendar className="w-3 h-3 text-amber-400" />
                              <span>{req.colDateStr || req.day} às {req.time}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                          <button
                            onClick={() => handleRejectRequest(req.id, req.studentName)}
                            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Recusar</span>
                          </button>
                          <button
                            onClick={() => handleAcceptRequest(req.id, req.studentName, req.colDateStr || req.day, req.time)}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black py-1.5 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aceitar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>


              {/* CARD GAMIFICAÇÃO / NÍVEL */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 shadow-xl shadow-black/40 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white flex items-center gap-1">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Nível de Professor</span>
                  </span>
                  <span className="text-amber-400 font-bold">{currentEarnPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (totalLessons / nextTier.target) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {nextTier.remaining > 0 
                    ? `Faltam ${nextTier.remaining} aulas para atingir o nível de ${nextTier.nextEarn}% de repasse!` 
                    : '🎉 Você atingiu o nível máximo de repasse!'}
                </p>
              </div>

            </div>

          </div>
        )}

        {/* ABA: AGENDA (RÉPLICA EXACTA DE ALUNO.CONEXIONAMERICA.COM.BR) */}
        {activeTab === 'agenda' && (
          <div className="animate-fade-in-up w-full max-w-7xl mx-auto space-y-4">
            
            {/* CONTAINER PRINCIPAL */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl">
              
              {/* BARRA SUPERIOR DE NAVEGAÇÃO E CONTROLES */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-amber-400" />
                    Horários de Aula
                  </h2>
                  <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Horário do seu dispositivo: <strong className="text-amber-400 font-mono font-bold text-xs">{currentTimeStr}</strong> <span className="text-slate-500 font-mono text-[10px]">({userTimeZone})</span></span>
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Navegação Mês */}
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-300">
                    <button
                      onClick={() => setSelectedWeekOffset(prev => prev - 4)}
                      className="p-1 hover:text-white cursor-pointer font-bold"
                      title="Mês anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-extrabold text-amber-300 min-w-[110px] text-center capitalize">
                      {monthYearHeader}
                    </span>
                    <button
                      onClick={() => setSelectedWeekOffset(prev => prev + 4)}
                      className="p-1 hover:text-white cursor-pointer font-bold"
                      title="Próximo mês"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Navegação Semana */}
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-300">
                    <button
                      onClick={() => setSelectedWeekOffset(prev => prev - 1)}
                      className="p-1 hover:text-white cursor-pointer font-bold"
                      title="Semana anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedWeekOffset(0)}
                      className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer uppercase"
                    >
                      Hoje
                    </button>
                    <span className="font-extrabold text-slate-200 min-w-[190px] text-center">
                      {rangeBannerStr}
                    </span>
                    <button
                      onClick={() => setSelectedWeekOffset(prev => prev + 1)}
                      className="p-1 hover:text-white cursor-pointer font-bold"
                      title="Próxima semana"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Botão Atualizar Horários */}
                  <button
                    onClick={() => setAgendaViewMode(agendaViewMode === 'config' ? 'grid' : 'config')}
                    className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{agendaViewMode === 'config' ? '← Voltar à Agenda' : 'Atualizar Horários'}</span>
                  </button>

                  {/* Alternador de Modo de Vista (Grid3x3 vs List) */}
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                    <button
                      onClick={() => { setAgendaViewMode('grid'); setAgendaDisplayMode('week'); }}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        agendaDisplayMode === 'week' && agendaViewMode === 'grid'
                          ? 'bg-sky-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Visão Grade (Semanal)"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setAgendaViewMode('grid'); setAgendaDisplayMode('list'); }}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        agendaDisplayMode === 'list' && agendaViewMode === 'grid'
                          ? 'bg-sky-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Visão Lista"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* EDITOR DE CONFIGURAÇÃO DE HORÁRIOS */}
              {agendaViewMode === 'config' ? (
                <div className="space-y-6 pt-2">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-cyan-400" />
                        Editor de Disponibilidade Semanal (07:00 às 23:00)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Selecione os horários abertos (verde) em que você está disponível para lecionar.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveSchedule}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Salvar Agenda</span>
                    </button>
                  </div>

                  {isScheduleSaved && (
                    <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Agenda de horários salva com sucesso! Os alunos já podem agendar nesses horários.</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {days.map(day => {
                      const activeCount = (schedule[day] || []).length;
                      return (
                        <div key={day} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-amber-400">{day}</span>
                              <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800 font-semibold">
                                {activeCount} horários ativos
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                              <button onClick={() => handleSelectAllDay(day)} className="text-cyan-400 font-bold hover:underline cursor-pointer">Marcar Todos</button>
                              <span className="text-slate-600">|</span>
                              <button onClick={() => handleClearDay(day)} className="text-slate-400 font-bold hover:underline cursor-pointer">Limpar</button>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-1.5">
                            {ALL_SLOTS.map(slot => {
                              const isActive = (schedule[day] || []).includes(slot);
                              return (
                                <button
                                  key={slot}
                                  onClick={() => toggleSlot(day, slot)}
                                  className={`py-2 rounded-xl text-[11px] font-mono font-extrabold transition-all cursor-pointer ${
                                    isActive
                                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black hover:bg-emerald-400'
                                      : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-200'
                                  }`}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : agendaDisplayMode === 'list' ? (
                /* VISÃO EM LISTA DE AULAS */
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-white">Lista de Aulas da Semana ({rangeBannerStr})</h3>
                  {tutorBookings.length > 0 ? (
                    <div className="space-y-2">
                      {tutorBookings.map(b => {
                        const badge = getStatusBadge(b.status);
                        return (
                          <div 
                            key={b.id} 
                            onClick={() => setSelectedBookingForModal(b)}
                            className="bg-slate-950 border border-slate-800 hover:border-cyan-500/40 p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <img src={b.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} alt={b.studentName} className="w-10 h-10 rounded-full object-cover border border-cyan-400/40" />
                              <div>
                                <h4 className="font-extrabold text-white text-xs">{b.studentName}</h4>
                                <p className="text-[11px] text-slate-400">{b.studentLevel || 'Iniciante'} • {b.colDateStr || b.day} às {b.time}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.badgeBg}`}>
                              {badge.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                      Nenhuma aula agendada para esta semana.
                    </div>
                  )}
                </div>
              ) : (
                /* VISÃO EM GRADE COM LINHA VERMELHA DE TEMPO AO VIVO */
                <div className="space-y-3">
                  {/* Legenda de Estados */}
                  <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider shrink-0">Legenda:</span>
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-emerald-300 font-semibold text-[11px] shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>🟢 Agendada</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg text-rose-300 font-semibold text-[11px] shrink-0">
                        <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                        <span>🔴 Falta</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg text-amber-300 font-semibold text-[11px] shrink-0">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>🟡 Cancelada</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-lg text-sky-300 font-semibold text-[11px] shrink-0">
                        <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                        <span>🔵 Concluída</span>
                      </div>
                    </div>
                  </div>

                  {/* MATRIZ SEGUINTE DE HORA AO VIVO */}
                  <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/90 shadow-inner">
                    <div ref={gridContainerRef} className="relative max-h-[620px] overflow-y-auto min-w-[980px]">
                      <table className="w-full border-collapse text-left">
                        <thead className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 shadow">
                          <tr>
                            <th className="p-3 text-[11px] font-black text-slate-400 uppercase tracking-wider w-20 border-r border-slate-800 text-center">
                              Horário
                            </th>
                            {daysList.map((d) => (
                              <th
                                key={d.dayName}
                                className={`p-3 text-center border-r border-slate-800 last:border-r-0 ${
                                  d.isToday ? 'bg-amber-500/10 border-b-2 border-b-amber-400' : ''
                                }`}
                              >
                                <div className="flex flex-col items-center">
                                  <span className={`text-xs font-black ${d.isToday ? 'text-amber-300 font-extrabold' : 'text-slate-200'}`}>
                                    {d.dayName}
                                  </span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[10px] text-slate-400 font-mono font-medium">{d.dateStr}</span>
                                    {d.isToday && (
                                      <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 rounded uppercase tracking-wider shadow-sm">
                                        HOJE
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-xs">
                          {TIME_SLOTS_15MIN.map((slotTime, timeIdx) => {
                            const timePosition = getCurrentTimePosition();
                            const isCurrentTimeSlot = timePosition && timePosition.slotIndex === timeIdx;

                            return (
                              <tr 
                                key={slotTime} 
                                ref={isCurrentTimeSlot ? currentTimeRef : null}
                                className="hover:bg-slate-900/40 transition-colors relative min-h-[48px]"
                              >
                                {/* LINHA VERMELHA DE TEMPO ATUAL AO VIVO (EXACT MATCH ALUNO.CONEXIONAMERICA) */}
                                {isCurrentTimeSlot && selectedWeekOffset === 0 && (
                                  <td colSpan={8} className="p-0 border-none absolute left-0 right-0 z-30 pointer-events-none" style={{ top: `${timePosition.percentageIntoSlot}%` }}>
                                    <div className="flex items-center w-full">
                                      <div className="w-[80px] flex items-center justify-end pr-1.5 shrink-0">
                                        <span className="text-[9px] text-rose-300 font-black bg-rose-950/90 border border-rose-500/60 px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                                          {currentTimeStr}
                                        </span>
                                      </div>
                                      <div className="flex-1 h-[2px] bg-rose-500 relative shadow-[0_0_8px_rgba(244,63,94,0.9)]">
                                        <div className="absolute left-0 -top-[3px] w-2.5 h-2.5 bg-rose-500 rounded-full border border-white shadow"></div>
                                      </div>
                                    </div>
                                  </td>
                                )}

                                {/* Coluna de Hora */}
                                <td className="p-2 text-center font-mono font-extrabold text-slate-400 border-r border-slate-800 bg-slate-900/40 text-[11px] w-20 shrink-0">
                                  {slotTime}
                                </td>

                                {/* 7 Colunas de Ddias */}
                                {daysList.map((col) => {
                                  const cellBookings = bookings.filter(b => {
                                    const dateMatch = b.isoDateStr 
                                      ? (b.isoDateStr === col.isoDateStr) 
                                      : (b.day === col.dayName && selectedWeekOffset === 0);
                                    const timeMatch = b.time === slotTime;
                                    return dateMatch && timeMatch;
                                  });

                                  const isHourSlotActiveInSchedule = (schedule[col.dayName] || []).includes(slotTime) || (schedule[col.dayName] || []).includes(slotTime.substring(0, 2) + ':00');

                                  return (
                                    <td
                                      key={col.dayName}
                                      className={`p-1 border-r border-slate-800 last:border-r-0 align-top min-h-[48px] ${
                                        col.isToday ? 'bg-amber-500/[0.03]' : ''
                                      }`}
                                    >
                                      {cellBookings.length > 0 ? (
                                        <div className="space-y-1">
                                          {cellBookings.map(b => {
                                            const badge = getStatusBadge(b.status);
                                            return (
                                              <div
                                                key={b.id}
                                                onClick={() => setSelectedBookingForModal({ ...b, colDateStr: col.dateStr })}
                                                className={`p-2 rounded-xl border text-[11px] leading-tight transition-all hover:scale-[1.02] cursor-pointer shadow-md ${badge.bg}`}
                                              >
                                                <div className="font-extrabold truncate flex items-center justify-between gap-1">
                                                  <span className="truncate">{b.studentName}</span>
                                                  <span className={`w-2 h-2 rounded-full ${badge.dot} shrink-0`} title={badge.label}></span>
                                                </div>
                                                <div className="text-[9px] opacity-90 mt-1 font-medium flex items-center justify-between gap-1">
                                                  <span className="truncate">{b.studentLevel || 'Iniciante'}</span>
                                                  <span className={`font-extrabold uppercase text-[8px] px-1 py-0.5 rounded border ${badge.badgeBg}`}>
                                                    {badge.label.split(' ')[0]}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : isHourSlotActiveInSchedule ? (
                                        <div className="h-full min-h-[36px] rounded-lg border border-dashed border-emerald-500/20 bg-emerald-500/[0.03] p-1 flex items-center justify-center text-[10px] text-emerald-400/60 font-semibold">
                                          <span>Livre</span>
                                        </div>
                                      ) : (
                                        <div className="h-full min-h-[36px]"></div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ABA 3: ALUNOS (LISTA COMPLETA DE ALUNOS MATRICULADOS) */}
        {activeTab === 'alunos' && (
          <div className="animate-fade-in-up max-w-5xl mx-auto space-y-5">
            {/* HEADER Y ESTADÍSTICAS RÁPIDAS */}
            <div className="glass-panel rounded-3xl p-6 border border-cyan-500/30 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    Meus Alunos Registrados
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Acompanhe a lista de alunos matriculados, seus níveis e histórico de aulas.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('chat')}
                  className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Abrir Central de Chat</span>
                </button>
              </div>

              {/* METRICAS DE ALUNOS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Alunos</span>
                  <span className="text-xl font-black text-white">{myStudentsList.length}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Aulas dadas</span>
                  <span className="text-xl font-black text-emerald-400">{totalLessons}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Presença Média</span>
                  <span className="text-xl font-black text-cyan-400">98.5%</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Avaliação Média</span>
                  <span className="text-xl font-black text-amber-400">4.9 ★</span>
                </div>
              </div>

              {/* TARJETAS DE LISTA DE ALUMNOS (EM FILA ÚNICA) */}
              <div className="flex flex-col space-y-3">
                {myStudentsList.map(st => (
                  <div key={st.id} className="bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-md">
                    <div className="flex items-center gap-3.5">
                      <img src={st.avatar} alt={st.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-cyan-400/40 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-extrabold text-white">{st.name}</h3>
                          <span className="bg-cyan-500/10 text-cyan-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30">
                            {st.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-1 flex-wrap">
                          <span>12 aulas completadas</span>
                          <span className="text-slate-700">•</span>
                          <span>Status: <strong className="text-emerald-400 font-semibold">Ativo (Plano Mensal)</strong></span>
                          <span className="text-slate-700">•</span>
                          <span className="font-mono text-slate-400">Última aula: Ontem</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                      <button
                        onClick={() => {
                          setSelectedStudentId(st.id);
                          setActiveTab('chat');
                        }}
                        className="flex-1 md:flex-initial bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Conversar no Chat</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('agenda')}
                        className="flex-1 md:flex-initial bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Ver Agenda</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: CHAT (EXACT REPLICA DO ALUNO.CONEXIONAMERICA) */}
        {activeTab === 'chat' && (
          <div className="animate-fade-in-up w-full max-w-6xl mx-auto">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[700px] max-h-[82vh]">
              
              {/* SIDEBAR DA ESQUERDA - LISTA DE CONVERSAS COM ALUNOS */}
              <div className="w-full md:w-[320px] lg:w-[360px] border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/80 flex flex-col shrink-0">
                
                {/* Header da Sidebar */}
                <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
                  <h3 className="font-black text-white text-base flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-400" />
                    <span>Conversas ({myStudentsList.length})</span>
                  </h3>
                </div>

                {/* Barra de Pesquisa */}
                <div className="p-3 border-b border-slate-800/60 bg-slate-950">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Pesquisar aluno..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                {/* Lista de Conversas com Alunos */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-900/80 scrollbar-none">
                  {myStudentsList.map(st => {
                    const isSelected = selectedStudentId === st.id;
                    const studentMsgs = (directChatMessages || []).filter(m => m.studentId === st.id);
                    const lastMsg = studentMsgs[studentMsgs.length - 1];

                    return (
                      <div
                        key={st.id}
                        onClick={() => setSelectedStudentId(st.id)}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all relative ${
                          isSelected
                            ? 'bg-amber-500/10 border-l-4 border-amber-400'
                            : 'hover:bg-slate-900/50'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={st.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                            alt={st.name}
                            className="w-11 h-11 rounded-full object-cover border border-slate-700"
                          />
                          <span className="w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full absolute bottom-0 right-0"></span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                              {st.name}
                            </h4>
                            {lastMsg && (
                              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                {lastMsg.timestamp ? lastMsg.timestamp.split(' ')[0] : 'Hoje'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {lastMsg ? lastMsg.text : `Iniciar conversa com ${st.name.split(' ')[0]}...`}
                          </p>
                          <span className="inline-block text-[9px] font-semibold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20 mt-1">
                            {st.level}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ÁREA PRINCIPAL DO CHAT DA DIREITA (ESTILO ALUNO.CONEXIONAMERICA) */}
              <div className="flex-1 flex flex-col bg-slate-950/40 relative">
                
                {/* Header do Chat Ativo */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedStudent.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                      alt={selectedStudent.name}
                      className="w-10 h-10 rounded-full object-cover border border-amber-400/40"
                    />
                    <div>
                      <h3 className="text-sm font-extrabold text-white">{selectedStudent.name}</h3>
                      <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>{selectedStudent.level} • Aluno Ativo</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Área de Mensagens (Thread) */}
                <div 
                  ref={teacherMessagesContainerRef} 
                  className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-950/60"
                >
                  <div className="flex justify-center my-2">
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-900/80 border border-slate-800/80 px-3 py-1 rounded-full">
                      Hoje
                    </span>
                  </div>

                  {activeStudentMessages.length > 0 ? (
                    activeStudentMessages.map(msg => {
                      const isTeacher = msg.senderRole === 'teacher';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isTeacher ? 'justify-end' : 'justify-start'} w-full`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-md space-y-1 ${
                              isTeacher
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-tr-sm'
                                : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                            }`}
                          >
                            <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                            
                            <div className={`flex items-center justify-end gap-1 text-[10px] ${
                              isTeacher ? 'text-slate-950/80 font-bold' : 'text-slate-400'
                            }`}>
                              <span>{msg.timestamp || 'Agora'}</span>
                              {isTeacher && (
                                <span className="text-slate-950 font-black">✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                      <MessageSquare className="w-12 h-12 text-slate-700 opacity-40" />
                      <p className="font-semibold text-slate-400">Nenhuma mensagem anterior com {selectedStudent.name}.</p>
                      <p className="text-[11px] text-slate-500">Envie a primeira mensagem para iniciar a conversa.</p>
                    </div>
                  )}
                </div>

                {/* Footer do Chat (Input + Botão Enviar Circular) */}
                <div className="p-3 bg-slate-900/90 border-t border-slate-800 shrink-0">
                  <form onSubmit={handleSendTeacherChat} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={teacherChatMessage}
                      onChange={(e) => setTeacherChatMessage(e.target.value)}
                      placeholder={`Digitar mensagem para ${selectedStudent.name}...`}
                      className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-full px-4 py-2.5 text-xs outline-none focus:border-amber-400/80 placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={!teacherChatMessage.trim()}
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-black flex items-center justify-center shadow-md cursor-pointer shrink-0 transition-transform active:scale-95"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ABA: GANHOS (ORGANIZADO IDÊNTICO AO PAINEL DE ALUNOS / FINANCEIRO) */}
        {activeTab === 'ganhos' && (
          <div className="space-y-6 animate-fade-in-up max-w-5xl mx-auto">
            
            {/* PAINEL PRINCIPAL DE SALDO E SAQUE - EM REAIS (R$) */}
            <div className="glass-panel rounded-3xl p-6 border border-emerald-500/40 glow-emerald flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <DollarSign className="w-7 h-7 text-emerald-400" />
                  <span>Painel Financeiro & Ganhos em Reais (R$)</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1">Acompanhe suas receitas com base na sua tarifa por hora (R$ {hourlyRate}/h) e solicite saques.</p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 min-w-[200px] text-center w-full sm:w-auto shadow-inner">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Saldo Liberado (Payout)</span>
                  <span className="text-3xl font-black text-emerald-400">R$ {earnedBalance.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => setIsPayoutModalOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer shrink-0"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Solicitar Saque</span>
                </button>
              </div>
            </div>

            {/* CARDS DE MÉTRICAS DE RESUMO (4 CARDS COMPACTOS COM CONTABILIZAÇÃO EM R$) */}
            {(() => {
              const totalMins = earningsHistory.reduce((acc, i) => acc + (i.durationMinutes || 50), 0);
              const hoursStr = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Saldo a Resgatar</span>
                    <span className="text-xl font-black text-emerald-400">R$ {earnedBalance.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tempo Contabilizado</span>
                    <span className="text-xl font-black text-amber-400 font-mono">{hoursStr}</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tarifa por Hora</span>
                    <span className="text-xl font-black text-white font-mono">R$ {hourlyRate}/h</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Margem Atual</span>
                    <span className="text-xl font-black text-emerald-300">{currentEarnPercent}%</span>
                  </div>
                </div>
              );
            })()}

            {/* PROGRESSO DA MARGEM DE REPASSE */}
            <div className="glass-panel rounded-3xl p-6 space-y-4 border border-emerald-500/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white">Sua Margem de Repasse: {currentEarnPercent}% por aula</h3>
                  <p className="text-xs text-slate-400">Quanto mais aulas você der, maior é a sua fatia dos lucros!</p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white">Aulas Totais Realizadas: <strong className="text-amber-400 font-extrabold text-sm">{totalLessons}</strong></span>
                  {nextTier.remaining > 0 ? (
                    <span className="text-emerald-400">
                      Faltam <strong>{nextTier.remaining} aulas</strong> para <strong>{nextTier.nextEarn}%</strong>!
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-black">🎉 Margem Máxima (85%) Alcançada!</span>
                  )}
                </div>

                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (totalLessons / 51) * 100)}%` }}
                  />
                </div>
              </div>
            </div>



            {/* SEÇÃO 2: HISTÓRICO DE SAQUES E PAYOUTS (TELA CHEIA LARGURA COMPLETA) */}
            <div className="glass-panel rounded-3xl p-6 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Histórico de Solicitacões de Resgate & Payouts</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium">Status de saques</span>
              </div>

              <div className="space-y-3">
                {payoutRequests.map(req => (
                  <div key={req.id} className="bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 shrink-0">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-white text-sm">Resgate via {req.method}</h4>
                          <span className="text-xs text-slate-400 font-mono">({req.date})</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Chave / Dados: <strong className="text-slate-300">{req.pixKey || 'Chave Cadastrada'}</strong></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-900 pt-2 sm:pt-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Valor do Saque</span>
                        <strong className="text-emerald-400 font-black text-base">R$ {req.amount.toFixed(2)}</strong>
                      </div>

                      {req.status === 'approved' ? (
                        <span className="bg-emerald-500/20 text-emerald-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-emerald-500/40 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Aprovado
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-500/20 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-amber-500/40 animate-pulse flex items-center gap-1">
                            ⌛ Em Análise
                          </span>
                          <button
                            onClick={() => handleSimulateAdminApprove(req.id)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-xl shadow cursor-pointer transition-all"
                          >
                            Aprovar (Adm)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ABA: PERFIL */}
        {activeTab === 'perfil' && (
          <div className="animate-fade-in-up max-w-2xl mx-auto">
            <div className="glass-panel rounded-3xl p-6 space-y-5 border border-amber-500/30">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                Configurações do Perfil & Tarifa
              </h3>

              {isRateSaved && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Configurações salvas com sucesso!</span>
                </div>
              )}

              {rateErrorMsg && (
                <div className="bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{rateErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-400 block">Tarifa por Hora (R$ BRL) *</label>
                    <span className="text-[10px] text-amber-300 font-mono font-bold">R$ 13,00 a R$ 40,00</span>
                  </div>

                  <div className="relative">
                    <span className="text-slate-400 font-bold text-xs absolute left-3 top-1/2 -translate-y-1/2">R$</span>
                    <input
                      type="number"
                      min={MIN_RATE}
                      max={MAX_RATE}
                      required
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-base rounded-xl pl-9 pr-3.5 py-2.5 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="mt-2 bg-amber-500/15 border border-amber-500/30 p-2.5 rounded-xl text-[11px] flex items-center justify-between">
                    <span className="text-amber-200">💡 <strong>Recomendada:</strong> R$ {RECOMMENDED_RATE},00/h</span>
                    <button
                      type="button"
                      onClick={() => setHourlyRate(RECOMMENDED_RATE)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-lg shadow"
                    >
                      Aplicar R$ {RECOMMENDED_RATE}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Preço Regular por Hora:</span>
                    <strong className="text-white font-black text-sm">R$ {hourlyRate},00 / h</strong>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Aula Experimental:</span>
                    <strong className="text-emerald-400 font-bold">R$ {(hourlyRate * 0.75).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Seu Repasse Líquido ({currentEarnPercent}%):</span>
                    <strong className="text-amber-300 font-bold">R$ {(hourlyRate * (currentEarnPercent/100)).toFixed(2)} / h</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Configurações & Tarifa</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: VERIFICAÇÃO DE ASISTENCIA Y REGISTRO DE FEEDBACK */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-5 border border-cyan-500/40 animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <img src={nextBooking.studentAvatar} alt={nextBooking.studentName} className="w-10 h-10 rounded-xl object-cover border border-cyan-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">Concluir Aula com {nextBooking.studentName}</h3>
                  <span className="text-xs text-slate-400">{nextBooking.day} às {nextBooking.time}</span>
                </div>
              </div>
              <button onClick={() => setIsFeedbackModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-500/15 border border-emerald-500/40 p-3.5 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <strong className="text-white block font-bold">✓ Presença Confirmada na Sala</strong>
                <span className="text-emerald-300">Tempo de conexão em aula: 50 minutos.</span>
              </div>
            </div>

            <form onSubmit={handleSubmitFeedbackAndCompleteClass} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Feedback Pedagógico para o Aluno *</label>
                <textarea
                  rows={3}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Escreva um feedback pedagógico..."
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 text-xs outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Dicas de Estudo & Tarefas *</label>
                <input
                  type="text"
                  required
                  value={studyTips}
                  onChange={(e) => setStudyTips(e.target.value)}
                  placeholder="Ex: Revisar pronúncia..."
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400"
                />
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 block">Sua Margem de Repasse ({classEarnPercent}%):</span>
                  <span className="text-[10px] text-amber-300">Nível Atual: {totalLessons} aulas ministradas</span>
                </div>
                <strong className="text-emerald-400 font-black text-sm">+${netEarningsNextClass} USD</strong>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs py-3 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>Liquidar Saldo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SOLICITAR RESGATE DE SALDO (PAYOUT) */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-5 border border-emerald-500/40 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-white">Resgate de Saldo</h3>
              </div>
              <button onClick={() => setIsPayoutModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Valor a Sacar (R$) *</label>
                <div className="relative">
                  <span className="text-slate-500 font-bold text-xs absolute left-3 top-1/2 -translate-y-1/2">R$</span>
                  <input
                    type="number"
                    min={10}
                    max={earnedBalance}
                    required
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-base rounded-xl pl-9 pr-3.5 py-2.5 outline-none focus:border-emerald-400"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Disponível: R$ {earnedBalance.toFixed(2)}</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor Bruto:</span>
                  <strong className="text-white font-bold">R$ {payoutAmount.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 text-emerald-400 font-bold">
                  <span>Valor Líquido ({currentEarnPercent}%):</span>
                  <strong className="text-base font-black">R$ {(payoutAmount * (currentEarnPercent / 100)).toFixed(2)}</strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Método de Recebimento *</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white font-bold text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-400 cursor-pointer"
                >
                  <option value="PIX Brasil 🇧🇷">PIX (Brasil 🇧🇷)</option>
                  <option value="PayPal 🌐">PayPal (Internacional 🌐)</option>
                  <option value="Transferência Bancária">Transferência Bancária</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Chave PIX ou Conta *</label>
                <input
                  type="text"
                  required
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Ex: CPF ou E-mail"
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs py-3 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES Y ACCIONES DE AULA (SISTEMA ESTILO ALUNO.CONEXIONAMERICA.COM.BR) */}
      {selectedBookingForModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedBookingForModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl font-black cursor-pointer"
            >
              ✕
            </button>

            {/* ENCABEZADO DE ALUMNO */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <img
                src={selectedBookingForModal.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                alt={selectedBookingForModal.studentName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-400/40 shadow-md"
              />
              <div>
                <h3 className="text-lg font-black text-white">{selectedBookingForModal.studentName}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800 font-bold text-cyan-300">
                    {selectedBookingForModal.studentLevel || 'Aluno'}
                  </span>
                  <span>• {selectedBookingForModal.bookingType === 'trial' ? 'Aula Experimental' : 'Plano Mensal'}</span>
                </div>
              </div>
            </div>

            {/* FECHA Y ESTADO */}
            <div className="space-y-2.5 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Data e Horário:</span>
                <span className="text-amber-300 font-mono font-extrabold text-sm">
                  {selectedBookingForModal.colDateStr || selectedBookingForModal.day} às {selectedBookingForModal.time}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                <span className="text-slate-400 font-medium">Estado Atual:</span>
                <span className={`px-3 py-0.5 rounded-full font-extrabold text-[10px] uppercase border ${getStatusBadge(selectedBookingForModal.status).badgeBg}`}>
                  {getStatusBadge(selectedBookingForModal.status).label}
                </span>
              </div>
            </div>

            {/* BOTÓN PRINCIPAL: SALA VIRTUAL DE VÍDEO DENTRO DA NOSSA PLATAFORMA (NO GOOGLE MEET) */}
            <button
              onClick={() => {
                setIsVirtualRoomActive(true);
              }}
              className="w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black py-3 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition-all text-xs cursor-pointer"
            >
              <span className="text-base">📹</span>
              <span>Entrar na Sala Virtual de Vídeo (In-App)</span>
            </button>

            {/* ACCIONES DE GESTIÓN DE AULA (ESTILO ALUNO.CONEXIONAMERICA.COM.BR) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                Ações e Alteração de Estado:
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                {/* REAGENDAR AULA */}
                <button
                  onClick={() => setIsRescheduleModalOpen(true)}
                  className="p-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>🔄 Reagendar</span>
                </button>

                {/* CONCLUIR E AVALIAR */}
                <button
                  onClick={() => setIsFeedbackDialogOpen(true)}
                  className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>✍️ Concluir & Avaliar</span>
                </button>

                {/* REGISTRAR FALTA */}
                <button
                  onClick={() => {
                    updateBookingStatus(selectedBookingForModal.id, 'falta');
                    setSelectedBookingForModal(prev => ({ ...prev, status: 'falta' }));
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    selectedBookingForModal.status === 'falta' || selectedBookingForModal.status === 'no_show'
                      ? 'bg-rose-500 text-slate-950 font-black shadow-md border-rose-400'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                  }`}
                >
                  <span>🔴 Registrar Falta</span>
                </button>

                {/* CANCELAR AULA */}
                <button
                  onClick={() => {
                    updateBookingStatus(selectedBookingForModal.id, 'cancelada');
                    setSelectedBookingForModal(prev => ({ ...prev, status: 'cancelada' }));
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    selectedBookingForModal.status === 'cancelada' || selectedBookingForModal.status === 'canceled'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md border-amber-400'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                  }`}
                >
                  <span>🟡 Cancelar Aula</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedBookingForModal(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 rounded-xl cursor-pointer border border-slate-700 mt-2"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: SALA VIRTUAL DE VÍDEO (LEXI CLASS ROOM IN-APP) */}
      {isVirtualRoomActive && selectedBookingForModal && (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col animate-fade-in">
          {/* TOP BAR */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-base shadow-md">
                📹
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Sala Virtual Lexy Class</span>
                  <span className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase">
                    ● AO VIVO
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Aula de Espanhol com {selectedBookingForModal.studentName} ({selectedBookingForModal.studentLevel || 'Iniciante'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Tempo Decorrido: {formatTimer(roomElapsedSeconds)}</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                💰 R$ {hourlyRate || tutor.hourlyRate || 23}/h
              </span>
              <button
                onClick={() => {
                  setIsVirtualRoomActive(false);
                  setIsFeedbackDialogOpen(true);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow cursor-pointer transition-all hover:scale-105"
              >
                🔴 Encerrar Aula & Avaliar
              </button>
            </div>
          </div>

          {/* VIDEO STREAMS & INTERACTIVE AREA */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 overflow-hidden bg-slate-950">
            {/* MAIN VIDEO SCREEN: STUDENT / PRESENTATION */}
            <div className="md:col-span-3 bg-slate-900 rounded-3xl border border-slate-800/80 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
              <img
                src={selectedBookingForModal.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80'}
                alt={selectedBookingForModal.studentName}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40"></div>

              {/* STUDENT LABEL */}
              <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800 text-white font-extrabold text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{selectedBookingForModal.studentName}</span>
              </div>

              {/* PIP / TUTOR CAMERA VIEW */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-slate-950 rounded-2xl border-2 border-cyan-400/50 shadow-2xl overflow-hidden">
                <img
                  src={tutor.avatar || profile?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'}
                  alt="Você"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white bg-slate-950/90 px-2 py-0.5 rounded-md border border-slate-800">
                  Você (Tutor)
                </div>
              </div>
            </div>

            {/* SIDEBAR: CLASS CHAT & NOTES */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 flex flex-col justify-between space-y-3">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>💬 Chat da Aula</span>
                </h3>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto text-xs pr-1 scrollbar-none">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300">
                  <span className="font-extrabold text-cyan-400 block text-[10px]">Sistema</span>
                  <span>Conexão HD estabelecida. Sala de vídeo segura iniciada.</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300">
                  <span className="font-extrabold text-amber-400 block text-[10px]">{selectedBookingForModal.studentName}</span>
                  <span>Olá professor! Prontos para a aula de hoje?</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Digite no chat da aula..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                />
                <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs px-3 py-2 rounded-xl cursor-pointer">
                  Enviar
                </button>
              </div>
            </div>
          </div>

          {/* CONTROL TOOLBAR AT BOTTOM */}
          <div className="bg-slate-900 border-t border-slate-800 p-3 flex items-center justify-center gap-3">
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-2xl border border-slate-700 cursor-pointer text-xs font-bold flex items-center gap-2">
              <span>🎤</span>
              <span>Microfone On</span>
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-2xl border border-slate-700 cursor-pointer text-xs font-bold flex items-center gap-2">
              <span>📹</span>
              <span>Câmera On</span>
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-2xl border border-slate-700 cursor-pointer text-xs font-bold flex items-center gap-2">
              <span>🖥️</span>
              <span>Compartilhar Tela</span>
            </button>
            <button
              onClick={() => {
                setIsVirtualRoomActive(false);
                setIsFeedbackDialogOpen(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-6 py-2.5 rounded-2xl shadow-xl text-xs cursor-pointer"
            >
              Encerrar Aula
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: REAGENDAR AULA (ESTILO ALUNO.CONEXIONAMERICA.COM.BR) */}
      {isRescheduleModalOpen && selectedBookingForModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsRescheduleModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl font-black cursor-pointer"
            >
              ✕
            </button>

            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>🔄 Reagendar Aula</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Escolha uma nova data e horário para {selectedBookingForModal.studentName}.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-extrabold block mb-1">Nova Data *</label>
                <input
                  type="date"
                  value={rescheduleNewDate}
                  onChange={(e) => setRescheduleNewDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-xl p-3 outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-extrabold block mb-1">Novo Horário *</label>
                <select
                  value={rescheduleNewTime}
                  onChange={(e) => setRescheduleNewTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-xl p-3 outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="">Selecione um horário disponível...</option>
                  {ALL_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsRescheduleModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!rescheduleNewDate || !rescheduleNewTime) return;
                  
                  const dateParts = rescheduleNewDate.split('-');
                  const formattedDateStr = `${dateParts[2]}/${dateParts[1]}`;

                  // Atualizar reserva no estado e contexto
                  setBookings(prev => prev.map(b => {
                    if (b.id === selectedBookingForModal.id) {
                      return {
                        ...b,
                        isoDateStr: rescheduleNewDate,
                        day: selectedBookingForModal.day,
                        time: rescheduleNewTime,
                        status: 'agendada'
                      };
                    }
                    return b;
                  }));

                  setIsRescheduleModalOpen(false);
                  setSelectedBookingForModal(null);
                  setPayoutSuccessMsg(`🎉 Aula reagendada com sucesso para ${formattedDateStr} às ${rescheduleNewTime}!`);
                  setTimeout(() => setPayoutSuccessMsg(''), 6000);
                }}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-md cursor-pointer"
              >
                Confirmar Reagendamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONCLUIR E AVALIAR AULA (ESTILO ALUNO.CONEXIONAMERICA.COM.BR) */}
      {isFeedbackDialogOpen && selectedBookingForModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsFeedbackDialogOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl font-black cursor-pointer"
            >
              ✕
            </button>

            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>✍️ Avaliar Desempenho do Aluno</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Conclua a aula e avalie o progresso de {selectedBookingForModal.studentName}.
              </p>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {[
                { key: 'fala', label: 'Conversação & Fala' },
                { key: 'vocabulario', label: 'Vocabulário' },
                { key: 'pronuncia', label: 'Pronúncia' },
                { key: 'gramatica', label: 'Gramática' }
              ].map(cat => (
                <div key={cat.key} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-200">{cat.label}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEvalRatings(prev => ({ ...prev, [cat.key]: star }))}
                        className={`text-base cursor-pointer transition-transform hover:scale-125 ${
                          (evalRatings[cat.key] || 0) >= star ? 'text-amber-400' : 'text-slate-700'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Comentários e Dicas de Estudo</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs outline-none focus:border-cyan-400"
                  placeholder="Excelente aula! Aluno praticou diálogo corporativo com bom domínio de tempo verbal."
                />
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-[11px] text-amber-300 space-y-1">
              <span className="font-extrabold block text-amber-400">⚠️ CONTABILIZAÇÃO DE TEMPO EM AULA & CÁLCULO EM REAIS (R$):</span>
              <p>O tempo de aula ({roomElapsedSeconds > 5 ? Math.ceil(roomElapsedSeconds / 60) : 50} min) é contabilizado nesta sala. O repasse em R$ com base na sua tarifa configurada (R$ {hourlyRate || tutor.hourlyRate || 23}/h) só é creditado após a confirmação da aula concluída E o envio deste Feedback Obrigatório.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsFeedbackDialogOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const elapsedMins = roomElapsedSeconds > 5 ? Math.ceil(roomElapsedSeconds / 60) : (selectedBookingForModal.durationMinutes || 50);
                  const currentRate = Number(hourlyRate || tutor.hourlyRate || 23);
                  const earnedAmountR$ = Number(((elapsedMins / 60) * currentRate * (currentEarnPercent / 100)).toFixed(2));

                  updateBookingStatus(selectedBookingForModal.id, 'completed');
                  incrementTutorLessons(tutor.id);
                  setEarnedBalance(prev => Number((prev + earnedAmountR$).toFixed(2)));

                  const newEarnItem = {
                    id: `earn-${Date.now()}`,
                    studentName: selectedBookingForModal.studentName,
                    studentAvatar: selectedBookingForModal.studentAvatar,
                    date: `${selectedBookingForModal.day || 'Hoje'} às ${selectedBookingForModal.time || '15:00'}`,
                    classType: selectedBookingForModal.bookingType === 'trial' ? 'Aula Experimental' : 'Assinatura 28 dias',
                    durationMinutes: elapsedMins,
                    durationFormatted: `${elapsedMins} min`,
                    grossAmount: currentRate,
                    fee: 0,
                    netAmount: earnedAmountR$,
                    currency: 'R$',
                    status: 'Liberado (Feedback Enviado ✓)',
                    feedback: feedbackText || 'Excelente aula! Aluno praticou conversação e gramática.',
                    ratings: evalRatings
                  };

                  setEarningsHistory(prev => [newEarnItem, ...prev]);
                  setIsFeedbackDialogOpen(false);
                  setSelectedBookingForModal(null);
                  setPayoutSuccessMsg(`🎉 Aula encerrada e avaliada! Tempo contabilizado nesta sala: ${elapsedMins} min. +R$ ${earnedAmountR$.toFixed(2)} liberados no Payout (Tarifa de R$ ${currentRate}/h com repasse de ${currentEarnPercent}%)!`);
                  setTimeout(() => setPayoutSuccessMsg(''), 6000);
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-md cursor-pointer transition-all"
              >
                Concluir Aula & Enviar Feedback Obrigatório
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
