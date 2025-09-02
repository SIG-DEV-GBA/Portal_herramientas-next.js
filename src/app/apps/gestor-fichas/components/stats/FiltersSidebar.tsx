"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Filters } from "@/app/apps/gestor-fichas/lib/types";
import { asAmbito, asTramite, asComplejidad } from "@/app/apps/gestor-fichas/lib/utils";

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

      {/* Trabajador de subida */}
      <label className="block text-xs text-gray-500 mb-1">Trabajador/a que subió</label>
      <select
        className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={value.trabajador_subida_id || ""}
        onChange={(e) => onChange({ trabajador_subida_id: e.target.value, page: "1" })}
      >
        <option value="">Todos</option>
        {trabajadores.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
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
