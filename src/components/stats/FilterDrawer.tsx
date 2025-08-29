"use client";
import React from "react";
import { X, Filter, Sparkles } from "lucide-react";
import FiltersSidebar from "@/components/stats/FiltersSidebar";
import type { Filters } from "@/lib/stats/types";

export default function FilterDrawer({
  open,
  onClose,
  value,
  onChange,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  value: Filters;
  onChange: (p: Partial<Filters>) => void;
  onReset: () => void;
}) {
  const activeFiltersCount = Object.values(value).filter(v => v && v !== '' && v !== '1').length;

  return (
    <div
      className={[
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
    >
      {/* Backdrop moderno */}
      <div
        className={[
          "absolute inset-0 bg-gradient-to-br from-black/30 to-slate-900/50 backdrop-blur-sm transition-all duration-300",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={onClose}
      />

      {/* Panel lateral elegante */}
      <aside
        className={[
          "absolute top-0 bottom-0 right-0 w-[400px] max-w-[90vw]",
          "bg-gradient-to-b from-white via-white to-slate-50/30",
          "backdrop-blur-md shadow-2xl border-l border-slate-200/60",
          "transition-all duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
          "flex flex-col",
        ].join(" ")}
      >
        {/* Header corporativo */}
        <header className="relative overflow-hidden bg-gradient-to-r from-[#D17C22]/5 to-[#8E8D29]/5 border-b border-slate-200/60">
          <div className="absolute inset-0 bg-gradient-to-r from-[#D17C22]/10 to-transparent opacity-20"></div>
          <div className="relative flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#D17C22] to-[#8E8D29] 
                           flex items-center justify-center shadow-lg">
                <Filter size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Filtros avanzados</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles size={14} className="text-[#D17C22]" />
                  <span className="text-sm text-slate-600">
                    {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro activo' : 'filtros activos'}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              className="group w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm 
                       border border-slate-200/60 shadow-sm
                       hover:bg-red-50 hover:border-red-200 hover:shadow-md
                       focus:outline-none focus:ring-2 focus:ring-red-300/40 focus:ring-offset-2
                       transition-all duration-200"
              onClick={onClose}
              aria-label="Cerrar filtros"
            >
              <X size={18} className="mx-auto text-slate-600 group-hover:text-red-600 transition-colors" />
            </button>
          </div>
        </header>

        {/* Contenido con scroll personalizado */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            <FiltersSidebar value={value} onChange={onChange} onReset={onReset} />
            
            {/* Espaciado inferior para scroll cómodo */}
            <div className="h-20"></div>
          </div>
        </div>
        
        {/* Footer con acciones */}
        <div className="border-t border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Filtra y encuentra la información que necesitas
            </div>
            <div className="flex gap-3">
              <button
                onClick={onReset}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-medium
                         hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2
                         transition-all duration-200"
              >
                Limpiar todo
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-md
                         hover:bg-slate-800 hover:shadow-lg
                         focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
                         transition-all duration-200"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
