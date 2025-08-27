"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// UI de filtros, tarjetas, gráficas y tabla (modularizadas)
import FiltersBar from "@/components/stats/FiltersBar";
import StatCard from "@/components/cards/StatCard";
import FichasPorMesChart from "@/components/charts/FichasPorMesChart";
import PortalesPorMesChart from "@/components/charts/PortalesPorMesChart";
import AmbitosPorPortalChart from "@/components/charts/AmbitosPorPortalChart";
import TramiteOnlineChart from "@/components//charts/TramiteOnlineChart";
import FichasTable from "@/components/stats/table/FichasTable";

// Tipos compartidos
import { Filters } from "@/lib/stats/types";

/* =============================================================
   Hook: estado de filtros sincronizado con la URL
============================================================= */
function useQueryState() {
  const sp = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>(() => ({
    q: sp.get("q") ?? "",
    ambito: sp.get("ambito") ?? "",
    ccaa_id: sp.get("ccaa_id") ?? "",
    provincia_id: sp.get("provincia_id") ?? "",
    tramite_tipo: sp.get("tramite_tipo") ?? "",
    trabajador_id: sp.get("trabajador_id") ?? "",
    anio: sp.get("anio") ?? "2025",
    mes: sp.get("mes") ?? "",
    created_desde: sp.get("created_desde") ?? "",
    created_hasta: sp.get("created_hasta") ?? "",
    take: sp.get("take") ?? "20",
    page: sp.get("page") ?? "1",
  }));

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length > 0) params.set(k, String(v));
    });
    const nextQS = params.toString();
    const pathname = typeof window !== "undefined" ? window.location.pathname : "/dashboard/fichas";
    if (sp.toString() === nextQS) return;
    router.replace(`${pathname}?${nextQS}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const set = (patch: Partial<Filters>) =>
    setFilters((f) => ({ ...f, ...patch, page: patch.page ?? f.page }));

  const reset = () =>
    setFilters({ anio: "2025", take: "20", page: "1" });

  return { filters, set, reset } as const;
}

/* =============================================================
   Página cliente: orquesta filtros, gráficas y tabla
============================================================= */
export default function FichasClient() {
  const { filters, set, reset } = useQueryState();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">📊 Estadísticas de fichas</h1>
          <p className="text-sm text-gray-500">Dashboard con filtros unificados para gráficas y tabla.</p>
        </div>
      </div>

      {/* Filtros */}
      <FiltersBar value={filters} onChange={set} onReset={reset} />

      {/* Tarjetas pequeñas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Año activo" value={filters.anio || "—"} hint="Puedes cambiarlo en filtros" />
        <StatCard title="Mes seleccionado" value={filters.mes || "Todos"} hint="Afecta a ámbitos por portal" />
        <StatCard title="Rango de fechas" value={`${filters.created_desde || ""} → ${filters.created_hasta || ""}`} />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FichasPorMesChart filters={filters} />
        <PortalesPorMesChart filters={filters} />
        <AmbitosPorPortalChart filters={filters} />
        <TramiteOnlineChart filters={filters} />
      </div>

      {/* Tabla */}
      <FichasTable filters={filters} onChange={set} />
    </div>
  );
}
