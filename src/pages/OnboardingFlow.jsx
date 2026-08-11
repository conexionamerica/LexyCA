import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Mail, Phone, Globe, Clock, DollarSign, Award, 
  Video, FileText, CheckCircle2, ArrowRight, ArrowLeft, 
  Sparkles, ShieldCheck, AlertCircle, GraduationCap, Lock, Eye, EyeOff 
} from 'lucide-react';

const COUNTRIES = [
  'Espanha', 'Estados Unidos', 'México', 'Colômbia', 'Reino Unido', 
  'Canadá', 'Argentina', 'Chile', 'Peru', 'Brasil'
];

const TIMEZONES = [
  'America/Sao_Paulo (GMT-3)',
  'America/Mexico_City (GMT-6)',
  'America/Bogota (GMT-5)',
  'America/New_York (GMT-5)',
  'Europe/Madrid (GMT+1)',
  'Europe/London (GMT+0)'
];

const SPECIALTIES_OPTIONS = [
  'Conversação',
  'Espanhol para Negócios',
  'Business English',
  'Preparação DELE/SIELE',
  'TOEFL / IELTS',
  'Iniciantes',
  'Crianças',
  'Inglês Geral'
];

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registerTutor } = useMarketplace();
  const { loginUser } = useAuth();

  // Tab activo: 'register' (Cadastro) o 'login' (Iniciar Sessão)
  const initialMode = searchParams.get('mode') === 'login' ? 'login' : 'register';
  const [activeTab, setActiveTab] = useState(initialMode); // 'login' | 'register'

  // Estados de Login do Tutor
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Estados de Cadastro do Tutor
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdTutorId, setCreatedTutorId] = useState(null);

  // Form Data State de Cadastro
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    country: 'Espanha',
    timezone: 'America/Sao_Paulo (GMT-3)',
    subject_taught: 'Espanhol',
    native_language: 'Espanhol',
    other_languages: 'Português (Avançado), Inglês (B2)',
    specialties: ['Conversação'],
    experience_years: 5,
    certifications: 'Licenciatura em Letras / Certificado TEFL',
    hourly_rate: 20,
    headline: 'Professor(a) Nativo(a) com Foco em Conversação Fluida e Prática',
    bio: `¡Hola! Meu nome é professor(a) apaixonado(a) por ensinar idiomas. Utilizo uma metodologia 100% prática e personalizada focada na comunicação oral desde a primeira aula. Já ajudei dezenas de alunos a alcançarem a fluência.`,
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMessage('');
  };

  const toggleSpecialty = (sp) => {
    setFormData(prev => {
      const exists = prev.specialties.includes(sp);
      const updated = exists 
        ? prev.specialties.filter(item => item !== sp)
        : [...prev.specialties, sp];
      return { ...prev, specialties: updated };
    });
  };

  // Manejo de Iniciar Sesión como Tutor Existente
  const handleTutorLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.includes('@') || loginPassword.length < 4) {
      setLoginError('❌ E-mail ou senha incorretos. Verifique suas credenciais de tutor.');
      return;
    }

    loginUser({
      name: loginEmail.includes('maria') ? 'María Fernández (Tutor)' : 'Prof. Tutor Cadastrado',
      email: loginEmail,
      role: 'teacher',
      hourlyRate: 28
    });

    navigate('/dashboard/teacher');
  };

  // Validaciones de Cadastro
  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.full_name.trim()) return 'Por favor, informe seu nome completo.';
      if (!formData.email.trim() || !formData.email.includes('@')) return 'Por favor, informe um e-mail válido.';
      if (!formData.phone.trim()) return 'Por favor, informe seu telefone/WhatsApp.';
    }
    if (step === 2) {
      if (!formData.subject_taught) return 'Selecione o idioma que deseja ensinar.';
      if (!formData.native_language) return 'Selecione seu idioma nativo.';
      if (formData.specialties.length === 0) return 'Selecione pelo menos 1 especialidade de ensino.';
    }
    if (step === 3) {
      if (!formData.experience_years || formData.experience_years < 1) return 'Informe seus anos de experiência.';
      if (!formData.hourly_rate || formData.hourly_rate < 13 || formData.hourly_rate > 40) {
        return 'A tarifa por hora deve estar entre R$ 13,00 e R$ 40,00 por hora (Tarifa recomendada: R$ 23,00/h).';
      }
    }
    if (step === 4) {
      if (!formData.headline.trim()) return 'Informe o título do seu perfil público.';
      if (!formData.bio.trim() || formData.bio.length < 40) return 'A biografia deve ter pelo menos 40 caracteres.';
      if (!formData.video_url.trim()) return 'Informe o link do seu vídeo de apresentação.';
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      setErrorMessage(error);
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setErrorMessage('');
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmitRegistration = (e) => {
    e.preventDefault();
    const error = validateStep(4);
    if (error) {
      setErrorMessage(error);
      return;
    }

    const newTutor = registerTutor(formData);
    setCreatedTutorId(newTutor.id);

    loginUser({
      name: formData.full_name,
      email: formData.email,
      role: 'teacher',
      hourlyRate: formData.hourly_rate
    });

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in-up">
        <div className="glass-panel rounded-3xl p-8 sm:p-10 text-center space-y-6 border border-amber-500/40 glow-gold">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white">¡Cadastro Enviado com Sucesso!</h1>
            <p className="text-sm text-slate-300">
              Obrigado, <strong className="text-amber-300">{formData.full_name}</strong>! Seu perfil profissional foi criado com sucesso.
            </p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 text-left space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <ShieldCheck className="w-4 h-4" />
              <span>Status Atual do Perfil: Em Análise pela Coordenação</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Enquanto nossa equipe de verificação analisa seus dados e vídeo, você já pode acessar seu Painel de Tutor e definir sua agenda semanal de horários disponíveis.
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => navigate('/dashboard/teacher')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-sm px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2"
            >
              <span>Acessar Painel do Tutor Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6 animate-fade-in-up">
      
      {/* Selector de Pestañas: Iniciar Sessão vs Criar Conta de Tutor */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-amber-500/30 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span>Área Exclusiva para Professores e Tutores</span>
        </div>

        <h1 className="text-3xl font-extrabold text-white">
          {activeTab === 'login' ? 'Iniciar Sessão como Tutor' : 'Torne-se um Tutor na Plataforma'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          {activeTab === 'login' 
            ? 'Acesse seu painel profissional para gerenciar sua agenda, atender alunos e consultar seus ganhos.'
            : 'Preencha todos os dados obrigatórios para criar seu perfil profissional e ministrar aulas de Inglês ou Espanhol.'}
        </p>

        {/* Tabs switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`py-3 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'login' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Já tenho conta (Iniciar Sessão)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`py-3 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'register' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Quero me Cadastrar (Novo Tutor)
          </button>
        </div>
      </div>

      {/* ── OPCIÓN A: INICIAR SESIÓN COMO TUTOR EXISTENTE ── */}
      {activeTab === 'login' ? (
        <div className="glass-panel rounded-3xl p-6 sm:p-10 space-y-6 border border-amber-500/30 max-w-md mx-auto">
          <h2 className="text-lg font-extrabold text-white text-center">Acessar Painel do Tutor</h2>

          {loginError && (
            <div className="bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleTutorLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">E-mail Profissional *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="maria.tutor@preply.com"
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Senha *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium outline-none focus:border-amber-400"
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

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Entrar no Painel de Tutor 🚀</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className="text-xs text-amber-400 font-bold hover:underline"
            >
              Ainda não tem conta? Clique aqui para criar seu perfil de tutor ➔
            </button>
          </div>
        </div>
      ) : (
        /* ── OPCIÓN B: FORMULARIO OFICIAL DE CADASTRO DE TUTORES (4 PASOS) ── */
        <div className="glass-panel rounded-3xl p-6 sm:p-10 space-y-8 border border-amber-500/30">
          
          {/* Timeline de 4 Pasos */}
          <div className="grid grid-cols-4 gap-2 border-b border-slate-800 pb-6">
            {[
              { num: 1, label: 'Dados Pessoais' },
              { num: 2, label: 'Idiomas' },
              { num: 3, label: 'Tarifa & Exp.' },
              { num: 4, label: 'Perfil & Vídeo' }
            ].map((step) => (
              <div
                key={step.num}
                className={`flex flex-col items-center gap-1 transition-all ${
                  currentStep === step.num
                    ? 'text-amber-400 font-bold'
                    : currentStep > step.num
                    ? 'text-emerald-400 font-semibold'
                    : 'text-slate-500 font-medium'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center border transition-all ${
                    currentStep === step.num
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : currentStep > step.num
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {currentStep > step.num ? '✓' : step.num}
                </div>
                <span className="text-[10px] hidden sm:inline text-center">{step.label}</span>
              </div>
            ))}
          </div>

          {/* Alerta de Error */}
          {errorMessage && (
            <div className="bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Content por Paso */}
          <form onSubmit={handleSubmitRegistration} className="space-y-6">
            
            {/* PASO 1: INFORMACIONES PERSONALES */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fade-in-up">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-400" />
                  1. Informações Pessoais & Contato
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => updateField('full_name', e.target.value)}
                      placeholder="Ex: María Fernández Silva"
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">E-mail Profissional *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+55 (11) 99999-8888"
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">País de Origem *</label>
                    <select
                      value={formData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none cursor-pointer focus:border-amber-400"
                    >
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Fuso Horário (Timezone) *</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => updateField('timezone', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none cursor-pointer focus:border-amber-400"
                  >
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* PASO 2: IDIOMAS Y ESPECIALIDADES */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fade-in-up">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-amber-400" />
                  2. Ensino de Idiomas & Especialidades
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Idioma Principal que Vai Ensinar *</label>
                    <select
                      value={formData.subject_taught}
                      onChange={(e) => updateField('subject_taught', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white font-bold text-xs rounded-xl px-3.5 py-2.5 outline-none cursor-pointer focus:border-amber-400"
                    >
                      <option value="Espanhol">Espanhol 🇪🇸</option>
                      <option value="Inglês">Inglês 🇬🇧 🇺🇸</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Seu Idioma Nativo *</label>
                    <select
                      value={formData.native_language}
                      onChange={(e) => updateField('native_language', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white font-bold text-xs rounded-xl px-3.5 py-2.5 outline-none cursor-pointer focus:border-amber-400"
                    >
                      <option value="Espanhol">Espanhol</option>
                      <option value="Inglês">Inglês</option>
                      <option value="Português">Português</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">Sua Especialidade de Ensino (Selecione pelo menos 1) *</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES_OPTIONS.map(sp => {
                      const isSelected = formData.specialties.includes(sp);
                      return (
                        <button
                          type="button"
                          key={sp}
                          onClick={() => toggleSpecialty(sp)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {sp} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: TARIFA Y EXPERIENCIA */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in-up">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  3. Tarifa por Hora & Experiência
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Anos de Experiência como Tutor *</label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      required
                      value={formData.experience_years}
                      onChange={(e) => updateField('experience_years', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-amber-400 font-bold"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-400 block">Sua Tarifa por Hora (R$ BRL) *</label>
                      <span className="text-[10px] text-amber-300 font-mono font-bold">R$ 13,00 a R$ 40,00</span>
                    </div>
                    <div className="relative">
                      <span className="text-slate-400 font-bold text-xs absolute left-3 top-1/2 -translate-y-1/2">R$</span>
                      <input
                        type="number"
                        min={13}
                        max={40}
                        required
                        value={formData.hourly_rate}
                        onChange={(e) => updateField('hourly_rate', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-emerald-400 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-black outline-none focus:border-amber-400"
                      />
                    </div>
                    <div className="mt-2 bg-amber-500/15 border border-amber-500/30 p-2 rounded-xl text-[11px] flex items-center justify-between">
                      <span className="text-amber-200">💡 <strong>Recomendada:</strong> R$ 23,00/h</span>
                      <button
                        type="button"
                        onClick={() => updateField('hourly_rate', 23)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-lg shadow"
                      >
                        Aplicar R$ 23
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Certificações e Diplomas *</label>
                  <input
                    type="text"
                    required
                    value={formData.certifications}
                    onChange={(e) => updateField('certifications', e.target.value)}
                    placeholder="Ex: Licenciatura em Letras, TEFL, ELE, CELTA"
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}

            {/* PASO 4: PERFIL Y VÍDEO */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fade-in-up">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-amber-400" />
                  4. Perfil Público & Vídeo de Apresentação
                </h3>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Título do Seu Perfil Público *</label>
                  <input
                    type="text"
                    required
                    value={formData.headline}
                    onChange={(e) => updateField('headline', e.target.value)}
                    placeholder="Ex: Professor(a) Nativo(a) com Foco em Conversação Prática"
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Sua Biografia Completa (Mínimo 40 caracteres) *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    placeholder="Descreva sua experiência, metodologia de ensino e como ajuda os alunos a conquistarem a fluência..."
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Link do Vídeo de Apresentação (YouTube / Vimeo / Drive) *</label>
                  <input
                    type="url"
                    required
                    value={formData.video_url}
                    onChange={(e) => updateField('video_url', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Navegación entre pasos */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Passo Anterior
                </button>
              ) : <div />}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <span>Próximo Passo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                >
                  <span>Finalizar Cadastro de Tutor 🚀</span>
                </button>
              )}
            </div>

          </form>

        </div>
      )}

    </div>
  );
}
