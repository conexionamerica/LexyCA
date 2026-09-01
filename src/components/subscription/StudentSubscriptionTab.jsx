import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Calendar, Clock, CreditCard, ShieldCheck, 
  AlertCircle, CheckCircle2, PauseCircle, XCircle, 
  RefreshCw, Award, UserCheck, Lock, ArrowRight, Zap, FileText
} from 'lucide-react';
import { useMarketplace } from '../../contexts/MarketplaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import StoneCheckoutModal from '../payment/StoneCheckoutModal';

export default function StudentSubscriptionTab() {
  const navigate = useNavigate();
  const { subscriptions, tutors, createBooking, bookings } = useMarketplace();
  const { profile } = useAuth();

  const studentMatricula = profile?.matricula_code || 'LXY-2026-784219';
  
  const userSubscriptions = useMemo(() => {
    if (!profile) return [];
    const pId = String(profile.id || '').toLowerCase();
    const pEmail = String(profile.email || '').toLowerCase();
    const pMat = String(profile.matricula_code || '').toLowerCase();

    return (subscriptions || []).filter(sub => {
      const sStudentId = String(sub.studentId || '').toLowerCase();
      const sStudentEmail = String(sub.studentEmail || '').toLowerCase();
      const sStudentMat = String(sub.studentMatricula || '').toLowerCase();

      if (sStudentId || sStudentEmail || sStudentMat) {
        return (pId && sStudentId === pId) || 
               (pEmail && sStudentEmail === pEmail) || 
               (pMat && sStudentMat === pMat);
      }
      return false;
    });
  }, [subscriptions, profile]);

  const [activeSubState, setActiveSubState] = useState(null);
  const activeSub = activeSubState || userSubscriptions[0] || null;

  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [pauseDays, setPauseDays] = useState(15);
  const [actionNotice, setActionNotice] = useState('');

  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [selectedLessonsPerWeek, setSelectedLessonsPerWeek] = useState(2);
  const [isStoneModalOpen, setIsStoneModalOpen] = useState(false);

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
    if (activeSub) {
      return tutors.find(t => t.id === activeSub.tutorId) || tutors[0];
    }
    if (lastBooking) {
      return tutors.find(t => t.id === lastBooking.tutorId) || tutors[0];
    }
    return tutors.find(t => t.status === 'approved') || tutors[0];
  }, [tutors, activeSub, lastBooking]);

  const tutorHourlyRate = Number(targetTutor?.hourlyRate || targetTutor?.hourly_rate || 20);

  const tutorSchedule = targetTutor?.weeklySchedule || {};
  const ALL_WEEK_DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const configuredDays = Object.keys(tutorSchedule).filter(d => (tutorSchedule[d] || []).length > 0);
  const availableDays = configuredDays.length > 0 ? configuredDays : ALL_WEEK_DAYS;

  const [weeklySlots, setWeeklySlots] = useState(() => {
    return Array.from({ length: 4 }, (_, idx) => {
      const day = availableDays[idx % availableDays.length] || 'Segunda';
      const times = tutorSchedule[day] || ['09:00'];
      return { day, time: times[0] || '09:00' };
    });
  });

  const handleWeeklySlotChange = (index, field, value) => {
    setWeeklySlots(prev => {
      const copy = [...prev];
      if (field === 'day') {
        const times = tutorSchedule[value] || ['09:00'];
        copy[index] = { day: value, time: times[0] || '09:00' };
      } else {
        copy[index] = { ...copy[index], time: value };
      }
      return copy;
    });
  };

  const totalContractedHours = selectedLessonsPerWeek * 4;
  const totalCycleAmount = Number((tutorHourlyRate * totalContractedHours).toFixed(2));

  const userHistory = useMemo(() => {
    const rawHistory = JSON.parse(localStorage.getItem('lexy_wallet_history') || '[]');
    if (!profile) return rawHistory;
    const pId = String(profile.id || '').toLowerCase();
    const pEmail = String(profile.email || '').toLowerCase();

    return rawHistory.filter(h => {
      const hStudentId = String(h.studentId || h.userId || '').toLowerCase();
      const hStudentEmail = String(h.studentEmail || h.userEmail || '').toLowerCase();

      if (hStudentId || hStudentEmail) {
        return (pId && hStudentId === pId) || (pEmail && hStudentEmail === pEmail);
      }
      return true;
    });
  }, [profile]);

  const handleStoneSubscriptionPaymentSuccess = (paymentResult) => {
    setIsStoneModalOpen(false);
    setIsSubscribeModalOpen(false);

    const activeSlots = weeklySlots.slice(0, selectedLessonsPerWeek);
    const primarySlot = activeSlots[0];

    createBooking({
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

    setActionNotice(`🎉 Assinatura ativada com sucesso! Suas ${totalContractedHours} aulas do ciclo de 30 dias com ${targetTutor.name} foram agendadas na aba Início.`);
    setTimeout(() => setActionNotice(''), 8000);
  };

  const handlePauseSubscription = () => {
    if (!activeSub) return;
    const nextDateObj = new Date(activeSub.nextBillingDate || Date.now());
    nextDateObj.setDate(nextDateObj.getDate() + Number(pauseDays));
    const newPausedUntil = nextDateObj.toISOString();

    const updatedSub = {
      ...activeSub,
      status: 'paused',
      pausedUntil: newPausedUntil,
      nextBillingDate: newPausedUntil,
      pauseDaysLeft: Math.max(0, (activeSub.pauseDaysLeft || 20) - Number(pauseDays))
    };

    setActiveSubState(updatedSub);
    setIsPauseModalOpen(false);
    setActionNotice(`⏸️ Assinatura pausada por ${pauseDays} dias. Próxima cobrança prorrogada para ${new Date(newPausedUntil).toLocaleDateString('pt-BR')}.`);
    setTimeout(() => setActionNotice(''), 6000);
  };

  const handleReactivateSubscription = () => {
    if (!activeSub) return;
    const updatedSub = { ...activeSub, status: 'active', pausedUntil: null };
    setActiveSubState(updatedSub);
    setActionNotice(`▶️ Assinatura reativada com sucesso! Cobrança de 28 dias mantida.`);
    setTimeout(() => setActionNotice(''), 6000);
  };

  const handleCancelSubscription = () => {
    if (!activeSub) return;
    const updatedSub = { ...activeSub, status: 'canceled' };
    setActiveSubState(updatedSub);
    setIsCancelModalOpen(false);
    setActionNotice(`🚫 Assinatura cancelada. As cobranças automáticas de 28 dias foram interrompidas.`);
    setTimeout(() => setActionNotice(''), 7000);
  };

  const formattedNextDate = activeSub?.nextBillingDate
    ? new Date(activeSub.nextBillingDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '23/09/2026';

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
            Meu Plano de Aulas & Assinatura Recorrente (28 Dias)
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
        <div className="glass-panel border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-4">
              <img 
                src={targetTutor?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'} 
                alt={targetTutor?.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-md shrink-0" 
              />
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span>Professor Selecionado</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">{targetTutor?.name}</h3>
                <p className="text-xs text-slate-400">{targetTutor?.subject} • Tarifa: <strong className="text-emerald-400">R$ {tutorHourlyRate}.00 / hora</strong></p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Status da Assinatura</span>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Sem Assinatura Recorrente Ativa
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Ative seu Plano Recorrente de 28 Dias com {targetTutor?.name}</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Garanta seu horário semanal reservado na agenda nativa do seu professor. A cobrança é realizada a cada 28 dias com base na tarifa por hora fixada pelo seu professor (<strong>R$ {tutorHourlyRate}.00/hora</strong>).
            </p>

            <div className="pt-2">
              <button
                onClick={() => setIsSubscribeModalOpen(true)}
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Ativar Assinatura Recorrente de 28 Dias com {targetTutor?.name}</span>
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 space-y-5 shadow-lg relative overflow-hidden">
              
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  {activeSub.status === 'active' && (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Assinatura Ativa (Ciclo 28 Dias)
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
                      {activeSub.planName || 'Assinatura de 28 Dias'}
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
                  <p className="text-[11px] text-slate-400">{activeSub.planHours || 8} aulas no ciclo de 28 dias</p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valor do Ciclo</span>
                  <p className="text-sm font-bold text-emerald-400">R$ {Number(activeSub.monthlyPrice || 360).toFixed(2)}</p>
                  <p className="text-[11px] text-slate-400">Cobrado a cada 28 dias</p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Próxima Renovação</span>
                  <p className="text-sm font-bold text-cyan-300">{formattedNextDate}</p>
                  <p className="text-[11px] text-slate-400">Cobrança automática Stone S.A.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                {activeSub.status === 'active' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsPauseModalOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <PauseCircle className="w-4 h-4 text-amber-400" />
                      <span>Pausar Assinatura</span>
                    </button>

                    <button
                      onClick={() => setIsCancelModalOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Cancelar Assinatura</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleReactivateSubscription}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-950" />
                    <span>Recontratar Assinatura</span>
                  </button>
                )}
              </div>

            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-4 space-y-3 shadow-sm">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Regras do Ciclo de 28 Dias
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-1">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Agendamento Recorrente Fixo
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Seus horários ficam bloqueados e reservados semanalmente com seu professor durante os 28 dias do ciclo.
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
            {userHistory.map((item, idx) => (
              <div key={item.id || idx} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">{item.desc || 'Pagamento Lexy Platform'}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{item.date}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-400 block">R$ {Number(item.amount || 0).toFixed(2)}</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    {item.status || 'Concluído'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isSubscribeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">Assinar Plano de Aulas com {targetTutor?.name}</h3>
                <p className="text-xs text-slate-400">Ciclo de 28 Dias • Tarifa do Professor: R$ {tutorHourlyRate}.00/h</p>
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
                      <span className="text-[11px] text-slate-400 block mt-0.5">{hoursInCycle} aulas por ciclo de 28 dias</span>
                      <div className="mt-2 text-sm font-black text-emerald-400">
                        R$ {priceInCycle} / 28 dias
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
                  const currentSlot = weeklySlots[idx] || { day: availableDays[0] || 'Segunda', time: '09:00' };
                  const availableTimes = tutorSchedule[currentSlot.day] || ['09:00'];

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
                          {availableTimes.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-slate-400 block">Valor do Ciclo de 28 Dias:</span>
                <span className="text-2xl font-black text-emerald-400">R$ {totalCycleAmount.toFixed(2)}</span>
              </div>

              <button
                type="button"
                onClick={() => setIsStoneModalOpen(true)}
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center gap-2"
              >
                <Lock className="w-4 h-4 fill-slate-950" />
                <span>Pagar R$ {totalCycleAmount.toFixed(2)} e Confirmar Assinatura ⚡</span>
              </button>
            </div>

          </div>
        </div>
      )}

      <StoneCheckoutModal
        isOpen={isStoneModalOpen}
        onClose={() => setIsStoneModalOpen(false)}
        amount={totalCycleAmount}
        description={`Assinatura Recorrente de 28 Dias (${selectedLessonsPerWeek}x/sem) - ${targetTutor?.name}`}
        isRecurring={true}
        customerInfo={{
          name: profile?.full_name || 'Aluno Lexy',
          email: profile?.email || 'aluno@lexy.com',
          document: profile?.documentNumber || '603.198.610-82'
        }}
        onSuccess={handleStoneSubscriptionPaymentSuccess}
      />

    </div>
  );
}
