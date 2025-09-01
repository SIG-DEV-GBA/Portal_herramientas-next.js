"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";


// Gráficas
import FichasPorMesChart from "@/components/charts/FichasPorMesChart";
import PortalesPorMesChart from "@/components/charts/PortalesPorMesChart";
import AmbitosPorPortalChart from "@/components/charts/AmbitosPorPortalChart";
import TramiteOnlineChart from "@/components/charts/TramiteOnlineChart";
import TematicasDistribucionChart from "@/components/charts/TematicasDistribucionChart";

// Tabs
import ChartsTabs, { type Tab } from "@/components/charts/ChartsTabs";

// Tabla
import FichasTable from "@/components/stats/table/FichasTable";

// Filtros unificados
import UnifiedFilters from "@/components/filters/UnifiedFilters";

// Componentes de gestión
import { PortalesManager } from "@/components/management/PortalesManager";
import { TematicasManager } from "@/components/management/TematicasManager";
import { TrabajadoresManager } from "@/components/management/TrabajadoresManager";

// Tipos / Utils
import type { Filters } from "@/lib/stats/types";
import { asAmbito, asTramite, asComplejidad, monthName } from "@/lib/stats/utils";

// -----------------------------------------------
// Estado sincronizado con querystring
// -----------------------------------------------
function useQueryState() {
  const sp = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>(() => ({
    q: sp.get("q") ?? "",
    ambito: asAmbito(sp.get("ambito")),
    ccaa_id: sp.get("ccaa_id") ?? "",
    provincia_id: sp.get("provincia_id") ?? "",
    provincia_principal: sp.get("provincia_principal") ?? "",
    tramite_tipo: asTramite(sp.get("tramite_tipo")),
    complejidad: asComplejidad(sp.get("complejidad")),
    tematica_id: sp.get("tematica_id") ?? "",
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
    
    // Guardar posición actual del scroll
    const currentScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    
    router.replace(`${pathname}?${nextQS}`, { scroll: false });
    
    // Restaurar posición del scroll después de un breve delay
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.scrollTo({ top: currentScrollY, behavior: 'instant' });
      }, 0);
    }
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
      tematica_id: "",
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

// -----------------------------------------------
// Vista
// -----------------------------------------------
export default function FichasClient() {
  const { filters, set, reset } = useQueryState();
  const [trabajadores, setTrabajadores] = useState<{id: number; nombre: string}[]>([]);
  const [provincias, setProvincias] = useState<{id: number; nombre: string}[]>([]);
  const [, setCcaa] = useState<{id: number; nombre: string}[]>([]);
  const [, setProvinciasRestrictivas] = useState<{id: number; nombre: string}[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<'analisis' | 'datos' | 'portales' | 'tematicas' | 'trabajadores'>('analisis');

  // Cargar datos de lookups
  useEffect(() => {
    Promise.all([
      fetch("/api/lookups/trabajadores?solo_activos=true").then(r => r.json()),
      fetch("/api/lookups/provincias").then(r => r.json()),
      fetch("/api/lookups/ccaa").then(r => r.json())
    ])
    .then(([trabajadoresData, provinciasData, ccaaData]) => {
      setTrabajadores(trabajadoresData || []);
      setProvincias(provinciasData || []);
      setCcaa(ccaaData || []);
      setProvinciasRestrictivas(provinciasData || []);
    })
    .catch(() => {
      setTrabajadores([]);
      setProvincias([]);
      setCcaa([]);
      setProvinciasRestrictivas([]);
    });
  }, []);

  // Actualizar provincias restrictivas cuando cambia CCAA
  useEffect(() => {
    if (filters.ccaa_id) {
      fetch(`/api/lookups/provincias?ccaa_id=${filters.ccaa_id}`)
        .then(r => r.json())
        .then(data => setProvinciasRestrictivas(data || []))
        .catch(() => setProvinciasRestrictivas([]));
    } else {
      setProvinciasRestrictivas(provincias);
    }
  }, [filters.ccaa_id, provincias]);

  const mesNombre = useMemo(() => (filters.mes ? monthName(filters.mes) : "Todos"), [filters.mes]);

  // Tabs de gráficas (una visible a la vez -> menos scroll)
  const charts: Tab[] = [
    { key: "fichas-mes",     label: "Fichas por mes",          node: <FichasPorMesChart         filters={filters} /> },
    { key: "portales-anio",  label: "Portales (año)",          node: <PortalesPorMesChart       filters={filters} /> },
    { key: "ambitos-portal", label: "Ámbitos por portal",      node: <AmbitosPorPortalChart     filters={filters} /> },
    { key: "tramite-online", label: "Trámite online",          node: <TramiteOnlineChart        filters={filters} /> },
    { key: "tematicas",      label: "Temáticas (mes / año)",   node: <TematicasDistribucionChart filters={filters} /> },
  ];

  // Filtros rápidos (siempre visibles)
  const quick = (
    <div className="bg-gradient-to-r from-white to-slate-50/50 rounded-2xl shadow-lg border border-slate-200/60 backdrop-blur-sm">
      {/* Filtros unificados */}
      <UnifiedFilters 
        filters={filters}
        onFilterChange={set}
        onReset={reset}
      />
    </div>
  );

  return (
    <>
      {/* Filtros principales - solo mostrar completos en pestaña de datos */}
      {activeMainTab === 'datos' && quick}

      {/* Main Navigation Tabs */}
      <div className={activeMainTab === 'datos' ? "mt-4" : ""}>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveMainTab('analisis')}
              className={[
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
                activeMainTab === 'analisis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ].join(' ')}
            >
              📊 Análisis y Gráficos
            </button>
            <button
              onClick={() => setActiveMainTab('datos')}
              className={[
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
                activeMainTab === 'datos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ].join(' ')}
            >
              📋 Datos y Fichas
            </button>
            <button
              onClick={() => setActiveMainTab('portales')}
              className={[
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
                activeMainTab === 'portales'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ].join(' ')}
            >
              🌐 Portales
            </button>
            <button
              onClick={() => setActiveMainTab('tematicas')}
              className={[
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
                activeMainTab === 'tematicas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ].join(' ')}
            >
              🏷️ Temáticas
            </button>
            <button
              onClick={() => setActiveMainTab('trabajadores')}
              className={[
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
                activeMainTab === 'trabajadores'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ].join(' ')}
            >
              👥 Trabajadores
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeMainTab === 'analisis' && (
          <div className="bg-gradient-to-r from-white to-slate-50/50 rounded-2xl shadow-lg border border-slate-200/60 backdrop-blur-sm">
            {/* Header integrado con filtros y KPIs en una sección compacta */}
            <div className="p-6 border-b border-slate-200/60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#D17C22] to-[#8E8D29]"></div>
                  <h3 className="text-lg font-semibold text-slate-800">Análisis y Gráficos</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600
                             bg-slate-900 text-white text-xs font-medium
                             hover:bg-slate-800 hover:border-slate-700
                             focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
                             transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <RotateCcw size={14} />
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Filtros compactos horizontales justo encima de gráficos */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-sm font-medium text-slate-700">Filtrar por:</span>
                
                <select
                  value={filters.anio || ""}
                  onChange={(e) => set({ anio: e.target.value, page: "1" })}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900
                           focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                           hover:border-slate-400 transition-all duration-200"
                >
                  {Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                
                <select
                  value={filters.mes || ""}
                  onChange={(e) => set({ mes: e.target.value, page: "1" })}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900
                           focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                           hover:border-slate-400 transition-all duration-200"
                >
                  <option value="">Todos los meses</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={String(m).padStart(2, "0")}>
                      {monthName(String(m).padStart(2, "0"))}
                    </option>
                  ))}
                </select>
                
                <select
                  value={filters.ambito || ""}
                  onChange={(e) => set({ ambito: e.target.value as 'UE' | 'ESTADO' | 'CCAA' | 'PROVINCIA' | '', page: "1" })}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900
                           focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                           hover:border-slate-400 transition-all duration-200"
                >
                  <option value="">Todos ámbitos</option>
                  <option value="UE">🇪🇺 UE</option>
                  <option value="ESTADO">🏛️ Estado</option>
                  <option value="CCAA">🌐 CCAA</option>
                  <option value="PROVINCIA">📍 Provincia</option>
                </select>
                
                {trabajadores.length > 0 && (
                  <select
                    value={filters.trabajador_id || ""}
                    onChange={(e) => set({ trabajador_id: e.target.value, page: "1" })}
                    className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900
                             focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                             hover:border-slate-400 transition-all duration-200 max-w-[160px]"
                  >
                    <option value="">Todos trabajadores</option>
                    {trabajadores.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre.length > 15 ? t.nombre.substring(0, 15) + '...' : t.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* KPIs compactos en línea */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Año:</span>
                  <span className="font-semibold text-slate-900">{filters.anio || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Mes:</span>
                  <span className="font-semibold text-slate-900">{mesNombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Fechas:</span>
                  <span className="font-semibold text-slate-900">
                    {filters.created_desde || filters.created_hasta
                      ? `${filters.created_desde || "…"} → ${filters.created_hasta || "…"}`
                      : "Sin rango"}
                  </span>
                </div>
              </div>
            </div>

            {/* Charts directamente pegados a filtros - sin separación */}
            <div className="p-0">
              <ChartsTabs tabs={charts} />
            </div>
          </div>
        )}

        {activeMainTab === 'datos' && (
          <>
            {/* Tabla con altura completa */}
            <div className="rounded-2xl bg-white shadow-sm border border-gray-200">
              <div className="max-h-[calc(100vh-200px)] overflow-auto rounded-2xl">
                <FichasTable filters={filters} onChange={set} />
              </div>
            </div>
          </>
        )}

        {activeMainTab === 'portales' && (
          <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-6">
            <PortalesManager />
          </div>
        )}

        {activeMainTab === 'tematicas' && (
          <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-6">
            <TematicasManager />
          </div>
        )}

        {activeMainTab === 'trabajadores' && (
          <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-6">
            <TrabajadoresManager />
          </div>
        )}
      </div>

    </>
  );
}


