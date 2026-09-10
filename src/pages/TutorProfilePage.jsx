import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, ShieldCheck, Play, Heart, Clock, Globe, Calendar, 
  CheckCircle2, Award, ArrowLeft, MessageSquare, Sparkles, ChevronRight 
} from 'lucide-react';
import { mockTutors } from '../data/mockTutors';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import BookingAuthModal from '../components/modals/BookingAuthModal';

export default function TutorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tutors, bookings, teacherAvailability, getTrialEligibility, packageDiscounts, getTutorPackageDiscount } = useMarketplace();
  const { profile } = useAuth();

  // Buscar tutor por ID
  const tutor = tutors.find(t => t.id === id) || tutors[0];

  const ALL_DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const [selectedDay, setSelectedDay] = useState('Segunda-feira');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [targetBookingTab, setTargetBookingTab] = useState('trial');

  const getDayNameClean = (dateStr) => {
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

  // HELPER: Calcula ÚNICAMENTE os horários LIVRES do professor (ocultando 100% dos horários ocupados e bloqueados)
  const getFreeSlotsForDay = (dayName) => {
    if (!dayName || !tutor) return [];

    const targetClean = String(dayName).toLowerCase().replace('-feira', '').trim();
    const rawSchedule = tutor?.weeklySchedule || {};
    
    const matchedKey = Object.keys(rawSchedule).find(k => 
      k.toLowerCase().replace('-feira', '').trim() === targetClean
    );

    let baseSlots = matchedKey ? (rawSchedule[matchedKey] || []) : [];
    if (!baseSlots || baseSlots.length === 0) {
      if (targetClean !== 'sábado' && targetClean !== 'domingo' && targetClean !== 'sabado') {
        baseSlots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
      } else if (targetClean === 'sábado' || targetClean === 'sabado') {
        baseSlots = ['09:00', '10:00', '11:00', '14:00', '15:00'];
      }
    }

    const extraFreeFromDb = (teacherAvailability || [])
      .filter(a => String(a.teacher_id || a.tutor_id || '').toLowerCase() === String(tutor?.id || '').toLowerCase() && a.status === 'free')
      .filter(a => {
        const slotDayName = getDayNameClean(a.date || a.day || '');
        return String(slotDayName).toLowerCase().replace('-feira', '').trim() === targetClean;
      })
      .map(a => String(a.time).trim());

    const combinedSlots = Array.from(new Set([...baseSlots, ...extraFreeFromDb]));

    const occupiedTimes = (bookings || [])
      .filter(b => String(b.tutorId || b.tutor_id || '').toLowerCase() === String(tutor?.id || '').toLowerCase() && (b.status === 'confirmed' || b.status === 'rescheduled' || b.status === 'pending'))
      .filter(b => {
        const bookingDayName = getDayNameClean(b.date || b.day || '');
        const cleanBookingDay = String(bookingDayName).split(' (')[0].toLowerCase().replace('-feira', '').trim();
        return cleanBookingDay === targetClean;
      })
      .map(b => String(b.time || '').trim());

    const blockedTimesForTeacher = (teacherAvailability || [])
      .filter(a => String(a.teacher_id || a.tutor_id || '').toLowerCase() === String(tutor?.id || '').toLowerCase() && a.status === 'blocked')
      .filter(a => {
        const slotDayName = getDayNameClean(a.date || a.day || '');
        return String(slotDayName).toLowerCase().replace('-feira', '').trim() === targetClean;
      })
      .map(a => String(a.time).trim());

    // Retorna APENAS horários livres
    return combinedSlots
      .filter(t => !occupiedTimes.includes(String(t).trim()) && !blockedTimesForTeacher.includes(String(t).trim()))
      .sort();
  };

  const freeSlotsForSelectedDay = getFreeSlotsForDay(selectedDay);

  const handleBookClick = (tab = 'trial', timeSlot = null) => {
    setTargetBookingTab(tab);
    if (profile) {
      const slotQuery = timeSlot ? `&day=${selectedDay}&time=${timeSlot}` : '';
      navigate(`/book/${tutor.id}?tab=${tab}${slotQuery}`);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleBookSlot = (timeSlot) => {
    handleBookClick('trial', timeSlot);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fade-in-up">
      
      {/* Botón Volver */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para a Lista de Tutores
      </button>

      {/* Contenedor Principal de 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Columna Izquierda: Información Detallada del Profesor (8 columnas) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Header Card del Profesor */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              
              {/* Avatar con Marco Dourado / Verificado */}
              <div className="relative shrink-0">
                <img
                  src={tutor.avatar}
                  alt={tutor.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold text-white flex items-center gap-1 shadow">
                  <span>{tutor.flag}</span>
                  <span>{tutor.countryCode}</span>
                </div>
              </div>

              {/* Título & Estadísticas */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{tutor.name}</h1>
                  {tutor.isVerified && (
                    <ShieldCheck className="w-6 h-6 text-cyan-400 fill-cyan-400/20" title="Perfil Verificado" />
                  )}
                  {tutor.nativeSpeaker && (
                    <span className="bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-extrabold px-2.5 py-0.5 rounded-md">
                      Falante Nativo
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-semibold text-cyan-400">{tutor.title}</p>

                {/* Métricas estilo Preply */}
                <div className="flex items-center gap-4 text-xs pt-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-lg font-black text-amber-300">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{tutor.rating}</span>
                    <span className="text-slate-400 font-normal">({tutor.reviewCount} avaliações)</span>
                  </div>

                  <div className="text-slate-300 font-medium">
                    <strong>{tutor.totalLessons}</strong> aulas ministradas
                  </div>

                  <div className="text-slate-300 font-medium">
                    <strong>{tutor.activeStudents}</strong> alunos ativos
                  </div>
                </div>
              </div>

            </div>

            {/* Idiomas Hablados */}
            <div className="border-t border-slate-800 pt-4 flex items-center gap-3 flex-wrap text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <Globe className="w-4 h-4 text-cyan-400" /> Idiomas:
              </span>
              {(tutor.languagesSpoken || []).map((lang, idx) => (
                <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-200 px-2.5 py-1 rounded-lg font-semibold">
                  {lang.language}: <strong className="text-cyan-300">{lang.level}</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Reproductor de Video de Presentación (SÓLO SE MUESTRA SI EL TUTOR ELIGIÓ MOSTRAR VÍDEO) */}
          {tutor.hasVideo !== false && tutor.videoUrl && tutor.videoUrl !== '' && tutor.videoUrl !== 'none' && (
            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-cyan-400" />
                Vídeo de Apresentação
              </h3>
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
                <iframe
                  src={tutor.videoUrl}
                  title={`Apresentação de ${tutor.name}`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Biografía y Metodología */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-extrabold text-white">Sobre Mim e Minhas Aulas</h3>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 font-normal">
              {tutor.bio || tutor.headline || tutor.title || 'Olá! Sou professor(a) nativo(a) e ajudo meus alunos a alcançarem a fluência no idioma com aulas 100% dinâmicas, focadas em conversação prática e acompanhamento personalizado.'}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Especialidades de Ensino</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {(tutor.specialties || []).map(sp => (
                  <span key={sp} className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold px-3 py-1 rounded-lg">
                    ✓ {sp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Grilla Semanal de Disponibilidad Interactiva */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  Horários Disponíveis para Aulas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecione o dia da semana e o horário de sua preferência para reservar sua aula.
                </p>
              </div>
            </div>

            {/* Selector de Días da Semana */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {ALL_DAYS.map(day => {
                const count = getFreeSlotsForDay(day).length;
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{day}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-emerald-400'}`}>
                      {count} livre{count !== 1 ? 's' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Slots de Horários Livres (Horários ocupados e bloqueados são ocultados) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {freeSlotsForSelectedDay.length === 0 ? (
                <div className="col-span-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-300">Nenhum horário livre para este dia.</p>
                  <p className="text-[11px] text-slate-500">Todos os horários estão ocupados por alunos ou reservados na agenda do professor.</p>
                </div>
              ) : (
                freeSlotsForSelectedDay.map(slot => (
                  <button
                    key={slot}
                    onClick={() => handleBookSlot(slot)}
                    className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm group cursor-pointer"
                  >
                    <span>{slot}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Sección de Reseñas de Alumnos */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                Avaliações dos Alunos ({tutor.reviewCount})
              </h3>
            </div>

            <div className="space-y-4">
              {(tutor.reviews || []).length === 0 ? (
                <p className="text-xs text-slate-500">Este professor ainda não possui avaliações visíveis.</p>
              ) : (
                (tutor.reviews || []).map(rev => (
                  <div key={rev.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={rev.avatar} alt={rev.studentName} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <h4 className="text-xs font-bold text-white">{rev.studentName}</h4>
                          <span className="text-[10px] text-slate-400">{rev.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-amber-400 text-xs">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 italic">"{rev.comment}"</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Columna Derecha: Sticky Booking Widget (4 columnas) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 glass-panel rounded-3xl p-6 space-y-6 border border-cyan-500/40 shadow-2xl">
            
            {/* Precio Destacado */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Aula Experimental (45 min)</span>
              {(() => {
                const eligibility = getTrialEligibility ? getTrialEligibility(tutor.id) : { allowed: true, isFree: false };
                const trialDisc = getTutorPackageDiscount ? getTutorPackageDiscount(packageDiscounts, tutor.id, 'pkg-trial') : 50;
                const hRate = Number(tutor.hourlyRate || tutor.hourly_rate || 20);
                const computedTrialRate = Number((hRate * (1 - trialDisc / 100)).toFixed(2));

                if (eligibility.isFree) {
                  return (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-400">GRÁTIS</span>
                        <span className="text-xs text-slate-500 line-through">R$ {computedTrialRate.toFixed(2)}</span>
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                        🎁 Garantia de Satisfação ({eligibility.remainingFreeTrials} restantes)
                      </div>
                    </div>
                  );
                }
                return (
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-slate-400">R$</span>
                      <span className="text-4xl font-black text-white">{computedTrialRate.toFixed(2)}</span>
                      {trialDisc > 0 && (
                        <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded ml-auto">
                          {trialDisc}% de Desconto
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
              <p className="text-[11px] text-slate-400 pt-1">Preço regular por hora: <strong>R$ {tutor.hourlyRate}/h</strong></p>
            </div>

            {/* Garantía Preply */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-white block font-bold">Garantia de Satisfação Lexy</strong>
                <span className="text-slate-400 text-[11px]">Se não gostar da sua aula, oferecemos até 3 Aulas Experimentais GRATUITAS para testar outros professores.</span>
              </div>
            </div>

            {/* Botón Principal de Reserva */}
            <div className="space-y-3">
              <button
                onClick={() => handleBookClick('trial')}
                className="w-full bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black text-sm py-3.5 rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Agendar Aula Experimental</span>
              </button>

              <button
                onClick={() => handleBookClick('package')}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Ver Pacotes de Aulas Mensais
              </button>
            </div>

            {/* Respuesta rápida */}
            <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Resposta média: <strong>{tutor.responseTime}</strong></span>
            </div>

          </div>
        </div>

      </div>

      {/* Modal de Autenticación para Agendar Aula Experimental */}
      <BookingAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        tutor={tutor}
        onSuccessNavigate={() => navigate(`/book/${tutor.id}?tab=${targetBookingTab}`)}
      />

    </div>
  );
}
