import React from 'react';

export default function LexyAnimatedLogo({ size = 'medium', showSlogan = true }) {
  const isLarge = size === 'large';

  return (
    <div className="group inline-flex flex-col items-center justify-center cursor-pointer select-none py-1">
      
      {/* ── FILA SUPERIOR: MASCOTA 3D + ESTRELLA DORADA ✦ + "Lexy IDIOMAS" CON TRANSICIÓN DE COLOR ── */}
      <div className="flex items-center gap-2.5 relative">
        
        {/* Mascota 3D de la Foto con Aura de Luz */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-md animate-pulse" />
          <img
            src="/lexy_mascot_3d.png"
            alt="Mascote Lexy 3D"
            className={`${
              isLarge ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-11 h-11 sm:w-13 sm:h-13'
            } object-cover mix-blend-screen drop-shadow-[0_0_18px_rgba(56,189,248,0.8)] transition-transform duration-300 group-hover:scale-110`}
          />
        </div>

        {/* Estrella Dorada Destellante (✦) */}
        <span className="text-amber-400 font-black text-xl sm:text-2xl animate-pulse -ml-1 mr-0.5 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
          ✦
        </span>

        {/* Nombre Lexy con Efecto de Transición de Color (brand-text-shimmer) + Cápsula IDIOMAS */}
        <div className="flex flex-col">
          <span className={`${
            isLarge ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
          } font-black tracking-tight brand-text-shimmer transition-all duration-500`}>
            Lexy
          </span>

          <span className="border-2 border-cyan-400/70 text-cyan-300 font-black text-[10px] sm:text-[11px] uppercase px-3 py-0.5 rounded-full shadow-lg shadow-cyan-500/20 tracking-widest text-center mt-0.5 bg-cyan-950/40">
            IDIOMAS
          </span>
        </div>

      </div>

      {/* ── FILA INFERIOR: ESLOGAN "Aprende ✨ Fala ✨ Conecta" ── */}
      {showSlogan && (
        <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm font-black tracking-wide text-white">
          <span className="hover:text-cyan-300 transition-colors">Aprende</span>
          <span className="text-amber-400 animate-pulse">✨</span>
          <span className="hover:text-emerald-300 transition-colors">Fala</span>
          <span className="text-amber-400 animate-pulse">✨</span>
          <span className="hover:text-sky-300 transition-colors">Conecta</span>
        </div>
      )}

    </div>
  );
}
