"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

// KPI
import StatCard from "@/components/cards/StatCard";

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

// Drawer de filtros completos
import FilterDrawer from "@/components/stats/FilterDrawer";

// Componentes de gestión
import PortalesManager from "@/components/management/PortalesManager";
import TematicasManager from "@/components/management/TematicasManager";
import TrabajadoresManager from "@/components/management/TrabajadoresManager";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trabajadores, setTrabajadores] = useState<{id: number; nombre: string}[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<'analisis' | 'datos' | 'portales' | 'tematicas' | 'trabajadores'>('analisis');

  // Cargar trabajadores
  useEffect(() => {
    fetch("/api/lookups/trabajadores?solo_activos=true")
      .then((r) => r.json())
      .then((rows) => setTrabajadores(rows || []))
      .catch(() => setTrabajadores([]));
  }, []);

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
      {/* Header de filtros */}
      <div className="px-6 py-4 border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#D17C22] to-[#8E8D29]"></div>
            <h3 className="text-lg font-semibold text-slate-800">Filtros de búsqueda</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {Object.values(filters).filter(v => v && v !== '' && v !== '1').length} activos
            </span>
          </div>
        </div>
      </div>
      
      {/* Filtros principales */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Búsqueda general
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                value={filters.q || ""}
                onChange={(e) => set({ q: e.target.value, page: "1" })}
                placeholder="Buscar por nombre, frase publicitaria o contenido..."
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 bg-white/80 backdrop-blur-sm
                         text-slate-900 placeholder-slate-500 text-sm
                         focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22] focus:bg-white
                         hover:border-slate-400 transition-all duration-200
                         shadow-sm focus:shadow-md"
              />
              {filters.q && (
                <button
                  onClick={() => set({ q: "", page: "1" })}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Filtros rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Año */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Año</label>
            <select
              value={filters.anio || ""}
              onChange={(e) => set({ anio: e.target.value, page: "1" })}
              className="w-full h-11 rounded-xl border border-slate-300 bg-white/90 px-3 text-sm text-slate-900
                       focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                       hover:border-slate-400 transition-all duration-200
                       appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY0NzQ4QiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[length:12px] bg-[right_12px_center]"
            >
              {Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          {/* Mes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mes</label>
            <select
              value={filters.mes || ""}
              onChange={(e) => set({ mes: e.target.value, page: "1" })}
              className="w-full h-11 rounded-xl border border-slate-300 bg-white/90 px-3 text-sm text-slate-900
                       focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                       hover:border-slate-400 transition-all duration-200
                       appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY0NzQ4QiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[length:12px] bg-[right_12px_center]"
            >
              <option value="">Todos los meses</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m).padStart(2, "0")}>
                  {monthName(String(m).padStart(2, "0"))}
                </option>
              ))}
            </select>
          </div>
          
          {/* Ámbito */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ámbito</label>
            <select
              value={filters.ambito || ""}
              onChange={(e) => set({ ambito: e.target.value as any, page: "1" })}
              className="w-full h-11 rounded-xl border border-slate-300 bg-white/90 px-3 text-sm text-slate-900
                       focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                       hover:border-slate-400 transition-all duration-200
                       appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY0NzQ4QiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[length:12px] bg-[right_12px_center]"
            >
              <option value="">Todos</option>
              <option value="UE">UE</option>
              <option value="ESTADO">Estado</option>
              <option value="CCAA">CCAA</option>
              <option value="PROVINCIA">Provincia</option>
            </select>
          </div>
          
          {/* Trabajador */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Trabajador/a</label>
            <select
              value={filters.trabajador_id || ""}
              onChange={(e) => set({ trabajador_id: e.target.value, page: "1" })}
              className="w-full h-11 rounded-xl border border-slate-300 bg-white/90 px-3 text-sm text-slate-900
                       focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                       hover:border-slate-400 transition-all duration-200
                       appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY0NzQ4QiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[length:12px] bg-[right_12px_center]"
            >
              <option value="">Todos</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 
                       bg-white text-slate-700 text-sm font-medium
                       hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2
                       transition-all duration-200 shadow-sm hover:shadow-md"
              type="button"
            >
              <SlidersHorizontal size={16} />
              <span>Filtros avanzados</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300
                       bg-slate-900 text-white text-sm font-medium
                       hover:bg-slate-800 hover:border-slate-600
                       focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
                       transition-all duration-200 shadow-sm hover:shadow-md"
              title="Limpiar todos los filtros"
              type="button"
            >
              <RotateCcw size={16} className="transition-transform duration-200 hover:rotate-180" />
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </div>
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
                    onClick={() => setDrawerOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300
                             bg-white text-slate-700 text-xs font-medium
                             hover:bg-slate-50 hover:border-slate-400
                             focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2
                             transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <SlidersHorizontal size={14} />
                    Más filtros
                  </button>
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
                  onChange={(e) => set({ ambito: e.target.value as any, page: "1" })}
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

      {/* Drawer con filtros completos */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        value={filters}
        onChange={set}
        onReset={reset}
      />
    </>
  );
}


