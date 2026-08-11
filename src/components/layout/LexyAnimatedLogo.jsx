import React from 'react';

export default function LexyAnimatedLogo({ size = 'medium', showSlogan = true }) {
  const isLarge = size === 'large';

  return (
    <div className="group relative flex flex-col justify-center cursor-pointer select-none pt-7 pb-1">
      
      {/* ── 1. BONEQUINHO DA LEXY 100% VISÍVEL (SEM NENHUM CUADRADO, SEM NENHUM CORTE) CAMINHANDO POR CIMA ── */}
      <div className="relative w-full h-8 flex items-center">
        <div className="absolute left-0 bottom-0 z-20 pointer-events-none animate-mascot-walk-letters flex items-center">
          
          {/* MASCOTA VECTORIAL 100% COMPLETA (CERO CAJA, CERO CORTE) */}
          <div className="relative flex items-center">
            <svg
              className={`${isLarge ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-8 h-8 sm:w-9 sm:h-9'} filter drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]`}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Sombra suave nos pézinhos */}
              <ellipse cx="50" cy="88" rx="20" ry="4" fill="#0284c7" opacity="0.4" />

              {/* Corpo Redondinho Azul Gradiente */}
              <circle cx="50" cy="50" r="32" fill="url(#lexyBodyGradNav)" />

              {/* Barriguinha Azul Claro */}
              <circle cx="50" cy="54" r="20" fill="url(#lexyBellyGradNav)" opacity="0.85" />

              {/* Olhos Brilhantes Expressivos */}
              <circle cx="41" cy="42" r="5" fill="#0f172a" />
              <circle cx="59" cy="42" r="5" fill="#0f172a" />
              <circle cx="43" cy="40" r="2" fill="#ffffff" />
              <circle cx="61" cy="40" r="2" fill="#ffffff" />

              {/* Sorriso Fofo */}
              <path d="M 44 54 Q 50 62 56 54" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />

              {/* Bochechas Rosadinhas */}
              <circle cx="35" cy="49" r="3.5" fill="#f43f5e" opacity="0.5" />
              <circle cx="65" cy="49" r="3.5" fill="#f43f5e" opacity="0.5" />

              {/* Mãozinha Esquerda */}
              <circle cx="18" cy="52" r="5" fill="#38bdf8" />

              {/* Mãozinha Direita Segurando a Varita Mágica */}
              <g className="animate-wand-wave">
                <circle cx="80" cy="42" r="5.5" fill="#38bdf8" />
                {/* Varita Mágica Dourada */}
                <line x1="78" y1="45" x2="94" y2="20" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
                {/* Ponta Mágica Brilhante */}
                <polygon points="94,14 96,19 101,20 97,23 98,28 94,25 90,28 91,23 87,20 92,19" fill="#f59e0b" />
                <circle cx="94" cy="20" r="4" fill="#ffffff" className="animate-ping" opacity="0.7" />
              </g>

              {/* Gradientes SVG */}
              <defs>
                <linearGradient id="lexyBodyGradNav" x1="18" y1="18" x2="82" y2="82" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="lexyBellyGradNav" x1="30" y1="34" x2="70" y2="74" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#e0f2fe" />
                  <stop offset="1" stopColor="#bae6fd" />
                </linearGradient>
              </defs>
            </svg>
          </div>

        </div>
      </div>

      {/* ── 2. LOGO PRINCIPAL (LEXY + IDIOMAS) ── */}
      <div className="flex items-center gap-2 relative z-10 -mt-1">
        <span className={`${
          isLarge ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
        } font-black tracking-tight brand-text-shimmer group-hover:from-cyan-300 group-hover:to-emerald-300 transition-all duration-500`}>
          Lexy
        </span>

        <span className="bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-400/50 text-cyan-300 font-black text-[10px] sm:text-[11px] uppercase px-2.5 py-0.5 rounded-full shadow-lg shadow-cyan-500/20 tracking-widest group-hover:border-cyan-300 group-hover:scale-105 transition-all">
          IDIOMAS
        </span>
      </div>

      {/* ── 3. ESLOGAN COM AS ESTRELINHAS MÁGICAS COLOCADAS PELA VARINHA DO BONEQUINHO ── */}
      {showSlogan && (
        <div className="flex items-center gap-2 mt-0.5 text-[11px] sm:text-xs font-black tracking-wide text-slate-100 relative z-10">
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
      )}

    </div>
  );
}
