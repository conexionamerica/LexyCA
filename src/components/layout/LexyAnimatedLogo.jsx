import React from 'react';

export default function LexyAnimatedLogo({ size = 'medium', showSlogan = true, showIdiomas = true }) {
  const isLarge = size === 'large';

  return (
    <div className="group inline-flex flex-col items-center justify-center cursor-pointer select-none py-1">
      
      {/* ── FILA SUPERIOR: MASCOTA 3D MAIS GRANDE + ESTRELLA ✦ + "Lexy" (opcional IDIOMAS) ── */}
      <div className="flex items-center gap-3 relative">
        
        {/* Mascota 3D Destacada Más Grande sin Fondo Negro */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-cyan-400/40 rounded-full blur-lg animate-pulse" />
          
          <img
            src="/lexy_mascot_3d.png"
            alt="Mascote Lexy 3D"
            style={{
              maskImage: 'radial-gradient(circle at center, black 58%, transparent 88%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 58%, transparent 88%)',
            }}
            className={`${
              isLarge ? 'w-16 h-16 sm:w-24 sm:h-24' : 'w-10 h-10 sm:w-14 sm:h-14'
            } object-cover mix-blend-screen drop-shadow-[0_0_22px_rgba(56,189,248,0.95)] transition-transform duration-300 group-hover:scale-110`}
          />
        </div>

        {/* Estrella Dorada Destellante (✦) */}
        <span className="text-amber-400 font-black text-xl sm:text-2xl animate-pulse -ml-1 mr-0.5 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)]">
          ✦
        </span>

        {/* Nombre Lexy + Cápsula IDIOMAS (opcional) */}
        <div className="flex flex-col">
          <span className={`${
            isLarge ? 'text-3xl sm:text-5xl' : 'text-xl sm:text-2xl'
          } font-black tracking-tight brand-text-shimmer transition-all duration-500`}>
            Lexy
          </span>

          {showIdiomas && (
            <span className="border border-cyan-400/70 text-cyan-300 font-black text-[9px] sm:text-[11px] uppercase px-2 py-0.2 sm:px-3 sm:py-0.5 rounded-full shadow-lg shadow-cyan-500/20 tracking-widest text-center mt-0.5 bg-cyan-950/40">
              IDIOMAS
            </span>
          )}
        </div>

      </div>

      {/* ── FILA INFERIOR: ESLOGAN "Aprende ✨ Fala ✨ Conecta" ── */}
      {showSlogan && (
        <div className="hidden sm:flex items-center gap-2 mt-1 text-xs sm:text-sm font-black tracking-wide text-white">
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
