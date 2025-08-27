"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import ChartCard from "../cards/ChartCard";
import { Filters } from "@/lib/stats/types";
import { pickFichasFilters } from "@/lib/stats/utils";

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

type Row = { portal: string; total: number; pct?: number };

export default function PortalesPorMesChart({ filters }: { filters: Filters }) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // anio + filtros arrastrables (si tu endpoint los soporta)
  const f = useMemo(
    () => ({ anio: filters.anio, ...pickFichasFilters(filters) }),
    [filters]
  );

  useEffect(() => {
    let cancel = false;
    setLoading(true);

    fetch(`/api/stats/portales-por-mes?anio=${filters.anio ?? ""}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancel) return;

        // Esperado: { totales: { portal: total, ... }, total_global }
        const totales = json?.totales ?? {};
        const totalGlobal = Number(json?.total_global ?? 0);

        let rows: Row[] = Object.entries(totales).map(([portal, total]) => {
          const t = Number(total ?? 0);
          return {
            portal,
            total: t,
            pct: totalGlobal > 0 ? +( (t / totalGlobal) * 100 ).toFixed(1) : 0,
          };
        });

        // Orden descendente por total
        rows.sort((a, b) => b.total - a.total);

        setData(Array.isArray(rows) ? rows : []);
      })
      .catch((e) => {
        console.error("PortalesPorMesChart:", e);
        setData([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });

    return () => {
      cancel = true;
    };
  }, [f, filters.anio]);

  // Media para ReferenceLine
  const avg =
    data.length > 0 ? Math.round(data.reduce((acc, r) => acc + r.total, 0) / data.length) : 0;

  // Tooltip custom
  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d: Row = payload[0].payload;
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
        <div style={{ fontSize: 12, opacity: 0.9 }}>
          Total: <strong>{d.total}</strong>
        </div>
        <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>
          Participación: <strong>{d.pct}%</strong>
        </div>
        {avg > 0 && (
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
            Media anual: <strong>{avg}</strong>
          </div>
        )}
      </div>
    );
  };

  return (
    <ChartCard
      title="Total de fichas por portal (año)"
      loading={loading}
      hint={`Año ${filters.anio || "—"}`}
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="portal"
            interval={0}
            angle={-25}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 12 }}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip content={renderTooltip} />
          <Legend />

          {/* Línea de media anual */}
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={{ value: "Media", position: "right", fill: "#94a3b8", fontSize: 12 }}
            />
          )}

          {/* Barras con color estable por portal */}
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
