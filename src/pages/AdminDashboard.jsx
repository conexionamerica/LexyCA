import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  ShieldCheck, Users, DollarSign, CheckCircle2, Clock, 
  Award, Sparkles, Lock, Mail, Eye, EyeOff, AlertCircle, Wallet, ArrowRight, Check, 
  Megaphone, Trash2, Settings, Save, AlertTriangle, Calendar, Percent, Search, User, Video
} from 'lucide-react';
import { getStoneConfig, saveStoneConfig } from '../lib/stonePaymentService';

export default function AdminDashboard() {
  const { 
    tutors, approveTutor, rejectTutor, 
    tierRates, updateTierRates,
    packageDiscounts, updatePackageDiscounts,
    announcements, addAnnouncement, deleteAnnouncement,
    bookings, autoPurge30DaysHistory
  } = useMarketplace();
  
  const { profile, loginAdmin, signInWithSupabase } = useAuth();

  // Estados del Formulario de Login de Admin
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // TABS State
  const [activeTab, setActiveTab] = useState('panel');

  // Config States
  const [editableTierRates, setEditableTierRates] = useState(tierRates);
  const [isFeeSaved, setIsFeeSaved] = useState(false);

  const [selectedDiscountTarget, setSelectedDiscountTarget] = useState('all');
  const [editablePackageDiscounts, setEditablePackageDiscounts] = useState(() => {
    return packageDiscounts?.global || (packageDiscounts?.['pkg-4h'] !== undefined ? packageDiscounts : { 'pkg-4h': 0, 'pkg-8h': 0, 'pkg-12h': 0, 'pkg-16h': 0 });
  });
  const [isDiscountSaved, setIsDiscountSaved] = useState(false);
  
  const [recommendedRate, setRecommendedRate] = useState(localStorage.getItem('lexy_recommended_rate') || 12);
  const [isRateSaved, setIsRateSaved] = useState(false);

  const [stoneForm, setStoneForm] = useState(() => getStoneConfig());
  const [isStoneSaved, setIsStoneSaved] = useState(false);

  const handleSaveStoneConfig = (e) => {
    e.preventDefault();
    saveStoneConfig(stoneForm);
    setIsStoneSaved(true);
    setTimeout(() => setIsStoneSaved(false), 3000);
  };

  const handleTargetChange = (targetId) => {
    setSelectedDiscountTarget(targetId);
    if (targetId === 'all') {
      const g = packageDiscounts?.global || (packageDiscounts?.['pkg-4h'] !== undefined ? packageDiscounts : { 'pkg-4h': 0, 'pkg-8h': 0, 'pkg-12h': 0, 'pkg-16h': 0 });
      setEditablePackageDiscounts(g);
    } else {
      const tDisc = packageDiscounts?.byTutor?.[targetId] || { 'pkg-4h': 0, 'pkg-8h': 0, 'pkg-12h': 0, 'pkg-16h': 0 };
      setEditablePackageDiscounts(tDisc);
    }
  };

  // Announcement States
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTarget, setAnnTarget] = useState('all');
  const [annLevel, setAnnLevel] = useState('info');
  const [annSuccessMsg, setAnnSuccessMsg] = useState('');

  // Students & Payouts Real Data (Estratégia 3: Stale-While-Revalidate com Supabase)
  const [searchStudent, setSearchStudent] = useState('');
  const [realStudents, setRealStudents] = useState(() => {
    try {
      const cached = localStorage.getItem('lexy_market_students_cache');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [isLoadingStudents, setIsLoadingStudents] = useState(() => realStudents.length === 0);

  useEffect(() => {
    let active = true;
    async function loadRealStudentsFromSupabase() {
      if (realStudents.length === 0) setIsLoadingStudents(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student');

        if (!error && data && active) {
          const mapped = data.map(s => ({
            id: s.id,
            name: s.full_name || s.username || (s.email ? s.email.split('@')[0] : 'Aluno Cadastrado'),
            email: s.real_email || s.email || 'Não informado',
            avatar: s.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            walletBalance: Number(s.clases_saldo_disponible || s.mensualidad_valor || 0),
            studyLanguage: s.subject ? (s.subject.charAt(0).toUpperCase() + s.subject.slice(1)) : 'Espanhol',
            languageLevel: s.spanish_level || 'Iniciante',
            completedClasses: Number(s.hours_learned || 0),
            registrationStatus: s.registration_status || 'complete',
            phone: s.phone || '',
            studentCode: s.student_code || ''
          }));
          setRealStudents(mapped);
          localStorage.setItem('lexy_market_students_cache', JSON.stringify(mapped));
        } else if (!error && data && data.length === 0 && active) {
          setRealStudents([]);
          localStorage.removeItem('lexy_market_students_cache');
        }
      } catch (err) {
        console.warn('Erro ao buscar alunos reais do Supabase:', err);
      } finally {
        if (active) setIsLoadingStudents(false);
      }
    }

    loadRealStudentsFromSupabase();
    return () => { active = false; };
  }, []);

  const filteredStudents = React.useMemo(() => {
    return realStudents.filter(s => 
      (s.name || '').toLowerCase().includes(searchStudent.toLowerCase()) || 
      (s.email || '').toLowerCase().includes(searchStudent.toLowerCase()) ||
      (s.studentCode || '').toLowerCase().includes(searchStudent.toLowerCase())
    );
  }, [realStudents, searchStudent]);

  const [pendingPayouts, setPendingPayouts] = useState([]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const res = await signInWithSupabase({ email: adminEmail, password: adminPassword });
    if (!res?.success) {
      setLoginError(res?.error || 'Credenciais inválidas. Acesso negado.');
    }
  };

  const handleSaveTierRates = (e) => {
    e.preventDefault();
    updateTierRates(editableTierRates);
    setIsFeeSaved(true);
    setTimeout(() => setIsFeeSaved(false), 3000);
  };

  const handleSavePackageDiscounts = (e) => {
    e.preventDefault();
    const updatedStructure = {
      global: { ...(packageDiscounts?.global || (packageDiscounts?.['pkg-4h'] !== undefined ? packageDiscounts : { 'pkg-4h': 0, 'pkg-8h': 0, 'pkg-12h': 0, 'pkg-16h': 0 })) },
      byTutor: { ...(packageDiscounts?.byTutor || {}) }
    };

    if (selectedDiscountTarget === 'all') {
      updatedStructure.global = { ...editablePackageDiscounts };
    } else {
      updatedStructure.byTutor[selectedDiscountTarget] = { ...editablePackageDiscounts };
    }

    updatePackageDiscounts(updatedStructure);
    setIsDiscountSaved(true);
    setTimeout(() => setIsDiscountSaved(false), 3000);
  };

  const handleRemoveTutorDiscount = (tutorId) => {
    const updatedStructure = {
      global: { ...(packageDiscounts?.global || { 'pkg-4h': 0, 'pkg-8h': 0, 'pkg-12h': 0, 'pkg-16h': 0 }) },
      byTutor: { ...(packageDiscounts?.byTutor || {}) }
    };
    delete updatedStructure.byTutor[tutorId];
    updatePackageDiscounts(updatedStructure);
    if (selectedDiscountTarget === tutorId) {
      handleTargetChange('all');
    }
  };

  const handleSaveRecommendedRate = (e) => {
    e.preventDefault();
    localStorage.setItem('lexy_recommended_rate', recommendedRate);
    setIsRateSaved(true);
    setTimeout(() => setIsRateSaved(false), 3000);
  };

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    addAnnouncement({
      title: annTitle,
      content: annContent,
      target: annTarget,
      level: annLevel
    });
    setAnnSuccessMsg('Comunicado global publicado com sucesso!');
    setAnnTitle('');
    setAnnContent('');
    setTimeout(() => setAnnSuccessMsg(''), 3000);
  };

  const handleApprovePayout = (id) => {
    setPendingPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
  };

  const isSuperAdminLoggedIn = profile?.role === 'admin' || profile?.role === 'superadmin';

  if (!isSuperAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12 animate-fade-in-up">
        <div className="glass-panel rounded-3xl p-8 border border-emerald-500/30">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-500/20 p-4 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-black text-center text-white mb-2">Acesso Restrito</h1>
          <p className="text-sm text-slate-400 text-center mb-8 font-medium">
            Painel exclusivo para a super administração. Insira as credenciais master para acessar.
          </p>

          {loginError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl mb-6 flex items-center gap-2 font-bold">
              <AlertCircle size={16} />
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Email Master *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="emaildeconexionamerica@gmail.com"
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Senha de Administrador *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium outline-none focus:border-emerald-400"
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
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Acessar Painel de Super Admin 🚀</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  const approvedCount = tutors.filter(t => t.status === 'approved').length;
  const pendingCount = tutors.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Admin */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Painel de Super Administração</h1>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
              ✓ Super Admin Conectado
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestão global de tutores, configuração das margens de repasse aos professores, avisos e saques.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Volume Total de Vendas</span>
            <span className="text-2xl font-black text-emerald-400">
              R$ {(bookings || []).filter(b => b && b.amount && !b.id?.includes('demo')).reduce((sum, b) => sum + Number(b.totalAmount || b.amount || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* TABS NAVEGATION - SCROLL HORIZONTAL NO CELULAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap">
        <button 
          onClick={() => setActiveTab('panel')}
          className={`flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${activeTab === 'panel' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
        >
          <Award className="w-4 h-4 shrink-0" /> 📊 Painel
        </button>
        <button 
          onClick={() => setActiveTab('tutors')}
          className={`flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${activeTab === 'tutors' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
        >
          <User className="w-4 h-4 shrink-0" /> 👨‍🏫 Tutores
          {pendingCount > 0 && <span className="bg-rose-500 text-white text-[10px] rounded-full px-1.5 ml-1">{pendingCount}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          className={`flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${activeTab === 'students' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
        >
          <Users className="w-4 h-4 shrink-0" /> 👥 Alunos
          {realStudents.length > 0 && <span className="bg-emerald-500 text-slate-950 font-black text-[10px] rounded-full px-2 py-0.5 ml-1">{realStudents.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('payouts')}
          className={`flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${activeTab === 'payouts' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
        >
          <Wallet className="w-4 h-4 shrink-0" /> 💸 Saques
          {pendingPayouts.filter(p => p.status === 'pending').length > 0 && <span className="bg-rose-500 text-white text-[10px] rounded-full px-1.5 ml-1">{pendingPayouts.filter(p => p.status === 'pending').length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('announcements')}
          className={`flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${activeTab === 'announcements' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
        >
          <Megaphone className="w-4 h-4 shrink-0" /> 📢 Anúncios
        </button>
        <button 
          onClick={() => setActiveTab('config')}
          className={`flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${activeTab === 'config' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
        >
          <Settings className="w-4 h-4 shrink-0" /> ⚙️ Config
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      {activeTab === 'panel' && (
        <div className="space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 shadow-xl rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Expurgo Automático de Histórico de Aulas (30 Dias)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Conforme a política nativa da plataforma Lexy, o histórico de aulas concluídas é mantido no sistema por exatamente 30 dias para auditoria antes de ser permanentemente removido.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  autoPurge30DaysHistory();
                  alert('Purga de histórico de 30 dias executada com sucesso.');
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-amber-400" />
                <span>Executar Purga de 30 Dias</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <div className="text-slate-400 text-center py-2">
                Acompanhamento em tempo real das reservas e purga de histórico de 30 dias.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tutors' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Cadastros de Tutores & Status de Aprovação
            </h2>
          </div>

          <div className="space-y-6">
            {tutors.map(t => (
              <div key={t.id} className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row gap-6">
                <div className="shrink-0 flex flex-col gap-3">
                  <img src={t.avatar} alt={t.name} className="w-24 h-24 rounded-2xl object-cover border border-slate-700" />
                  {t.videoUrl && (
                    <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold justify-center bg-emerald-500/10 py-1 px-2 rounded-lg border border-emerald-500/20">
                      <Video className="w-3 h-3" /> Vídeo OK
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-black text-white">{t.name} <span className="text-sm font-normal text-slate-400">({t.flag} {t.country})</span></h3>
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <Mail className="w-3 h-3" /> {t.email} {t.phone ? '• 📞 ' + t.phone : ''}
                      </p>
                    </div>
                    <div>
                      {t.status === 'approved' ? (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado (Visível)
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> Pendente
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Idioma</span>
                      <span className="text-xs font-bold text-cyan-300">{t.subject}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Tarifa</span>
                      <span className="text-xs font-bold text-white">${t.hourlyRate} USD/h</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Especialidades</span>
                      <span className="text-xs text-slate-300">{t.specialties ? t.specialties.join(', ') : 'Geral'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Certificações</span>
                      <span className="text-xs text-slate-300">{t.certifications || 'Nenhuma'}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Headline & Bio</span>
                    <p className="text-xs text-slate-300 font-semibold mb-1">{t.headline || t.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-2">{t.bio}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0 min-w-[140px] justify-center">
                  {t.status === 'approved' ? (
                    <button
                      onClick={() => rejectTutor(t.id)}
                      className="w-full px-3 py-2 rounded-xl font-extrabold bg-gradient-to-r from-rose-500 to-red-600 hover:from-red-600 text-white shadow-lg transition-all text-xs flex justify-center items-center"
                    >
                      Rejeitar Perfil
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => approveTutor(t.id)}
                        className="w-full px-3 py-2 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all text-xs flex justify-center items-center"
                      >
                        Aprovar Perfil
                      </button>
                      <button
                        onClick={() => rejectTutor(t.id)}
                        className="w-full px-3 py-2 rounded-xl font-extrabold bg-gradient-to-r from-rose-500 to-red-600 hover:from-red-600 text-white shadow-lg transition-all text-xs flex justify-center items-center"
                      >
                        Rejeitar Perfil
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-amber-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Alunos Cadastrados
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Exibindo exclusivamente dados 100% reais de alunos cadastrados extraídos diretamente do Supabase.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar aluno por nome ou e-mail..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-9 pr-3.5 py-2 text-xs outline-none focus:border-amber-400"
              />
            </div>
          </div>
          
          {isLoadingStudents ? (
            <div className="p-8 text-center text-slate-400 text-xs font-bold animate-pulse">
              Carregando alunos cadastrados no Supabase...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">Nenhum aluno cadastrado</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {searchStudent 
                  ? 'Nenhum aluno corresponde ao termo buscado.' 
                  : 'Nenhum aluno cadastrado foi encontrado no Supabase. A plataforma exibirá automaticamente novos alunos conforme realizem seus cadastros.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.map(s => (
                <div key={s.id} className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-5 flex gap-4">
                  <img 
                    src={s.avatar} 
                    alt={s.name} 
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'; }}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="truncate">
                        <h3 className="text-sm font-black text-white truncate">{s.name}</h3>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 shrink-0" /> {s.email}
                        </p>
                        {s.phone && <p className="text-[10px] text-slate-500 font-mono">📞 {s.phone}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Saldo Aulas</span>
                        <span className="text-xs font-bold text-emerald-400">{s.walletBalance} aula(s)</span>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Estuda</span>
                        <span className="text-xs text-white font-semibold">{s.studyLanguage} ({s.languageLevel})</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Aulas Feitas</span>
                        <span className="text-xs text-white font-semibold">{s.completedClasses} aulas</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                Solicitações de Resgate / Payouts
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Exibe os dados reais e o repasse ao professor.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-4">Professor / Tutor</th>
                  <th className="py-3 px-4">Data Solicitação</th>
                  <th className="py-3 px-4">Valor Solicitado</th>
                  <th className="py-3 px-4">Margem do Tutor</th>
                  <th className="py-3 px-4">Valor Líquido a Pagar</th>
                  <th className="py-3 px-4">Método & Chave Real</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação do Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pendingPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs font-semibold">
                      <Wallet className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                      Nenhuma solicitação de saque pendente no momento.
                    </td>
                  </tr>
                ) : (
                  pendingPayouts.map(p => {
                    const earnRate = p.teacherEarnPercent || 80;
                    const netToPay = Number((p.requestedAmount * (earnRate / 100)).toFixed(2));

                    return (
                      <tr key={p.id} className="hover:bg-slate-900/50">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                          <img src={p.tutorAvatar} alt={p.tutorName} className="w-9 h-9 rounded-xl object-cover border border-slate-700" />
                          <div>
                            <span className="block font-bold text-white">{p.tutorName}</span>
                            <span className="text-[10px] text-slate-400">{p.tutorEmail}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-300">{p.date}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-300">${p.requestedAmount.toFixed(2)} USD</td>
                        <td className="py-3.5 px-4 font-bold text-cyan-300">{earnRate}% Repasse</td>
                        <td className="py-3.5 px-4 font-black text-emerald-400 text-sm">${netToPay.toFixed(2)} USD</td>
                        <td className="py-3.5 px-4">
                          <span className="block font-semibold text-white">{p.method}</span>
                          <span className="text-[10px] text-cyan-300 font-mono font-bold">{p.pixKey}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {p.status === 'approved' ? (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Aprovado
                            </span>
                          ) : (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 animate-pulse">
                              <Clock className="w-3.5 h-3.5" /> Pendente
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {p.status !== 'approved' && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleApprovePayout(p.id)}
                                className="px-4 py-1.5 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all text-xs"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => {}}
                                className="px-3 py-1.5 rounded-xl font-extrabold bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg transition-all text-xs"
                              >
                                Rejeitar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-cyan-400" />
              Gerenciar Anúncios & Banners Promocionais
            </h2>
          </div>

          {annSuccessMsg && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{annSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Público-Alvo *</label>
                <select
                  value={annTarget}
                  onChange={(e) => setAnnTarget(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white font-bold text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="all">Todos na Plataforma 🌐</option>
                  <option value="landing">Apenas Landing Page 🏠</option>
                  <option value="students">Apenas para Alunos 🎓</option>
                  <option value="teachers">Apenas para Professores 👨‍🏫</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Nível de Urgência *</label>
                <select
                  value={annLevel}
                  onChange={(e) => setAnnLevel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white font-bold text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="info">Informativo (Azul)</option>
                  <option value="warning">Importante (Amarelo)</option>
                  <option value="urgent">Urgente (Vermelho)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Título do Anúncio *</label>
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Ex: Manutenção Programada ou Promoção Especial"
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Conteúdo do Comunicado *</label>
              <textarea
                rows={2}
                required
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                placeholder="Escreva a mensagem oficial que aparecerá nos painéis..."
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 text-xs outline-none focus:border-cyan-400 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              <Megaphone className="w-4 h-4" />
              <span>Publicar Anúncio Agora</span>
            </button>
          </form>

          {/* Lista de Anúncios Ativos */}
          <div className="pt-2 space-y-2 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Anúncios Ativos ({announcements.length})</span>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {announcements.map(ann => (
                <div key={ann.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-white block">{ann.title}</span>
                      <span className="text-[10px] text-slate-400">Público: {ann.target === 'landing' ? 'Landing Page' : ann.target === 'students' ? 'Alunos' : ann.target === 'teachers' ? 'Professores' : 'Todos'} • {ann.createdAt}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setAnnTitle(ann.title);
                          setAnnContent(ann.content);
                          setAnnTarget(ann.target);
                          setAnnLevel(ann.level);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 p-1 bg-cyan-500/10 rounded"
                        title="Editar Anúncio"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteAnnouncement(ann.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 bg-rose-500/10 rounded"
                        title="Excluir Anúncio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-300 mt-1">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-400" />
                Configurar Margens de Repasse (% Ganho do Tutor)
              </h2>
            </div>

            {isFeeSaved && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Porcentagens de repasse salvas com efeito imediato!</span>
              </div>
            )}

            <form onSubmit={handleSaveTierRates} className="space-y-4">
              {/* Campo Aula Experimental */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label className="font-bold text-slate-300">Aula Experimental (Repasse % ao Professor)</label>
                  <span className="text-amber-400 font-bold">{editableTierRates.trial}% Tutor / {100 - editableTierRates.trial}% Lexy</span>
                </div>
                <input
                  type="number" min={0} max={100} value={editableTierRates.trial}
                  onChange={(e) => setEditableTierRates(prev => ({ ...prev, trial: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Porcentagem de repasse ao professor para Aulas Experimentais (Ex: 10% repasse ao tutor / 90% comissão para a Lexy).
                </p>
              </div>

              {/* Campo 0 a 7 aulas */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label className="font-bold text-slate-300">0 a 7 Aulas Dadas</label>
                  <span className="text-amber-400 font-bold">{editableTierRates.tier1}%</span>
                </div>
                <input
                  type="number" min={50} max={100} value={editableTierRates.tier1}
                  onChange={(e) => setEditableTierRates(prev => ({ ...prev, tier1: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-amber-400"
                />
              </div>

              {/* Campo 8 a 15 aulas */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label className="font-bold text-slate-300">8 a 15 Aulas Dadas</label>
                  <span className="text-amber-400 font-bold">{editableTierRates.tier2}%</span>
                </div>
                <input
                  type="number" min={50} max={100} value={editableTierRates.tier2}
                  onChange={(e) => setEditableTierRates(prev => ({ ...prev, tier2: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-amber-400"
                />
              </div>

              {/* Campo 16 a 20 aulas */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label className="font-bold text-slate-300">16 a 20 Aulas Dadas</label>
                  <span className="text-amber-400 font-bold">{editableTierRates.tier3}%</span>
                </div>
                <input
                  type="number" min={50} max={100} value={editableTierRates.tier3}
                  onChange={(e) => setEditableTierRates(prev => ({ ...prev, tier3: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-amber-400"
                />
              </div>

              {/* Campo 21 a 50 aulas */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label className="font-bold text-slate-300">21 a 50 Aulas Dadas</label>
                  <span className="text-amber-400 font-bold">{editableTierRates.tier4}%</span>
                </div>
                <input
                  type="number" min={50} max={100} value={editableTierRates.tier4}
                  onChange={(e) => setEditableTierRates(prev => ({ ...prev, tier4: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-amber-400"
                />
              </div>

              {/* Campo Mais de 50 aulas */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label className="font-bold text-slate-300">Mais de 50 Aulas Dadas</label>
                  <span className="text-amber-400 font-bold">{editableTierRates.tier5}%</span>
                </div>
                <input
                  type="number" min={50} max={100} value={editableTierRates.tier5}
                  onChange={(e) => setEditableTierRates(prev => ({ ...prev, tier5: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Margens (% Imediato)</span>
              </button>
            </form>
          </div>
          
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-cyan-500/30 self-start">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                Configurações Gerais
              </h2>
            </div>

            {isRateSaved && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Tarifa recomendada salva!</span>
              </div>
            )}

            <form onSubmit={handleSaveRecommendedRate} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label className="font-bold text-slate-300">Tarifa Recomendada para Novos Tutores (R$/h)</label>
                </div>
                <input
                  type="number" min={5} max={200} value={recommendedRate}
                  onChange={(e) => setRecommendedRate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-cyan-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </button>
            </form>
          </div>

          {/* Card de Descontos Promocionais em Pacotes */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-emerald-500/30 md:col-span-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Percent className="w-5 h-5 text-emerald-400" />
                  Descontos Promocionais em Pacotes (Cobrança do Aluno)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Defina porcentagens de desconto promocionais para **todos os professores (global)** ou **para um professor específico**.
                </p>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-300 space-y-1">
              <strong className="text-emerald-400 font-bold block">📌 Regra de Repasse ao Professor:</strong>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Qualquer desconto configurado aqui é absorvido pela plataforma e reduz apenas o valor final pago pelo aluno. O repasse calculated para o PROFESSOR continuará sendo baseado no valor integral da sua tarifa cadastrada (Tarifa × Horas), garantindo que ele receba 100% do seu valor por hora.
              </p>
            </div>

            {isDiscountSaved && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Descontos de pacotes atualizados com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleSavePackageDiscounts} className="space-y-5">
              
              {/* Casilla / Dropdown de Seleção de Alvo (Todos vs Tutor Específico) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-extrabold text-white block">
                  1. Selecione a quem aplicar este Desconto Promocional *
                </label>
                <select
                  value={selectedDiscountTarget}
                  onChange={(e) => handleTargetChange(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm rounded-xl px-4 py-3 outline-none cursor-pointer focus:border-emerald-400 shadow-inner"
                >
                  <option value="all">🌐 TODOS OS PROFESSORES (Desconto Global para toda a plataforma)</option>
                  <optgroup label="👤 Professores Individuais (Desconto Específico por Perfil)">
                    {tutors.map(t => (
                      <option key={t.id} value={t.id}>
                        👤 {t.name} ({t.subject || 'Idiomas'} - R$ {Number(t.hourlyRate || t.hourly_rate || 20).toFixed(2)}/h)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Campos de Desconto de Pacotes */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                  2. Defina os Porcentagens de Desconto (% OFF para {selectedDiscountTarget === 'all' ? 'Todos os Tutores' : (tutors.find(t => t.id === selectedDiscountTarget)?.name || 'Tutor Selecionado')})
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="font-bold text-slate-300 text-xs block mb-1">Pacote 4 Horas (% OFF)</label>
                    <input
                      type="number" min={0} max={50} value={editablePackageDiscounts['pkg-4h'] || 0}
                      onChange={(e) => setEditablePackageDiscounts(prev => ({ ...prev, 'pkg-4h': Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 text-xs block mb-1">Pacote 8 Horas (% OFF)</label>
                    <input
                      type="number" min={0} max={50} value={editablePackageDiscounts['pkg-8h'] || 0}
                      onChange={(e) => setEditablePackageDiscounts(prev => ({ ...prev, 'pkg-8h': Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 text-xs block mb-1">Pacote 12 Horas (% OFF)</label>
                    <input
                      type="number" min={0} max={50} value={editablePackageDiscounts['pkg-12h'] || 0}
                      onChange={(e) => setEditablePackageDiscounts(prev => ({ ...prev, 'pkg-12h': Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 text-xs block mb-1">Pacote 16 Horas (% OFF)</label>
                    <input
                      type="number" min={0} max={50} value={editablePackageDiscounts['pkg-16h'] || 0}
                      onChange={(e) => setEditablePackageDiscounts(prev => ({ ...prev, 'pkg-16h': Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Configuração de Descontos 🚀</span>
              </button>
            </form>

            {/* Lista de Promociones Específicas por Tutor Activas */}
            {packageDiscounts?.byTutor && Object.keys(packageDiscounts.byTutor).length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  🔥 Promociones Específicas Ativas por Tutor ({Object.keys(packageDiscounts.byTutor).length}):
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(packageDiscounts.byTutor).map(([tId, disc]) => {
                    const tutorObj = tutors.find(t => t.id === tId);
                    const tName = tutorObj ? tutorObj.name : tId;
                    return (
                      <div key={tId} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-white block font-bold">{tName}</strong>
                          <span className="text-emerald-400 text-[10px] font-bold">
                            4h: {disc['pkg-4h'] || 0}% | 8h: {disc['pkg-8h'] || 0}% | 12h: {disc['pkg-12h'] || 0}% | 16h: {disc['pkg-16h'] || 0}%
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTutorDiscount(tId)}
                          className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                          title="Remover desconto específico"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Card de Configuração Oficial da Stone Pagamentos S.A. */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-emerald-500/40 md:col-span-2 shadow-2xl bg-gradient-to-b from-slate-900/90 to-emerald-950/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <span>Gateway Oficial Stone Pagamentos S.A.</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/40 uppercase">
                      Pagar.me v5 API
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure suas chaves reais da Stone S.A. para processar PIX Instantâneo, Cartão de Crédito e Boleto em Reais (R$).
                  </p>
                </div>
              </div>
            </div>

            {isStoneSaved && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Chaves e parâmetros da Stone Pagamentos S.A. salvas com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleSaveStoneConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Modo de Operação *</label>
                  <select
                    value={stoneForm.mode}
                    onChange={(e) => setStoneForm(prev => ({ ...prev, mode: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-xs rounded-xl px-3 py-2.5 outline-none cursor-pointer focus:border-emerald-400"
                  >
                    <option value="sandbox">🧪 Sandbox (Modo de Testes com Simulação Real)</option>
                    <option value="production">🚀 Produção (Cobrança Real via Stone S.A.)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">ID do Estabelecimento / Merchant ID</label>
                  <input
                    type="text"
                    value={stoneForm.accountId || ''}
                    onChange={(e) => setStoneForm(prev => ({ ...prev, accountId: e.target.value }))}
                    placeholder="merchant_stone_12345"
                    className="w-full bg-slate-900 border border-slate-800 text-white font-mono text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Stone Public Key (Chave Pública `pk_...`)</label>
                  <input
                    type="text"
                    value={stoneForm.publicKey || ''}
                    onChange={(e) => setStoneForm(prev => ({ ...prev, publicKey: e.target.value }))}
                    placeholder="pk_test_..."
                    className="w-full bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Stone Secret Key (Chave Secreta `sk_...`)</label>
                  <input
                    type="password"
                    value={stoneForm.secretKey || ''}
                    onChange={(e) => setStoneForm(prev => ({ ...prev, secretKey: e.target.value }))}
                    placeholder="sk_test_..."
                    className="w-full bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <span className="font-bold text-slate-300">Métodos de Pagamento Ativos na Stone:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 font-bold text-emerald-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stoneForm.pixEnabled}
                      onChange={(e) => setStoneForm(prev => ({ ...prev, pixEnabled: e.target.checked }))}
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                    <span>⚡ PIX Instantâneo</span>
                  </label>

                  <label className="flex items-center gap-1.5 font-bold text-emerald-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stoneForm.cardEnabled}
                      onChange={(e) => setStoneForm(prev => ({ ...prev, cardEnabled: e.target.checked }))}
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                    <span>💳 Cartão de Crédito</span>
                  </label>

                  <label className="flex items-center gap-1.5 font-bold text-emerald-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stoneForm.boletoEnabled}
                      onChange={(e) => setStoneForm(prev => ({ ...prev, boletoEnabled: e.target.checked }))}
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                    <span>📄 Boleto Bancário</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Credenciais da Stone Pagamentos S.A. 🚀</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
