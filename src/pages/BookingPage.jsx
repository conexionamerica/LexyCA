import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, Clock, CheckCircle2, ShieldCheck, CreditCard, 
  Wallet, FileText, ArrowLeft, Sparkles, Lock, Gift, AlertCircle, RefreshCw, X 
} from 'lucide-react';
import { subscriptionPackages } from '../data/mockTutors';
import StoneCheckoutModal from '../components/payment/StoneCheckoutModal';

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tutors, student, bookings, canBookTrial, createBooking, packageDiscounts, getTutorPackageDiscount } = useMarketplace();
  const { profile } = useAuth();

  const tutor = tutors.find(t => t.id === id) || tutors[0];

  if (!tutor) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white">Em breve...</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
          Professor não encontrado para agendamento. Novos tutores reais estão cadastrando seus horários na plataforma Lexy.
        </p>
        <button
          onClick={() => navigate('/explore')}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all cursor-pointer"
        >
          Explorar Professores
        </button>
      </div>
    );
  }

  // Verificar si el alumno YA usó la aula experimental única con este profesor
  const isTrialAllowed = canBookTrial(tutor.id);

  const initialTab = searchParams.get('tab') === 'packages' || !isTrialAllowed ? 'package' : 'trial';

  const [bookingType, setBookingType] = useState(initialTab); // 'trial' | 'package'
  const [selectedPackage, setSelectedPackage] = useState(subscriptionPackages[1]); // 8h / 28 dias (2 aulas/semana)
  
  const tutorSchedule = tutor.weeklySchedule || {};

  // HELPER: Obtener horarios 100% libres (activos por el profesor Y no ocupados por ningún alumno)
  const getFreeSlotsForDay = (dayName) => {
    const teacherSlots = tutorSchedule[dayName] || tutorSchedule[dayName?.split('-')[0]] || [];
    
    const occupiedTimes = (bookings || [])
      .filter(b => b.tutorId === tutor?.id && (b.status === 'confirmed' || b.status === 'rescheduled'))
      .filter(b => {
        const cleanBookingDay = String(b.day || '').split(' (')[0].trim().toLowerCase();
        const cleanTargetDay = String(dayName || '').split('-')[0].trim().toLowerCase();
        return cleanBookingDay === cleanTargetDay;
      })
      .map(b => String(b.time || '').trim());

    return teacherSlots.filter(t => !occupiedTimes.includes(String(t).trim()));
  };

  const availableDays = Object.keys(tutorSchedule).filter(d => getFreeSlotsForDay(d).length > 0);

  const hourlyRate = Number(tutor?.hourlyRate || tutor?.hourly_rate || tutor?.rate || 20);
  const trialRate = Number(tutor?.trialRate || tutor?.trial_rate || Math.round(hourlyRate * 0.5));

  const pkgHours = selectedPackage?.hours || selectedPackage?.lessonsCount || 4;
  const pkgDiscount = getTutorPackageDiscount ? getTutorPackageDiscount(packageDiscounts, tutor?.id, selectedPackage?.id) : 0;

  // Cantidad de aulas por semana contratadas según el paquete elegido
  const neededSlotsCount = bookingType === 'trial' 
    ? 1 
    : (selectedPackage?.lessonsPerWeek || (pkgHours === 4 ? 1 : pkgHours === 8 ? 2 : pkgHours === 12 ? 3 : 4));

  // Estado dinámico de selección de slots por semana
  const [selectedSlots, setSelectedSlots] = useState(() => {
    return Array.from({ length: 4 }, (_, idx) => {
      const targetDay = availableDays[idx % availableDays.length] || Object.keys(tutorSchedule)[0] || 'Segunda';
      const freeForDay = getFreeSlotsForDay(targetDay);
      return {
        day: targetDay,
        time: freeForDay[0] || (tutorSchedule[targetDay] || ['09:00'])[0] || '09:00'
      };
    });
  });

  // Ajustar slots al cambiar paquete o día
  const handleSlotChange = (index, field, value) => {
    setSelectedSlots(prev => {
      const copy = [...prev];
      if (field === 'day') {
        const freeTimes = getFreeSlotsForDay(value);
        copy[index] = {
          day: value,
          time: freeTimes[0] || (tutorSchedule[value] || ['09:00'])[0] || '09:00'
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
  const [isStoneModalOpen, setIsStoneModalOpen] = useState(false);

  // Cálculo del valor total
  const totalAmount = bookingType === 'trial' 
    ? trialRate 
    : Number((hourlyRate * pkgHours * (1 - pkgDiscount / 100)).toFixed(2));

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
        planHours: selectedPackage.hours || 8,
        planName: selectedPackage.name || `Plano ${selectedPackage.hours || 8}h`,
        totalAmount,
        studentId: profile?.id,
        studentEmail: profile?.email,
        studentName: profile?.full_name,
        studentMatricula: profile?.matricula_code
      });

      if (!result.success) {
        if (result.error === 'insufficient_funds') {
          setInsufficientBalanceError({
            required: result.required,
            current: result.current
          });
          // Abrir modal de pagamento Stone para completar cobrança em Reais
          setIsStoneModalOpen(true);
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

  const handleStoneBookingPaymentSuccess = (paymentResult) => {
    setIsStoneModalOpen(false);
    const activeSlots = selectedSlots.slice(0, neededSlotsCount);
    const primarySlot = activeSlots[0];

    // Forçar reserva aprovada por Stone Pagamentos S.A.
    createBooking({
      tutorId: tutor.id,
      day: primarySlot.day,
      time: primarySlot.time,
      allSlots: activeSlots,
      bookingType,
      planHours: selectedPackage.hours || 8,
      planName: selectedPackage.name || `Plano ${selectedPackage.hours || 8}h`,
      totalAmount,
      bypassWallet: true,
      paymentId: paymentResult.transactionId,
      studentId: profile?.id,
      studentEmail: profile?.email,
      studentName: profile?.full_name,
      studentMatricula: profile?.matricula_code
    });

    setIsSuccess(true);
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
              <strong className="text-emerald-400 font-black text-sm">R$ {totalAmount}</strong>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard/student?tab=inicio')}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Ir para Início e Acessar Minha Aula Agendada</span>
            </button>
            
            <button
              onClick={() => navigate('/dashboard/student?tab=carteira')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs px-6 py-3.5 rounded-xl cursor-pointer"
            >
              Ver Minha Carteira
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

      {/* Modal Popup de Saldo Insuficiente na Carteira (Centralizado com React Portal) */}
      {insufficientBalanceError && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 glow-rose text-center">
            
            {/* Botão Cerrar */}
            <button
              onClick={() => setInsufficientBalanceError(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Ícono de Alerta */}
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 animate-bounce">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white">Saldo Insuficiente na Carteira!</h3>
              <p className="text-xs sm:text-sm text-rose-200 leading-relaxed font-medium">
                Você possui <strong className="text-white font-bold">R$ {insufficientBalanceError.current.toFixed(2)}</strong> e o valor necessário para confirmar esta reserva é <strong className="text-white font-bold">R$ {insufficientBalanceError.required.toFixed(2)}</strong>.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setInsufficientBalanceError(null);
                  navigate('/dashboard/student?tab=carteira');
                }}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 text-white font-black text-xs sm:text-sm py-3.5 px-6 rounded-xl shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Recarregar Saldo Agora</span>
              </button>

              <button
                onClick={() => setInsufficientBalanceError(null)}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Error genérico */}
      {errorMessage && (
        <div className="bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-bold p-4 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="glass-panel rounded-3xl p-6 sm:p-10 space-y-8 border border-cyan-500/30">
        
        {/* Encabezado del Profesor */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <img src={tutor.avatar} alt={tutor.name} className="w-16 h-16 rounded-2xl object-cover border border-cyan-400" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aula Experimental de Idiomas (25 min)</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">Reservar Aula com {tutor.name}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{tutor.subject} • {tutor.flag} {tutor.country}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Valor Único da Aula de Teste</span>
            <span className="text-xl font-black text-emerald-400">R$ {trialRate.toFixed(2)}</span>
          </div>
        </div>

        {/* PASO 1: SELECCIONAR DIA Y HORARIO LIBRE DO PROFESOR */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              1. Selecione o Dia e Horário Disponível na Agenda Nativa do Professor
            </label>
            <span className="text-xs font-extrabold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
              Duração: 25 minutos
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 font-black text-xs flex items-center justify-center">
                #1
              </div>
              <span className="font-extrabold text-white text-xs">Dia e Horário Escolhido:</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              {/* Selector de Día */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <select
                  value={selectedSlots[0]?.day || availableDays[0] || 'Segunda'}
                  onChange={(e) => handleSlotChange(0, 'day', e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-cyan-400"
                >
                  {availableDays.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Horario Libre */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <select
                  value={selectedSlots[0]?.time || (getFreeSlotsForDay(selectedSlots[0]?.day || availableDays[0])[0]) || '09:00'}
                  onChange={(e) => handleSlotChange(0, 'time', e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-cyan-300 font-bold text-xs rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-cyan-400"
                >
                  {getFreeSlotsForDay(selectedSlots[0]?.day || availableDays[0]).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* PASO 2: FORMAS DE PAGAMENTO HABILITADAS (CARTÃO E PIX BRASIL) */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
            2. Escolha a Forma de Pagamento Único (Stone Pagamentos S.A.)
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-xs">Cartão de Crédito</h4>
                <p className="text-[11px] text-slate-400">Aprovação instantânea via Stone S.A.</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-xs">PIX Brasil 🇧🇷</h4>
                <p className="text-[11px] text-slate-400">QR Code e Chave Copia e Cola instantâneo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botón Principal de Pago */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Valor Total da Aula Experimental:</span>
            <span className="text-3xl font-black text-emerald-400">R$ {trialRate.toFixed(2)}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsStoneModalOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-sm px-8 py-4 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Pagar R$ {trialRate.toFixed(2)} e Confirmar Agendamento ⚡</span>
          </button>
        </div>

      </div>

      <StoneCheckoutModal
        isOpen={isStoneModalOpen}
        onClose={() => setIsStoneModalOpen(false)}
        amount={trialRate}
        description={`Aula Experimental (25 min) - ${tutor?.name || 'Professor Lexy'}`}
        isRecurring={false}
        customerInfo={{
          name: profile?.full_name || student?.name || 'Aluno Lexy',
          email: profile?.email || student?.email || 'aluno@lexy.com',
          document: profile?.documentNumber || '603.198.610-82'
        }}
        onSuccess={handleStoneBookingPaymentSuccess}
      />

    </div>
  );
}
