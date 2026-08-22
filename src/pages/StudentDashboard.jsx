import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Calendar, Video, CreditCard, MessageSquare, 
  Search, Star, CheckCircle2, Award, Heart, Plus, Sparkles, 
  BookOpen, ChevronRight, Wallet, UserCheck, ShieldCheck, 
  RefreshCw, AlertTriangle, FileText, User, X, Check, Megaphone, Send, Filter, LogOut, ArrowUpDown,
  Camera, Save, Upload
} from 'lucide-react';
import StudentWallet from './StudentWallet';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    student, tutors, bookings, completeBooking, 
    announcements, directChatMessages, sendDirectMessage 
  } = useMarketplace();
  const { profile, signOut, logout, updateProfile } = useAuth();
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
  const messagesContainerRef = useRef(null);

  const activeTutor = useMemo(() => {
    if (!approvedTutors.length) return null;
    return approvedTutors.find(t => t.id === activeChatTutorId) || approvedTutors[0];
  }, [approvedTutors, activeChatTutorId]);

  const activeChatMessages = useMemo(() => {
    if (!activeTutor) return [];
    return directChatMessages.filter(msg => msg.tutorId === activeTutor.id);
  }, [directChatMessages, activeTutor]);

  const renderAvatar = (url, name, className = "w-9 h-9 rounded-full shrink-0") => {
    if (url && !url.includes('images.unsplash.com')) {
      return <img src={url} alt={name || 'Avatar'} className={`${className} object-cover`} />;
    }
    const initial = (name || 'U').charAt(0).toUpperCase();
    return (
      <div className={`${className} bg-cyan-500/20 text-cyan-300 font-extrabold flex items-center justify-center border border-cyan-500/40 text-xs shrink-0 shadow-sm`}>
        {initial}
      </div>
    );
  };

  // Rolar apenas o container interno do chat sem rolar a página web inteira
  useEffect(() => {
    if (activeTab === 'chat' && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [directChatMessages, activeChatTutorId, activeTab]);

  // Estado de edição de Perfil e Foto
  const [profileAvatar, setProfileAvatar] = useState(profile?.avatar_url || '');
  const [editLanguage, setEditLanguage] = useState(profile?.study_language || 'Inglês 🇬🇧🇺🇸');
  const [editLevel, setEditLevel] = useState(profile?.language_level || 'B2 - Intermediário Avançado 🎓');
  const [editMotivation, setEditMotivation] = useState(profile?.study_motivation || 'Carreira Profissional 📈');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.avatar_url) setProfileAvatar(profile.avatar_url);
      if (profile.study_language) setEditLanguage(profile.study_language);
      if (profile.language_level) setEditLevel(profile.language_level);
      if (profile.study_motivation) setEditMotivation(profile.study_motivation);
    }
  }, [profile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 300;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setProfileAvatar(resizedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (updateProfile) {
      updateProfile({
        avatar_url: profileAvatar,
        study_language: editLanguage,
        language_level: editLevel,
        study_motivation: editMotivation
      });
    }
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 4000);
  };

  const [myBookingsList, setMyBookingsList] = useState(bookings || []);

  useEffect(() => {
    setMyBookingsList(bookings || []);
  }, [bookings]);

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
      const doSignOut = signOut || logout;
      if (doSignOut) {
        await doSignOut();
      }
    } catch (error) {
      console.error("Error logging out", error);
    }
    navigate('/');
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
                    {renderAvatar(nextBooking.tutorAvatar || assignedTutor?.avatar, nextBooking.tutorName || assignedTutor?.name, "w-12 h-12 rounded-full ring-2 ring-cyan-500/40")}
                    <div>
                      <h3 className="text-base font-semibold text-white">{nextBooking.tutorName || assignedTutor?.name}</h3>
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
                        {renderAvatar(booking.tutorAvatar, booking.tutorName, "w-10 h-10 rounded-full")}
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
          {filteredCatalogTutors.length === 0 ? (
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-white">Em breve...</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Em breve teremos professores cadastrados nesta categoria! Novos tutores reais estão concluindo seus cadastros na plataforma.
              </p>
            </div>
          ) : (
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

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-normal">
                      "{tutor.headline || tutor.bio}"
                    </p>

                    {/* Preço e Avaliação */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1 font-bold text-amber-300 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{tutor.rating || 5.0}</span>
                        <span className="text-slate-400 font-normal">({tutor.reviewCount || 0})</span>
                      </div>
                      <span className="font-black text-emerald-400 text-sm font-mono">
                        R$ {tutor.hourlyRate}/h
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => navigate(`/book/${tutor.id}`)}
                      className="w-full bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-cyan-500/15 border border-cyan-300/30 transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Agendar Aula Experimental</span>
                    </button>

                    <button
                      onClick={() => navigate(`/tutor/${tutor.id}`)}
                      className="w-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs border border-slate-700/80 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Ver Perfil do Professor</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CHAT SPLIT-VIEW (2 COLUMNAS ESTÁNDAR 30% / 70%) */}
      {activeTab === 'chat' && (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-180px)] min-h-[480px] max-h-[680px] shadow-sm">
          {approvedTutors.length === 0 ? (
            <div className="md:col-span-12 flex flex-col items-center justify-center text-center p-12 space-y-3 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-white">Em breve...</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Nenhum professor disponível para conversa no momento. Assim que novos tutores reais concluírem o cadastro, você poderá conversar diretamente com eles aqui!
              </p>
            </div>
          ) : (
            <>
              {/* SIDEBAR IZQUIERDA (30% - md:col-span-4) */}
              <div className="md:col-span-4 bg-slate-950/80 border-b md:border-b-0 md:border-r border-slate-800/60 p-3 flex flex-col h-full overflow-hidden">
                <h3 className="font-semibold text-white text-xs uppercase tracking-wider px-1 mb-2 shrink-0">Conversas Ativas</h3>
                
                <div className="space-y-1 flex-1 min-h-0 overflow-y-auto pr-1">
                  {approvedTutors.map((tutor) => {
                    const isSelected = activeTutor?.id === tutor.id;
                    return (
                      <button
                        key={tutor.id}
                        onClick={() => setActiveChatTutorId(tutor.id)}
                        className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border border-cyan-500/40 text-white shadow-sm font-semibold'
                            : 'hover:bg-slate-900 text-slate-400 hover:text-white border border-transparent'
                        }`}
                      >
                        {renderAvatar(tutor.avatar, tutor.name, "w-9 h-9 rounded-full")}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-white truncate">{tutor.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{tutor.subject} • R$ {tutor.hourlyRate}/h</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ÁREA DE CHAT DERECHA (70% - md:col-span-8) */}
              <div className="md:col-span-8 flex flex-col h-full overflow-hidden bg-slate-950/40">
                {/* Header del Tutor Activo - FIJO */}
                {activeTutor && (
                  <div className="p-3 bg-slate-950/80 border-b border-slate-800/60 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      {renderAvatar(activeTutor.avatar, activeTutor.name, "w-8 h-8 rounded-full")}
                      <div>
                        <h4 className="font-semibold text-white text-xs">{activeTutor.name}</h4>
                        <span className="text-[10px] text-emerald-400 font-medium">● Online • {activeTutor.subject}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ventana de Mensajes Scrollable - ÚNICO ÁREA QUE HACE SCROLL */}
                <div ref={messagesContainerRef} className="p-4 overflow-y-auto space-y-3 flex-1 min-h-0">
                  {activeChatMessages.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      Nenhuma mensagem trocada com {activeTutor?.name || 'o professor'} ainda. Digite sua mensagem abaixo!
                    </div>
                  ) : (
                    activeChatMessages.map(msg => {
                      const isStudent = msg.senderRole === 'student' || msg.sender === 'student';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                            isStudent 
                              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' 
                              : 'bg-slate-900 border border-slate-800 text-slate-200'
                          }`}>
                            {msg.senderName && (
                              <span className={`text-[10px] opacity-80 block font-black mb-0.5 ${isStudent ? 'text-slate-950' : 'text-cyan-400'}`}>
                                {msg.senderName}
                              </span>
                            )}
                        <p className="break-words">{msg.text || msg.content}</p>
                      </div>
                      {msg.timestamp && (
                        <span className="text-[10px] text-slate-500 mt-0.5 font-mono px-1">{msg.timestamp}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Fijo al Pie - FIJO */}
            <div className="p-3 border-t border-slate-800/60 bg-slate-950/80 flex gap-2 shrink-0">
              <input
                type="text"
                placeholder={`Escreva sua mensagem para ${activeTutor.name}...`}
                value={studentChatMessage}
                onChange={(e) => setStudentChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && studentChatMessage.trim()) {
                    sendDirectMessage({
                      studentId: 'stud-1',
                      tutorId: activeTutor.id,
                      senderName: profile?.full_name || currentName,
                      senderRole: 'student',
                      text: studentChatMessage.trim()
                    });
                    setStudentChatMessage('');
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => {
                  if (studentChatMessage.trim()) {
                    sendDirectMessage({
                      studentId: 'stud-1',
                      tutorId: activeTutor.id,
                      senderName: profile?.full_name || currentName,
                      senderRole: 'student',
                      text: studentChatMessage.trim()
                    });
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
        </>
      )}
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
          
          {profileSaveSuccess && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Configurações e preferências salvas com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            {/* SEÇÃO 1: DADOS PESSOAIS E FOTO DE PERFIL */}
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Seção 1: Dados Pessoais & Foto de Perfil</span>
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-4 pb-3 border-b border-slate-800/60">
                <div className="relative group shrink-0">
                  <img 
                    src={profileAvatar || profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                    alt="Avatar Aluno" 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400/80 shadow-md" 
                  />
                  <label className="absolute inset-0 bg-slate-950/75 rounded-2xl flex flex-col items-center justify-center text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>Trocar</span>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <span className="font-extrabold text-white text-sm block">{currentName}</span>
                  <span className="text-xs text-slate-400 block">{currentEmail}</span>
                  
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 text-xs font-bold transition-all cursor-pointer mt-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carregar / Trocar Foto de Perfil</span>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
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

            {/* SEÇÃO 2: PREFERÊNCIAS DE APRENDIZADO (COM DROPDOWNS EDITÁVEIS E BOTÃO SALVAR) */}
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Seção 2: Preferências de Aprendizado</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Idioma de Interesse *</label>
                  <select
                    value={editLanguage}
                    onChange={(e) => setEditLanguage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Inglês 🇬🇧🇺🇸">Inglês 🇬🇧🇺🇸</option>
                    <option value="Espanhol 🇪🇸">Espanhol 🇪🇸</option>
                    <option value="Ambos (Inglês e Espanhol) 🌐">Ambos (Inglês e Espanhol) 🌐</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Nível Atual *</label>
                  <select
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Iniciante (A1)">Iniciante (A1)</option>
                    <option value="Básico (A2)">Básico (A2)</option>
                    <option value="Intermediário (B1)">Intermediário (B1)</option>
                    <option value="B2 - Intermediário Avançado 🎓">B2 - Intermediário Avançado 🎓</option>
                    <option value="Avançado (C1)">Avançado (C1)</option>
                    <option value="Fluente (C2)">Fluente (C2)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Objetivo dos Estudos *</label>
                  <select
                    value={editMotivation}
                    onChange={(e) => setEditMotivation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Viagens ✈️">Viagens ✈️</option>
                    <option value="Negócios 💼">Negócios 💼</option>
                    <option value="Carreira Profissional 📈">Carreira Profissional 📈</option>
                    <option value="Cultura e Entretenimento 🎬">Cultura e Entretenimento 🎬</option>
                    <option value="Estudos Acadêmicos 🎓">Estudos Acadêmicos 🎓</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              {/* BOTÃO SALVAR ALTERAÇÕES */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </div>

          </form>

          {/* SEÇÃO 3: SEGURANÇA E ENCERRAMENTO (BOTÃO DISCRETO SECUNDÁRIO) */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-white text-xs">Segurança da Conta</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Encerre sua sessão com segurança neste dispositivo.</p>
            </div>

            {/* Botão Secundário Discreto com Borda Vermelha Sutil */}
            <button
              type="button"
              onClick={handleLogout}
              className="h-9 px-4 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-medium text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Encerrar Sessão</span>
            </button>
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
