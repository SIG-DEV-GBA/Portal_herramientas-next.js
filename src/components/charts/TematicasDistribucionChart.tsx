"use client";
import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ChartCard from "../cards/ChartCard";
import { Filters } from "@/lib/stats/types";
import { apiJSON } from "@/lib/stats/api";
import { pickFichasFilters, monthName } from "@/lib/stats/utils";

type RowApi = { tematica_id: number; tematica_nombre: string; total: number };
type Row = { id: number; name: string; value: number };

const PALETTE = [
  "#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#84cc16","#f97316","#6366f1","#14b8a6",
  "#f43f5e","#8b5cf6","#0ea5e9","#64748b","#22c55e",
];
const colorFromString = (s: string) => {
  let h = 0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i))|0;
  return PALETTE[Math.abs(h) % PALETTE.length];
};

export default function TematicasDistribucionDonut({ filters }: { filters: Filters }) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // anio obligatorio; mes opcional; resto de filtros de fichas
  const qs = useMemo(() => {
    const base: any = {
      anio: filters.anio ?? "",
      mes: filters.mes ?? "",           // si viene, se usa rango mensual
      ...pickFichasFilters(filters),    // ambito, ccaa_id, provincia_id, trabajador*, tramite*, complejidad, existe_frase, etc.
    };
    // esta ruta NO usa created_desde/hasta (el rango lo decide anio/mes)
    delete base.created_desde;
    delete base.created_hasta;
    Object.keys(base).forEach((k) => (base[k] === "" || base[k] == null) && delete base[k]);
    return base;
  }, [filters]);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    apiJSON<RowApi[]>("/api/stats/tematicas-distribucion", qs, { cache: "no-store" })
      .then((rows) => {
        if (cancel) return;
        const out: Row[] = (rows ?? [])
          .map(r => ({ id: r.tematica_id, name: r.tematica_nombre, value: Number(r.total || 0) }))
          .filter(r => r.value > 0)
          .sort((a,b) => b.value - a.value);
        setData(out);
      })
      .catch(() => !cancel && setData([]))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [qs]);

  const total = data.reduce((s, r) => s + (r.value || 0), 0);
  const pct = (n: number) => (total > 0 ? +((n/total)*100).toFixed(1) : 0);


  const hint =
    filters.mes
      ? `Mes ${monthName(filters.mes)} · Año ${filters.anio || "—"}`
      : `Año ${filters.anio || "—"} (total anual)`;

  // Generar título dinámico
  const getDynamicTitle = () => {
    let baseTitle = "Distribución de temáticas";
    
    if (filters.mes) {
      baseTitle = `Temáticas del mes ${monthName(filters.mes)}`;
    } else if (filters.anio) {
      baseTitle = `Temáticas del año ${filters.anio}`;
    }
    
    if (filters.ambito) {
      const ambitoLabels = { UE: "🇪🇺 UE", ESTADO: "🏛️ Estado", CCAA: "🌐 CCAA", PROVINCIA: "📍 Provincia" };
      const ambitoLabel = ambitoLabels[filters.ambito as keyof typeof ambitoLabels] || filters.ambito;
      baseTitle = `Temáticas en ${ambitoLabel}`;
    }
    
    if (filters.trabajador_id) {
      baseTitle = `Temáticas trabajadas`;
    }
    
    if (filters.tramite_tipo) {
      const tramiteLabels = { no: "sin trámite", si: "con trámite", directo: "directo" };
      const tramiteLabel = tramiteLabels[filters.tramite_tipo as keyof typeof tramiteLabels] || filters.tramite_tipo;
      baseTitle = `Temáticas ${tramiteLabel}`;
    }
    
    return baseTitle;
  };

  return (
    <ChartCard title={getDynamicTitle()} loading={loading} hint={hint}>
      {total === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-sm text-gray-600">
          No hay datos para el periodo seleccionado.
        </div>
      ) : (
        <div className="relative h-[400px] bg-gradient-to-br from-slate-50/50 to-white rounded-xl">
          <div className="flex h-full">
            {/* Área del gráfico */}
            <div className="flex-1 relative">
              {/* Métrica central */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center z-10">
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    {filters.mes ? "TOTAL MES" : "TOTAL AÑO"}
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mb-1">{total.toLocaleString()}</div>
                  <div className="text-sm text-slate-600">
                    {data.length} temática{data.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {data.map((d, index) => (
                      <linearGradient key={d.id} id={`gradient-${d.id}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={colorFromString(d.name)} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={colorFromString(d.name)} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={85}
                    outerRadius={140}
                    paddingAngle={3}
                    cornerRadius={4}
                    isAnimationActive
                    animationDuration={800}
                  >
                    {data.map((d) => (
                      <Cell 
                        key={d.id} 
                        fill={`url(#gradient-${d.id})`}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, n: any) => [
                      `${Number(v).toLocaleString()} fichas (${pct(Number(v))}%)`,
                      n
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
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Panel lateral con información */}
            <div className="w-80 px-6 py-4 bg-white/60 backdrop-blur-sm border-l border-slate-200/60">
              {/* Stats rápidas */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Más popular</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900 truncate max-w-32" title={data[0]?.name}>
                        {data.length > 0 ? data[0].name : "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {data.length > 0 ? `${pct(data[0].value)}%` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Promedio</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {data.length > 0 ? Math.round(total / data.length).toLocaleString() : "0"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Leyenda moderna */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Distribución</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300">
                  {data.slice(0, 8).map((d, index) => (
                    <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/80 transition-colors">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" 
                        style={{ background: colorFromString(d.name) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-900 truncate" title={d.name}>
                          {d.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {d.value.toLocaleString()} • {pct(d.value)}%
                        </div>
                      </div>
                    </div>
                  ))}
                  {data.length > 8 && (
                    <div className="text-xs text-slate-500 text-center py-2">
                      +{data.length - 8} temáticas más
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
