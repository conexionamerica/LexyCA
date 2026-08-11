import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-950/80 backdrop-blur-sm border-t border-slate-800/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/lexy_logo.png" alt="Lexy Idiomas" className="w-8 h-8 rounded-xl object-cover border border-cyan-400/40" />
          <span className="text-sm font-extrabold text-white">Lexy Idiomas</span>
          <span className="text-xs text-cyan-300 font-bold">• Aprende • Fala • Conecta</span>
        </div>
        <p className="text-center text-xs text-slate-400 font-medium">
          Lexy IDIOMAS © 2026 - Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
