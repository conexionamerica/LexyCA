import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, Star, ShieldCheck, Play, Heart, Clock, Globe, 
  Sparkles, Filter, CheckCircle2, ChevronRight, X, ArrowUpDown, Award 
} from 'lucide-react';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tutors } = useMarketplace();
  const { t } = useLanguage();

  // URL subject param handler
  const initialSubject = searchParams.get('subject') || 'Todos';

  // Estados de Filtro
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [maxPrice, setMaxPrice] = useState(50);
  const [onlyNative, setOnlyNative] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todos');
  const [sortBy, setSortBy] = useState('rating'); // 'rating', 'price_asc', 'price_desc', 'popular'
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [favorites, setFavorites] = useState(['tutor-1']);

  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    if (subjectParam) {
      setSelectedSubject(subjectParam);
    }
  }, [searchParams]);

  // Alternar Favorito
  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Filtrado y ordenamiento dinámico (SOLO TUTORES APROBADOS POR ADMIN)
  const filteredTutors = useMemo(() => {
    return tutors.filter(tutor => {
      // Regla de control de aprobación
      if (tutor.status !== 'approved') return false;
      // Búsqueda por texto
      const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tutor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tutor.bio.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Idioma / Materia
      if (selectedSubject !== 'Todos') {
        const targetSub = selectedSubject.toLowerCase();
        const tutorSub = tutor.subject ? tutor.subject.toLowerCase() : '';
        if (!tutorSub.includes(targetSub) && !targetSub.includes(tutorSub)) return false;
      }

      // Precio Máximo
      if (tutor.hourlyRate > maxPrice) return false;

      // Nativo
      if (onlyNative && !tutor.nativeSpeaker) return false;

      // Especialidad
      if (selectedSpecialty !== 'Todos' && !tutor.specialties.includes(selectedSpecialty)) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price_asc') return a.hourlyRate - b.hourlyRate;
      if (sortBy === 'price_desc') return b.hourlyRate - a.hourlyRate;
      if (sortBy === 'popular') return b.totalLessons - a.totalLessons;
      return 0;
    });
  }, [searchQuery, selectedSubject, maxPrice, onlyNative, selectedSpecialty, sortBy]);

  const subjects = ['Todos', 'Inglês', 'Espanhol'];
  const specialties = ['Todos', 'Conversação', 'Espanhol para Negócios', 'Business English', 'Preparação DELE/SIELE', 'TOEFL / IELTS', 'Iniciantes'];

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Banner de Encabezado Estilo Preply */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-500/30 p-6 sm:p-10 overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Mercado Oficial de Tutores Particulares</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Encontre o tutor ideal e fale com <span className="bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">fluência natural</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Mais de 10.000 alunos aprendem idiomas todos os dias. Agende sua primeira aula de teste com 100% de garantia de satisfação.
          </p>

          {/* CAJA DE TEXTO PERSUASIVA PARA COMPRA (REEMPLAZA A LA BARRA DE BÚSQUEDA SEGÚN PEDIDO) */}
          <div className="pt-2">
            <div className="bg-slate-900/90 border-2 border-cyan-500/40 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 group">
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-cyan-300 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Encontre seu tutor nativo</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  Agende sua primeira aula de teste com 100% de garantia de satisfação!
                </h3>
                <p className="text-xs text-slate-300">
                  Professores nativos qualificados prontos para alavancar sua fluência no seu próprio ritmo.
                </p>
              </div>

              <button 
                onClick={() => {
                  const el = document.getElementById('tutores-list');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-xs sm:text-sm py-3.5 px-6 rounded-xl shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105 shrink-0 cursor-pointer"
              >
                <span>Ver Tutores Disponíveis</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Filtros Avanzados */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>Filtros de Búsqueda</span>
          </div>

          {/* Ordenamiento */}
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-semibold">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-cyan-300 font-bold rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
            >
              <option value="rating">Melhor Avaliados ⭐</option>
              <option value="popular">Mais Aulas Impartidas 🔥</option>
              <option value="price_asc">Menor Preço 💲</option>
              <option value="price_desc">Maior Preço 💎</option>
            </select>
          </div>
        </div>

        {/* Fila de Controles de Filtro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Idioma / Materia */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Idioma que ensina</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-xl px-3 py-2 text-sm font-semibold focus:border-cyan-400 outline-none"
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Rango de Precio Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preço máximo / hora</label>
              <span className="text-xs font-black text-cyan-400">${maxPrice} / h</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="2"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Especialidad */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Especialidade</label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-xl px-3 py-2 text-sm font-semibold focus:border-cyan-400 outline-none"
            >
              {specialties.map(sp => <option key={sp} value={sp}>{sp}</option>)}
            </select>
          </div>

          {/* Toggle Hablante Nativo */}
          <div className="flex items-end">
            <button
              onClick={() => setOnlyNative(!onlyNative)}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                onlyNative
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4 text-amber-400" />
              <span>Apenas Falantes Nativos</span>
              {onlyNative && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

        </div>
      </div>

      {/* Resultados de la Búsqueda */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-400">
            Mostrando <strong className="text-white">{filteredTutors.length}</strong> tutores disponíveis
          </p>
        </div>

        {/* Grilla de Tarjetas de Tutores Estilo Preply */}
        {filteredTutors.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
            <Search className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-xl font-bold text-white">Nenhum tutor encontrado</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Tente ajustar seus filtros de preço, idioma ou especialidade para ver mais resultados.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('Todos');
                setMaxPrice(60);
                setOnlyNative(false);
                setSelectedSpecialty('Todos');
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredTutors.map((tutor) => (
              <div
                key={tutor.id}
                className="glass-panel rounded-3xl p-6 transition-all hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5 grid grid-cols-1 lg:grid-cols-12 gap-6 relative group"
              >
                {/* Botón Favorito */}
                <button
                  onClick={() => toggleFavorite(tutor.id)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Salvar nos favoritos"
                >
                  <Heart className={`w-5 h-5 ${favorites.includes(tutor.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

                {/* Columna 1: Video Thumbnail & Avatar (3 columnas) */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                  <div 
                    className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-800 group-hover:border-cyan-500/50 transition-colors cursor-pointer"
                    onClick={() => setActiveVideoUrl(tutor.videoUrl)}
                  >
                    <img
                      src={tutor.videoThumbnail}
                      alt={tutor.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="video-preview-overlay">
                      <div className="play-button-pulse">
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      </div>
                      <span className="absolute bottom-2 left-2 text-[10px] font-black bg-slate-950/80 text-white px-2 py-0.5 rounded-md border border-white/10">
                        Assistir Apresentação (1:30)
                      </span>
                    </div>
                  </div>

                  {/* Detalle rápido de idioma y nativo */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-slate-800/80 text-slate-200 border border-slate-700 text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5">
                      <span>{tutor.flag}</span>
                      <span>{tutor.country}</span>
                    </span>
                    {tutor.nativeSpeaker && (
                      <span className="bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Falante Nativo</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Columna 2: Detalles del Profesor (5 columnas) */}
                <div className="lg:col-span-5 space-y-3">
                  
                  {/* Nombre y Título */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                        {tutor.name}
                      </h3>
                      {tutor.isVerified && (
                        <ShieldCheck className="w-5 h-5 text-cyan-400 fill-cyan-400/20" title="Perfil Verificado" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-cyan-400 mt-0.5">{tutor.title}</p>
                  </div>

                  {/* Calificación y Clases */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-lg font-bold text-amber-300">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{tutor.rating}</span>
                      <span className="text-slate-400 font-normal">({tutor.reviewCount})</span>
                    </div>

                    <div className="text-slate-300 font-medium">
                      <strong>{tutor.totalLessons}</strong> aulas ministradas
                    </div>
                  </div>

                  {/* Biografía Corta */}
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {tutor.bio}
                  </p>

                  {/* Especialidades */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {tutor.specialties.map(sp => (
                      <span key={sp} className="bg-slate-900/90 border border-slate-800 text-slate-400 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Columna 3: Precio y Acciones de Reserva (3 columnas) */}
                <div className="lg:col-span-3 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6 space-y-4">
                  
                  <div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-medium">Preço regular / hora</span>
                      <div className="text-3xl font-black text-white tracking-tight">
                        ${tutor.hourlyRate} <span className="text-xs font-normal text-slate-400">USD</span>
                      </div>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 mt-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">Aula Experimental</span>
                      <span className="text-sm font-extrabold text-emerald-300">Apenas ${tutor.trialRate} por 25 min</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(`/book/${tutor.id}`)}
                      className="w-full bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Agendar Aula de Teste</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => navigate(`/tutor/${tutor.id}`)}
                      className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs py-2.5 rounded-xl transition-all"
                    >
                      Ver Perfil Completo
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{tutor.responseTime}</span>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal de Video de Presentación de Tutor */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm">Vídeo de Apresentação do Tutor</h4>
              <button
                onClick={() => setActiveVideoUrl(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full">
              <iframe
                src={activeVideoUrl}
                title="Apresentação do Tutor"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
