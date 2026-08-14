import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Calendar, Video, CreditCard, MessageSquare, 
  Search, Star, CheckCircle2, Award, Heart, Plus, Sparkles, 
  BookOpen, ChevronRight, Wallet, UserCheck, ShieldCheck, 
  RefreshCw, AlertTriangle, FileText, User, X, Check, Megaphone, Send, Filter, LogOut, ArrowUpDown 
} from 'lucide-react';
import StudentWallet from './StudentWallet';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    student, tutors, bookings, completeBooking, 
    announcements, directChatMessages, sendDirectMessage 
  } = useMarketplace();
  const { profile, logout } = useAuth();
  const { t } = useLanguage();

  // Tab control via URL searchParams (unificado no Header superior)
  const activeTab = searchParams.get('tab') || 'inicio';

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

  const currentName = profile?.full_name || student.name || 'Gabriel Aluno';
  const currentEmail = profile?.email || student.email || 'aluno@lexy.com';
  const currentDocument = profile?.documentNumber || student.documentNumber || '123.456.789-00';
  const currentCountry = profile?.residenceCountry || student.residenceCountry || 'Brasil 🇧🇷';
  const currentLanguage = profile?.study_language || 'Inglês 🇬🇧🇺🇸';
  const currentLevel = profile?.language_level || 'B2 - Intermediário Avançado 🎓';
  const currentMotivation = profile?.study_motivation || 'Carreira Profissional 📈';

  const approvedTutors = tutors.filter(t => t.status === 'approved');
  const assignedTutor = approvedTutors[0] || tutors[0];

  // Filtros do Catálogo no Dashboard
  const [catSubject, setCatSubject] = useState('Todos');
  const [catSort, setCatSort] = useState('price_asc');
  const [catMaxPrice, setCatMaxPrice] = useState(50);

  const filteredCatalogTutors = useMemo(() => {
    return approvedTutors.filter(tutor => {
      if (catSubject !== 'Todos' && tutor.subject !== catSubject) return false;
      if (tutor.hourlyRate > catMaxPrice) return false;
      return true;
    }).sort((a, b) => {
      if (catSort === 'price_asc') return a.hourlyRate - b.hourlyRate;
      if (catSort === 'rating') return b.rating - a.rating;
      return 0;
    });
  }, [approvedTutors, catSubject, catSort, catMaxPrice]);

  const [studentChatMessage, setStudentChatMessage] = useState('');
  const [activeChatTutorId, setActiveChatTutorId] = useState(assignedTutor?.id || 'tutor-1');

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

  // Determinar a próxima aula principal e as aulas subsecventes (sem repetição)
  const nextBooking = myBookingsList.find(b => b.status === 'confirmed' || b.status === 'rescheduled') || myBookingsList[0];
  const subsequentBookings = myBookingsList.filter(b => b.id !== nextBooking?.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4 animate-fade-in-up">

      {actionSuccessMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl flex items-center gap-2 text-xs font-medium animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* TAB 1: INÍCIO (2 COLUNAS LIMPAS) */}
      {activeTab === 'inicio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* COLUMNA PRINCIPAL (span-2) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Banner Saludo Personalizado */}
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white">Olá, {currentName}! 👋</h1>
              <p className="text-xs text-slate-400 mt-0.5">{t.studentGreetingSub || "Pronto para dominar um novo idioma hoje?"}</p>
            </div>

            {/* Modal de Boas-Vindas se ativo */}
            {showWelcome && (
              <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden space-y-2">
                <button onClick={dismissWelcome} className="absolute top-3 right-3 text-slate-400 hover:text-white cursor-pointer">
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
                  onClick={() => setSearchParams({ tab: 'carteira' })}
                  className="h-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-xs px-3.5 rounded-lg shadow-sm cursor-pointer"
                >
                  + Recarregar Créditos Lexy
                </button>
              </div>
            )}

            {/* REDISEÑO DE HERO CARD (PRÓXIMA AULA - DISPOSIÇÃO FLEXBOX HORIZONTAL COM UI KIT DE BOTÕES) */}
            {nextBooking ? (
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-800/80 shadow-xl shadow-black/40 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {t.confirmedBadge || "● Confirmada"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    {t.nextClassLabel || "Próxima Aula"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Esquerda: Avatar + Detalhes + Calendário */}
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
                      {/* Uso exclusivo de ícone de calendário */}
                      <p className="text-slate-300 text-xs mt-0.5 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{nextBooking.day} às {nextBooking.time}</span>
                      </p>
                    </div>
                  </div>

                  {/* Direita: Botão primário compacto com gradiente e sombra cian */}
                  <button 
                    onClick={() => navigate(`/classroom/${nextBooking.id}`)}
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/15 border border-cyan-300/30 transition-all duration-200 active:scale-95 cursor-pointer text-xs sm:text-sm shrink-0 w-full sm:w-auto flex items-center justify-center gap-1.5"
                  >
                    <span>{t.enterVirtualRoom || "🎥 Entrar na Sala Virtual"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 shadow-xl shadow-black/40 rounded-xl p-5 text-center space-y-2">
                <BookOpen className="w-8 h-8 text-cyan-400 mx-auto" />
                <h3 className="text-sm font-semibold text-white">Nenhuma aula agendada no momento</h3>
                <p className="text-xs text-slate-400">Escolha um tutor no catálogo e agende sua primeira aula!</p>
                <button
                  onClick={() => setSearchParams({ tab: 'catalogo' })}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-cyan-500/15 cursor-pointer"
                >
                  Explorar Tutores
                </button>
              </div>
            )}

            {/* Lista de Aulas subsecventes */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 shadow-xl shadow-black/40 rounded-xl p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Minhas Aulas Agendadas</span>
              </h3>

              {subsequentBookings.length === 0 ? (
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-4 text-center text-xs text-slate-400">
                  Você não possui outras aulas agendadas além da próxima aula acima.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {subsequentBookings.map(booking => (
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
                          className="flex-1 sm:flex-initial bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                        >
                          Reagendar
                        </button>
                        <button
                          onClick={() => navigate(`/classroom/${booking.id}`)}
                          className="flex-1 sm:flex-initial bg-slate-800/80 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/60 font-medium px-4 py-1.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                        >
                          Entrar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* COLUMNA LATERAL / BARRA DERECHA (span-1) */}
          <div className="space-y-4">
            
            {/* Widget Billetera LexyPay (Estilizada e Sobria com UI Kit) */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 shadow-xl shadow-black/40 rounded-xl p-4 space-y-3">
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
                onClick={() => setSearchParams({ tab: 'carteira' })}
                className="w-full bg-slate-800/80 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/60 font-medium px-4 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Recarregar Créditos</span>
              </button>
            </div>

            {/* Widget de Notificações / Anúncios Rápidos */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 shadow-xl shadow-black/40 rounded-xl p-4 space-y-3">
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
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 shadow-xl shadow-black/40 rounded-xl p-4 space-y-2.5 text-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto" />
              <h4 className="font-semibold text-white text-xs">Precisa de Ajuda?</h4>
              <p className="text-[11px] text-slate-400">Suporte online 24/7 via WhatsApp.</p>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noreferrer"
                className="w-full bg-slate-800/80 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/60 font-medium px-4 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <span>Falar no WhatsApp 💬</span>
              </a>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: CATÁLOGO DE TUTORES COMPACTO COM BARRA DE FILTROS SUPERIOR */}
      {activeTab === 'catalogo' && (
        <div className="space-y-4">
          
          {/* BARRA DE FILTROS SUPERIOR HORIZONTAL COMPACTA */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 shadow-xl shadow-black/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Filtro Idioma */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-medium text-slate-400">Idioma:</span>
                <select
                  value={catSubject}
                  onChange={(e) => setCatSubject(e.target.value)}
                  className="bg-slate-950 border border-slate-800/80 text-white rounded-lg px-2.5 py-1 text-xs outline-none cursor-pointer focus:border-cyan-400"
                >
                  <option value="Todos">Todos os Idiomas</option>
                  <option value="Inglês">Inglês 🇬🇧🇺🇸</option>
                  <option value="Espanhol">Espanhol 🇪🇸</option>
                </select>
              </div>

              {/* Filtro Ordenación */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-medium text-slate-400">Ordenar:</span>
                <select
                  value={catSort}
                  onChange={(e) => setCatSort(e.target.value)}
                  className="bg-slate-950 border border-slate-800/80 text-white rounded-lg px-2.5 py-1 text-xs outline-none cursor-pointer focus:border-cyan-400"
                >
                  <option value="price_asc">Menor Preço / Hora</option>
                  <option value="rating">Mais Recomendados</option>
                </select>
              </div>

              {/* Filtro Preço Máximo */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-400">Até R$ {catMaxPrice}/h</span>
                <input
                  type="range"
                  min={15}
                  max={60}
                  step={5}
                  value={catMaxPrice}
                  onChange={(e) => setCatMaxPrice(Number(e.target.value))}
                  className="w-24 accent-cyan-400 cursor-pointer"
                />
              </div>

            </div>

            <div className="text-xs text-slate-400 font-medium">
              <span>{filteredCatalogTutors.length} tutores encontrados</span>
            </div>
          </div>

          {/* GRILLA DE TARJETAS DE TUTORES COMPACTAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalogTutors.map(tutor => (
              <div 
                key={tutor.id} 
                className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 shadow-xl shadow-black/40 hover:border-cyan-500/40 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all group"
              >
                <div className="space-y-2.5">
                  {/* Foto Redonda com Anel Brilhante */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={tutor.avatar} 
                      alt={tutor.name} 
                      className="w-12 h-12 rounded-full object-cover border border-cyan-400/50 ring-2 ring-cyan-500/30 group-hover:scale-105 transition-transform shrink-0" 
                    />
                    <div>
                      <h3 className="font-semibold text-white text-sm group-hover:text-cyan-300 transition-colors">
                        {tutor.name}
                      </h3>
                      <span className="inline-block bg-cyan-500/10 text-cyan-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-cyan-500/20 mt-0.5">
                        {tutor.subject} • Nativo {tutor.flag}
                      </span>
                    </div>
                  </div>

                  {/* Biografía Corta de 2 Líneas */}
                  <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                    {tutor.bio}
                  </p>

                  {/* Rating & Preço por Hora */}
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-xs">
                    <div className="flex items-center gap-1 text-amber-300 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{tutor.rating}</span>
                      <span className="text-[10px] text-slate-500">({tutor.reviewCount})</span>
                    </div>
                    <span className="font-bold text-white text-sm">
                      ${tutor.hourlyRate} USD/h
                    </span>
                  </div>
                </div>

                {/* Botão Primário Elegante e Compacto com UI Kit */}
                <button
                  onClick={() => navigate(`/book/${tutor.id}`)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-cyan-500/15 border border-cyan-300/30 transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Agendar Aula Experimental</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CHAT SPLIT-VIEW (2 COLUMNAS ESTÁNDAR 30% / 70%) */}
      {activeTab === 'chat' && (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-220px)] min-h-[480px] shadow-sm">
          
          {/* SIDEBAR IZQUIERDA (30% - md:col-span-4) */}
          <div className="md:col-span-4 bg-slate-950/80 border-b md:border-b-0 md:border-r border-slate-800/60 p-3 space-y-3 flex flex-col overflow-y-auto">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider px-1">Conversas Ativas</h3>
            
            <div className="space-y-1">
              {approvedTutors.slice(0, 3).map((tutor) => (
                <button
                  key={tutor.id}
                  onClick={() => setActiveChatTutorId(tutor.id)}
                  className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                    activeChatTutorId === tutor.id
                      ? 'bg-cyan-500/15 border border-cyan-500/30 text-white'
                      : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <img src={tutor.avatar} alt={tutor.name} className="w-9 h-9 rounded-full object-cover border border-cyan-400/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate">{tutor.name}</span>
                      <span className="text-[10px] text-slate-500">Hoje</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Olá! Tudo pronto para nossa aula?</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ÁREA DE CHAT DERECHA (70% - md:col-span-8) */}
          <div className="md:col-span-8 flex flex-col justify-between bg-slate-950/40">
            
            {/* Header del Tutor Activo */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={assignedTutor.avatar} alt={assignedTutor.name} className="w-8 h-8 rounded-full object-cover border border-cyan-400/40" />
                <div>
                  <h4 className="font-semibold text-white text-xs">{assignedTutor.name}</h4>
                  <span className="text-[10px] text-emerald-400 font-medium">● Online • {assignedTutor.subject}</span>
                </div>
              </div>
            </div>

            {/* Ventana de Mensajes Scrollable */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {directChatMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Nenhuma mensagem trocada ainda. Digite sua dúvida ou mensagem abaixo!
                </div>
              ) : (
                directChatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2.5 rounded-lg max-w-xs sm:max-w-sm text-xs leading-relaxed ${
                      msg.sender === 'student' 
                        ? 'bg-cyan-500 text-slate-950 font-medium shadow-sm' 
                        : 'bg-slate-900 border border-slate-800 text-slate-200'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Fijo al Pie */}
            <div className="p-3 border-t border-slate-800/60 bg-slate-950/80 flex gap-2">
              <input
                type="text"
                placeholder="Escreva sua mensagem..."
                value={studentChatMessage}
                onChange={(e) => setStudentChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && studentChatMessage.trim()) {
                    sendDirectMessage(studentChatMessage.trim(), 'student');
                    setStudentChatMessage('');
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => {
                  if (studentChatMessage.trim()) {
                    sendDirectMessage(studentChatMessage.trim(), 'student');
                    setStudentChatMessage('');
                  }
                }}
                className="h-9 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-xs px-4 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB 4: CARTEIRA DIGITAL */}
      {activeTab === 'carteira' && (
        <StudentWallet />
      )}

      {/* TAB 5: PERFIL ORGANIZADO EM 3 SEÇÕES PROFISSIONAIS */}
      {activeTab === 'perfil' && (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-4 sm:p-5 space-y-4 max-w-3xl mx-auto shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-white">Configurações de Perfil</h2>
            <p className="text-xs text-slate-400 mt-0.5">Gerencie seus dados cadastrais, preferências de ensino e segurança da conta.</p>
          </div>
          
          <div className="space-y-4">
            
            {/* SEÇÃO 1: DADOS PESSOAIS */}
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Seção 1: Dados Pessoais</span>
              </h3>

              <div className="flex items-center gap-3 pb-2 border-b border-slate-800/60">
                <img 
                  src={profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                  alt="Avatar Aluno" 
                  className="w-12 h-12 rounded-full object-cover border border-cyan-400/50" 
                />
                <div>
                  <span className="font-semibold text-white text-xs block">{currentName}</span>
                  <span className="text-[11px] text-slate-400 block">{currentEmail}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Nome Completo</span>
                  <span className="text-white font-medium text-xs bg-slate-900 px-3 py-2 rounded-lg block border border-slate-800/60">{currentName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Endereço de E-mail</span>
                  <span className="text-white font-medium text-xs bg-slate-900 px-3 py-2 rounded-lg block border border-slate-800/60">{currentEmail}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">CPF / Documento</span>
                  <span className="text-white font-medium text-xs bg-slate-900 px-3 py-2 rounded-lg block border border-slate-800/60">{currentDocument}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">País de Residência</span>
                  <span className="text-white font-medium text-xs bg-slate-900 px-3 py-2 rounded-lg block border border-slate-800/60">{currentCountry}</span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: PREFERÊNCIAS DE APRENDIZADO */}
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Seção 2: Preferências de Aprendizado</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Idioma de Interesse</span>
                  <span className="text-white font-medium text-xs bg-slate-900 px-3 py-2 rounded-lg block border border-slate-800/60">{currentLanguage}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Nível Atual</span>
                  <span className="text-white font-medium text-xs bg-slate-900 px-3 py-2 rounded-lg block border border-slate-800/60">{currentLevel}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Objetivo dos Estudos</span>
                  <span className="text-white font-medium text-xs bg-slate-900 px-3 py-2 rounded-lg block border border-slate-800/60">{currentMotivation}</span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: SEGURANÇA E ENCERRAMENTO (BOTÃO DISCRETO SECUNDÁRIO) */}
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-white text-xs">Segurança da Conta</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Encerre sua sessão com segurança neste dispositivo.</p>
              </div>

              {/* Botão Secundário Discreto com Borda Vermelha Sutil */}
              <button
                onClick={handleLogout}
                className="h-9 px-4 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-medium text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Encerrar Sessão</span>
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
                  className="flex-1 bg-slate-900 text-slate-400 text-xs font-medium py-2 rounded-lg border border-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 text-slate-950 text-xs font-medium py-2 rounded-lg shadow-sm cursor-pointer"
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
