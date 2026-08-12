import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { validateCPF, formatCPF } from '../lib/cpfValidator';
import { 
  Globe, Mail, Lock, User, UserCheck, GraduationCap, 
  ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, 
  Sparkles, Star, Gift, Zap, FileText, CreditCard as CpfIcon 
} from 'lucide-react';

const RESIDENCE_COUNTRIES = [
  'Brasil 🇧🇷',
  'Estados Unidos 🇺🇸',
  'Espanha 🇪🇸',
  'México 🇲🇽',
  'Colômbia CO',
  'Argentina 🇦🇷',
  'Portugal 🇵🇹',
  'Outro País 🌐'
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginUser, signInWithSupabase, signUpWithSupabase } = useAuth();
  const { registerStudentAccount, tutors } = useMarketplace();

  // Rol por defecto o seleccionado en la URL
  const targetRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';

  const [isLogin, setIsLogin] = useState(true); // true: Iniciar Sessão, false: Criar Conta
  const [showPassword, setShowPassword] = useState(false);
  
  // Campos del formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [residenceCountry, setResidenceCountry] = useState('Brasil 🇧🇷');
  const [cpf, setCpf] = useState('');
  const [passport, setPassport] = useState('');
  
  // Novos campos de registro
  const [studyLanguage, setStudyLanguage] = useState('');
  const [languageLevel, setLanguageLevel] = useState('');
  const [studyMotivation, setStudyMotivation] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  
  // Validaciones y Errores
  const [cpfError, setCpfError] = useState('');
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const docNumber = isBrazil ? cpf : passport;

    // ── AUTENTICACIÓN SEGURA DE USUARIOS REGISTRADOS EN SUPABASE ──
    if (isLogin) {
      if (!cleanEmail.includes('@') || password.length < 4) {
        setIsLoading(false);
        setErrorMessage('❌ E-mail ou senha incorretos. Verifique suas credenciais.');
        return;
      }

      const res = await signInWithSupabase({ email: cleanEmail, password });
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || '❌ Credenciais inválidas. Verifique seu e-mail e senha.');
        return;
      }

      const userRole = res.user?.role || targetRole;
      if (userRole === 'teacher') {
        navigate('/dashboard/teacher');
      } else if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard/student');
      }
    } else {
      // ── CRIAR NOVA CONTA REAL REGISTRADA NA SUPABASE ──
      if (!name.trim()) {
        setIsLoading(false);
        setErrorMessage('Por favor, informe seu nome completo.');
        return;
      }

      if (targetRole === 'student') {
        if (isBrazil) {
          const cleanCPF = cpf.replace(/\D/g, '');
          if (!validateCPF(cleanCPF)) {
            setIsLoading(false);
            setCpfError('Por favor, informe um CPF verdadeiro e válido.');
            setErrorMessage('CPF verdadeiro e válido é obrigatório para residentes no Brasil.');
            return;
          }
        } else {
          if (!passport.trim()) {
            setIsLoading(false);
            setErrorMessage('Por favor, informe seu passaporte ou documento internacional.');
            return;
          }
        }
      }

      const res = await signUpWithSupabase({
        name,
        email: cleanEmail,
        password,
        role: targetRole,
        documentNumber: docNumber,
        residenceCountry,
        study_language: studyLanguage,
        language_level: languageLevel,
        study_motivation: studyMotivation
      });

      setIsLoading(false);

      if (res.success) {
        setRegistrationSuccess(true);
        if (targetRole === 'student') {
          registerStudentAccount({
            name,
            email: cleanEmail,
            password,
            residenceCountry,
            documentType: isBrazil ? 'cpf' : 'passport',
            documentNumber: docNumber
          });
        }
        setTimeout(() => {
          // Após criação de conta, redirecionar direto ao painel do aluno/tutor
          if (targetRole === 'teacher') {
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 animate-fade-in-up">
      
      {/* CARD PRINCIPAL RÉPLICA DE ALUNO.CONEXIONAMERICA.COM.BR */}
      <div className="w-full max-w-5xl bg-slate-950/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-cyan-500/30 grid grid-cols-1 md:grid-cols-12 relative z-10">
        
        {/* LADO IZQUIERDO: BANNERS PROMO & NOVIDADES (CONEXIÓN AMÉRICA IDIOMAS) */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 border-r border-slate-800 p-6 md:p-10 flex flex-col justify-between relative overflow-hidden text-white min-h-[400px]">
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
          
          {/* Logo Branding */}
          <div className="relative z-10 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/25">
                <Globe className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-white block leading-tight">Lexy Idiomas</span>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block -mt-0.5">Portal Aluno</span>
              </div>
            </Link>

            {/* Banner Oportunidades & Novidades */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-3 shadow-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Nova Estrutura Lexy
              </div>
              <h3 className="font-black text-white text-base leading-snug">Aprenda Inglês e Espanhol com Tutores Nativos!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aulas particulares 1-on-1 com professores qualificados, sala virtual interativa e cobrança por billetera.
              </p>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500 hover:text-slate-950 transition-all"
              >
                Falar com Suporte WhatsApp 💬
              </a>
            </div>
          </div>

          {/* Convenios & Parcerias Row */}
          <div className="relative z-10 pt-6 border-t border-slate-800/80 text-center space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parcerias e Convênios</p>
            <div className="flex items-center justify-center gap-6 opacity-75 text-xs font-black text-slate-400">
              <span>You<span className="text-cyan-400">Huul</span></span>
              <span className="italic font-serif">New Value</span>
              <span className="uppercase tracking-wider">allya</span>
            </div>
          </div>
        </div>

        {/* LADO DERECHO: FORMULARIO DE LOGIN / REGISTRO RÉPLICA */}
        <div className="md:col-span-7 p-6 md:p-10 flex flex-col justify-center bg-slate-950/95 space-y-6">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase">
              {targetRole === 'teacher' ? <GraduationCap className="w-4 h-4 text-amber-400" /> : <UserCheck className="w-4 h-4 text-cyan-400" />}
              <span>{targetRole === 'teacher' ? 'Área do Tutor / Professor' : 'Portal do Aluno'}</span>
            </div>

            <h1 className="text-2xl font-extrabold text-white">
              {isLogin ? 'Acessar Portal do Aluno' : 'Criar Conta de Aluno'}
            </h1>
            <p className="text-xs text-slate-400">
              {isLogin 
                ? ' 👋 Bem-vindo de volta! Entre com seu e-mail e senha para acessar suas aulas.' 
                : 'Preencha seus dados para criar sua conta de aluno.'}
            </p>
          </div>

          {/* Selector Tabs: Iniciar Sessão vs Criar Conta */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setErrorMessage(''); }}
              className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                isLogin ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sessão
            </button>

            <button
              type="button"
              onClick={() => { setIsLogin(false); setErrorMessage(''); }}
              className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                !isLogin ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Notification */}
          {registrationSuccess ? (
            <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-bold p-5 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-extrabold text-white">¡Conta de Aluno Criada com Sucesso!</p>
              <p className="text-xs text-slate-300">Entrando no seu painel de aulas...</p>
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Nome Completo (solo al Criar Conta) */}
              {!isLogin && (
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
              )}

              {/* Email */}
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

              {/* Password */}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Campos adicionales de País y CPF / Documento Internacional al Criar Conta */}
              {!isLogin && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">País de Residência *</label>
                    <select
                      value={residenceCountry}
                      onChange={(e) => {
                        setResidenceCountry(e.target.value);
                        setCpfError('');
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
                  {targetRole === 'student' && (
                    <>
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
                    </>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <span>{isLoading ? 'Entrando no Portal...' : isLogin ? 'Entrar no Portal 🚀' : 'Cadastrar e Entrar no Portal 🚀'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          )}

          {/* Student Support Section */}
          <div className="pt-6 border-t border-slate-800/80 text-center space-y-3">
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

    </div>
  );
}
