import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Sparkles, User, Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, 
  AlertCircle, LogIn, UserPlus, Globe, BookOpen, Award, CreditCard as CpfIcon, 
  Phone, MapPin, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { validateCPF, formatCPF } from '../../lib/cpfValidator';
import { formatPhone, validatePhone } from '../../lib/phoneValidator';
import { formatCEP, fetchAddressByCEP } from '../../lib/cepValidator';

import TermsPrivacyModal from './TermsPrivacyModal';

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
  const [signupStep, setSignupStep] = useState(1); // 1: Dados, 2: Endereço & CPF, 3: Perfil
  
  // Registration Form State (TODOS LOS CAMPOS DEL CADASTRO NORMAL)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [residenceCountry, setResidenceCountry] = useState('Brasil 🇧🇷');
  const [cpf, setCpf] = useState('');
  const [passport, setPassport] = useState('');

  // Endereço e NFS-e
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [fetchingCep, setFetchingCep] = useState(false);

  // Perfil Aluno
  const [studyLanguage, setStudyLanguage] = useState(tutor?.subject || 'Espanhol');
  const [languageLevel, setLanguageLevel] = useState('Iniciante (A1/A2)');
  const [studyMotivation, setStudyMotivation] = useState('Carreira Profissional 📈');
  
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [cpfError, setCpfError] = useState('');
  const [phoneError, setPhoneError] = useState('');

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

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    const clean = formatted.replace(/\D/g, '');
    if (clean.length >= 8) {
      if (!validatePhone(formatted, isBrazil)) {
        setPhoneError('Número de celular inválido. Informe um número verdadeiro com DDD.');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  };

  const handleCepChange = async (e) => {
    const rawVal = e.target.value;
    const formatted = formatCEP(rawVal);
    setPostalCode(formatted);

    const clean = rawVal.replace(/\D/g, '');
    if (clean.length === 8) {
      setFetchingCep(true);
      const res = await fetchAddressByCEP(clean);
      setFetchingCep(false);
      if (res) {
        setAddress(res.address || address);
        setProvince(res.province || province);
        setCity(res.city || city);
        setState(res.state || state);
      }
    }
  };

  const handleNextStep1 = () => {
    setErrorMsg('');
    setPhoneError('');
    if (!regName.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg('Por favor, informe um e-mail válido.');
      return;
    }
    if (!phone.trim() || !validatePhone(phone, isBrazil)) {
      setPhoneError('Por favor, informe um número de celular verdadeiro e válido com DDD.');
      setErrorMsg('Celular/WhatsApp verdadeiro é obrigatório para notificações de aulas e cobranças.');
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
    setSignupStep(2);
  };

  const handleNextStep2 = () => {
    setErrorMsg('');
    setCpfError('');
    if (isBrazil) {
      const cleanCPF = cpf.replace(/\D/g, '');
      if (!cleanCPF || cleanCPF.length !== 11 || !validateCPF(cleanCPF)) {
        setCpfError('Por favor, informe um CPF verdadeiro e válido.');
        setErrorMsg('CPF verdadeiro e válido é obrigatório para residentes no Brasil.');
        return;
      }
    } else {
      if (!passport.trim()) {
        setErrorMsg('Por favor, informe seu passaporte ou documento internacional.');
        return;
      }
    }
    setSignupStep(3);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setCpfError('');

    if (!acceptedTerms) {
      setErrorMsg('Você precisa ler e concordar com os Termos de Uso e a Política de Privacidade para concluir o cadastro.');
      return;
    }

    setIsLoading(true);
    const res = await signUpWithSupabase({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: 'student',
      phone,
      documentNumber: isBrazil ? cpf : passport,
      residenceCountry,
      postalCode,
      address,
      addressNumber,
      complement,
      province,
      city,
      state,
      study_language: studyLanguage,
      language_level: languageLevel,
      study_motivation: studyMotivation
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

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 glow-cyan max-h-[85vh] overflow-y-auto">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors z-10 cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Banner Informativo sobre la necesidad de cuenta */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white block font-bold mb-0.5">Cadastre-se para agendar sua aula com {tutor.name}!</strong>
            Para concluir o agendamento e utilizar a carteira <strong className="text-cyan-300">Lexy Pay</strong>, é necessário preencher seus dados cadastrais em 3 passos ou fazer login.
          </div>
        </div>

        {/* Selector de Pestañas: Criar Conta vs Login */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg('');
              setSignupStep(1);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Já Tenho Conta</span>
          </button>
        </div>

        {/* INDICADOR DE PASSO (STEPPER 3 PASOS EN MODAL) */}
        {activeTab === 'signup' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
              <span className={signupStep === 1 ? 'text-cyan-400 font-extrabold' : ''}>
                1. Dados Pessoais
              </span>
              <span className={signupStep === 2 ? 'text-cyan-400 font-extrabold' : ''}>
                2. Endereço & CPF
              </span>
              <span className={signupStep === 3 ? 'text-cyan-400 font-extrabold' : ''}>
                3. Perfil Aluno
              </span>
            </div>
            
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800 flex gap-1">
              <div className={`h-full rounded-full transition-all duration-300 flex-1 ${signupStep >= 1 ? 'bg-cyan-500' : 'bg-slate-800'}`} />
              <div className={`h-full rounded-full transition-all duration-300 flex-1 ${signupStep >= 2 ? 'bg-cyan-500' : 'bg-slate-800'}`} />
              <div className={`h-full rounded-full transition-all duration-300 flex-1 ${signupStep >= 3 ? 'bg-cyan-500' : 'bg-slate-800'}`} />
            </div>
          </div>
        )}

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: FORMULARIO MULTI-PASO DE REGISTRO DE ALUMNO */}
        {activeTab === 'signup' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* PASO 1: DADOS PESSOAIS E CONTA */}
            {signupStep === 1 && (
              <div className="space-y-3.5 animate-fade-in">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Nome Completo *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: João Carlos Silva"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>

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

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Celular / WhatsApp (com DDD) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder={isBrazil ? '(11) 99999-8888' : '+1 (555) 000-0000'}
                      className={`w-full bg-slate-950 border ${phoneError ? 'border-rose-500 text-rose-300' : 'border-slate-800'} text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono outline-none focus:border-cyan-400`}
                    />
                  </div>
                  {phoneError && <p className="text-[10px] font-bold text-rose-400 mt-1">{phoneError}</p>}
                </div>

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
                  type="button"
                  onClick={handleNextStep1}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
                >
                  <span>Continuar para Passo 2 (Endereço & CPF)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* PASO 2: DOCUMENTOS E ENDEREÇO */}
            {signupStep === 2 && (
              <div className="space-y-3.5 animate-fade-in">
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

                {/* ENDEREÇO COMPLETO PARA NOTA FISCAL (NFS-E) */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Endereço de Faturamento & Emissão de Nota Fiscal (NFS-e)
                    </span>
                    {fetchingCep && <span className="text-[9px] text-amber-400 font-bold animate-pulse">Buscando CEP...</span>}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">CEP *</label>
                      <input
                        type="text"
                        maxLength={9}
                        value={postalCode}
                        onChange={handleCepChange}
                        placeholder="00000-000"
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-1.5 text-xs font-mono font-bold outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Logradouro / Rua *</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Rua / Avenida"
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-1.5 text-xs outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Número *</label>
                      <input
                        type="text"
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
                        placeholder="123"
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-1.5 text-xs outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Bairro *</label>
                      <input
                        type="text"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="Bairro"
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-1.5 text-xs outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Cidade / UF *</label>
                      <input
                        type="text"
                        value={city ? `${city}${state ? ' - ' + state : ''}` : ''}
                        onChange={(e) => {
                          const parts = e.target.value.split('-');
                          setCity(parts[0]?.trim() || '');
                          if (parts[1]) setState(parts[1].trim());
                        }}
                        placeholder="São Paulo - SP"
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-1.5 text-xs outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep2}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Continuar para Passo 3 (Perfil Aluno)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: PREFERÊNCIAS E FINALIZAÇÃO */}
            {signupStep === 3 && (
              <div className="space-y-3.5 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Idioma de Estudo *</label>
                    <div className="relative">
                      <BookOpen className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <select
                        value={studyLanguage}
                        onChange={(e) => setStudyLanguage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-cyan-300 font-bold rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-cyan-400 outline-none cursor-pointer"
                      >
                        <option value="Inglês 🇬🇧🇺🇸">Inglês 🇬🇧🇺🇸</option>
                        <option value="Espanhol 🇪🇸">Espanhol 🇪🇸</option>
                        <option value="Francês 🇫🇷">Francês 🇫🇷</option>
                        <option value="Italiano 🇮🇹">Italiano 🇮🇹</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Seu Nível Atual *</label>
                    <div className="relative">
                      <Award className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <select
                        value={languageLevel}
                        onChange={(e) => setLanguageLevel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white font-bold rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-cyan-400 outline-none cursor-pointer"
                      >
                        <option value="Iniciante (A1)">Iniciante (A1)</option>
                        <option value="Básico (A2)">Básico (A2)</option>
                        <option value="Intermediário (B1)">Intermediário (B1)</option>
                        <option value="B2 - Intermediário Avançado">B2 - Intermediário Avançado</option>
                        <option value="Avançado (C1)">Avançado (C1)</option>
                        <option value="Fluente (C2)">Fluente (C2)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Motivo dos Estudos *</label>
                  <select
                    value={studyMotivation}
                    onChange={(e) => setStudyMotivation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-bold rounded-xl px-3 py-2.5 text-xs focus:border-cyan-400 outline-none cursor-pointer"
                  >
                    <option value="Carreira Profissional 📈">Carreira Profissional 📈</option>
                    <option value="Viagens ✈️">Viagens ✈️</option>
                    <option value="Negócios 💼">Negócios 💼</option>
                    <option value="Cultura e Entretenimento 🎬">Cultura e Entretenimento 🎬</option>
                    <option value="Estudos Acadêmicos 🎓">Estudos Acadêmicos 🎓</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                {/* Checkbox obrigatoria de Termos de Uso */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="termsBookingStudent"
                    required
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="termsBookingStudent" className="text-xs text-slate-300 leading-snug cursor-pointer select-none">
                    Li e concordo com os{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-cyan-400 font-bold underline hover:text-cyan-300"
                    >
                      Termos de Uso
                    </button>{' '}
                    e a{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-cyan-400 font-bold underline hover:text-cyan-300"
                    >
                      Política de Privacidade
                    </button>{' '}
                    da Lexy. *
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSignupStep(2)}
                    className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || !acceptedTerms}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span>{isLoading ? 'Criando conta...' : 'Criar Conta e Continuar Agendamento 🚀'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        <TermsPrivacyModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

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
    </div>,
    document.body
  );
}
