"use client";

import { useState, useEffect } from "react";
import { X, FileText, BarChart3, Table, Download, Settings, Calendar, MapPin, Filter, CheckCircle2, Circle, Sparkles } from "lucide-react";
import type { Filters } from "@/apps/gestor-fichas/lib/types";

interface PDFConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onGeneratePDF: (config: PDFConfig) => void;
  totalRecords?: number;
}

export interface PDFConfig {
  includeCharts: boolean;
  includeTable: boolean;
  includeFiltersInfo: boolean;
  chartTypes: string[];
}

export default function PDFConfigModal({ 
  isOpen, 
  onClose, 
  filters, 
  onGeneratePDF,
  totalRecords = 0 
}: PDFConfigModalProps) {
  const [config, setConfig] = useState<PDFConfig>({
    includeCharts: true,
    includeTable: false,
    includeFiltersInfo: true,
    chartTypes: ['fichas-por-mes', 'portales-por-mes']
  });

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    onGeneratePDF(config);
    onClose();
  };

  const getFilterSummary = () => {
    const activeFilters = [];
    
    if (filters.q) activeFilters.push(`Búsqueda: "${filters.q}"`);
    if (filters.anio) activeFilters.push(`Año: ${filters.anio}`);
    if (filters.mes) activeFilters.push(`Mes: ${filters.mes}`);
    if (filters.ambito) activeFilters.push(`Ámbito: ${filters.ambito}`);
    if (filters.tramite_tipo) activeFilters.push(`Trámite: ${filters.tramite_tipo}`);
    if (filters.complejidad) activeFilters.push(`Complejidad: ${filters.complejidad}`);
    
    return activeFilters.length > 0 ? activeFilters : ["Sin filtros aplicados"];
  };

  const availableCharts = [
    { id: 'fichas-por-mes', name: 'Fichas por Mes', icon: BarChart3 },
    { id: 'portales-por-mes', name: 'Portales por Mes', icon: BarChart3 },
    { id: 'ambitos-por-portal', name: 'Ámbitos por Portal', icon: BarChart3 },
    { id: 'tramite-online', name: 'Trámite Online', icon: BarChart3 },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#D17C22] to-[#E8975E] p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Generar Informe PDF</h2>
                <p className="text-white/80 text-sm">Personaliza tu reporte de fichas</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-2 hover:bg-red-500/50 rounded-lg transition-colors text-red-200 hover:text-red-100 bg-red-500/30 relative z-10"
              type="button"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Decorative element */}
          <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
            <Sparkles size={80} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Resumen de filtros */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Filter size={16} className="text-blue-600" />
              </div>
              Filtros Aplicados
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
              {getFilterSummary().map((filter, index) => (
                <div key={index} className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2">
                  <CheckCircle2 size={14} className="text-blue-500 flex-shrink-0" />
                  <span>{filter}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2 border border-blue-200">
              <div className="p-1 bg-[#D17C22] rounded-full">
                <FileText size={12} className="text-white" />
              </div>
              <span className="font-semibold text-[#D17C22]">
                {totalRecords} fichas encontradas
              </span>
            </div>
          </div>

          {/* Configuración del contenido */}
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Settings size={16} className="text-purple-600" />
              </div>
              Contenido del PDF
            </h3>
            
            <div className="space-y-4">
              {/* Incluir información de filtros */}
              <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    {config.includeFiltersInfo ? (
                      <CheckCircle2 size={20} className="text-green-500" />
                    ) : (
                      <Circle size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Settings size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Información de filtros</div>
                      <div className="text-sm text-gray-500">Incluye resumen de filtros aplicados</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.includeFiltersInfo}
                    onChange={(e) => setConfig({ ...config, includeFiltersInfo: e.target.checked })}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Incluir gráficas */}
              <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    {config.includeCharts ? (
                      <CheckCircle2 size={20} className="text-green-500" />
                    ) : (
                      <Circle size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Gráficas estadísticas</div>
                      <div className="text-sm text-gray-500">Incluye visualizaciones de datos</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.includeCharts}
                    onChange={(e) => setConfig({ ...config, includeCharts: e.target.checked })}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Selección de gráficas */}
              {config.includeCharts && (
                <div className="ml-8 pl-4 border-l-2 border-blue-200 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Selecciona las gráficas a incluir:</p>
                  <div className="grid grid-cols-1 gap-3">
                    {availableCharts.map((chart) => (
                      <label key={chart.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          {config.chartTypes.includes(chart.id) ? (
                            <CheckCircle2 size={16} className="text-blue-500" />
                          ) : (
                            <Circle size={16} className="text-gray-400 group-hover:text-gray-500" />
                          )}
                        </div>
                        <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                          <chart.icon size={14} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{chart.name}</span>
                        <input
                          type="checkbox"
                          checked={config.chartTypes.includes(chart.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConfig({
                                ...config,
                                chartTypes: [...config.chartTypes, chart.id]
                              });
                            } else {
                              setConfig({
                                ...config,
                                chartTypes: config.chartTypes.filter(t => t !== chart.id)
                              });
                            }
                          }}
                          className="sr-only"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Incluir tabla */}
              <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    {config.includeTable ? (
                      <CheckCircle2 size={20} className="text-green-500" />
                    ) : (
                      <Circle size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Table size={16} className="text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Tabla de datos</div>
                      <div className="text-sm text-gray-500">{totalRecords} fichas disponibles</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.includeTable}
                    onChange={(e) => setConfig({ ...config, includeTable: e.target.checked })}
                    className="sr-only"
                  />
                </label>
                
                {config.includeTable && totalRecords > 50 && (
                  <div className="mt-3 ml-8 pl-4 border-l-2 border-amber-200">
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                      <div className="p-1 bg-amber-200 rounded-full">
                        <Settings size={12} className="text-amber-800" />
                      </div>
                      <span>Tabla con muchos registros. El PDF podría ser extenso.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {!config.includeCharts && !config.includeTable && (
                <span className="text-amber-600">⚠️ Selecciona al menos un tipo de contenido</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                type="button"
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={!config.includeCharts && !config.includeTable}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#D17C22] to-[#E8975E] rounded-xl hover:from-[#B8651E] hover:to-[#D17C22] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Download size={16} />
                Generar PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}