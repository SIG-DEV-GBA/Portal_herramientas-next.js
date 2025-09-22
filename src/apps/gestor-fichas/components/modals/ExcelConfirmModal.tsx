"use client";

import { useState, useEffect } from "react";
import { X, FileSpreadsheet, Download, CheckCircle2, Filter, Clock, Calendar, MapPin, Users, Tag, Columns } from "lucide-react";
import type { Filters } from "@/apps/gestor-fichas/lib/types";

// Define all available columns for Excel export
const EXCEL_COLUMNS = [
  { key: 'id_ficha', label: 'ID Ficha', essential: true },
  { key: 'nombre', label: 'Nombre de la Ayuda', essential: true },
  { key: 'ambito', label: 'Ámbito', essential: false },
  { key: 'ccaa', label: 'Comunidad Autónoma', essential: false },
  { key: 'provincia', label: 'Provincia', essential: false },
  { key: 'tramite', label: 'Trámite Online', essential: false },
  { key: 'complejidad', label: 'Complejidad', essential: false },
  { key: 'portales', label: 'Portales', essential: false },
  { key: 'trabajador', label: 'Redactor', essential: false },
  { key: 'subido_por', label: 'Subido por', essential: false },
  { key: 'fecha_creacion', label: 'Fecha Creación', essential: false },
  { key: 'fecha_redaccion', label: 'Fecha Redacción', essential: false },
  { key: 'fecha_publicacion', label: 'Fecha Publicación', essential: false },
  { key: 'vencimiento', label: 'Vencimiento', essential: false },
  { key: 'destaque_principal', label: 'Destaque Principal', essential: false },
  { key: 'destaque_secundario', label: 'Destaque Secundario', essential: false },
  { key: 'enlace', label: 'Enlace Web', essential: false }
];

interface ExcelConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onConfirm: (selectedColumns: string[]) => void;
  totalRecords?: number;
}

