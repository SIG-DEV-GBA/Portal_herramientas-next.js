// src/components/charts/TramiteOnlineChart.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ChartCard from "@/shared/components/charts/ChartCard";
import { Filters, ResTramiteOnline } from "@/apps/gestor-fichas/lib/types";
import { apiJSON } from "@/apps/gestor-fichas/lib/api";
import { pickFichasFilters } from "@/apps/gestor-fichas/lib/utils";

type Row = { tipo: "Directo" | "Sí" | "No"; total: number };

const COLOR_BY_TIPO: Record<Row["tipo"], string> = {
  Directo: "#3b82f6",
  "Sí": "#10b981",
  "No": "#f59e0b",
};

const GRADIENT_COLORS = {
  Directo: ["#3b82f6", "#1d4ed8"],
  "Sí": ["#10b981", "#059669"],
  "No": ["#f59e0b", "#d97706"],
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

  // ✅ ahora incluimos anio/mes además del rango y demás filtros
  const f = useMemo(
    () => ({
      anio: filters.anio,
      mes: filters.mes,
      created_desde: filters.created_desde,
      created_hasta: filters.created_hasta,
      ...pickFichasFilters(filters),
    }),
    [filters]
  );

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    apiJSON<ResTramiteOnline>("/api/apps/gestor-fichas/stats/tramite-online", f, { cache: "no-store" })
      .then((res) => {
        if (cancel) return;
        const t = res?.total || { directo: 0, si: 0, no: 0, total: 0 };
        const rows: Row[] = [
          { tipo: "Directo", total: Number(t.directo || 0) },
          { tipo: "Sí",      total: Number(t.si || 0) },
          { tipo: "No",      total: Number(t.no || 0) },
        ];
        rows.sort((a, b) => ORDER.indexOf(a.tipo) - ORDER.indexOf(b.tipo));
        setData(rows);
      })
      .catch(() => setData([]))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [f]);

  const total = data.reduce((acc, r) => acc + (r.total || 0), 0);
  const p = (n: number) => (total > 0 ? +((n / total) * 100).toFixed(1) : 0);
  const pSi = p(data.find((d) => d.tipo === "Sí")?.total || 0);

  const renderSliceLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, percent } = props;
    if (!percent || percent < 0.12) return null;
    const RAD = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.75;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);
    const pct = Math.round(percent * 100);
    return (
      <text x={x} y={y} fill="#111827" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" style={{ fontSize: 12, fontWeight: 600 }}>
        {`${pct}% (${value})`}
      </text>
    );
  };

  const CenterLabel = () => (
    <div className="absolute top-0 left-0 right-0 flex justify-center pt-2 pointer-events-none">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-wide text-gray-600">Trámite online (Sí)</div>
        <div className="text-xl sm:text-2xl font-semibold tabular-nums leading-tight text-black">{pSi}%</div>
        <div className="mt-0.5 text-[11px] text-gray-600">Total: {total}</div>
      </div>
    </div>
  );

  const Legend = () => (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-black">
      {data.map((d) => (
        <div key={d.tipo} className="flex items-start gap-2">
          <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLOR_BY_TIPO[d.tipo] }} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{d.tipo}</span>
              <span className="tabular-nums">{d.total} ({p(d.total)}%)</span>
            </div>
            <div className="text-[12px] leading-snug text-gray-700">{LEGEND_TEXT[d.tipo]}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const Empty = () => (
    <div className="h-[220px] flex items-center justify-center text-sm text-gray-700">
      No hay datos para el periodo seleccionado.
    </div>
  );

  const hint =
    filters.created_desde || filters.created_hasta
      ? `${filters.created_desde || ""} → ${filters.created_hasta || ""}`
      : `Año ${filters.anio || "—"}${filters.mes ? ` · Mes ${filters.mes}` : ""}`;

  // Generar título dinámico
  const getDynamicTitle = () => {
    let baseTitle = "Trámite online";
    
    if (filters.tramite_tipo) {
      const tramiteLabels = { no: "Sin trámite", si: "Con trámite", directo: "Trámite directo" };
      baseTitle = tramiteLabels[filters.tramite_tipo as keyof typeof tramiteLabels] || "Trámite online";
    }
    
    if (filters.ambito) {
      const ambitoLabels = { UE: "🇪🇺 UE", ESTADO: "🏛️ Estado", CCAA: "🌐 CCAA", PROVINCIA: "📍 Provincia" };
      const ambitoLabel = ambitoLabels[filters.ambito as keyof typeof ambitoLabels] || filters.ambito;
      baseTitle = `Trámites ${ambitoLabel}`;
    }
    
    if (filters.tematica_id) {
      baseTitle = `Trámites por temática específica`;
    }
    
    if (filters.complejidad) {
      baseTitle = `Trámites de complejidad ${filters.complejidad}`;
    }
    
    return baseTitle;
  };

  return (
    <ChartCard title={getDynamicTitle()} loading={loading} hint={hint}>
      {total === 0 ? (
        <Empty />
      ) : (
        <div className="bg-gradient-to-br from-slate-50/50 to-white rounded-xl p-6">
          <div className="flex h-[380px] gap-6">
            {/* Área del gráfico */}
            <div className="flex-1 relative">
              {/* Métrica central */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center z-10">
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    TRÁMITE ONLINE
                  </div>
                  <div className="text-4xl font-bold text-green-600 mb-1">{pSi}%</div>
                  <div className="text-sm text-slate-600">
                    {total.toLocaleString()} fichas
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {data.map((d) => {
                      const [color1, color2] = GRADIENT_COLORS[d.tipo];
                      return (
                        <linearGradient key={d.tipo} id={`gradient-${d.tipo}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={color1} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={color2} stopOpacity={1} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <Pie
                    data={data}
                    dataKey="total"
                    nameKey="tipo"
                    cx="50%"
                    cy="50%"
                    innerRadius={85}
                    outerRadius={140}
                    paddingAngle={4}
                    cornerRadius={6}
                    isAnimationActive
                    animationDuration={800}
                  >
                    {data.map((d) => (
                      <Cell 
                        key={d.tipo} 
                        fill={`url(#gradient-${d.tipo})`}
                        stroke="#ffffff"
                        strokeWidth={3}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, _n: any, e: any) => [
                      `${Number(v).toLocaleString()} fichas (${p(v as number)}%)`,
                      e?.payload?.tipo
                    ]}
                    contentStyle={{ 
                      background: "rgba(0,0,0,0.9)", 
                      border: "none", 
                      borderRadius: "12px", 
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: "500",
                      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelFormatter={() => "Distribución"}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Panel lateral con información y scroll */}
            <div className="w-80 bg-white/60 backdrop-blur-sm border-l border-slate-200/60 pl-6 flex flex-col overflow-hidden">
              {/* Estadísticas rápidas - fijas */}
              <div className="flex-shrink-0 mb-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Resumen</h3>
                <div className="space-y-3">
                  <div className="text-center p-3 bg-green-50/50 rounded-lg border border-green-200/50">
                    <div className="text-2xl font-bold text-green-600">{pSi}%</div>
                    <div className="text-xs text-slate-600">Admite trámite online</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-slate-50 rounded">
                      <div className="font-semibold text-slate-900">
                        {data.find(d => d.tipo === "Directo")?.total.toLocaleString() || 0}
                      </div>
                      <div className="text-slate-500">Directo</div>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded">
                      <div className="font-semibold text-slate-900">
                        {data.find(d => d.tipo === "No")?.total.toLocaleString() || 0}
                      </div>
                      <div className="text-slate-500">No online</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leyenda detallada - con scroll */}
              <div className="flex-1 min-h-0">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex-shrink-0">Tipos de trámite</h3>
                <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  <div className="space-y-3">
                    {data.map((d) => (
                      <div key={d.tipo} className="p-3 rounded-lg hover:bg-white/80 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" 
                            style={{ background: COLOR_BY_TIPO[d.tipo] }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-900 truncate">{d.tipo}</span>
                              <span className="text-sm font-semibold text-slate-700 flex-shrink-0 ml-2">
                                {p(d.total)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-7">
                          <div className="text-xs text-slate-600 leading-relaxed">
                            {LEGEND_TEXT[d.tipo]}
                          </div>
                          <div className="text-xs font-medium text-slate-800 mt-1">
                            {d.total.toLocaleString()} fichas
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
