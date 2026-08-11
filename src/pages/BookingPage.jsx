import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { 
  Calendar, Clock, CheckCircle2, ShieldCheck, CreditCard, 
  Wallet, FileText, ArrowLeft, Sparkles, Lock, Gift, AlertCircle, RefreshCw 
} from 'lucide-react';
import { subscriptionPackages } from '../data/mockTutors';

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tutors, student, canBookTrial, createBooking } = useMarketplace();

  const tutor = tutors.find(t => t.id === id) || tutors[0];

  // Verificar si el alumno YA usó la aula experimental única con este profesor
  const isTrialAllowed = canBookTrial(tutor.id);

  const initialTab = searchParams.get('tab') === 'packages' || !isTrialAllowed ? 'package' : 'trial';

  const [bookingType, setBookingType] = useState(initialTab); // 'trial' | 'package'
  const [selectedPackage, setSelectedPackage] = useState(subscriptionPackages[1]); // 8h / 28 dias (2 aulas/semana)
  
  // Días y Horarios disponibles configurados por el tutor de forma autónoma
  const tutorSchedule = tutor.weeklySchedule || {
    'Segunda': ['09:00', '10:00', '14:00', '15:00'],
    'Terça': ['09:00', '10:00', '14:00', '15:00'],
    'Quarta': ['09:00', '10:00', '14:00', '15:00'],
    'Quinta': ['09:00', '10:00', '14:00', '15:00'],
    'Sexta': ['09:00', '10:00', '14:00', '15:00']
  };

  const availableDays = Object.keys(tutorSchedule).filter(d => (tutorSchedule[d] || []).length > 0);

  // Cantidad de aulas por semana contratadas según el paquete elegido
  const neededSlotsCount = bookingType === 'trial' 
    ? 1 
    : selectedPackage.hours === 4 ? 1 
    : selectedPackage.hours === 8 ? 2 
    : selectedPackage.hours === 12 ? 3 : 4;

  // Estado dinámico de selección de slots por semana
  const [selectedSlots, setSelectedSlots] = useState(() => {
    return Array.from({ length: 4 }, (_, idx) => ({
      day: availableDays[idx % availableDays.length] || 'Segunda',
      time: (tutorSchedule[availableDays[idx % availableDays.length]] || ['09:00'])[0] || '09:00'
    }));
  });

  // Ajustar slots al cambiar paquete o día
  const handleSlotChange = (index, field, value) => {
    setSelectedSlots(prev => {
      const copy = [...prev];
      if (field === 'day') {
        const availableTimesForDay = tutorSchedule[value] || ['09:00'];
        copy[index] = {
          day: value,
          time: availableTimesForDay[0] || '09:00'
        };
      } else {
        copy[index] = {
          ...copy[index],
          time: value
        };
      }
      return copy;
    });
  };

  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [insufficientBalanceError, setInsufficientBalanceError] = useState(null);

  // Cálculo del valor total
  const totalAmount = bookingType === 'trial' 
    ? tutor.trialRate 
    : Number((tutor.hourlyRate * selectedPackage.hours * (1 - selectedPackage.discountPercent / 100)).toFixed(2));

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInsufficientBalanceError(null);
    setIsProcessing(true);

    const activeSlots = selectedSlots.slice(0, neededSlotsCount);
    const primarySlot = activeSlots[0];

    setTimeout(() => {
      setIsProcessing(false);

      // Ejecutar reserva en MarketplaceContext bloqueando los slots seleccionados
      const result = createBooking({
        tutorId: tutor.id,
        day: primarySlot.day,
        time: primarySlot.time,
        allSlots: activeSlots,
        bookingType,
        planHours: selectedPackage.hours,
        totalAmount
      });

      if (!result.success) {
        if (result.error === 'insufficient_funds') {
          setInsufficientBalanceError({
            required: result.required,
            current: result.current
          });
        } else if (result.error === 'trial_already_used') {
          setErrorMessage(result.message);
          setBookingType('package');
        } else {
          setErrorMessage('Erro ao processar reserva. Tente novamente.');
        }
        return;
      }

      setIsSuccess(true);
    }, 1000);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in-up">
        <div className="glass-panel rounded-3xl p-8 text-center space-y-6 border border-emerald-500/40 glow-cyan">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white">¡Aulas Reservadas com Sucesso!</h2>
            <p className="text-sm text-slate-300">
              Sua contratação com <strong className="text-cyan-300">{tutor.name}</strong> foi confirmada e os horários foram bloqueados na agenda do professor.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-left text-xs space-y-2.5">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400 font-medium">Modalidade:</span>
              <strong className="text-white font-bold">{bookingType === 'trial' ? 'Aula Experimental (25 min)' : `Assinatura de 28 Dias (${selectedPackage.hours}h / ${neededSlotsCount}x por semana)`}</strong>
            </div>
            
            <div className="py-2 border-b border-slate-800 space-y-1">
              <span className="text-slate-400 font-medium block">Horários Semanais Reservados:</span>
              {selectedSlots.slice(0, neededSlotsCount).map((slot, idx) => (
                <div key={idx} className="flex justify-between font-bold text-cyan-300">
                  <span>Aula {idx + 1}:</span>
                  <span>{slot.day} às {slot.time}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400 font-medium">Valor Descontado do Saldo:</span>
              <strong className="text-emerald-400 font-black text-sm">${totalAmount} USD</strong>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/classroom/booking-demo-1')}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20"
            >
              🚀 Entrar na Sala Virtual
            </button>
            
            <button
              onClick={() => navigate('/dashboard/student')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs px-6 py-3.5 rounded-xl"
            >
              Ir para o Painel do Aluno
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      
      {/* Botón Volver */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para o perfil de {tutor.name}
      </button>

      {/* Alerta de Saldo Insuficiente */}
      {insufficientBalanceError && (
        <div className="bg-rose-500/20 border-2 border-rose-500 text-rose-200 p-5 rounded-3xl space-y-3 animate-shake">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <h3 className="font-extrabold text-white text-base">Saldo Insuficiente na Billetera!</h3>
              <p className="text-xs text-rose-200 mt-0.5">
                Você possui <strong className="text-white">${insufficientBalanceError.current.toFixed(2)} USD</strong> e o valor necessário é <strong className="text-white">${insufficientBalanceError.required.toFixed(2)} USD</strong>.
              </p>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Link
              to="/dashboard/student/wallet"
              className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow flex items-center gap-1.5"
            >
              <Wallet className="w-4 h-4" />
              <span>Recarregar Saldo Agora</span>
            </Link>
          </div>
        </div>
      )}

      {/* Error genérico */}
      {errorMessage && (
        <div className="bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-bold p-4 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="glass-panel rounded-3xl p-6 sm:p-10 space-y-8 border border-cyan-500/30">
        
        {/* Encabezado de la Reserva */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <img src={tutor.avatar} alt={tutor.name} className="w-16 h-16 rounded-2xl object-cover border border-cyan-400" />
            <div>
              <h1 className="text-2xl font-extrabold text-white">Agendar com {tutor.name}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{tutor.subject} • {tutor.flag} {tutor.country}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Seu Saldo Atual</span>
            <span className="text-xl font-black text-emerald-400">${student.walletBalance.toFixed(2)} USD</span>
          </div>
        </div>

        {/* Paso 1: Selección de Modalidad */}
        <div className="space-y-3">
          <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">1. Escolha a Modalidade</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Aula Experimental */}
            <div
              onClick={() => {
                if (isTrialAllowed) setBookingType('trial');
              }}
              className={`p-5 rounded-2xl border transition-all ${
                !isTrialAllowed 
                  ? 'opacity-40 bg-slate-950 border-slate-900 cursor-not-allowed' 
                  : bookingType === 'trial'
                  ? 'bg-cyan-500/15 border-cyan-400 glow-cyan cursor-pointer'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 cursor-pointer'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                  <Gift className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                  Única Vez por Professor
                </span>
              </div>
              <h3 className="font-extrabold text-white text-base">Aula Experimental (25 min)</h3>
              <p className="text-xs text-slate-400 mt-1">Conheça o tutor, defina seus objetivos e faça o teste de nível.</p>
              <div className="mt-3 text-lg font-black text-cyan-300">
                ${tutor.trialRate} USD {!isTrialAllowed && '(Já Utilizada)'}
              </div>
            </div>

            {/* Suscripción de 28 Días */}
            <div
              onClick={() => setBookingType('package')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                bookingType === 'package'
                  ? 'bg-amber-500/15 border-amber-400 glow-gold'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Ciclo de 28 Dias
                </span>
              </div>
              <h3 className="font-extrabold text-white text-base">Assinatura de 28 Dias</h3>
              <p className="text-xs text-slate-400 mt-1">Pacote completo cobrado a cada 28 dias do seu saldo da billetera.</p>
              <div className="mt-3 text-lg font-black text-amber-300">
                A partir de ${ (tutor.hourlyRate * 4 * 0.9).toFixed(0) } USD / 28 dias
              </div>
            </div>

          </div>
        </div>

        {/* Si es Assinatura de 28 Dias: Seleccionar plan de horas */}
        {bookingType === 'package' && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Selecione o Plano de Horas (Ciclo de 28 Dias)</label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {subscriptionPackages.map(pkg => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
                    selectedPackage.id === pkg.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black block">{pkg.hours} Horas / 28 dias</span>
                  <span className="text-[10px] font-bold text-amber-400 block my-0.5">{pkg.hours / 4} aula(s) por semana</span>
                  <span className="text-sm font-extrabold text-white block">
                    ${ (tutor.hourlyRate * pkg.hours * (1 - pkg.discountPercent/100)).toFixed(2) } USD
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-1">
              <strong className="text-amber-400 block font-bold">📌 Regra de Gestão de Horas:</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Você contratou <strong>{neededSlotsCount} aula(s) por semana</strong>. Selecione abaixo os {neededSlotsCount} dia(s) e horário(s) na agenda do professor.
              </p>
            </div>
          </div>
        )}

        {/* ── PASO 2: SELECCIÓN DINÁMICA DE DÍAS Y HORARIOS DISPONIBLES DEL PROFESOR ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              2. Selecione os {neededSlotsCount} Dia(s) e Horário(s) Disponíveis do Professor
            </label>
            <span className="text-xs font-extrabold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
              Frequência: {neededSlotsCount} aula(s) semanal(is)
            </span>
          </div>

          <div className="space-y-3">
            {Array.from({ length: neededSlotsCount }).map((_, index) => {
              const currentSlot = selectedSlots[index] || { day: availableDays[0] || 'Segunda', time: '09:00' };
              const availableTimes = tutorSchedule[currentSlot.day] || ['09:00'];

              return (
                <div
                  key={index}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 font-black text-xs flex items-center justify-center">
                      #{index + 1}
                    </div>
                    <span className="font-extrabold text-white text-xs">Aula Semanal {index + 1}:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    {/* Selector de Día (Solo días disponibles en la agenda del tutor) */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <select
                        value={currentSlot.day}
                        onChange={(e) => handleSlotChange(index, 'day', e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-cyan-400"
                      >
                        {availableDays.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Selector de Horario (Solo horarios libres configurados por el tutor) */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <select
                        value={currentSlot.time}
                        onChange={(e) => handleSlotChange(index, 'time', e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-cyan-300 font-bold text-xs rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-cyan-400"
                      >
                        {availableTimes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen Final y Botón de Cobro */}
        <form onSubmit={handleConfirmBooking} className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Valor Total com Saldo da Billetera:</span>
            <span className="text-3xl font-black text-emerald-400">${totalAmount} USD</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-sm px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{isProcessing ? 'Processando...' : 'Confirmar e Reservar Horários'}</span>
          </button>
        </form>

      </div>
    </div>
  );
}
