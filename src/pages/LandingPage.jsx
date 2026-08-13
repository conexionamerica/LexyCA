import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import LexyAnimatedLogo from '../components/layout/LexyAnimatedLogo';
import { 
  Sparkles, ArrowRight, Play, Star, CheckCircle2, 
  Globe, ShieldCheck, UserCheck, GraduationCap, Clock, LogIn, Heart,
  MessageCircle, ChevronDown, Quote, Info
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { tutors, announcements = [] } = useMarketplace();
  const { setDemoRole } = useAuth();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  // Filtrar solo tutores aprobados e ordená-los pelos valores mais acessíveis (menor tarifa por hora)
  const approvedTutors = tutors
    .filter(t => t.status === 'approved')
    .sort((a, b) => a.hourlyRate - b.hourlyRate);

  const promoMessages = announcements.filter(a => a.target === 'all' || a.target === 'landing').map(a => a.message);
  const defaultMessages = [
    "📚 Cadastre-se e tenha acesso aos melhores professores de idiomas!",
    "🚀 Aprenda rápido e conquiste a fluência com aulas personalizadas",
    "💬 Receba feedback personalizado após cada sessão de aula",
    "📅 Não perca nenhuma aula — use a opção de reagendar!",
    "🎯 Escolha o melhor professor para você no nosso catálogo",
    "👨‍🏫 Nossos professores estão prontos para ajudá-lo a alcançar a fluência no menor tempo possível"
  ];
  const messagesToDisplay = promoMessages.length > 0 ? promoMessages : defaultMessages;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % messagesToDisplay.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messagesToDisplay.length]);

  const testimonials = [
    { name: "Carlos S.", country: "🇧🇷", rating: 5, text: "O Lexy Idiomas transformou minha forma de falar inglês. Consegui a fluência que precisava para o meu trabalho!", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80" },
    { name: "Sarah J.", country: "🇺🇸", rating: 5, text: "The tutors are amazing! I learned Spanish so fast and now I feel confident traveling to Latin America.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80" },
    { name: "María P.", country: "🇪🇸", rating: 4, text: "Las clases son muy dinámicas y los profesores están siempre dispuestos a ayudar. Muito bom!", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80" },
    { name: "João V.", country: "🇵🇹", rating: 5, text: "Plataforma excelente. A possibilidade de escolher professores de diferentes nacionalidades faz toda a diferença.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80" },
    { name: "Emily R.", country: "🇬🇧", rating: 5, text: "I love the interactive classroom. It makes learning a new language incredibly fun and efficient.", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80" },
    { name: "Lucas F.", country: "🇧🇷", rating: 5, text: "Recomendo muito! Em apenas alguns meses já consigo me comunicar sem medo. Professores muito qualificados.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80" }
  ];

  const faqs = [
    { q: "Como funciona a plataforma Lexy Idiomas?", a: "Você se cadastra gratuitamente, escolhe um professor no nosso catálogo, agenda uma aula experimental e começa a aprender em nossa sala de aula virtual exclusiva." },
    { q: "Como escolho o melhor professor para mim?", a: "Use nossos filtros para encontrar professores por idioma, preço, disponibilidade e especialidade. Assista ao vídeo de apresentação e leia as avaliações de outros alunos." },
    { q: "Como funciona o sistema de pagamento?", a: "Você pode comprar Créditos Lexy utilizando PIX ou cartão de crédito, e usar esses créditos para agendar suas aulas." },
    { q: "Posso reagendar ou cancelar uma aula?", a: "Sim! Você pode reagendar ou cancelar qualquer aula com até 24h de antecedência sem nenhum custo." },
    { q: "Como entro na sala virtual?", a: "No horário da aula, basta acessar o seu painel (Dashboard) e clicar no botão para entrar no Space (nossa sala virtual)." },
    { q: "A plataforma oferece certificado?", a: "Sim, ao concluir níveis específicos de fluência, você pode solicitar um certificado atestando seu progresso e carga horária." }
  ];

  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  return (
    <div className="space-y-16 animate-fade-in-up pb-16">
      
      {/* ── HERO SECTION PRINCIPAL ESTILO PREPLY (EDGE-TO-EDGE 100% SEM SANGRIA OU MARGENS) ── */}
      <div className="w-full bg-slate-950 border-b border-slate-800/80 px-2 sm:px-4 lg:px-6 py-10 sm:py-16">
        <div className="w-full max-w-[1400px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* TEXTO E CTA PRINCIPAL (LADO ESQUERDO DA TELA IGUAL À FOTO) */}
            <div className="lg:col-span-7 space-y-8">
              
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
                  Aprenda mais rápido com as <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">melhores aulas de idiomas</span>.
                </h1>
                
                <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-medium">
                  Aulas particulares online 1-on-1 com professores nativos de Inglês e Espanhol. Alcance a fluência rapidamente com suporte individual.
                </p>
              </div>

              {/* BOTÃO PRINCIPAL ESTILO PREPLY CON CORES LEXY */}
              <div>
                <button
                  onClick={() => navigate('/explore')}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 border border-cyan-500/50 hover:border-cyan-400 text-white font-black text-base sm:text-lg py-4 px-8 rounded-xl shadow-2xl shadow-cyan-500/10 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] group"
                >
                  <span>Encontrar seu professor</span>
                  <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>

            {/* FOTO DO PROFESSOR COM EFEITO DE CARTÕES EMPILHADOS (LADO DIREITO IGUAL À FOTO) */}
            <div className="lg:col-span-5 relative pt-6 lg:pt-0">
              <div className="relative max-w-md lg:max-w-none mx-auto">
                
                {/* Camada 3 de fundo empilhada */}
                <div className="absolute -right-6 -bottom-6 inset-0 bg-slate-900/40 border border-slate-800/40 rounded-3xl transform rotate-3 pointer-events-none" />
                
                {/* Camada 2 de fundo empilhada */}
                <div className="absolute -right-3 -bottom-3 inset-0 bg-slate-900/80 border border-slate-800/80 rounded-3xl transform rotate-1 pointer-events-none" />

                {/* Cartão Principal da Foto Real */}
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-900 border-2 border-cyan-500/40 shadow-2xl group">
                  <img 
                    src="/lexy_hero_man.png" 
                    alt="Professor Real de Idiomas na Sala Virtual Lexy" 
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Badge de Aula Ao Vivo */}
                  <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur border border-cyan-400/40 text-cyan-300 text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Aula ao vivo • Lexy Space</span>
                  </div>

                  {/* Botão de cadastro sobre a foto solicitado pelo usuário */}
                  <button
                    onClick={() => navigate('/login?role=student')}
                    className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-xs sm:text-sm py-3 px-4 rounded-xl shadow-2xl flex items-center justify-between transition-all hover:scale-[1.02] group cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-slate-950 flex-shrink-0" />
                      <span>Cria tua conta agora e começa a estudar</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </button>

                </div>

              </div>
            </div>

          </div>

          {/* SELETOR DE IDIOMAS LINHAS SIMPLES COM BANDEIRAS REAIS (EUA E ESPANHA) */}
          <div className="mt-8 space-y-2 border-t border-slate-800/80 pt-6">
            <button
              onClick={() => navigate('/explore?subject=Inglês')}
              className="w-full py-4 px-4 rounded-2xl hover:bg-slate-900 border-b border-slate-800/80 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-4">
                <img src="https://flagcdn.com/w40/us.png" alt="Bandeira Estados Unidos" className="w-7 h-5 rounded object-cover shadow-sm border border-slate-700" />
                <div className="text-left">
                  <span className="font-extrabold text-white text-base block group-hover:text-cyan-300">Língua inglesa</span>
                  <span className="text-xs text-slate-400">25.017 professores qualificados</span>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-slate-400 -rotate-90 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/explore?subject=Espanhol')}
              className="w-full py-4 px-4 rounded-2xl hover:bg-slate-900 border-b border-slate-800/80 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-4">
                <img src="https://flagcdn.com/w40/es.png" alt="Bandeira Espanha" className="w-7 h-5 rounded object-cover shadow-sm border border-slate-700" />
                <div className="text-left">
                  <span className="font-extrabold text-white text-base block group-hover:text-cyan-300">Língua espanhola</span>
                  <span className="text-xs text-slate-400">18.420 professores qualificados</span>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-slate-400 -rotate-90 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </div>



      {/* ── SECCIONES SECUNDARIAS (ALINEADAS LIMPIAMENTE AL CENTRO) ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
        
        {/* ── SEÇÃO DE GARANTIA E SATISFAÇÃO 100% LEXY ── */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Garantia de Satisfação Lexy</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              Aulas com qualidade que você vai amar. <span className="bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">Nós garantimos!</span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
              Sua experiência é nossa prioridade total: se a sua primeira aula não for perfeita para você, sem complicação — basta experimentar outro professor totalmente grátis.
            </p>
          </div>

          <div className="flex-shrink-0 w-full md:w-auto">
            <button
              onClick={() => navigate('/explore')}
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-sm sm:text-base py-4 px-8 rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <CheckCircle2 className="w-5 h-5 text-slate-950" />
              <span>Experimentar sem risco</span>
            </button>
          </div>
        </div>
        
        {/* ── SECCIÓN DE TUTORES DESTACADOS ── */}
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
                className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950">
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
        <div className="bg-slate-900/60 rounded-3xl p-8 sm:p-12 space-y-8 border border-slate-800 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Como Funciona a Plataforma</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 font-black text-lg flex items-center justify-center">1</div>
              <h3 className="font-extrabold text-white text-sm">Escolha o Tutor Ideal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Assista aos vídeos de apresentação, confira as avaliações de outros alunos e filtre por preço ou horário.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-black text-lg flex items-center justify-center">2</div>
              <h3 className="font-extrabold text-white text-sm">Aula Experimental de 25 min</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conheça o professor, defina suas metas de aprendizado e faça o teste de nível com 100% de garantia.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center">3</div>
              <h3 className="font-extrabold text-white text-sm">Aulas Semanais no Space</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pratique conversação na sala virtual interativa com lousa compartilhada e conquiste a fluência.
              </p>
            </div>
          </div>
        </div>

        {/* ── STUDENT TESTIMONIALS SECTION ── */}
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center">O que nossos alunos dizem</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testim, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 flex flex-col gap-4 animate-fade-in-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <img src={testim.avatar} alt={testim.name} className="w-12 h-12 rounded-full object-cover border border-cyan-500/30" />
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      {testim.name} <span>{testim.country}</span>
                    </h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < testim.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 w-6 h-6 text-slate-700/50" />
                  <p className="text-sm text-slate-300 italic relative z-10 pl-2">
                    "{testim.text}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SEÇÃO PARA TUTORES: SEJA UM PROFESSOR NA LEXY ── */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-amber-500/30 rounded-3xl p-8 sm:p-12 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -left-10 -top-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Quero Dar Aulas na Lexy</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              Seja um professor na <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">Lexy Idiomas</span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
              Monetize seu conhecimento especializado e alcance novos alunos diariamente. Faça seu cadastro e comece a lecionar online com flexibilidade total.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-white text-base">Encontre novos alunos</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conecte-se com estudantes motivados de diversos lugares buscando aulas de Inglês e Espanhol.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-white text-base">Expanda suas atividades</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Defina seus próprios horários e tarifas por hora, trabalhando de onde estiver com total autonomia.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-white text-base">Receba com segurança</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pagamentos garantidos após cada aula e saques diretos via PIX para sua conta bancária.
              </p>
            </div>
          </div>

          {/* BOTÃO FINAL DE CADASTRO DO TUTOR */}
          <div className="text-center pt-2">
            <button
              onClick={() => navigate('/onboarding')}
              className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-sm sm:text-base py-4 px-8 rounded-2xl shadow-xl shadow-amber-500/20 inline-flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
            >
              <GraduationCap className="w-5 h-5 text-slate-950" />
              <span>Cadastrar-se para dar aulas na Lexy</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>
          </div>
        </div>

        {/* ── FAQ SECTION ── */}
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center">Perguntas Frequentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-white font-semibold hover:bg-slate-800/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-slate-400 animate-fade-in-up">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── SUPPORT CTA ── */}
        <div className="bg-slate-900/90 rounded-3xl p-8 sm:p-10 border border-slate-800 text-center flex flex-col items-center gap-4">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">Precisa de ajuda? Fale com nosso suporte 24/7</h3>
          <p className="text-sm text-slate-400 max-w-lg">
            Nossa equipe está disponível o tempo todo para ajudar você com qualquer dúvida sobre a plataforma.
          </p>
          <a 
            href="https://wa.me/5511999999999" 
            target="_blank" 
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02]"
          >
            <MessageCircle className="w-5 h-5" />
            Falar no WhatsApp
          </a>
        </div>

      </div>

    </div>
  );
}
