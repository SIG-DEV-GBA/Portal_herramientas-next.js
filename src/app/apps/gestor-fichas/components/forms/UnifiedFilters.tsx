"use client";

import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { Filters } from '@/app/apps/gestor-fichas/lib/types';
import { monthName } from '@/app/apps/gestor-fichas/lib/utils';

interface UnifiedFiltersProps {
  filters: Filters;
  onFilterChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
}

export default function UnifiedFilters({ filters, onFilterChange, onReset }: UnifiedFiltersProps) {
  const [trabajadores, setTrabajadores] = useState<{id: number; nombre: string}[]>([]);
  const [provincias, setProvincias] = useState<{id: number; nombre: string}[]>([]);
  const [ccaa, setCcaa] = useState<{id: number; nombre: string}[]>([]);
  const [provinciasRestrictivas, setProvinciasRestrictivas] = useState<{id: number; nombre: string}[]>([]);

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

  const inputStyles = "w-full h-12 rounded-xl border-2 border-slate-200/80 bg-white/95 backdrop-blur-sm px-4 text-sm text-slate-900 placeholder-slate-500 focus:ring-4 focus:ring-[#D17C22]/10 focus:border-[#D17C22] focus:bg-white hover:border-slate-300 hover:bg-white/98 transition-all duration-300 shadow-sm focus:shadow-lg";
  const selectStyles = `${inputStyles} appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY0NzQ4QiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[length:12px] bg-[right_16px_center]`;

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/20 to-white rounded-3xl shadow-2xl border border-slate-200/40 backdrop-blur-xl mb-8 overflow-hidden">
      <div className="p-8 relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D17C22]/5 to-[#8E8D29]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 rounded-full blur-2xl" />
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D17C22] via-[#C17920] to-[#8E8D29] flex items-center justify-center shadow-xl ring-2 ring-white/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">Filtros y Búsqueda</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Configura los parámetros para analizar los datos</p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-slate-300/60 bg-white/90 backdrop-blur-sm text-slate-700 text-xs sm:text-sm font-medium hover:bg-white hover:border-slate-400 hover:text-slate-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 transition-all duration-300 shadow-md hover:scale-105 active:scale-95 w-full sm:w-auto justify-center sm:justify-start"
          >
            <RotateCcw size={16} />
            <span>Limpiar filtros</span>
          </button>
        </div>

        {/* Búsqueda principal */}
        <div className="mb-6 sm:mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={filters.q || ""}
              onChange={(e) => onFilterChange({ q: e.target.value, page: "1" })}
              placeholder="Buscar por nombre de ficha, frase publicitaria o contenido..."
              className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 border-slate-200/60 bg-white/90 backdrop-blur-sm text-slate-900 placeholder-slate-500 text-base focus:ring-4 focus:ring-[#D17C22]/10 focus:border-[#D17C22] focus:bg-white hover:border-slate-300 hover:bg-white/95 transition-all duration-300 shadow-lg focus:shadow-2xl hover:shadow-xl"
            />
            {filters.q && (
              <button
                onClick={() => onFilterChange({ q: "", page: "1" })}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filtros organizados por categorías */}
        <div className="space-y-6 sm:space-y-8">
          {/* Filtros temporales */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm"></div>
              Período temporal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Año */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Año</label>
                <select value={filters.anio || ""} onChange={(e) => onFilterChange({ anio: e.target.value, page: "1" })} className={selectStyles}>
                  {Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              
              {/* Mes */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Mes</label>
                <select value={filters.mes || ""} onChange={(e) => onFilterChange({ mes: e.target.value, page: "1" })} className={selectStyles}>
                  <option value="">Todos los meses</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={String(m).padStart(2, "0")}>
                      {monthName(String(m).padStart(2, "0"))}
                    </option>
                  ))}
                </select>
              </div>

              {/* Desde */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Desde</label>
                <input
                  type="date"
                  value={filters.created_desde || ""}
                  onChange={(e) => onFilterChange({ created_desde: e.target.value, page: "1" })}
                  className={inputStyles}
                />
              </div>

              {/* Hasta */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Hasta</label>
                <input
                  type="date"
                  value={filters.created_hasta || ""}
                  onChange={(e) => onFilterChange({ created_hasta: e.target.value, page: "1" })}
                  className={inputStyles}
                />
              </div>
            </div>
          </div>

          {/* Filtros geográficos */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-sm"></div>
              Ubicación geográfica
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
              {/* Ámbito */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Ámbito</label>
                <select value={filters.ambito || ""} onChange={(e) => onFilterChange({ ambito: e.target.value as 'UE' | 'ESTADO' | 'CCAA' | 'PROVINCIA' | '', page: "1" })} className={selectStyles}>
                  <option value="">Todos</option>
                  <option value="UE">UE</option>
                  <option value="ESTADO">Estado</option>
                  <option value="CCAA">CCAA</option>
                  <option value="PROVINCIA">Provincia</option>
                </select>
              </div>

              {/* CCAA */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">CCAA</label>
                <select value={filters.ccaa_id || ""} onChange={(e) => onFilterChange({ ccaa_id: e.target.value, provincia_id: "", page: "1" })} className={selectStyles}>
                  <option value="">Todas las CCAA</option>
                  {ccaa.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Provincia específica */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Provincia específica</label>
                <select value={filters.provincia_id || ""} onChange={(e) => onFilterChange({ provincia_id: e.target.value, page: "1" })} className={selectStyles}>
                  <option value="">Todas</option>
                  {provinciasRestrictivas.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Provincia (incluye CCAA y Estado) */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">
                  Provincia <span className="text-xs text-slate-500">(incluye CCAA y Estado)</span>
                </label>
                <select value={filters.provincia_principal || ""} onChange={(e) => onFilterChange({ provincia_principal: e.target.value, page: "1" })} className={selectStyles}>
                  <option value="">Todas las provincias</option>
                  {provincias.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Filtros de contenido */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 shadow-sm"></div>
              Características del trámite
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Tipo de trámite */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Tipo de trámite</label>
                <select value={filters.tramite_tipo || ""} onChange={(e) => onFilterChange({ tramite_tipo: e.target.value as 'si' | 'no' | 'directo' | '', page: "1" })} className={selectStyles}>
                  <option value="">Todos</option>
                  <option value="si">Sí (online)</option>
                  <option value="no">No</option>
                  <option value="directo">Directo</option>
                </select>
              </div>

              {/* Complejidad */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Complejidad</label>
                <select value={filters.complejidad || ""} onChange={(e) => onFilterChange({ complejidad: e.target.value as 'baja' | 'media' | 'alta' | '', page: "1" })} className={selectStyles}>
                  <option value="">Todas</option>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filtros de personal */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-sm"></div>
              Personal y responsabilidades
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Trabajador responsable */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Trabajador/a responsable</label>
                <select value={filters.trabajador_id || ""} onChange={(e) => onFilterChange({ trabajador_id: e.target.value, page: "1" })} className={selectStyles}>
                  <option value="">Todos</option>
                  {trabajadores.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Trabajador que subió */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Trabajador/a que subió</label>
                <select value={filters.trabajador_subida_id || ""} onChange={(e) => onFilterChange({ trabajador_subida_id: e.target.value, page: "1" })} className={selectStyles}>
                  <option value="">Todos</option>
                  {trabajadores.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}