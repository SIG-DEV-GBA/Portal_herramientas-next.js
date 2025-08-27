"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ApiList, Filters, Ficha } from "@/lib/stats/types";
import { apiJSON } from "@/lib/stats/api";
import { PAGE_SIZES, fmtDate, pickFichasFilters } from "@/lib/stats/utils";

export default function FichasTable({ filters, onChange }: { filters: Filters; onChange: (f: Partial<Filters>) => void }) {
  const take = Math.max(1, Number(filters.take || 20));
  const page = Math.max(1, Number(filters.page || 1));
  const [data, setData] = useState<ApiList>({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const query = useMemo(
    () => ({
      ...pickFichasFilters(filters),
      take: String(take),
      skip: String((page - 1) * take),
      orderBy: "created_at:desc",
    }),
    [filters, take, page]
  );

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    apiJSON<ApiList>("/api/fichas", query)
      .then((d) => !cancel && setData(d))
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [query]);

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / take));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600">{loading ? "Cargando…" : `Mostrando ${data.items.length} de ${data.total}`}</div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Por página</label>
          <select
            value={take}
            onChange={(e) => onChange({ take: e.target.value, page: "1" })}
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <BtnLite onClick={() => onChange({ page: String(Math.max(1, page - 1)) })} disabled={page <= 1}>
              ⟵
            </BtnLite>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(e) => {
                const v = Number(e.target.value || 1);
                onChange({ page: String(Math.min(Math.max(1, v), totalPages)) });
              }}
              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span className="text-sm text-gray-600">/ {totalPages}</span>
            <BtnLite onClick={() => onChange({ page: String(Math.min(totalPages, page + 1)) })} disabled={page >= totalPages}>
              ⟶
            </BtnLite>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-indigo-50 to-indigo-100 backdrop-blur">
              <tr className="text-left text-gray-700">
                <Th>ID</Th>
                <Th>Ficha subida</Th>
                <Th>Nombre</Th>
                <Th>Ámbito</Th>
                <Th>CCAA</Th>
                <Th>Provincia</Th>
                <Th>Creada</Th>
                <Th>Actualizada</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && <SkeletonRows />}
              {!loading && data.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-gray-400">
                    Sin resultados
                  </td>
                </tr>
              )}
              {!loading &&
                data.items.map((row) => (
                  <tr key={row.id} className="transition hover:bg-indigo-50/60 hover:scale-[1.01]">
                    <Td>{row.id}</Td>
                    <Td>{renderText(row.id_ficha_subida)}</Td>
                    <Td className="font-semibold text-gray-900">{renderText(row.nombre_ficha, true)}</Td>
                    <Td><AmbitoBadge value={row.ambito_nivel as any} /></Td>
                    <Td>{renderText(String(row.ambito_ccaa_id || ""))}</Td>
                    <Td>{renderText(String(row.ambito_provincia_id || ""))}</Td>
                    <Td>{renderText(fmtDate(row.created_at))}</Td>
                    <Td>{renderText(fmtDate(row.updated_at))}</Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-semibold text-[13px] uppercase tracking-wide">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const isEmpty =
    children === undefined ||
    children === null ||
    children === "—" ||
    (typeof children === "string" && children.trim() === "");
  return <td className={`px-3 py-2 align-middle ${isEmpty ? "text-gray-300 italic" : "text-gray-700"} ${className}`}>{isEmpty ? "—" : children}</td>;
}

function BtnLite({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm disabled:opacity-40 hover:bg-gray-50 active:translate-y-[1px]">
      {children}
    </button>
  );
}

function AmbitoBadge({ value }: { value: Ficha["ambito_nivel"] }) {
  const styles: Record<Ficha["ambito_nivel"], string> = {
    UE: "bg-indigo-100 text-indigo-700",
    ESTADO: "bg-blue-100 text-blue-700",
    CCAA: "bg-emerald-100 text-emerald-700",
    PROVINCIA: "bg-amber-100 text-amber-800",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[value]}`}>{value}</span>;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-3 py-3">
              <div className="h-3 rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function renderText(v?: string | null, strong = false) {
  if (!v || v === "—") return <span className="text-gray-300 italic">—</span>;
  return strong ? <span className="text-gray-900">{v}</span> : <span className="text-gray-700">{v}</span>;
}
