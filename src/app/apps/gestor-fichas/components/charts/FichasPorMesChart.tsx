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
import ChartCard from "@/components/ui/cards/ChartCard";
import { Filters } from "@/app/apps/gestor-fichas/lib/types";
import { pickFichasFilters } from "@/app/apps/gestor-fichas/lib/utils";

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

    // Construir query string con todos los filtros relevantes
    const params = new URLSearchParams();
    if (filters.anio) params.set("anio", filters.anio);
    if (filters.mes) params.set("mes", filters.mes);
    if (filters.q) params.set("q", filters.q);
    if (filters.ambito) params.set("ambito", filters.ambito);
    if (filters.tramite_tipo) params.set("tramite_tipo", filters.tramite_tipo);
    if (filters.complejidad) params.set("complejidad", filters.complejidad);
    if (filters.ccaa_id) params.set("ccaa_id", filters.ccaa_id);
    if (filters.provincia_id) params.set("provincia_id", filters.provincia_id);
    if (filters.provincia_principal) params.set("provincia_principal", filters.provincia_principal);
    if (filters.trabajador_id) params.set("trabajador_id", filters.trabajador_id);
    if (filters.trabajador_subida_id) params.set("trabajador_subida_id", filters.trabajador_subida_id);
    if (filters.tematica_id) params.set("tematica_id", filters.tematica_id);
    if (filters.created_desde) params.set("created_desde", filters.created_desde);
    if (filters.created_hasta) params.set("created_hasta", filters.created_hasta);

    const queryString = params.toString();
    const url = queryString ? `/api/apps/gestor-fichas/stats/fichas-por-mes?${queryString}` : `/api/apps/gestor-fichas/stats/fichas-por-mes?anio=${filters.anio ?? ""}`;

    fetch(url, { cache: "no-store" })
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
  }, [filters]);

  const totalAnual = data.reduce((acc, r) => acc + r.total, 0);
  const avg = data.length > 0 ? Math.round(totalAnual / data.length) : 0;

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

  // Generar título dinámico basado en filtros activos
  const getDynamicTitle = () => {
    const parts: string[] = [];
    
    // Título base
    let baseTitle = "Fichas por mes";
    
    // Agregar contexto específico
    if (filters.ambito) {
      const ambitoLabels = { UE: "🇪🇺 UE", ESTADO: "🏛️ Estado", CCAA: "🌐 CCAA", PROVINCIA: "📍 Provincia" };
      baseTitle = `Fichas ${ambitoLabels[filters.ambito as keyof typeof ambitoLabels] || filters.ambito} por mes`;
    }
    
    if (filters.tematica_id) {
      baseTitle = `Fichas de temática específica por mes`;
    }
    
    if (filters.trabajador_id) {
      baseTitle = `Fichas por trabajador por mes`;
    }
    
    if (filters.tramite_tipo) {
      const tramiteLabels = { no: "sin trámite", si: "con trámite", directo: "directo" };
      const tramiteLabel = tramiteLabels[filters.tramite_tipo as keyof typeof tramiteLabels] || filters.tramite_tipo;
      baseTitle = `Fichas ${tramiteLabel} por mes`;
    }
    
    if (filters.complejidad) {
      baseTitle = `Fichas de complejidad ${filters.complejidad} por mes`;
    }
    
    return baseTitle;
  };

  // Generar descripción de contexto
  const getFilterSummary = () => {
    const parts: string[] = [];
    
    if (filters.anio) parts.push(`${filters.anio}`);
    if (filters.mes) parts.push(`Mes ${filters.mes}`);
    if (filters.q) parts.push(`Búsqueda: "${filters.q.substring(0, 15)}${filters.q.length > 15 ? '...' : ''}"`);
    
    return parts.length > 0 ? parts.join(" • ") : "Todos los datos";
  };

  return (
    <ChartCard 
      title={getDynamicTitle()} 
      loading={loading} 
      hint={getFilterSummary()}
    >
      <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-xl p-6 h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
            <defs>
              <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1"/>
              </filter>
            </defs>

            <CartesianGrid 
              strokeDasharray="2 4" 
              stroke="#e2e8f0" 
              strokeOpacity={0.6}
              vertical={false}
            />
            <XAxis
              dataKey="mes"
              tickFormatter={(v: string) => MONTHS.find((m) => m.key === v)?.label ?? v}
              interval={0}
              height={40}
              tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              allowDecimals={false} 
              tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
              domain={[0, (max: number) => Math.max(3, Math.ceil(max * 1.15))]}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <Tooltip content={renderTooltip} />

            {/* Área con gradiente mejorado */}
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="none" 
              fill="url(#fillArea)" 
              fillOpacity={1}
            />

            {/* Línea principal moderna */}
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ 
                r: 4, 
                fill: '#ffffff', 
                stroke: '#3b82f6', 
                strokeWidth: 3,
                filter: 'url(#shadow)'
              }} 
              activeDot={{ 
                r: 6, 
                fill: '#3b82f6',
                stroke: '#ffffff',
                strokeWidth: 3,
                filter: 'url(#shadow)'
              }}
            >
              <LabelList 
                dataKey="total" 
                content={pointLabel} 
                style={{ fontWeight: 600, fontSize: '12px' }}
              />
            </Line>

            {/* Línea de referencia moderna */}
            {avg > 0 && (
              <ReferenceLine 
                y={avg} 
                stroke="#64748b" 
                strokeDasharray="4 6" 
                strokeOpacity={0.8}
                ifOverflow="extendDomain"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Panel de estadísticas moderno */}
      <div className="mt-6 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-sm font-medium text-slate-600 mb-1">TOTAL AÑO</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {totalAnual.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">{filters.anio || "—"}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-600 mb-1">PROMEDIO MES</div>
            <div className="text-2xl font-bold text-blue-600 tabular-nums">
              {avg.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">Fichas/mes</div>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-600 mb-1">MEJOR MES</div>
            <div className="text-2xl font-bold text-green-600 tabular-nums">
              {Math.max(...data.map(d => d.total)).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              {MONTHS.find(m => m.key === data.find(d => d.total === Math.max(...data.map(x => x.total)))?.mes)?.label || "—"}
            </div>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
