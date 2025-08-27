"use client";

import { useMemo, useState } from "react";
import ToolCard from "./ToolCard";

export type ToolItem = {
  key: string;
  title: string;
  description?: string;
  href: string;
  icon: React.ReactNode;
  tags?: string[]; // usaremos "Fichas"
  disabled?: boolean;
  badge?: string;
};

export default function ToolGridClient({ items }: { items: ToolItem[] }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string>("");

  // Solo 2 filtros: Todas / Fichas
  const allowedTags = ["Fichas"] as const;

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return items.filter(i => {
      const matchesQ =
        !qn ||
        i.title.toLowerCase().includes(qn) ||
        i.description?.toLowerCase().includes(qn);
      const matchesTag = !tag || i.tags?.includes(tag);
      return matchesQ && matchesTag;
    });
  }, [items, q, tag]);

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-80">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar herramienta…"
            className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] text-[#111827]
                       outline-none focus:ring-2 focus:ring-[#8E8D29]/30 focus:border-[#8E8D29] transition"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#9ca3af]">
            Enter
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTag("")}
            className={`px-3 py-1.5 rounded-lg border text-[13px] transition
                        ${!tag ? "bg-[#8E8D29] text-white border-[#8E8D29]" : "bg-white text-[#374151] border-[#e5e7eb]"}`}
          >
            Todas
          </button>
          {allowedTags.map(t => (
            <button
              key={t}
              onClick={() => setTag(tag === t ? "" : t)}
              className={`px-3 py-1.5 rounded-lg border text-[13px] transition
                          ${tag === t ? "bg-[#8E8D29] text-white border-[#8E8D29]" : "bg-white text-[#374151] border-[#e5e7eb]"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="col-span-full text-center text-[#6b7280] text-sm py-10 border rounded-xl bg-white">
            No hay resultados para “{q}”.
          </div>
        )}
      </div>
    </>
  );
}
