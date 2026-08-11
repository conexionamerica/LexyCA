import React from 'react';

export default function LexyAnimatedLogo({ size = 'medium', showSlogan = true }) {
  const isLarge = size === 'large';

  return (
    <div className="group flex items-center gap-3 cursor-pointer select-none py-1">
      
      {/* 1. MASCOTE DA LEXY ESTÁTICO AO LADO (SEM CORTE, SEM NENHUM QUADRADO/FUNDO NEGRO) */}
      <div className="relative flex-shrink-0">
        <svg
          className={`${isLarge ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-10 h-10 sm:w-11 sm:h-11'} filter drop-shadow-[0_0_12px_rgba(56,189,248,0.7)] group-hover:scale-105 transition-transform duration-300`}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sombrinha de Luz nos pézinhos */}
          <ellipse cx="50" cy="88" rx="20" ry="4" fill="#0284c7" opacity="0.4" />

          {/* Pézinhos */}
          <ellipse cx="38" cy="84" rx="7" ry="4.5" fill="#0284c7" />
          <ellipse cx="62" cy="84" rx="7" ry="4.5" fill="#0284c7" />

          {/* Corpo Redondinho Azul Gradiente */}
          <circle cx="50" cy="48" r="32" fill="url(#lexyBodyGradStatic)" />

          {/* Barriguinha Azul Claro */}
          <circle cx="50" cy="52" r="20" fill="url(#lexyBellyGradStatic)" opacity="0.85" />

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

          {/* Mãozinha Direita com Varita Mágica */}
          <g>
            <circle cx="80" cy="40" r="5.5" fill="#38bdf8" />
            <line x1="78" y1="43" x2="94" y2="18" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
            <polygon points="94,12 96,17 101,18 97,21 98,26 94,23 90,26 91,21 87,18 92,17" fill="#f59e0b" />
            <circle cx="94" cy="18" r="3.5" fill="#ffffff" opacity="0.9" />
          </g>

          {/* Gradientes SVG */}
          <defs>
            <linearGradient id="lexyBodyGradStatic" x1="18" y1="16" x2="82" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="lexyBellyGradStatic" x1="30" y1="32" x2="70" y2="72" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e0f2fe" />
              <stop offset="1" stopColor="#bae6fd" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 2. MARCA E ESLOGAN LIMPOS Y ELEGANTES */}
      <div className="flex flex-col">
        {/* Título Lexy + Badge IDIOMAS */}
        <div className="flex items-center gap-1.5">
          <span className={`${
            isLarge ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
          } font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent`}>
            Lexy
          </span>

          <span className="bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-black text-[10px] uppercase px-2 py-0.5 rounded-full tracking-wider">
            IDIOMAS
          </span>
        </div>

        {/* Eslogan Oficial Estático */}
        {showSlogan && (
          <span className="text-[10px] sm:text-[11px] text-cyan-300/90 font-extrabold tracking-wide mt-0.5">
            Aprende • Fala • Conecta
          </span>
        )}
      </div>

    </div>
  );
}
