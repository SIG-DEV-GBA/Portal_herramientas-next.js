import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { useCorporateColors } from "@/shared/hooks/useCorporateColors";
import type { ReactNode } from "react";

type Props = {
  href: string;
  title: string;
  description?: string;
  icon: ReactNode;
  badge?: string;     
  disabled?: boolean; 
};

export default function ToolCard({ href, title, description, icon, badge, disabled }: Props) {
  const colors = useCorporateColors();
  
  const inner = (
    <div
      className={[
        "group relative h-full rounded-2xl bg-white/90 backdrop-blur-sm border border-white/20 p-6",
        "shadow-lg shadow-black/5 transition-all duration-300 ease-out",
        "hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 hover:scale-[1.02]",
        disabled ? "opacity-60 pointer-events-none" : "",
        "overflow-hidden"
      ].join(" ")}
    >
      {/* Gradiente sutil de fondo */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}20 0%, transparent 50%, ${colors.accent}10 100%)`
        }}
      />
      
      {/* Contenido principal */}
      <div className="relative z-10">
        {/* Header con icono y badge */}
        <div className="flex items-start justify-between mb-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)` 
            }}
          >
            <div className="text-white">
              {icon}
            </div>
          </div>
          
          {badge && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full">
              <Clock size={12} className="text-orange-500" />
              <span className="text-xs font-semibold text-orange-700">{badge}</span>
            </div>
          )}
        </div>

        {/* Título y descripción */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
              {description}
            </p>
          )}
        </div>

        {/* Footer con indicador y acción */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <div 
              className="h-1 w-8 rounded-full transition-all duration-300 group-hover:w-12"
              style={{ backgroundColor: colors.primary }}
            />
            <div 
              className="h-1 w-4 rounded-full transition-all duration-300 group-hover:w-8"
              style={{ backgroundColor: colors.accent + '60' }}
            />
            <div 
              className="h-1 w-2 rounded-full transition-all duration-300 group-hover:w-4"
              style={{ backgroundColor: colors.primary + '30' }}
            />
          </div>
          
          {!disabled && (
            <div className="flex items-center gap-2 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
                 style={{ color: colors.primary }}>
              <span>Abrir</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          )}
        </div>
      </div>

      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: `linear-gradient(45deg, transparent 30%, ${colors.primary}40 50%, transparent 70%)`
          }}
        />
      </div>
    </div>
  );

  if (disabled) return inner;
  return (
    <Link 
      href={href} 
      className="block focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-2xl transition-all"
      style={{ '--tw-ring-color': colors.primary + '60' } as any}
    >
      {inner}
    </Link>
  );
}
