import React from 'react';
import { Sparkles, Wand2 } from 'lucide-react';

export default function LexyAnimatedLogo({ size = 'medium', showSlogan = true }) {
  const isLarge = size === 'large';

  return (
    <div className="group flex items-center gap-3.5 cursor-pointer select-none transition-all duration-500 hover:scale-[1.03]">
      
      {/* 1. BONEQUINHO DA LEXY COM VARINHA MÁGICA (SEM FUNDO BRANCO, TOTALMENTE INTEGRADO) */}
      <div className="relative flex items-center justify-center">
        {/* Aura Mágica de Luz ao Redor do Bonequinho */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/40 via-sky-400/30 to-amber-400/30 rounded-full blur-lg animate-pulse group-hover:scale-125 transition-transform duration-500" />
        
        {/* Mascote com Varinha Mágica (Mix-blend-mode para eliminar qualquer fundo e integrar ao modo escuro) */}
        <div className="relative z-10 animate-float-gentle">
          <img
            src="/lexy_mascot_wand.png"
            alt="Mascote Lexy"
            className={`${
              isLarge ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-12 h-12 sm:w-14 sm:h-14'
            } object-cover rounded-2xl mix-blend-screen transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]`}
          />
        </div>

        {/* Estrelinha Mágica saindo da Varinha */}
        <div className="absolute -top-1 -right-1 z-20 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 fill-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)] animate-pulse" />
        </div>
      </div>

      {/* 2. TEXTO LEXY + BADGE + ESLOGAN COM PONTOS MÁGICOS */}
      <div className="flex flex-col">
        {/* Título Lexy + Badge IDIOMAS */}
        <div className="flex items-center gap-2">
          <span className={`${
            isLarge ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
          } font-black tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-emerald-300 transition-all duration-500`}>
            Lexy
          </span>

          <span className="bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-400/40 text-cyan-300 font-black text-[10px] sm:text-[11px] uppercase px-2.5 py-0.5 rounded-full shadow-lg shadow-cyan-500/10 tracking-widest group-hover:border-cyan-300 group-hover:scale-105 transition-all">
            IDIOMAS
          </span>
        </div>

        {/* 3. ESLOGAN COM OS PONTOS MÁGICOS COLOCADOS PELA VARINHA DO BONEQUINHO */}
        {showSlogan && (
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] sm:text-xs font-black tracking-wide text-slate-200">
            <span className="hover:text-cyan-300 transition-colors">Aprende</span>
            
            {/* Ponto Mágico 1 (Varinha Mágica) */}
            <span className="inline-flex items-center text-amber-400 animate-pulse">
              ✨
            </span>

            <span className="hover:text-emerald-300 transition-colors">Fala</span>
            
            {/* Ponto Mágico 2 (Varinha Mágica) */}
            <span className="inline-flex items-center text-cyan-400 animate-pulse">
              ✨
            </span>

            <span className="hover:text-sky-300 transition-colors">Conecta</span>
          </div>
        )}
      </div>

    </div>
  );
}
