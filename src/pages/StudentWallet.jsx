import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Wallet, ArrowRight, ArrowDownLeft, ArrowUpRight, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function StudentWallet() {
  const { profile, updateWalletBalance } = useAuth();
  const [amount, setAmount] = useState('50');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Historial simulado con reactividad al estado local
  const [history, setHistory] = useState([
    { id: 1, type: 'recharge', amount: 200, date: '10 Oct 2026', desc: 'Recarga Mercado Pago' },
    { id: 2, type: 'payment', amount: -65, date: '12 Oct 2026', desc: 'Aula com Lucía Fernández' },
    { id: 3, type: 'recharge', amount: 15, date: '14 Oct 2026', desc: 'Recarga promocional' }
  ]);

  const currentBalance = profile?.wallet_balance || 0;

  const handleRecharge = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setLoading(true);
    setSuccess(false);

    // Simular el proceso del Checkout de Mercado Pago
    setTimeout(async () => {
      await updateWalletBalance(numAmount);
      
      const newTx = {
        id: Date.now(),
        type: 'recharge',
        amount: numAmount,
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
        desc: 'Recarga Mercado Pago'
      };
      
      setHistory([newTx, ...history]);
      setLoading(false);
      setSuccess(true);
      setAmount('50');

      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-2">
          <span>Carteira Digital LexyPay</span>
          <span className="text-xs bg-cyan-500/20 text-cyan-300 font-bold px-2.5 py-1 rounded-full border border-cyan-400/30 uppercase tracking-wider">Oficial</span>
        </h1>
        <p className="text-slate-400 font-medium mt-1">Gerencie seu saldo em créditos com segurança instantânea.</p>
      </div>

      <div className="bg-amber-500/15 border border-amber-500/30 text-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-bold">⚠️ O saldo recarregado na plataforma não é reembolsável sob nenhuma hipótese.</span> Para assistência sobre este assunto, entre em contato com nosso suporte 24/7.
        </div>
        <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="text-amber-100 bg-amber-500/20 px-3 py-1.5 rounded-lg font-bold text-sm whitespace-nowrap border border-amber-500/40 hover:bg-amber-500/30 transition-colors">
          Suporte via WhatsApp
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Balance Card - Frutiger Aero Style */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-sky-500 to-cyan-400 border-0 shadow-[0_20px_50px_-12px_rgba(56,189,248,0.4)]">
           <div className="absolute top-0 left-0 right-0 h-32 bg-white/10 rounded-b-[100%] pointer-events-none" />
           <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />
           <div className="absolute top-[20%] right-[10%] w-16 h-16 bg-white/15 rounded-full border border-white/25 pointer-events-none" />
           
           <CardContent className="p-8 relative z-10 text-white space-y-6">
              <div className="flex items-center gap-3 bg-white/20 w-fit px-4 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">
                 <Wallet className="w-4 h-4 text-sky-100" />
                 <span className="text-xs font-bold uppercase tracking-wider text-sky-50">Saldo Disponível</span>
              </div>
              
              <div className="text-6xl font-black font-mono tracking-tighter flex items-end">
                <span className="text-4xl mr-1 pb-1">R$</span> 
                {currentBalance.toFixed(2).split('.')[0]}
                <span className="text-3xl text-sky-100">.{currentBalance.toFixed(2).split('.')[1]}</span>
              </div>
              
              <p className="text-sm text-cyan-50 font-medium">Saldo válido para qualquer tutor da plataforma Lexy.</p>
           </CardContent>
        </Card>

        {/* Recharge Action */}
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 shadow-xl shadow-slate-900/50 relative overflow-hidden text-slate-200">
          {success && (
            <div className="absolute inset-0 bg-sky-500/95 backdrop-blur-md z-20 flex flex-col items-center justify-center text-white animate-in fade-in zoom-in-95 duration-300">
               <CheckCircle className="w-16 h-16 mb-4 animate-[bounce_1s_ease-in-out_infinite]" />
               <h3 className="text-2xl font-black">Recarga Concluída!</h3>
               <p className="font-medium mt-1 text-sky-100">Seu saldo foi atualizado.</p>
            </div>
          )}
          
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Recarregar Saldo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor (R$)</label>
              <div className="flex gap-2">
                {['50', '100', '200'].map(val => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      amount === val 
                      ? 'border-sky-400 bg-sky-500/10 text-sky-400 shadow-sm' 
                      : 'border-slate-700 text-slate-400 hover:border-sky-400/50 hover:bg-slate-800'
                    }`}
                  >
                    R$ {val}
                  </button>
                ))}
              </div>
              <div className="relative mt-2">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                 <input 
                   type="number" 
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 bg-slate-950/50 backdrop-blur-sm border border-slate-700 rounded-xl font-mono text-lg font-bold text-white outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 transition-all shadow-inner"
                 />
              </div>
            </div>
            
            <Button 
              onClick={handleRecharge}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 hover:from-sky-400 hover:to-cyan-300 shadow-lg shadow-sky-500/20 h-12 text-base rounded-xl font-black flex items-center justify-center gap-2 border border-sky-400/50 transition-all hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-slate-950" /> Processando pagamento...
                </>
              ) : (
                <>
                  Pagar com Mercado Pago
                  <ArrowRight className="w-5 h-5 text-slate-950" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <h2 className="text-xl font-bold text-slate-100 mt-10 mb-4">Histórico de Transações</h2>
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-800/50">
          {history.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
               <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                   item.type === 'recharge' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                 }`}>
                   {item.type === 'recharge' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                 </div>
                 <div>
                   <p className="font-bold text-slate-200 text-sm">{item.desc}</p>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{item.date}</p>
                 </div>
               </div>
               <div className={`font-mono font-black text-lg ${
                 item.type === 'recharge' ? 'text-sky-400' : 'text-slate-200'
               }`}>
                 {item.type === 'recharge' ? '+' : ''}{item.amount.toFixed(2)}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
