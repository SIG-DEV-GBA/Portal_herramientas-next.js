"use client";
import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ChartCard from "@/shared/components/charts/ChartCard";
import { Filters } from "@/apps/gestor-fichas/lib/types";
import { apiJSON } from "@/apps/gestor-fichas/lib/api";
import { pickFichasFilters, monthName } from "@/apps/gestor-fichas/lib/utils";

type RowApi = { tematica_id: number; tematica_nombre: string; total: number };
type Row = { id: number; name: string; value: number };
type ApiResponse = {
  data: RowApi[];
  metadata: {
    total_unique_fichas: number;
    total_assignments: number;
    total_tematicas: number;
  };
};

// Paleta profesional con temáticas específicas y colores únicos
const TEMATICA_COLORS: Record<string, string> = {
  // Salud y bienestar
  "salud": "#ef4444",
  "sanidad": "#ef4444", 
  "discapacidad": "#06b6d4",
  "mayores": "#8b5cf6",
  "dependencia": "#a855f7",
  
  // Familia y social
  "familia": "#10b981",
  "infancia": "#22c55e",
  "juventud": "#84cc16",
  "mujer": "#ec4899",
  "igualdad": "#f472b6",
  
  // Educación y cultura
  "educacion": "#3b82f6",
  "educación": "#3b82f6",
  "cultura": "#6366f1",
  "deporte": "#0ea5e9",
  
  // Economía y trabajo
  "empleo": "#f59e0b",
  "trabajo": "#eab308",
  "economia": "#f97316",
  "economía": "#f97316",
  "empresa": "#fb923c",
  
  // Medio ambiente y territorio
  "medio ambiente": "#14b8a6",
  "medioambiente": "#14b8a6",
  "territorio": "#059669",
  "urbanismo": "#047857",
  "vivienda": "#065f46",
  
  // Servicios y administración
  "administracion": "#64748b",
  "administración": "#64748b",
  "servicios": "#475569",
  "transporte": "#334155",
  "seguridad": "#1e293b",
};

const PALETTE = [
  "#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#84cc16","#f97316","#6366f1","#14b8a6",
  "#f43f5e","#a855f7","#0ea5e9","#64748b","#22c55e",
  "#eab308","#fb923c","#ec4899","#f472b6","#059669",
];

