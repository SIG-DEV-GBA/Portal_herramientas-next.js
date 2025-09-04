"use client";

import { useState, useEffect } from "react";
import { Search, Calendar, MapPin, User, Settings, RotateCcw, ChevronDown, Filter } from "lucide-react";
import type { Filters } from "@/app/apps/gestor-fichas/lib/types";
import { asAmbito, asTramite, asComplejidad, monthName } from "@/app/apps/gestor-fichas/lib/utils";

interface GlobalFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onReset: () => void;
}

export default function GlobalFilters({ filters, onFilterChange, onReset }: GlobalFiltersProps) {
  const [trabajadores, setTrabajadores] = useState<{id: number; nombre: string}[]>([]);
  const [provincias, setProvincias] = useState<{id: number; nombre: string}[]>([]);
  const [ccaa, setCcaa] = useState<{id: number; nombre: string}[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

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
    })
    .catch(() => {
      setTrabajadores([]);
      setProvincias([]);
      setCcaa([]);
    });
  }, []);

  // Check if any advanced filters are active
  const hasAdvancedFilters = !!(
    filters.ccaa_id || 
    filters.provincia_id || 
    filters.provincia_principal || 
    filters.complejidad || 
    filters.tematica_id || 
    filters.trabajador_subida_id ||
    filters.created_desde ||
    filters.created_hasta ||
    filters.destaque_principal ||
    filters.destaque_secundario
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header con indicadores */}
      <div className="px-6 py-4 bg-slate-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="text-gray-600" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Filtros de Búsqueda</h3>
              <p className="text-xs text-gray-500">
                {filters.anio || "Todos los años"} • {filters.mes ? monthName(filters.mes) : "Todos los meses"}
                {hasAdvancedFilters && " • Filtros avanzados activos"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600
                       bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              <Settings size={14} />
              {isExpanded ? "Ocultar" : "Avanzado"}
              <ChevronDown 
                size={14} 
                className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} 
              />
            </button>
            
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white
                       bg-[#D17C22] rounded-lg hover:bg-[#D17C22]/90 transition-colors duration-200"
            >
              <RotateCcw size={14} />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros principales - siempre visibles */}
      <div className="p-6 space-y-4">
        {/* Primera fila - Búsqueda, Año, Mes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda de texto */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, frase o texto..."
              value={filters.q || ""}
              onChange={(e) => onFilterChange({ q: e.target.value, page: "1" })}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                       placeholder-gray-500 focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                       hover:border-[#8E8D29] transition-all duration-200"
            />
          </div>

          {/* Año */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={filters.anio || ""}
              onChange={(e) => onFilterChange({ anio: e.target.value, page: "1" })}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                       focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                       hover:border-[#8E8D29] transition-all duration-200"
            >
              <option value="">Todos los años</option>
              {Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Mes */}
          <div>
            <select
              value={filters.mes || ""}
              onChange={(e) => onFilterChange({ mes: e.target.value, page: "1" })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                       focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                       hover:border-[#8E8D29] transition-all duration-200"
            >
              <option value="">Todos los meses</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m).padStart(2, "0")}>
                  {monthName(String(m).padStart(2, "0"))}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Segunda fila - Ámbito, Trámite, Trabajador */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ámbito */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={filters.ambito || ""}
              onChange={(e) => onFilterChange({ ambito: asAmbito(e.target.value), page: "1" })}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                       focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                       hover:border-[#8E8D29] transition-all duration-200"
            >
              <option value="">Todos los ámbitos</option>
              <option value="UE">🇪🇺 Unión Europea</option>
              <option value="ESTADO">🏛️ Estado</option>
              <option value="CCAA">🌐 Comunidad Autónoma</option>
              <option value="PROVINCIA">📍 Provincia</option>
            </select>
          </div>

          {/* Tipo de trámite */}
          <div>
            <select
              value={filters.tramite_tipo || ""}
              onChange={(e) => onFilterChange({ tramite_tipo: asTramite(e.target.value), page: "1" })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                       focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                       hover:border-[#8E8D29] transition-all duration-200"
            >
              <option value="">Todos los trámites</option>
              <option value="no">❌ No es trámite</option>
              <option value="si">✅ Es trámite</option>
              <option value="directo">🔗 Trámite directo</option>
            </select>
          </div>

          {/* Redactor */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={filters.trabajador_id || ""}
              onChange={(e) => onFilterChange({ trabajador_id: e.target.value, page: "1" })}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                       focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                       hover:border-[#8E8D29] transition-all duration-200"
            >
              <option value="">Todos los redactores</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Filtros avanzados - colapsables */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-gray-100 bg-gray-50">
          <div className="pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Filtros Avanzados</h4>
            
            {/* Grupo 1: Personal - Trabajadores */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <User size={16} className="text-gray-600" />
                Personal
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Trabajador que subió la ficha</label>
                  <select
                    value={filters.trabajador_subida_id || ""}
                    onChange={(e) => onFilterChange({ trabajador_subida_id: e.target.value, page: "1" })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm
                             focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]"
                  >
                    <option value="">Todos los trabajadores</option>
                    {trabajadores.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Complejidad</label>
                  <select
                    value={filters.complejidad || ""}
                    onChange={(e) => onFilterChange({ complejidad: asComplejidad(e.target.value), page: "1" })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm
                             focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]"
                  >
                    <option value="">Todas las complejidades</option>
                    <option value="baja">🟢 Baja</option>
                    <option value="media">🟡 Media</option>
                    <option value="alta">🔴 Alta</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grupo 2: Ubicación Geográfica */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-gray-600" />
                Ubicación Geográfica
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Comunidad Autónoma</label>
                  <select
                    value={filters.ccaa_id || ""}
                    onChange={(e) => onFilterChange({ ccaa_id: e.target.value, page: "1" })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm
                             focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]"
                  >
                    <option value="">Todas las CCAA</option>
                    {ccaa.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Provincia</label>
                  <select
                    value={filters.provincia_id || ""}
                    onChange={(e) => onFilterChange({ provincia_id: e.target.value, page: "1" })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm
                             focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]"
                  >
                    <option value="">Todas las provincias</option>
                    {provincias.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Grupo 3: Fechas */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-gray-600" />
                Rango de Fechas
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha desde</label>
                  <input
                    type="date"
                    value={filters.created_desde || ""}
                    onChange={(e) => onFilterChange({ created_desde: e.target.value, page: "1" })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm
                             focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha hasta</label>
                  <input
                    type="date"
                    value={filters.created_hasta || ""}
                    onChange={(e) => onFilterChange({ created_hasta: e.target.value, page: "1" })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm
                             focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]"
                  />
                </div>
              </div>
            </div>

            {/* Grupo 4: Etiquetas de Destaque */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Settings size={16} className="text-gray-600" />
                Etiquetas de Destaque
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Etiqueta "Nueva"</label>
                  <select
                    value={filters.destaque_principal || ""}
                    onChange={(e) => onFilterChange({ destaque_principal: e.target.value as "" | "true" | "false", page: "1" })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm
                             focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]"
                  >
                    <option value="">Todas las fichas</option>
                    <option value="true">🆕 Solo con etiqueta "Nueva"</option>
                    <option value="false">📄 Solo sin etiqueta "Nueva"</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Etiqueta "Para Publicitar"</label>
                  <select
                    value={filters.destaque_secundario || ""}
                    onChange={(e) => onFilterChange({ destaque_secundario: e.target.value as "" | "true" | "false", page: "1" })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm
                             focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]"
                  >
                    <option value="">Todas las fichas</option>
                    <option value="true">📢 Solo con etiqueta "Para Publicitar"</option>
                    <option value="false">📄 Solo sin etiqueta "Para Publicitar"</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}