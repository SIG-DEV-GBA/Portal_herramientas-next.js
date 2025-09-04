"use client";

import React, { useEffect, useMemo, useState } from "react";
import { 
  Eye, 
  Calendar, 
  User, 
  Globe, 
  Building, 
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Trash2
} from "lucide-react";

// Types
import { ApiList, Filters, Ficha } from "@/app/apps/gestor-fichas/lib/types";
import { apiJSON } from "@/app/apps/gestor-fichas/lib/api";
import { PAGE_SIZES, fmtDate, pickFichasFilters } from "@/app/apps/gestor-fichas/lib/utils";

// Components
import FichaDetailModal from "./FichaDetailModal";
import { ConfirmModal, NotificationModal } from "@/components/ui/Modal";

interface Props {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onRecordCountChange?: (count: number) => void;
}

export default function FichasTableModern({ filters, onChange, onRecordCountChange }: Props) {
  const take = Math.max(1, Number(filters.take || 20));
  const page = Math.max(1, Number(filters.page || 1));
  const [data, setData] = useState<ApiList>({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'nombre_ficha' | 'vencimiento'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fichaToDelete, setFichaToDelete] = useState<Ficha | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deletedFichaName, setDeletedFichaName] = useState("");

  const query = useMemo(
    () => ({
      ...pickFichasFilters(filters),
      take: String(take),
      skip: String((page - 1) * take),
      orderBy: `${sortField}:${sortOrder}`,
      withRelations: "true",
      withCount: "true"
    }),
    [filters, take, page, sortField, sortOrder]
  );

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    apiJSON<ApiList>("/api/apps/gestor-fichas/fichas", query)
      .then((d) => {
        if (!cancel) {
          setData(d);
          onRecordCountChange?.(d.total);
        }
      })
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [query]);

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / take));
  const startItem = (page - 1) * take + 1;
  const endItem = Math.min(page * take, data.total || 0);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleDeleteFicha = async () => {
    if (!fichaToDelete) return;

    const fichaName = fichaToDelete.nombre_ficha;
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/apps/gestor-fichas/fichas/${fichaToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = 'Error al eliminar la ficha';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Error del servidor (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      // Mostrar notificación de éxito
      setDeletedFichaName(fichaName);
      setShowDeleteSuccess(true);

      // Recargar datos después de eliminar
      const newData = await apiJSON<ApiList>("/api/apps/gestor-fichas/fichas", query);
      setData(newData);
      onRecordCountChange?.(newData.total);
      
      // Si no quedan elementos en la página actual y no es la primera página, ir a la anterior
      if (newData.items.length === 0 && page > 1) {
        onChange({ page: String(page - 1) });
      }

    } catch (error) {
      console.error('Error deleting ficha:', error);
      alert(error instanceof Error ? error.message : 'Error desconocido al eliminar la ficha');
    } finally {
      setIsDeleting(false);
      setFichaToDelete(null);
    }
  };

  const getAmbitoStyle = (ambito: string) => {
    const styles = {
      'UE': 'bg-blue-50 text-blue-700 border border-blue-200',
      'ESTADO': 'bg-orange-50 text-[#D17C22] border border-[#D17C22]/30',
      'CCAA': 'bg-green-50 text-[#8E8D29] border border-[#8E8D29]/30',
      'PROVINCIA': 'bg-amber-50 text-amber-700 border border-amber-200'
    };
    return styles[ambito as keyof typeof styles] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  const getTramiteStyle = (tramite: string) => {
    const styles = {
      'si': 'bg-[#8E8D29]/10 text-[#8E8D29] border border-[#8E8D29]/30',
      'no': 'bg-[#D17C22]/10 text-[#D17C22] border border-[#D17C22]/30',
      'directo': 'bg-indigo-50 text-indigo-700 border border-indigo-200'
    };
    return styles[tramite as keyof typeof styles] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  const getComplejidadStyle = (complejidad: string) => {
    const styles = {
      'baja': 'bg-[#8E8D29]/10 text-[#8E8D29] border border-[#8E8D29]/30',
      'media': 'bg-amber-50 text-amber-700 border border-amber-200',
      'alta': 'bg-[#D17C22]/10 text-[#D17C22] border border-[#D17C22]/30'
    };
    return styles[complejidad as keyof typeof styles] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header con estadísticas y controles */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#D17C22] rounded-xl shadow-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Fichas</h3>
                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-[#D17C22] rounded-full animate-spin"></div>
                      Cargando...
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {data.total ? (
                        <>
                          Mostrando {startItem.toLocaleString()} - {endItem.toLocaleString()} de {data.total.toLocaleString()} fichas
                        </>
                      ) : (
                        'No se encontraron fichas'
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Controles de paginación */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:block">Mostrar:</span>
                <select
                  value={take}
                  onChange={(e) => onChange({ take: e.target.value, page: "1" })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium
                           focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                           hover:border-[#8E8D29] transition-all duration-200 bg-white"
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              {/* Paginación superior - solo en desktop */}
              {!loading && data.total > 0 && (
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Página {page} de {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onChange({ page: String(Math.max(1, page - 1)) })}
                      disabled={page <= 1}
                      className={`p-1.5 rounded-md transition-all duration-200 ${
                        page <= 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onChange({ page: String(Math.min(totalPages, page + 1)) })}
                      disabled={page >= totalPages}
                      className={`p-1.5 rounded-md transition-all duration-200 ${
                        page >= totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('nombre_ficha')}
                >
                  <div className="flex items-center gap-2">
                    <span>Nombre</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID / Ámbito
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado / Complejidad
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('vencimiento')}
                >
                  <div className="flex items-center gap-2">
                    <span>Vencimiento</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-2">
                    <span>Creada</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-4 border-gray-300 border-t-[#D17C22] rounded-full animate-spin"></div>
                      <p className="text-gray-500">Cargando fichas...</p>
                    </div>
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-gray-100 rounded-full">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">No hay fichas</p>
                        <p className="text-gray-500">No se encontraron fichas que coincidan con los filtros aplicados.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((ficha: any) => (
                  <tr key={ficha.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-gray-900 line-clamp-2">
                          {ficha.nombre_ficha}
                        </div>
                        {ficha.frase_publicitaria && (
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {ficha.frase_publicitaria}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          #{ficha.id_ficha_subida}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getAmbitoStyle(ficha.ambito_nivel)}`}>
                          {ficha.ambito_nivel === 'UE' && '🇪🇺'}
                          {ficha.ambito_nivel === 'ESTADO' && '🏛️'}
                          {ficha.ambito_nivel === 'CCAA' && '🌐'}
                          {ficha.ambito_nivel === 'PROVINCIA' && '📍'}
                          <span className="ml-1">{ficha.ambito_nivel}</span>
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {ficha.tramite_tipo && (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTramiteStyle(ficha.tramite_tipo)}`}>
                            {ficha.tramite_tipo === 'si' && '🌐 Online'}
                            {ficha.tramite_tipo === 'no' && '🏢 Presencial'}
                            {ficha.tramite_tipo === 'directo' && '⚡ Mixto'}
                          </span>
                        )}
                        {ficha.complejidad && (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getComplejidadStyle(ficha.complejidad)}`}>
                            {ficha.complejidad === 'baja' && '🟢'}
                            {ficha.complejidad === 'media' && '🟡'}
                            {ficha.complejidad === 'alta' && '🔴'}
                            <span className="ml-1 capitalize">{ficha.complejidad}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {ficha.vencimiento ? (
                        <div className={`flex items-center gap-2 ${new Date(ficha.vencimiento) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                          <Calendar className="w-4 h-4" />
                          {fmtDate(ficha.vencimiento, true)}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin fecha</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {fmtDate(ficha.created_at, true)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedFicha(ficha)}
                          className="p-2 text-[#D17C22] hover:text-[#8E8D29] hover:bg-[#D17C22]/10 rounded-lg transition-all duration-200"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setFichaToDelete(ficha)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Eliminar ficha"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación moderna */}
        {!loading && data.total > 0 && (
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-700">
                  Página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onChange({ page: "1" })}
                  disabled={page <= 1}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    page <= 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  Primera
                </button>
                
                <button
                  onClick={() => onChange({ page: String(Math.max(1, page - 1)) })}
                  disabled={page <= 1}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    page <= 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Páginas numeradas */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => onChange({ page: String(pageNum) })}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          page === pageNum
                            ? 'bg-[#D17C22] text-white shadow-lg'
                            : 'text-gray-700 hover:bg-[#D17C22]/10 hover:text-gray-900'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => onChange({ page: String(Math.min(totalPages, page + 1)) })}
                  disabled={page >= totalPages}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    page >= totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onChange({ page: String(totalPages) })}
                  disabled={page >= totalPages}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    page >= totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  Última
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {selectedFicha && (
        <FichaDetailModal
          ficha={selectedFicha}
          isOpen={!!selectedFicha}
          onClose={() => setSelectedFicha(null)}
        />
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={!!fichaToDelete}
        onClose={() => setFichaToDelete(null)}
        onConfirm={handleDeleteFicha}
        title="¿Eliminar ficha?"
        message={`¿Estás seguro de que deseas eliminar la ficha "${fichaToDelete?.nombre_ficha}"? Esta acción no se puede deshacer.`}
        confirmText={isDeleting ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        type="danger"
      />

      {/* Modal de éxito al eliminar */}
      <NotificationModal
        isOpen={showDeleteSuccess}
        onClose={() => setShowDeleteSuccess(false)}
        type="success"
        title="¡Ficha eliminada!"
        message={`La ficha "${deletedFichaName}" se ha eliminado correctamente del sistema.`}
        autoClose={3000}
      />
    </>
  );
}