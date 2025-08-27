"use client";
import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ChartCard from "../cards/ChartCard";
import { Filters, ResTramiteOnline } from "@/lib/stats/types";
import { apiJSON } from "@/lib/stats/api";
import { pickFichasFilters } from "@/lib/stats/utils";

type Row = { tipo: "Directo" | "Sí" | "No"; total: number };

const COLOR_BY_TIPO: Record<Row["tipo"], string> = {
  Directo: "#0ea5e9", // azul
  "Sí": "#22c55e",    // verde
  "No": "#ef4444",    // rojo
};
const ORDER: Row["tipo"][] = ["Directo", "Sí", "No"];

const LEGEND_TEXT: Record<Row["tipo"], string> = {
  Directo: "Acceso directo (sin trámite online intermedio)",
  "Sí": "Admite trámite online",
  "No": "No admite trámite online",
};

export default function TramiteOnlineChart({ filters }: { filters: Filters }) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const f = useMemo(
    () => ({
      created_desde: filters.created_desde,
      created_hasta: filters.created_hasta,
      ...pickFichasFilters(filters),
    }),
    [filters]
  );

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    apiJSON<ResTramiteOnline>("/api/stats/tramite-online", f, { cache: "no-store" })
      .then((res) => {
        if (cancel) return;
        const t = res?.total || { directo: 0, si: 0, no: 0, total: 0 };
        const rows = [
          { tipo: "Directo", total: Number(t.directo ?? 0) },
          { tipo: "Sí",      total: Number(t.si ?? 0) },
          { tipo: "No",      total: Number(t.no ?? 0) },
        ] as const satisfies Row[];
        setData([...rows].sort((a, b) => ORDER.indexOf(a.tipo) - ORDER.indexOf(b.tipo)));
      })
      .catch(() => setData([]))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [f]);

  const total = data.reduce((acc, r) => acc + (r.total || 0), 0);
  const p = (n: number) => (total > 0 ? +((n / total) * 100).toFixed(1) : 0);
  const pSi = p(data.find((d) => d.tipo === "Sí")?.total || 0);

  // Etiquetas en porciones: % + conteo, en negro (solo si >= 12%)
  const renderSliceLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, percent } = props;
    if (!percent || percent < 0.12) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.75;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const pct = Math.round(percent * 100);
    return (
      <text
        x={x}
        y={y}
        fill="#111827"                // negro
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        style={{ fontSize: 12, fontWeight: 600 }}
      >
        {`${pct}% (${value})`}
      </text>
    );
  };

  // Cabecera métrica (arriba, siempre en tonos oscuros)
  const CenterLabel = () => (
    <div className="absolute top-0 left-0 right-0 flex justify-center pt-2 pointer-events-none">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-wide text-gray-600">
          Trámite online (Sí)
        </div>
        <div className="text-xl sm:text-2xl font-semibold tabular-nums leading-tight text-black">
          {pSi}%
        </div>
        <div className="mt-0.5 text-[11px] text-gray-600">
          Total: {total}
        </div>
      </div>
    </div>
  );

  // Leyenda (solo claro: negro/grises)
  const Legend = () => (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-black">
      {data.map((d) => (
        <div key={d.tipo} className="flex items-start gap-2">
          <span
            className="mt-1 inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: COLOR_BY_TIPO[d.tipo] }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{d.tipo}</span>
              <span className="tabular-nums">
                {d.total} ({p(d.total)}%)
              </span>
            </div>
            <div className="text-[12px] leading-snug text-gray-700">
              {LEGEND_TEXT[d.tipo]}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const Empty = () => (
    <div className="h-[220px] flex items-center justify-center text-sm text-gray-700">
      No hay datos para el rango seleccionado.
    </div>
  );

  return (
    <ChartCard
      title="Distribución de trámite online"
      loading={loading}
      hint={`${filters.created_desde || ""} → ${filters.created_hasta || ""}`}
    >
      {total === 0 ? (
        <Empty />
      ) : (
        <div className="relative">
          {/* Reservamos alto para la cabecera y bajamos el donut */}
          <div className="relative h-[320px]">
            <CenterLabel />
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="tipo"
                  innerRadius={70}
                  outerRadius={110}
                  cy={180}                 // baja el donut para no chocar con la cabecera
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={2}
                  label={renderSliceLabel} // etiqueta custom (negra)
                  labelLine={false}
                  isAnimationActive
                >
                  {data.map((d) => (
                    <Cell key={d.tipo} fill={COLOR_BY_TIPO[d.tipo]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any, _n: any, e: any) => [
                    `${v} (${p(v as number)}%)`,
                    e?.payload?.tipo,
                  ]}
                  contentStyle={{
                    background: "rgba(17,24,39,0.9)",
                    border: "none",
                    borderRadius: 12,
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                  labelFormatter={() => "Distribución"}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <Legend />
    </ChartCard>
  );
}
