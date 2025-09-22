"use client";

import { useMemo, useState } from "react";
import ToolCard from "./ToolCard";
import { useCurrentUser } from "@/shared/hooks/useCurrentUser";
import { useCorporateColorClasses } from "@/shared/hooks/useCorporateColors";

export type ToolItem = {
  key: string;
  title: string;
  description?: string;
  href: string;
  icon: React.ReactNode;
  tags?: string[];
  disabled?: boolean;
  badge?: string;
  adminOnly?: boolean;
};

export default function ToolGridClient({ items }: { items: ToolItem[] }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string>("");
  const { isAdmin } = useCurrentUser();

  // Filtros disponibles
  const allowedTags = ["Fichas", "Administración"] as const;

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return items.filter(i => {
      // Filtrar herramientas solo para admin
      if (i.adminOnly && !isAdmin) {
        return false;
      }
      
      const matchesQ =
        !qn ||
        i.title.toLowerCase().includes(qn) ||
        i.description?.toLowerCase().includes(qn);
      const matchesTag = !tag || i.tags?.includes(tag);
      return matchesQ && matchesTag;
    });
  }, [items, q, tag, isAdmin]);

  const { colors } = useCorporateColorClasses();

  return (
    <>
      {/* Filtros Modernos */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="relative flex-1 max-w-md">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar herramienta..."
            className="w-full h-12 rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm px-4 pr-20 
                       text-slate-800 placeholder-slate-400 transition-all duration-200 ease-out
                       focus:bg-white focus:border-transparent focus:ring-2 focus:outline-none
                       hover:border-slate-300"
            style={{ 
              '--tw-ring-color': colors.primary + '40'
            } as any}
            onFocus={(e) => {
              e.target.style.setProperty('--tw-ring-color', colors.primary + '40');
              e.target.classList.add('ring-2');
            }}
            onBlur={(e) => {
              e.target.classList.remove('ring-2');
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md">
            <span className="text-xs font-medium text-slate-500">Enter</span>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setTag("")}
            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
              !tag 
                ? "text-white border-transparent shadow-lg shadow-black/10" 
                : "bg-white/80 backdrop-blur-sm text-slate-700 border-white/30 hover:bg-white hover:shadow-md"
            }`}
            style={!tag ? { 
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`
            } : {}}
          >
            Todas
          </button>
          {allowedTags.map(t => (
            <button
              key={t}
              onClick={() => setTag(tag === t ? "" : t)}
              className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                tag === t 
                  ? "text-white border-transparent shadow-lg shadow-black/10" 
                  : "bg-white/80 backdrop-blur-sm text-slate-700 border-white/30 hover:bg-white hover:shadow-md"
              }`}
              style={tag === t ? { 
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`
              } : {}}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Moderno */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(i => (
          <ToolCard
            key={i.key}
            href={i.href}
            title={i.title}
            description={i.description}
            icon={i.icon}
            badge={i.badge}
            disabled={i.disabled}
          />
        ))}
        {!filtered.length && (
          <div className="col-span-full text-center py-16">
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No hay resultados</h3>
              <p className="text-slate-500">
                No se encontraron herramientas que coincidan con "{q}".
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
