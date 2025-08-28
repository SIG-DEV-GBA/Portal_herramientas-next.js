"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Filters } from "@/lib/stats/types";
import { asAmbito, asTramite, asComplejidad } from "@/lib/stats/utils";

type Opt = { id: string | number; label: string };

const MONTHS = [
  { id: "", label: "Todos" },
  { id: 1, label: "Enero" },
  { id: 2, label: "Febrero" },
  { id: 3, label: "Marzo" },
  { id: 4, label: "Abril" },
  { id: 5, label: "Mayo" },
  { id: 6, label: "Junio" },
  { id: 7, label: "Julio" },
  { id: 8, label: "Agosto" },
  { id: 9, label: "Septiembre" },
  { id: 10, label: "Octubre" },
  { id: 11, label: "Noviembre" },
  { id: 12, label: "Diciembre" },
];

export default function FiltersSidebar({
  value,
  onChange,
  onReset,
}: {
  value: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
}) {
  const [trabajadores, setTrabajadores] = useState<Opt[]>([]);
  const [ccaa, setCcaa] = useState<Opt[]>([]);
  const [provincias, setProvincias] = useState<Opt[]>([]);

  useEffect(() => {
    fetch("/api/lookups/trabajadores?solo_activos=true")
      .then((r) => r.json())
      .then((rows) =>
        setTrabajadores((rows ?? []).map((t: any) => ({ id: t.id, label: t.nombre })))
      )
      .catch(() => setTrabajadores([]));

    fetch("/api/lookups/ccaa")
      .then((r) => r.json())
      .then((rows) => setCcaa((rows ?? []).map((r: any) => ({ id: r.id, label: r.nombre }))))
      .catch(() => setCcaa([]));

    const provUrl = value.ccaa_id
      ? `/api/lookups/provincias?ccaa_id=${value.ccaa_id}`
      : "/api/lookups/provincias";
    fetch(provUrl)
      .then((r) => r.json())
      .then((rows) =>
        setProvincias((rows ?? []).map((r: any) => ({ id: r.id, label: r.nombre })))
      )
      .catch(() => setProvincias([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.ccaa_id]);

  const years: Opt[] = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => y - i).map((n) => ({ id: n, label: String(n) }));
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sticky top-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800">Filtros</h2>
        <button className="text-sm text-blue-600 hover:underline" onClick={onReset}>
          Reset
        </button>
      </div>

      {/* Búsqueda */}
      <label className="block text-xs text-gray-500 mb-1">Búsqueda</label>
      <input
        className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Nombre, frase o texto…"
        value={value.q || ""}
        onChange={(e) => onChange({ q: e.target.value, page: "1" })}
      />

      {/* Ámbito */}
      <label className="block text-xs text-gray-500 mb-1">Ámbito</label>
      <select
        className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={value.ambito || ""}
        onChange={(e) => onChange({ ambito: asAmbito(e.target.value), page: "1" })}  
      >
        <option value="">Todos</option>
        <option value="UE">UE</option>
        <option value="ESTADO">Estado</option>
        <option value="CCAA">CCAA</option>
        <option value="PROVINCIA">Provincia</option>
      </select>

      {/* CCAA */}
      <label className="block text-xs text-gray-500 mb-1">CCAA</label>
      <select
        className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={value.ccaa_id || ""}
        onChange={(e) => onChange({ ccaa_id: e.target.value, provincia_id: "", page: "1" })}
      >
        <option value="">Todas</option>
        {ccaa.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      {/* Provincia */}
      <label className="block text-xs text-gray-500 mb-1">Provincia</label>
      <select
        className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={value.provincia_id || ""}
        onChange={(e) => onChange({ provincia_id: e.target.value, page: "1" })}
      >
        <option value="">Todas</option>
        {provincias.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Trámite */}
      <label className="block text-xs text-gray-500 mb-1">Tipo de trámite</label>
      <select
        className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={value.tramite_tipo || ""}
        onChange={(e) => onChange({ tramite_tipo: asTramite(e.target.value), page: "1" })}  
      >
        <option value="">Todos</option>
        <option value="si">Sí (online)</option>
        <option value="no">No</option>
        <option value="directo">Directo</option>
      </select>

      {/* (Opcional) Complejidad */}
      <label className="block text-xs text-gray-500 mb-1">Complejidad</label>
      <select
        className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={value.complejidad || ""}
        onChange={(e) => onChange({ complejidad: asComplejidad(e.target.value), page: "1" })}  
      >
        <option value="">Todas</option>
        <option value="baja">Baja</option>
        <option value="media">Media</option>
        <option value="alta">Alta</option>
      </select>

      {/* Trabajador (nombre) */}
      <label className="block text-xs text-gray-500 mb-1">Trabajador/a</label>
      <select
        className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={value.trabajador_id || ""}
        onChange={(e) => onChange({ trabajador_id: e.target.value, page: "1" })}
      >
        <option value="">Todos</option>
        {trabajadores.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>

      {/* Año */}
      <label className="block text-xs text-gray-500 mb-1">Año</label>
      <select
        className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={value.anio || ""}
        onChange={(e) => onChange({ anio: e.target.value })}
      >
        {useMemo(() => {
          const y = new Date().getFullYear();
          return Array.from({ length: 6 }, (_, i) => y - i).map((n) => (
            <option key={n} value={n}>{n}</option>
          ));
        }, [])}
      </select>

      {/* Mes */}
      <label className="block text-xs text-gray-500 mb-1">Mes</label>
      <select
        className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={value.mes || ""}
        onChange={(e) => onChange({ mes: e.target.value })}
      >
        {MONTHS.map((m) => (
          <option key={String(m.id)} value={String(m.id)}>
            {m.label}
          </option>
        ))}
      </select>

      {/* Rango de fechas */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Desde</label>
          <input
            type="date"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={value.created_desde || ""}
            onChange={(e) => onChange({ created_desde: e.target.value, page: "1" })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hasta</label>
          <input
            type="date"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={value.created_hasta || ""}
            onChange={(e) => onChange({ created_hasta: e.target.value, page: "1" })}
          />
        </div>
      </div>
    </div>
  );
}
