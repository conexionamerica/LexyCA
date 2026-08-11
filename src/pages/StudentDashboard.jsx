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

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { 
    student, tutors, bookings, completeBooking, 
    announcements, directChatMessages, sendDirectMessage 
  } = useMarketplace();
  const { profile } = useAuth();

  // Anúncios direcionados aos alunos
  const studentAnnouncements = announcements ? announcements.filter(a => a.target === 'all' || a.target === 'students') : [];

  // Redirección de protección de rol: Si el usuario es Profesor, enviarlo a seu próprio Painel de Tutor
  useEffect(() => {
    if (profile?.role === 'teacher') {
      navigate('/dashboard/teacher', { replace: true });
    }
  }, [profile, navigate]);

  // Datos reales del alumno conectado
  const currentName = profile?.full_name || student.name || 'Gabriel Alumno';
  const currentEmail = profile?.email || student.email || 'aluno@preply.com';
  const currentDocument = profile?.documentNumber || student.documentNumber || '123.456.789-00';
  const currentCountry = profile?.residenceCountry || student.residenceCountry || 'Brasil 🇧🇷';
  const currentLevel = 'B2 - Intermediário Avançado 🎓';

  // Tutores aprobados
  const approvedTutors = tutors.filter(t => t.status === 'approved');

  // Tutor primario asignado al alumno (por defecto el 1er tutor aprobado, ej: María Fernández)
  const assignedTutor = approvedTutors[0] || tutors[0];

  // Estado del mensaje del chat interno del alumno
  const [studentChatMessage, setStudentChatMessage] = useState('');

  // Clases agendadas activas del alumno
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

  // Histórico de Aulas Concluídas com Feedback dos Professores
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
    },
    {
      id: 'comp-102',
      tutorName: 'Prof. Carlos Rivera',
      tutorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      tutorSubject: 'Inglês Geral',
      date: '05/08/2026 às 10:00',
      feedback: 'Ótimo desempenho em leitura e interpretação de texto.',
      studyTips: 'Praticar escuta com podcasts em velocidade 1.2x.',
      status: 'Concluída'
    }
  ];

  // Modales interactivos
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState(null);
  const [selectedBookingForAbsence, setSelectedBookingForAbsence] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Estados de los formularios de modal
  const [rescheduleDay, setRescheduleDay] = useState('Quarta-feira');
  const [rescheduleTime, setRescheduleTime] = useState('16:00');
  const [absenceReason, setAbsenceReason] = useState('Enfermidade / Motivos Médicos');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Acción: Confirmar Reagendamiento
  const handleConfirmReschedule = (e) => {
    e.preventDefault();
    if (!selectedBookingForReschedule) return;

    setMyBookingsList(prev => prev.map(b => {
      if (b.id === selectedBookingForReschedule.id) {
        return {
          ...b,
          day: rescheduleDay,
          time: rescheduleTime,
          status: 'rescheduled'
        };
      }
      return b;
    }));

    setActionSuccessMessage(`🔄 Reagendamento solicitado para ${rescheduleDay} às ${rescheduleTime}! Notificação enviada ao professor.`);
    setSelectedBookingForReschedule(null);
    setTimeout(() => setActionSuccessMessage(''), 5000);
  };

  // Acción: Informar Falta
  const handleConfirmAbsence = (e) => {
    e.preventDefault();
    if (!selectedBookingForAbsence) return;

    setMyBookingsList(prev => prev.map(b => {
      if (b.id === selectedBookingForAbsence.id) {
        return {
          ...b,
          status: 'absence_reported',
          absenceReason
        };
      }
      return b;
    }));

    setActionSuccessMessage(`⚠️ Falta informada com sucesso ao professor (${absenceReason}).`);
    setSelectedBookingForAbsence(null);
    setTimeout(() => setActionSuccessMessage(''), 5000);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* BANNER DE ANÚNCIOS DA ADMINISTRAÇÃO (MÁXIMA LEGIBILIDADE) */}
      {studentAnnouncements.map(ann => (
        <div key={ann.id} className="bg-slate-900/95 border-2 border-cyan-400 text-white p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl animate-fade-in-up">
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
            📢 Anúncio Oficial Admin
          </span>
        </div>
      ))}

      {/* Mensaje de Éxito de Acción */}
      {actionSuccessMessage && (
        <div className="bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 p-4 rounded-2xl flex items-center gap-3 animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-white">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Header com Perfil do Aluno Conectado */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
            alt={currentName}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-cyan-400 shadow-xl"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Olá, {currentName}! 👋</h1>
              <span className="bg-cyan-500/20 text-cyan-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/40">
                Aluno Ativo
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              E-mail: <strong className="text-white">{currentEmail}</strong> • Nível: <strong className="text-amber-300">{currentLevel}</strong>
            </p>
            
            {/* Botón de Ver Perfil Completo y Facturas */}
            <div className="mt-2.5">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Ver Perfil Completo & Faturas ➔</span>
              </button>
            </div>
          </div>
        </div>

        {/* Saldo de Billetera */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Saldo na Billetera</span>
            <span className="text-2xl font-black text-emerald-400">${student.walletBalance.toFixed(2)} USD</span>
          </div>

          <Link
            to="/dashboard/student/wallet"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Wallet className="w-4 h-4" />
            <span>Recarregar</span>
          </Link>
        </div>
      </div>

      {/* ── ESPACIO: MEU PROFESSOR ATRIBUÍDO ── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-amber-500/30 glow-gold">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase mb-1">
              <Award className="w-4 h-4 text-amber-400" /> Meu Professor Principal Atribuído
            </div>
            <h2 className="text-xl font-extrabold text-white">Professor Titular de Idiomas</h2>
          </div>

          <button
            onClick={() => navigate('/explore')}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            🔄 Trocar de Professor no Catálogo
          </button>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={assignedTutor.avatar}
              alt={assignedTutor.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-lg">{assignedTutor.name}</h3>
                <span>{assignedTutor.flag}</span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Super Tutor Nativo
                </span>
              </div>
              <p className="text-xs text-cyan-400 font-semibold">{assignedTutor.subject} • {assignedTutor.country}</p>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {assignedTutor.rating}
                </span>
                <span>${assignedTutor.hourlyRate} USD/h</span>
                <span className="text-slate-400">{assignedTutor.responseTime}</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`/book/${assignedTutor.id}`)}
              className="bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Nova Aula com {assignedTutor.name.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CHAT DIRETO NA PLATAFORMA COM O PROFESSOR ── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-cyan-500/30">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Chat Direto na Plataforma com o Professor</h2>
              <span className="text-xs text-slate-400">Conversa em tempo real com {assignedTutor.name}</span>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-bold">
            ● Tutor Online
          </span>
        </div>

        {/* Mensajes del Chat */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 h-64 overflow-y-auto space-y-3">
          {directChatMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.senderRole === 'student' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                msg.senderRole === 'student'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-400 text-slate-950 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}>
                <span className="text-[10px] opacity-80 block font-black mb-0.5">{msg.senderName}</span>
                <p>{msg.text}</p>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 font-mono">{msg.timestamp}</span>
            </div>
          ))}
        </div>

        {/* Formulario de Envió de Mensaje del Alumno */}
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!studentChatMessage.trim()) return;
          sendDirectMessage({
            senderName: currentName,
            senderRole: 'student',
            text: studentChatMessage
          });
          setStudentChatMessage('');
        }} className="flex gap-2">
          <input
            type="text"
            value={studentChatMessage}
            onChange={(e) => setStudentChatMessage(e.target.value)}
            placeholder={`Digitar mensagem para ${assignedTutor.name}...`}
            className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow flex items-center gap-1.5"
          >
            <span>Enviar</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* ── SECCIÓN 1: PRÓXIMAS AULAS, REAGENDAMENTO E INFORMAR FALTA ── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Minhas Próximas Aulas Agendadas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gerencie suas aulas: entre na sala virtual, solicite reagendamento ou informe falta.
            </p>
          </div>

          <span className="bg-cyan-500/15 text-cyan-300 text-xs font-extrabold px-3 py-1 rounded-xl border border-cyan-500/30">
            {myBookingsList.length} Aulas Agendadas
          </span>
        </div>

        {myBookingsList.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Você ainda não possui aulas agendadas</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Escolha um professor do catálogo abaixo e agende sua aula!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myBookingsList.map((booking) => (
              <div
                key={booking.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={booking.tutorAvatar || assignedTutor.avatar}
                    alt={booking.tutorName}
                    className="w-14 h-14 rounded-2xl object-cover border border-cyan-500/40"
                  />
                  <div>
                    <h3 className="font-extrabold text-white text-base">
                      {booking.tutorName}
                    </h3>
                    <p className="text-xs text-cyan-400 font-semibold">{booking.tutorSubject || 'Idioma'}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{booking.day} às <strong>{booking.time}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Status da Aula */}
                <div className="text-xs font-bold">
                  {booking.status === 'absence_reported' ? (
                    <span className="text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Falta Informada: {booking.absenceReason}
                    </span>
                  ) : (
                    <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 inline-block">
                      Status: Confirmada em Custódia
                    </span>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <button
                    onClick={() => navigate(`/classroom/${booking.id}`)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Video className="w-4 h-4" />
                    <span>Entrar na Sala Virtual Space</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedBookingForReschedule(booking)}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Reagendar</span>
                    </button>

                    <button
                      onClick={() => setSelectedBookingForAbsence(booking)}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-rose-300 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Informar Falta</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECCIÓN 2: HISTÓRICO DE AULAS CONCLUÍDAS E FEEDBACK DOS PROFESSORES ── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Minhas Aulas Concluídas & Feedback dos Professores
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Consulte as avaliações pedagógicas e dicas enviadas pelos seus professores após cada aula.
            </p>
          </div>

          <span className="bg-amber-500/15 text-amber-300 text-xs font-bold px-3 py-1 rounded-xl">
            {completedLessonsHistory.length} Aulas Concluídas
          </span>
        </div>

        <div className="space-y-4">
          {completedLessonsHistory.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={item.tutorAvatar} alt={item.tutorName} className="w-10 h-10 rounded-xl object-cover border border-amber-400" />
                  <div>
                    <h3 className="font-extrabold text-white text-sm">{item.tutorName}</h3>
                    <span className="text-xs text-cyan-400 font-semibold">{item.tutorSubject} • {item.date}</span>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                  ✓ {item.status}
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                <div>
                  <strong className="text-amber-300 font-bold block mb-1">💬 Feedback Pedagógico do Professor:</strong>
                  <p className="text-slate-200 leading-relaxed italic">"{item.feedback}"</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <strong className="text-cyan-400 font-bold block mb-1">📌 Dicas de Estudo para a Próxima Aula:</strong>
                  <p className="text-slate-300">{item.studyTips}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECCIÓN 3: CATÁLOGO COMPLETO DE PROFESSORES DISPONÍVEIS ── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" />
              Catálogo de Professores Disponíveis
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Escolha outros professores da plataforma com total autonomia a qualquer momento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedTutors.map((tutor) => (
            <div
              key={tutor.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-cyan-400 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={tutor.avatar}
                    alt={tutor.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-cyan-400"
                  />
                  <div>
                    <h3 className="font-extrabold text-white text-base">{tutor.name} {tutor.flag}</h3>
                    <p className="text-xs text-cyan-400 font-semibold">{tutor.subject} • {tutor.country}</p>
                    <div className="flex items-center gap-2 text-xs text-amber-300 font-bold mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{tutor.rating}</span>
                      <span className="text-slate-400 font-normal">({tutor.reviewCount} avaliações)</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {tutor.headline}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tarifa/Hora</span>
                  <span className="text-sm font-black text-emerald-400">${tutor.hourlyRate} USD</span>
                </div>

                <button
                  onClick={() => navigate(`/book/${tutor.id}`)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow transition-all"
                >
                  Agendar Aula
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODAL 1: REAGENDAR AULA ── */}
      {selectedBookingForReschedule && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-5 border border-cyan-500/40 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-extrabold text-white">Solicitar Reagendamento de Aula</h3>
              </div>
              <button onClick={() => setSelectedBookingForReschedule(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Selecione o Novo Dia *</label>
                <select
                  value={rescheduleDay}
                  onChange={(e) => setRescheduleDay(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white font-bold text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="Segunda-feira">Segunda-feira</option>
                  <option value="Terça-feira">Terça-feira</option>
                  <option value="Quarta-feira">Quarta-feira</option>
                  <option value="Quinta-feira">Quinta-feira</option>
                  <option value="Sexta-feira">Sexta-feira</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Selecione o Novo Horário *</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-cyan-300 font-bold text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForReschedule(null)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs py-3 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg"
                >
                  Confirmar Novo Horário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: INFORMAR FALTA ── */}
      {selectedBookingForAbsence && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-5 border border-rose-500/40 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-extrabold text-white">Informar Falta ao Professor</h3>
              </div>
              <button onClick={() => setSelectedBookingForAbsence(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAbsence} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Motivo da Ausência *</label>
                <select
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white font-bold text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-400 cursor-pointer"
                >
                  <option value="Enfermidade / Motivos Médicos">Enfermidade / Motivos Médicos</option>
                  <option value="Compromisso de Trabalho Imprevisto">Compromisso de Trabalho Imprevisto</option>
                  <option value="Problemas de Conexão à Internet">Problemas de Conexão à Internet</option>
                  <option value="Motivos Pessoais">Motivos Pessoais</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForAbsence(null)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs py-3 rounded-xl"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs py-3 rounded-xl shadow-lg"
                >
                  Confirmar Aviso de Falta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: MEU PERFIL DE ALUNOS & FATURAS ── */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-5 border border-cyan-500/40 animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-extrabold text-white">Dados do Perfil & Faturas</h3>
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Nome Completo:</span>
                <strong className="text-white font-bold">{currentName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-medium">E-mail:</span>
                <strong className="text-white font-bold">{currentEmail}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-medium">CPF / Doc. Identificação:</span>
                <strong className="text-cyan-300 font-mono font-bold">{currentDocument}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-medium">País de Residência:</span>
                <strong className="text-white font-bold">{currentCountry}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Nível do Idioma:</span>
                <strong className="text-amber-300 font-bold">{currentLevel}</strong>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="w-full bg-slate-900 border border-slate-800 text-white font-bold text-xs py-3 rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
