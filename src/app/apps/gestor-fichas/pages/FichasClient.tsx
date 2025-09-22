/**
 * Componente principal del cliente para la gestión de fichas
 * 
 * Este componente maneja la interfaz principal del sistema de gestión de fichas,
 * incluyendo filtros, visualizaciones, tablas de datos y exportaciones.
 * 
 * Características principales:
 * - Estado sincronizado con URL para bookmarking y navegación
 * - Sistema de filtros dinámicos con validación
 * - Visualizaciones interactivas con gráficos y estadísticas
 * - Tabla de datos con paginación y ordenación
 * - Exportación a PDF y Excel con configuraciones personalizables
 * - Gestión de entidades relacionadas (portales, temáticas, trabajadores)
 * - Interfaz responsiva y optimizada para experiencia de usuario
 * 
 * @author Sistema de Gestión de Fichas
 * @version 2.0
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, Download, FileSpreadsheet } from "lucide-react";

// Layout
import AppHeader from "@/apps/gestor-fichas/components/layout/AppHeader";
import GlobalFilters from "@/apps/gestor-fichas/components/filters/GlobalFilters";
import CorporateFooter from "@/components/layout/CorporateFooter";

// Gráficas
import FichasPorMesChart from "@/apps/gestor-fichas/components/charts/FichasPorMesChart";
import PortalesPorMesChart from "@/apps/gestor-fichas/components/charts/PortalesPorMesChart";
import AmbitosPorPortalChart from "@/apps/gestor-fichas/components/charts/AmbitosPorPortalChart";
import TramiteOnlineChart from "@/apps/gestor-fichas/components/charts/TramiteOnlineChart";
import TematicasDistribucionChart from "@/apps/gestor-fichas/components/charts/TematicasDistribucionChart";

// Tabs
import ChartsTabs, { type Tab } from "@/apps/gestor-fichas/components/charts/ChartsTabs";

// Tabla
import FichasTableModern from "@/apps/gestor-fichas/components/fichas/FichasTableModern";

// Componentes de gestión
import { PortalesManager } from "@/shared/components/data-management/PortalesManager";
import { TematicasManager } from "@/shared/components/data-management/TematicasManager";
import { TrabajadoresManager } from "@/shared/components/data-management/TrabajadoresManager";

// PDF
import { type PDFConfig } from "@/apps/gestor-fichas/components/pdf/PDFConfigModal";
import ExcelConfirmModal from "@/apps/gestor-fichas/components/modals/ExcelConfirmModal";

// Tipos / Utils
import type { Filters } from "@/apps/gestor-fichas/lib/types";
import { asAmbito, asTramite, asComplejidad } from "@/apps/gestor-fichas/lib/utils";

// =====================  MANEJO DE ESTADO Y SINCRONIZACIÓN  =====================
/**
 * Hook personalizado para gestionar el estado de filtros sincronizado con la URL
 * 
 * Funcionalidades:
 * - Inicializa filtros desde parámetros de URL al cargar la página
 * - Actualiza URL automáticamente cuando cambian los filtros
 * - Preserva scroll position durante navegación programatica
 * - Proporciona funciones helper para actualizar y resetear filtros
 * - Validación de tipos para parámetros de consulta
 * 
 * @returns {object} Estado de filtros y funciones de manipulación
 */
