import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, Video, Clock, CreditCard, MessageSquare, 
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

  // Redirección de protección de rol
  useEffect(() => {
    if (profile?.role === 'teacher') {
      navigate('/dashboard/teacher', { replace: true });
    }
  }, [profile, navigate]);

  const currentName = profile?.full_name || student.name || 'Gabriel Aluno';
  const currentEmail = profile?.email || student.email || 'aluno@preply.com';
  const currentDocument = profile?.documentNumber || student.documentNumber || '123.456.789-00';
  const currentCountry = profile?.residenceCountry || student.residenceCountry || 'Brasil 🇧🇷';
  const currentLevel = 'B2 - Intermediário Avançado 🎓';

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
      feedback: 'Excelente aula! Gabriel praticou conversação fluida e tempo verbal passado. Demonstrou ótimo domínio do vocabulário corporativo.',
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
      navigate('/login');
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

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* TABS HEADER - HORIZONTAL SCROLL ON MOBILE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
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

      {/* HEADER GLOBALS - Recarregar Créditos (Prominent) */}
      <div className="flex justify-between items-center bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-sky-400" />
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Saldo Atual</p>
            <p className="text-xl font-black text-white">R$ {student.walletBalance?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('carteira')}
          className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          <span className="hidden sm:inline">Recarregar Créditos</span>
          <span className="sm:hidden">Recarregar</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'inicio' && (
        <div className="space-y-6">
          {showWelcome && (
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden glow-gold">
              <button onClick={dismissWelcome} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
              <div className="max-w-2xl">
                <h2 className="text-2xl font-black text-white mb-2">🎉 Bem-vindo(a) à Lexy Idiomas!</h2>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  Estamos muito felizes em ter você aqui. Na Lexy, você aprende com os melhores tutores no seu próprio ritmo. 
                  Para começar a agendar suas aulas, você precisará de créditos na sua carteira. 
                  Navegue pelo nosso catálogo, escolha seu professor ideal e transforme seu futuro!
                </p>
                <button
                  onClick={() => setActiveTab('carteira')}
                  className="bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Recarregar Créditos Lexy
                </button>
              </div>
            </div>
          )}

          {studentAnnouncements.map(ann => (
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
            </div>
          ))}

          {/* PRIORITY: Próximas Aulas Agendadas */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Minhas Próximas Aulas Agendadas
            </h2>
            
            {myBookingsList.length === 0 ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Você ainda não possui aulas agendadas</h3>
                <p className="text-xs text-slate-400 mt-2">Escolha um professor no catálogo e agende sua aula!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myBookingsList.map((booking) => (
                  <div key={booking.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4">
                    <div className="flex items-center gap-4">
                      <img src={booking.tutorAvatar} alt={booking.tutorName} className="w-14 h-14 rounded-2xl object-cover border border-cyan-500/40" />
                      <div>
                        <h3 className="font-extrabold text-white text-base">{booking.tutorName}</h3>
                        <p className="text-xs text-cyan-400 font-semibold">{booking.tutorSubject}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{booking.day} às <strong>{booking.time}</strong></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold">
                      {booking.status === 'absence_reported' ? (
                        <span className="text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                          Falta Informada: {booking.absenceReason}
                        </span>
                      ) : (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                          Status: Confirmada
                        </span>
                      )}
                    </div>
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <button onClick={() => navigate(`/classroom/${booking.id}`)} className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                        <Video className="w-4 h-4" /> Entrar na Aula
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'catalogo' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" /> Catálogo de Tutores Lexy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedTutors.map((tutor) => (
              <div key={tutor.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-cyan-400 transition-all flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-3">
                  <img src={tutor.avatar} alt={tutor.name} className="w-14 h-14 rounded-2xl object-cover border border-cyan-400" />
                  <div>
                    <h3 className="font-extrabold text-white text-base">{tutor.name} {tutor.flag}</h3>
                    <p className="text-xs text-cyan-400 font-semibold">{tutor.subject}</p>
                    <div className="flex items-center gap-2 text-xs text-amber-300 font-bold mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {tutor.rating}
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-black text-emerald-400">R$ {tutor.hourlyRate}/h</span>
                  </div>
                  <button onClick={() => navigate(`/tutor/${tutor.id}`)} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all">
                    Ver Perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-cyan-500/30">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-cyan-400" /> Conversas com Tutores
          </h2>
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 h-96 overflow-y-auto space-y-3">
            {directChatMessages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'student' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.senderRole === 'student'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                }`}>
                  <span className="text-[10px] opacity-80 block font-black mb-0.5">{msg.senderName}</span>
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 font-mono">{msg.timestamp}</span>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!studentChatMessage.trim()) return;
            sendDirectMessage({ senderName: currentName, senderRole: 'student', text: studentChatMessage });
            setStudentChatMessage('');
          }} className="flex gap-2">
            <input
              type="text"
              value={studentChatMessage}
              onChange={(e) => setStudentChatMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400"
            />
            <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm px-6 py-3 rounded-xl flex items-center gap-2">
              Enviar <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {activeTab === 'carteira' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800 bg-slate-950/50">
          <StudentWallet />
          <div className="text-center mt-4">
            <button onClick={() => navigate('/dashboard/student/wallet')} className="text-amber-500 text-sm font-bold hover:underline">
              Ver página completa da carteira
            </button>
          </div>
        </div>
      )}

      {activeTab === 'perfil' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800">
          <div className="flex items-center gap-6 mb-8">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80" alt={currentName} className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-xl" />
            <div>
              <h1 className="text-3xl font-extrabold text-white">{currentName}</h1>
              <p className="text-slate-400">{currentEmail}</p>
              <span className="inline-block mt-2 bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/40">Aluno Ativo</span>
            </div>
          </div>
          <div className="space-y-4 text-sm bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-between py-2 border-b border-slate-800"><span className="text-slate-400">CPF / Doc:</span><strong className="text-white">{currentDocument}</strong></div>
            <div className="flex justify-between py-2 border-b border-slate-800"><span className="text-slate-400">País de Residência:</span><strong className="text-white">{currentCountry}</strong></div>
            <div className="flex justify-between py-2 border-b border-slate-800"><span className="text-slate-400">Nível do Idioma:</span><strong className="text-amber-300">{currentLevel}</strong></div>
            <div className="flex justify-between py-2"><span className="text-slate-400">Motivação:</span><strong className="text-white">Crescimento Profissional / Business English</strong></div>
          </div>
          <button className="w-full bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm py-3 rounded-xl hover:bg-slate-800 transition-colors">
            Editar Perfil (Em breve)
          </button>
          <button onClick={handleLogout} className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-sm py-3 rounded-xl hover:bg-rose-500/20 transition-colors mt-4">
            Sair da Conta (Logout)
          </button>
        </div>
      )}
    </div>
  );
}
