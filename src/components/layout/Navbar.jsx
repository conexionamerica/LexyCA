import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMarketplace } from '../../contexts/MarketplaceContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LexyAnimatedLogo from './LexyAnimatedLogo';
import { 
  Globe, Search, UserCheck, GraduationCap, 
  LogIn, User, LogOut, Wallet, ShieldCheck, ChevronDown, Menu, X, ArrowRight, Headphones, Check, Calendar
} from 'lucide-react';

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const { student } = useMarketplace();
  const { lang, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const languageLabels = {
    pt: { flag: '🇧🇷', label: 'Português, BRL' },
    es: { flag: '🇪🇸', label: 'Español, ES' },
    en: { flag: '🇺🇸', label: 'English, US' }
  };

  const studentTabs = [
    { id: 'inicio', label: '🏠 Início' },
    { id: 'catalogo', label: '📚 Catálogo' },
    { id: 'chat', label: '💬 Chat' },
    { id: 'carteira', label: '💰 Carteira' },
    { id: 'perfil', label: '👤 Perfil' }
  ];

  const teacherTabs = [
    { id: 'inicio', label: '🏠 Início' },
    { id: 'agenda', label: '📅 Agenda' },
    { id: 'alunos', label: '👥 Alunos' },
    { id: 'chat', label: '💬 Chat' },
    { id: 'ganhos', label: '💰 Ganhos' },
    { id: 'perfil', label: '⚙️ Perfil' }
  ];

  const currentTab = searchParams.get('tab') || 'inicio';

  // Verificar se o usuário está dentro de qualquer painel
  const isInsidePanel = !!profile || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/tutor') || location.pathname.startsWith('/admin');

  return (
    <header className="relative w-full z-30 bg-slate-950 border-b border-slate-800/80">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between min-h-[64px] sm:min-h-[72px] py-2">
          
          {/* LADO ESQUERDO: Logo & Mascot (Sem eslogan nem palavra Idiomas quando dentro do painel) */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center shrink-0">
              <LexyAnimatedLogo size="medium" showSlogan={!isInsidePanel} showIdiomas={!isInsidePanel} />
            </Link>
          </div>

          {/* CENTRO: NAVEGAÇÃO UNIFICADA DO ALUNO NO HEADER PRINCIPAL (SHADCN TABS UI) */}
          {profile?.role === 'student' && (
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/40 border border-slate-800/80 rounded-xl p-1">
              {studentTabs.map(tab => {
                const isActive = location.pathname.startsWith('/dashboard/student') && currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(`/dashboard/student?tab=${tab.id}`)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                      isActive
                        ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* CENTRO: NAVEGAÇÃO UNIFICADA DO PROFESSOR NO HEADER PRINCIPAL */}
          {profile?.role === 'teacher' && (
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/40 border border-slate-800/80 rounded-xl p-1">
              {teacherTabs.map(tab => {
                const isActive = (location.pathname.startsWith('/dashboard/teacher') || location.pathname.startsWith('/tutor')) && currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(`/dashboard/teacher?tab=${tab.id}`)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                      isActive
                        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* LADO DIREITO: MENÚ DE USUARIO */}
          <div className="hidden md:flex items-center gap-3 text-xs font-bold text-slate-300">

            {profile ? (
              /* MENU DO USUÁRIO CONECTADO */
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-1.5 pr-3 rounded-xl transition-all"
                >
                  <img
                    src={
                      profile.avatar_url || 
                      (profile.id ? localStorage.getItem('lexy_avatar_' + profile.id) : null) || 
                      (profile.email ? localStorage.getItem('lexy_avatar_' + profile.email) : null) || 
                      (profile.role === 'teacher' 
                        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' 
                        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')
                    }
                    alt={profile.full_name}
                    className="w-8 h-8 rounded-lg object-cover border border-cyan-400"
                    onError={(e) => {
                      e.target.src = profile.role === 'teacher' 
                        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' 
                        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="text-left">
                    <span className="text-xs font-black text-white block leading-tight">{profile.full_name}</span>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                      {profile.role === 'teacher' ? '👨‍🏫 Tutor' : profile.role === 'admin' ? '🛡️ Admin' : '👤 Aluno'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown del Menú de Usuario */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in-up space-y-1">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-xs font-bold text-white block truncate">{profile.full_name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{profile.email}</span>
                      {profile.role === 'student' && (
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Saldo:</span>
                          <strong className="text-emerald-400 font-black">${student.walletBalance.toFixed(2)} USD</strong>
                        </div>
                      )}
                    </div>

                    {profile.role === 'student' && (
                      <>
                        <Link
                          to="/dashboard/student"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                        >
                          <User className="w-4 h-4 text-cyan-400" /> Meu Painel de Aluno
                        </Link>
                        <Link
                          to="/dashboard/student/wallet"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                        >
                          <Wallet className="w-4 h-4 text-emerald-400" /> Minha Billetera
                        </Link>
                      </>
                    )}

                    {profile.role === 'teacher' && (
                      <Link
                        to="/dashboard/teacher"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2 transition-colors"
                      >
                        <GraduationCap className="w-4 h-4 text-amber-400" /> Painel do Tutor
                      </Link>
                    )}

                    {profile.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 flex items-center gap-2 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Painel de Administração
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold text-rose-400 hover:bg-rose-500/20 flex items-center gap-2 transition-colors border-t border-slate-800"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" /> Sair da Conta (Logout)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* VISITANTE: 3 BOTÕES PEDIDOS PELO USUÁRIO */
              <>
                {/* BOTÃO 1: ENCONTRAR UM PROFESSOR */}
                <Link
                  to="/explore"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Encontrar um professor</span>
                </Link>

                {/* BOTÃO 2: SEJA UM PROFESSOR */}
                <Link
                  to="/onboarding"
                  className="bg-slate-900 hover:bg-slate-850 border border-amber-500/50 text-amber-300 hover:text-amber-200 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 hover:scale-105"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Seja um professor</span>
                </Link>

                {/* BOTÃO 3: LOGIN (ABRE MODAL PERGUNTANDO ALUNO OU PROFESSOR) */}
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-1.5 hover:border-slate-600 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Login</span>
                </button>
              </>
            )}

          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-3 animate-fade-in-up">
          <Link
            to="/explore"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full bg-cyan-500 text-slate-950 font-bold text-xs p-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>1. Encontrar um professor</span>
          </Link>

          <Link
            to="/onboarding"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full bg-slate-900 text-amber-300 font-bold text-xs p-3 rounded-xl border border-slate-800 flex items-center justify-center gap-2"
          >
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>2. Seja um professor</span>
          </Link>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsLoginModalOpen(true);
            }}
            className="w-full bg-slate-900 text-white font-bold text-xs p-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4 text-cyan-400" />
            <span>3. Login (Aluno / Professor)</span>
          </button>
        </div>
      )}

      {/* MODAL DE SELEÇÃO DE LOGIN: ALUNO OU PROFESSOR */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative glow-cyan">
            
            {/* Botão de Fechar */}
            <button 
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header do Modal */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3 border border-cyan-400/30">
                <LogIn className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">Como deseja acessar?</h3>
              <p className="text-xs text-slate-400">
                Escolha o portal correspondente ao seu perfil na Lexy Idiomas.
              </p>
            </div>

            {/* 2 Opções de Acesso */}
            <div className="space-y-3">
              {/* OPÇÃO 1: SOU ALUNO */}
              <button
                onClick={() => {
                  setIsLoginModalOpen(false);
                  navigate('/login/student');
                }}
                className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-400 flex items-center justify-between transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-white text-sm block group-hover:text-cyan-300">Sou Aluno</span>
                    <span className="text-[11px] text-slate-400">Acessar portal do aluno e minhas aulas</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              {/* OPÇÃO 2: SOU PROFESSOR */}
              <button
                onClick={() => {
                  setIsLoginModalOpen(false);
                  navigate('/login/teacher');
                }}
                className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-400 flex items-center justify-between transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-white text-sm block group-hover:text-amber-300">Sou Professor (Tutor)</span>
                    <span className="text-[11px] text-slate-400">Acessar painel do tutor e agenda</span>
                  </div>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
