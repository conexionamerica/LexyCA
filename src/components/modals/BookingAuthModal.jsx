import React, { useState } from 'react';
import { X, Sparkles, User, Mail, Lock, ShieldCheck, ArrowRight, AlertCircle, LogIn, UserPlus, Globe, BookOpen, Award, CreditCard as CpfIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { validateCPF, formatCPF } from '../../lib/cpfValidator';

const RESIDENCE_COUNTRIES = [
  'Brasil 🇧🇷',
  'Estados Unidos 🇺🇸',
  'Espanha 🇪🇸',
  'México 🇲🇽',
  'Colômbia 🇨🇴',
  'Argentina 🇦🇷',
  'Portugal 🇵🇹',
  'Outro País 🌐'
];

export default function BookingAuthModal({ isOpen, onClose, tutor, onSuccessNavigate }) {
  const { signInWithSupabase, signUpWithSupabase } = useAuth();
  
  const [activeTab, setActiveTab] = useState('signup'); // 'signup' | 'login'
  
  // Registration Form State (TODOS LOS CAMPOS DEL CADASTRO NORMAL)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [residenceCountry, setResidenceCountry] = useState('Brasil 🇧🇷');
  const [cpf, setCpf] = useState('');
  const [passport, setPassport] = useState('');
  const [studyLanguage, setStudyLanguage] = useState(tutor?.subject || 'Espanhol');
  const [languageLevel, setLanguageLevel] = useState('Iniciante (A1/A2)');
  const [cpfError, setCpfError] = useState('');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // UX State
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !tutor) return null;

  const isBrazil = residenceCountry.includes('Brasil');

  const handleCpfChange = (e) => {
    const raw = e.target.value;
    const formatted = formatCPF(raw);
    setCpf(formatted);

    const clean = raw.replace(/\D/g, '');
    if (clean.length === 11) {
      if (!validateCPF(clean)) {
        setCpfError('CPF inválido. Verifique os dígitos.');
      } else {
        setCpfError('');
      }
    } else {
      setCpfError('');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setCpfError('');

    if (!regName.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }

    if (isBrazil) {
      const cleanCPF = cpf.replace(/\D/g, '');
      if (!cleanCPF || cleanCPF.length !== 11 || !validateCPF(cleanCPF)) {
        setCpfError('Por favor, informe um CPF verdadeiro e válido.');
        setErrorMsg('CPF verdadero e válido é obrigatório para residentes no Brasil.');
        return;
      }
    } else {
      if (!passport.trim()) {
        setErrorMsg('Por favor, informe seu passaporte ou documento internacional.');
        return;
      }
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg('Por favor, informe um e-mail válido.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    const res = await signUpWithSupabase({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: 'student',
      documentNumber: isBrazil ? cpf : passport,
      residenceCountry,
      study_language: studyLanguage,
      language_level: languageLevel
    });
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Erro ao criar conta. Tente novamente.');
      return;
    }

    // Éxito: cerrar modal y redirigir al checkout de la reserva
    onClose();
    if (onSuccessNavigate) {
      onSuccessNavigate();
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Preencha o e-mail e a senha para continuar.');
      return;
    }

    setIsLoading(true);
    const res = await signInWithSupabase({
      email: loginEmail.trim(),
      password: loginPassword
    });
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      return;
    }

    // Éxito: cerrar modal y redirigir al checkout de la reserva
    onClose();
    if (onSuccessNavigate) {
      onSuccessNavigate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 glow-cyan max-h-[85vh] overflow-y-auto">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors z-10"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado del Profesor Seleccionado */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <img
            src={tutor.avatar || tutor.avatar_url || "https://i.pravatar.cc/150?img=47"}
            alt={tutor.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-400 shrink-0"
          />
          <div className="space-y-1 overflow-hidden">
            <div className="inline-flex items-center gap-1 text-[10px] font-black text-cyan-300 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Aula Experimental de 25 min</span>
            </div>
            <h3 className="font-extrabold text-white text-base truncate">{tutor.name}</h3>
            <p className="text-xs text-slate-400">
              Valor: <strong className="text-emerald-400 font-extrabold">R$ {tutor.trialRate || 9}</strong>
            </p>
          </div>
        </div>

        {/* Banner Informativo sobre la necesidad de cuenta */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white block font-bold mb-0.5">Cadastre-se para agendar sua aula!</strong>
            Para concluir o agendamento e utilizar a carteira <strong className="text-cyan-300">Lexy Pay</strong>, é necessário preencher seus dados cadastrais completos ou fazer login.
          </div>
        </div>

        {/* Selector de Pestañas: Criar Conta vs Login */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'signup'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Criar Conta de Aluno</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Já Tenho Conta</span>
          </button>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: FORMULARIO COMPLETO DE REGISTRO DE ALUMNO */}
        {activeTab === 'signup' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* 1. Nome Completo */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Nome Completo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Seu nome e sobrenome"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            {/* 2. País de Residência */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">País de Residência *</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <select
                  value={residenceCountry}
                  onChange={(e) => setResidenceCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold focus:border-cyan-400 outline-none cursor-pointer"
                >
                  {RESIDENCE_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* 3. Documento (CPF se for Brasil, ou Passaporte) */}
            {isBrazil ? (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">CPF (Brasil) *</label>
                <div className="relative">
                  <CpfIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={cpf}
                    onChange={handleCpfChange}
                    className={`w-full bg-slate-950 border ${cpfError ? 'border-rose-500' : 'border-slate-800'} text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-medium focus:border-cyan-400 outline-none`}
                  />
                </div>
                {cpfError && <p className="text-[11px] text-rose-400 font-bold mt-1">{cpfError}</p>}
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Passaporte / Documento Internacional *</label>
                <div className="relative">
                  <CpfIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Número do seu passaporte ou ID"
                    value={passport}
                    onChange={(e) => setPassport(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-medium focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>
            )}

            {/* 4. Idioma que deseja aprender e Nível Atual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Idioma de Estudo</label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <select
                    value={studyLanguage}
                    onChange={(e) => setStudyLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-cyan-300 font-bold rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-cyan-400 outline-none cursor-pointer"
                  >
                    <option value="Inglês">Inglês 🇬🇧 🇺🇸</option>
                    <option value="Espanhol">Espanhol 🇪🇸</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Seu Nível Atual</label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <select
                    value={languageLevel}
                    onChange={(e) => setLanguageLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-bold rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-cyan-400 outline-none cursor-pointer"
                  >
                    <option value="Iniciante (A1/A2)">Iniciante (A1/A2)</option>
                    <option value="Intermediário (B1/B2)">Intermediário (B1/B2)</option>
                    <option value="Avançado (C1/C2)">Avançado (C1/C2)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 5. E-mail de Acesso */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">E-mail de Acesso *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            {/* 6. Senha e Confirmar Senha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Senha (Mín. 6) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Confirmar Senha *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer"
            >
              <span>{isLoading ? 'Criando conta...' : 'Criar Conta e Continuar Agendamento'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 2: FORMULARIO DE LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Seu E-mail Cadastrado</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Sua Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer"
            >
              <span>{isLoading ? 'Entrando...' : 'Entrar e Continuar Agendamento'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
