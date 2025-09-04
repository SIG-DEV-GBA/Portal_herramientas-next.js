"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, Download } from "lucide-react";

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

// PDF
import PDFConfigModal, { type PDFConfig } from "@/app/apps/gestor-fichas/components/pdf/PDFConfigModal";

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
    anio: sp.get("anio") ?? "",
    mes: sp.get("mes") ?? "",
    created_desde: sp.get("created_desde") ?? "",
    created_hasta: sp.get("created_hasta") ?? "",
    destaque_principal: sp.get("destaque_principal") ?? "",
    destaque_secundario: sp.get("destaque_secundario") ?? "",
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
      anio: "",
      mes: "",
      created_desde: "",
      created_hasta: "",
      destaque_principal: "",
      destaque_secundario: "",
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
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Function to fetch total records for PDF modal
  const fetchTotalRecords = async () => {
    try {
      // Use the same filter construction logic as the charts
      const params = new URLSearchParams();
      if (filters.anio) params.set("anio", filters.anio);
      if (filters.mes) params.set("mes", filters.mes);
      if (filters.q) params.set("q", filters.q);
      if (filters.ambito) params.set("ambito", filters.ambito);
      if (filters.tramite_tipo) params.set("tramite_tipo", filters.tramite_tipo);
      if (filters.complejidad) params.set("complejidad", filters.complejidad);
      if (filters.ccaa_id) params.set("ccaa_id", filters.ccaa_id);
      if (filters.provincia_id) params.set("provincia_id", filters.provincia_id);
      if (filters.provincia_principal) params.set("provincia_principal", filters.provincia_principal);
      if (filters.trabajador_id) params.set("trabajador_id", filters.trabajador_id);
      if (filters.trabajador_subida_id) params.set("trabajador_subida_id", filters.trabajador_subida_id);
      if (filters.tematica_id) params.set("tematica_id", filters.tematica_id);
      if (filters.created_desde) params.set("created_desde", filters.created_desde);
      if (filters.created_hasta) params.set("created_hasta", filters.created_hasta);
      if (filters.destaque_principal) params.set("destaque_principal", filters.destaque_principal);
      if (filters.destaque_secundario) params.set("destaque_secundario", filters.destaque_secundario);
      
      params.set('take', '1'); // We only need the total count
      params.set('page', '1');
      params.set('withCount', 'true'); // IMPORTANTE: Para que devuelva el total
      
      const response = await fetch(`/api/apps/gestor-fichas/fichas?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched total records:', data.total);
        setTotalRecords(data.total || 0);
      } else {
        console.error('Failed to fetch total records:', response.status, response.statusText);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error('Error fetching total records:', error);
      setTotalRecords(0);
    }
  };

  // Tabs de gráficas (una visible a la vez -> menos scroll)
  const charts: Tab[] = [
    { key: "fichas-mes",     label: "Fichas por mes",          node: <FichasPorMesChart         filters={filters} /> },
    { key: "portales-anio",  label: "Portales (año)",          node: <PortalesPorMesChart       filters={filters} /> },
    { key: "ambitos-portal", label: "Ámbitos por portal",      node: <AmbitosPorPortalChart     filters={filters} /> },
    { key: "tramite-online", label: "Trámite online",          node: <TramiteOnlineChart        filters={filters} /> },
    { key: "tematicas",      label: "Temáticas (mes / año)",   node: <TematicasDistribucionChart filters={filters} /> },
  ];

  const handleGeneratePDF = async (config: PDFConfig) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).length > 0) {
          params.set(k, String(v));
        }
      });
      
      // Add PDF config
      params.set('config', JSON.stringify(config));
      
      const response = await fetch(`/api/apps/gestor-fichas/generate-pdf?${params.toString()}`, {
        method: 'GET',
        credentials: 'same-origin', // Include cookies for authentication
        headers: {
          'Accept': 'application/pdf',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF generation failed:', response.status, errorText);
        throw new Error(`Error generando PDF: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe-fichas-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando PDF:', error);
      // Here you could add a notification system
    }
  };

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
            
            {/* Botones de acción */}
            <div className="flex items-center gap-3">
              {/* Botón Generar PDF - Visible en todas las pestañas */}
              <button
                onClick={async () => {
                  await fetchTotalRecords();
                  setPdfModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#D17C22] 
                         bg-white border border-[#D17C22] rounded-lg hover:bg-[#D17C22] hover:text-white
                         focus:ring-2 focus:ring-[#D17C22]/20 transition-colors duration-200"
              >
                <Download size={16} />
                Generar PDF
              </button>
              
              {/* Botón Nueva Ficha - Solo visible en la pestaña "Datos y Fichas" */}
              {activeMainTab === 'datos' && (
                <Link
                  href="/apps/gestor-fichas/nueva"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
                           bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20
                           transition-colors duration-200"
                >
                  <Plus size={16} />
                  Nueva Ficha
                </Link>
              )}
            </div>
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
                <FichasTableModern 
                  filters={filters} 
                  onChange={set} 
                  onRecordCountChange={setTotalRecords}
                />
              </div>
            )}

            {activeMainTab === 'portales' && <PortalesManager />}
            {activeMainTab === 'tematicas' && <TematicasManager />}
            {activeMainTab === 'trabajadores' && <TrabajadoresManager />}
          </div>
        </div>
      </div>

      {/* PDF Configuration Modal */}
      <PDFConfigModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        filters={filters}
        onGeneratePDF={handleGeneratePDF}
        totalRecords={totalRecords}
      />
    </div>
  );
}


