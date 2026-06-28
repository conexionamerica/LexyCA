import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Key, Mail, User, Shield, Sparkles, UserCheck } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const { signIn, signUp, isDemoMode } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // student or teacher
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-400 via-teal-300 to-emerald-400 p-4 relative overflow-hidden font-sans">
      
      {/* Esferas orgánicas flotantes - Estilo Frutiger Aero */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-white/20 rounded-full border border-white/30 backdrop-blur-[2px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] bg-white/10 rounded-full border border-white/20 pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-[5%] w-24 h-24 bg-gradient-to-tr from-cyan-200/40 to-white/20 rounded-full border border-white/25 pointer-events-none"></div>

      {/* Tarjeta de Cristal Templado (Glassmorphism) */}
      <div className="w-full max-w-md bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-2xl relative z-10 overflow-hidden group">
        
        {/* Destello glossy superior típico */}
        <div className="absolute top-1 left-1 w-[98%] h-[30%] bg-white/30 rounded-t-3xl blur-[0.5px]"></div>

        <div className="text-center space-y-3 relative z-10 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-300/40 mx-auto relative overflow-hidden">
            <div className="absolute top-0.5 left-0.5 w-6 h-3 bg-white/35 rounded-full blur-[0.5px]"></div>
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent tracking-tight">TUTORMARKET 2.0</h2>
            <p className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">Aprende, Enseña y Crece</p>
          </div>
        </div>

        {/* Selector de Pestañas (Login / Registro) */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/40 rounded-2xl border border-white/20 mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              isLogin 
                ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              !isLogin 
                ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Mensajes de error */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs font-semibold text-center flex items-center justify-center gap-1.5 mb-4 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {!isLogin && (
            <>
              {/* Campo Nombre */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Tiago Barbosa"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200/60 rounded-xl outline-none focus:border-cyan-500 text-xs bg-white/80"
                  />
                </div>
              </div>

              {/* Selector de Rol */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">¿Qué deseas hacer?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 border rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                      role === 'student'
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-slate-200 bg-white/50 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Estudiar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-2 border rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                      role === 'teacher'
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-slate-200 bg-white/50 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Dar Clases
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Campo Correo */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full pl-10 pr-4 py-2 border border-slate-200/60 rounded-xl outline-none focus:border-cyan-500 text-xs bg-white/80"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Contraseña</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 border border-slate-200/60 rounded-xl outline-none focus:border-cyan-500 text-xs bg-white/80"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 text-white rounded-xl font-bold text-xs shadow hover:from-cyan-700 hover:to-teal-600 transition flex items-center justify-center gap-1.5"
          >
            {loading ? "Cargando..." : isLogin ? "Ingresar" : "Crear Cuenta"}
          </button>
        </form>

        {isDemoMode && (
          <div className="mt-6 pt-4 border-t border-slate-200/50 text-center space-y-2">
            <span className="text-[9px] bg-amber-500/10 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200/50">
              Modo Sandbox Activo
            </span>
            <p className="text-[9px] text-slate-500">
              Cuentas demo (contraseña: **password**):<br/>
              Alumno: **tiago.barbosa@example.com** | Tutor: **alexandre.silva@example.com**
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// Icono auxiliar de alerta
function AlertCircle(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

// Icono auxiliar de plus
function UserPlus(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.647-6.374-1.765z" />
    </svg>
  );
}
