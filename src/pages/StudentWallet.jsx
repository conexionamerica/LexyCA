import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Wallet, ArrowRight, ArrowDownLeft, ArrowUpRight, 
  CheckCircle, Loader2, CreditCard, ShieldCheck, CheckCircle2, Award, Clock, Sparkles, Zap, Star, BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMarketplace } from '../contexts/MarketplaceContext';
import AsaasCheckoutModal from '../components/payment/AsaasCheckoutModal';

export default function StudentWallet() {
  const { profile, saveWalletTransaction } = useAuth();
  const { activateSubscriptionAndCredits, bookings } = useMarketplace();
  
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [isAsaasModalOpen, setIsAsaasModalOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  // Planos de Aulas Oficiais Lexy (Ciclo de 30 Dias - Aulas de 45 min)
  const plans = [
    {
      id: 'plan-start',
      name: 'Plano Start',
      lessons: 4,
      frequency: '1 aula de 45 min / semana',
      price: 200,
      badge: 'Ciclo 30 Dias',
      badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
      popular: false
    },
    {
      id: 'plan-pro',
      name: 'Plano Pro',
      lessons: 8,
      frequency: '2 aulas de 45 min / semana',
      price: 360,
      badge: '🔥 10% OFF • Mais Popular',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      popular: true
    },
    {
      id: 'plan-intensivo',
      name: 'Plano Intensivo',
      lessons: 12,
      frequency: '3 aulas de 45 min / semana',
      price: 504,
      badge: '🔥 16% OFF',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      popular: false
    },
    {
      id: 'plan-fluencia',
      name: 'Plano Fluência',
      lessons: 16,
      frequency: '4 aulas de 45 min / semana',
      price: 640,
      badge: '🔥 20% OFF • Máximo Desconto',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      popular: false
    }
  ];

  // Histórico de transações pertencendo EXCLUSIVAMENTE ao aluno autenticado
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('lexy_wallet_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Erro ao carregar histórico de carteira', e);
      }
    }
    return [];
  });

  const userHistory = useMemo(() => {
    if (!profile) return [];
    const pId = String(profile.id || '').toLowerCase();
    const pEmail = String(profile.email || '').toLowerCase();

    const profileHistory = Array.isArray(profile?.wallet_history) ? profile.wallet_history : [];
    const combinedRaw = [...profileHistory, ...(history || [])];

    // Mapear aulas reservadas do Supabase em transações se não existirem no histórico
    const studentBookings = (bookings || []).filter(b => {
      const sId = String(b.studentId || b.student_id || '').toLowerCase();
      const sEmail = String(b.studentEmail || b.email || '').toLowerCase();
      return (pId && sId === pId) || (pEmail && sEmail === pEmail);
    });

    const bookingTxList = studentBookings.map(b => ({
      id: `tx_booking_${b.id}`,
      studentId: profile.id,
      studentEmail: profile.email,
      desc: `Agendamento: ${b.tutorName || 'Professor'} (${b.day} às ${b.time})`,
      date: b.createdAt ? new Date(b.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
      amount: b.amount || 20,
      lessons: b.planHours || 1,
      type: 'payment',
      status: b.status === 'confirmed' ? 'Concluído' : b.status || 'Concluído'
    }));

    const allTx = [...combinedRaw, ...bookingTxList];

    // Eliminar duplicados por ID
    const uniqueMap = new Map();
    allTx.forEach(tx => {
      if (tx && tx.id) {
        const hStudentId = String(tx.studentId || tx.userId || '').toLowerCase();
        const hStudentEmail = String(tx.studentEmail || tx.userEmail || '').toLowerCase();
        const matches = (pId && hStudentId === pId) || (pEmail && hStudentEmail === pEmail) || (!hStudentId && !hStudentEmail);
        if (matches) {
          uniqueMap.set(tx.id, tx);
        }
      }
    });

    return Array.from(uniqueMap.values());
  }, [history, profile, bookings]);

  const userCalculatedLessons = userHistory.reduce((acc, item) => {
    const val = parseFloat(item.lessons) || (parseFloat(item.amount) / 50) || 0;
    if (item.type === 'recharge' || item.type === 'refund' || val > 0) {
      return acc + Math.abs(val);
    }
    return acc - Math.abs(val);
  }, 0);

  const currentLessons = Math.max(0, userCalculatedLessons);
  
  const usedLessons = Math.round((userHistory
    .filter(h => h.type === 'payment')
    .reduce((sum, h) => sum + Math.abs(h.amount), 0)) / 50);

  const completedLessonsCount = userHistory
    .filter(h => h.type === 'payment' && h.status === 'Concluído').length;

  const handleSelectPlan = (plan) => {
    setSelectedPlanForPayment(plan);
    setIsAsaasModalOpen(true);
  };

  const handleAsaasPaymentSuccess = (paymentResult) => {
    setIsAsaasModalOpen(false);
    if (!selectedPlanForPayment) return;

    const plan = selectedPlanForPayment;

    // Registrar novas aulas creditadas no histórico exclusivo do aluno
    const newTx = {
      id: paymentResult?.transactionId || `tx_asaas_${Date.now()}`,
      studentId: profile?.id || 'student-user',
      studentEmail: profile?.email || '',
      studentMatricula: profile?.matricula_code || '',
      desc: `Assinatura ${plan.name} (+${plan.lessons} Aulas de 45 min)`,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      amount: plan.price,
      lessons: plan.lessons,
      type: 'recharge',
      status: 'Concluído'
    };

    setHistory(prev => {
      const updated = [newTx, ...prev];
      localStorage.setItem('lexy_wallet_history', JSON.stringify(updated));
      return updated;
    });

    if (typeof saveWalletTransaction === 'function') {
      saveWalletTransaction(newTx);
    }

    if (typeof activateSubscriptionAndCredits === 'function') {
      activateSubscriptionAndCredits({
        studentId: profile?.id,
        studentEmail: profile?.email,
        studentName: profile?.full_name || 'Aluno Lexy',
        studentMatricula: profile?.matricula_code,
        tutorId: 'tutor-default',
        planName: plan.name,
        planHours: plan.lessons,
        amount: plan.price
      });
    }

    setSuccessNotice(`🎉 Assinatura do ${plan.name} ativada com sucesso via Asaas! +${plan.lessons} Aulas (45 min) foram adicionadas ao seu saldo.`);
    setTimeout(() => setSuccessNotice(''), 7000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* A. HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Minhas Aulas & Agendamentos LexyPay
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Gerencie seu saldo de Aulas de 45 minutos disponíveis para agendar com tutores nativos.</p>
        </div>
      </div>

      {successNotice && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 p-4 rounded-2xl text-emerald-200 text-xs font-bold flex items-center gap-3 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* CARDS METRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KPI 1: Aulas Disponíveis */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Aulas Disponíveis (45 min)</span>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
              ● Saldo Ativo
            </span>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            {currentLessons.toFixed(0)} <span className="text-sm font-semibold text-slate-400">{currentLessons === 1 ? 'Aula' : 'Aulas'}</span>
          </p>
          <p className="text-[11px] text-emerald-400 font-medium">Créditos de 45 min livres para agendar</p>
        </div>

        {/* KPI 2: Aulas Utilizadas */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Aulas Realizadas</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            {usedLessons.toFixed(0)} <span className="text-sm font-semibold text-slate-400">{usedLessons === 1 ? 'Aula' : 'Aulas'}</span>
          </p>
          <p className="text-[11px] text-slate-400">Total de aulas de 45 min concluídas este mês</p>
        </div>

        {/* KPI 3: Aulas Concluídas */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Taxa de Conclusão</span>
            <Award className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {completedLessonsCount} {completedLessonsCount === 1 ? 'Aula' : 'Aulas'}
          </p>
          <p className="text-[11px] text-emerald-400 font-medium">100% Satisfação Garantida</p>
        </div>
      </div>

      {/* B. SECCIÓN DE PLANES DISPONIBLES DE AULAS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Planos de Aulas Disponíveis (Ciclo de 30 Dias)
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Aulas de 45 minutos creditadas na sua carteira</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-slate-900/60 backdrop-blur-md border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all relative overflow-hidden shadow-lg hover:scale-[1.02] ${
                plan.popular 
                  ? 'border-emerald-400/80 ring-2 ring-emerald-400/20' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider shadow">
                  MAIS POPULAR
                </div>
              )}

              <div className="space-y-2">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border inline-block ${plan.badgeBg}`}>
                  {plan.badge}
                </span>
                <h3 className="text-base font-black text-white">{plan.name}</h3>
                <p className="text-xs text-slate-400">{plan.frequency}</p>
                
                <div className="pt-2">
                  <div className="text-2xl font-black text-white tracking-tight">
                    +{plan.lessons} <span className="text-xs font-bold text-slate-400">Aulas (45 min)</span>
                  </div>
                  <div className="text-xs font-bold text-amber-400 mt-1">
                    R$ {plan.price.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ 30 dias</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                <span>Assinar {plan.name}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* C. HISTÓRICO DE TRANSAÇÕES */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <h3 className="font-semibold text-white text-sm">Histórico de Transações</h3>
          <span className="text-[10px] text-slate-400">Extrato Recente</span>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {userHistory.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Nenhuma transação registrada ainda. Assine um plano acima para adicionar aulas de 45 minutos!
            </div>
          ) : (
            userHistory.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:border-slate-700/60 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    item.type === 'recharge' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.type === 'recharge' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white text-xs">{item.desc}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{item.date}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-mono font-semibold text-xs block ${
                    item.type === 'recharge' ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {item.type === 'recharge' ? '+' : ''}R$ {Math.abs(item.amount).toFixed(2)}
                  </span>
                  <span className="bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0.5 rounded border border-slate-700/60 inline-block mt-0.5">
                    {item.status || 'Concluído'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedPlanForPayment && (
        <AsaasCheckoutModal
          isOpen={isAsaasModalOpen}
          onClose={() => setIsAsaasModalOpen(false)}
          amount={selectedPlanForPayment.price}
          description={`Assinatura ${selectedPlanForPayment.name} (+${selectedPlanForPayment.lessons} Aulas de 45 min / 30 Dias)`}
          isRecurring={true}
          lessonsCount={selectedPlanForPayment.lessons}
          customerInfo={{
            name: profile?.full_name || 'Aluno Lexy',
            email: profile?.email || 'aluno@lexy.com',
            document: profile?.documentNumber || '',
            phone: profile?.phone || ''
          }}
          onSuccess={handleAsaasPaymentSuccess}
        />
      )}

    </div>
  );
}
