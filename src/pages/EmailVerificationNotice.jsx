import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Mail } from 'lucide-react';

export default function EmailVerificationNotice() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 p-6">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 text-center shadow-2xl">
        <Mail className="mx-auto w-12 h-12 text-cyan-400 mb-4" />
        <h1 className="text-2xl font-extrabold text-white mb-3">¡Correo de verificación enviado!</h1>
        <p className="text-sm text-slate-300 mb-6">
          Hemos enviado un enlace de confirmación a tu dirección de email. Por favor, haz clic en el
          enlace para activar tu cuenta y poder iniciar sesión.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-colors"
        >
          Volver al login
        </Link>
      </div>
    </div>
  );
}
