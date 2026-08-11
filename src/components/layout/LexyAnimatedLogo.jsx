import React from 'react';

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

      {/* ── 2. ESLOGAN COM O BONEQUINHO CAMINHANDO COM PATICAS DIRETAMENTE SOBRE AS LETRAS ── */}
      {showSlogan && (
        <div className="relative pt-6 pb-0.5">
          
          {/* BONEQUINHO COM PATICAS CAMINANDO DIRECTAMENTE SOBRE LAS LETRAS DEL ESLOGAN */}
          <div className="absolute top-0 left-0 z-20 pointer-events-none animate-mascot-walk-slogan flex items-center">
            <svg
              className={`${isLarge ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-7 h-7 sm:w-8 sm:h-8'} filter drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]`}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* PATICA IZQUIERDA ANIMADA QUE CAMINA */}
              <ellipse cx="38" cy="85" rx="8" ry="5" fill="#0284c7" className="animate-foot-left" />

              {/* PATICA DERECHA ANIMADA QUE CAMINA */}
              <ellipse cx="62" cy="85" rx="8" ry="5" fill="#0284c7" className="animate-foot-right" />

              {/* Sombra suave nos pézinhos */}
              <ellipse cx="50" cy="88" rx="22" ry="3.5" fill="#0284c7" opacity="0.3" />

              {/* Corpo Redondinho Azul Gradiente */}
              <circle cx="50" cy="48" r="32" fill="url(#lexyBodyGradFeet)" />

              {/* Barriguinha Azul Claro */}
              <circle cx="50" cy="52" r="20" fill="url(#lexyBellyGradFeet)" opacity="0.85" />

              {/* Olhos Brilhantes Expressivos */}
              <circle cx="41" cy="40" r="5" fill="#0f172a" />
              <circle cx="59" cy="40" r="5" fill="#0f172a" />
              <circle cx="43" cy="38" r="2" fill="#ffffff" />
              <circle cx="61" cy="38" r="2" fill="#ffffff" />

              {/* Sorriso Fofo */}
              <path d="M 44 52 Q 50 60 56 52" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />

              {/* Bochechas Rosadinhas */}
              <circle cx="35" cy="47" r="3.5" fill="#f43f5e" opacity="0.5" />
              <circle cx="65" cy="47" r="3.5" fill="#f43f5e" opacity="0.5" />

              {/* Mãozinha Esquerda */}
              <circle cx="18" cy="50" r="5" fill="#38bdf8" />

              {/* Mãozinha Direita Segurando a Varita Mágica */}
              <g className="animate-wand-wave">
                <circle cx="80" cy="40" r="5.5" fill="#38bdf8" />
                {/* Varita Mágica Dourada */}
                <line x1="78" y1="43" x2="94" y2="18" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
                {/* Ponta Mágica Brilhante */}
                <polygon points="94,12 96,17 101,18 97,21 98,26 94,23 90,26 91,21 87,18 92,17" fill="#f59e0b" />
                <circle cx="94" cy="18" r="4" fill="#ffffff" className="animate-ping" opacity="0.7" />
              </g>

              {/* Gradientes SVG */}
              <defs>
                <linearGradient id="lexyBodyGradFeet" x1="18" y1="16" x2="82" y2="80" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="lexyBellyGradFeet" x1="30" y1="32" x2="70" y2="72" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#e0f2fe" />
                  <stop offset="1" stopColor="#bae6fd" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* LETRAS DEL ESLOGAN SOBRE LAS CUALES CAMINA LA MASCOTA */}
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
