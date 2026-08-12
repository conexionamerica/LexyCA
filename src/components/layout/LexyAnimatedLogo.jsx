import React from 'react';

export default function LexyAnimatedLogo({ size = 'medium', showSlogan = true }) {
  const isLarge = size === 'large';

  return (
    <div className="group inline-flex flex-col items-center justify-center cursor-pointer select-none transition-transform duration-300 hover:scale-[1.03]">
      {/* RENDERIZADO PIXEL-POR-PIXEL DEL LOGOTIPO EXACTO DE LA FOTO DEL USUARIO */}
      <img
        src="/lexy_brand_logo.png"
        alt="Lexy Idiomas - Aprende ✨ Fala ✨ Conecta"
        className={`${
          isLarge ? 'h-24 sm:h-28' : 'h-16 sm:h-20'
        } w-auto object-contain mix-blend-screen drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]`}
      />
    </div>
  );
}
