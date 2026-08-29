import React from 'react';

export const TechVeinsBackground = ({ children, className = "" }) => {
  return (
    <div className={`relative bg-slate-950 text-white overflow-hidden ${className}`}>
      {/* Ambient Radial Gradients (Very Soft) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-950/20 via-slate-950 to-[#02040a] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-transparent pointer-events-none z-0" />

      {/* SVG Honeycomb / Colmena Tech Veins (Ultra Subtle & Delicate) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-25"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        <defs>
          {/* Subtle Glow Filter */}
          <filter id="hexGlowFilterMarketplace" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Honeycomb Pattern Unit (Fine & Delicate Lines) */}
          <pattern
            id="honeycombPatternMarketplace"
            width="56"
            height="97"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 28 0 L 56 16 L 56 48 L 28 64 L 0 48 L 0 16 Z
                 M 28 64 L 56 80 L 56 112 L 28 128 L 0 112 L 0 80 Z"
              fill="none"
              stroke="rgba(0, 240, 255, 0.05)"
              strokeWidth="0.6"
            />
          </pattern>

          {/* Soft Sky-Blue Gradients */}
          <linearGradient id="hexVeinGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="hexVeinGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.05" />
            <stop offset="60%" stopColor="#00d2ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.05" />
          </linearGradient>

          {/* Soft Glowing Hex Node Radial Gradient */}
          <radialGradient id="hexNodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Base Honeycomb Matrix Grid */}
        <rect width="100%" height="100%" fill="url(#honeycombPatternMarketplace)" />

        {/* 2. Highlighted Fine Vein Streams */}
        <g filter="url(#hexGlowFilterMarketplace)">
          {/* Stream 1 - Top-Left to Center-Right */}
          <path
            d="M 28 16 L 56 32 L 84 16 L 112 32 L 140 16 L 168 32 L 196 16 L 224 32 
               L 252 48 L 280 64 L 308 80 L 336 96 L 364 80 L 392 96 L 420 80 
               L 448 96 L 476 112 L 504 128 L 532 144 L 560 128 L 588 144 L 616 128 
               L 644 144 L 672 160 L 700 176 L 728 192 L 756 176 L 784 192 L 812 176 
               L 840 192 L 868 208 L 896 224 L 924 240 L 952 224 L 980 240 L 1008 224
               L 1036 240 L 1064 256 L 1092 272 L 1120 288 L 1148 272 L 1176 288 L 1204 272"
            fill="none"
            stroke="url(#hexVeinGrad1)"
            strokeWidth="1.2"
            strokeDasharray="8 4 2 4"
          />

          {/* Stream 2 - Mid-Left to Bottom-Right */}
          <path
            d="M 0 336 L 28 320 L 56 336 L 84 320 L 112 336 L 140 352 L 168 368 
               L 196 384 L 224 400 L 252 416 L 280 400 L 308 416 L 336 400 L 364 416 
               L 392 432 L 420 448 L 448 464 L 476 480 L 504 496 L 532 480 L 560 496 
               L 588 512 L 616 528 L 644 544 L 672 560 L 700 576 L 728 560 L 756 576 
               L 784 592 L 812 608 L 840 624 L 868 640 L 896 656 L 924 672 L 952 688"
            fill="none"
            stroke="url(#hexVeinGrad2)"
            strokeWidth="1.2"
          />

          {/* Stream 3 - Top Right Branching Downward */}
          <path
            d="M 1440 96 L 1412 112 L 1384 96 L 1356 112 L 1328 128 L 1300 144 
               L 1272 160 L 1244 176 L 1216 192 L 1188 208 L 1160 224 L 1132 208 
               L 1104 224 L 1076 240 L 1048 256 L 1020 272 L 992 288 L 964 304"
            fill="none"
            stroke="url(#hexVeinGrad1)"
            strokeWidth="1"
            strokeOpacity="0.3"
          />
        </g>

        {/* 3. Soft Junction Nodes */}
        {[
          { cx: 168, cy: 32, r: 2.5 },
          { cx: 280, cy: 64, r: 3 },
          { cx: 476, cy: 112, r: 3.5 },
          { cx: 644, cy: 144, r: 2.5 },
          { cx: 868, cy: 208, r: 3.5 },
          { cx: 1120, cy: 288, r: 3 },
          { cx: 196, cy: 384, r: 2.5 },
          { cx: 420, cy: 448, r: 3.5 },
          { cx: 616, cy: 528, r: 3 },
          { cx: 840, cy: 624, r: 3.5 }
        ].map((node, i) => (
          <g key={i}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r * 2.5}
              fill="url(#hexNodeGlow)"
              className="animate-pulse"
              style={{ animationDuration: `${3 + (i % 3)}s` }}
            />
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill="#00f0ff"
              fillOpacity="0.6"
              filter="url(#hexGlowFilterMarketplace)"
            />
          </g>
        ))}
      </svg>

      {/* Foreground Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default TechVeinsBackground;
