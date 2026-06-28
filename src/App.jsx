import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import MercadoPagoCardForm from './components/MercadoPagoCardForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
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
  UserPlus,
  Send,
  MessageSquare,
  Sun,
  Moon,
  LogOut,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';

// =========================================================================
// MOCK DATA DE TUTORES CON IDIOMA Y ENLACE DE MEET
// =========================================================================
const INITIAL_TEACHERS = [
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
    status: "active",
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
    status: "active",
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
    status: "active",
    timezone: "America/Sao_Paulo",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    meeting_link: "https://meet.google.com/mno-spa-tutor"
  },
  {
    id: "t4-pending-uuid",
    name: "Marta Gómez (Postulante)",
    email: "marta.gomez@example.com",
    language: "Español",
    bio: "Profesora nativa de Madrid con 5 años de experiencia. Clases enfocadas en gramática práctica, conversación libre y pronunciación.",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    hourly_rate: 70.00,
    rating: 5.00,
    commission_tier: 0.20,
    status: "pending_approval", 
    timezone: "Europe/Madrid",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    meeting_link: "https://meet.google.com/marta-go-meet"
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

function MarketplaceApp() {
  const { user, profile, loading: authLoading, signOut, isDemoMode } = useAuth();
  
  const [activeTab, setActiveTab] = useState('explore'); 
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  // Perfil del estudiante (sincronizado o simulado)
  const [studentProfile, setStudentProfile] = useState({
    id: "s1-uuid-value",
    name: "Tiago Barbosa",
    email: "tiago.barbosa@example.com",
    wallet_balance: 100.00, 
    timezone: "America/Sao_Paulo",
    phone: "+5511999999999"
  });

  // Datos
  const [teachers, setTeachers] = useState(INITIAL_TEACHERS);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherSlots, setTeacherSlots] = useState(INITIAL_SLOTS);
  const [bookings, setBookings] = useState([]);
  const [payouts, setPayouts] = useState([]); 
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
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('Todos'); 
  const [maxRate, setMaxRate] = useState(150);

  // Simulador de WhatsApp
  const [whatsappLogs, setWhatsappLogs] = useState([
    {
      id: "wl-init",
      timestamp: new Date().toLocaleTimeString(),
      recipient: "Sistema",
      text: "Simulador de WhatsApp (Evolution API) listo. Las alertas se listarán aquí en tiempo real."
    }
  ]);

  // Formulario Onboarding Profesor
  const [onboardingForm, setOnboardingForm] = useState({
    name: '',
    email: '',
    language: 'Español',
    bio: '',
    hourly_rate: 60,
    video_url: '',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    timezone: 'America/Sao_Paulo'
  });
  const [onboardingSubmitted, setOnboardingSubmitted] = useState(false);

  // Controlar las redirecciones automáticas por rol al iniciar sesión
  useEffect(() => {
    if (profile) {
      if (profile.role === 'teacher') {
        setActiveTab('teacher');
      } else if (profile.role === 'admin') {
        setActiveTab('admin');
      } else {
        setActiveTab('explore');
      }
      
      // Sincronizar datos del estudiante
      setStudentProfile(prev => ({
        ...prev,
        id: profile.id,
        name: profile.name,
        email: profile.email
      }));
    } else {
      setActiveTab('explore');
    }
  }, [profile]);

  // Verificar conexión a Supabase real
  useEffect(() => {
    async function checkSupabaseConnection() {
      try {
        const { data, error } = await supabase.from('teachers').select('id').limit(1);
        if (!error) {
          setIsUsingSupabase(true);
          loadRealSupabaseData();
        }
      } catch (e) {
        console.log("Supabase offline.");
      }
    }
    checkSupabaseConnection();
  }, []);

  const loadRealSupabaseData = async () => {
    const { data: dbTeachers } = await supabase.from('teachers').select('*');
    if (dbTeachers && dbTeachers.length > 0) setTeachers(dbTeachers);

    if (profile) {
      const { data: dbStudent } = await supabase.from('students').select('*').eq('id', profile.id).maybeSingle();
      if (dbStudent) {
        setStudentProfile(dbStudent);
        
        const { data: dbBookings } = await supabase.from('bookings').select('*').eq('id_student', profile.id);
        if (dbBookings) setBookings(dbBookings);

        const { data: dbTxs } = await supabase.from('wallet_transactions').select('*').eq('id_student', profile.id);
        if (dbTxs) setTransactions(dbTxs);
      }
      
      const { data: dbPayouts } = await supabase.from('payouts').select('*');
      if (dbPayouts) setPayouts(dbPayouts);
    }
  };

  const logWhatsappMessage = (recipient, text) => {
    const newLog = {
      id: `wl-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      recipient,
      text
    };
    setWhatsappLogs(prev => [newLog, ...prev]);

    fetch('/api/notifications/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: text.includes('agotado') ? 'wallet-empty' : 'class-reminder',
        recipient_phone: studentProfile.phone || '+5511999999999',
        data: { time_label: '1 hour', meet_url: 'https://meet.google.com/abc-tutor', text }
      })
    }).catch(err => console.log('Whatsapp API simulated.'));
  };

  // =========================================================================
  // RESERVA DE CLASES (CON APICALL DE VALIDACION DE SALDO - FASE 6)
  // =========================================================================
  const handleCreateBooking = async () => {
    if (!profile) {
      // Si el visitante no está autenticado, forzar redirección a Login
      alert("Debes iniciar sesión o registrar una cuenta para agendar una clase.");
      setActiveTab('login');
      setSelectedTeacher(null);
      return;
    }

    if (!selectedTeacher || !bookingSlot || !bookingDate) {
      alert("Por favor selecciona una fecha y hora.");
      return;
    }

    const cost = selectedTeacher.hourly_rate;

    if (studentProfile.wallet_balance < cost) {
      setInsufficientFundsMessage(true);
      return;
    }

    const [hours, minutes] = bookingSlot.time.split(':');
    const start = new Date(bookingDate);
    start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000); 

    const bookingPayload = {
      student_id: studentProfile.id,
      teacher_id: selectedTeacher.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      cost: cost
    };

    if (isUsingSupabase && !isDemoMode) {
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
        console.error("API Error", err);
      }
    } else {
      // Simulación offline/Sandbox
      setStudentProfile(prev => ({
        ...prev,
        wallet_balance: prev.wallet_balance - cost
      }));

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

      // Alerta automática de clase en 1 hora por WhatsApp (Fase 9)
      setTimeout(() => {
        logWhatsappMessage(
          studentProfile.name,
          `¡Hola! Tu clase en Conexión América Idiomas comienza en 1 hora. Enlace para conectarte: ${selectedTeacher.meeting_link}`
        );
      }, 1000);
    }

    setSelectedTeacher(null);
    setBookingSlot(null);
    setInsufficientFundsMessage(false);
    setActiveTab('my-classes');
  };

  // =========================================================================
  // RECARGA DE SALDO
  // =========================================================================
  const handleTopupSuccess = async (amount, paymentId) => {
    if (isUsingSupabase && !isDemoMode) {
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
  // CANCELAR Y COMPLETAR CLASES
  // =========================================================================
  const handleCancelBooking = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    if (!window.confirm("¿Seguro que deseas cancelar esta reserva? Se reembolsará el saldo al alumno.")) return;

    if (isUsingSupabase && !isDemoMode) {
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
    if (isUsingSupabase && !isDemoMode) {
      await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
      loadRealSupabaseData();
      alert("Clase marcada como completada en Supabase.");
    } else {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b));
      alert("Clase completada. Saldo neto transferido a tus ingresos.");

      // Alerta automática de saldo a 0 (Fase 9)
      if (studentProfile.wallet_balance === 0) {
        setTimeout(() => {
          logWhatsappMessage(
            studentProfile.name,
            "Has agotado tus créditos de aprendizaje. Recarga tu billetera hoy mismo en tu panel para seguir agendando clases y no perder el ritmo."
          );
        }, 1500);
      }
    }
  };

  // =========================================================================
  // ADMINISTRACION Y FINANZAS (FASE 8)
  // =========================================================================
  const handleMarkAsPaid = async (teacherId, amount) => {
    if (amount <= 0) {
      alert("Este profesor no tiene saldo neto para cobrar.");
      return;
    }

    if (!window.confirm(`¿Confirmas que ya transferiste R$ ${amount.toFixed(2)} vía PIX a este profesor? Su saldo a pagar regresará a cero.`)) {
      return;
    }

    if (isUsingSupabase && !isDemoMode) {
      try {
        const response = await fetch("/api/payouts/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacher_id: teacherId, amount: amount, payment_method: 'PIX' })
        });
        if (response.ok) {
          loadRealSupabaseData();
          alert("Pago registrado con éxito en Supabase.");
        }
      } catch (err) {
        console.error("API error", err);
      }
    } else {
      const newPayout = {
        id: `pay-${Date.now()}`,
        id_teacher: teacherId,
        amount: amount,
        payment_method: 'PIX',
        created_at: new Date().toISOString()
      };
      setPayouts(prev => [newPayout, ...prev]);
      setBookings(prev => prev.map(b => {
        if (b.id_teacher === teacherId && b.status === 'completed') {
          return { ...b, payout_id: newPayout.id };
        }
        return b;
      }));
      alert("¡Transacción registrada! El saldo del profesor ha sido liquidado.");
    }
  };

  const handleApproveTeacher = async (teacherId) => {
    if (isUsingSupabase && !isDemoMode) {
      await supabase.from('teachers').update({ status: 'active' }).eq('id', teacherId);
      loadRealSupabaseData();
    } else {
      setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, status: 'active' } : t));
    }
    alert("El tutor ha sido aprobado exitosamente y ahora aparece en el catálogo.");
  };

  const handleRegisterOnboarding = async (e) => {
    e.preventDefault();

    const newTeacherData = {
      id: isUsingSupabase && !isDemoMode ? undefined : `t-onb-${Date.now()}`,
      name: onboardingForm.name,
      email: onboardingForm.email,
      language: onboardingForm.language,
      bio: onboardingForm.bio,
      hourly_rate: Number(onboardingForm.hourly_rate),
      video_url: onboardingForm.video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      avatar_url: onboardingForm.avatar_url,
      timezone: onboardingForm.timezone,
      status: 'pending_approval', 
      rating: 5.00,
      commission_tier: 0.20,
      meeting_link: `https://meet.google.com/meet-${Math.floor(Math.random() * 1000)}`
    };

    if (isUsingSupabase && !isDemoMode) {
      const { error } = await supabase.from('teachers').insert([newTeacherData]);
      if (!error) loadRealSupabaseData();
    } else {
      setTeachers(prev => [...prev, newTeacherData]);
    }
    setOnboardingSubmitted(true);
  };

  // Filtrado de profesores activos (escaparate público)
  const activeTeachersList = teachers.filter(t => t.status === 'active');
  const filteredActiveTeachers = activeTeachersList.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = selectedLanguageFilter === 'Todos' || t.language === selectedLanguageFilter;
    const matchesRate = t.hourly_rate <= maxRate;
    return matchesSearch && matchesLanguage && matchesRate;
  });

  const pendingTeachersList = teachers.filter(t => t.status === 'pending_approval');

  const getTeacherFinancialSummary = (teacher) => {
    const unpaidBookings = bookings.filter(
      b => b.id_teacher === teacher.id && b.status === 'completed' && !b.payout_id
    );
    const gross = unpaidBookings.reduce((sum, b) => sum + Number(b.credit_cost), 0);
    const net = gross * (1 - teacher.commission_tier);
    return { completedClassesCount: unpaidBookings.length, gross, net };
  };

  const alexandreCompletedBookings = bookings.filter(
    b => b.id_teacher === profile?.id && b.status === 'completed'
  );
  const grossEarnings = alexandreCompletedBookings.reduce((sum, b) => sum + Number(b.credit_cost), 0);
  const netEarnings = grossEarnings * (1 - 0.20); // Por defecto comisión del 20%

  const getSlotIcon = (timeStr) => {
    const hour = parseInt(timeStr.split(':')[0]);
    if (hour < 12) {
      return <Sun className="w-4 h-4 text-amber-500" />;
    }
    return <Moon className="w-4 h-4 text-indigo-500" />;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
        <div className="glass p-8 rounded-3xl text-center space-y-3 border border-white/20">
          <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-700 text-xs font-semibold">Cargando TutorMarket...</p>
        </div>
      </div>
    );
  }

  // RENDERIZA PESTAÑA LOGIN
  if (activeTab === 'login') {
    return <LoginPage onLoginSuccess={() => setActiveTab('explore')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 text-slate-900 flex flex-col font-sans relative overflow-hidden">
      
      {/* Auroras decorativas */}
      <div className="absolute top-[-300px] left-[-300px] w-[800px] h-[800px] bg-gradient-to-tr from-cyan-300/30 to-emerald-300/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-gradient-to-br from-indigo-300/20 to-teal-200/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* Banner de Control Superior */}
      <div className="bg-slate-900/95 text-slate-300 py-2.5 px-4 text-xs flex flex-wrap justify-between items-center border-b border-slate-800 gap-2 backdrop-blur-md z-40">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Entorno Hermano Aislado</span>
          {isDemoMode && (
            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">
              MODO SIMULADOR ACTIVO
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {profile ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Sesión de: <strong className="text-white">{profile.name}</strong> ({profile.role})</span>
              <button 
                onClick={signOut}
                className="px-2 py-1 bg-red-600/80 text-white rounded text-[10px] font-bold hover:bg-red-700 transition flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" /> Salir
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setActiveTab('login')}
              className="px-2.5 py-1 bg-cyan-600 text-white rounded text-[10px] font-bold hover:bg-cyan-700 transition"
            >
              Iniciar Sesión / Registrarse
            </button>
          )}

          {/* Selector de Rol Técnico */}
          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
            <span className="text-slate-500 text-[10px]">Rol Demo:</span>
            <select
              value={profile?.role || 'visitor'}
              onChange={async (e) => {
                if (e.target.value === 'visitor') {
                  await signOut();
                  setActiveTab('explore');
                } else {
                  // Simula login de sandbox inmediato
                  const demoEmails = {
                    student: 'tiago.barbosa@example.com',
                    teacher: 'alexandre.silva@example.com',
                    admin: 'admin@conexionamerica.com'
                  };
                  await signOut();
                  await signIn(demoEmails[e.target.value], 'password');
                }
              }}
              className="px-1.5 py-0.5 bg-slate-800 text-white rounded font-bold text-[10px] outline-none cursor-pointer border border-slate-700"
            >
              <option value="visitor">Visitante</option>
              <option value="student">Alumno</option>
              <option value="teacher">Profesor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
      </div>

      {/* HEADER DE ESTILO FRUTIGER AERO (CON AURORA Y CRISTAL - SIN RELOJES) */}
      <header className="sticky top-0 z-30 glass shadow-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-200/50 relative overflow-hidden">
              <div className="absolute top-0.5 left-0.5 w-4 h-2 bg-white/40 rounded-full blur-[0.5px]"></div>
              <BookOpen className="w-5 h-5 relative z-10" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">TUTORMARKET</h1>
              <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Marketplace de Tutores</p>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="hidden md:flex items-center gap-1 bg-white/40 p-1 rounded-xl border border-white/60">
            <button 
              onClick={() => { setActiveTab('explore'); setSelectedTeacher(null); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'explore' ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md' : 'text-slate-700 hover:bg-white/50'}`}
            >
              Explorar Tutores
            </button>
            
            {profile?.role === 'student' && (
              <>
                <button 
                  onClick={() => setActiveTab('my-classes')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'my-classes' ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md' : 'text-slate-700 hover:bg-white/50'}`}
                >
                  Mis Clases {bookings.length > 0 && <span className="bg-cyan-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ml-1">{bookings.length}</span>}
                </button>
                <button 
                  onClick={() => setActiveTab('wallet')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'wallet' ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md' : 'text-slate-700 hover:bg-white/50'}`}
                >
                  Mi Billetera
                </button>
              </>
            )}

            {profile?.role === 'teacher' && (
              <button 
                onClick={() => setActiveTab('teacher')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'teacher' ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md' : 'text-slate-700 hover:bg-white/50'}`}
              >
                Panel de Tutor
              </button>
            )}

            {profile?.role === 'admin' && (
              <button 
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'admin' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-slate-700 hover:bg-white/50'}`}
              >
                Panel Admin
              </button>
            )}

            <button 
              onClick={() => setActiveTab('teacher-onboarding')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'teacher-onboarding' ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md' : 'text-slate-700 hover:bg-white/50'}`}
            >
              Aplicar como Tutor
            </button>
          </nav>

          {/* Saldo de créditos rápido */}
          {profile?.role === 'student' && (
            <div 
              onClick={() => setActiveTab('wallet')}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-300/40 px-3.5 py-1.5 rounded-2xl cursor-pointer hover:shadow-md hover:bg-white/50 transition relative overflow-hidden"
            >
              <div className="absolute top-0.5 left-0.5 w-8 h-4 bg-white/20 rounded-full blur-[0.5px]"></div>
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] text-emerald-800 font-bold leading-none uppercase">Créditos</p>
                <p className="text-sm font-extrabold text-emerald-700">R$ {studentProfile.wallet_balance.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* =========================================================================
            TAB 1: EXPLORAR TUTORES (ESTILO DE MAQUETACIÓN PREPLY EN GRIDS)
            ========================================================================= */}
        {activeTab === 'explore' && !selectedTeacher && (
          <div className="space-y-6">
            
            {/* Banner Publicitario Aero Aurora */}
            <div className="bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-400 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-cyan-200/40 border border-white/20">
              <div className="absolute top-1 left-1 w-[98%] h-[30%] bg-white/25 rounded-3xl blur-[1px]"></div>
              <div className="absolute right-0 bottom-0 transform translate-x-20 translate-y-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
              
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

            {/* Layout en columnas tipo Preply: Barra de filtros izquierda + Listado derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Barra lateral de filtros */}
              <div className="lg:col-span-1 bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-sm space-y-6 h-fit">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <SlidersHorizontal className="w-5 h-5 text-cyan-600" />
                  <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Filtros</h3>
                </div>

                {/* Filtro por buscador */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Buscar Tutor</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Nombre o biografía..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-cyan-500 text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Filtro por idioma (Fase 5) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">Idioma</label>
                  <div className="flex flex-col gap-1.5">
                    {['Todos', 'Inglés', 'Español'].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setSelectedLanguageFilter(lang)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          selectedLanguageFilter === lang 
                            ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-sm font-bold' 
                            : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-800'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro por tarifa máx */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                    <span>Precio Máximo</span>
                    <span className="text-cyan-700 font-extrabold font-mono">R$ {maxRate}</span>
                  </div>
                  <input 
                    type="range" 
                    min="40" 
                    max="150" 
                    value={maxRate}
                    onChange={(e) => setMaxRate(Number(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                </div>
              </div>

              {/* Listado de tarjetas de tutores */}
              <div className="lg:col-span-3 space-y-6">
                {filteredActiveTeachers.map(teacher => (
                  <div key={teacher.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col md:flex-row relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-300/0 via-white/0 to-white/20 pointer-events-none transition-all duration-500 group-hover:via-white/10"></div>
                    
                    {/* Foto y Detalles básicos izquierda */}
                    <div className="p-6 md:w-3/4 space-y-4 flex flex-col justify-between">
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="relative shrink-0">
                          <img src={teacher.avatar_url} className="w-18 h-18 rounded-2xl object-cover ring-2 ring-slate-100 shadow" alt={teacher.name} />
                          <span className="absolute bottom-[-4px] right-[-4px] bg-gradient-to-r from-cyan-500 to-teal-400 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg border border-white">
                            {teacher.language}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-base text-slate-900 group-hover:text-cyan-700 transition">{teacher.name}</h3>
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span className="font-bold text-xs text-slate-800">{teacher.rating}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                            <Globe className="w-3.5 h-3.5 text-cyan-500" />
                            <span>Tutor en zona horaria: {teacher.timezone}</span>
                          </div>
                          
                          <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                            {teacher.bio}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Precios y Acción derecha (Columna fija Preply) */}
                    <div className="p-6 md:w-1/4 bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-between items-center text-center gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Tarifa por Hora</span>
                        <p className="text-2xl font-black text-slate-800 font-mono">R$ {teacher.hourly_rate}</p>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          PIX / Tarjeta
                        </span>
                      </div>

                      <button 
                        onClick={() => { setSelectedTeacher(teacher); setBookingDate(""); setBookingSlot(null); }}
                        className="w-full py-2.5 bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 text-white rounded-xl font-bold text-xs hover:from-cyan-700 hover:to-emerald-600 shadow transition-all duration-300"
                      >
                        Reservar Clase
                      </button>
                    </div>
                  </div>
                ))}

                {filteredActiveTeachers.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-500 font-medium">
                    No se encontraron tutores con los filtros seleccionados.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DETALLE Y AGENDAMIENTO TIPO PREPLY (FOTO + VIDEO IZQ | CALENDARIO DER) */}
        {activeTab === 'explore' && selectedTeacher && (
          <div className="space-y-6">
            <button 
              onClick={() => { setSelectedTeacher(null); setBookingSlot(null); setInsufficientFundsMessage(false); }}
              className="text-slate-500 hover:text-slate-800 text-sm font-semibold flex items-center gap-1.5"
            >
              ← Volver al directorio
            </button>

            {/* Layout de dos columnas estilo Preply */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Columna Izquierda: Perfil y Presentación */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={selectedTeacher.avatar_url} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-100 shadow" alt="" />
                      <span className="absolute bottom-[-4px] right-[-4px] bg-cyan-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-lg border border-white">
                        {selectedTeacher.language}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedTeacher.name}</h2>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-cyan-500" />
                        Zona Horaria: {selectedTeacher.timezone}
                      </p>
                    </div>
                  </div>

                  {/* Video de Presentación */}
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow">
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

                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">Acerca de {selectedTeacher.name}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">{selectedTeacher.bio}</p>
                  </div>
                </div>
              </div>

              {/* Columna Derecha (Fija): Calendario y Checkout (Fase 6) */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 sticky top-24">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-sm">Reserva tu Clase</h3>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Por Sesión</span>
                      <strong className="text-xl font-black text-emerald-600 font-mono">R$ {selectedTeacher.hourly_rate.toFixed(2)}</strong>
                    </div>
                  </div>

                  {/* 1. Seleccionar Fecha */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">1. Seleccionar Fecha</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingDate}
                      onChange={(e) => {
                        setBookingDate(e.target.value);
                        setBookingSlot(null);
                      }}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-cyan-500 text-xs bg-white"
                    />
                  </div>

                  {/* 2. Seleccionar Horario (Con Soles y Lunas en lugar de Relojes - CRÍTICO) */}
                  {bookingDate && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block">2. Horarios Disponibles (Hora Alumno)</label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {teacherSlots.map((slot, index) => {
                          const isSelected = bookingSlot === slot;
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setBookingSlot(slot)}
                              className={`py-2.5 px-3 border rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-cyan-600 to-teal-500 border-cyan-600 text-white shadow-sm font-bold' 
                                  : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
                              }`}
                            >
                              {getSlotIcon(slot.time)}
                              <span>{slot.time}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Visualización de Zonas Horarias (Fase 3 - Sin Relojes) */}
                  {bookingSlot && bookingDate && (() => {
                    const times = getConvertedTime(bookingSlot.time, selectedTeacher.timezone);
                    return (
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2 text-[11px] leading-relaxed">
                        <div className="flex items-center gap-1.5 text-cyan-600 font-bold">
                          <Activity className="w-3.5 h-3.5" />
                          <span>Husos Horarios Sincronizados</span>
                        </div>
                        <div className="space-y-1 text-slate-600">
                          <p>📍 Tu hora local: <span className="font-bold text-slate-900">{bookingDate} {times.studentLocal}</span></p>
                          <p>🌍 Hora del tutor: <span className="font-bold text-slate-900">{bookingDate} {times.teacherLocal}</span></p>
                          <p>⏱️ Guardado base de datos: <span className="font-bold text-slate-900 font-mono">{times.utc} UTC</span></p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Mensaje de saldo insuficiente con botón de recarga (Fase 6) */}
                  {insufficientFundsMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center space-y-3">
                      <div className="flex justify-center text-red-500">
                        <AlertCircle className="w-6 h-6 animate-bounce" />
                      </div>
                      <h4 className="font-bold text-red-900 text-xs">Saldo Insuficiente en Billetera</h4>
                      <p className="text-[10px] text-red-700 leading-tight">
                        Tu saldo actual es R$ {studentProfile.wallet_balance.toFixed(2)}, pero la clase cuesta R$ {selectedTeacher.hourly_rate.toFixed(2)}.
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
                        className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs shadow hover:from-emerald-600 hover:to-teal-700 transition"
                      >
                        Recargar R$ {selectedTeacher.hourly_rate.toFixed(2)} con Mercado Pago
                      </button>
                    </div>
                  )}

                  {/* Confirmar Reserva */}
                  {!insufficientFundsMessage && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleCreateBooking}
                        disabled={!bookingSlot || !bookingDate}
                        className="w-full py-3 bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 text-white rounded-xl font-bold text-xs shadow hover:from-cyan-700 hover:to-teal-600 transition disabled:opacity-50"
                      >
                        Confirmar Clase (R$ {selectedTeacher.hourly_rate})
                      </button>
                      <p className="text-[9px] text-center text-slate-400 mt-2 font-medium">
                        El valor de la clase se debitará al instante de tu saldo de billetera virtual.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BILLETERA DE CREDITOS */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
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
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30">
                      <Wallet className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/20 flex justify-between text-[11px] text-emerald-100">
                    <p>Alumno: <span className="font-bold text-white">{studentProfile.name}</span></p>
                    <p>Zona Horaria: <span className="font-bold text-white">{studentProfile.timezone}</span></p>
                  </div>
                </div>
              </div>

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

        {/* TAB 3: PANEL DEL PROFESOR (GESTIÓN DE SLOTS E INGRESOS) */}
        {activeTab === 'teacher' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Ingresos Brutos</p>
                  <p className="text-xl font-black text-slate-800">R$ {grossEarnings.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Por Cobrar (Neto)</p>
                  <p className="text-xl font-black text-emerald-600">R$ {netEarnings.toFixed(2)}</p>
                  <span className="text-[9px] text-slate-400 font-medium">Aplicado 20% de comisión</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
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
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Mis Horarios Libres</h3>
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
                  <button type="submit" className="p-1.5 px-3 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-lg text-xs font-bold shadow-sm">
                    Agregar
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Control de Reservas de Alumnos</h3>
                <div className="space-y-3">
                  {bookings.filter(b => b.id_teacher === profile?.id).map(book => {
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
                          <span className="font-extrabold text-xs text-slate-700 mr-2 font-mono">R$ {book.credit_cost.toFixed(2)}</span>
                          
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MIS CLASES (VISTA DEL ALUMNO) */}
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
                        <p className="text-[11px] font-bold text-slate-700 mt-1 font-mono">R$ {book.credit_cost.toFixed(2)}</p>
                      </div>

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
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-xl text-xs font-bold hover:from-cyan-700 hover:to-teal-600 shadow"
                  >
                    Buscar Tutores
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ONBOARDING DE NUEVOS PROFESORES (APLICAR COMO TUTOR) */}
        {activeTab === 'teacher-onboarding' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-1 left-1 w-[98%] h-[10%] bg-cyan-500/5 rounded-t-3xl blur-[1px]"></div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center mx-auto">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Únete como Tutor de Idiomas</h2>
              <p className="text-xs text-slate-500">
                Completa el formulario para postularte. Tu perfil quedará registrado para revisión y aprobación manual por el Administrador.
              </p>
            </div>

            {onboardingSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-emerald-950">¡Postulación Enviada con Éxito!</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Tu perfil ha quedado en estado **Pendiente de Aprobación**. Un administrador revisará tu información y video antes de habilitarte en el catálogo.
                </p>
                <button
                  onClick={() => setOnboardingSubmitted(false)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                >
                  Enviar otra postulación
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterOnboarding} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Nombre Completo</label>
                    <input
                      type="text"
                      value={onboardingForm.name}
                      onChange={(e) => setOnboardingForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="Ej. Marta Gómez"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Correo Electrónico</label>
                    <input
                      type="email"
                      value={onboardingForm.email}
                      onChange={(e) => setOnboardingForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="Ej. marta@example.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Idioma a Enseñar</label>
                    <select
                      value={onboardingForm.language}
                      onChange={(e) => setOnboardingForm(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 text-xs bg-white"
                    >
                      <option value="Español">Español</option>
                      <option value="Inglés">Inglés</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Tarifa por Hora (R$)</label>
                    <input
                      type="number"
                      value={onboardingForm.hourly_rate}
                      onChange={(e) => setOnboardingForm(prev => ({ ...prev, hourly_rate: e.target.value }))}
                      required
                      min="40"
                      max="200"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">URL del Video de Presentación</label>
                  <input
                    type="url"
                    value={onboardingForm.video_url}
                    onChange={(e) => setOnboardingForm(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="Ej. https://www.youtube.com/embed/dQw4w9WgXcQ"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Biografía</label>
                  <textarea
                    value={onboardingForm.bio}
                    onChange={(e) => setOnboardingForm(prev => ({ ...prev, bio: e.target.value }))}
                    required
                    rows="4"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 text-xs bg-white"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-xl font-bold text-xs shadow hover:from-cyan-700 hover:to-teal-600 transition"
                >
                  Enviar Postulación
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 6: PANEL DE ADMINISTRACION */}
        {activeTab === 'admin' && profile?.role === 'admin' && (
          <div className="space-y-8">
            
            {/* Dashboard Financiero */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-teal-600 bg-teal-50 p-0.5 rounded-lg" />
                Liquidaciones Financieras de Profesores (Comisión del 20%)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold">
                      <th className="p-3">Profesor</th>
                      <th className="p-3">Comisión Retenida (20%)</th>
                      <th className="p-3 text-center">Clases Sin Liquidar</th>
                      <th className="p-3">Monto Bruto</th>
                      <th className="p-3">Saldo Neto a Pagar</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.filter(t => t.status === 'active').map(teacher => {
                      const financial = getTeacherFinancialSummary(teacher);
                      return (
                        <tr key={teacher.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-3 flex items-center gap-2">
                            <img src={teacher.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                            <div>
                              <p className="font-bold text-slate-800">{teacher.name}</p>
                              <p className="text-[10px] text-slate-400">{teacher.email}</p>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-600">R$ {(financial.gross * teacher.commission_tier).toFixed(2)}</td>
                          <td className="p-3 text-center font-bold text-slate-700">{financial.completedClassesCount}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">R$ {financial.gross.toFixed(2)}</td>
                          <td className="p-3 font-mono font-extrabold text-emerald-600 bg-emerald-50/20">R$ {financial.net.toFixed(2)}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleMarkAsPaid(teacher.id, financial.net)}
                              disabled={financial.net <= 0}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-bold text-[10px] shadow disabled:opacity-50 hover:from-emerald-600 hover:to-teal-700 transition"
                            >
                              [ Marcar como Pagado ]
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {payouts.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Auditoría de Liquidaciones Archivadas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {payouts.map(pay => {
                      const prof = teachers.find(t => t.id === pay.id_teacher) || {};
                      return (
                        <div key={pay.id} className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/60 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-800">Transferencia PIX a: {prof.name}</p>
                            <p className="text-[9px] text-slate-400">{new Date(pay.created_at).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-emerald-700 font-mono">R$ {Number(pay.amount).toFixed(2)}</p>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase">Liquidado</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Aprobación de Profesores */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-600 bg-purple-50 p-0.5 rounded-lg" />
                Aprobación Manual de Tutores
              </h3>

              <div className="space-y-4">
                {pendingTeachersList.map(teacher => (
                  <div key={teacher.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <img src={teacher.avatar_url} className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-200 shadow" alt="" />
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">{teacher.name}</h4>
                          <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Pendiente</span>
                        </div>
                        <p className="text-xs text-slate-400">Email: {teacher.email} | Tarifa sugerida: **R$ {teacher.hourly_rate}/h**</p>
                        <p className="text-slate-600 text-xs leading-relaxed">{teacher.bio}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleApproveTeacher(teacher.id)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow hover:from-purple-700 hover:to-indigo-700 transition"
                    >
                      Aprobar e Incorporar
                    </button>
                  </div>
                ))}

                {pendingTeachersList.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No hay solicitudes de nuevos tutores pendientes de aprobación.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* WhatsApp Simulator flotante */}
      <div className="fixed bottom-4 right-4 z-50 w-80 bg-slate-900/95 text-slate-200 rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden backdrop-blur-md">
        <div className="bg-slate-800 px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-100">WhatsApp Simulator</h4>
          </div>
          <span className="text-[9px] text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded font-mono">Evolution API</span>
        </div>

        <div className="p-3.5 space-y-2.5 max-h-56 overflow-y-auto">
          {whatsappLogs.map(log => (
            <div key={log.id} className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40 text-[10px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span className="font-bold text-emerald-400">Para: {log.recipient}</span>
                <span>{log.timestamp}</span>
              </div>
              <p className="text-slate-200 leading-tight bg-slate-900/40 p-1.5 rounded">{log.text}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="bg-white/40 border-t border-white/20 py-6 text-center text-[10px] text-slate-400 font-medium z-10">
        <p>Marketplace de Tutores V2.0 | Conexión América &copy; {new Date().getFullYear()}</p>
        <p className="mt-1 text-[9px] text-slate-300">Desarrollo modular y aislado. Versión Hermana.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MarketplaceApp />
    </AuthProvider>
  );
}
