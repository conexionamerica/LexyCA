import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Calendar, Video, CreditCard, MessageSquare, 
  Search, Star, CheckCircle2, Award, Heart, Plus, Sparkles, 
  BookOpen, ChevronRight, Wallet, UserCheck, ShieldCheck, 
  RefreshCw, AlertTriangle, FileText, User, X, Check, Megaphone, Send 
} from 'lucide-react';
import StudentWallet from './StudentWallet';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { 
    student, tutors, bookings, completeBooking, 
    announcements, directChatMessages, sendDirectMessage 
  } = useMarketplace();
  const { profile, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('inicio');

  // Welcome modal logic
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('lexy_welcome_dismissed');
  });

  const dismissWelcome = () => {
    localStorage.setItem('lexy_welcome_dismissed', 'true');
    setShowWelcome(false);
  };

  // Anúncios direcionados aos alunos
  const studentAnnouncements = announcements ? announcements.filter(a => a.target === 'all' || a.target === 'students') : [];

  // Redireção de proteção de rol
  useEffect(() => {
    if (profile?.role === 'teacher') {
      navigate('/dashboard/teacher', { replace: true });
    }
  }, [profile, navigate]);

  const currentName = profile?.full_name || student.name || 'Aluno';
  const currentEmail = profile?.email || student.email || 'aluno@lexy.com';
  const currentDocument = profile?.documentNumber || student.documentNumber || '123.456.789-00';
  const currentCountry = profile?.residenceCountry || student.residenceCountry || 'Brasil 🇧🇷';

  const approvedTutors = tutors.filter(t => t.status === 'approved');
  const assignedTutor = approvedTutors[0] || tutors[0];

  const [studentChatMessage, setStudentChatMessage] = useState('');

  const [myBookingsList, setMyBookingsList] = useState(() => {
    return bookings.length > 0 ? bookings : [
      {
        id: 'booking-demo-1',
        tutorId: assignedTutor.id,
        tutorName: assignedTutor.name,
        tutorAvatar: assignedTutor.avatar,
        tutorSubject: assignedTutor.subject,
        studentId: student.id,
        day: 'Segunda-feira',
        time: '15:00',
        amount: assignedTutor.hourlyRate,
        status: 'confirmed'
      }
    ];
  });

  const completedLessonsHistory = [
    {
      id: 'comp-101',
      tutorName: assignedTutor.name,
      tutorAvatar: assignedTutor.avatar,
      tutorSubject: assignedTutor.subject,
      date: '11/08/2026 às 15:00',
      feedback: 'Excelente aula! Praticou conversação fluida e tempo verbal passado. Demonstrou ótimo domínio do vocabulário corporativo.',
      studyTips: 'Revisar a pronúncia das palavras terminadas em -ción e rever o vocabulário de reuniões.',
      status: 'Concluída'
    }
  ];

  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState(null);
  const [selectedBookingForAbsence, setSelectedBookingForAbsence] = useState(null);
  const [rescheduleDay, setRescheduleDay] = useState('Quarta-feira');
  const [rescheduleTime, setRescheduleTime] = useState('16:00');
  const [absenceReason, setAbsenceReason] = useState('Enfermidade / Motivos Médicos');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  const handleConfirmReschedule = (e) => {
    e.preventDefault();
    if (!selectedBookingForReschedule) return;
    setMyBookingsList(prev => prev.map(b => b.id === selectedBookingForReschedule.id ? { ...b, day: rescheduleDay, time: rescheduleTime, status: 'rescheduled' } : b));
    setActionSuccessMessage(`🔄 Reagendamento solicitado para ${rescheduleDay} às ${rescheduleTime}! Notificação enviada ao professor.`);
    setSelectedBookingForReschedule(null);
    setTimeout(() => setActionSuccessMessage(''), 5000);
  };

  const handleConfirmAbsence = (e) => {
    e.preventDefault();
    if (!selectedBookingForAbsence) return;
    setMyBookingsList(prev => prev.map(b => b.id === selectedBookingForAbsence.id ? { ...b, status: 'absence_reported', absenceReason } : b));
    setActionSuccessMessage(`⚠️ Falta informada com sucesso ao professor (${absenceReason}).`);
    setSelectedBookingForAbsence(null);
    setTimeout(() => setActionSuccessMessage(''), 5000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login/student');
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  const tabs = [
    { id: 'inicio', label: '🏠 Início' },
    { id: 'catalogo', label: '📚 Catálogo' },
    { id: 'chat', label: '💬 Chat' },
    { id: 'carteira', label: '💰 Carteira' },
    { id: 'perfil', label: '👤 Perfil' }
  ];

  const nextBooking = myBookingsList.find(b => b.status === 'confirmed' || b.status === 'rescheduled') || myBookingsList[0];

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* TABS HEADER DE NAVEGAÇÃO */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {actionSuccessMessage && (
        <div className="bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 p-4 rounded-2xl flex items-center gap-3 animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-white">{actionSuccessMessage}</span>
        </div>
      )}

      {/* TAB CONTENT: INÍCIO (REESTRUTURADO EM 2 COLUNAS CONFORME BLUEPRINT) */}
      {activeTab === 'inicio' && (
        <div className="max-w-7xl mx-auto py-2 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA PRINCIPAL (span-2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Banner Saludo Personalizado */}
            <div>
              <h1 className="text-3xl font-bold text-white">Olá, {currentName}! 👋</h1>
              <p className="text-slate-400 mt-1">{t.studentGreetingSub || "Pronto para dominar um novo idioma hoje?"}</p>
            </div>

            {/* Modal de Boas-Vindas se ativo */}
            {showWelcome && (
              <div className="bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                <button onClick={dismissWelcome} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bem-vindo à Lexy Idiomas</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">Pronto para começar suas aulas?</h2>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Estamos muito felizes em ter você aqui. Navegue pelo nosso catálogo, escolha seu professor ideal e agende sua primeira aula com garantia total de satisfação.
                  </p>
                  <button
                    onClick={() => setActiveTab('carteira')}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-cyan-500/20"
                  >
                    + Recarregar Créditos Lexy
                  </button>
                </div>
              </div>
            )}

            {/* Hero Card - Próxima Clase (Frutiger Aero Glassmorphism) */}
            {nextBooking ? (
              <div className="bg-gradient-to-r from-slate-900/90 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/20">
                    {t.confirmedBadge || "● Confirmada"}
                  </span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    {t.nextClassLabel || "Próxima Aula"}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <img 
                    src={nextBooking.tutorAvatar || assignedTutor.avatar} 
                    alt={nextBooking.tutorName || assignedTutor.name}
                    className="w-16 h-16 rounded-full border-2 border-cyan-400 object-cover ring-2 ring-cyan-500 shadow-lg" 
                  />
                  <div>
                    <h3 className="text-xl font-bold text-white">{nextBooking.tutorName || assignedTutor.name}</h3>
                    <p className="text-cyan-400 text-sm font-medium">
                      {nextBooking.tutorSubject || assignedTutor.subject} • Aula Individual
                    </p>
                    <p className="text-slate-300 text-sm mt-1 flex items-center gap-1.5 font-semibold">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span>{nextBooking.day} às {nextBooking.time}</span>
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/classroom/${nextBooking.id}`)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.enterVirtualRoom || "🎥 Entrar na Sala Virtual"}</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-cyan-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Nenhuma aula agendada no momento</h3>
                <p className="text-xs text-slate-400">Escolha um tutor no catálogo e agende sua primeira aula!</p>
                <button
                  onClick={() => setActiveTab('catalogo')}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow"
                >
                  Explorar Tutores
                </button>
              </div>
            )}

            {/* Lista de Aulas e Histórico */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span>Minhas Aulas Agendadas</span>
              </h3>

              <div className="space-y-3">
                {myBookingsList.map(booking => (
                  <div key={booking.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={booking.tutorAvatar} alt={booking.tutorName} className="w-12 h-12 rounded-full object-cover border border-cyan-400/40 shrink-0" />
                      <div>
                        <h4 className="font-bold text-white text-sm">{booking.tutorName}</h4>
                        <p className="text-xs text-cyan-400">{booking.tutorSubject}</p>
                        <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{booking.day} às {booking.time}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setSelectedBookingForReschedule(booking)}
                        className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                      >
                        Reagendar
                      </button>
                      <button
                        onClick={() => navigate(`/classroom/${booking.id}`)}
                        className="flex-1 sm:flex-initial bg-cyan-500/20 hover:bg-cyan-500 border border-cyan-500/40 text-cyan-300 hover:text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                      >
                        Entrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COLUMNA LATERAL / BARRA DERECHA (span-1) */}
          <div className="space-y-6">
            
            {/* Widget Billetera LexyPay (Design Redesenhado & Nome Bonito) */}
            <div className="bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-xl space-y-4 shadow-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-cyan-500/20">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm tracking-wide">LexyPay Wallet</h3>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Carteira Digital</span>
                  </div>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/20">
                  ● Ativa
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <span className="text-slate-400 text-xs font-semibold">Saldo em Conta</span>
                <span className="text-2xl font-black text-white tracking-tight">R$ {student.walletBalance?.toFixed(2) || '0.00'}</span>
              </div>

              <button
                onClick={() => setActiveTab('carteira')}
                className="w-full bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer text-xs group-hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Recarregar Créditos LexyPay</span>
              </button>
            </div>

            {/* Widget de Notificações / Anúncios Rápidos */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Novidades e Avisos</h3>
              </div>

              {studentAnnouncements.length > 0 ? (
                studentAnnouncements.map(ann => (
                  <div key={ann.id} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                    <h4 className="font-bold text-white text-xs">{ann.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{ann.content}</p>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                  <h4 className="font-bold text-white text-xs">🚀 Aulas ilimitadas com professores nativos</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Aproveite a flexibilidade do Lexy Space para agendar aulas individuais quando quiser.
                  </p>
                </div>
              )}
            </div>

            {/* Suporte Rápido Widget */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white text-sm">Precisa de Ajuda?</h4>
              <p className="text-xs text-slate-400">Nossa equipe de suporte está online 24/7 no WhatsApp.</p>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/40 text-emerald-300 hover:text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
              >
                <span>Falar no WhatsApp 💬</span>
              </a>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT: CATÁLOGO */}
      {activeTab === 'catalogo' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-2xl font-bold text-white">Catálogo de Tutores Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedTutors.map(tutor => (
                <div key={tutor.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <img src={tutor.avatar} alt={tutor.name} className="w-14 h-14 rounded-full object-cover border-2 border-cyan-400" />
                    <div>
                      <h3 className="font-bold text-white text-base">{tutor.name}</h3>
                      <p className="text-xs text-cyan-400 font-semibold">{tutor.subject} • {tutor.title}</p>
                      <p className="text-xs text-slate-400 font-bold mt-0.5">${tutor.hourlyRate} USD/h</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/book/${tutor.id}`)}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-3 rounded-xl shadow cursor-pointer"
                  >
                    Agendar Aula com {tutor.name.split(' ')[0]}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CHAT */}
      {activeTab === 'chat' && (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-2xl font-bold text-white">Chat com seu Professor</h2>
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 h-80 overflow-y-auto space-y-3">
            {directChatMessages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">Nenhuma mensagem enviada ainda. Digite abaixo para conversar com seu tutor.</p>
            ) : (
              directChatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-xl max-w-sm text-xs ${msg.sender === 'student' ? 'bg-cyan-500 text-slate-950 font-medium' : 'bg-slate-800 text-slate-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite sua mensagem ao tutor..."
              value={studentChatMessage}
              onChange={(e) => setStudentChatMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && studentChatMessage.trim()) {
                  sendDirectMessage(studentChatMessage.trim(), 'student');
                  setStudentChatMessage('');
                }
              }}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => {
                if (studentChatMessage.trim()) {
                  sendDirectMessage(studentChatMessage.trim(), 'student');
                  setStudentChatMessage('');
                }
              }}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CARTEIRA */}
      {activeTab === 'carteira' && (
        <StudentWallet />
      )}

      {/* TAB CONTENT: PERFIL */}
      {activeTab === 'perfil' && (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white border-b border-slate-800 pb-3">Meu Perfil de Aluno</h2>
          
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Nome Completo</span>
                <span className="text-white font-bold text-sm">{currentName}</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Endereço de E-mail</span>
                <span className="text-white font-bold text-sm">{currentEmail}</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Documento Registrado</span>
                <span className="text-white font-bold text-sm">{currentDocument}</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">País de Residência</span>
                <span className="text-white font-bold text-sm">{currentCountry}</span>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                onClick={handleLogout}
                className="w-full bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Sair da Conta (Logout)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REAGENDAMENTO */}
      {selectedBookingForReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Reagendar Aula</h3>
            <p className="text-xs text-slate-400">Escolha o novo dia e horário para sua aula com {selectedBookingForReschedule.tutorName}.</p>

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Dia Preferencial</label>
                <select
                  value={rescheduleDay}
                  onChange={(e) => setRescheduleDay(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 text-xs outline-none"
                >
                  <option value="Segunda-feira">Segunda-feira</option>
                  <option value="Terça-feira">Terça-feira</option>
                  <option value="Quarta-feira">Quarta-feira</option>
                  <option value="Quinta-feira">Quinta-feira</option>
                  <option value="Sexta-feira">Sexta-feira</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Horário</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 text-xs outline-none"
                >
                  <option value="09:00">09:00</option>
                  <option value="11:00">11:00</option>
                  <option value="14:00">14:00</option>
                  <option value="16:00">16:00</option>
                  <option value="18:00">18:00</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForReschedule(null)}
                  className="flex-1 bg-slate-900 text-slate-400 text-xs font-bold py-3 rounded-xl border border-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 text-slate-950 text-xs font-bold py-3 rounded-xl shadow"
                >
                  Confirmar Reagendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