const getTematicaColor = (tematicaName: string) => {
  // Buscar por palabras clave en el nombre
  const normalizedName = tematicaName.toLowerCase();
  
  for (const [keyword, color] of Object.entries(TEMATICA_COLORS)) {
    if (normalizedName.includes(keyword)) {
      return color;
    }
  }
  
  // Si no hay coincidencia, usar hash consistente
  let h = 0; 
  for (let i = 0; i < tematicaName.length; i++) {
    h = (h * 31 + tematicaName.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(h) % PALETTE.length];
};

export default function TematicasDistribucionDonut({ filters }: { filters: Filters }) {
  const [data, setData] = useState<Row[]>([]);
  const [metadata, setMetadata] = useState<{ total_unique_fichas: number; total_assignments: number; total_tematicas: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // anio opcional; mes opcional; resto de filtros de fichas
  const qs = useMemo(() => {
    const base: any = {
      ...pickFichasFilters(filters),    // ambito, ccaa_id, provincia_id, trabajador*, tramite*, complejidad, existe_frase, etc.
    };
    
    // Solo agregar año si existe y es válido
    if (filters.anio && filters.anio > 0) {
      base.anio = filters.anio;
    }
    
    // Solo agregar mes si existe y es válido
    if (filters.mes && filters.mes >= 1 && filters.mes <= 12) {
      base.mes = filters.mes;
    }
    
    // esta ruta NO usa created_desde/hasta (el rango lo decide anio/mes)
    delete base.created_desde;
    delete base.created_hasta;
    Object.keys(base).forEach((k) => (base[k] === "" || base[k] == null) && delete base[k]);
    return base;
  }, [filters]);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    apiJSON<ApiResponse>("/api/apps/gestor-fichas/stats/tematicas-distribucion", qs, { cache: "no-store" })
      .then((response) => {
        if (cancel) return;
        // Soporte para ambos formatos (legacy y nuevo)
        const rows = Array.isArray(response) ? response : (response?.data || []);
        const meta = Array.isArray(response) ? null : response?.metadata || null;
        
        const out: Row[] = (rows ?? [])
          .map(r => ({ id: r.tematica_id, name: r.tematica_nombre, value: Number(r.total || 0) }))
          .filter(r => r.value > 0)
          .sort((a,b) => b.value - a.value);
        setData(out);
        setMetadata(meta);
      })
      .catch(() => !cancel && (setData([]), setMetadata(null)))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [qs]);

  const total = data.reduce((s, r) => s + (r.value || 0), 0);
  const pct = (n: number) => (total > 0 ? +((n/total)*100).toFixed(1) : 0);


  const hint = (() => {
    if (filters.mes && filters.anio) {
      return `Mes ${monthName(filters.mes)} · Año ${filters.anio}`;
    }
    if (filters.mes && !filters.anio) {
      return `Mes ${monthName(filters.mes)} · Últimos 3 años`;
    }
    if (filters.anio && !filters.mes) {
      return `Año ${filters.anio} (total anual)`;
    }
    return "Últimos 3 años (sin filtros temporales)";
  })();

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

  const noteText = `Distribución de ${metadata?.total_unique_fichas || "—"} fichas únicas entre temáticas. Una ficha puede aparecer en múltiples temáticas.`;
  
  return (
    <ChartCard title={getDynamicTitle()} loading={loading} hint={hint} note={noteText}>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          transition: background 0.2s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .custom-scrollbar {
          scroll-behavior: smooth;
        }
      `}</style>
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
                    TEMÁTICAS
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mb-1">{data.length}</div>
                  <div className="text-sm text-slate-600">
                    {filters.mes && filters.anio ? "activas este mes" : 
                     filters.anio ? "activas este año" : 
                     "en el período"}
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {data.map((d, index) => (
                      <linearGradient key={d.id} id={`gradient-${d.id}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={getTematicaColor(d.name)} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={getTematicaColor(d.name)} stopOpacity={1} />
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
                      `${Number(v).toLocaleString()} fichas con esta temática (${pct(Number(v))}%)`,
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
            <div className="w-80 px-6 py-4 bg-white/60 backdrop-blur-sm border-l border-slate-200/60 flex flex-col">
              {/* Stats rápidas */}
              <div className="mb-4 flex-shrink-0">
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
                    <span className="text-xs text-slate-600">Fichas únicas</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {metadata?.total_unique_fichas?.toLocaleString() || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Total asignaciones</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Promedio por temática</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {data.length > 0 ? Math.round(total / data.length).toLocaleString() : "0"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Leyenda moderna con scroll mejorado */}
              <div className="flex-1 flex flex-col min-h-0">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Distribución ({data.length} temáticas)</h3>
                <div className="flex-1 overflow-hidden">
                  <div 
                    className="h-full overflow-y-auto pr-2 space-y-2 custom-scrollbar" 
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 transparent'
                    }}
                  >
                    {data.map((d, index) => (
                      <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/80 transition-colors group">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm ring-2 ring-white" 
                          style={{ background: getTematicaColor(d.name) }}
                        />
                        <div className="flex-1 min-w-0">
                          <div 
                            className="text-xs font-medium text-slate-900 truncate group-hover:text-clip" 
                            title={d.name}
                          >
                            {d.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {d.value.toLocaleString()} fichas • {pct(d.value)}%
                          </div>
                        </div>
                        <div className="text-xs font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          #{index + 1}
                        </div>
                      </div>
                    ))}
                    {data.length === 0 && (
                      <div className="text-xs text-slate-500 text-center py-8">
                        No hay temáticas para mostrar
                      </div>
                    )}
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
