"use client";
import React, { useMemo, useState } from "react";

export type Tab = { key: string; label: string; node: React.ReactNode };

export default function ChartsTabs({ tabs }: { tabs: Tab[] }) {
  // Asegura que no hay duplicados y que realmente es un Tab[]
  const safeTabs = useMemo<Tab[]>(
    () => tabs.filter(Boolean) as Tab[],
    [tabs]
  );

  const [active, setActive] = useState<string>(() => safeTabs[0]?.key ?? "");

  // Si cambia el listado de tabs y el activo desaparece, re-selecciona el primero
  React.useEffect(() => {
    if (!safeTabs.find(t => t.key === active)) {
      setActive(safeTabs[0]?.key ?? "");
    }
  }, [safeTabs, active]);

  if (safeTabs.length === 0) {
    return (
      <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-6 text-sm text-gray-600">
        No hay pestañas disponibles.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-200">
      <div className="flex flex-wrap gap-2 p-3 border-b border-gray-200">
        {safeTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={[
              "px-3 py-1.5 rounded-full text-sm transition",
              active === t.key
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200",
            ].join(" ")}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {safeTabs.map((t) =>
          t.key === active ? (
            <div key={t.key} className="min-h-[320px]">
              {t.node}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
