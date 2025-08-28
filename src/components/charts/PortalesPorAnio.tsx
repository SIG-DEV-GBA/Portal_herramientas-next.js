"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import ChartCard from "../cards/ChartCard";
import { Filters } from "@/lib/stats/types";
import { pickFichasFilters } from "@/lib/stats/utils";

// paleta y color estable
const PALETTE = [
  "#2563eb","#14b8a6","#f59e0b","#ef4444","#8b5cf6",
  "#22c55e","#06b6d4","#eab308","#f97316","#a855f7",
  "#0ea5e9","#10b981","#f43f5e","#84cc16","#64748b",
];
const colorFromString = (s: string) => {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
};

type Row = { portal: string; total: number; pct: number };

export default function PortalesPorAnioChart({ filters }: { filters: Filters }) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // año + filtros compatibles con /api/stats/portales (ambito, tramite_tipo, etc.)
  const query = useMemo(
    () => ({ anio: filters.anio, ...pickFichasFilters(filters) }),
    [filters]
  );

  useEffect(() => {
    let cancel = false;
    setLoading(true);

    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });

    fetch(`/api/stats/portales?${params.toString()}`, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((rows: any[]) => {
        if (cancel) return;

        // rows esperadas: [{ portal_id, portal_slug, portal_nombre, total }, ...]
        const totalGlobal = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
        const mapped: Row[] = rows.map((r) => {
          const total = Number(r.total ?? 0);
          return {
            portal: String(r.portal_nombre ?? r.portal_slug ?? "—"),
            total,
            pct: totalGlobal > 0 ? +( (total / totalGlobal) * 100 ).toFixed(1) : 0,
          };
        }).sort((a, b) => b.total - a.total);

        setData(mapped);
      })
      .catch((e) => {
        console.error("PortalesPorAnioChart:", e);
        if (!cancel) setData([]);
      })
      .finally(() => !cancel && setLoading(false));

    return () => { cancel = true; };
  }, [query]);

  const avg = data.length ? Math.round(data.reduce((s, r) => s + r.total, 0) / data.length) : 0;

  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d: Row = payload[0].payload;
    return (
      <div style={{
        background:"rgba(17,24,39,0.9)", color:"#fff", borderRadius:12,
        padding:"10px 12px", boxShadow:"0 10px 25px rgba(0,0,0,0.25)", backdropFilter:"blur(8px)"
      }}>
        <div style={{ fontWeight:700, marginBottom:6 }}>{label}</div>
        <div style={{ fontSize:12, opacity:.9 }}>Total: <strong>{d.total}</strong></div>
        <div style={{ fontSize:12, opacity:.9, marginTop:4 }}>Participación: <strong>{d.pct}%</strong></div>
        {avg > 0 && (
          <div style={{ fontSize:12, opacity:.8, marginTop:4 }}>Media anual: <strong>{avg}</strong></div>
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
          <Bar dataKey="total" name="Total por portal" radius={[8, 8, 0, 0]}>
            {data.map((d) => <Cell key={d.portal} fill={colorFromString(d.portal)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
