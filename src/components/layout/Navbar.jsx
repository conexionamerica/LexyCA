import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMarketplace } from '../../contexts/MarketplaceContext';
import LexyAnimatedLogo from './LexyAnimatedLogo';
import { 
  Globe, Search, UserCheck, GraduationCap, 
  LogIn, User, LogOut, Wallet, ShieldCheck, ChevronDown, Menu, X 
} from 'lucide-react';

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const { student } = useMarketplace();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[64px] sm:min-h-[80px] py-2">
          
          {/* Logo & Brand Lexy Idiomas com Varinha Mágica e Transições */}
          <Link to="/" className="flex items-center">
            <LexyAnimatedLogo size="medium" showSlogan={true} />
          </Link>

          {/* BOTONES PRINCIPALES O MENU DE USUARIO LOGUEADO */}
          <div className="hidden md:flex items-center gap-3">
            
            {profile ? (
              /* MENU DEL USUARIO CONECTADO DA CONTA */
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-1.5 pr-3 rounded-2xl transition-all"
                >
                  <img
                    src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={profile.full_name}
                    className="w-9 h-9 rounded-xl object-cover border border-cyan-400"
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
                      {profile.documentNumber && (
                        <span className="text-[10px] text-cyan-400 font-mono block">Doc: {profile.documentNumber}</span>
                      )}
                      
                      {profile.role === 'student' && (
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Saldo:</span>
                          <strong className="text-emerald-400 font-black">${student.walletBalance.toFixed(2)} USD</strong>
                        </div>
                      )}
                    </div>

                    {/* Enlace al Panel según Rol */}
                    {profile.role === 'student' && (
                      <>
                        <Link
                          to="/dashboard/student"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                        >
                          <User className="w-4 h-4 text-cyan-400" /> Meu Painel de Aluno
                        </Link>
                        <Link
                          to="/dashboard/student/wallet"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                        >
                          <Wallet className="w-4 h-4 text-emerald-400" /> Minha Billetera
                        </Link>
                      </>
                    )}

                    {profile.role === 'teacher' && (
                      <Link
                        to="/dashboard/teacher"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2 transition-colors"
                      >
                        <GraduationCap className="w-4 h-4 text-amber-400" /> Painel do Tutor
                      </Link>
                    )}

                    {profile.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 flex items-center gap-2 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Painel de Administração
                      </Link>
                    )}

                    {/* BOTÓN ROJO DE SAIR DA CONTA (LOGOUT) */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold text-rose-400 hover:bg-rose-500/20 flex items-center gap-2 transition-colors border-t border-slate-800"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" /> Sair da Conta (Logout)
                    </button>

                  </div>
                )}
              </div>
            ) : (
              /* VISITANTE NO LOGUEADO */
              <>
                {/* BOTÓN 1: PARA ALUNOS */}
                <Link
                  to="/login?role=student"
                  className="bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-105"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Para Alunos</span>
                </Link>

                {/* BOTÓN 2: PARA TUTORES */}
                <Link
                  to="/onboarding"
                  className="bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 hover:text-amber-200 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 hover:scale-105"
                >
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <span>Quero Dar Aulas</span>
                </Link>
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
            to="/login?role=student"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full bg-cyan-500 text-slate-950 font-bold text-xs p-3 rounded-xl flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Para Alunos (Encontrar Tutores)</span>
          </Link>

          <Link
            to="/onboarding"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full bg-slate-900 text-amber-300 font-bold text-xs p-3 rounded-xl border border-slate-800 flex items-center justify-center gap-2"
          >
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>Para Tutores (Quero Dar Aulas)</span>
          </Link>
        </div>
      )}
    </header>
  );
}
