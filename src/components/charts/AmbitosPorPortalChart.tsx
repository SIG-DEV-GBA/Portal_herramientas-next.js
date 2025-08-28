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
import { Filters } from "@/lib/stats/types";
import { apiJSON } from "@/lib/stats/api";
import { pickFichasFilters } from "@/lib/stats/utils";

type Row = {
  portal: string;
  total: number;
  // para tooltip
  estado: number;     // suma de ESTADO + UE
  ccaa: number;       // CCAA
  provincia: number;  // PROVINCIA
  municipal: number;  // (no existe en enum; queda en 0 por compat)
};

const COLORS = [
  "#2563eb", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#22c55e", "#06b6d4", "#eab308", "#f97316", "#a855f7",
];

export default function AmbitosPorPortalChart({ filters }: { filters: Filters }) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // mes + anio + filtros comunes de /api/fichas
  const f = useMemo(
    () => ({ anio: filters.anio, mes: filters.mes, ...pickFichasFilters(filters) }),
    [filters]
  );

  useEffect(() => {
    let cancel = false;
    setLoading(true);

    // ✅ Endpoint correcto
    apiJSON<any[]>("/api/stats/ambitos-por-portal", f, { cache: "no-store" })
      .then((rows) => {
        if (cancel) return;

        // rows esperadas: [{ portal_id, portal_nombre, ambito, total }, ...]
        // agrupamos por portal y mapeamos ámbitos al tooltip
        const byPortal = new Map<string, Row>();

        for (const r of rows ?? []) {
          const portal = r.portal_nombre ?? "—";
          const ambito = String(r.ambito ?? "").toUpperCase();
          const cnt = Number(r.total ?? 0);

          if (!byPortal.has(portal)) {
            byPortal.set(portal, {
              portal,
              estado: 0,
              ccaa: 0,
              provincia: 0,
              municipal: 0,
              total: 0,
            });
          }
          const acc = byPortal.get(portal)!;

          // agrupación: ESTADO + UE => estado
          if (ambito === "ESTADO" || ambito === "UE") acc.estado += cnt;
          else if (ambito === "CCAA") acc.ccaa += cnt;
          else if (ambito === "PROVINCIA") acc.provincia += cnt;
          // si algún día aparece "MUNICIPAL", aquí sumas acc.municipal += cnt;

          acc.total = acc.estado + acc.ccaa + acc.provincia + acc.municipal;
        }

        const out = Array.from(byPortal.values());
        // ordenar por total desc (más legible)
        out.sort((a, b) => b.total - a.total);
        setData(out);
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
          <div>Estado/UE: <strong>{d.estado}</strong></div>
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
