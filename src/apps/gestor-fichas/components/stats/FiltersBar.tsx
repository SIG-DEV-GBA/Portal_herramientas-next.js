"use client";
import React from "react";
import { Filters } from "@/apps/gestor-fichas/lib/types";

export default function FiltersBar({ value, onChange, onReset }: { value: Filters; onChange: (f: Partial<Filters>) => void; onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Field label="Buscar" className="md:col-span-2">
          <input
            value={value.q || ""}
            onChange={(e) => onChange({ q: e.target.value, page: "1" })}
            placeholder="Nombre, frase…"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-[15px] shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
          />
        </Field>

        <Field label="Ámbito">
          <Select
            value={value.ambito || ""}
            onChange={(v) => onChange({ ambito: v, page: "1" })}
            options={[
              { value: "", label: "Todos" },
              { value: "UE", label: "UE" },
              { value: "ESTADO", label: "Estado" },
              { value: "CCAA", label: "CCAA" },
              { value: "PROVINCIA", label: "Provincia" },
            ]}
          />
        </Field>

        <Field label="Tipo de trámite">
          <Select
            value={value.tramite_tipo || ""}
            onChange={(v) => onChange({ tramite_tipo: v, page: "1" })}
            options={[
              { value: "", label: "Todos" },
              { value: "si", label: "💻 Trámite online" },
              { value: "no", label: "📋 Trámite presencial" },
              { value: "directo", label: "🔗 Trámite directo" },
            ]}
          />
        </Field>

        <Field label="Año">
          <Select
            value={value.anio || ""}
            onChange={(v) => onChange({ anio: v, page: "1" })}
            options={[
              { value: "", label: "Todos los años" },
              { value: "2024", label: "2024" },
              { value: "2023", label: "2023" },
              { value: "2022", label: "2022" },
              { value: "2021", label: "2021" },
              { value: "2020", label: "2020" },
            ]}
          />
        </Field>

        <Field label="Mes">
          <Select
            value={value.mes || ""}
            onChange={(v) => onChange({ mes: v, page: "1" })}
            options={[
              { value: "", label: "Todos los meses" },
              { value: "1", label: "Enero" },
              { value: "2", label: "Febrero" },
              { value: "3", label: "Marzo" },
              { value: "4", label: "Abril" },
              { value: "5", label: "Mayo" },
              { value: "6", label: "Junio" },
              { value: "7", label: "Julio" },
              { value: "8", label: "Agosto" },
              { value: "9", label: "Septiembre" },
              { value: "10", label: "Octubre" },
              { value: "11", label: "Noviembre" },
              { value: "12", label: "Diciembre" },
            ]}
          />
        </Field>

        <Field label="Creada desde">
          <input
            type="date"
            value={value.created_desde || ""}
            onChange={(e) => onChange({ created_desde: e.target.value, page: "1" })}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
          />
        </Field>

        <Field label="Creada hasta">
          <input
            type="date"
            value={value.created_hasta || ""}
            onChange={(e) => onChange({ created_hasta: e.target.value, page: "1" })}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
          />
        </Field>

        <Field label="Trabajador (ID)">
          <input
            inputMode="numeric"
            value={value.trabajador_id || ""}
            onChange={(e) => onChange({ trabajador_id: e.target.value, page: "1" })}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
            placeholder="ZZ"
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={onReset} className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 shadow-sm">
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options, disabled = false }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; disabled?: boolean }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
