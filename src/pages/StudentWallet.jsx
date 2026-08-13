import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Wallet, ArrowRight, ArrowDownLeft, ArrowUpRight, 
  CheckCircle, Loader2, CreditCard, ShieldCheck, CheckCircle2, Award, Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function StudentWallet() {
  const { profile, updateWalletBalance } = useAuth();
  const [amount, setAmount] = useState('50');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Historial simulado con reactividad al estado local
  const [history, setHistory] = useState([
    { id: 1, type: 'recharge', amount: 200, date: '10/08/2026', desc: 'Recarga via Mercado Pago (PIX)', status: 'Concluído' },
    { id: 2, type: 'payment', amount: -65, date: '11/08/2026', desc: 'Aula Individual com Lucía Fernández', status: 'Concluído' },
    { id: 3, type: 'recharge', amount: 15, date: '12/08/2026', desc: 'Bônus de Boas-Vindas LexyPay', status: 'Concluído' }
  ]);

  const currentBalance = profile?.wallet_balance || 0;

  const handleRecharge = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setLoading(true);
    setSuccess(false);

    // Simular o processo do Checkout de Mercado Pago
    setTimeout(async () => {
      await updateWalletBalance(numAmount);
      
      const newTx = {
        id: Date.now(),
        type: 'recharge',
        amount: numAmount,
        date: new Date().toLocaleDateString('pt-BR'),
        desc: 'Recarga via Mercado Pago',
        status: 'Concluído'
      };
      
      setHistory([newTx, ...history]);
      setLoading(false);
      setSuccess(true);
      setAmount('50');

      setTimeout(() => setSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      
      {/* HEADER DA CARTEIRA DIGITAL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <span>Carteira Digital LexyPay</span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-semibold px-2 py-0.5 rounded-full border border-cyan-500/30 uppercase tracking-wider">
              Oficial
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Gerencie seu saldo em créditos para agendamentos instantâneos.</p>
        </div>
      </div>

      {/* A. FILA DE KPIS (3 TARJETAS COMPACTAS ESTÁNDAR WISE/STRIPE) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KPI 1: Saldo Disponível */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Saldo Disponível</span>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
              ● Carteira Ativa
            </span>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            R$ {currentBalance.toFixed(2)}
          </p>
          <p className="text-[11px] text-cyan-400 font-medium">Válido para agendamentos no Lexy Space</p>
        </div>

        {/* KPI 2: Créditos Utilizados */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Créditos Utilizados</span>
            <Wallet className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            R$ 65,00
          </p>
          <p className="text-[11px] text-slate-400">Total investido este mês</p>
        </div>

        {/* KPI 3: Aulas Realizadas */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Aulas Concluídas</span>
            <Award className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            1 Aula
          </p>
          <p className="text-[11px] text-emerald-400 font-medium">100% Satisfação Garantida</p>
        </div>
      </div>

      {/* B. LAYOUT 2 COLUMNAS PARA RECARGA E HISTORIQUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* COLUMNA 1: MÓDULO DE RECARGA (span-1) */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-4 space-y-4 shadow-sm relative overflow-hidden">
          {success && (
            <div className="absolute inset-0 bg-cyan-500/95 backdrop-blur-md z-20 flex flex-col items-center justify-center text-slate-950 p-4 text-center animate-fade-in">
              <CheckCircle2 className="w-10 h-10 mb-2" />
              <h3 className="text-base font-bold">Recarga Concluída!</h3>
              <p className="text-xs font-medium mt-0.5">Seu saldo foi atualizado instantaneamente.</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-white text-sm">Recarregar Saldo LexyPay</h3>
            <p className="text-xs text-slate-400 mt-0.5">Escolha o valor e pague via PIX ou Cartão.</p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Valores Rápidos</label>
            <div className="grid grid-cols-3 gap-2">
              {['50', '100', '200'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    amount === val 
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-sm' 
                      : 'border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-white bg-slate-950/40'
                  }`}
                >
                  R$ {val}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Valor Personalizado</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">R$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs font-semibold text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleRecharge}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Processando pagamento...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Pagar com Mercado Pago</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            ⚠️ Transações protegidas via Mercado Pago. O saldo não é reembolsável.
          </p>
        </div>

        {/* COLUMNA 2: HISTÓRICO DE TRANSAÇÕES (span-2) */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <h3 className="font-semibold text-white text-sm">Histórico de Transações</h3>
            <span className="text-[10px] text-slate-400">Extrato Recente</span>
          </div>

          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-lg flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.type === 'recharge' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/60 text-slate-400 border border-slate-700/60'
                  }`}>
                    {item.type === 'recharge' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
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
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
