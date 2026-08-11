import React from 'react';
import { Sparkles } from 'lucide-react';

export default function LexyAnimatedLogo({ size = 'medium', showSlogan = true }) {
  const isLarge = size === 'large';

  return (
    <div className="group relative flex flex-col justify-center cursor-pointer select-none py-1">
      
      {/* ── 1. LOGO PRINCIPAL (LEXY + IDIOMAS) ── */}
      <div className="flex items-center gap-2 relative z-10">
        <span className={`${
          isLarge ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
        } font-black tracking-tight brand-text-shimmer group-hover:from-cyan-300 group-hover:to-emerald-300 transition-all duration-500`}>
          Lexy
        </span>

        <span className="bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-400/50 text-cyan-300 font-black text-[10px] sm:text-[11px] uppercase px-2.5 py-0.5 rounded-full shadow-lg shadow-cyan-500/20 tracking-widest group-hover:border-cyan-300 group-hover:scale-105 transition-all">
          IDIOMAS
        </span>
      </div>

      {/* ── 2. ESLOGAN COM O BONEQUINHO 3D ORIGINAL MAIOR CAMINHANDO SOBRE AS LETRAS (CERO CAJA NEGRA) ── */}
      {showSlogan && (
        <div className="relative pt-9 sm:pt-10 pb-0.5">
          
          {/* MASCOTE 3D ORIGINAL CAMINHANDO SOBRE O ESLOGAN */}
          <div className="absolute top-0 left-0 z-20 pointer-events-none animate-mascot-walk-slogan flex items-center">
            <div className="relative flex items-center justify-center">
              
              {/* Aura Mágica Brilhante de Luz */}
              <div className="absolute inset-0 bg-cyan-400/40 rounded-full blur-md animate-pulse" />

              {/* IMAGEM 3D DO BONEQUINHO ORIGINAL MAIOR (SEM CAIXA NEGRA GRACIAS A MIX-BLEND-SCREEN) */}
              <img
                src="/lexy_mascot_3d.png"
                alt="Mascote Lexy 3D"
                className={`${
                  isLarge ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-10 h-10 sm:w-12 sm:h-12'
                } object-cover mix-blend-screen drop-shadow-[0_0_18px_rgba(56,189,248,0.9)] transition-transform duration-300 group-hover:scale-115`}
              />

              {/* Estrelinha Mágica na ponta da varinha */}
              <div className="absolute -top-1 -right-1 z-30 animate-wand-wave">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,1)]" />
              </div>
            </div>
          </div>

          {/* LETRAS DEL ESLOGAN SOBRE LAS CUALES CAMINA LA MASCOTA 3D */}
          <div className="flex items-center gap-2 text-[11px] sm:text-xs font-black tracking-wide text-slate-100 relative z-10 pt-1">
            <span className="hover:text-cyan-300 transition-colors">Aprende</span>
            
            {/* Estrelinha Mágica 1 (Caindo da Varinha entre Aprende e Fala) */}
            <span className="inline-flex items-center text-amber-400 animate-star-drop-1">
              ✨
            </span>

            <span className="hover:text-emerald-300 transition-colors">Fala</span>
            
            {/* Estrelinha Mágica 2 (Caindo da Varinha entre Fala e Conecta) */}
            <span className="inline-flex items-center text-cyan-400 animate-star-drop-2">
              ✨
            </span>

            <span className="hover:text-sky-300 transition-colors">Conecta</span>
          </div>

        </div>
      )}

    </div>
  );
}
