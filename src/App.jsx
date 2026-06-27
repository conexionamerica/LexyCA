import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import MercadoPagoCardForm from './components/MercadoPagoCardForm';
import { 
  BookOpen, 
  Wallet, 
  Calendar, 
  UserCheck, 
  Search, 
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
  Shield,
  Activity,
  Sparkles,
  Flame
} from 'lucide-react';

// =========================================================================
// MOCK DATA PARA MODO DEMOSTRACIÓN (CON IDIOMA ESPECÍFICO)
// =========================================================================
const MOCK_TEACHERS = [
  {
    id: "t1-uuid-value",
    name: "Lucía Fernández",
    email: "lucia.fernandez@example.com",
    language: "Español",
    bio: "Filóloga y tutora nativa de Español. Clases de negocios, preparación DELE y conversación fluida enfocada en cultura y modismos.",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    hourly_rate: 65.00,
    rating: 4.95,
    commission_tier: 0.20,
    timezone: "America/Sao_Paulo",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    meeting_link: "https://meet.google.com/abc-esp-tutor"
  },
  {
    id: "t2-uuid-value",
    name: "John Harrison",
    email: "john.harrison@example.com",
    language: "Inglés",
    bio: "English native teacher from London. IELTS and TOEFL specialist. Active conversations and custom lessons for professionals and tech fields.",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    hourly_rate: 85.00,
    rating: 4.98,
    commission_tier: 0.15,
    timezone: "Europe/London",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    meeting_link: "https://meet.google.com/xyz-eng-tutor"
  },
  {
    id: "t3-uuid-value",
    name: "Alexandre Silva",
    email: "alexandre.silva@example.com",
    language: "Español",
    bio: "Bilingual coach teaching Spanish to students in Brazil and Portugal. Dynamic methodologies tailored to quick conversational fluency.",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    hourly_rate: 60.00,
    rating: 4.87,
    commission_tier: 0.20,
    timezone: "America/Sao_Paulo",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    meeting_link: "https://meet.google.com/mno-spa-tutor"
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
  const [activeTab, setActiveTab] = useState('explore'); 
  const [currentUserRole, setCurrentUserRole] = useState('student'); 

  // Datos de Alumno Activo
  const [studentProfile, setStudentProfile] = useState({
    id: "s1-uuid-value",
    name: "Tiago Barbosa",
    email: "tiago.barbosa@example.com",
    wallet_balance: 100.00, // Balance inicial de prueba
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
      amount: 100.00,
      type: "top-up",
      description: "Carga inicial de créditos",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ]);

  // Selección de fecha para agendamiento
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState(null);

  // Recarga de Créditos
  const [topupAmount, setTopupAmount] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [insufficientFundsMessage, setInsufficientFundsMessage] = useState(false);

  // Búsqueda y Filtros de Idioma
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('Todos'); // Todos, Inglés, Español

  // Verificar conexión a Supabase real
  useEffect(() => {
    async function checkSupabaseConnection() {
      try {
        const { data, error } = await supabase.from('teachers').select('id').limit(1);
        if (!error) {
          setIsUsingSupabase(true);
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
    const { data: dbTeachers } = await supabase.from('teachers').select('*');
    if (dbTeachers && dbTeachers.length > 0) setTeachers(dbTeachers);

    const { data: dbStudents } = await supabase.from('students').select('*').limit(1);
    if (dbStudents && dbStudents.length > 0) {
      setStudentProfile(dbStudents[0]);
      
      const { data: dbBookings } = await supabase.from('bookings').select('*').eq('id_student', dbStudents[0].id);
      if (dbBookings) setBookings(dbBookings);

      const { data: dbTxs } = await supabase.from('wallet_transactions').select('*').eq('id_student', dbStudents[0].id);
      if (dbTxs) setTransactions(dbTxs);
    }
  };

  // =========================================================================
  // LOGICA: RESERVA DE CLASES (CON APICALL DE VALIDACION DE SALDO - FASE 6)
  // =========================================================================
  const handleCreateBooking = async () => {
    if (!selectedTeacher || !bookingSlot || !bookingDate) {
      alert("Por favor selecciona una fecha y hora.");
      return;
    }

    const cost = selectedTeacher.hourly_rate;

    // Validación previa rápida en frontend
    if (studentProfile.wallet_balance < cost) {
      setInsufficientFundsMessage(true);
      return;
    }

    // Calcular start_time y end_time
    const [hours, minutes] = bookingSlot.time.split(':');
    const start = new Date(bookingDate);
    start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hora de duración

    const bookingPayload = {
      student_id: studentProfile.id,
      teacher_id: selectedTeacher.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      cost: cost
    };

    if (isUsingSupabase) {
      // Llamada real al endpoint local de reservas
      try {
        const response = await fetch("/api/bookings/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingPayload)
        });
        
        const resData = await response.json();

        if (!response.ok) {
          if (resData.error === 'Saldo insuficiente') {
            setInsufficientFundsMessage(true);
          } else {
            alert(`Error al reservar: ${resData.error}`);
          }
          return;
        }

        loadRealSupabaseData();
        alert("¡Clase reservada y créditos descontados correctamente!");
      } catch (err) {
        console.error("API Error, falling back...", err);
      }
    } else {
      // Simulación offline/Sandbox: Simular comportamiento de la API Route
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

      const newBooking = {
        id: `b-${Date.now()}`,
        id_teacher: selectedTeacher.id,
        id_student: studentProfile.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'pending',
        credit_cost: cost,
        meeting_link: selectedTeacher.meeting_link
      };

      setTransactions(prev => [newTx, ...prev]);
      setBookings(prev => [newBooking, ...prev]);
      
      alert(`¡Clase reservada con éxito! Se descontaron R$ ${cost.toFixed(2)} de tu billetera.`);
    }

    setSelectedTeacher(null);
    setBookingSlot(null);
    setInsufficientFundsMessage(false);
    setActiveTab('my-classes');
  };

  // =========================================================================
  // LOGICA: RECARGA DE SALDO (TOP-UP - FASE 2)
  // =========================================================================
  const handleTopupSuccess = async (amount, paymentId) => {
    if (isUsingSupabase) {
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
      setStudentProfile(prev => ({
        ...prev,
        wallet_balance: prev.wallet_balance + booking.credit_cost
      }));

      const refundTx = {
        id: `tx-${Date.now()}`,
        id_student: studentProfile.id,
        amount: booking.credit_cost,
        type: 'class-refund',
        description: `Reembolso por clase cancelada (Ref: ${booking.id})`,
        created_at: new Date().toISOString()
      };

      setTransactions(prev => [refundTx, ...prev]);
      
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

  // =========================================================================
  // HABILITAR ENLACE GOOGLE MEET (15 MINUTOS ANTES DE LA CLASE - FASE 7)
  // =========================================================================
  const isMeetLinkActive = (startTimeStr) => {
    const now = new Date();
    const startTime = new Date(startTimeStr);
    const differenceInMinutes = (startTime.getTime() - now.getTime()) / (60 * 1000);
    
    // Activo desde 15 minutos antes del inicio de la clase
    return differenceInMinutes <= 15;
  };

  // Filtrado de tutores por texto e idioma (Fase 5)
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.bio.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLanguage = selectedLanguageFilter === 'Todos' || t.language === selectedLanguageFilter;
    
    return matchesSearch && matchesLanguage;
  });

  const alexandreBookings = bookings.filter(b => b.id_teacher === "t1-uuid-value" || b.id_teacher === "t3-uuid-value");
  const alexandreCompletedBookings = alexandreBookings.filter(b => b.status === 'completed');
  
  const grossEarnings = alexandreCompletedBookings.reduce((sum, b) => sum + Number(b.credit_cost), 0);
  const netEarnings = alexandreCompletedBookings.reduce((sum, b) => sum + (Number(b.credit_cost) * (1 - 0.20)), 0);

  // Conversión dinámica de zonas horarias (Fase 3 - Sin Relojes)
  const getConvertedTime = (slotTime, teacherTimezone) => {
    if (!bookingDate) return "";
    
    const [hours, minutes] = slotTime.split(':');
    const studentTime = new Date(bookingDate);
    studentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 text-slate-900 flex flex-col font-sans relative overflow-hidden">
      
      {/* Aurora effects de fondo - Estilo Frutiger Aero */}
      <div className="absolute top-[-300px] left-[-300px] w-[800px] h-[800px] bg-gradient-to-tr from-cyan-300/30 to-emerald-300/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-gradient-to-br from-indigo-300/20 to-teal-200/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* Banner de Control Técnico */}
      <div className="bg-slate-900/90 text-slate-300 py-2.5 px-4 text-xs flex flex-wrap justify-between items-center border-b border-slate-800 gap-2 backdrop-blur-md z-40">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
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
                alert(`Simulando vista de: ${currentUserRole === 'student' ? 'PROFESOR (Alexandre Silva)' : 'ALUMNO (Tiago Barbosa)'}`);
              }}
              className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded font-bold hover:from-cyan-700 hover:to-teal-600 shadow-md transition"
            >
              Cambiar a {currentUserRole === 'student' ? 'Profesor' : 'Alumno'}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HEADER PRINCIPAL (ESTILO FRUTIGER AERO - CRISTAL Y AGUA - SIN RELOJES)
          ========================================================================= */}
      <header className="sticky top-0 z-30 glass shadow-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-200/50 relative overflow-hidden">
              <div className="absolute top-0.5 left-0.5 w-4 h-2 bg-white/40 rounded-full blur-[0.5px]"></div>
              <BookOpen className="w-5 h-5 relative z-10" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">TUTORMARKET</h1>
              <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Billetera de Créditos</p>
            </div>
          </div>

          {/* Navegación Principal */}
          <nav className="hidden md:flex items-center gap-1 bg-white/40 p-1 rounded-xl border border-white/60">
            <button 
              onClick={() => { setActiveTab('explore'); setSelectedTeacher(null); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'explore' ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md' : 'text-slate-700 hover:bg-white/50'}`}
            >
              Explorar Tutores
            </button>
            <button 
              onClick={() => setActiveTab('my-classes')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'my-classes' ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md' : 'text-slate-700 hover:bg-white/50'}`}
            >
              Mis Clases {bookings.length > 0 && <span className="bg-cyan-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ml-1">{bookings.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'wallet' ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md' : 'text-slate-700 hover:bg-white/50'}`}
            >
              Mi Billetera
            </button>
            <button 
              onClick={() => setActiveTab('teacher')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'teacher' ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md' : 'text-slate-700 hover:bg-white/50'}`}
            >
              Panel Profesor
            </button>
          </nav>

          {/* Billetera de Créditos Rápida */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('wallet')}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-300/40 px-3.5 py-1.5 rounded-2xl cursor-pointer hover:shadow-md hover:bg-white/50 transition relative overflow-hidden group"
            >
              <div className="absolute top-0.5 left-0.5 w-8 h-4 bg-white/20 rounded-full blur-[0.5px]"></div>
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-200/50">
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
                className="w-9 h-9 rounded-full ring-2 ring-cyan-200 object-cover" 
                alt="Avatar" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          CONTENIDO DE LA APLICACIÓN
          ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* =========================================================================
            TAB 1: EXPLORAR TUTORES (CATÁLOGO Y AGENDAMIENTO) - FASE 5 & 6
            ========================================================================= */}
        {activeTab === 'explore' && !selectedTeacher && (
          <div className="space-y-6">
            
            {/* Banner Publicitario Estilo Frutiger Aero (Glossy, cristal, agua, auroras - SIN RELOJES) */}
            <div className="bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-400 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-cyan-200/50 border border-white/20">
              <div className="absolute top-1 left-1 w-[98%] h-[30%] bg-white/25 rounded-3xl blur-[1px]"></div>
              <div className="absolute right-0 bottom-0 transform translate-x-20 translate-y-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
              
              {/* Esferas decorativas típicas Frutiger Aero */}
              <div className="absolute right-12 top-6 w-12 h-12 bg-white/20 rounded-full border border-white/30 backdrop-blur-[1px]"></div>
              <div className="absolute right-28 top-20 w-8 h-8 bg-white/10 rounded-full border border-white/25"></div>
              <div className="absolute right-6 top-24 w-6 h-6 bg-white/15 rounded-full border border-white/20"></div>

              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/30 flex items-center gap-1.5 w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  Nueva Experiencia 2.0
                </span>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Aprende a tu ritmo con Billetera Virtual</h2>
                <p className="text-slate-100 text-sm sm:text-base leading-relaxed">
                  Carga saldo mediante Mercado Pago y reserva clases al instante con tutores expertos. Sin suscripciones obligatorias, pagas únicamente por las clases que agendes.
                </p>
              </div>
            </div>

            {/* Buscador e Idiomas (Fase 5) */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Buscar tutor por nombre o palabras clave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200/80 rounded-xl outline-none focus:border-cyan-500 text-sm bg-white/80"
                />
              </div>

              {/* Filtro de Idiomas Requerido en Fase 5 */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {['Todos', 'Inglés', 'Español'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLanguageFilter(lang)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedLanguageFilter === lang 
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de Tutores (Cards - Fase 5) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map(teacher => (
                <div key={teacher.id} className="bg-white rounded-3xl border border-slate-200/70 shadow-sm hover:shadow-lg hover:border-cyan-200 transition-all duration-300 overflow-hidden flex flex-col relative group">
                  {/* Destello sutil en hover al estilo Frutiger */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-300/0 via-white/0 to-white/40 pointer-events-none transition-all duration-500 group-hover:via-white/10"></div>
                  
                  <div className="p-6 space-y-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={teacher.avatar_url} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100" alt={teacher.name} />
                          <span className="absolute bottom-[-4px] right-[-4px] bg-gradient-to-r from-cyan-500 to-teal-400 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg border border-white">
                            {teacher.language}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 group-hover:text-cyan-700 transition">{teacher.name}</h3>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                            <Globe className="w-3 h-3 text-cyan-500" />
                            <span>{teacher.timezone}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-extrabold uppercase">Por Hora</p>
                        <p className="font-black text-lg text-cyan-600">R$ {teacher.hourly_rate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-xs text-slate-800">{teacher.rating}</span>
                      <span className="text-[10px] text-slate-400">(42 clases dadas)</span>
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                      {teacher.bio}
                    </p>
                  </div>

                  <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex gap-2">
                    <button 
                      onClick={() => { setSelectedTeacher(teacher); setBookingDate(""); setBookingSlot(null); }}
                      className="w-full py-2 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-xl font-bold text-xs hover:from-cyan-700 hover:to-teal-600 shadow transition-all duration-300 flex items-center justify-center gap-1.5"
                    >
                      Reservar Clase
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            DETALLE DEL TUTOR Y MOTOR DE AGENDAMIENTO (FASE 3 & 6 - SIN RELOJES)
            ========================================================================= */}
        {activeTab === 'explore' && selectedTeacher && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <button 
                onClick={() => { setSelectedTeacher(null); setBookingSlot(null); setInsufficientFundsMessage(false); }}
                className="text-slate-500 hover:text-slate-800 text-sm font-semibold flex items-center gap-1.5"
              >
                ← Volver al catálogo
              </button>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={selectedTeacher.avatar_url} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                      <span className="absolute bottom-[-4px] right-[-4px] bg-cyan-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg border border-white">
                        {selectedTeacher.language}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">{selectedTeacher.name}</h2>
                      <p className="text-xs text-slate-500">{selectedTeacher.timezone}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase">Costo por Clase</p>
                    <p className="text-2xl font-black text-emerald-600">R$ {selectedTeacher.hourly_rate.toFixed(2)}</p>
                  </div>
                </div>

                {/* Video de presentación */}
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200">
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
                  <h3 className="font-bold text-slate-900 text-sm">Sobre el Profesor</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">{selectedTeacher.bio}</p>
                </div>
              </div>
            </div>

            {/* Formulario/Calendario de reserva */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 relative">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <Calendar className="w-5 h-5 text-cyan-600" />
                  Elegir Fecha y Hora
                </h3>

                {/* Selección de Fecha */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">1. Seleccionar Día</label>
                  <input 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => {
                      setBookingDate(e.target.value);
                      setBookingSlot(null);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 text-xs bg-white"
                  />
                </div>

                {/* Selección de Horarios */}
                {bookingDate && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 block">2. Horas Disponibles (Zona Horaria Alumno)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {teacherSlots.map((slot, index) => {
                        const isSelected = bookingSlot === slot;
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setBookingSlot(slot)}
                            className={`py-2 px-3 border rounded-lg text-xs font-semibold transition-all text-center ${
                              isSelected 
                                ? 'bg-gradient-to-r from-cyan-600 to-teal-500 border-cyan-600 text-white shadow-sm font-bold' 
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

                {/* Conversión y visualización de Timezones (Fase 3 - Sin Relojes) */}
                {bookingSlot && bookingDate && (() => {
                  const times = getConvertedTime(bookingSlot.time, selectedTeacher.timezone);
                  return (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-[11px] leading-relaxed">
                      <div className="flex items-center gap-1.5 text-cyan-600 font-bold">
                        <Activity className="w-3.5 h-3.5" />
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

                {/* Mensaje de Saldo Insuficiente con Redirección a Recarga (Fase 6) */}
                {insufficientFundsMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-center space-y-2.5">
                    <div className="flex justify-center text-red-500">
                      <AlertCircle className="w-6 h-6 animate-bounce" />
                    </div>
                    <h4 className="font-bold text-red-900 text-xs">Saldo Insuficiente en Billetera</h4>
                    <p className="text-[10px] text-red-700 leading-tight">
                      Tu saldo actual es R$ {studentProfile.wallet_balance.toFixed(2)}, pero esta clase cuesta R$ {selectedTeacher.hourly_rate.toFixed(2)}.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTopupAmount(selectedTeacher.hourly_rate);
                        setShowPaymentModal(true);
                        setActiveTab('wallet');
                        setSelectedTeacher(null);
                        setInsufficientFundsMessage(false);
                      }}
                      className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-bold text-xs shadow hover:from-emerald-600 hover:to-teal-700 transition"
                    >
                      Recargar Créditos con Mercado Pago
                    </button>
                  </div>
                )}

                {/* Acción de agendamiento */}
                {!insufficientFundsMessage && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleCreateBooking}
                      disabled={!bookingSlot || !bookingDate}
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 text-white rounded-xl font-bold text-xs shadow hover:from-cyan-700 hover:to-teal-600 transition disabled:opacity-50"
                    >
                      Agendar Clase (R$ {selectedTeacher.hourly_rate})
                    </button>
                    <p className="text-[9px] text-center text-slate-400 mt-2 font-medium">
                      El valor de la clase se debitará al instante de tu saldo de billetera virtual.
                    </p>
                  </div>
                )}
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
              
              {/* Card Billetera Estilo Cristal/Frutiger */}
              <div className="bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-8 text-white shadow-xl shadow-teal-200/50 relative overflow-hidden border border-white/20">
                <div className="absolute top-1 left-1 w-[98%] h-[30%] bg-white/25 rounded-3xl blur-[1px]"></div>
                <div className="absolute right-0 bottom-0 transform translate-x-12 translate-y-12 opacity-10">
                  <Wallet className="w-64 h-64" />
                </div>
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-emerald-50 text-[10px] uppercase tracking-wider">Mi Saldo Disponible</h3>
                      <p className="text-4xl font-black mt-1">R$ {studentProfile.wallet_balance.toFixed(2)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-[1px]">
                      <Wallet className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/20 flex justify-between text-[11px] text-emerald-100">
                    <p>Alumno: <span className="font-bold text-white">{studentProfile.name}</span></p>
                    <p>Zona Horaria: <span className="font-bold text-white">{studentProfile.timezone}</span></p>
                  </div>
                </div>
              </div>

              {/* Historial de transacciones */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <TrendingUp className="w-5 h-5 text-cyan-600" />
                  Historial de Transacciones
                </h3>

                <div className="space-y-3">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          tx.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                        }`}>
                          {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{tx.description}</p>
                          <p className="text-[9px] text-slate-400">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-extrabold ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {tx.amount > 0 ? `+ R$ ${tx.amount.toFixed(2)}` : `- R$ ${Math.abs(tx.amount).toFixed(2)}`}
                        </span>
                        <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">{tx.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pasarela y Selección de Monto */}
            <div className="space-y-6">
              {!showPaymentModal ? (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Recargar Saldo (Top-up)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Selecciona un monto para cargar créditos en tu billetera a través del checkout de Mercado Pago.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {[50, 100, 200, 500].map(val => (
                      <button
                        key={val}
                        onClick={() => setTopupAmount(val)}
                        className={`py-3 px-4 border rounded-2xl text-xs font-extrabold transition-all text-center ${
                          topupAmount === val 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-500 text-white shadow-md' 
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
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 text-white rounded-xl font-bold text-xs shadow hover:from-cyan-700 hover:to-teal-600 transition flex items-center justify-center gap-1.5"
                    >
                      Pagar con Mercado Pago
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
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
            TAB 3: PANEL DEL PROFESOR (GESTIÓN DE SLOTS E INGRESOS) - FASE 4 & 7
            ========================================================================= */}
        {activeTab === 'teacher' && (
          <div className="space-y-6">
            
            {/* Dashboard Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Ingresos Brutos</p>
                  <p className="text-xl font-black text-slate-800">R$ {grossEarnings.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Por Cobrar (Neto)</p>
                  <p className="text-xl font-black text-emerald-600">R$ {netEarnings.toFixed(2)}</p>
                  <span className="text-[9px] text-slate-400 font-medium">Aplicado 20% de comisión</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Clases Realizadas</p>
                  <p className="text-xl font-black text-slate-800">{alexandreCompletedBookings.length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Gestor de Disponibilidad */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Mis Bloques de Disponibilidad</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Define los bloques de horario en los que estás disponible para recibir reservas.
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
                  <select name="day" className="flex-1 px-2 py-1 text-xs border rounded outline-none bg-white" required>
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                  </select>
                  <input type="time" name="time" className="w-24 px-2 py-1 text-xs border rounded outline-none" required />
                  <button type="submit" className="p-1.5 px-3 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-lg text-xs font-bold shadow-sm hover:from-cyan-700 hover:to-teal-600">
                    Agregar
                  </button>
                </form>
              </div>

              {/* Clases Agendadas por Alumnos */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Control de Reservas de Alumnos</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Visualiza las reservas de tus alumnos. Aquí se habilitará el botón de videollamada para ambos y podrás cerrar la clase al concluirla.
                </p>

                <div className="space-y-3">
                  {bookings.map(book => {
                    const studentName = studentProfile.id === book.id_student ? studentProfile.name : "Alumno Externo";
                    const isMeetActive = isMeetLinkActive(book.start_time) && book.status === 'pending';
                    
                    return (
                      <div key={book.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{studentName}</span>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              book.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              book.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                            }`}>
                              {book.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                            <span>{new Date(book.start_time).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 justify-end">
                          <span className="font-extrabold text-xs text-slate-700 mr-2">R$ {book.credit_cost.toFixed(2)}</span>
                          
                          {/* Botón de Google Meet para el Profesor (Fase 7) */}
                          {isMeetActive && (
                            <a
                              href={book.meeting_link || "https://meet.google.com/xyz-abc-123"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg text-[10px] font-bold shadow hover:from-red-600 hover:to-orange-600 transition flex items-center gap-1"
                            >
                              <Video className="w-3.5 h-3.5" />
                              [ Entrar a la Clase ]
                            </a>
                          )}

                          {book.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleCompleteBooking(book.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition"
                              >
                                Completar
                              </button>
                              <button
                                onClick={() => handleCancelBooking(book.id)}
                                className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold hover:bg-red-600 transition"
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
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No hay reservas agendadas en este momento.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: MIS CLASES (VISTA DEL ALUMNO Y BOTÓN DE INGRESO - FASE 7)
            ========================================================================= */}
        {activeTab === 'my-classes' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Calendar className="w-5 h-5 text-cyan-600" />
              Mis Clases Reservadas
            </h3>

            <div className="space-y-3">
              {bookings.map(book => {
                const teacherObj = teachers.find(t => t.id === book.id_teacher) || {};
                const isMeetActive = isMeetLinkActive(book.start_time) && book.status === 'pending';
                
                return (
                  <div key={book.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={teacherObj.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{teacherObj.name}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                          <span>{new Date(book.start_time).toLocaleString()} ({studentProfile.timezone})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          book.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          book.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {book.status}
                        </span>
                        <p className="text-[11px] font-bold text-slate-700 mt-1">R$ {book.credit_cost.toFixed(2)}</p>
                      </div>

                      {/* Botón de Google Meet para el Alumno (Fase 7) */}
                      {isMeetActive && (
                        <a
                          href={book.meeting_link || "https://meet.google.com/xyz-abc-123"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-xs font-bold shadow hover:from-red-600 hover:to-orange-600 transition-all duration-300 flex items-center gap-1.5 animate-pulse"
                        >
                          <Video className="w-4 h-4" />
                          [ Entrar a la Clase ]
                        </a>
                      )}

                      {!isMeetActive && book.status === 'pending' && (
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                            <Activity className="w-3 h-3 text-slate-400" />
                            Ingreso disponible 15 min antes
                          </span>
                        </div>
                      )}

                      {book.status === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(book.id)}
                          className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-[10px] font-semibold hover:bg-red-50 transition"
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
                  <p className="text-xs font-semibold">No tienes ninguna clase reservada.</p>
                  <button 
                    onClick={() => setActiveTab('explore')}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-xl text-xs font-bold hover:from-cyan-700 hover:to-teal-600"
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
      <footer className="bg-white/40 border-t border-white/20 py-6 text-center text-[10px] text-slate-400 font-medium z-10">
        <p>Marketplace de Tutores V2.0 | Conexión América &copy; {new Date().getFullYear()}</p>
        <p className="mt-1 text-[9px] text-slate-300">Desarrollo modular y aislado. Versión Hermana.</p>
      </footer>
    </div>
  );
}
