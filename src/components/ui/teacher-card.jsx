import React from 'react';
import { Star, Globe, Sun, Moon, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TeacherCard({ teacher, onBookClick, className }) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-cyan-200/60",
      "transition-all duration-300 overflow-hidden flex flex-col md:flex-row group relative",
      className
    )}>
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-50/0 to-teal-50/0 group-hover:from-cyan-50/30 group-hover:to-teal-50/20 transition-all duration-500 pointer-events-none rounded-2xl" />

      {/* Left: Teacher Info */}
      <div className="p-5 md:p-6 md:flex-1 space-y-3 relative z-10">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={teacher.avatar_url}
              alt={teacher.name}
              className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-cyan-500 to-teal-400 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg border-2 border-white shadow-sm">
              {teacher.language}
            </span>
          </div>

          {/* Name & Meta */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base leading-tight truncate group-hover:text-cyan-700 transition-colors">
                {teacher.name}
              </h3>
              <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="font-bold text-[11px] text-amber-700">{teacher.rating}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <Globe className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span className="truncate">{teacher.timezone}</span>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 md:line-clamp-3">
              {teacher.bio}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Price & CTA - Preply-style fixed column */}
      <div className="p-5 md:p-6 md:w-48 lg:w-52 bg-slate-50/60 border-t md:border-t-0 md:border-l border-slate-100 flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 text-center relative z-10">
        <div className="space-y-0.5">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Por hora</span>
          <p className="text-2xl font-black text-slate-800 font-mono tracking-tight">
            R$ {Number(teacher.hourly_rate).toFixed(0)}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 inline-block">
            PIX / Tarjeta
          </span>
        </div>

        <button
          onClick={() => onBookClick?.(teacher)}
          className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 text-white rounded-xl font-bold text-xs hover:from-cyan-700 hover:to-emerald-600 shadow-md shadow-cyan-200/30 hover:shadow-lg hover:shadow-cyan-200/40 transition-all duration-300 flex items-center justify-center gap-1.5"
        >
          Agendar Prueba
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function TeacherCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row animate-pulse">
      <div className="p-6 md:flex-1 space-y-3">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            <div className="h-3 bg-slate-100 rounded w-full" />
          </div>
        </div>
      </div>
      <div className="p-6 md:w-48 bg-slate-50/60 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="h-6 bg-slate-200 rounded w-20" />
        <div className="h-9 bg-slate-200 rounded-xl w-full" />
      </div>
    </div>
  );
}
