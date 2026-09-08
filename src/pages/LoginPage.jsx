import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { validateCPF, formatCPF } from '../lib/cpfValidator';
import { formatPhone, validatePhone } from '../lib/phoneValidator';
import { formatCEP, validateCEP, fetchAddressByCEP } from '../lib/cepValidator';
import { 
  Globe, Mail, Lock, User, UserCheck, GraduationCap, 
  ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, 
  Sparkles, Star, Gift, Zap, FileText, Phone, MapPin, Building, CreditCard as CpfIcon, ShieldCheck, DollarSign, BookOpen
} from 'lucide-react';

import TermsPrivacyModal from '../components/modals/TermsPrivacyModal';
import TechVeinsBackground from '../components/ui/TechVeinsBackground';

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

export default function LoginPage({ forceRole }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginUser, signInWithSupabase, signUpWithSupabase } = useAuth();
  const { registerStudentAccount, registerTutor } = useMarketplace();

  // Role estrictamente determinado por prop o ruta (SEPARADOS)
  const activeRole = forceRole || (searchParams.get('role') === 'teacher' ? 'teacher' : searchParams.get('role') === 'admin' ? 'admin' : 'student');
  const isTeacher = activeRole === 'teacher';
  const isAdmin = activeRole === 'admin';

  // Modo: true = Iniciar Sessão, false = Criar Conta
  const initialIsLogin = searchParams.get('mode') === 'signup' ? false : true;
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [signupStep, setSignupStep] = useState(1); // 1: Dados, 2: Endereço/CPF, 3: Perfil

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setIsLogin(false);
    } else if (searchParams.get('mode') === 'login') {
      setIsLogin(true);
    }
  }, [searchParams]);

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Campos comunes del formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState(isAdmin ? 'emaildeconexionamerica@gmail.com' : '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(isAdmin ? 'AlyRoberto2026*' : '');
  const [residenceCountry, setResidenceCountry] = useState('Brasil 🇧🇷');
  const [cpf, setCpf] = useState('');
  const [passport, setPassport] = useState('');

  // Endereço e Nota Fiscal (NFS-e / Asaas)
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [fetchingCep, setFetchingCep] = useState(false);
  
  // Campos de registro de Aluno
  const [studyLanguage, setStudyLanguage] = useState('');
  const [languageLevel, setLanguageLevel] = useState('');
  const [studyMotivation, setStudyMotivation] = useState('');

  // Campos de registro de Professor / Tutor
  const [teacherSubject, setTeacherSubject] = useState('Inglês 🇬🇧🇺🇸');
  const [teacherRate, setTeacherRate] = useState('50');
  const [teacherHeadline, setTeacherHeadline] = useState('');
  const [teacherBio, setTeacherBio] = useState('');

  // Foto de perfil
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  
  // Validaciones y Errores
  const [cpfError, setCpfError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ── VALIDAÇÃO DE PASSOS DO CADASTRO MULTI-STEP ──
  const handleNextStep1 = () => {
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor, informe um e-mail válido.');
      return;
    }
    if (!phone.trim() || !validatePhone(phone, isBrazil)) {
      setPhoneError('Por favor, informe um número de celular verdadeiro e válido com DDD.');
      setErrorMessage('Celular/WhatsApp verdadeiro é obrigatório para notificações de aulas e cobranças.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSignupStep(2);
  };

  const handleNextStep2 = () => {
    setErrorMessage('');
    if (isBrazil) {
      const cleanCPF = cpf.replace(/\D/g, '');
      if (!validateCPF(cleanCPF)) {
        setCpfError('Por favor, informe um CPF verdadeiro e válido.');
        setErrorMessage('CPF verdadeiro e válido é obrigatório para residentes no Brasil.');
        return;
      }
    } else {
      if (!passport.trim()) {
        setErrorMessage('Por favor, informe seu passaporte ou documento internacional.');
        return;
      }
    }
    setSignupStep(3);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const docNumber = isBrazil ? cpf : passport;

    // ── AUTENTICACIÓN SEGURA DE USUARIOS REGISTRADOS EN SUPABASE ──
    if (isLogin) {
      if (!cleanEmail.includes('@') || password.length < 4) {
        setErrorMessage('❌ E-mail ou senha incorretos. Verifique suas credenciais.');
        return;
      }

      setIsLoading(true);
      const res = await signInWithSupabase({ email: cleanEmail, password });
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || '❌ Credenciais inválidas. Verifique seu e-mail e senha.');
        return;
      }

      const userRole = res.user?.role || activeRole;
      if (userRole === 'teacher') {
        navigate('/dashboard/teacher');
      } else if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard/student');
      }
    } else {
      // ── CRIAR NOVA CONTA REAL REGISTRADA NA SUPABASE (PASSO 3 FINAL) ──
      if (!acceptedTerms) {
        setErrorMessage('Você precisa ler e concordar com os Termos de Uso e a Política de Privacidade para concluir o cadastro.');
        return;
      }

      if (isTeacher) {
        if (!teacherSubject) {
          setErrorMessage('Por favor, selecione o idioma que deseja ensinar.');
          return;
        }
        if (!teacherHeadline || !teacherHeadline.trim()) {
          setErrorMessage('Por favor, informe um título (headline) para o seu perfil.');
          return;
        }
        if (!teacherBio || !teacherBio.trim()) {
          setErrorMessage('Por favor, escreva uma breve biografia ou metodologia sobre suas aulas.');
          return;
        }
      } else {
        if (!studyLanguage) {
          setErrorMessage('Por favor, selecione o idioma que deseja estudar.');
          return;
        }
        if (!languageLevel) {
          setErrorMessage('Por favor, selecione seu nível no idioma.');
          return;
        }
        if (!studyMotivation) {
          setErrorMessage('Por favor, selecione o motivo dos seus estudos.');
          return;
        }
      }

      setIsLoading(true);
      const res = await signUpWithSupabase({
        name,
        email: cleanEmail,
        password,
        role: activeRole,
        phone,
        documentNumber: docNumber,
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
        study_motivation: studyMotivation,
        subject_taught: teacherSubject,
        hourlyRate: Number(teacherRate) || 50,
        headline: teacherHeadline,
        bio: teacherBio
      });

      setIsLoading(false);

      if (res.success) {
        setRegistrationSuccess(true);
        if (activeRole === 'teacher') {
          if (registerTutor) {
            registerTutor({
              full_name: name,
              email: cleanEmail,
              phone,
              headline: teacherHeadline.trim(),
              subject_taught: teacherSubject,
              hourly_rate: Number(teacherRate) || 50,
              bio: teacherBio.trim(),
              country: residenceCountry,
              avatar_url: profilePhotoPreview || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'
            });
          }
        } else {
          registerStudentAccount({
            name,
            email: cleanEmail,
            password,
            phone,
            residenceCountry,
            documentType: isBrazil ? 'cpf' : 'passport',
            documentNumber: docNumber,
            postalCode,
            address,
            addressNumber,
            province,
            city,
            state
          });
        }
        setTimeout(() => {
          if (activeRole === 'teacher') {
            navigate('/dashboard/teacher');
          } else {
            navigate('/dashboard/student');
          }
        }, 1000);
      } else {
        setErrorMessage(res.error || '❌ Erro ao criar conta na Supabase. Tente novamente.');
      }
    }
  };

  return (
    <TechVeinsBackground className="min-h-[85vh] flex items-center justify-center px-4 py-8 animate-fade-in-up">
      
      <div className="w-full max-w-5xl bg-slate-950/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-cyan-500/30 grid grid-cols-1 md:grid-cols-12 relative z-10">
        
        {/* LADO IZQUIERDO: BANNERS PROMO & NOVIDADES */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-4 sm:p-6 md:p-10 flex flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/25">
                <Globe className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg text-white block leading-tight">Lexy Idiomas</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest block -mt-0.5 ${activeRole === 'teacher' ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {activeRole === 'teacher' ? 'Portal Professor' : 'Portal Aluno'}
                </span>
              </div>
            </Link>

            <div className={`p-4 rounded-2xl bg-slate-900/80 border space-y-2 shadow-xl ${activeRole === 'teacher' ? 'border-amber-500/30' : 'border-cyan-500/30'}`}>
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${activeRole === 'teacher' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                <Sparkles className="w-3 h-3 text-amber-400" /> {activeRole === 'teacher' ? 'Área de Docência' : 'Nova Estrutura Lexy'}
              </div>
              <h3 className="font-black text-white text-sm sm:text-base leading-snug">
                {activeRole === 'teacher' 
                  ? 'Ensine Idiomas Online e Monetize seu Conhecimento!' 
                  : 'Aprenda Idiomas com Tutores Qualificados!'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed hidden sm:block">
                {activeRole === 'teacher'
                  ? 'Gerencie suas aulas, receba pagamentos com segurança e expanda seus alunos no Lexy Space.'
                  : 'Aulas particulares 1-on-1 com professores qualificados, sala virtual interativa e cobrança por carteira LexyPay.'}
              </p>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeRole === 'teacher'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-slate-950'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500 hover:text-slate-950'
                }`}
              >
                Falar com Suporte WhatsApp 💬
              </a>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-slate-800/80 text-center space-y-1 hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parcerias e Convênios</p>
            <div className="flex items-center justify-center gap-4 sm:gap-6 opacity-75 text-xs font-black text-slate-400 flex-wrap">
              <span className="tracking-wider text-cyan-400 font-extrabold">CA IDIOMAS</span>
              <span>You<span className="text-cyan-400">Huul</span></span>
              <span className="italic font-serif">New Value</span>
              <span className="uppercase tracking-wider">allya</span>
            </div>
          </div>
        </div>

        {/* LADO DERECHO: FORMULARIO MULTI-PASO DE LOGIN / REGISTRO */}
        <div className="md:col-span-7 p-4 sm:p-6 md:p-10 flex flex-col justify-center bg-slate-950/95 space-y-5">

          <div className="space-y-1.5">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase border ${
              isAdmin ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : isTeacher ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
            }`}>
              {isAdmin ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : isTeacher ? <GraduationCap className="w-4 h-4 text-amber-400" /> : <UserCheck className="w-4 h-4 text-cyan-400" />}
              <span>{isAdmin ? 'Painel de Administração 🛡️' : isTeacher ? 'Área do Tutor / Professor' : 'Portal do Aluno'}</span>
            </div>

            <h1 className="text-2xl font-extrabold text-white">
              {isLogin 
                ? (isAdmin ? 'Acessar como Administrador' : isTeacher ? 'Acessar Portal do Professor' : 'Acessar Portal do Aluno')
                : (isTeacher ? 'Criar Conta de Professor' : 'Criar Conta de Aluno')}
            </h1>
            <p className="text-xs text-slate-400">
              {isLogin 
                ? (isAdmin
                    ? '🛡️ Painel de Controle e Gestão Global da Lexy Idiomas.'
                    : isTeacher 
                      ? '👋 Bem-vindo de volta, Professor! Entre com seu e-mail e senha para acessar sua agenda.' 
                      : '👋 Bem-vindo de volta! Entre com seu e-mail e senha para acessar suas aulas.')
                : (isTeacher
                    ? `Passo ${signupStep} de 3 — Preencha seus dados para cadastrar-se como tutor.`
                    : `Passo ${signupStep} de 3 — Preencha seus dados para criar sua conta de aluno.`)}
            </p>
          </div>

          {/* Alternador Modo: Iniciar Sessão vs Criar Conta */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setErrorMessage(''); setSignupStep(1); }}
              className={`py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                isLogin 
                  ? (isTeacher ? 'bg-amber-500 text-slate-950 shadow' : 'bg-cyan-500 text-slate-950 shadow') 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sessão
            </button>

            <button
              type="button"
              onClick={() => { setIsLogin(false); setErrorMessage(''); setSignupStep(1); }}
              className={`py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                !isLogin 
                  ? (isTeacher ? 'bg-amber-500 text-slate-950 shadow' : 'bg-cyan-500 text-slate-950 shadow') 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* INDICADOR DE PASSO (STEPPER 3 PASOS - SÓLO MOSTRADO EN REGISTRO) */}
          {!isLogin && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                <span className={signupStep === 1 ? (isTeacher ? 'text-amber-400 font-extrabold' : 'text-cyan-400 font-extrabold') : ''}>
                  1. Dados Pessoais
                </span>
                <span className={signupStep === 2 ? (isTeacher ? 'text-amber-400 font-extrabold' : 'text-cyan-400 font-extrabold') : ''}>
                  2. Endereço & CPF
                </span>
                <span className={signupStep === 3 ? (isTeacher ? 'text-amber-400 font-extrabold' : 'text-cyan-400 font-extrabold') : ''}>
                  3. {isTeacher ? 'Perfil Tutor' : 'Perfil Aluno'}
                </span>
              </div>
              
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800 flex gap-1">
                <div className={`h-full rounded-full transition-all duration-300 flex-1 ${signupStep >= 1 ? (isTeacher ? 'bg-amber-500' : 'bg-cyan-500') : 'bg-slate-850'}`} />
                <div className={`h-full rounded-full transition-all duration-300 flex-1 ${signupStep >= 2 ? (isTeacher ? 'bg-amber-500' : 'bg-cyan-500') : 'bg-slate-850'}`} />
                <div className={`h-full rounded-full transition-all duration-300 flex-1 ${signupStep >= 3 ? (isTeacher ? 'bg-amber-500' : 'bg-cyan-500') : 'bg-slate-850'}`} />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {registrationSuccess ? (
            <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-bold p-5 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-extrabold text-white">
                {isTeacher ? '¡Conta de Professor Criada com Sucesso!' : '¡Conta de Aluno Criada com Sucesso!'}
              </p>
              <p className="text-xs text-slate-300">Entrando no seu painel...</p>
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* ── MODO INICIAR SESSÃO ── */}
              {isLogin && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">E-mail *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@lexy.com"
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-400 block">Senha *</label>
                      <button type="button" className="text-[10px] text-cyan-400 font-bold hover:underline">
                        Esqueci a minha senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full font-black text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer ${
                      isAdmin
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 shadow-emerald-500/20'
                        : isTeacher
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 shadow-amber-500/20'
                          : 'bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 shadow-cyan-500/20'
                    }`}
                  >
                    <span>
                      {isLoading 
                        ? 'Entrando no Portal...' 
                        : (isAdmin ? 'Entrar como Administrador 🛡️' : isTeacher ? 'Entrar no Portal do Professor 🚀' : 'Entrar no Portal do Aluno 🚀')}
                    </span>
                  </button>
                </>
              )}

              {/* ── MODO CRIAR CONTA (PASSO 1 DE 3: DADOS PESSOAIS) ── */}
              {!isLogin && signupStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Nome Completo *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: João Carlos Silva"
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">E-mail *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@lexy.com"
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-cyan-400" /> Celular / WhatsApp (com DDD) *
                      </span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder={isBrazil ? '(11) 99999-8888' : '+1 (555) 000-0000'}
                        className={`w-full bg-slate-900 border text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono font-medium outline-none focus:border-cyan-400 ${
                          phoneError ? 'border-rose-500 text-rose-300' : 'border-slate-800'
                        }`}
                      />
                    </div>
                    {phoneError ? (
                      <p className="text-[10px] font-bold text-rose-400 mt-1">{phoneError}</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-0.5">Obrigatório para confirmação de aulas e cobranças.</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Senha (Mínimo 6 caracteres) *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep1}
                    className={`w-full font-black text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isTeacher
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                    }`}
                  >
                    <span>Continuar para Passo 2 (Endereço & CPF)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ── MODO CRIAR CONTA (PASSO 2 DE 3: DOCUMENTOS E ENDEREÇO) ── */}
              {!isLogin && signupStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">País de Residência *</label>
                    <select
                      value={residenceCountry}
                      onChange={(e) => {
                        setResidenceCountry(e.target.value);
                        setCpfError('');
                        setPhoneError('');
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none cursor-pointer focus:border-cyan-400"
                    >
                      {RESIDENCE_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {isBrazil ? (
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1">
                          <CpfIcon className="w-3.5 h-3.5 text-cyan-400" /> CPF (Residente no Brasil) *
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={14}
                        value={cpf}
                        onChange={handleCpfChange}
                        placeholder="000.000.000-00"
                        className={`w-full bg-slate-900 border text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none focus:border-cyan-400 ${
                          cpfError ? 'border-rose-500 text-rose-300' : 'border-slate-800'
                        }`}
                      />
                      {cpfError && <p className="text-[10px] font-bold text-rose-400 mt-1">{cpfError}</p>}
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                        <FileText className="w-3.5 h-3.5 text-amber-400" /> Passaporte / Documento Internacional *
                      </label>
                      <input
                        type="text"
                        required
                        value={passport}
                        onChange={(e) => setPassport(e.target.value)}
                        placeholder="Número do Passaporte ou Documento de Identidade"
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}

                  {/* CAMPOS DE ENDEREÇO COMPLETO PARA NOTA FISCAL (NFS-E) E COBRANÇAS ASAAS */}
                  <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-cyan-400" /> Endereço de Faturamento & Emissão de Nota Fiscal (NFS-e) *
                      </span>
                      {fetchingCep && <span className="text-[10px] text-amber-400 font-bold animate-pulse">Buscando CEP...</span>}
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-slate-300 block mb-1">CEP *</label>
                        <input
                          type="text"
                          maxLength={9}
                          value={postalCode}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-2 text-xs font-mono font-bold outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-300 block mb-1">Logradouro / Rua *</label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Rua / Avenida / Alameda"
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-2 text-xs outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-300 block mb-1">Número *</label>
                        <input
                          type="text"
                          value={addressNumber}
                          onChange={(e) => setAddressNumber(e.target.value)}
                          placeholder="123"
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-2 text-xs outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-300 block mb-1">Bairro *</label>
                        <input
                          type="text"
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          placeholder="Bairro"
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-2 text-xs outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-300 block mb-1">Cidade / UF *</label>
                        <input
                          type="text"
                          value={city ? `${city}${state ? ' - ' + state : ''}` : ''}
                          onChange={(e) => {
                            const parts = e.target.value.split('-');
                            setCity(parts[0]?.trim() || '');
                            if (parts[1]) setState(parts[1].trim());
                          }}
                          placeholder="São Paulo - SP"
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-2 text-xs outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="px-4 py-3.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep2}
                      className={`flex-1 font-black text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isTeacher
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                      }`}
                    >
                      <span>Continuar para Passo 3 ({isTeacher ? 'Perfil Tutor' : 'Perfil Aluno'})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── MODO CRIAR CONTA (PASSO 3 DE 3: PERFIL E CONFIRMAÇÃO) ── */}
              {!isLogin && signupStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  {/* CAMPOS ESPECÍFICOS DE PROFESSOR (TUTOR) */}
                  {isTeacher && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                      <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 border-b border-amber-500/20 pb-2">
                        <GraduationCap className="w-4 h-4 text-amber-400" /> Perfil Profissional do Tutor *
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">Idioma que Ensina *</label>
                          <select
                            required
                            value={teacherSubject}
                            onChange={(e) => setTeacherSubject(e.target.value)}
                            className="w-full bg-slate-900 border border-amber-500/40 text-white rounded-xl px-3 py-2.5 text-xs font-bold outline-none cursor-pointer focus:border-amber-400"
                          >
                            <option value="Inglês 🇬🇧🇺🇸">Inglês 🇬🇧🇺🇸</option>
                            <option value="Espanhol 🇪🇸">Espanhol 🇪🇸</option>
                            <option value="Francês 🇫🇷">Francês 🇫🇷</option>
                            <option value="Italiano 🇮🇹">Italiano 🇮🇹</option>
                            <option value="Alemão 🇩🇪">Alemão 🇩🇪</option>
                            <option value="Mandarim 🇨🇳">Mandarim 🇨🇳</option>
                            <option value="Outro">Outro</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">Tarifa p/ Hora (R$) *</label>
                          <div className="relative">
                            <DollarSign className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="number"
                              required
                              min="10"
                              max="500"
                              value={teacherRate}
                              onChange={(e) => setTeacherRate(e.target.value)}
                              placeholder="50"
                              className="w-full bg-slate-900 border border-amber-500/40 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">Título Profissional (Headline)</label>
                        <input
                          type="text"
                          value={teacherHeadline}
                          onChange={(e) => setTeacherHeadline(e.target.value)}
                          placeholder="Ex: Professor Nativo com 5 anos de experiência em Conversação"
                          className="w-full bg-slate-900 border border-amber-500/40 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">Biografia / Apresentação</label>
                        <textarea
                          rows={3}
                          value={teacherBio}
                          onChange={(e) => setTeacherBio(e.target.value)}
                          placeholder="Descreva brevemente sua experiência, metodologia de ensino e diferenciais..."
                          className="w-full bg-slate-900 border border-amber-500/40 text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* CAMPOS ESPECÍFICOS DE ALUNO */}
                  {!isTeacher && activeRole === 'student' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Qual idioma deseja estudar? *</label>
                        <select
                          required
                          value={studyLanguage}
                          onChange={(e) => setStudyLanguage(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none cursor-pointer focus:border-cyan-400"
                        >
                          <option value="">Selecione o idioma...</option>
                          <option value="Inglês 🇬🇧🇺🇸">Inglês 🇬🇧🇺🇸</option>
                          <option value="Espanhol 🇪🇸">Espanhol 🇪🇸</option>
                          <option value="Francês 🇫🇷">Francês 🇫🇷</option>
                          <option value="Italiano 🇮🇹">Italiano 🇮🇹</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Qual seu nível atual no idioma? *</label>
                        <select
                          required
                          value={languageLevel}
                          onChange={(e) => setLanguageLevel(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none cursor-pointer focus:border-cyan-400"
                        >
                          <option value="">Selecione seu nível...</option>
                          <option value="Iniciante (A1)">Iniciante (A1)</option>
                          <option value="Básico (A2)">Básico (A2)</option>
                          <option value="Intermediário (B1)">Intermediário (B1)</option>
                          <option value="Intermediário Avançado (B2)">Intermediário Avançado (B2)</option>
                          <option value="Avançado (C1)">Avançado (C1)</option>
                          <option value="Fluente (C2)">Fluente (C2)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Qual o motivo dos seus estudos? *</label>
                        <select
                          required
                          value={studyMotivation}
                          onChange={(e) => setStudyMotivation(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none cursor-pointer focus:border-cyan-400"
                        >
                          <option value="">Selecione o motivo...</option>
                          <option value="Viagens ✈️">Viagens ✈️</option>
                          <option value="Negócios 💼">Negócios 💼</option>
                          <option value="Carreira Profissional 📈">Carreira Profissional 📈</option>
                          <option value="Cultura e Entretenimento 🎬">Cultura e Entretenimento 🎬</option>
                          <option value="Estudos Acadêmicos 🎓">Estudos Acadêmicos 🎓</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Foto de Perfil (opcional)</label>
                    <div className="flex items-center gap-3">
                      {profilePhotoPreview && (
                        <img src={profilePhotoPreview} alt="Preview" className="w-10 h-10 rounded-xl object-cover border border-cyan-500/50" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-2">
                    <input
                      type="checkbox"
                      id="termsLoginPage"
                      required
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer shrink-0"
                    />
                    <label htmlFor="termsLoginPage" className="text-xs text-slate-300 leading-snug cursor-pointer select-none">
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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSignupStep(2)}
                      className="px-4 py-3.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || !acceptedTerms}
                      className={`flex-1 font-black text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer ${
                        isAdmin
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 shadow-emerald-500/20'
                          : isTeacher
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 shadow-amber-500/20'
                            : 'bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 shadow-cyan-500/20'
                      }`}
                    >
                      <span>
                        {isLoading 
                          ? 'Entrando no Portal...' 
                          : (isTeacher ? 'Cadastrar e Entrar como Professor 🚀' : 'Cadastrar e Entrar no Portal 🚀')}
                      </span>
                    </button>
                  </div>
                </div>
              )}

            </form>
          )}

          <TermsPrivacyModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

          <div className="pt-6 border-t border-slate-800/80 text-center space-y-3">
            {isTeacher ? (
              <p className="text-xs text-slate-400">
                Você é aluno?{' '}
                <button 
                  type="button" 
                  onClick={() => { navigate('/login/student' + (!isLogin ? '?mode=signup' : '')); setSignupStep(1); }}
                  className="text-cyan-400 font-bold hover:underline cursor-pointer"
                >
                  Acesse o Portal do Aluno 👤
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Você é professor?{' '}
                <button 
                  type="button" 
                  onClick={() => { navigate('/login/teacher' + (!isLogin ? '?mode=signup' : '')); setSignupStep(1); }}
                  className="text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Acesse o Portal do Professor 🎓
                </button>
              </p>
            )}
            <p className="text-xs text-slate-400 font-medium">Tem problemas ao iniciar sessão na sua conta?</p>
            <a 
              href="https://wa.me/5511999999999" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform"
            >
              💬 Comunique-se com nosso Suporte 24/7
            </a>
          </div>

        </div>

      </div>

    </TechVeinsBackground>
  );
}
