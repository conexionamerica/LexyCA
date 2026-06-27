import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import MercadoPagoCardForm from './components/MercadoPagoCardForm';
import { 
  BookOpen, 
  Wallet, 
  Calendar, 
  UserCheck, 
  Search, 
  Clock, 
  Video, 
  Star, 
  DollarSign, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Globe, 
  ArrowRight,
  Shield
} from 'lucide-react';

// =========================================================================
// MOCK DATA PARA MODO DEMOSTRACIÓN (FALLBACK DE SUPABASE)
// =========================================================================
const MOCK_TEACHERS = [
  {
    id: "t1-uuid-value",
    name: "Alexandre Silva",
    email: "alexandre.silva@example.com",
    bio: "Profesor nativo de São Paulo. Más de 8 años enseñando portugués a hispanohablantes. Especialista en pronunciación y modismos de Brasil.",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    hourly_rate: 60.00,
    rating: 4.95,
    commission_tier: 0.20,
    timezone: "America/Sao_Paulo",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "t2-uuid-value",
    name: "Lucía Fernández",
    email: "lucia.fernandez@example.com",
    bio: "Filóloga y tutora de Español y Portugués de negocios. Clases dinámicas enfocadas en entrevistas de trabajo y presentaciones corporativas.",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    hourly_rate: 85.00,
    rating: 4.88,
    commission_tier: 0.15,
    timezone: "Europe/Madrid",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "t3-uuid-value",
    name: "John Harrison",
    email: "john.harrison@example.com",
    bio: "English and Portuguese bilingual tutor based in London. IELTS coach. I make language learning fun, practical and highly communicative.",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    hourly_rate: 110.00,
    rating: 5.00,
    commission_tier: 0.10,
    timezone: "Europe/London",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  }
];

const INITIAL_SLOTS = [
  { day: "Lunes", time: "09:00" },
  { day: "Lunes", time: "11:00" },
  { day: "Martes", time: "14:00" },
  { day: "Martes", time: "16:00" },
  { day: "Miércoles", time: "10:00" },
  { day: "Miércoles", time: "15:00" },
  { day: "Jueves", time: "09:00" },
  { day: "Jueves", time: "17:00" },
  { day: "Viernes", time: "11:00" },
  { day: "Viernes", time: "14:00" }
];

