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
    { id: 2, type: 'payment', amount: -65, date: '12 Oct 2026', desc: 'Clase con Lucía Fernández' },
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
        date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
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
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Mi Billetera Virtual</h1>
        <p className="text-slate-500 font-medium mt-1">Gestiona tu saldo para reservar clases al instante.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Balance Card - Frutiger Aero Style */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-400 border-0 shadow-[0_20px_50px_-12px_rgba(20,184,166,0.4)]">
           <div className="absolute top-0 left-0 right-0 h-32 bg-white/10 rounded-b-[100%] pointer-events-none" />
           <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />
           <div className="absolute top-[20%] right-[10%] w-16 h-16 bg-white/15 rounded-full border border-white/25 pointer-events-none" />
           
           <CardContent className="p-8 relative z-10 text-white space-y-6">
              <div className="flex items-center gap-3 bg-white/20 w-fit px-4 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">
                 <Wallet className="w-4 h-4 text-emerald-100" />
                 <span className="text-xs font-bold uppercase tracking-wider text-emerald-50">Saldo Disponible</span>
              </div>
              
              <div className="text-6xl font-black font-mono tracking-tighter flex items-end">
                <span className="text-4xl mr-1 pb-1">R$</span> 
                {currentBalance.toFixed(2).split('.')[0]}
                <span className="text-3xl text-emerald-100">.{currentBalance.toFixed(2).split('.')[1]}</span>
              </div>
              
              <p className="text-sm text-cyan-50 font-medium">Saldo válido para cualquier tutor de la plataforma.</p>
           </CardContent>
        </Card>

        {/* Recharge Action */}
        <Card className="bg-white/60 backdrop-blur-xl border-white/40 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          {success && (
            <div className="absolute inset-0 bg-emerald-500/95 backdrop-blur-md z-20 flex flex-col items-center justify-center text-white animate-in fade-in zoom-in-95 duration-300">
               <CheckCircle className="w-16 h-16 mb-4 animate-[bounce_1s_ease-in-out_infinite]" />
               <h3 className="text-2xl font-black">¡Recarga Exitosa!</h3>
               <p className="font-medium mt-1 text-emerald-100">Tu saldo ha sido actualizado.</p>
            </div>
          )}
          
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Recargar Saldo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monto (R$)</label>
              <div className="flex gap-2">
                {['50', '100', '200'].map(val => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      amount === val 
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm' 
                      : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                  >
                    R$ {val}
                  </button>
                ))}
              </div>
              <div className="relative mt-2">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                 <input 
                   type="number" 
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl font-mono text-lg font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all shadow-inner"
                 />
              </div>
            </div>
            
            <Button 
              onClick={handleRecharge}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:from-emerald-600 hover:to-teal-500 shadow-lg shadow-emerald-200 h-12 text-base rounded-xl font-black flex items-center justify-center gap-2 border border-emerald-400/50 transition-all hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Procesando pago...
                </>
              ) : (
                <>
                  Pagar con Mercado Pago
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <h2 className="text-xl font-bold text-slate-800 mt-10 mb-4">Historial de Transacciones</h2>
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {history.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/90 transition-colors">
               <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                   item.type === 'recharge' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200/50' : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                 }`}>
                   {item.type === 'recharge' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                 </div>
                 <div>
                   <p className="font-bold text-slate-800 text-sm">{item.desc}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{item.date}</p>
                 </div>
               </div>
               <div className={`font-mono font-black text-lg ${
                 item.type === 'recharge' ? 'text-emerald-500' : 'text-slate-800'
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
