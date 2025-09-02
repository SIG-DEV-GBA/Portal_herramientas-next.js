"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ApiList, Filters, Ficha } from "@/app/apps/gestor-fichas/lib/types";
import { apiJSON } from "@/app/apps/gestor-fichas/lib/api";
import { PAGE_SIZES, fmtDate, pickFichasFilters } from "@/app/apps/gestor-fichas/lib/utils";

export default function FichasTable({ filters, onChange }: { filters: Filters; onChange: (f: Partial<Filters>) => void }) {
  const take = Math.max(1, Number(filters.take || 20));
  const page = Math.max(1, Number(filters.page || 1));
  const [data, setData] = useState<ApiList>({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);

  const query = useMemo(
    () => ({
      ...pickFichasFilters(filters),
      take: String(take),
      skip: String((page - 1) * take),
      orderBy: "created_at:desc",
      withRelations: "true",
    }),
    [filters, take, page]
  );

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    apiJSON<ApiList>("/api/apps/gestor-fichas/fichas", query)
      .then((d) => !cancel && setData(d))
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [query]);

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / take));

  return (
    <div className="space-y-6">
      {/* Header moderno con stats */}
      <div className="bg-gradient-to-r from-white to-slate-50/50 rounded-xl border border-slate-200/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#D17C22] to-[#8E8D29]"></div>
              <span className="text-sm font-medium text-slate-700">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-[#D17C22] rounded-full animate-spin"></div>
                    Cargando datos...
                  </span>
                ) : (
                  `Mostrando ${data.items.length} de ${(data.total || 0).toLocaleString()} fichas`
                )}
              </span>
            </div>
            {!loading && (data.total || 0) > 0 && (
              <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                Página {page} de {totalPages}
              </div>
            )}
          </div>
          
          {/* Controles de paginación modernos */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Mostrar</label>
              <select
                value={take}
                onChange={(e) => onChange({ take: e.target.value, page: "1" })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700
                         focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-all duration-200
                         hover:border-slate-400 shadow-sm"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s} filas</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <ModernButton 
                onClick={() => onChange({ page: String(Math.max(1, page - 1)) })} 
                disabled={page <= 1}
                variant="nav"
              >
                ←
              </ModernButton>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={page}
                onChange={(e) => {
                  const v = Number(e.target.value || 1);
                  onChange({ page: String(Math.min(Math.max(1, v), totalPages)) });
                }}
                className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-center text-sm font-medium
                         focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-all duration-200
                         bg-white text-slate-700 hover:border-slate-400 shadow-sm"
              />
              <span className="text-sm text-slate-500 mx-1">de {totalPages}</span>
              <ModernButton 
                onClick={() => onChange({ page: String(Math.min(totalPages, page + 1)) })} 
                disabled={page >= totalPages}
                variant="nav"
              >
                →
              </ModernButton>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla simplificada */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-slate-50 to-slate-100/50 backdrop-blur-sm border-b border-slate-200/60">
              <tr>
                <ModernTh className="w-16">#</ModernTh>
                <ModernTh className="min-w-[350px]">Ficha</ModernTh>
                <ModernTh className="w-24">Ámbito</ModernTh>
                <ModernTh className="w-32">Número de ficha</ModernTh>
                <ModernTh className="w-48">Portales</ModernTh>
                <ModernTh className="w-32">Acciones</ModernTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <SkeletonRows />}
              {!loading && data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-slate-500 font-medium">No se encontraron fichas</div>
                      <div className="text-sm text-slate-400">Prueba ajustando los filtros de búsqueda</div>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                data.items.map((row, index) => (
                  <tr key={row.id} className="group transition-all duration-200 hover:bg-slate-50/80 cursor-pointer" onClick={() => setSelectedFicha(row)}>
                    <ModernTd>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D17C22] to-[#8E8D29] 
                                      flex items-center justify-center text-xs font-bold text-white shadow-sm">
                          {index + 1 + (page - 1) * take}
                        </div>
                      </div>
                    </ModernTd>
                    <ModernTd className="font-medium">
                      <div className="space-y-2">
                        <div className="font-semibold text-slate-900 group-hover:text-[#D17C22] transition-colors leading-tight">
                          {renderText(row.nombre_ficha, true)}
                        </div>
                        {row.frase_publicitaria && (
                          <div className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                            {row.frase_publicitaria}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {row.tramite_tipo && <TramiteBadge value={row.tramite_tipo} />}
                          {row.complejidad && <ComplejidadBadge value={row.complejidad} />}
                          {row.existe_frase && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-600">
                              💬 Frase
                            </span>
                          )}
                        </div>
                      </div>
                    </ModernTd>
                    <ModernTd><AmbitoBadge value={row.ambito_nivel as any} /></ModernTd>
                    <ModernTd>
                      <div className="space-y-1">
                        <div className="font-mono text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                          {row.id_ficha_subida}
                        </div>
                        <div className="text-xs text-slate-500">
                          Creada: {fmtDate(row.created_at, true)}
                        </div>
                        {row.vencimiento && (
                          <div className="text-xs text-amber-600 font-medium">
                            ⚠️ Vence: {fmtDate(row.vencimiento, true)}
                          </div>
                        )}
                      </div>
                    </ModernTd>
                    <ModernTd>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {row.ficha_portal?.slice(0, 3).map((fp) => (
                            <span key={fp.portales.id} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {fp.portales.nombre}
                            </span>
                          ))}
                          {(row.ficha_portal?.length || 0) > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                              +{(row.ficha_portal?.length || 0) - 3} más
                            </span>
                          )}
                        </div>
                        {(row.ficha_tematica?.length || 0) > 0 && (
                          <div className="text-xs text-slate-500">
                            🏷️ {row.ficha_tematica?.length} temática{(row.ficha_tematica?.length || 0) > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </ModernTd>
                    <ModernTd>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFicha(row);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-[#D17C22] to-[#8E8D29] text-white
                                 hover:from-[#B8641A] hover:to-[#7A741F] focus:ring-2 focus:ring-[#D17C22]/30 focus:ring-offset-2 
                                 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Detalles
                      </button>
                    </ModernTd>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal con pestañas */}
      {selectedFicha && <FichaDetailsModal ficha={selectedFicha} onClose={() => setSelectedFicha(null)} />}
    </div>
  );
}

function FichaDetailsModal({ ficha, onClose }: { ficha: Ficha; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('general');

  const buildCompleteUrl = (ficha: Ficha) => {
    // Usar la base_url de la base de datos o fallback
    const baseUrl = ficha.enlaces_base?.base_url || "https://tu-dominio/fichas";
    const segment = ficha.enlace_seg_override || ficha.nombre_slug || ficha.id;
    
    // Asegurar que la baseUrl no termine con / y que el segment no empiece con /
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const cleanSegment = String(segment).replace(/^\//, '');
    
    return `${cleanBaseUrl}/${cleanSegment}`;
  };

  const tabs = [
    { id: 'general', label: '📋 General', icon: '📋' },
    { id: 'ubicacion', label: '📍 Ubicación', icon: '📍' },
    { id: 'gestion', label: '👥 Gestión', icon: '👥' },
    { id: 'fechas', label: '📅 Fechas', icon: '📅' },
    { id: 'contenido', label: '📄 Contenido', icon: '📄' },
    { id: 'portales', label: '🌐 Portales', icon: '🌐' },
    { id: 'tematicas', label: '🏷️ Temáticas', icon: '🏷️' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header fijo del modal */}
        <div className="bg-gradient-to-r from-white via-slate-50/50 to-white border-b border-slate-200/60 p-6 flex-shrink-0">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              {/* Badges y metadata */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D17C22] to-[#8E8D29] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    #{ficha.id}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-600">ID Subida: {ficha.id_ficha_subida}</div>
                    {ficha.nombre_slug && <div className="text-xs text-slate-500">Slug: {ficha.nombre_slug}</div>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <AmbitoBadge value={ficha.ambito_nivel} />
                  {ficha.tramite_tipo && <TramiteBadge value={ficha.tramite_tipo} />}
                  {ficha.complejidad && <ComplejidadBadge value={ficha.complejidad} />}
                </div>
              </div>

              {/* Título principal */}
              <h1 className="text-xl font-bold text-slate-900 leading-tight mb-3 pr-4">
                {ficha.nombre_ficha}
              </h1>
              
              {/* Enlaces */}
              <div className="flex items-center gap-4 text-sm">
                <a 
                  href={buildCompleteUrl(ficha)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D17C22] text-white hover:bg-[#B8641A] transition-colors font-medium shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver en web
                </a>
                
                <div className="text-xs text-slate-500">
                  Creada: {fmtDate(ficha.created_at)} • Actualizada: {fmtDate(ficha.updated_at)}
                </div>
              </div>
            </div>
            
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0 group"
            >
              <svg className="w-6 h-6 text-slate-600 group-hover:text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Pestañas */}
        <div className="border-b border-slate-200 bg-slate-50/50 flex-shrink-0">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#D17C22] text-[#D17C22] bg-white/80'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido de las pestañas */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard title="Información básica">
                  <InfoRow label="Nombre" value={ficha.nombre_ficha} />
                  <InfoRow label="Tipo de Trámite" value={ficha.tramite_tipo} />
                  <InfoRow label="Complejidad" value={ficha.complejidad} />
                  <InfoRow label="Tiene Frase" value={ficha.existe_frase ? "Sí" : "No"} />
                </InfoCard>
                
                <InfoCard title="Destacables">
                  <InfoRow label="Destaque Principal" value={ficha.destaque_principal || "No"} />
                  <InfoRow label="Destaque Secundario" value={ficha.destaque_secundario || "No"} />
                </InfoCard>
              </div>
              
              {ficha.frase_publicitaria && (
                <InfoCard title="Frase Publicitaria">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-slate-700 italic">"{ficha.frase_publicitaria}"</p>
                  </div>
                </InfoCard>
              )}
            </div>
          )}

          {activeTab === 'ubicacion' && (
            <div className="space-y-6">
              <InfoCard title="Información territorial">
                <InfoRow label="Ámbito Territorial" value={ficha.ambito_nivel} />
                <InfoRow label="Comunidad Autónoma" value={ficha.ccaa?.nombre} />
                <InfoRow label="Provincia" value={ficha.provincias?.nombre} />
                <InfoRow label="Ámbito Municipal" value={ficha.ambito_municipal} />
              </InfoCard>
            </div>
          )}

          {activeTab === 'gestion' && (
            <div className="space-y-6">
              <InfoCard title="Trabajadores">
                <InfoRow label="Redactado por" value={ficha.trabajadores?.nombre} />
                <InfoRow label="Subido por" value={ficha.trabajadores_trabajador_subida_idTotrabajadores?.nombre} />
              </InfoCard>
            </div>
          )}

          {activeTab === 'fechas' && (
            <div className="space-y-6">
              <InfoCard title="Timeline">
                <InfoRow label="Fecha de Redacción" value={ficha.fecha_redaccion ? fmtDate(ficha.fecha_redaccion, true) : "No definida"} />
                <InfoRow label="Fecha de Subida Web" value={ficha.fecha_subida_web ? fmtDate(ficha.fecha_subida_web, true) : "No definida"} />
                <InfoRow label="Vencimiento" value={ficha.vencimiento ? fmtDate(ficha.vencimiento, true) : "Sin vencimiento"} />
                <InfoRow label="Creada" value={fmtDate(ficha.created_at)} />
                <InfoRow label="Actualizada" value={fmtDate(ficha.updated_at)} />
              </InfoCard>
            </div>
          )}

          {activeTab === 'contenido' && (
            <div className="space-y-6">
              <InfoCard title="Enlaces">
                <InfoRow label="ID Base de Enlace" value={ficha.enlace_base_id?.toString()} />
                <InfoRow label="Override de Enlace" value={ficha.enlace_seg_override || "No definido"} />
                <InfoRow label="Slug" value={ficha.nombre_slug || "No definido"} />
                <InfoRow label="URL Completa" value={buildCompleteUrl(ficha)} />
              </InfoCard>
              
              {ficha.texto_divulgacion && (
                <InfoCard title="Texto de Divulgación">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 max-h-64 overflow-y-auto">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                      {ficha.texto_divulgacion}
                    </p>
                  </div>
                </InfoCard>
              )}
            </div>
          )}

          {activeTab === 'portales' && (
            <div className="space-y-6">
              {ficha.ficha_portal && ficha.ficha_portal.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ficha.ficha_portal.map((fp) => (
                    <div key={fp.portales.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-blue-900 truncate">{fp.portales.nombre}</div>
                          <div className="text-sm text-blue-600">@{fp.portales.slug}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No hay portales asociados a esta ficha
                </div>
              )}
            </div>
          )}

          {activeTab === 'tematicas' && (
            <div className="space-y-6">
              {ficha.ficha_tematica && ficha.ficha_tematica.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ficha.ficha_tematica.map((ft) => (
                    <div key={ft.tematicas.id} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-green-900 truncate">{ft.tematicas.nombre}</div>
                          <div className="text-sm text-green-600">#{ft.tematicas.slug}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No hay temáticas asociadas a esta ficha
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  
  return (
    <div className="flex justify-between items-start gap-4">
      <dt className="text-sm font-medium text-slate-500 flex-shrink-0">{label}:</dt>
      <dd className="text-sm text-slate-900 font-medium text-right">{value}</dd>
    </div>
  );
}

function ModernTh({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider
                   bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200/60
                   first:rounded-tl-2xl last:rounded-tr-2xl ${className}`}>
      {children}
    </th>
  );
}

function ModernTd({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const isEmpty =
    children === undefined ||
    children === null ||
    children === "—" ||
    (typeof children === "string" && children.trim() === "");
  return (
    <td className={`px-6 py-4 align-middle transition-all duration-200 ${isEmpty ? "text-slate-300 italic" : "text-slate-700"} ${className}`}>
      {isEmpty ? (
        <span className="flex items-center gap-2 text-slate-300">
          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
          —
        </span>
      ) : children}
    </td>
  );
}

function ModernButton({ 
  children, 
  disabled, 
  onClick, 
  variant = "default" 
}: { 
  children: React.ReactNode; 
  disabled?: boolean; 
  onClick?: () => void;
  variant?: "default" | "nav";
}) {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2";
  
  if (variant === "nav") {
    return (
      <button 
        onClick={onClick} 
        disabled={disabled} 
        className={`${baseClasses} w-8 h-8 rounded-lg border border-slate-300 bg-white text-slate-600 shadow-sm
                   hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700 hover:shadow-md
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-300
                   disabled:hover:text-slate-600 disabled:hover:shadow-sm`}
      >
        {children}
      </button>
    );
  }
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseClasses} px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm shadow-sm
                 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 hover:shadow-md
                 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-300
                 disabled:hover:text-slate-700 disabled:hover:shadow-sm`}
    >
      {children}
    </button>
  );
}

function AmbitoBadge({ value }: { value: Ficha["ambito_nivel"] }) {
  const styles: Record<Ficha["ambito_nivel"], string> = {
    UE: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
    ESTADO: "bg-blue-50 text-blue-700 border border-blue-200/60",
    CCAA: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    PROVINCIA: "bg-amber-50 text-amber-800 border border-amber-200/60",
  };
  const icons: Record<Ficha["ambito_nivel"], string> = {
    UE: "🇪🇺",
    ESTADO: "🏛️",
    CCAA: "🌐",
    PROVINCIA: "📍",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${styles[value]}`}>
      <span className="text-xs">{icons[value]}</span>
      {value}
    </span>
  );
}

function TramiteBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    si: "bg-green-50 text-green-700 border border-green-200/60",
    no: "bg-red-50 text-red-700 border border-red-200/60",
    directo: "bg-blue-50 text-blue-700 border border-blue-200/60",
  };
  const icons: Record<string, string> = {
    si: "✅",
    no: "❌",
    directo: "🔗",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${styles[value]}`}>
      <span className="text-xs">{icons[value]}</span>
      {value.toUpperCase()}
    </span>
  );
}

function ComplejidadBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    baja: "bg-green-50 text-green-700 border border-green-200/60",
    media: "bg-yellow-50 text-yellow-700 border border-yellow-200/60",
    alta: "bg-red-50 text-red-700 border border-red-200/60",
  };
  const icons: Record<string, string> = {
    baja: "🟢",
    media: "🟡",
    alta: "🔴",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${styles[value]}`}>
      <span className="text-xs">{icons[value]}</span>
      {value.toUpperCase()}
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="group animate-pulse border-b border-slate-100 last:border-b-0">
          {Array.from({ length: 6 }).map((__, j) => (
            <ModernTd key={j}>
              <div className={`rounded-lg bg-gradient-to-r from-slate-200 to-slate-100 ${
                j === 0 ? "h-8 w-8 rounded-lg" : 
                j === 1 ? "h-16 w-full" :
                j === 2 ? "h-6 w-16" :
                j === 3 ? "h-8 w-24" :
                j === 4 ? "h-12 w-32" : "h-10 w-24"
              }`} style={{
                animationDelay: `${(i * 0.1) + (j * 0.05)}s`
              }} />
            </ModernTd>
          ))}
        </tr>
      ))}
    </>
  );
}

function renderText(v?: string | null, strong = false) {
  if (!v || v === "—") {
    return (
      <span className="flex items-center gap-2 text-slate-300 italic">
        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
        —
      </span>
    );
  }
  return strong ? (
    <span className="font-medium text-slate-900">{v}</span>
  ) : (
    <span className="text-slate-700">{v}</span>
  );
}