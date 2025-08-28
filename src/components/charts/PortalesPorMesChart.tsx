"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import ChartCard from "../cards/ChartCard";
import { Filters } from "@/lib/stats/types";
import { apiJSON } from "@/lib/stats/api";
import { pickFichasFilters } from "@/lib/stats/utils";

type RowAgg = { portal: string; total: number; pct?: number };

// Paleta y color estable por nombre (hash)
const PALETTE = [
  "#2563eb", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#22c55e", "#06b6d4", "#eab308", "#f97316", "#a855f7",
  "#0ea5e9", "#10b981", "#f43f5e", "#84cc16", "#64748b",
];
const colorFromString = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % PALETTE.length;
  return PALETTE[idx];
};

export default function PortalesPorMesChart({ filters }: { filters: Filters }) {
  const [data, setData] = useState<RowAgg[]>([]);
  const [loading, setLoading] = useState(false);

  // Parámetros que afectan a la consulta
  const q = useMemo(() => {
    const base: any = {
      anio: filters.anio ?? "",
      mes: filters.mes ?? "",
      created_desde: filters.created_desde ?? "",
      created_hasta: filters.created_hasta ?? "",
      ...pickFichasFilters(filters),
    };
    // limpia vacíos para no ensuciar la URL
    Object.keys(base).forEach((k) => (base[k] === "" || base[k] == null) && delete base[k]);
    return base;
  }, [filters]);

  useEffect(() => {
    let cancel = false;
    setLoading(true);

    // Pedimos las filas mensuales por portal y agregamos en cliente
    apiJSON<any[]>("/api/stats/portales-por-mes", q, { cache: "no-store" })
      .then((rows) => {
        if (cancel) return;

        // Esperado: [{ month:"YYYY-MM", portal_id, portal_slug, portal_nombre, total }, ...]
        const map = new Map<string, number>();
        for (const r of rows ?? []) {
          const name = String(r.portal_nombre ?? r.portal_slug ?? "—");
          const t = Number(r.total ?? 0);
          map.set(name, (map.get(name) ?? 0) + t);
        }

        const totalGlobal = Array.from(map.values()).reduce((s, n) => s + n, 0);
        let out: RowAgg[] = Array.from(map.entries()).map(([portal, total]) => ({
          portal,
          total,
          pct: totalGlobal > 0 ? +((total / totalGlobal) * 100).toFixed(1) : 0,
        }));

        // Orden descendente por total
        out.sort((a, b) => b.total - a.total);
        setData(out);
      })
      .catch((e) => {
        console.error("PortalesPorMesChart:", e);
        setData([]);
      })
      .finally(() => !cancel && setLoading(false));

    return () => { cancel = true; };
  }, [q]);

  const avg = data.length > 0
    ? Math.round(data.reduce((acc, r) => acc + r.total, 0) / data.length)
    : 0;

  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d: RowAgg = payload[0].payload;
    return (
      <div
        style={{
          background: "rgba(17,24,39,0.9)",
          color: "#fff",
          borderRadius: 12,
          padding: "10px 12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          backdropFilter: "blur(8px)",
          minWidth: 160,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>Total: <strong>{d.total}</strong></div>
        <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>
          Participación: <strong>{d.pct}%</strong>
        </div>
        {avg > 0 && (
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
            Media: <strong>{avg}</strong>
          </div>
        )}
      </div>
    );
  };

  // Hint: año/mes o rango
  const hint =
    filters.created_desde || filters.created_hasta
      ? `${filters.created_desde || ""} → ${filters.created_hasta || ""}`
      : `Año ${filters.anio || "—"}${filters.mes ? ` · Mes ${filters.mes}` : ""}`;

  return (
    <ChartCard title="Total de fichas por portal" loading={loading} hint={hint}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="portal" interval={0} angle={-25} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip content={renderTooltip} />
          <Legend />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={{ value: "Media", position: "right", fill: "#94a3b8", fontSize: 12 }}
            />
          )}
          <Bar dataKey="total" name="Total" radius={[8, 8, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.portal} fill={colorFromString(entry.portal)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
