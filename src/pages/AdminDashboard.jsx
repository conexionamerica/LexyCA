import React, { useState } from 'react';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheck, Users, DollarSign, CheckCircle2, Clock, 
  Award, Sparkles, Lock, Mail, Eye, EyeOff, AlertCircle, Wallet, ArrowRight, Check, 
  Megaphone, Trash2, Settings, Save, AlertTriangle, Calendar, Percent 
} from 'lucide-react';

export default function AdminDashboard() {
  const { 
    tutors, approveTutor, rejectTutor, 
    tierRates, updateTierRates,
    announcements, addAnnouncement, deleteAnnouncement,
    bookings, autoPurge30DaysHistory
  } = useMarketplace();
  
  const { profile, loginAdmin } = useAuth();

  // Estados del Formulario de Login de Admin
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // 1. Estado da Configuração de Margens de Repasse ao Professor
  const [editableTierRates, setEditableTierRates] = useState(tierRates || {
    trial: 75,
    tier1: 75,
    tier2: 80,
    tier3: 85,
    tier4: 90,
    tier5: 92
  });

  const [isFeeSaved, setIsFeeSaved] = useState(false);

  // 2. Estado de Novo Anúncio Global
  const [annTarget, setAnnTarget] = useState('all');
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annLevel, setAnnLevel] = useState('info');
  const [annSuccessMsg, setAnnSuccessMsg] = useState('');

  // 3. Simulação de solicitudes reais de saque (payout) no Admin
  const [pendingPayouts, setPendingPayouts] = useState([
    {
      id: 'pay-201',
      tutorName: 'María Fernández',
      tutorEmail: 'maria.tutor@lexyca.com',
      tutorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      date: new Date().toLocaleDateString(),
      requestedAmount: 100.00,
      teacherEarnPercent: 80,
      method: 'PIX (Brasil 🇧🇷)',
      pixKey: 'maria.tutor@pix.com.br',
      status: 'pending'
    },
    {
      id: 'pay-202',
      tutorName: 'Prof. Carlos Rivera',
      tutorEmail: 'carlos.rivera@lexyca.com',
      tutorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      date: '10/08/2026',
      requestedAmount: 150.00,
      teacherEarnPercent: 85,
      method: 'PayPal 🌐',
      pixKey: 'carlos.rivera@paypal.com',
      status: 'approved'
    }
  ]);

  const handleApprovePayout = (id) => {
    setPendingPayouts(prev => prev.map(p => {
      if (p.id === id) return { ...p, status: 'approved' };
      return p;
    }));
  };

  const handleSaveTierRates = (e) => {
    e.preventDefault();
    updateTierRates(editableTierRates);
    setIsFeeSaved(true);
    setTimeout(() => setIsFeeSaved(false), 3000);
  };

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    addAnnouncement({
      target: annTarget,
      title: annTitle,
      content: annContent,
      level: annLevel
    });

    setAnnTitle('');
    setAnnContent('');
    setAnnSuccessMsg('📢 Anúncio global publicado com sucesso para o público-alvo!');
    setTimeout(() => setAnnSuccessMsg(''), 4000);
  };

  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    const res = loginAdmin(adminEmail, adminPassword);
    if (!res.success) {
      setLoginError(res.error);
    }
  };

  // Verificar si el usuario actual es el Super Admin Autorizado
  const isSuperAdminLoggedIn = profile && profile.email === 'emaildeconexionamerica@gmail.com' && profile.role === 'admin';

  if (!isSuperAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12 animate-fade-in-up">
        <div className="glass-panel rounded-3xl p-8 space-y-6 border border-emerald-500/40 glow-cyan">
          
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-extrabold text-white">Acesso Restrito: Super Admin</h1>
            <p className="text-xs text-slate-400">
              Digite as credenciais autorizadas de Administrador Geral para acessar este painel.
            </p>
          </div>

          {loginError && (
            <div className="bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">E-mail do Administrador *</label>
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
            <span className="text-2xl font-black text-emerald-400">$48,920 USD</span>
          </div>
        </div>
      </div>

      {/* Métricas Reales */}
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

      {/* Grid de 2 Columnas: Configuração de Margens de Repasse e Anúncios Globais */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Columna Izquierda: Configuração das Margens de Repasse aos Professores (5 columnas) */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-amber-400" />
              Configurar Margens de Repasse aos Professores (% Ganho do Tutor)
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
                <label className="font-bold text-slate-300">Aula Experimental (% Ganho Tutor)</label>
                <span className="text-amber-400 font-bold">{editableTierRates.trial}%</span>
              </div>
              <input
                type="number"
                min={50}
                max={100}
                value={editableTierRates.trial}
                onChange={(e) => setEditableTierRates(prev => ({ ...prev, trial: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-amber-400"
              />
            </div>

            {/* Campo 0 a 7 aulas */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="font-bold text-slate-300">0 a 7 Aulas Dadas (% Ganho Tutor)</label>
                <span className="text-amber-400 font-bold">{editableTierRates.tier1}%</span>
              </div>
              <input
                type="number"
                min={50}
                max={100}
                value={editableTierRates.tier1}
                onChange={(e) => setEditableTierRates(prev => ({ ...prev, tier1: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-amber-400"
              />
            </div>

            {/* Campo 8 a 15 aulas */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="font-bold text-slate-300">8 a 15 Aulas Dadas (% Ganho Tutor)</label>
                <span className="text-amber-400 font-bold">{editableTierRates.tier2}%</span>
              </div>
              <input
                type="number"
                min={50}
                max={100}
                value={editableTierRates.tier2}
                onChange={(e) => setEditableTierRates(prev => ({ ...prev, tier2: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-amber-400"
              />
            </div>

            {/* Campo 16 a 20 aulas */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="font-bold text-slate-300">16 a 20 Aulas Dadas (% Ganho Tutor)</label>
                <span className="text-amber-400 font-bold">{editableTierRates.tier3}%</span>
              </div>
              <input
                type="number"
                min={50}
                max={100}
                value={editableTierRates.tier3}
                onChange={(e) => setEditableTierRates(prev => ({ ...prev, tier3: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-amber-400"
              />
            </div>

            {/* Campo 21 a 50 aulas */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="font-bold text-slate-300">21 a 50 Aulas Dadas (% Ganho Tutor)</label>
                <span className="text-amber-400 font-bold">{editableTierRates.tier4}%</span>
              </div>
              <input
                type="number"
                min={50}
                max={100}
                value={editableTierRates.tier4}
                onChange={(e) => setEditableTierRates(prev => ({ ...prev, tier4: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-amber-400"
              />
            </div>

            {/* Campo Mais de 50 aulas */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="font-bold text-slate-300">Mais de 50 Aulas Dadas (% Ganho Tutor)</label>
                <span className="text-amber-400 font-bold">{editableTierRates.tier5}%</span>
              </div>
              <input
                type="number"
                min={50}
                max={100}
                value={editableTierRates.tier5}
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

        {/* Columna Derecha: Sistema de Avisos & Anúncios Globais (7 columnas) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-cyan-400" />
              Enviar Anúncio / Comunicado Global
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
                  <option value="all">Todos na Plataforma (Alunos & Tutores) 🌐</option>
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
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {announcements.map(ann => (
                <div key={ann.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-extrabold text-white block">{ann.title}</span>
                    <span className="text-[10px] text-slate-400">Público: {ann.target} • {ann.createdAt}</span>
                  </div>
                  <button
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="text-rose-400 hover:text-rose-300 p-1"
                    title="Excluir Anúncio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── TABLA: SOLICITAÇÕES DE RESGATE / PAYOUTS DOS PROFESSORES ── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Solicitações de Resgate / Payouts dos Professores
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Exibe os dados reais e o repasse ao professor ({p => p.teacherEarnPercent}%).</p>
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
                          <Check className="w-3.5 h-3.5" /> Aprovado & Transferido
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> Aguardando Aprovação (24h)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status !== 'approved' && (
                        <button
                          onClick={() => handleApprovePayout(p.id)}
                          className="px-4 py-1.5 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all text-xs"
                        >
                          ⚡ Aprovar Saque & Transferir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABLA: GESTÃO & APROVAÇÃO DE TUTORES CADASTRADOS ── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-cyan-500/30">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Cadastros de Tutores & Status de Aprovação
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="py-3 px-4">Tutor / Cadastro</th>
                <th className="py-3 px-4">Idioma Ensinado</th>
                <th className="py-3 px-4">País</th>
                <th className="py-3 px-4">Tarifa / h</th>
                <th className="py-3 px-4">Status de Visibilidade</th>
                <th className="py-3 px-4 text-right">Ação do Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tutors.map(t => (
                <tr key={t.id} className="hover:bg-slate-900/50">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-xl object-cover border border-slate-700" />
                    <div>
                      <span className="block font-bold text-white">{t.name}</span>
                      <span className="text-[10px] text-slate-400">{t.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-cyan-300">{t.subject}</td>
                  <td className="py-3.5 px-4">{t.flag || '🌐'} {t.country}</td>
                  <td className="py-3.5 px-4 font-bold text-white">${t.hourlyRate} USD</td>
                  <td className="py-3.5 px-4">
                    {t.status === 'approved' ? (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado (Visível)
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 animate-pulse" /> Pendente de Aprovação
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {t.status === 'approved' ? (
                      <button
                        onClick={() => rejectTutor(t.id)}
                        className="px-3 py-1.5 rounded-xl font-extrabold bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white transition-all text-xs"
                      >
                        Revogar Visibilidade
                      </button>
                    ) : (
                      <button
                        onClick={() => approveTutor(t.id)}
                        className="px-4 py-1.5 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all text-xs"
                      >
                        Aprovar Tutor Agora
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── HISTÓRICO GLOBAL DE AULAS & POLÍTICA DE PURGA DE 30 DIAS ── */}
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
  );
}
