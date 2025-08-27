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
} from "recharts";
import ChartCard from "../cards/ChartCard";
import { Filters, ResAmbitosPorPortal } from "@/lib/stats/types";
import { apiJSON } from "@/lib/stats/api";
import { pickFichasFilters } from "@/lib/stats/utils";

type Row = {
  portal: string;
  total: number;
  // los siguientes campos son para el tooltip desglosado
  estado: number;
  ccaa: number;
  provincia: number;
  municipal: number;
};

const COLORS = [
  "#2563eb", // indigo-600
  "#14b8a6", // teal-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#22c55e", // green-500
  "#06b6d4", // cyan-500
  "#eab308", // yellow-500
  "#f97316", // orange-500
  "#a855f7", // purple-500
];

export default function AmbitosPorPortalChart({ filters }: { filters: Filters }) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // mes + anio + filtros de /api/fichas (ambito, ccaa_id, etc.)
  const f = useMemo(
    () => ({ mes: filters.mes, anio: filters.anio, ...pickFichasFilters(filters) }),
    [filters]
  );

  useEffect(() => {
    let cancel = false;
    setLoading(true);

    apiJSON<ResAmbitosPorPortal>("/api/stats/ambitos-por-portal", f, { cache: "no-store" })
      .then((res) => {
        if (cancel) return;
        const map = res?.por_portal ?? {};

        const rows: Row[] = Object.entries(map).map(([portal, vals]: any) => {
          const estado = Number(vals?.estado ?? 0);
          const ccaa = Number(vals?.ccaa ?? 0);
          const provincia = Number(vals?.provincia ?? 0);
          const municipal = Number(vals?.municipal ?? 0);
          return {
            portal,
            estado,
            ccaa,
            provincia,
            municipal,
            total: estado + ccaa + provincia + municipal,
          };
        });

        // Orden opcional: de mayor a menor total (más legible)
        rows.sort((a, b) => b.total - a.total);

        setData(rows);
      })
      .catch((e) => {
        console.error("AmbitosPorPortalChart:", e);
        if (!cancel) setData([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });

    return () => {
      cancel = true;
    };
  }, [f]);

  // Tooltip con desglose por ámbito
  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d: Row = payload[0].payload;
    return (
      <div
        style={{
          background: "rgba(17, 24, 39, 0.9)",
          color: "#fff",
          borderRadius: 10,
          padding: "10px 12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>
          Total: <strong>{d.total}</strong>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          <div>Estado/EU: <strong>{d.estado}</strong></div>
          <div>CCAA: <strong>{d.ccaa}</strong></div>
          <div>Provincia: <strong>{d.provincia}</strong></div>
          <div>Municipal: <strong>{d.municipal}</strong></div>
        </div>
      </div>
    );
  };

  return (
    <ChartCard
      title="Total de fichas por portal"
      loading={loading}
      hint={`Mes ${filters.mes || "—"} · Año ${filters.anio || "—"}`}
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
          <YAxis allowDecimals={false} />
          <Tooltip content={renderTooltip} />
          <Legend />
          <Bar dataKey="total" name="Total por portal" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.portal}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
