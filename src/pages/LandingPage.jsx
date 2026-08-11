import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Sparkles, ArrowRight, Play, Star, CheckCircle2, 
  Globe, ShieldCheck, UserCheck, GraduationCap, Clock, LogIn, Heart 
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { tutors } = useMarketplace();
  const { setDemoRole } = useAuth();

  // Filtrar solo tutores aprobados
  const approvedTutors = tutors.filter(t => t.status === 'approved');

  return (
    <div className="space-y-16 animate-fade-in-up">
      
      {/* ── HERO SECTION PRINCIPAL ESTILO PREPLY ── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-950 border border-cyan-500/30 p-8 sm:p-14 overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -bottom-16 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Lado Izquierdo: Textos y CTAs de Registro/Login */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Lexy Idiomas • Aprende. Fala. Conecta</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Aprenda <span className="bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">Inglês</span> ou <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Espanhol</span> com tutores nativos.
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
              Aulas particulares online 1-on-1 personalizadas para seus objetivos profissionais, viagens ou exames de proficiência.
            </p>

            {/* OPCIONES DE INICIO DE SESIÓN / REGISTRO DIRECTO */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 flex-wrap">
              
              {/* Botón 1: Explorar como Aluno */}
              <button
                onClick={() => navigate('/explore')}
                className="bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-sm px-6 py-4 rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <UserCheck className="w-5 h-5" />
                <span>Encontrar Tutores (Aluno)</span>
              </button>

              {/* Botón 2: Cadastro como Tutor */}
              <button
                onClick={() => navigate('/onboarding')}
                className="bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-extrabold text-sm px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <span>Quero me Cadastrar como Tutor</span>
              </button>

              {/* Botón 3: Já tenho conta (Login) */}
              <button
                onClick={() => navigate('/login')}
                className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5 text-cyan-400" />
                <span>Já tenho conta (Iniciar Sessão)</span>
              </button>

            </div>

            <div className="pt-4 flex items-center gap-6 text-xs font-bold text-slate-400 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> +10.000 Aulas Concluídas
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.9/5 Avaliação Média
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> 100% Reembolsável
              </div>
            </div>

          </div>

          {/* Lado Derecho: Acceso Rápido de Login / Sandbox */}
          <div className="lg:col-span-5">
            <div className="glass-panel rounded-3xl p-6 border border-cyan-500/40 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <img src="/lexy_logo.png" alt="Lexy Mascot Logo" className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-400/60 logo-mascot-animated" />
                <div>
                  <h2 className="text-lg font-black brand-text-shimmer">Lexy Idiomas</h2>
                  <span className="text-xs text-cyan-300 font-extrabold tracking-wide">Aprende • Fala • Conecta</span>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Se você já possui uma conta cadastrada, selecione como deseja acessar:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => { setDemoRole('student'); navigate('/dashboard/student'); }}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-bold text-xs hover:border-cyan-400 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-cyan-400" /> Acessar Painel do Aluno</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => { setDemoRole('teacher'); navigate('/dashboard/teacher'); }}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-bold text-xs hover:border-amber-400 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-amber-400" /> Acessar Painel do Tutor</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => { setDemoRole('admin'); navigate('/admin'); }}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 font-bold text-xs hover:border-emerald-400 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Acessar Painel Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2 text-center">
                <Link to="/login" className="text-xs text-cyan-400 font-bold hover:underline">
                  Ou faça login com e-mail e senha ➔
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── SECCIÓN DE TUTORES DESTACADOS (INFORMACIÓN PÚBLICA) ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Tutores em Destaque</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Conheça alguns dos professores nativos de Inglês e Espanhol mais recomendados da comunidade.
            </p>
          </div>

          <button
            onClick={() => navigate('/explore')}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            Ver Todos os Tutores ➔
          </button>
        </div>

        {/* Grilla de Tutores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedTutors.slice(0, 3).map((tutor) => (
            <div
              key={tutor.id}
              className="glass-panel rounded-3xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900">
                  <img src={tutor.videoThumbnail} alt={tutor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-white text-base group-hover:text-cyan-300 transition-colors">
                      {tutor.name}
                    </h3>
                    <span className="text-xs">{tutor.flag} {tutor.countryCode}</span>
                  </div>
                  <p className="text-xs text-cyan-400 font-semibold">{tutor.subject} • {tutor.title}</p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1 font-bold text-amber-300">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{tutor.rating}</span>
                    <span className="text-slate-400 font-normal">({tutor.reviewCount})</span>
                  </div>
                  <span className="font-black text-white text-sm">${tutor.hourlyRate} USD/h</span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/book/${tutor.id}`)}
                className="w-full bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg shadow-cyan-500/20"
              >
                Agendar Aula Experimental
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── COMO FUNCIONA (3 PASOS CLAROS) ── */}
      <div className="glass-panel rounded-3xl p-8 sm:p-12 space-y-8 border border-slate-800 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Como Funciona a Plataforma</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 font-black text-lg flex items-center justify-center">1</div>
            <h3 className="font-extrabold text-white text-sm">Escolha o Tutor Ideal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Assista aos vídeos de apresentação, confira as avaliações de outros alunos e filtre por preço ou horário.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-black text-lg flex items-center justify-center">2</div>
            <h3 className="font-extrabold text-white text-sm">Aula Experimental de 25 min</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Conheça o professor, defina suas metas de aprendizado e faça o teste de nível com 100% de garantia.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center">3</div>
            <h3 className="font-extrabold text-white text-sm">Aulas Semanais no Space</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pratique conversação na sala virtual interativa com lousa compartilhada e conquiste a fluência.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
