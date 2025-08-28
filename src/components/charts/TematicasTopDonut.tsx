"use client";
import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ChartCard from "../cards/ChartCard";
import { Filters } from "@/lib/stats/types";
import { apiJSON } from "@/lib/stats/api";
import { pickFichasFilters } from "@/lib/stats/utils";

type Row = { tematica_id: number; tematica_nombre: string; total: number };

const PALETTE = [
  "#2563eb","#22c55e","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#eab308","#f97316","#a855f7","#10b981",
  "#0ea5e9","#84cc16","#64748b","#f43f5e","#14b8a6",
];
const colorFromString = (s: string) => {
  let h = 0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i))|0;
  return PALETTE[Math.abs(h) % PALETTE.length];
};

export default function TematicasTopDonut({ filters }: { filters: Filters }) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const qs = useMemo(() => {
    const base: any = {
      anio: filters.anio ?? "",
      created_desde: filters.created_desde ?? "",
      created_hasta: filters.created_hasta ?? "",
      ...pickFichasFilters(filters),
    };
    Object.keys(base).forEach((k) => (base[k] === "" || base[k] == null) && delete base[k]);
    return base;
  }, [filters]);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    apiJSON<Row[]>("/api/stats/tematicas-top", qs, { cache: "no-store" })
      .then((rows) => !cancel && setData(rows ?? []))
      .catch(() => !cancel && setData([]))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [qs]);

  const total = data.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const pct = (n: number) => (total > 0 ? +((n/total)*100).toFixed(1) : 0);

  const renderSliceLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, percent, name } = props;
    if (!percent || percent < 0.09) return null; // evita solapado
    const RAD = Math.PI/180;
    const radius = innerRadius + (outerRadius-innerRadius)*0.7;
    const x = cx + radius*Math.cos(-midAngle*RAD);
    const y = cy + radius*Math.sin(-midAngle*RAD);
    return (
      <text x={x} y={y} fill="#111827" textAnchor={x>cx?"start":"end"} dominantBaseline="central"
        style={{ fontSize: 11, fontWeight: 600 }}>
        {name}: {Math.round(percent*100)}% ({value})
      </text>
    );
  };

  const hint =
    filters.created_desde || filters.created_hasta
      ? `${filters.created_desde || ""} → ${filters.created_hasta || ""}`
      : `Año ${filters.anio || "—"}`;

  return (
    <ChartCard title="Top temáticas (distribución)" loading={loading} hint={hint}>
      {total === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-sm text-gray-600">
          No hay datos para el periodo seleccionado.
        </div>
      ) : (
        <div className="relative h-[340px]">
          {/* Métrica central */}
          <div className="absolute inset-x-0 top-2 flex justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-wide text-gray-600">Total fichas</div>
              <div className="text-2xl font-semibold tabular-nums text-black">{total}</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.map((d) => ({ name: d.tematica_nombre, value: d.total }))}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={110}
                cy={190}
                startAngle={90}
                endAngle={-270}
                paddingAngle={2}
                label={renderSliceLabel}
                labelLine={false}
                isAnimationActive
              >
                {data.map((d) => (
                  <Cell key={d.tematica_id} fill={colorFromString(d.tematica_nombre)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: any, n: any) => [`${v} (${pct(Number(v))}%)`, n]}
                contentStyle={{
                  background: "rgba(17,24,39,0.9)", border: "none", borderRadius: 12, color: "#fff",
                }}
                itemStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Leyenda compacta */}
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.map((d) => (
              <div key={d.tematica_id} className="flex items-center gap-2 text-sm">
                <span className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: colorFromString(d.tematica_nombre) }} />
                <span className="truncate">{d.tematica_nombre}</span>
                <span className="ml-auto tabular-nums text-gray-700">
                  {d.total} ({pct(d.total)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
