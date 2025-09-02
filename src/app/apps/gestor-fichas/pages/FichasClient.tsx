"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

// Layout
import AppHeader from "@/app/apps/gestor-fichas/components/layout/AppHeader";
import GlobalFilters from "@/app/apps/gestor-fichas/components/filters/GlobalFilters";

// Gráficas
import FichasPorMesChart from "@/app/apps/gestor-fichas/components/charts/FichasPorMesChart";
import PortalesPorMesChart from "@/app/apps/gestor-fichas/components/charts/PortalesPorMesChart";
import AmbitosPorPortalChart from "@/app/apps/gestor-fichas/components/charts/AmbitosPorPortalChart";
import TramiteOnlineChart from "@/app/apps/gestor-fichas/components/charts/TramiteOnlineChart";
import TematicasDistribucionChart from "@/app/apps/gestor-fichas/components/charts/TematicasDistribucionChart";

// Tabs
import ChartsTabs, { type Tab } from "@/app/apps/gestor-fichas/components/charts/ChartsTabs";

// Tabla
import FichasTableModern from "@/app/apps/gestor-fichas/components/fichas/FichasTableModern";

// Componentes de gestión
import { PortalesManager } from "@/components/management/PortalesManager";
import { TematicasManager } from "@/components/management/TematicasManager";
import { TrabajadoresManager } from "@/components/management/TrabajadoresManager";

// Tipos / Utils
import type { Filters } from "@/app/apps/gestor-fichas/lib/types";
import { asAmbito, asTramite, asComplejidad, monthName } from "@/app/apps/gestor-fichas/lib/utils";

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
      typeof window !== "undefined" ? window.location.pathname : "/apps/gestor-fichas/dashboard";
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
  const [activeMainTab, setActiveMainTab] = useState<'analisis' | 'datos' | 'portales' | 'tematicas' | 'trabajadores'>('analisis');

  // Tabs de gráficas (una visible a la vez -> menos scroll)
  const charts: Tab[] = [
    { key: "fichas-mes",     label: "Fichas por mes",          node: <FichasPorMesChart         filters={filters} /> },
    { key: "portales-anio",  label: "Portales (año)",          node: <PortalesPorMesChart       filters={filters} /> },
    { key: "ambitos-portal", label: "Ámbitos por portal",      node: <AmbitosPorPortalChart     filters={filters} /> },
    { key: "tramite-online", label: "Trámite online",          node: <TramiteOnlineChart        filters={filters} /> },
    { key: "tematicas",      label: "Temáticas (mes / año)",   node: <TematicasDistribucionChart filters={filters} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Global Filters - Always visible */}
        <GlobalFilters 
          filters={filters}
          onFilterChange={set}
          onReset={reset}
        />

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveMainTab('analisis')}
                className={[
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
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
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
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
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
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
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
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
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeMainTab === 'trabajadores'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ].join(' ')}
            >
              👥 Trabajadores
            </button>
            </nav>
            
            {/* Botón Nueva Ficha */}
            <Link
              href="/apps/gestor-fichas/nueva"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
                       bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20
                       transition-colors duration-200"
            >
              <Plus size={16} />
              Nueva Ficha
            </Link>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeMainTab === 'analisis' && (
              <div className="space-y-6">
                <ChartsTabs tabs={charts} />
              </div>
            )}

            {activeMainTab === 'datos' && (
              <div className="-m-6">
                <FichasTableModern filters={filters} onChange={set} />
              </div>
            )}

            {activeMainTab === 'portales' && <PortalesManager />}
            {activeMainTab === 'tematicas' && <TematicasManager />}
            {activeMainTab === 'trabajadores' && <TrabajadoresManager />}
          </div>
        </div>
      </div>
    </div>
  );
}


