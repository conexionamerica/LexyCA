import React, { useState } from 'react';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheck, Users, DollarSign, CheckCircle2, Clock, 
  Award, Sparkles, Lock, Mail, Eye, EyeOff, AlertCircle, Wallet, ArrowRight, Check, 
  Megaphone, Trash2, Settings, Save, AlertTriangle, Calendar, Percent, Search, User, Video
} from 'lucide-react';

export default function AdminDashboard() {
  const { 
    tutors, approveTutor, rejectTutor, 
    tierRates, updateTierRates,
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
  
  const [recommendedRate, setRecommendedRate] = useState(localStorage.getItem('lexy_recommended_rate') || 12);
  const [isRateSaved, setIsRateSaved] = useState(false);

  // Announcement States
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTarget, setAnnTarget] = useState('all');
  const [annLevel, setAnnLevel] = useState('info');
  const [annSuccessMsg, setAnnSuccessMsg] = useState('');

  // Students & Payouts Mock Data
  const [searchStudent, setSearchStudent] = useState('');
  const [studentsData] = useState([
    { id: 1, name: "Gabriel Alumno", email: "gabriel@test.com", avatar: "https://i.pravatar.cc/150?img=11", walletBalance: 45.0, studyLanguage: "Espanhol", languageLevel: "Intermediário B1", completedClasses: 12 },
    { id: 2, name: "Luciana Martins", email: "luciana@test.com", avatar: "https://i.pravatar.cc/150?img=5", walletBalance: 120.0, studyLanguage: "Inglês", languageLevel: "Avançado C1", completedClasses: 45 },
    { id: 3, name: "Roberto Silva", email: "roberto@test.com", avatar: "https://i.pravatar.cc/150?img=8", walletBalance: 0.0, studyLanguage: "Italiano", languageLevel: "Iniciante A1", completedClasses: 2 },
  ]);

  const [pendingPayouts, setPendingPayouts] = useState([
    { id: 101, tutorName: "María Fernández", tutorEmail: "maria@test.com", tutorAvatar: "https://i.pravatar.cc/150?img=47", date: "2024-05-10", requestedAmount: 150.00, teacherEarnPercent: 80, method: "PIX", pixKey: "maria@pix.com", status: "pending" },
    { id: 102, tutorName: "Carlos Rivera", tutorEmail: "carlos@test.com", tutorAvatar: "https://i.pravatar.cc/150?img=12", date: "2024-05-11", requestedAmount: 45.00, teacherEarnPercent: 75, method: "PayPal", pixKey: "carlos@paypal.com", status: "pending" },
    { id: 103, tutorName: "Sophie Martin", tutorEmail: "sophie@test.com", tutorAvatar: "https://i.pravatar.cc/150?img=23", date: "2024-05-01", requestedAmount: 200.00, teacherEarnPercent: 85, method: "PIX", pixKey: "+5511999999999", status: "approved" },
  ]);

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

  const filteredStudents = studentsData.filter(s => 
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) || 
    s.email.toLowerCase().includes(searchStudent.toLowerCase())
  );

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
            <span className="text-2xl font-black text-emerald-400">$48,920 USD</span>
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

      {activeTab === 'panel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Tutores Aprovados (Públicos)</span>
              <div className="text-3xl font-black text-emerald-400">{approvedCount} professores</div>
            </div>

            <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Aguardando Aprovação</span>
              <div className="text-3xl font-black text-amber-400">{pendingCount} cadastros</div>
            </div>

            <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Margem de Ganho Atual do Professor</span>
              <div className="text-3xl font-black text-cyan-400">{editableTierRates.tier1}% a {editableTierRates.tier5}%</div>
            </div>
          </div>
          
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  Histórico Global de Aulas & Política de Auto-eliminação em 30 Dias
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aulas concluídas ou marcadas como No-Show são mantidas por 30 dias e depois eliminadas automaticamente.
                </p>
              </div>

              <button
                onClick={autoPurge30DaysHistory}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 text-amber-400" />
                <span>Executar Purga de 30 Dias</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="font-bold text-white">Gabriel Alumno ➔ Profª María Fernández</span>
                <span className="text-emerald-400 font-bold">✓ Concluída (Mantida por mais 28 dias)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="font-bold text-white">Luciana Martins ➔ Prof. Carlos Rivera</span>
                <span className="text-amber-300 font-bold">⚠️ No-Show (Mantida por mais 14 dias)</span>
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
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Alunos Cadastrados
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar aluno..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-9 pr-3.5 py-2 text-xs outline-none focus:border-amber-400"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map(s => (
              <div key={s.id} className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-5 flex gap-4">
                <img src={s.avatar} alt={s.name} className="w-16 h-16 rounded-xl object-cover border border-slate-700" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-black text-white">{s.name}</h3>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Saldo</span>
                      <span className="text-xs font-bold text-emerald-400">${s.walletBalance.toFixed(2)} USD</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Estuda</span>
                      <span className="text-xs text-white">{s.studyLanguage} ({s.languageLevel})</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Aulas Feitas</span>
                      <span className="text-xs text-white">{s.completedClasses} aulas</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                {pendingPayouts.map(p => {
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
                })}
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
                  <label className="font-bold text-slate-300">Aula Experimental</label>
                  <span className="text-amber-400 font-bold">{editableTierRates.trial}%</span>
                </div>
                <input
                  type="number" min={50} max={100} value={editableTierRates.trial}
                  onChange={(e) => setEditableTierRates(prev => ({ ...prev, trial: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-amber-400"
                />
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
        </div>
      )}
    </div>
  );
}
