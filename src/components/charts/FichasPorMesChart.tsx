"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LabelList, // 👈 añade esto
} from "recharts";
import ChartCard from "../cards/ChartCard";
import { Filters } from "@/lib/stats/types";
import { pickFichasFilters } from "@/lib/stats/utils";

type MesRow = { mes: string; total: number };

const MONTHS = [
  { key: "01", label: "Ene" }, { key: "02", label: "Feb" }, { key: "03", label: "Mar" },
  { key: "04", label: "Abr" }, { key: "05", label: "May" }, { key: "06", label: "Jun" },
  { key: "07", label: "Jul" }, { key: "08", label: "Ago" }, { key: "09", label: "Sep" },
  { key: "10", label: "Oct" }, { key: "11", label: "Nov" }, { key: "12", label: "Dic" },
] as const;

export default function FichasPorMesChart({ filters }: { filters: Filters }) {
  const [data, setData] = useState<MesRow[]>([]);
  const [loading, setLoading] = useState(false);

  const f = useMemo(
    () => ({ anio: filters.anio, ...pickFichasFilters(filters) }),
    [filters]
  );

  useEffect(() => {
    let cancel = false;
    setLoading(true);

    fetch(`/api/stats/fichas-por-mes?anio=${filters.anio ?? ""}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancel) return;
        const rows: Array<{ mes: number; total: number }> = Array.isArray(json)
          ? json
          : Array.isArray(json?.items)
          ? json.items
          : [];

        const map = new Map<string, number>();
        for (const r of rows) map.set(String(r.mes).padStart(2, "0"), Number(r.total ?? 0));

        const complete: MesRow[] = MONTHS.map(({ key }) => ({
          mes: key,
          total: map.get(key) ?? 0,
        }));

        setData(complete);
      })
      .catch(() => {
        setData(MONTHS.map(({ key }) => ({ mes: key, total: 0 })));
      })
      .finally(() => { if (!cancel) setLoading(false); });

    return () => { cancel = true; };
  }, [filters.anio]);

  const avg =
    data.length > 0
      ? Math.round(data.reduce((acc, r) => acc + r.total, 0) / data.length)
      : 0;

  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const idx = data.findIndex((d) => d.mes === label);
    const cur = data[idx]?.total ?? 0;
    const prev = idx > 0 ? data[idx - 1].total : 0;
    const diff = cur - prev;
    const monthName = MONTHS.find((m) => m.key === label)?.label ?? label;
    return (
      <div
        style={{
          background: "rgba(17,24,39,0.9)",
          color: "#fff",
          borderRadius: 12,
          padding: "10px 12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          backdropFilter: "blur(8px)",
          minWidth: 150,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{monthName}</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>
          Fichas: <strong>{cur}</strong>
        </div>
        <div
          style={{
            fontSize: 12,
            marginTop: 4,
            color: diff > 0 ? "#22c55e" : diff < 0 ? "#ef4444" : "#cbd5e1",
          }}
        >
          {diff === 0 ? "Sin cambio" : diff > 0 ? `+${diff} vs mes anterior` : `${diff} vs mes anterior`}
        </div>
        <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>
          Media anual: <strong>{avg}</strong>
        </div>
      </div>
    );
  };

  // Etiqueta numérica sobre los puntos (solo si > 0)
  const pointLabel = (props: any) => {
    const { x, y, value } = props;
    if (!value) return null;
    return (
      <text x={x} y={y - 8} textAnchor="middle" fontSize={12} fontWeight={600} fill="#111827">
        {value}
      </text>
    );
  };

  // Leyenda única “Total”
  const LegendSingle = () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#111827", fontSize: 14 }}>
        <span style={{ width: 14, height: 4, background: "#3b82f6", display: "inline-block", borderRadius: 2 }} />
        Total
      </span>
    </div>
  );

  return (
    <ChartCard title="Fichas por mes" loading={loading} hint={`Año ${filters.anio || "—"}`}>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="mes"
            tickFormatter={(v: string) => MONTHS.find((m) => m.key === v)?.label ?? v}
            interval={0}
            height={36}
            tick={{ fontSize: 12 }}
          />
          {/* aire arriba para los labels */}
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} domain={[0, (max: number) => Math.max(3, Math.ceil(max * 1.2))]} />
          <Tooltip content={renderTooltip} />
          {/* leyenda única */}
          <Legend content={<LegendSingle />} />

          {/* Área visual (no crea item en leyenda porque usamos Legend custom) */}
          <Area type="monotone" dataKey="total" stroke="none" fill="url(#fillArea)" />

          {/* Línea principal con labels */}
          <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }}>
            <LabelList dataKey="total" content={pointLabel} />
          </Line>

          {avg > 0 && (
            <ReferenceLine y={avg} stroke="#94a3b8" strokeDasharray="4 4" ifOverflow="extendDomain" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
