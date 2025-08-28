"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Sidebar filtros
import FiltersSidebar from "@/components/stats/FiltersSidebar";
import FichasTable from "@/components/stats/table/FichasTable";
// Charts
import ChartCarousel from "@/components/charts/ChartCarousel";
import FichasPorMesChart from "@/components/charts/FichasPorMesChart";
import PortalesPorMesChart from "@/components/charts/PortalesPorMesChart"; // (año)
import AmbitosPorPortalChart from "@/components/charts/AmbitosPorPortalChart";
import TramiteOnlineChart from "@/components/charts/TramiteOnlineChart";
import TematicasTopDonut from "@/components/charts/TematicasTopDonut";
import TematicasMesDonut from "@/components/charts/TematicasMesDonut";

// Tarjetas KPI
import StatCard from "@/components/cards/StatCard";

// Tipos y utils
import type { Filters } from "@/lib/stats/types";
import { asAmbito, asTramite, asComplejidad, monthName } from "@/lib/stats/utils";

/* =============================================================
   Hook: estado de filtros sincronizado con la URL
============================================================= */
function useQueryState() {
  const sp = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>(() => ({
    q: sp.get("q") ?? "",
    ambito: asAmbito(sp.get("ambito")),
    ccaa_id: sp.get("ccaa_id") ?? "",
    provincia_id: sp.get("provincia_id") ?? "",
    tramite_tipo: asTramite(sp.get("tramite_tipo")),
    complejidad: asComplejidad(sp.get("complejidad")),
    trabajador_id: sp.get("trabajador_id") ?? "",
    trabajador_subida_id: sp.get("trabajador_subida_id") ?? "",
    anio: sp.get("anio") ?? String(new Date().getFullYear()),
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
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : "/dashboard/fichas";
    if (sp.toString() === nextQS) return;
    router.replace(`${pathname}?${nextQS}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const set = (patch: Partial<Filters>) =>
    setFilters((f) => ({ ...f, ...patch, page: patch.page ?? f.page }));

  const reset = () =>
    setFilters({
      q: "",
      ambito: "",
      ccaa_id: "",
      provincia_id: "",
      tramite_tipo: "",
      complejidad: "",
      trabajador_id: "",
      trabajador_subida_id: "",
      anio: String(new Date().getFullYear()),
      mes: "",
      created_desde: "",
      created_hasta: "",
      take: "20",
      page: "1",
    });

  return { filters, set, reset } as const;
}

/* =============================================================
   Página: Dashboard con sidebar + charts (responsive) + tabla
============================================================= */
export default function FichasClient() {
  const { filters, set, reset } = useQueryState();

  const mesNombre = useMemo(() => {
    if (!filters.mes) return "Todos";
    return monthName(filters.mes);
  }, [filters.mes]);

  const chartNodes = [
    { key: "fichas-mes", node: <FichasPorMesChart filters={filters} /> },
    { key: "portales-anio", node: <PortalesPorMesChart filters={filters} /> },
    { key: "ambitos-portal", node: <AmbitosPorPortalChart filters={filters} /> },
    { key: "tramite-online", node: <TramiteOnlineChart filters={filters} /> },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] items-start gap-6">
      {/* Sidebar de filtros (sticky en desktop, ancho fijo) */}
      <aside className="w-full lg:w-[360px] lg:sticky lg:top-4 self-start">
        <FiltersSidebar value={filters} onChange={set} onReset={reset} />
      </aside>

      {/* Contenido principal (muy importante min-w-0) */}
      <section className="min-w-0 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Año activo" value={filters.anio || "—"} hint="Cámbialo en el filtro lateral" />
          <StatCard title="Mes seleccionado" value={mesNombre} hint="Vacío = todos los meses" />
          <StatCard
            title="Rango de fechas"
            value={
              filters.created_desde || filters.created_hasta
                ? `${filters.created_desde || "…"} → ${filters.created_hasta || "…"}`
                : "Sin rango"
            }
          />
        </div>

        <div className="max-w-5xl mx-auto min-w-0">
          <ChartCarousel slides={chartNodes} />
            <TematicasTopDonut filters={filters} />
            <TematicasMesDonut filters={filters} />
        </div>
        

        {/* Tabla abajo */}
        <FichasTable filters={filters} onChange={set} />
      </section>
    </div>
  );
}
