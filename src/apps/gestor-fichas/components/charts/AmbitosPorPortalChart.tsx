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
import ChartCard from "@/shared/components/charts/ChartCard";
import { Filters } from "@/apps/gestor-fichas/lib/types";
import { apiJSON } from "@/apps/gestor-fichas/lib/api";
import { pickFichasFilters } from "@/apps/gestor-fichas/lib/utils";

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
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#14b8a6", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

const AMBITO_COLORS = {
  estado: "#3b82f6",   // azul
  ccaa: "#10b981",     // verde
  provincia: "#f59e0b", // amarillo
  municipal: "#8b5cf6", // morado
};

export default function AmbitosPorPortalChart({ filters }: { filters: Filters }) {
  const [data, setData] = useState<Row[]>([]);
  const [metadata, setMetadata] = useState<{ total_unique_fichas: number; total_assignments: number; total_entries: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // mes + anio + filtros comunes de /api/apps/gestor-fichas/fichas
  const f = useMemo(
    () => ({ anio: filters.anio, mes: filters.mes, ...pickFichasFilters(filters) }),
    [filters]
  );

  useEffect(() => {
    let cancel = false;
    setLoading(true);

    // ✅ Endpoint correcto
    apiJSON<any>("/api/apps/gestor-fichas/stats/ambitos-por-portal", f, { cache: "no-store" })
      .then((response) => {
        if (cancel) return;

        // Soporte para ambos formatos (legacy y nuevo)
        const rows = Array.isArray(response) ? response : (response?.data || []);
        const meta = Array.isArray(response) ? null : response?.metadata || null;

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
        setMetadata(meta);
      })
      .catch((e) => {
        console.error("AmbitosPorPortalChart:", e);
        if (!cancel) {
          setData([]);
          setMetadata(null);
        }
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

  const totalGlobal = data.reduce((s, r) => s + r.total, 0);
  const topPortal = data[0];
  const maxAmbitos = data.reduce((max, portal) => {
    const ambitoCount = [portal.estado, portal.ccaa, portal.provincia, portal.municipal].filter(x => x > 0).length;
    return Math.max(max, ambitoCount);
  }, 0);

  // Generar título dinámico
  const getDynamicTitle = () => {
    let baseTitle = "Ámbitos por portal";
    
    if (filters.ambito) {
      const ambitoLabels = { UE: "🇪🇺 UE", ESTADO: "🏛️ Estado", CCAA: "🌐 CCAA", PROVINCIA: "📍 Provincia" };
      const ambitoLabel = ambitoLabels[filters.ambito as keyof typeof ambitoLabels] || filters.ambito;
      baseTitle = `Distribución de fichas ${ambitoLabel}`;
    }
    
    if (filters.tematica_id) {
      baseTitle = `Ámbitos por portal (temática específica)`;
    }
    
    if (filters.trabajador_id) {
      baseTitle = `Ámbitos trabajados por portal`;
    }
    
    if (filters.anio && filters.mes) {
      baseTitle = `${baseTitle} (${filters.mes}/${filters.anio})`;
    } else if (filters.anio) {
      baseTitle = `${baseTitle} (${filters.anio})`;
    }
    
    return baseTitle;
  };

  const noteText = `Distribución de ${metadata?.total_unique_fichas || "—"} fichas únicas por portales y ámbitos. Una ficha puede aparecer en múltiples portales.`;

  return (
    <ChartCard
      title={getDynamicTitle()}
      loading={loading}
      hint={`Mes ${filters.mes || "—"} · Año ${filters.anio || "—"}`}
      note={noteText}
    >
      <div className="bg-gradient-to-br from-slate-50/50 to-white rounded-xl p-6">
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
              <defs>
                {data.map((entry, index) => {
                  const color = COLORS[index % COLORS.length];
                  return (
                    <linearGradient key={entry.portal} id={`gradient-ambito-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                    </linearGradient>
                  );
                })}
                <filter id="ambitoShadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15"/>
                </filter>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="2 4" 
                stroke="#e2e8f0" 
                strokeOpacity={0.6}
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="portal"
                interval={0}
                angle={-35}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip content={renderTooltip} />
              
              <Bar 
                dataKey="total" 
                radius={[6, 6, 0, 0]}
                filter="url(#ambitoShadow)"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${entry.portal}`} 
                    fill={`url(#gradient-ambito-${index})`}
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Panel de estadísticas con desglose de ámbitos */}
        <div className="mt-6 space-y-4">
          {/* Stats principales */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">FICHAS ÚNICAS</div>
                <div className="text-xl font-bold text-blue-600 tabular-nums">
                  {metadata?.total_unique_fichas?.toLocaleString() || "—"}
                </div>
                <div className="text-xs text-slate-500">En la base de datos</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">ASIGNACIONES</div>
                <div className="text-xl font-bold text-slate-900 tabular-nums">
                  {totalGlobal.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">En portales/ámbitos</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">PORTAL LÍDER</div>
                <div className="text-lg font-bold text-blue-600 truncate" title={topPortal?.portal}>
                  {topPortal?.portal || "—"}
                </div>
                <div className="text-xs text-slate-500">
                  {topPortal?.total.toLocaleString()} fichas
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">MÁX ÁMBITOS</div>
                <div className="text-2xl font-bold text-green-600 tabular-nums">
                  {maxAmbitos}
                </div>
                <div className="text-xs text-slate-500">Por portal</div>
              </div>
            </div>
          </div>
          
          {/* Leyenda de ámbitos */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Ámbitos</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: AMBITO_COLORS.estado }}></div>
                <span className="text-sm text-slate-700">Estado/UE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: AMBITO_COLORS.ccaa }}></div>
                <span className="text-sm text-slate-700">CCAA</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: AMBITO_COLORS.provincia }}></div>
                <span className="text-sm text-slate-700">Provincia</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: AMBITO_COLORS.municipal }}></div>
                <span className="text-sm text-slate-700">Municipal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