export default function ExcelConfirmModal({ 
  isOpen, 
  onClose, 
  filters, 
  onConfirm,
  totalRecords = 0 
}: ExcelConfirmModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EXCEL_COLUMNS.map(col => col.key) // Initially all columns selected
  );

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

  const handleConfirm = async () => {
    setIsGenerating(true);
    try {
      await onConfirm(selectedColumns);
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  const handleColumnToggle = (columnKey: string) => {
    const column = EXCEL_COLUMNS.find(col => col.key === columnKey);
    if (column?.essential) return; // Don't allow toggling essential columns
    
    setSelectedColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(EXCEL_COLUMNS.map(col => col.key));
  };

  const handleSelectEssential = () => {
    setSelectedColumns(EXCEL_COLUMNS.filter(col => col.essential).map(col => col.key));
  };

  const getFilterSummary = () => {
    const activeFilters = [];
    
    if (filters.q) activeFilters.push({ 
      icon: Filter, 
      label: "Búsqueda", 
      value: `"${filters.q}"`,
      color: "blue" 
    });
    
    if (filters.anio) activeFilters.push({ 
      icon: Calendar, 
      label: "Año", 
      value: filters.anio,
      color: "green" 
    });
    
    if (filters.mes) activeFilters.push({ 
      icon: Calendar, 
      label: "Mes", 
      value: filters.mes,
      color: "green" 
    });
    
    if (filters.ambito) activeFilters.push({ 
      icon: MapPin, 
      label: "Ámbito", 
      value: filters.ambito,
      color: "purple" 
    });
    
    if (filters.tramite_tipo) activeFilters.push({ 
      icon: Tag, 
      label: "Trámite", 
      value: filters.tramite_tipo,
      color: "orange" 
    });
    
    if (filters.complejidad) activeFilters.push({ 
      icon: Tag, 
      label: "Complejidad", 
      value: filters.complejidad,
      color: "red" 
    });

    if (filters.trabajador_id) activeFilters.push({ 
      icon: Users, 
      label: "Trabajador", 
      value: "Filtro aplicado",
      color: "indigo" 
    });

    if (filters.trabajador_subida_id) activeFilters.push({ 
      icon: Users, 
      label: "Subido por", 
      value: "Filtro aplicado",
      color: "indigo" 
    });

    if (filters.ccaa_id) activeFilters.push({ 
      icon: MapPin, 
      label: "CCAA", 
      value: "Filtro aplicado",
      color: "purple" 
    });

    if (filters.provincia_id) activeFilters.push({ 
      icon: MapPin, 
      label: "Provincia", 
      value: "Filtro aplicado",
      color: "purple" 
    });

    if (filters.tematica_id) activeFilters.push({ 
      icon: Tag, 
      label: "Temática", 
      value: "Filtro aplicado",
      color: "pink" 
    });

    if (filters.created_desde || filters.created_hasta) {
      const dateRange = [filters.created_desde, filters.created_hasta].filter(Boolean).join(' - ');
      activeFilters.push({ 
        icon: Clock, 
        label: "Rango de fechas", 
        value: dateRange,
        color: "cyan" 
      });
    }

    if (filters.destaque_principal === 'true') activeFilters.push({ 
      icon: Tag, 
      label: "Destaque Principal", 
      value: "Sí",
      color: "yellow" 
    });

    if (filters.destaque_secundario === 'true') activeFilters.push({ 
      icon: Tag, 
      label: "Destaque Secundario", 
      value: "Sí",
      color: "yellow" 
    });
    
    return activeFilters;
  };

  const activeFilters = getFilterSummary();
  const hasFilters = activeFilters.length > 0;

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      green: "bg-green-50 border-green-200 text-green-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700",
      orange: "bg-orange-50 border-orange-200 text-orange-700",
      red: "bg-red-50 border-red-200 text-red-700",
      indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
      pink: "bg-pink-50 border-pink-200 text-pink-700",
      cyan: "bg-cyan-50 border-cyan-200 text-cyan-700",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-700"
    };
    return colorMap[color] || "bg-gray-50 border-gray-200 text-gray-700";
  };

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-600 to-green-500 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileSpreadsheet className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Generar Justificante Excel</h2>
                <p className="text-white/80 text-sm">Confirma los filtros aplicados antes de generar</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="p-2 hover:bg-red-500/50 rounded-lg transition-colors text-red-200 hover:text-red-100 bg-red-500/30 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <CheckCircle2 size={16} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Resumen de Exportación</h3>
            </div>
            
            <div className="bg-white/70 rounded-lg px-4 py-3 border border-green-200">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-green-600 rounded-full">
                  <FileSpreadsheet size={12} className="text-white" />
                </div>
                <span className="font-semibold text-green-700">
                  {totalRecords} fichas serán exportadas a Excel
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Filter size={16} className="text-blue-600" />
              </div>
              Filtros Aplicados
            </h3>
            
            {hasFilters ? (
              <div className="grid grid-cols-1 gap-3">
                {activeFilters.map((filter, index) => {
                  const IconComponent = filter.icon;
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 border ${getColorClasses(filter.color)}`}
                    >
                      <IconComponent size={16} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{filter.label}:</span>
                        <span className="ml-2">{filter.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-6 text-center">
                <div className="text-gray-500">
                  <Filter size={24} className="mx-auto mb-2 opacity-50" />
                  <p>No hay filtros aplicados</p>
                  <p className="text-sm">Se exportarán todas las fichas disponibles</p>
                </div>
              </div>
            )}
          </div>

          {/* Column Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <Columns size={16} className="text-purple-600" />
                </div>
                Columnas a Incluir
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectEssential}
                  className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Solo Esenciales
                </button>
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Seleccionar Todo
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
              {EXCEL_COLUMNS.map((column) => {
                const isSelected = selectedColumns.includes(column.key);
                const isEssential = column.essential;
                
                return (
                  <label
                    key={column.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-purple-50 border-purple-200 shadow-sm' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    } ${isEssential ? 'ring-2 ring-purple-100' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleColumnToggle(column.key)}
                      disabled={isEssential}
                      className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                          {column.label}
                        </span>
                        {isEssential && (
                          <span className="px-1.5 py-0.5 text-xs font-medium text-purple-600 bg-purple-100 rounded-full">
                            Esencial
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700 text-sm">
                <CheckCircle2 size={14} />
                <span className="font-medium">
                  {selectedColumns.length} de {EXCEL_COLUMNS.length} columnas seleccionadas
                </span>
              </div>
            </div>
          </div>

          {/* Warning if many records */}
          {totalRecords > 1000 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock size={16} />
                <span className="font-medium">Archivo grande</span>
              </div>
              <p className="text-sm text-amber-600 mt-1">
                El archivo Excel contendrá {totalRecords} registros y podría tardar un momento en generarse.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              El archivo se descargará automáticamente una vez generado
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isGenerating}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 rounded-xl hover:from-green-700 hover:to-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Generar Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}