export default function App() {
  // Configuración de Estados
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);
  const [activeTab, setActiveTab] = useState('explore'); // explore, wallet, teacher, my-classes
  const [currentUserRole, setCurrentUserRole] = useState('student'); // student, teacher

  // Datos de Alumno Activo
  const [studentProfile, setStudentProfile] = useState({
    id: "s1-uuid-value",
    name: "Tiago Barbosa",
    email: "tiago.barbosa@example.com",
    wallet_balance: 150.00,
    timezone: "America/Sao_Paulo"
  });

  // Datos de Profesores y Disponibilidad
  const [teachers, setTeachers] = useState(MOCK_TEACHERS);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherSlots, setTeacherSlots] = useState(INITIAL_SLOTS);
  
  // Agendamientos (Bookings) y Transacciones
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([
    {
      id: "tx1",
      id_student: "s1-uuid-value",
      amount: 150.00,
      type: "top-up",
      description: "Carga inicial de bienvenida",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ]);

  // Selección de fecha para agendamiento
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState(null);

  // Recarga de Créditos
  const [topupAmount, setTopupAmount] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Búsqueda y Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [maxRate, setMaxRate] = useState(150);

  // Verificar conexión a Supabase real
  useEffect(() => {
    async function checkSupabaseConnection() {
      try {
        const { data, error } = await supabase.from('teachers').select('id').limit(1);
        if (!error) {
          setIsUsingSupabase(true);
          // Cargar datos reales
          loadRealSupabaseData();
        } else {
          console.log("No se pudo conectar a la base de datos real. Iniciando modo Demostración Local.");
        }
      } catch (e) {
        console.log("Modo demostración activo (Supabase no configurado o fuera de línea).");
      }
    }
    checkSupabaseConnection();
  }, []);

  const loadRealSupabaseData = async () => {
    // Profesores
    const { data: dbTeachers } = await supabase.from('teachers').select('*');
    if (dbTeachers && dbTeachers.length > 0) setTeachers(dbTeachers);

    // Alumno (tomamos el primero o creamos uno de prueba)
    const { data: dbStudents } = await supabase.from('students').select('*').limit(1);
    if (dbStudents && dbStudents.length > 0) {
      setStudentProfile(dbStudents[0]);
      
      // Reservas
      const { data: dbBookings } = await supabase.from('bookings').select('*').eq('id_student', dbStudents[0].id);
      if (dbBookings) setBookings(dbBookings);

      // Transacciones
      const { data: dbTxs } = await supabase.from('wallet_transactions').select('*').eq('id_student', dbStudents[0].id);
      if (dbTxs) setTransactions(dbTxs);
    }
  };

  // =========================================================================
  // LOGICA: RESERVA DE CLASES (FASE 4)
  // =========================================================================
  const handleCreateBooking = async () => {
    if (!selectedTeacher || !bookingSlot || !bookingDate) {
      alert("Por favor selecciona una fecha y hora.");
      return;
    }

    const cost = selectedTeacher.hourly_rate;

    // Validación crítica: ¿Saldo suficiente?
    if (studentProfile.wallet_balance < cost) {
      alert(`Saldo insuficiente. Tu saldo es R$ ${studentProfile.wallet_balance.toFixed(2)}, pero la clase cuesta R$ ${cost.toFixed(2)}.`);
      setActiveTab('wallet');
      setSelectedTeacher(null);
      setBookingSlot(null);
      return;
    }

    // Calcular start_time y end_time
    const [hours, minutes] = bookingSlot.time.split(':');
    const start = new Date(bookingDate);
    start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hora de duración

    const newBooking = {
      id: isUsingSupabase ? undefined : `b-${Date.now()}`,
      id_teacher: selectedTeacher.id,
      id_student: studentProfile.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: 'pending',
      credit_cost: cost
    };

    if (isUsingSupabase) {
      // Intentar reservar usando la función segura book_class en Supabase
      try {
        const { data, error } = await supabase.rpc('book_class', {
          p_student_id: studentProfile.id,
          p_teacher_id: selectedTeacher.id,
          p_start_time: start.toISOString(),
          p_end_time: end.toISOString(),
          p_cost: cost
        });

        if (error) {
          alert(`Error al reservar: ${error.message}`);
          return;
        }

        // Recargar datos actualizados
        loadRealSupabaseData();
        alert("¡Clase agendada exitosamente en Supabase!");
      } catch (err) {
        console.error(err);
      }
    } else {
      // Modo Demo Local
      // Descontar saldo de la billetera
      setStudentProfile(prev => ({
        ...prev,
        wallet_balance: prev.wallet_balance - cost
      }));

      // Registrar transacción
      const newTx = {
        id: `tx-${Date.now()}`,
        id_student: studentProfile.id,
        amount: -cost,
        type: 'class-booking',
        description: `Débito por clase agendada con ${selectedTeacher.name}`,
        created_at: new Date().toISOString()
      };

      setTransactions(prev => [newTx, ...prev]);
      setBookings(prev => [newBooking, ...prev]);
      
      alert(`¡Clase reservada con éxito! Se descontaron R$ ${cost.toFixed(2)} de tu billetera.`);
    }

    // Limpiar selección y redirigir
    setSelectedTeacher(null);
    setBookingSlot(null);
    setActiveTab('my-classes');
  };

  // =========================================================================
  // LOGICA: RECARGA DE SALDO (TOP-UP - FASE 2)
  // =========================================================================
  const handleTopupSuccess = async (amount, paymentId) => {
    if (isUsingSupabase) {
      // En producción, el webhook se encarga de esto. 
      // Pero para desarrollo, forzamos una recarga manual para conveniencia
      const newBalance = Number(studentProfile.wallet_balance || 0) + Number(amount);
      
      await supabase.from('students').update({ wallet_balance: newBalance }).eq('id', studentProfile.id);
      await supabase.from('wallet_transactions').insert({
        id_student: studentProfile.id,
        amount: Number(amount),
        type: 'top-up',
        description: `Recarga aprobada (ID Mercado Pago: ${paymentId})`
      });

      loadRealSupabaseData();
    } else {
      // Modo Demo Local
      setStudentProfile(prev => ({
        ...prev,
        wallet_balance: prev.wallet_balance + Number(amount)
      }));

      const newTx = {
        id: `tx-${Date.now()}`,
        id_student: studentProfile.id,
        amount: Number(amount),
        type: 'top-up',
        description: `Recarga aprobada (ID Mercado Pago: ${paymentId})`,
        created_at: new Date().toISOString()
      };

      setTransactions(prev => [newTx, ...prev]);
    }

    setShowPaymentModal(false);
    setTopupAmount(null);
    alert(`¡Recarga exitosa! Se han acreditado R$ ${amount.toFixed(2)} en tu cuenta.`);
  };

  // =========================================================================
  // LOGICA: CANCELAR O COMPLETAR CLASE (PANEL PROFESOR Y ALUMNO)
  // =========================================================================
  const handleCancelBooking = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    if (!window.confirm("¿Seguro que deseas cancelar esta reserva? Se reembolsará el saldo al alumno.")) return;

    if (isUsingSupabase) {
      const { error } = await supabase.rpc('cancel_booking', { p_booking_id: bookingId });
      if (error) {
        alert(`Error al cancelar: ${error.message}`);
        return;
      }
      loadRealSupabaseData();
    } else {
      // Reembolsar créditos al alumno en modo local
      setStudentProfile(prev => ({
        ...prev,
        wallet_balance: prev.wallet_balance + booking.credit_cost
      }));

      // Registrar transacción de reembolso
      const refundTx = {
        id: `tx-${Date.now()}`,
        id_student: studentProfile.id,
        amount: booking.credit_cost,
        type: 'class-refund',
        description: `Reembolso por clase cancelada (Ref: ${booking.id})`,
        created_at: new Date().toISOString()
      };

      setTransactions(prev => [refundTx, ...prev]);
      
      // Actualizar estado del booking
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
      alert("Clase cancelada. El dinero ha sido devuelto a la billetera del alumno.");
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (isUsingSupabase) {
      await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
      loadRealSupabaseData();
      alert("Clase marcada como completada en Supabase.");
    } else {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b));
      alert("Clase completada. Saldo liberado para transferencia al tutor.");
    }
  };

  // Filtrado de tutores
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRate = t.hourly_rate <= maxRate;
    return matchesSearch && matchesRate;
  });

  // Calcular ingresos del tutor seleccionado (Alexandre Silva para el panel del profesor)
  const alexandreBookings = bookings.filter(b => b.id_teacher === "t1-uuid-value" || b.id_teacher === "t1-uuid-value");
  const alexandreCompletedBookings = alexandreBookings.filter(b => b.status === 'completed');
  
  // Ingresos brutos y netos tras aplicar la comisión (Fase 4)
  const grossEarnings = alexandreCompletedBookings.reduce((sum, b) => sum + Number(b.credit_cost), 0);
  const netEarnings = alexandreCompletedBookings.reduce((sum, b) => sum + (Number(b.credit_cost) * (1 - 0.20)), 0);

  // Conversión dinámica de zonas horarias (Fase 3)
  const getConvertedTime = (slotTime, teacherTimezone) => {
    // Si tenemos una fecha seleccionada
    if (!bookingDate) return "";
    
    const [hours, minutes] = slotTime.split(':');
    const studentTime = new Date(bookingDate);
    studentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Formatear a hora del profesor
    const teacherFormatter = new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: teacherTimezone,
      hour12: false
    });

    const utcFormatter = new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      hour12: false
    });

    return {
      studentLocal: slotTime,
      teacherLocal: teacherFormatter.format(studentTime),
      utc: utcFormatter.format(studentTime)
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* =========================================================================
          BANNER DE CONTROL DE BASE DE DATOS E INFRAESTRUCTURA
          ========================================================================= */}
      <div className="bg-slate-900 text-slate-300 py-2.5 px-4 text-xs flex flex-wrap justify-between items-center border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-slate-200">Proyecto Hermano (Versión 2.0 en paralelo)</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400">Marketplace de Tutores</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isUsingSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className="font-medium">
              {isUsingSupabase ? 'Supabase Conectado (Producción)' : 'Modo Demo Activo (Tablas Simuladas)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Pruebas rápidas:</span>
            <button
              onClick={() => {
                setCurrentUserRole(currentUserRole === 'student' ? 'teacher' : 'student');
                // Al alternar rol, facilitamos las pruebas del flujo completo
                alert(`Simulando vista de: ${currentUserRole === 'student' ? 'PROFESOR (Alexandre Silva)' : 'ALUMNO (Tiago Barbosa)'}`);
              }}
              className="px-2.5 py-1 bg-brand-600 text-white rounded font-bold hover:bg-brand-700 transition"
            >
              Cambiar a {currentUserRole === 'student' ? 'Profesor' : 'Alumno'}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HEADER PRINCIPAL CON BILLETERA DINAMICA
          ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">TUTORMARKET</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Billetera de Créditos</p>
            </div>
          </div>

          {/* Navegación Principal */}
          <nav className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => { setActiveTab('explore'); setSelectedTeacher(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'explore' ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Explorar Tutores
            </button>
            <button 
              onClick={() => setActiveTab('my-classes')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'my-classes' ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Mis Clases {bookings.length > 0 && <span className="bg-brand-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ml-1">{bookings.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'wallet' ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Mi Billetera
            </button>
            <button 
              onClick={() => setActiveTab('teacher')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'teacher' ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Panel Profesor
            </button>
          </nav>

          {/* Billetera de Créditos Rápida */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('wallet')}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl cursor-pointer hover:shadow-sm transition"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] text-emerald-800 font-bold leading-none uppercase">Créditos</p>
                <p className="text-sm font-extrabold text-emerald-700">R$ {studentProfile.wallet_balance.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <img 
                src={currentUserRole === 'student' ? studentProfile.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                className="w-9 h-9 rounded-full ring-2 ring-brand-100 object-cover" 
                alt="Avatar" 
              />
              <div className="hidden lg:block text-left leading-none">
                <p className="text-xs font-bold text-slate-700">{currentUserRole === 'student' ? studentProfile.name : "Alexandre Silva"}</p>
                <p className="text-[10px] text-slate-400 capitalize">{currentUserRole}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          CONTENIDO PRINCIPAL
          ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* =========================================================================
            TAB 1: EXPLORAR TUTORES (CATÁLOGO Y AGENDAMIENTO)
            ========================================================================= */}
        {activeTab === 'explore' && !selectedTeacher && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Nueva Experiencia 2.0</span>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Encuentra a tu tutor ideal con Billetera de Créditos</h2>
                <p className="text-slate-100 text-sm sm:text-base leading-relaxed">
                  Carga saldo mediante Mercado Pago y reserva clases al instante. Sin suscripciones forzosas. Cancela hasta 24 horas antes con reembolso del 100%.
                </p>
              </div>
            </div>

            {/* Buscador y Filtros */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Buscar tutor por nombre, idioma o palabras clave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">Tarifa máx: R$ {maxRate}</span>
                <input 
                  type="range" 
                  min="40" 
                  max="150" 
                  value={maxRate}
                  onChange={(e) => setMaxRate(Number(e.target.value))}
                  className="accent-brand-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>
            </div>

            {/* Listado de Tutores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map(teacher => (
                <div key={teacher.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                  <div className="p-6 space-y-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img src={teacher.avatar_url} className="w-14 h-14 rounded-xl object-cover ring-2 ring-slate-100" alt={teacher.name} />
                        <div>
                          <h3 className="font-extrabold text-slate-900">{teacher.name}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <Globe className="w-3.5 h-3.5" />
                            <span>{teacher.timezone}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase">Por Hora</p>
                        <p className="font-black text-lg text-brand-600">R$ {teacher.hourly_rate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-sm text-slate-800">{teacher.rating}</span>
                      <span className="text-xs text-slate-400">(27 clases realizadas)</span>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                      {teacher.bio}
                    </p>
                  </div>

                  <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex gap-2">
                    <button 
                      onClick={() => setSelectedTeacher(teacher)}
                      className="w-full py-2 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition"
                    >
                      Reservar Clase
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            DETALLE DEL TUTOR Y MOTOR DE AGENDAMIENTO (FASE 3)
            ========================================================================= */}
        {activeTab === 'explore' && selectedTeacher && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <button 
                onClick={() => { setSelectedTeacher(null); setBookingSlot(null); }}
                className="text-slate-500 hover:text-slate-800 text-sm font-semibold flex items-center gap-1.5"
              >
                ← Volver al catálogo
              </button>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={selectedTeacher.avatar_url} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">{selectedTeacher.name}</h2>
                      <p className="text-sm text-slate-500">{selectedTeacher.timezone}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-400 font-extrabold uppercase">Costo por Clase</p>
                    <p className="text-2xl font-black text-emerald-600">R$ {selectedTeacher.hourly_rate.toFixed(2)}</p>
                  </div>
                </div>

                {/* Video de presentación */}
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={selectedTeacher.video_url} 
                    title="Video presentación" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900">Sobre el Profesor</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{selectedTeacher.bio}</p>
                </div>
              </div>
            </div>

            {/* Formulario/Calendario de reserva */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-500" />
                  Elegir Fecha y Hora
                </h3>

                {/* Selección de Fecha */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">1. Seleccionar Día</label>
                  <input 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => {
                      setBookingDate(e.target.value);
                      setBookingSlot(null); // Resetear slot anterior
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500 text-sm bg-white"
                  />
                </div>

                {/* Selección de Horarios */}
                {bookingDate && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 block">2. Horas Disponibles (Zona Horaria Alumno)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {teacherSlots.map((slot, index) => {
                        const isSelected = bookingSlot === slot;
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setBookingSlot(slot)}
                            className={`py-2 px-3 border rounded-lg text-xs font-semibold transition text-center ${
                              isSelected 
                                ? 'bg-brand-600 border-brand-600 text-white shadow' 
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {slot.day} - {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Conversión y visualización de Timezones (Fase 3) */}
                {bookingSlot && bookingDate && (() => {
                  const times = getConvertedTime(bookingSlot.time, selectedTeacher.timezone);
                  return (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-brand-600 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Conversión Horaria de la Reserva</span>
                      </div>
                      <div className="space-y-1 text-slate-600">
                        <p>📍 Alumno ({studentProfile.timezone}): <span className="font-bold text-slate-900">{bookingDate} {times.studentLocal}</span></p>
                        <p>🌍 Tutor ({selectedTeacher.timezone}): <span className="font-bold text-slate-900">{bookingDate} {times.teacherLocal}</span></p>
                        <p>⏱️ Servidor / Backend (UTC): <span className="font-bold text-slate-900">{times.utc} (Guardado en DB)</span></p>
                      </div>
                    </div>
                  );
                })()}

                {/* Acción de agendamiento */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCreateBooking}
                    disabled={!bookingSlot || !bookingDate}
                    className="w-full py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow hover:from-brand-700 hover:to-indigo-700 transition disabled:opacity-50"
                  >
                    Agendar Clase (R$ {selectedTeacher.hourly_rate})
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    El valor de la clase se debitará al instante de tu saldo de billetera virtual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: BILLETERA DE CREDITOS (TOP-UP Y TRANSACCIONES) - FASE 2
            ========================================================================= */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card Billetera */}
              <div className="bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 bottom-0 transform translate-x-12 translate-y-12 opacity-10">
                  <Wallet className="w-64 h-64" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-emerald-100 text-xs uppercase tracking-wider">Mi Saldo Disponible</h3>
                      <p className="text-4xl font-black mt-1">R$ {studentProfile.wallet_balance.toFixed(2)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                      <Wallet className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/20 flex justify-between text-xs text-emerald-100">
                    <p>Alumno: <span className="font-bold text-white">{studentProfile.name}</span></p>
                    <p>Zona Horaria: <span className="font-bold text-white">{studentProfile.timezone}</span></p>
                  </div>
                </div>
              </div>

              {/* Historial de transacciones */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-500" />
                  Historial de Transacciones
                </h3>

                <div className="space-y-3">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          tx.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                        }`}>
                          {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{tx.description}</p>
                          <p className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-extrabold text-sm ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {tx.amount > 0 ? `+ R$ ${tx.amount.toFixed(2)}` : `- R$ ${Math.abs(tx.amount).toFixed(2)}`}
                        </span>
                        <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">{tx.type}</p>
                      </div>
                    </div>
                  ))}

                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      No has realizado transacciones aún.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pasarela y Selección de Monto */}
            <div className="space-y-6">
              {!showPaymentModal ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900">Recargar Saldo (Top-up)</h3>
                  <p className="text-xs text-slate-500">
                    Selecciona un monto para cargar créditos en tu billetera a través del checkout de Mercado Pago.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {[50, 100, 200, 500].map(val => (
                      <button
                        key={val}
                        onClick={() => setTopupAmount(val)}
                        className={`py-3 px-4 border rounded-xl text-sm font-extrabold transition text-center ${
                          topupAmount === val 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        R$ {val}
                      </button>
                    ))}
                  </div>

                  {topupAmount && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow hover:from-brand-700 hover:to-indigo-700 transition flex items-center justify-center gap-1.5"
                    >
                      Pagar con Mercado Pago
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    Checkout Seguro
                  </h3>
                  
                  <MercadoPagoCardForm 
                    amount={topupAmount}
                    studentId={studentProfile.id}
                    onSuccess={handleTopupSuccess}
                    onCancel={() => { setShowPaymentModal(false); setTopupAmount(null); }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: PANEL DEL PROFESOR (GESTIÓN DE SLOTS E INGRESOS)
            ========================================================================= */}
        {activeTab === 'teacher' && (
          <div className="space-y-6">
            
            {/* Dashboard Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Ingresos Brutos */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Ingresos Brutos</p>
                  <p className="text-xl font-black text-slate-800">R$ {grossEarnings.toFixed(2)}</p>
                </div>
              </div>

              {/* Ingresos Netos tras comisión (plataforma retiene comisión) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Por Cobrar (Neto)</p>
                  <p className="text-xl font-black text-emerald-600">R$ {netEarnings.toFixed(2)}</p>
                  <span className="text-[10px] text-slate-400 font-medium">Aplicado 20% retención</span>
                </div>
              </div>

              {/* Clases Totales */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Clases Completadas</p>
                  <p className="text-xl font-black text-slate-800">{alexandreCompletedBookings.length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Gestor de Disponibilidad */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900">Mis Bloques de Disponibilidad</h3>
                <p className="text-xs text-slate-500">
                  Define los bloques de horario típicos que tienes libres en la semana para que los alumnos te agenden.
                </p>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {teacherSlots.map((slot, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <span className="font-bold text-slate-700">{slot.day} - {slot.time}</span>
                      <button 
                        onClick={() => setTeacherSlots(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target;
                  const day = form.day.value;
                  const time = form.time.value;
                  setTeacherSlots(prev => [...prev, { day, time }]);
                  form.reset();
                }} className="pt-2 border-t border-slate-100 flex gap-2">
                  <select name="day" className="flex-1 px-2 py-1 text-xs border rounded outline-none" required>
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                  </select>
                  <input type="time" name="time" className="w-24 px-2 py-1 text-xs border rounded outline-none" required />
                  <button type="submit" className="p-1 px-2.5 bg-brand-600 text-white rounded text-xs font-bold">
                    Agregar
                  </button>
                </form>
              </div>

              {/* Clases Agendadas por Alumnos */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900">Control de Reservas de Alumnos</h3>
                <p className="text-xs text-slate-500">
                  Aquí puedes ver las reservas realizadas por los alumnos y gestionar su estado (Completar o Cancelar).
                </p>

                <div className="space-y-3">
                  {bookings.map(book => {
                    const studentName = studentProfile.id === book.id_student ? studentProfile.name : "Alumno Externo";
                    return (
                      <div key={book.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{studentName}</span>
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                              book.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              book.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                            }`}>
                              {book.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(book.start_time).toLocaleString()} (Hora Local Alumno)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-slate-700">R$ {book.credit_cost.toFixed(2)}</span>
                          
                          {book.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleCompleteBooking(book.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                              >
                                Completar
                              </button>
                              <button
                                onClick={() => handleCancelBooking(book.id)}
                                className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {bookings.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      No hay reservas agendadas en este momento.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: MIS CLASES (VISTA DEL ALUMNO)
            ========================================================================= */}
        {activeTab === 'my-classes' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              Mis Clases Reservadas
            </h3>

            <div className="space-y-3">
              {bookings.map(book => {
                const teacherObj = teachers.find(t => t.id === book.id_teacher) || {};
                return (
                  <div key={book.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={teacherObj.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                      <div>
                        <h4 className="font-bold text-slate-800">{teacherObj.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(book.start_time).toLocaleString()} ({studentProfile.timezone})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          book.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          book.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {book.status}
                        </span>
                        <p className="text-xs font-bold text-slate-700 mt-1">R$ {book.credit_cost.toFixed(2)}</p>
                      </div>

                      {book.status === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(book.id)}
                          className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition"
                        >
                          Cancelar Clase
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {bookings.length === 0 && (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold">No tienes ninguna clase reservada.</p>
                  <button 
                    onClick={() => setActiveTab('explore')}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700"
                  >
                    Buscar Tutores
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 font-medium">
        <p>Marketplace de Tutores V2.0 | Conexión América &copy; {new Date().getFullYear()}</p>
        <p className="mt-1 text-[10px] text-slate-300">Desarrollo modular y aislado. Versión Hermana.</p>
      </footer>
    </div>
  );
}
