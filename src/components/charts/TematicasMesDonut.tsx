"use client";
import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ChartCard from "../cards/ChartCard";
import { Filters } from "@/lib/stats/types";
import { apiJSON } from "@/lib/stats/api";
import { pickFichasFilters, monthName } from "@/lib/stats/utils";

type RowApi = { month: string; tematica_id: number; tematica_nombre: string; total: number };
type Row = { name: string; value: number; id: number };

const PALETTE = [
  "#2563eb","#22c55e","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#eab308","#f97316","#a855f7","#10b981",
  "#0ea5e9","#84cc16","#64748b","#f43f5e","#14b8a6",
];
const colorFromString = (s: string) => {
  let h = 0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i))|0;
  return PALETTE[Math.abs(h) % PALETTE.length];
};

export default function TematicasMesDonut({ filters }: { filters: Filters }) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const qs = useMemo(() => {
    const base: any = {
      anio: filters.anio ?? "",
      ...pickFichasFilters(filters),
    };
    // NOTA: esta ruta no necesita created_desde/hasta; usa anio fijo
    delete base.created_desde;
    delete base.created_hasta;
    Object.keys(base).forEach((k) => (base[k] === "" || base[k] == null) && delete base[k]);
    return base;
  }, [filters]);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    apiJSON<RowApi[]>("/api/stats/tematicas-por-mes", qs, { cache: "no-store" })
      .then((rows) => {
        if (cancel) return;
        const list = rows ?? [];
        const monthFilter = Number(filters.mes || 0); // 1..12 ó 0 = total anual

        // Agregamos por temática:
        const map = new Map<number, Row>();
        for (const r of list) {
          const m = Number((r.month || "").slice(5, 7)); // YYYY-MM => MM
          if (monthFilter >= 1 && monthFilter <= 12 && m !== monthFilter) continue;

          const prev = map.get(r.tematica_id)?.value ?? 0;
          map.set(r.tematica_id, { id: r.tematica_id, name: r.tematica_nombre, value: prev + Number(r.total || 0) });
        }
        const out = Array.from(map.values()).sort((a, b) => b.value - a.value);
        setData(out);
      })
      .catch(() => setData([]))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [qs, filters.mes]);

  const total = data.reduce((s, r) => s + (r.value || 0), 0);
  const pct = (n: number) => (total > 0 ? +((n/total)*100).toFixed(1) : 0);

  const renderSliceLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, percent, name } = props;
    if (!percent || percent < 0.09) return null;
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
    filters.mes
      ? `Mes ${monthName(filters.mes)} · Año ${filters.anio || "—"}`
      : `Año ${filters.anio || "—"} (total anual)`;

  return (
    <ChartCard title="Temáticas (mes / total anual)" loading={loading} hint={hint}>
      {total === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-sm text-gray-600">
          No hay datos para el periodo seleccionado.
        </div>
      ) : (
        <div className="relative h-[340px]">
          <div className="absolute inset-x-0 top-2 flex justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-wide text-gray-600">
                {filters.mes ? "Total del mes" : "Total anual"}
              </div>
              <div className="text-2xl font-semibold tabular-nums text-black">{total}</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
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
                  <Cell key={d.id} fill={colorFromString(d.name)} />
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

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-sm">
                <span className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: colorFromString(d.name) }} />
                <span className="truncate">{d.name}</span>
                <span className="ml-auto tabular-nums text-gray-700">
                  {d.value} ({pct(d.value)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
