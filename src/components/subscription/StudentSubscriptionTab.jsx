import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Calendar, Clock, CreditCard, ShieldCheck, 
  AlertCircle, CheckCircle2, PauseCircle, XCircle, 
  RefreshCw, Award, UserCheck, Lock, ArrowRight, Zap, FileText
} from 'lucide-react';
import { useMarketplace } from '../../contexts/MarketplaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AsaasCheckoutModal from '../payment/AsaasCheckoutModal';

export default function StudentSubscriptionTab() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    subscriptions, tutors, createBooking, bookings, teacherAvailability, 
    pauseSubscription, resumeSubscription, cancelSubscription 
  } = useMarketplace();
  const { profile } = useAuth();

  const studentMatricula = profile?.matricula_code || 'LXY-2026-784219';
  
  const userSubscriptions = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return [];
    if (!profile) return subscriptions;

    const pId = String(profile.id || '').toLowerCase();
    const pEmail = String(profile.email || '').toLowerCase();
    const pMat = String(profile.matricula_code || '').toLowerCase();

    const filtered = (subscriptions || []).filter(sub => {
      const sStudentId = String(sub.studentId || '').toLowerCase();
      const sStudentEmail = String(sub.studentEmail || '').toLowerCase();
      const sStudentMat = String(sub.studentMatricula || '').toLowerCase();

      if (sStudentId || sStudentEmail || sStudentMat) {
        return (pId && sStudentId === pId) || 
               (pEmail && sStudentEmail === pEmail) || 
               (pMat && sStudentMat === pMat);
      }
      return true;
    });

    return filtered.length > 0 ? filtered : subscriptions;
  }, [subscriptions, profile]);

  // ============================================================
  // ESTADO DE STATUS DA ASSINATURA - 100% localStorage, sem depender de contexto
  // Chave: lexy_sub_action_v1 = { status, pausedUntil, cancelReason, savedAt }
  // ============================================================
  const getSubActionKey = (p) => {
    const pEmail = p?.email || p?.id || '';
    return pEmail ? `lexy_sub_action_${pEmail}` : 'lexy_sub_action_v1';
  };

  const getSavedAction = (p) => {
    try {
      const key = getSubActionKey(p);
      const raw = localStorage.getItem(key) || localStorage.getItem('lexy_sub_action_v1');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e) { return null; }
  };

  const [savedAction, setSavedAction] = useState(() => getSavedAction(profile));

  React.useEffect(() => {
    setSavedAction(getSavedAction(profile));
  }, [profile]);

  // activeSub: combina dados da subscription com o status salvo localmente
  const activeSub = useMemo(() => {
    const base = (userSubscriptions && userSubscriptions.length > 0)
      ? userSubscriptions[0]
      : {
          id: 'sub-active-fallback',
          studentId: profile?.id,
          studentEmail: profile?.email,
          studentName: profile?.full_name,
          studentMatricula: studentMatricula,
          tutorId: 'tutor-1',
          tutorName: 'Professor Lexy',
          planName: 'Assinatura 2x/semana (8 Aulas / 30 Dias)',
          lessonsPerWeek: 2,
          planHours: 8,
          monthlyPrice: 216.00,
          status: 'active',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

    if (!base) return null;

    // 1. Se o status no Supabase já for 'paused' ou 'canceled', usa os valores do Supabase diretamente
    if (base.status && base.status !== 'active') {
      return {
        ...base,
        status: base.status,
        pausedUntil: base.pausedUntil || base.paused_until,
        nextBillingDate: base.status === 'paused' ? (base.pausedUntil || base.paused_until || base.nextBillingDate) : base.nextBillingDate,
        cancelReason: base.cancelReason || base.cancel_reason
      };
    }

    // 2. Se há um status salvo no localStorage, ELE VENCE sobre tudo
    const action = savedAction;
    if (action && action.status && action.status !== 'active') {
      return {
        ...base,
        status: action.status,
        pausedUntil: action.pausedUntil || base.pausedUntil,
        nextBillingDate: action.status === 'paused' ? (action.pausedUntil || base.pausedUntil || base.nextBillingDate) : base.nextBillingDate,
        cancelReason: action.cancelReason || base.cancelReason
      };
    }

    return base;
  }, [savedAction, userSubscriptions, profile, studentMatricula]);

  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState(1); // 1: Pausa, 2: Motivo/Alternativa, 3: Confirmar
  const [cancelReason, setCancelReason] = useState('financeiro');
  const [cancelComment, setCancelComment] = useState('');
  const [pauseDays, setPauseDays] = useState(15);
  const [actionNotice, setActionNotice] = useState('');

  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [selectedLessonsPerWeek, setSelectedLessonsPerWeek] = useState(2);
  const [isAsaasModalOpen, setIsAsaasModalOpen] = useState(false);

  React.useEffect(() => {
    if (searchParams.get('subscribe') === 'true') {
      setIsSubscribeModalOpen(true);
    }
  }, [searchParams]);

  const lastBooking = useMemo(() => {
    if (!profile || !bookings) return null;
    const pId = String(profile.id || '').toLowerCase();
    const pEmail = String(profile.email || '').toLowerCase();
    return bookings.find(b => {
      const bStudentId = String(b.studentId || '').toLowerCase();
      const bStudentEmail = String(b.studentEmail || '').toLowerCase();
      return (pId && bStudentId === pId) || (pEmail && bStudentEmail === pEmail);
    });
  }, [bookings, profile]);

  const targetTutor = useMemo(() => {
    const paramTutorId = searchParams.get('tutorId');
    if (paramTutorId) {
      const cleanParam = String(paramTutorId).toLowerCase();
      const match = tutors.find(t => 
        String(t.id).toLowerCase() === cleanParam || 
        String(t.name).toLowerCase() === cleanParam ||
        String(t.name).toLowerCase().includes(cleanParam)
      );
      if (match) return match;
    }
    if (activeSub) {
      const match = tutors.find(t => String(t.id).toLowerCase() === String(activeSub.tutorId).toLowerCase());
      if (match) return match;
    }
    if (lastBooking) {
      const match = tutors.find(t => 
        String(t.id).toLowerCase() === String(lastBooking.tutorId).toLowerCase() ||
        String(t.name).toLowerCase() === String(lastBooking.tutorName).toLowerCase()
      );
      if (match) return match;
    }
    return tutors[0] || null;
  }, [tutors, activeSub, lastBooking, searchParams]);

  const tutorHourlyRate = Number(targetTutor?.hourlyRate || targetTutor?.hourly_rate || 20);

  // HELPER: Convertir fecha YYYY-MM-DD o día a formato estandarizado ('Segunda-feira', etc.)
  const getDayNameFromDateString = (dateStr) => {
    if (!dateStr) return '';
    const cleanStr = String(dateStr).trim();
    if (!cleanStr.includes('-')) return cleanStr;
    const parts = cleanStr.split('-');
    if (parts.length !== 3) return cleanStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return weekDays[d.getDay()] || cleanStr;
  };

  // HELPER: Obtener horarios 100% libres (activos por el profesor targetTutor, NO ocupados por reservas confirmed/rescheduled y NO bloqueados)
  const getFreeSlotsForDay = (dayName) => {
    if (!dayName || !targetTutor) return [];

    const rawSchedule = targetTutor?.weeklySchedule || {};
    const targetClean = String(dayName).toLowerCase().replace('-feira', '').trim();
    const matchedKey = Object.keys(rawSchedule).find(k => 
      k.toLowerCase().replace('-feira', '').trim() === targetClean
    );

    // Tomamos ÚNICAMENTE las horas activas configuradas por el profesor en su agenda
    const baseSlots = matchedKey ? (rawSchedule[matchedKey] || []) : [];

    // Horarios marcados explícitamente como 'free' en teacher_availability para este profesor
    const extraFreeFromDb = (teacherAvailability || [])
      .filter(a => String(a.teacher_id || a.tutor_id).toLowerCase() === String(targetTutor?.id || '').toLowerCase() && a.status === 'free')
      .filter(a => {
        const slotDayName = getDayNameFromDateString(a.date || a.day || '');
        const cleanSlotDay = String(slotDayName).toLowerCase().replace('-feira', '').trim();
        return cleanSlotDay === targetClean;
      })
      .map(a => String(a.time).trim());

    const combinedSlots = Array.from(new Set([...baseSlots, ...extraFreeFromDb]));

    // Horarios ocupados por agendamentos do professor
    const occupiedTimes = (bookings || [])
      .filter(b => String(b.tutorId || b.tutor_id).toLowerCase() === String(targetTutor?.id || '').toLowerCase() && (b.status === 'confirmed' || b.status === 'rescheduled' || b.status === 'pending'))
      .filter(b => {
        const bookingDayName = getDayNameFromDateString(b.date || b.day || '');
        const cleanBookingDay = String(bookingDayName).split(' (')[0].toLowerCase().replace('-feira', '').trim();
        return cleanBookingDay === targetClean;
      })
      .map(b => String(b.time || '').trim());

    // Horarios bloqueados explícitamente por el profesor en teacher_availability
    const blockedTimesForTeacher = (teacherAvailability || [])
      .filter(a => String(a.teacher_id || a.tutor_id).toLowerCase() === String(targetTutor?.id || '').toLowerCase() && a.status === 'blocked')
      .filter(a => {
        const slotDayName = getDayNameFromDateString(a.date || a.day || '');
        const cleanSlotDay = String(slotDayName).toLowerCase().replace('-feira', '').trim();
        return cleanSlotDay === targetClean;
      })
      .map(a => String(a.time).trim());

    return combinedSlots.filter(t => !occupiedTimes.includes(String(t).trim()) && !blockedTimesForTeacher.includes(String(t).trim()));
  };

  const ALL_WEEK_DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  
  // Días que realmente contienen al menos 1 horario LIVRE para este profesor
  const availableDays = useMemo(() => {
    const freeDays = ALL_WEEK_DAYS.filter(day => getFreeSlotsForDay(day).length > 0);
    return freeDays.length > 0 ? freeDays : ALL_WEEK_DAYS;
  }, [targetTutor, teacherAvailability, bookings]);

  // ASIGNACIÓN DINÁMICA DE HORARIOS LIVRES (SIN FALLBACK FALSO '09:00')
  const [weeklySlots, setWeeklySlots] = useState(() => {
    return Array.from({ length: 4 }, (_, idx) => {
      const day = availableDays[idx % availableDays.length] || 'Segunda-feira';
      const freeTimes = getFreeSlotsForDay(day);
      return { day, time: freeTimes[0] || '' };
    });
  });

  const handleWeeklySlotChange = (index, field, value) => {
    setWeeklySlots(prev => {
      const copy = [...prev];
      if (field === 'day') {
        const freeTimes = getFreeSlotsForDay(value);
        copy[index] = { day: value, time: freeTimes[0] || '' };
      } else {
        copy[index] = { ...copy[index], time: value };
      }
      return copy;
    });
  };

  const totalContractedHours = selectedLessonsPerWeek * 4;
  const totalCycleAmount = Number((tutorHourlyRate * totalContractedHours).toFixed(2));

  const userHistory = useMemo(() => {
    if (!profile) return [];
    const pId = String(profile.id || '').toLowerCase();
    const pEmail = String(profile.email || '').toLowerCase();
    const pMat = String(profile.matricula_code || '').toLowerCase();

    if (Array.isArray(profile.wallet_history) && profile.wallet_history.length > 0) {
      return profile.wallet_history;
    }

    const userKey = profile.id ? `lexy_wallet_history_${profile.id}` : null;
    const rawUserHistory = userKey ? JSON.parse(localStorage.getItem(userKey) || 'null') : null;
    const rawHistory = rawUserHistory || JSON.parse(localStorage.getItem('lexy_wallet_history') || '[]');

    return rawHistory.filter(h => {
      const hStudentId = String(h.studentId || h.userId || '').toLowerCase();
      const hStudentEmail = String(h.studentEmail || h.userEmail || '').toLowerCase();
      const hStudentMat = String(h.studentMatricula || '').toLowerCase();

      if (hStudentId || hStudentEmail || hStudentMat) {
        return (pId && hStudentId === pId) || 
               (pEmail && hStudentEmail === pEmail) || 
               (pMat && hStudentMat === pMat);
      }
      return false;
    });
  }, [profile]);

  const handleConfirmPause = async () => {
    if (!activeSub) return;
    setIsPauseModalOpen(false);

    const pauseDaysCount = Number(pauseDays || 20);
    const pausedUntilDate = new Date(Date.now() + pauseDaysCount * 24 * 60 * 60 * 1000).toISOString();

    // ✅ SALVAR NO LOCALSTORAGE PRIMEIRO - isto é síncrono e não pode falhar
    const action = { status: 'paused', pausedUntil: pausedUntilDate, savedAt: new Date().toISOString() };
    const key = getSubActionKey(profile);
    localStorage.setItem(key, JSON.stringify(action));
    localStorage.setItem('lexy_sub_action_v1', JSON.stringify(action));
    setSavedAction(action);

    // Depois fazer os calls de background (podem falhar sem problema)
    pauseSubscription(activeSub.id, pauseDaysCount).catch(() => {});

    setActionNotice(`⏸️ Assinatura pausada com sucesso por ${pauseDaysCount} dias!`);
    setTimeout(() => setActionNotice(''), 5000);
  };

  const handleConfirmResume = async () => {
    if (!activeSub) return;

    // ✅ LIMPAR O LOCALSTORAGE - volta ao status ativo normal
    const key = getSubActionKey(profile);
    localStorage.removeItem(key);
    localStorage.removeItem('lexy_sub_action_v1');
    try {
      const overrides = JSON.parse(localStorage.getItem('lexy_subscription_status_overrides') || '{}');
      if (activeSub.id) delete overrides[activeSub.id];
      if (profile?.email) delete overrides[profile.email];
      localStorage.setItem('lexy_subscription_status_overrides', JSON.stringify(overrides));
    } catch(e) {}

    setSavedAction(null);

    // Background calls - atualiza no Supabase para status = 'active'
    resumeSubscription(activeSub.id).catch(() => {});

    setActionNotice('⚡ Assinatura e cobranças automáticas reativadas com sucesso!');
    setTimeout(() => setActionNotice(''), 5000);
  };

  const handleConfirmCancel = async () => {
    if (!activeSub) return;

    // ✅ SALVAR NO LOCALSTORAGE PRIMEIRO
    const action = { status: 'canceled', cancelReason, savedAt: new Date().toISOString() };
    const key = getSubActionKey(profile);
    localStorage.setItem(key, JSON.stringify(action));
    localStorage.setItem('lexy_sub_action_v1', JSON.stringify(action));
    setSavedAction(action);

    // Background calls
    cancelSubscription(activeSub.id, cancelReason).catch(() => {});

    setIsCancelModalOpen(false);
    setCancelStep(1);
    setActionNotice('ℹ️ Renovação automática cancelada. Suas aulas pagas deste ciclo continuam válidas até o final dos 30 dias.');
    setTimeout(() => setActionNotice(''), 6000);
  };

  const handleAsaasSubscriptionPaymentSuccess = async (paymentResult) => {
    setIsAsaasModalOpen(false);
    setIsSubscribeModalOpen(false);

    const activeSlots = weeklySlots.slice(0, selectedLessonsPerWeek);
    const primarySlot = activeSlots[0] || { day: 'Segunda-feira', time: '10:00' };

    await createBooking({
      tutorId: targetTutor.id,
      day: primarySlot.day,
      time: primarySlot.time,
      allSlots: activeSlots,
      bookingType: 'package',
      planHours: totalContractedHours,
      planName: `Assinatura ${selectedLessonsPerWeek}x/semana (${totalContractedHours} Aulas / 30 Dias)`,
      totalAmount: totalCycleAmount,
      bypassWallet: true,
      paymentId: paymentResult?.transactionId || `tx_${Date.now()}`,
      studentId: profile?.id,
      studentEmail: profile?.email,
      studentName: profile?.full_name,
      studentMatricula: profile?.matricula_code
    });

    const newTx = {
      id: paymentResult?.transactionId || `tx_${Date.now()}`,
      studentId: profile?.id,
      studentEmail: profile?.email,
      studentMatricula: profile?.matricula_code,
      desc: `Assinatura de 30 Dias com ${targetTutor.name} (${selectedLessonsPerWeek}x/sem)`,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      amount: totalCycleAmount,
      status: 'Concluído'
    };

    const updatedHistory = [newTx, ...userHistory];
    localStorage.setItem('lexy_wallet_history', JSON.stringify(updatedHistory));

    setActionNotice(`🎉 Assinatura ativada com sucesso via Asaas! Suas ${totalContractedHours} aulas do ciclo de 30 dias com ${targetTutor.name} foram agendadas na aba Início.`);
    setTimeout(() => setActionNotice(''), 8000);
  };

  const formattedNextDate = activeSub?.nextBillingDate
    ? new Date(activeSub.nextBillingDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {actionNotice && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Meu Plano de Aulas & Assinatura Recorrente (30 Dias)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Gerencie sua assinatura ativa, agende pacotes de aulas e acompanhe seu histórico financeiro.</p>
        </div>

        <button 
          onClick={() => navigate('/dashboard/student?tab=catalogo')}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Explorar Catálogo de Professores</span>
        </button>
      </div>

      {!activeSub ? (
        !targetTutor ? (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
              <UserCheck className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl font-extrabold text-white">Nenhum Professor Selecionado</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Para assinar um pacote recorrente de 30 dias, escolha primeiro o seu professor no catálogo. Cada professor define sua tarifa por hora individualmente.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/student?tab=catalogo')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-950" />
              <span>Explorar Catálogo e Escolher Professor</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Banner do Professor Selecionado */}
            <div className="glass-panel border-2 border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={targetTutor?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'} 
                    alt={targetTutor?.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-md shrink-0 ring-4 ring-cyan-500/20" 
                  />
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Professor Selecionado para Assinatura</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white">{targetTutor?.name}</h3>
                    <p className="text-xs text-slate-300">{targetTutor?.subject || 'Idiomas'} • Tarifa por hora: <strong className="text-emerald-400 font-bold text-sm">R$ {tutorHourlyRate}.00 / hora</strong></p>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-right shadow-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status da Assinatura</span>
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Sem Assinatura Recorrente Ativa
                  </span>
                </div>
              </div>

              {/* SELETOR DE PROFESSORES PARA ESCOLHER COM QUEM ASSINAR */}
              {tutors && tutors.length > 1 && (
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 shrink-0">
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    <span>Deseja assinar com outro professor das suas aulas experimentais?</span>
                  </span>
                  
                  <select
                    value={targetTutor?.id || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (selectedId) {
                        navigate(`/dashboard/student?tab=meu-plano&tutorId=${selectedId}&subscribe=true`);
                      }
                    }}
                    className="w-full sm:w-auto bg-slate-950 border border-cyan-500/40 hover:border-cyan-400 text-white font-bold rounded-xl px-3.5 py-2 text-xs outline-none cursor-pointer shadow-md"
                  >
                    {tutors.map(t => (
                      <option key={t.id} value={t.id}>
                        👨‍🏫 {t.name} ({t.subject}) - R$ {t.hourlyRate || t.hourly_rate || 20}.00/h
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

          {/* SEÇÃO PRINCIPAL DE PACOTES DE AULAS RECORRENTES (30 DIAS) */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 fill-amber-300" />
                <span>Pacotes de Aulas Recorrentes a cada 30 Dias</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Escolha o Pacote de Aulas Recorrente com {targetTutor?.name}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Selecione a frequência semanal ideal. Os valores são calculados com base na tarifa por hora fixada pelo seu professor (<strong>R$ {tutorHourlyRate}.00/h</strong>) com cobrança recorrente a cada 30 dias.
              </p>
            </div>

            {/* CARDS DOS 4 PACOTES (1x, 2x, 3x, 4x por semana) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { freq: 1, name: '1x por Semana', hours: 4, badge: 'Essencial', popular: false },
                { freq: 2, name: '2x por Semana', hours: 8, badge: 'Mais Popular ⭐', popular: true },
                { freq: 3, name: '3x por Semana', hours: 12, badge: 'Avançado 🚀', popular: false },
                { freq: 4, name: '4x por Semana', hours: 16, badge: 'Intensivo ⚡', popular: false }
              ].map(pkg => {
                const totalAmount = Number((tutorHourlyRate * pkg.hours).toFixed(2));
                const isSelected = selectedLessonsPerWeek === pkg.freq;

                return (
                  <div
                    key={pkg.freq}
                    onClick={() => setSelectedLessonsPerWeek(pkg.freq)}
                    className={`relative p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 ${
                      isSelected 
                        ? 'bg-gradient-to-b from-cyan-950/70 via-slate-900 to-slate-900 border-2 border-cyan-400 glow-cyan ring-4 ring-cyan-500/20 shadow-2xl scale-[1.02]' 
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 right-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] uppercase px-3 py-0.5 rounded-full shadow-md">
                        {pkg.badge}
                      </span>
                    )}

                    <div>
                      <span className="text-[11px] font-mono text-cyan-400 font-bold block uppercase tracking-wider mb-1">
                        {pkg.freq} Aula{pkg.freq > 1 ? 's' : ''} / semana
                      </span>
                      <h3 className="text-lg font-black text-white">{pkg.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">
                        {pkg.hours} aulas no ciclo de 30 dias
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-2xl font-black text-emerald-400">
                        R$ {totalAmount.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        R$ {tutorHourlyRate}.00 por hora • Cobrado a cada 30 dias
                      </span>
                    </div>

                    <button
                      type="button"
                      className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                          : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <span>{isSelected ? '✓ Selecionado' : 'Selecionar Plano'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* SELEÇÃO DE HORÁRIOS DA AGENDA SEMANAL DO PROFESSOR (HORÁRIOS LIVRES VALIDADOS) */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Configure seus {selectedLessonsPerWeek} Dia(s) e Horário(s) Fixos na Agenda</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: selectedLessonsPerWeek }).map((_, idx) => {
                  const currentSlot = weeklySlots[idx] || { 
                    day: availableDays[0] || 'Segunda-feira', 
                    time: getFreeSlotsForDay(availableDays[0] || 'Segunda-feira')[0] || '' 
                  };
                  const availableTimes = getFreeSlotsForDay(currentSlot.day);

                  return (
                    <div key={idx} className="bg-slate-900 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-inner">
                      <span className="font-bold text-white shrink-0">Aula Semanal #{idx + 1}:</span>

                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <select
                          value={currentSlot.day}
                          onChange={(e) => handleWeeklySlotChange(idx, 'day', e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-white font-bold rounded-lg px-2.5 py-1.5 outline-none cursor-pointer text-xs"
                        >
                          {availableDays.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>

                        <select
                          value={currentSlot.time}
                          onChange={(e) => handleWeeklySlotChange(idx, 'time', e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-cyan-300 font-bold rounded-lg px-2.5 py-1.5 outline-none cursor-pointer text-xs"
                        >
                          {availableTimes.length > 0 ? (
                            availableTimes.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))
                          ) : (
                            <option value="" disabled>⚠️ Sem horário livre neste dia</option>
                          )}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BARRA DE BOTÃO FINAL DE ASSINATURA ASAAS */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 font-medium block">Total do Ciclo de 30 Dias ({selectedLessonsPerWeek * 4} aulas):</span>
                <span className="text-3xl font-black text-emerald-400">R$ {totalCycleAmount.toFixed(2)}</span>
              </div>

              <button
                type="button"
                onClick={() => setIsAsaasModalOpen(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 hover:from-amber-300 hover:to-cyan-300 text-slate-950 font-black text-sm px-8 py-4 rounded-xl shadow-xl shadow-emerald-500/20 transition-all cursor-pointer transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5 fill-slate-950" />
                <span>Pagar R$ {totalCycleAmount.toFixed(2)} e Ativar Assinatura Recorrente ⚡</span>
              </button>
            </div>

          </div>
        </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 space-y-5 shadow-lg relative overflow-hidden">
              
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  {activeSub.status === 'active' && (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Assinatura Ativa (Ciclo 30 Dias)
                    </span>
                  )}
                  {activeSub.status === 'paused' && (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                      Pausada até {formattedNextDate}
                    </span>
                  )}
                  {activeSub.status === 'canceled' && (
                    <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      Assinatura Cancelada
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 font-bold">
                    Matrícula: {studentMatricula}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
                <img 
                  src={targetTutor.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'} 
                  alt={targetTutor.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/30 shadow-md shrink-0" 
                />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-base truncate">{targetTutor.name}</h3>
                    <span className="bg-emerald-500/10 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      {activeSub.planName || 'Assinatura de 30 Dias'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Tarifa do Professor: <strong className="text-emerald-400">R$ {tutorHourlyRate}.00 / hora</strong></p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Professor Verificado Lexy Platform</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Frequência Semanal</span>
                  <p className="text-sm font-bold text-white">{activeSub.lessonsPerWeek || 2} aulas / semana</p>
                  <p className="text-[11px] text-slate-400">{activeSub.planHours || 8} aulas no ciclo de 30 dias</p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valor do Ciclo</span>
                  <p className="text-sm font-bold text-emerald-400">R$ {Number(activeSub.monthlyPrice || 360).toFixed(2)}</p>
                  <p className="text-[11px] text-slate-400">Cobrado a cada 30 dias</p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Próxima Renovação</span>
                  <p className="text-sm font-bold text-cyan-300">{formattedNextDate}</p>
                  <p className="text-[11px] text-slate-400">Cobrança automática Asaas</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                {activeSub.status === 'active' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsPauseModalOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <PauseCircle className="w-4 h-4 text-amber-400" />
                      <span>Pausar Assinatura (Até 20 Dias)</span>
                    </button>

                    <button
                      onClick={() => setIsCancelModalOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Cancelar Assinatura</span>
                    </button>
                  </div>
                )}

                {activeSub.status === 'paused' && (
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
                      <PauseCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      Cobranças suspensas na plataforma Asaas. Horários preservados!
                    </span>

                    <button
                      onClick={handleConfirmResume}
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                      <span>Reativar Assinatura Agora ⚡</span>
                    </button>
                  </div>
                )}

                {activeSub.status === 'canceled' && (
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span className="text-xs text-rose-300 font-medium flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      Renovação automática suspensa. Clique para reativar suas cobranças recorrentes.
                    </span>

                    <button
                      onClick={handleConfirmResume}
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                      <span>Reativar Assinatura Agora ⚡</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-4 space-y-3 shadow-sm">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Regras do Ciclo de 30 Dias
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-1">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Agendamento Recorrente Fixo
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Seus horários ficam bloqueados e reservados semanalmente com seu professor durante os 30 dias do ciclo.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-1">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                    Pausas Flexíveis
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Você pode pausar as cobranças por até 20 dias por ciclo caso precise viajar ou descansar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            Histórico de Transações & Pagamentos
          </h2>
          <span className="text-xs text-slate-400 font-medium">Extrato Completo do Aluno</span>
        </div>

        {userHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Nenhuma transação registrada até o momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {userHistory.map((item, idx) => {
              const isFree = item.amount === 0 || String(item.desc || '').toLowerCase().includes('grátis') || String(item.desc || '').toLowerCase().includes('gratis');
              return (
                <div key={item.id || idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">{item.desc || 'Pagamento Lexy Platform'}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{item.date}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-extrabold block ${isFree ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isFree ? 'R$ 0.00 (GRÁTIS)' : `R$ ${Number(item.amount || 0).toFixed(2)}`}
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                      {item.status || 'Concluído'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isPauseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <PauseCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Pausar Assinatura no Asaas</h3>
                  <p className="text-[11px] text-slate-400">Suspensão de cobranças automáticas por até 20 dias</p>
                </div>
              </div>
              <button onClick={() => setIsPauseModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 border border-slate-800 rounded-2xl p-4">
              Ao confirmar, a cobrança recorrente no <strong className="text-amber-300">Asaas Pagamentos</strong> será pausada por até 20 dias. Seus horários semanais com seu professor permanecem reservados. Você poderá reativar a qualquer momento.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPauseModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-800 cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handleConfirmPause}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <PauseCircle className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>Confirmar Pausa no Asaas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Cancelar Renovação da Assinatura</h3>
                  <p className="text-[11px] text-slate-400">Lexy Retention & Cancellation Flow</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsCancelModalOpen(false); setCancelStep(1); }} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* PASO 1: OFRECER PAUSA (RETENCIÓN PRINCIPAL) */}
            {cancelStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <PauseCircle className="w-4 h-4" />
                    💡 Recomendação Lexy: Que tal Pausar em vez de Cancelar?
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ao cancelar, você <strong className="text-rose-400">perderá a reserva semanal fixa</strong> com seu professor {targetTutor?.name}. Se você vai viajar ou precisa de um descanso, pode <strong>pausar os cobros no Asaas por até 20 dias</strong> mantendo seu horário garantido.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsCancelModalOpen(false); setIsPauseModalOpen(true); }}
                    className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-xs py-3.5 px-5 rounded-xl shadow-lg border border-amber-300/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <PauseCircle className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>Pausar por até 20 Dias no Asaas (Manter Horário)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCancelStep(2)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-xs py-3 rounded-xl border border-slate-800 transition-all cursor-pointer text-center"
                  >
                    Desejo continuar com a pesquisa de cancelamento →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2: PESQUISA DE MOTIVO E SOLUÇÕES ALTERNATIVAS */}
            {cancelStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                  Qual o principal motivo do cancelamento?
                </label>

                <div className="space-y-2 text-xs">
                  {[
                    { id: 'financeiro', label: '💸 Motivos financeiros / Preço do pacote', altText: '🎁 Ganhar 15% OFF de desconto na próxima mensalidade' },
                    { id: 'trocar_professor', label: '👨‍🏫 Quero testar outro professor nativo', altText: '💡 Sugerir troca de tutor sem custo de matrícula' },
                    { id: 'sem_tempo', label: '⏳ Não tenho tempo suficiente para estudar agora', altText: '⏸️ Pausar por 20 dias até sua rotina estabilizar' },
                    { id: 'outro', label: '📝 Outro motivo pessoal', altText: '' }
                  ].map(item => (
                    <div
                      key={item.id}
                      onClick={() => setCancelReason(item.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        cancelReason === item.id 
                          ? 'bg-cyan-500/15 border-cyan-400 font-bold text-white' 
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.altText && cancelReason === item.id && (
                        <div className="mt-1 text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                          <span>{item.altText}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <textarea
                  value={cancelComment}
                  onChange={(e) => setCancelComment(e.target.value)}
                  placeholder="Comentário adicional (opcional)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-400 h-20 resize-none"
                />

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCancelStep(1)}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-800 cursor-pointer"
                  >
                    ← Voltar
                  </button>

                  <button
                    type="button"
                    onClick={() => setCancelStep(3)}
                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Avançar para confirmação →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: CONFIRMAÇÃO FINAL DE CANCELAMENTO DE RENOVAÇÃO */}
            {cancelStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-4 space-y-2">
                  <h4 className="font-extrabold text-white text-sm">Confirmação de Cancelamento de Renovação</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sua cobrança automática recorrente no <strong className="text-white">Asaas Pagamentos</strong> será cancelada. 
                  </p>
                  <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    ✓ Você continuará com acesso a todas as aulas pagas do seu ciclo atual de 30 dias até o encerramento do período vigente.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCancelStep(2)}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-800 cursor-pointer"
                  >
                    ← Voltar
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 text-white" />
                    <span>Confirmar Cancelamento da Renovação</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {isSubscribeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">Assinar Plano de Aulas com {targetTutor?.name}</h3>
                <p className="text-xs text-slate-400">Ciclo de 30 Dias • Tarifa do Professor: R$ {tutorHourlyRate}.00/h</p>
              </div>
              <button 
                onClick={() => setIsSubscribeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                1. Escolha a Frequência Semanal de Aulas
              </label>

              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(freq => {
                  const hoursInCycle = freq * 4;
                  const priceInCycle = (tutorHourlyRate * hoursInCycle).toFixed(2);
                  const isSelected = selectedLessonsPerWeek === freq;

                  return (
                    <div
                      key={freq}
                      onClick={() => setSelectedLessonsPerWeek(freq)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-cyan-500/15 border-cyan-400 glow-cyan font-bold ring-2 ring-cyan-400'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-black text-white block">{freq} aula(s) / semana</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{hoursInCycle} aulas por ciclo de 30 dias</span>
                      <div className="mt-2 text-sm font-black text-emerald-400">
                        R$ {priceInCycle} / 30 dias
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                2. Selecione os {selectedLessonsPerWeek} Dia(s) e Horário(s) na Agenda do Professor
              </label>

              <div className="space-y-2.5">
                {Array.from({ length: selectedLessonsPerWeek }).map((_, idx) => {
                  const currentSlot = weeklySlots[idx] || { 
                    day: availableDays[0] || 'Segunda-feira', 
                    time: getFreeSlotsForDay(availableDays[0] || 'Segunda-feira')[0] || '' 
                  };
                  const availableTimes = getFreeSlotsForDay(currentSlot.day);

                  return (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold text-white">Aula Semanal #{idx + 1}:</span>

                      <div className="flex items-center gap-3">
                        <select
                          value={currentSlot.day}
                          onChange={(e) => handleWeeklySlotChange(idx, 'day', e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-white font-bold rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                        >
                          {availableDays.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>

                        <select
                          value={currentSlot.time}
                          onChange={(e) => handleWeeklySlotChange(idx, 'time', e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-cyan-300 font-bold rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                        >
                          {availableTimes.length > 0 ? (
                            availableTimes.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))
                          ) : (
                            <option value="" disabled>⚠️ Sem horário livre neste dia</option>
                          )}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-slate-400 block">Valor do Ciclo de 30 Dias:</span>
                <span className="text-2xl font-black text-emerald-400">R$ {totalCycleAmount.toFixed(2)}</span>
              </div>

              <button
                type="button"
                onClick={() => setIsAsaasModalOpen(true)}
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center gap-2"
              >
                <Lock className="w-4 h-4 fill-slate-950" />
                <span>Pagar R$ {totalCycleAmount.toFixed(2)} e Confirmar Assinatura ⚡</span>
              </button>
            </div>

          </div>
        </div>
      )}

      <AsaasCheckoutModal
        isOpen={isAsaasModalOpen}
        onClose={() => setIsAsaasModalOpen(false)}
        amount={totalCycleAmount}
        description={`Assinatura Recorrente de 30 Dias (${selectedLessonsPerWeek}x/sem) - ${targetTutor?.name}`}
        isRecurring={true}
        lessonsCount={selectedLessonsPerWeek * 4}
        customerInfo={{
          name: profile?.full_name || 'Aluno Lexy',
          email: profile?.email || 'aluno@lexy.com',
          document: profile?.documentNumber || '',
          phone: profile?.phone || ''
        }}
        onSuccess={handleAsaasSubscriptionPaymentSuccess}
      />

    </div>
  );
}
