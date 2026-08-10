import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Key, User, UserCheck, GraduationCap, AlertTriangle, CreditCard as CpfIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { validateCPF, formatCPF } from '../lib/cpfValidator';

export default function LoginPage({ onLoginSuccess }) {
  const { signIn, signUp, isDemoMode, profile } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCpfChange = (e) => {
    const raw = e.target.value;
    const formatted = formatCPF(raw);
    setCpf(formatted);

    const clean = raw.replace(/\D/g, '');
    if (clean.length === 11) {
      if (!validateCPF(clean)) {
        setCpfError('CPF inválido. Verifique os dígitos.');
      } else {
        setCpfError('');
      }
    } else {
      setCpfError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          onLoginSuccess();
        }
      } else {
        const cleanCPF = cpf.replace(/\D/g, '');
        if (!validateCPF(cleanCPF)) {
          setErrorMsg('Por favor, informe um CPF verdadeiro e válido.');
          setCpfError('CPF verdadero y válido es obligatorio.');
          setLoading(false);
          return;
        }

        const { data, error } = await signUp(email, password, name, role);
        if (error) {
          setErrorMsg(error.message);
        } else {
          alert(
            role === 'teacher'
              ? "¡Registro exitoso! Tu perfil de tutor ha sido registrado en estado 'Pendiente de Aprobación'. Un administrador lo revisará."
              : "¡Bienvenido a TutorMarket! Tu cuenta de alumno con R$ 100 de regalo ha sido creada."
          );
          onLoginSuccess();
        }
      }
    } catch (err) {
      setErrorMsg('Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    setErrorMsg('');
  };

  React.useEffect(() => {
    if (profile) {
      if (profile.role === 'student') navigate('/dashboard/student');
      else if (profile.role === 'teacher') navigate('/dashboard/teacher');
      else if (profile.role === 'admin' || profile.role === 'superadmin') navigate('/admin');
    }
  }, [profile, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-400 via-teal-300 to-emerald-400 p-4 relative overflow-hidden font-sans">

      {/* ── Esferas orgánicas flotantes · Frutiger Aero ── */}
      <div className="absolute -top-20 -left-20 w-[360px] h-[360px] bg-white/20 rounded-full border border-white/30 backdrop-blur-[2px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-28 -right-12 w-[420px] h-[420px] bg-white/10 rounded-full border border-white/20 pointer-events-none" />
      <div className="absolute bottom-[18%] left-[4%] w-28 h-28 bg-gradient-to-tr from-cyan-200/40 to-white/20 rounded-full border border-white/25 pointer-events-none" />
      <div className="absolute top-[12%] right-[8%] w-16 h-16 bg-white/15 rounded-full border border-white/25 pointer-events-none animate-bounce" style={{ animationDuration: '6s' }} />
      <div className="absolute top-[55%] right-[15%] w-10 h-10 bg-gradient-to-bl from-emerald-200/30 to-white/15 rounded-full border border-white/20 pointer-events-none" />

      {/* ── Tarjeta principal · Glassmorphism ── */}
      <Card className="w-full max-w-md bg-white/60 backdrop-blur-xl rounded-3xl border-white/40 shadow-2xl relative z-10 overflow-hidden">

        {/* Destello glossy superior */}
        <div className="absolute top-1 left-1 w-[98%] h-[28%] bg-white/30 rounded-t-3xl blur-[0.5px] pointer-events-none" />

        {/* ── Encabezado con logo ── */}
        <CardHeader className="text-center space-y-3 relative z-10 pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-300/40 relative overflow-hidden">
            <div className="absolute top-0.5 left-0.5 w-6 h-3 bg-white/35 rounded-full blur-[0.5px]" />
            <BookOpen className="w-6 h-6 relative z-10" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent tracking-tight">
              TUTORMARKET 2.0
            </CardTitle>
            <p className="text-[10px] text-teal-700 font-bold uppercase tracking-wider mt-1">
              Aprende, Enseña y Crece
            </p>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-5">

          {/* ── Selector de pestañas ── */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/40 rounded-2xl border border-white/20">
            <button
              type="button"
              onClick={() => switchTab(true)}
              className={cn(
                'py-2.5 rounded-xl text-xs font-bold transition-all duration-200',
                isLogin
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/40'
              )}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => switchTab(false)}
              className={cn(
                'py-2.5 rounded-xl text-xs font-bold transition-all duration-200',
                !isLogin
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/40'
              )}
            >
              Crear Cuenta
            </button>
          </div>

          {/* ── Mensaje de error ── */}
          {errorMsg && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-3 text-red-700 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-[shake_0.3s_ease-in-out]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── Formulario ── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Campos exclusivos del registro */}
            {!isLogin && (
              <>
                {/* Nombre completo */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Tiago Barbosa"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* CPF Verdadero */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1 flex items-center gap-1">
                    <CpfIcon className="w-3.5 h-3.5 text-teal-600" /> CPF (Verdadero)
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      required
                      maxLength={14}
                      value={cpf}
                      onChange={handleCpfChange}
                      placeholder="000.000.000-00"
                      className={cn("pl-4", cpfError && "border-red-500 focus:ring-red-500")}
                    />
                  </div>
                  {cpfError && <p className="text-[10px] font-bold text-red-500 ml-1">{cpfError}</p>}
                </div>

                {/* Selector de rol */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">
                    ¿Qué deseas hacer?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={role === 'student' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRole('student')}
                      className={cn(
                        'flex items-center justify-center gap-1.5 transition-all',
                        role === 'student'
                          ? 'ring-2 ring-cyan-300 ring-offset-1'
                          : ''
                      )}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Estudiar
                    </Button>
                    <Button
                      type="button"
                      variant={role === 'teacher' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRole('teacher')}
                      className={cn(
                        'flex items-center justify-center gap-1.5 transition-all',
                        role === 'teacher'
                          ? 'ring-2 ring-cyan-300 ring-offset-1'
                          : ''
                      )}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      Dar Clases
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Correo electrónico */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">
                Contraseña
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Botón de envío */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading
                ? 'Cargando...'
                : isLogin
                  ? 'Ingresar'
                  : 'Crear Cuenta'}
            </Button>
          </form>

          {/* ── Aviso de modo demo ── */}
          {isDemoMode && (
            <div className="pt-4 border-t border-slate-200/50 text-center space-y-2">
              <span className="inline-block text-[9px] bg-amber-500/10 text-amber-700 font-bold px-2.5 py-0.5 rounded-full border border-amber-200/50">
                Modo Sandbox Activo
              </span>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                Cuentas demo (contraseña: <strong>password</strong>):<br />
                Alumno: <strong>tiago.barbosa@example.com</strong><br />
                Tutor: <strong>alexandre.silva@example.com</strong>
              </p>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
