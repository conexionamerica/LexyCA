import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Wallet, ArrowRight, ArrowDownLeft, ArrowUpRight, 
  CheckCircle, Loader2, CreditCard, ShieldCheck, CheckCircle2, Award, Clock, Sparkles, Zap, Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMarketplace } from '../contexts/MarketplaceContext';
import StoneCheckoutModal from '../components/payment/StoneCheckoutModal';

export default function StudentWallet() {
  const { profile } = useAuth();
  const { activateSubscriptionAndCredits } = useMarketplace();
  
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [isStoneModalOpen, setIsStoneModalOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  // Planos de Aulas Oficiais Lexy (Ciclo de 28 Dias)
  const plans = [
    {
      id: 'plan-start',
      name: 'Plano Start',
      hours: 4,
      frequency: '1 aula / semana',
      price: 200,
      badge: 'Ciclo 28 Dias',
      badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
      popular: false
    },
    {
      id: 'plan-pro',
      name: 'Plano Pro',
      hours: 8,
      frequency: '2 aulas / semana',
      price: 360,
      badge: '🔥 10% OFF • Mais Popular',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      popular: true
    },
    {
      id: 'plan-intensivo',
      name: 'Plano Intensivo',
      hours: 12,
      frequency: '3 aulas / semana',
      price: 504,
      badge: '🔥 16% OFF',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      popular: false
    },
    {
      id: 'plan-fluencia',
      name: 'Plano Fluência',
      hours: 16,
      frequency: '4 aulas / semana',
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
        console.error('Error cargando historial de carteira', e);
      }
    }
    return [];
  });

  const userHistory = useMemo(() => {
    if (!profile) return [];
    const pId = String(profile.id || '').toLowerCase();
    const pEmail = String(profile.email || '').toLowerCase();

    return (history || []).filter(h => {
      const hStudentId = String(h.studentId || h.userId || '').toLowerCase();
      const hStudentEmail = String(h.studentEmail || h.userEmail || '').toLowerCase();

      if (hStudentId || hStudentEmail) {
        return (pId && hStudentId === pId) || (pEmail && hStudentEmail === pEmail);
      }
      return false;
    });
  }, [history, profile]);

  const userCalculatedHours = userHistory.reduce((acc, item) => {
    const val = parseFloat(item.hours) || (parseFloat(item.amount) / 50) || 0;
    if (item.type === 'recharge' || item.type === 'refund' || val > 0) {
      return acc + Math.abs(val);
    }
    return acc - Math.abs(val);
  }, 0);

  // Garantir que um novo usuario sempre inicie com 0.0 Horas
  const currentHours = Math.max(0, userCalculatedHours);
  
  const usedHours = (userHistory
    .filter(h => h.type === 'payment')
    .reduce((sum, h) => sum + Math.abs(h.amount), 0)) / 50;

  const completedLessonsCount = userHistory
    .filter(h => h.type === 'payment' && h.status === 'Concluído').length;

  const handleSelectPlan = (plan) => {
    setSelectedPlanForPayment(plan);
    setIsStoneModalOpen(true);
  };

  const handleStonePaymentSuccess = (paymentResult) => {
    setIsStoneModalOpen(false);
    if (!selectedPlanForPayment) return;

    const plan = selectedPlanForPayment;

    // Registrar novas horas creditadas no histórico exclusivo do aluno
    const newTx = {
      id: paymentResult?.transactionId || `tx_${Date.now()}`,
      studentId: profile?.id || 'student-user',
      studentEmail: profile?.email || '',
      studentMatricula: profile?.matricula_code || '',
      desc: `Assinatura ${plan.name} (+${plan.hours} Horas de Crédito)`,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      amount: plan.price,
      hours: plan.hours,
      type: 'recharge',
      status: 'Concluído'
    };

    setHistory(prev => {
      const updated = [newTx, ...prev];
      localStorage.setItem('lexy_wallet_history', JSON.stringify(updated));
      return updated;
    });

    if (typeof activateSubscriptionAndCredits === 'function') {
      activateSubscriptionAndCredits({
        studentId: profile?.id,
        studentEmail: profile?.email,
        studentName: profile?.full_name || 'Aluno Lexy',
        studentMatricula: profile?.matricula_code,
        tutorId: 'tutor-default',
        planName: plan.name,
        planHours: plan.hours,
        amount: plan.price
      });
    }

    setSuccessNotice(`🎉 Assinatura do ${plan.name} ativada com sucesso! +${plan.hours} Horas foram adicionadas às suas Horas Disponíveis.`);
    setTimeout(() => setSuccessNotice(''), 7000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* A. HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Minhas Horas & Agendamentos LexyPay
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Gerencie seu saldo de horas de aula disponíveis para agendamentos com qualquer professor.</p>
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
        {/* KPI 1: Horas Disponíveis */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Horas Disponíveis</span>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
              ● Saldo Ativo
            </span>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            {currentHours.toFixed(1)} <span className="text-sm font-semibold text-slate-400">{currentHours === 1 ? 'Hora' : 'Horas'}</span>
          </p>
          <p className="text-[11px] text-cyan-400 font-medium">Créditos livres para agendar no Catálogo</p>
        </div>

        {/* KPI 2: Horas Utilizadas */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Horas Utilizadas</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            {usedHours.toFixed(1)} <span className="text-sm font-semibold text-slate-400">{usedHours === 1 ? 'Hora' : 'Horas'}</span>
          </p>
          <p className="text-[11px] text-slate-400">Total de horas assistidas este mês</p>
        </div>

        {/* KPI 3: Aulas Realizadas */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Aulas Concluídas</span>
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
            Planos de Aulas Disponíveis (Ciclo de 28 Dias)
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">As horas assinas são creditadas na sua carteira</span>
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
                    +{plan.hours}.0 <span className="text-xs font-bold text-slate-400">Horas de Crédito</span>
                  </div>
                  <div className="text-xs font-bold text-amber-400 mt-1">
                    R$ {plan.price.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ 28 dias</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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
              Nenhuma transação registrada ainda. Assine um plano acima para adicionar horas!
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
        <StoneCheckoutModal
          isOpen={isStoneModalOpen}
          onClose={() => setIsStoneModalOpen(false)}
          amount={selectedPlanForPayment.price}
          description={`Assinatura ${selectedPlanForPayment.name} (+${selectedPlanForPayment.hours} Horas de Crédito / 28 Dias)`}
          isRecurring={true}
          customerInfo={{
            name: profile?.full_name || 'Aluno Lexy',
            email: profile?.email || 'aluno@lexy.com',
            document: profile?.documentNumber || '603.198.610-82'
          }}
          onSuccess={handleStonePaymentSuccess}
        />
      )}

    </div>
  );
}
