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

  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState(null);
  const [rescheduleDay, setRescheduleDay] = useState('Quarta-feira');
  const [rescheduleTime, setRescheduleTime] = useState('16:00');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  const handleConfirmReschedule = (e) => {
    e.preventDefault();
    if (!selectedBookingForReschedule) return;
    setMyBookingsList(prev => prev.map(b => b.id === selectedBookingForReschedule.id ? { ...b, day: rescheduleDay, time: rescheduleTime, status: 'rescheduled' } : b));
    setActionSuccessMessage(`🔄 Reagendamento solicitado para ${rescheduleDay} às ${rescheduleTime}! Notificação enviada ao professor.`);
    setSelectedBookingForReschedule(null);
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
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4 animate-fade-in-up">
      
      {/* TABS HEADER DE NAVEGAÇÃO COMPACTO */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-1 flex items-center gap-1 overflow-x-auto scrollbar-none whitespace-nowrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {actionSuccessMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl flex items-center gap-2 text-xs font-medium animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* TAB CONTENT: INÍCIO (COMPACT 2-COLUMN GRID) */}
      {activeTab === 'inicio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* COLUMNA PRINCIPAL (span-2) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Banner Saludo Personalizado Compacto */}
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white">Olá, {currentName}! 👋</h1>
              <p className="text-xs text-slate-400 mt-0.5">{t.studentGreetingSub || "Pronto para dominar um novo idioma hoje?"}</p>
            </div>

            {/* Modal de Boas-Vindas se ativo */}
            {showWelcome && (
              <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden space-y-2">
                <button onClick={dismissWelcome} className="absolute top-3 right-3 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-semibold uppercase">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Bem-vindo à Lexy Idiomas</span>
                </div>
                <h2 className="text-sm font-semibold text-white">Pronto para começar suas aulas?</h2>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Estamos muito felizes em ter você aqui. Escolha seu professor no catálogo e comece a estudar com garantia total de satisfação.
                </p>
                <button
                  onClick={() => setActiveTab('carteira')}
                  className="h-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-xs px-3.5 rounded-lg shadow-sm"
                >
                  + Recarregar Créditos Lexy
                </button>
              </div>
            )}

            {/* Hero Card - Próxima Clase (Plano e Limpo + Glassmorphic Sutil) */}
            {nextBooking ? (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {t.confirmedBadge || "● Confirmada"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    {t.nextClassLabel || "Próxima Aula"}
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  <img 
                    src={nextBooking.tutorAvatar || assignedTutor.avatar} 
                    alt={nextBooking.tutorName || assignedTutor.name}
                    className="w-12 h-12 rounded-full border border-cyan-400/50 object-cover ring-2 ring-cyan-500/40 shrink-0" 
                  />
                  <div>
                    <h3 className="text-base font-semibold text-white">{nextBooking.tutorName || assignedTutor.name}</h3>
                    <p className="text-cyan-400 text-xs font-medium">
                      {nextBooking.tutorSubject || assignedTutor.subject} • Aula Individual
                    </p>
                    <p className="text-slate-300 text-xs mt-0.5 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{nextBooking.day} às {nextBooking.time}</span>
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/classroom/${nextBooking.id}`)}
                  className="w-full h-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-xs sm:text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.enterVirtualRoom || "🎥 Entrar na Sala Virtual"}</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-5 text-center space-y-2">
                <BookOpen className="w-8 h-8 text-cyan-400 mx-auto" />
                <h3 className="text-sm font-semibold text-white">Nenhuma aula agendada no momento</h3>
                <p className="text-xs text-slate-400">Escolha um tutor no catálogo e agende sua primeira aula!</p>
                <button
                  onClick={() => setActiveTab('catalogo')}
                  className="h-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-xs px-4 rounded-lg shadow-sm"
                >
                  Explorar Tutores
                </button>
              </div>
            )}

            {/* Lista de Aulas e Histórico Compacta */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Minhas Aulas Agendadas</span>
              </h3>

              <div className="space-y-2.5">
                {myBookingsList.map(booking => (
                  <div key={booking.id} className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={booking.tutorAvatar} alt={booking.tutorName} className="w-10 h-10 rounded-full object-cover border border-cyan-400/30 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-white text-xs">{booking.tutorName}</h4>
                        <p className="text-[11px] text-cyan-400 font-medium">{booking.tutorSubject}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-cyan-400" />
                          <span>{booking.day} às {booking.time}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setSelectedBookingForReschedule(booking)}
                        className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        Reagendar
                      </button>
                      <button
                        onClick={() => navigate(`/classroom/${booking.id}`)}
                        className="flex-1 sm:flex-initial bg-cyan-500/20 hover:bg-cyan-500 border border-cyan-500/30 text-cyan-300 hover:text-slate-950 text-xs font-medium px-3.5 py-1.5 rounded-lg transition-all"
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
          <div className="space-y-4">
            
            {/* Widget Billetera LexyPay (Sobria e Limpa) */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-xs tracking-wide">LexyPay Wallet</h3>
                    <span className="text-[10px] text-cyan-400 font-medium block">Carteira Digital</span>
                  </div>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ● Ativa
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-0.5">
                <span className="text-slate-400 text-xs">Saldo em Conta</span>
                <span className="text-xl font-bold text-white tracking-tight">R$ {student.walletBalance?.toFixed(2) || '0.00'}</span>
              </div>

              <button
                onClick={() => setActiveTab('carteira')}
                className="w-full h-9 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Recarregar Créditos LexyPay</span>
              </button>
            </div>

            {/* Widget de Notificações / Anúncios Rápidos */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-white text-xs">Novidades e Avisos</h3>
              </div>

              {studentAnnouncements.length > 0 ? (
                studentAnnouncements.map(ann => (
                  <div key={ann.id} className="p-2.5 bg-slate-950/60 border border-slate-800/60 rounded-lg space-y-0.5">
                    <h4 className="font-medium text-white text-xs">{ann.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{ann.content}</p>
                  </div>
                ))
              ) : (
                <div className="p-2.5 bg-slate-950/60 border border-slate-800/60 rounded-lg space-y-0.5">
                  <h4 className="font-medium text-white text-xs">🚀 Aulas particulares com professores nativos</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Aproveite a flexibilidade da Sala Virtual para agendar suas aulas quando desejar.
                  </p>
                </div>
              )}
            </div>

            {/* Suporte Rápido Widget */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-4 space-y-2.5 shadow-sm text-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto" />
              <h4 className="font-semibold text-white text-xs">Precisa de Ajuda?</h4>
              <p className="text-[11px] text-slate-400">Suporte online 24/7 via WhatsApp.</p>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noreferrer"
                className="w-full h-8 inline-flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 text-emerald-300 hover:text-slate-950 font-medium text-xs rounded-lg transition-all"
              >
                <span>Falar no WhatsApp 💬</span>
              </a>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT: CATÁLOGO COMPACTO */}
      {activeTab === 'catalogo' && (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Catálogo de Tutores Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedTutors.map(tutor => (
              <div key={tutor.id} className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <img src={tutor.avatar} alt={tutor.name} className="w-11 h-11 rounded-full object-cover border border-cyan-400/40" />
                  <div>
                    <h3 className="font-semibold text-white text-sm">{tutor.name}</h3>
                    <p className="text-xs text-cyan-400 font-medium">{tutor.subject} • {tutor.title}</p>
                    <p className="text-xs text-slate-300 font-bold mt-0.5">${tutor.hourlyRate} USD/h</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/book/${tutor.id}`)}
                  className="w-full h-9 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-xs rounded-lg shadow-sm cursor-pointer transition-all"
                >
                  Agendar Aula com {tutor.name.split(' ')[0]}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CHAT COMPACTO */}
      {activeTab === 'chat' && (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Chat com seu Professor</h2>
          <div className="bg-slate-950/80 border border-slate-800/60 rounded-xl p-4 h-72 overflow-y-auto space-y-2">
            {directChatMessages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">Nenhuma mensagem enviada ainda. Digite abaixo para conversar com seu tutor.</p>
            ) : (
              directChatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2.5 rounded-lg max-w-sm text-xs ${msg.sender === 'student' ? 'bg-cyan-500 text-slate-950 font-medium' : 'bg-slate-800 text-slate-200'}`}>
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
              className="flex-1 bg-slate-950 border border-slate-800/80 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => {
                if (studentChatMessage.trim()) {
                  sendDirectMessage(studentChatMessage.trim(), 'student');
                  setStudentChatMessage('');
                }
              }}
              className="h-9 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-xs px-5 rounded-lg cursor-pointer"
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

      {/* TAB CONTENT: PERFIL COMPACTO */}
      {activeTab === 'perfil' && (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-5 space-y-4 max-w-xl mx-auto">
          <h2 className="text-lg font-semibold text-white border-b border-slate-800/60 pb-2">Meu Perfil de Aluno</h2>
          
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 block mb-0.5">Nome Completo</span>
                <span className="text-white font-medium text-xs">{currentName}</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 block mb-0.5">Endereço de E-mail</span>
                <span className="text-white font-medium text-xs">{currentEmail}</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 block mb-0.5">Documento Registrado</span>
                <span className="text-white font-medium text-xs">{currentDocument}</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 block mb-0.5">País de Residência</span>
                <span className="text-white font-medium text-xs">{currentCountry}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="w-full bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 text-rose-300 hover:text-white font-medium text-xs py-2 rounded-lg transition-all cursor-pointer"
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
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 max-w-sm w-full space-y-3">
            <h3 className="text-base font-semibold text-white">Reagendar Aula</h3>
            <p className="text-xs text-slate-400">Escolha o novo dia e horário para sua aula com {selectedBookingForReschedule.tutorName}.</p>

            <form onSubmit={handleConfirmReschedule} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Dia Preferencial</label>
                <select
                  value={rescheduleDay}
                  onChange={(e) => setRescheduleDay(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2.5 text-xs outline-none"
                >
                  <option value="Segunda-feira">Segunda-feira</option>
                  <option value="Terça-feira">Terça-feira</option>
                  <option value="Quarta-feira">Quarta-feira</option>
                  <option value="Quinta-feira">Quinta-feira</option>
                  <option value="Sexta-feira">Sexta-feira</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Horário</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2.5 text-xs outline-none"
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
                  className="flex-1 bg-slate-900 text-slate-400 text-xs font-medium py-2 rounded-lg border border-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 text-slate-950 text-xs font-medium py-2 rounded-lg shadow-sm"
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
