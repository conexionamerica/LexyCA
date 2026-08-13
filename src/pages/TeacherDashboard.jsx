import React, { useState } from 'react';
import { useMarketplace, getTeacherEarnPercent } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, Clock, DollarSign, Users, Star, 
  CheckCircle2, Video, Sparkles, Settings, Save, AlertCircle, 
  MessageSquare, ChevronRight, UserCheck, ShieldCheck, ArrowRight, X, ExternalLink, Wallet, ArrowUpRight, Check, Award, FileText, Megaphone, Send, TrendingUp, HelpCircle, User, Home 
} from 'lucide-react';

export default function TeacherDashboard() {
  const { 
    tutors, updateTutorSchedule, bookings, completeBooking, 
    announcements, directChatMessages, sendDirectMessage, incrementTutorLessons, tierRates 
  } = useMarketplace();
  
  const { profile } = useAuth();

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

  const teacherAnnouncements = announcements.filter(a => a.target === 'all' || a.target === 'teachers');

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
  const [activeTab, setActiveTab] = useState('inicio');
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
      grossAmount: 23.00,
      fee: 0,
      netAmount: Number((23.00 * (currentEarnPercent / 100)).toFixed(2)),
      status: 'Liberado',
      feedback: 'Excelente aula! Praticamos conversação fluida.'
    }
  ]);

  const tutorBookings = bookings.filter(b => b.tutorId === tutor.id || true);
  const nextBooking = tutorBookings[0] || {
    id: 'booking-demo-1',
    studentName: 'Gabriel Alumno',
    studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    day: 'Hoje',
    time: '15:00',
    amount: hourlyRate,
    bookingType: 'subscription',
    status: 'confirmed'
  };

  const isNextTrial = nextBooking.bookingType === 'trial';
  const classEarnPercent = getTeacherEarnPercent(totalLessons, isNextTrial, tierRates);
  const netEarningsNextClass = Number((nextBooking.amount * (classEarnPercent / 100)).toFixed(2));

  const handleOpenFeedbackModal = () => {
    setIsFeedbackModalOpen(true);
  };

  const handleSubmitFeedbackAndCompleteClass = (e) => {
    e.preventDefault();

    incrementTutorLessons(tutor.id);
    setEarnedBalance(prev => Number((prev + netEarningsNextClass).toFixed(2)));

    const newEarnItem = {
      id: `earn-${Date.now()}`,
      studentName: nextBooking.studentName,
      studentAvatar: nextBooking.studentAvatar,
      date: `${nextBooking.day} às ${nextBooking.time}`,
      classType: isNextTrial ? 'Aula Experimental' : 'Assinatura 28 dias',
      grossAmount: nextBooking.amount,
      fee: 0,
      netAmount: netEarningsNextClass,
      status: 'Liberado',
      feedback: feedbackText
    };

    setEarningsHistory(prev => [newEarnItem, ...prev]);
    setIsClassCompletedState(true);
    setIsFeedbackModalOpen(false);
    
    completeBooking(nextBooking.id);

    setPayoutSuccessMsg(`🎉 Aula Concluída! +$${netEarningsNextClass} USD adicionados ao seu Saldo Liberado Payout (Margem de ${classEarnPercent}%)!`);
    setTimeout(() => setPayoutSuccessMsg(''), 6000);
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-20">
      {/* HEADER DO PAINEL */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={tutor.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
            alt={tutor.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-xl"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Painel do Tutor: {tutor.name}</h1>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                tutor.status === 'approved' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {tutor.status === 'approved' ? '✓ Aprovado' : '⌛ Pendente'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Gerencie sua agenda (07h às 23h), acompanhe ganhos e solicite saques.
            </p>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO EM ABAS - SCROLL HORIZONTAL NO CELULAR */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto scrollbar-none whitespace-nowrap max-w-3xl mx-auto">
        {[
          { id: 'inicio', icon: Home, label: 'Início' },
          { id: 'agenda', icon: Calendar, label: 'Agenda' },
          { id: 'alunos', icon: Users, label: 'Alunos' },
          { id: 'ganhos', icon: DollarSign, label: 'Ganhos' },
          { id: 'perfil', icon: Settings, label: 'Perfil' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="mt-6">
        
        {/* ABA: INÍCIO */}
        {activeTab === 'inicio' && (
          <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
            
            {tutor.status === 'pending' && (
              <div className="bg-amber-500/20 border-2 border-amber-400 text-amber-300 p-4 sm:p-5 rounded-3xl flex items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-amber-400 shrink-0 animate-pulse" />
                  <div>
                    <h3 className="font-extrabold text-white text-sm">Perfil de Tutor em Análise pela Administração</h3>
                    <p className="text-xs text-amber-200/90 mt-0.5">
                      Seu cadastro foi recebido. Você já pode configurar seus horários, tarifa e Meet.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!welcomeDismissed && (
              <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 p-6 rounded-3xl relative animate-fade-in-up">
                <button onClick={handleDismissWelcome} className="absolute top-4 right-4 text-amber-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex gap-4">
                  <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400 shrink-0 h-min">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white mb-2">🎉 Bem-vindo(a) ao Painel do Professor Lexy!</h2>
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                      Estamos felizes em ter você conosco! Para começar:
                      <br/>1. Acesse a aba <strong>Agenda</strong> para definir sua disponibilidade.
                      <br/>2. Vá em <strong>Perfil</strong> para configurar seu Meet e sua tarifa.
                      <br/>3. Na aba <strong>Ganhos</strong>, você solicita seus resgates!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {payoutSuccessMsg && (
              <div className="bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 p-4 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                <span className="text-xs font-extrabold text-white">{payoutSuccessMsg}</span>
              </div>
            )}

            {teacherAnnouncements.map(ann => (
              <div key={ann.id} className="bg-slate-900/95 border-2 border-cyan-400 text-white p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shrink-0">
                    <Megaphone className="w-6 h-6 text-cyan-400 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base tracking-wide">{ann.title}</h3>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">{ann.content}</p>
                  </div>
                </div>
                <span className="text-xs bg-cyan-500 text-slate-950 px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider shrink-0 shadow-md">
                  📢 Anúncio Oficial
                </span>
              </div>
            ))}

            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-cyan-500/40 glow-cyan">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase mb-1">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> Aulas do Dia
                  </div>
                  <h2 className="text-xl font-extrabold text-white">Sua Próxima Aula</h2>
                </div>
              </div>

              {nextBooking ? (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={nextBooking.studentAvatar}
                      alt={nextBooking.studentName}
                      className="w-14 h-14 rounded-2xl object-cover border border-cyan-400"
                    />
                    <div>
                      <h3 className="font-extrabold text-white text-base">Aluno: {nextBooking.studentName}</h3>
                      <p className="text-xs text-cyan-400 font-semibold">{nextBooking.day} às {nextBooking.time}</p>
                      <p className="text-xs text-slate-300 mt-1">
                        Repasse ({classEarnPercent}%): <strong className="text-emerald-400 font-black">${netEarningsNextClass} USD</strong>
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                    <a
                      href={`/classroom/${nextBooking.id}`}
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Entrar na Aula</span>
                    </a>

                    {!isClassCompletedState ? (
                      <button
                        onClick={handleOpenFeedbackModal}
                        className="bg-slate-900 hover:bg-slate-800 border border-amber-400/50 text-amber-300 font-extrabold text-xs px-5 py-3 rounded-xl shadow flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        <span>Confirmar Conclusão</span>
                      </button>
                    ) : (
                      <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5">
                        ✓ Concluída
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <p className="text-slate-400">Nenhuma aula agendada para hoje 🌟</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA: AGENDA */}
        {activeTab === 'agenda' && (
          <div className="animate-fade-in-up max-w-5xl mx-auto">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-cyan-500/30">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    Editor de Disponibilidade Semanal (07:00 às 23:00)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selecione os horários abertos (verde) para agendamento dos alunos.
                  </p>
                </div>

                <button
                  onClick={handleSaveSchedule}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Agenda</span>
                </button>
              </div>

              {isScheduleSaved && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Agenda de horários salva com sucesso!</span>
                </div>
              )}

              <div className="space-y-4">
                {days.map(day => {
                  const activeCount = (schedule[day] || []).length;
                  return (
                    <div key={day} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-amber-400">{day}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                            {activeCount} horários ativos
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <button onClick={() => handleSelectAllDay(day)} className="text-cyan-400 font-bold hover:underline">Marcar Todos</button>
                          <span className="text-slate-600">|</span>
                          <button onClick={() => handleClearDay(day)} className="text-slate-400 font-bold hover:underline">Limpar</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-1.5">
                        {ALL_SLOTS.map(slot => {
                          const isActive = (schedule[day] || []).includes(slot);
                          return (
                            <button
                              key={slot}
                              onClick={() => toggleSlot(day, slot)}
                              className={`py-2 rounded-xl text-[11px] font-mono font-extrabold transition-all ${
                                isActive
                                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                                  : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-200'
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
          </div>
        )}

        {/* ABA: ALUNOS */}
        {activeTab === 'alunos' && (
          <div className="animate-fade-in-up max-w-4xl mx-auto">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-cyan-500/30">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white">Meus Alunos & Chat</h2>
                    <span className="text-xs text-slate-400">Selecione o aluno para conversar</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Conversar com:</span>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="bg-slate-900 border border-cyan-500/50 text-cyan-300 font-extrabold text-xs rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-cyan-400"
                  >
                    {myStudentsList.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">Alunos:</span>
                {myStudentsList.map(st => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStudentId(st.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                      selectedStudentId === st.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <img src={st.avatar} alt={st.name} className="w-5 h-5 rounded-full object-cover" />
                    <span>{st.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 h-80 overflow-y-auto space-y-3">
                {activeStudentMessages.length > 0 ? (
                  activeStudentMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.senderRole === 'teacher' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.senderRole === 'teacher'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-200'
                      }`}>
                        <span className="text-[10px] opacity-80 block font-black mb-0.5">{msg.senderName}</span>
                        <p>{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 font-mono">{msg.timestamp}</span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                    Nenhuma mensagem anterior com {selectedStudent.name}. Digite abaixo para iniciar.
                  </div>
                )}
              </div>

              <form onSubmit={handleSendTeacherChat} className="flex gap-2">
                <input
                  type="text"
                  value={teacherChatMessage}
                  onChange={(e) => setTeacherChatMessage(e.target.value)}
                  placeholder={`Digitar mensagem para ${selectedStudent.name}...`}
                  className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow flex items-center gap-1.5"
                >
                  <span>Enviar</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ABA: GANHOS */}
        {activeTab === 'ganhos' && (
          <div className="space-y-6 animate-fade-in-up max-w-5xl mx-auto">
            
            {/* BOTÃO DE SAQUE E SALDO NO TOPO DESTA ABA - IMMEDIATELY VISIBLE */}
            <div className="glass-panel rounded-3xl p-6 border border-emerald-500/40 glow-emerald flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                  <DollarSign className="w-7 h-7 text-emerald-400" />
                  Seus Ganhos & Saques
                </h2>
                <p className="text-slate-400 text-sm mt-1">Acompanhe suas receitas e solicite pagamentos para sua conta bancária.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 min-w-[200px] text-center w-full sm:w-auto">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Saldo Liberado (Payout)</span>
                  <span className="text-3xl font-black text-emerald-400">${earnedBalance.toFixed(2)} USD</span>
                </div>

                <button
                  onClick={() => setIsPayoutModalOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-sm px-8 py-5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105"
                >
                  <Wallet className="w-5 h-5" />
                  <span>Solicitar Saque</span>
                </button>
              </div>
            </div>

            {/* MARGEM DE GANHO */}
            <div className="glass-panel rounded-3xl p-6 space-y-5 border border-emerald-500/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Sua Margem de Repasse: {currentEarnPercent}% por aula</h3>
                  <p className="text-xs text-slate-400">Quanto mais aulas você der, maior é a sua fatia dos lucros!</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white">Aulas Totais: <strong className="text-amber-400 font-extrabold text-sm">{totalLessons}</strong></span>
                  {nextTier.remaining > 0 ? (
                    <span className="text-emerald-400">
                      Faltam <strong>{nextTier.remaining} aulas</strong> para <strong>{nextTier.nextEarn}%</strong>!
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-black">🎉 Margem Máxima!</span>
                  )}
                </div>

                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (totalLessons / 51) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* HISTÓRICO DE GANHOS */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Histórico de Aulas
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {earningsHistory.map((item) => (
                    <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img src={item.studentAvatar} alt={item.studentName} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                          <div>
                            <h4 className="font-extrabold text-white text-sm">{item.studentName}</h4>
                            <p className="text-xs text-slate-400">{item.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <strong className="text-emerald-400 font-black text-sm">+${item.netAmount} USD</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HISTÓRICO DE SAQUES */}
              <div className="glass-panel rounded-3xl p-6 border border-emerald-500/30 space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    Solicitações de Resgate
                  </span>
                </h3>

                <div className="space-y-3">
                  {payoutRequests.map(req => (
                    <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">{req.date}</span>
                        <strong className="text-emerald-400 font-black">${req.amount.toFixed(2)} USD</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">{req.method}</span>
                        {req.status === 'approved' ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Aprovado
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 font-bold animate-pulse">
                              ⌛ Em Análise
                            </span>
                            <button
                              onClick={() => handleSimulateAdminApprove(req.id)}
                              className="bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded hover:bg-amber-400"
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
                  <label className="text-xs font-bold text-slate-400 block mb-1">Link do Google Meet Pessoal *</label>
                  <div className="relative">
                    <Video className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      required
                      value={meetUrl}
                      onChange={(e) => setMeetUrl(e.target.value)}
                      placeholder="https://meet.google.com/abc-defg-hij"
                      className="w-full bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs rounded-xl pl-9 pr-3.5 py-2.5 outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

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
                <label className="text-xs font-bold text-slate-400 block mb-1">Valor a Sacar ($ USD) *</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
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
                <span className="text-[10px] text-slate-400 mt-1 block">Disponível: ${earnedBalance.toFixed(2)} USD</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor Bruto:</span>
                  <strong className="text-white font-bold">${payoutAmount.toFixed(2)} USD</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 text-emerald-400 font-bold">
                  <span>Valor Líquido ({currentEarnPercent}%):</span>
                  <strong className="text-base font-black">${(payoutAmount * (currentEarnPercent / 100)).toFixed(2)} USD</strong>
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

    </div>
  );
}