function useQueryState() {
  const sp = useSearchParams();
  const router = useRouter();

  // Inicialización del estado de filtros desde URL parameters
  // Utiliza lazy initialization para mejor rendimiento
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

  /**
   * Actualiza filtros parcialmente manteniendo valores existentes
   * @param patch Objeto con filtros a actualizar
   */
  const set = (patch: Partial<Filters>) =>
    setFilters((f) => ({ ...f, ...patch, page: patch.page ?? f.page }));

  /**
   * Resetea todos los filtros a sus valores por defecto
   * Útil para limpiar todas las selecciones del usuario
   */
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

// =====================  COMPONENTE PRINCIPAL  =====================
/**
 * Componente principal que orquesta toda la interfaz de gestión de fichas
 * 
 * Maneja:
 * - Estado de navegación entre diferentes vistas (análisis, datos, gestión)
 * - Funcionalidades de exportación (PDF, Excel)
 * - Refresh/actualización de datos
 * - Contadores y estadísticas globales
 * - Integración con sistema de filtros
 */
export default function FichasClient() {
  const { filters, set, reset } = useQueryState();
  
  // =====================  ESTADO LOCAL DEL COMPONENTE  =====================
  const [activeMainTab, setActiveMainTab] = useState<'analisis' | 'datos' | 'portales' | 'tematicas' | 'trabajadores'>('analisis');
  const [totalRecords, setTotalRecords] = useState(0);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Función para forzar la actualización de datos
   * Incrementa la clave de refresh que triggerá re-renders en componentes hijo
   */
  const forceRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // =====================  EFECTOS DE INICIALIZACIÓN  =====================
  // Detectar retorno desde creación de nueva ficha para refresh automático
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('refresh') === 'true') {
      // Limpiar parámetro de refresh de la URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Force refresh the data
      forceRefresh();
    }
  }, [forceRefresh]);


  // Tabs de gráficas (una visible a la vez -> menos scroll)
  const charts: Tab[] = [
    { key: "fichas-mes",     label: "Fichas por mes",          node: <FichasPorMesChart         filters={filters} /> },
    { key: "portales-anio",  label: "Portales (año)",          node: <PortalesPorMesChart       filters={filters} /> },
    { key: "ambitos-portal", label: "Ámbitos por portal",      node: <AmbitosPorPortalChart     filters={filters} /> },
    { key: "tramite-online", label: "Trámite online",          node: <TramiteOnlineChart        filters={filters} /> },
    { key: "tematicas",      label: "Temáticas (mes / año)",   node: <TematicasDistribucionChart filters={filters} /> },
  ];


  const handleGeneratePDFV2 = async (config: PDFConfig) => {
    try {
      setIsGeneratingPDF(true);
      setPdfProgress("Preparando datos...");
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).length > 0) {
          params.set(k, String(v));
        }
      });
      
      // Add PDF config
      params.set('config', JSON.stringify(config));
      
      setPdfProgress("Generando gráficos...");
      console.log('🚀 Generating PDF V2 (Puppeteer + Recharts)...');
      
      const response = await fetch(`/api/apps/gestor-fichas/generate-pdf-v2?${params.toString()}`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/pdf',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF V2 generation failed:', response.status, errorText);
        throw new Error(`Error generando PDF V2: ${response.status} ${response.statusText}`);
      }
      
      setPdfProgress("Procesando PDF...");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Create filename based on config
      const currentDate = new Date().toISOString().split('T')[0];
      const isInsights = config.includeCharts && !config.includeTable;
      const baseFilename = isInsights ? 'informe-insights-v2' : 'informe-completo-v2';
      
      a.download = `${baseFilename}-${currentDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setPdfProgress("Completado ✅");
      console.log('✅ PDF V2 downloaded successfully!');
      
      // Pequeña pausa para mostrar el éxito antes de cerrar
      setTimeout(() => {
        setIsGeneratingPDF(false);
        setPdfProgress("");
      }, 1000);
      
    } catch (error) {
      console.error('Error generando PDF V2:', error);
      setPdfProgress("Error al generar PDF");
      setTimeout(() => {
        setIsGeneratingPDF(false);
        setPdfProgress("");
      }, 2000);
    }
  };

  const handleGenerateExcel = async (selectedColumns: string[]) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).length > 0) {
          params.set(k, String(v));
        }
      });
      
      // Add selected columns parameter
      params.set('columns', JSON.stringify(selectedColumns));
      
      const response = await fetch(`/api/apps/gestor-fichas/generate-excel?${params.toString()}`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Excel generation failed:', response.status, errorText);
        throw new Error(`Error generando Excel: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `justificante-ayudas-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando Excel:', error);
    }
  };

  const fetchTotalRecords = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).length > 0) {
          params.set(k, String(v));
        }
      });
      
      params.set('take', '1');
      params.set('page', '1');
      params.set('withCount', 'true');
      
      const response = await fetch(`/api/apps/gestor-fichas/fichas?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTotalRecords(data.total || 0);
      } else {
        setTotalRecords(0);
      }
    } catch (error) {
      console.error('Error fetching total records:', error);
      setTotalRecords(0);
    }
  };

  const handleExcelButtonClick = async () => {
    await fetchTotalRecords();
    setExcelModalOpen(true);
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
            
            {/* Botones de acción - Solo visibles en pestaña "Análisis y Gráficos" */}
            <div className="flex items-center gap-3">
              {activeMainTab === 'analisis' && (
                <>
                  {/* Botón Justificante de Ayudas (Excel) */}
                  <button
                    onClick={handleExcelButtonClick}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
                             bg-green-600 border border-green-600 rounded-lg hover:bg-green-700
                             focus:ring-2 focus:ring-green-500/20 transition-colors duration-200"
                  >
                    <FileSpreadsheet size={16} />
                    Justificante Ayudas
                  </button>
                  
                  {/* Botón Informe de Insights V2 */}
                  <button
                    onClick={() => {
                      const config: PDFConfig = {
                        includeCharts: true,
                        includeTable: false,
                        includeFiltersInfo: true,
                        chartTypes: ['fichas-por-mes', 'portales-por-mes', 'tematicas-distribucion', 'tramite-online']
                      };
                      handleGeneratePDFV2(config);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
                             bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-600 rounded-lg 
                             hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500/20 
                             transition-all duration-200 shadow-md"
                  >
                    <Download size={16} />
                    📊 Generar Informe de Gráficas
                  </button>
                </>
              )}
              
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
                  key={refreshKey}
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

      {/* Excel Confirmation Modal */}
      <ExcelConfirmModal
        isOpen={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
        filters={filters}
        onConfirm={handleGenerateExcel}
        totalRecords={totalRecords}
      />

      {/* PDF Generation Progress Modal */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Generando Insights V2
                </h3>
                <p className="text-gray-600 mb-4">
                  Esto puede tomar unos segundos mientras procesamos los datos y gráficos...
                </p>
                <div className="bg-gray-100 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-gray-800">{pdfProgress}</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse" style={{width: pdfProgress.includes("Completado") ? "100%" : pdfProgress.includes("Error") ? "100%" : "60%"}}></div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                💡 Los gráficos avanzados requieren más tiempo de procesamiento
              </p>
            </div>
          </div>
        </div>
      )}
      
      <CorporateFooter />
    </div>
  );
}


