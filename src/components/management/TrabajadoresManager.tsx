"use client";

import { useState } from "react";
import useSWR from "swr";

interface Trabajador {
  id: number;
  nombre: string;
  slug: string;
  activo: boolean;
}

interface TrabajadorEditModalProps {
  trabajador: Trabajador | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (trabajadorId: number, nombre: string, activo: boolean) => void;
}

const TrabajadorEditModal = ({ trabajador, isOpen, onClose, onSave }: TrabajadorEditModalProps) => {
  const [nombre, setNombre] = useState(trabajador?.nombre || '');
  const [activo, setActivo] = useState(trabajador?.activo ?? true);

  const handleSave = () => {
    if (trabajador && nombre.trim()) {
      onSave(trabajador.id, nombre.trim(), activo);
    }
  };

  if (!isOpen || !trabajador) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Editar Trabajador
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Trabajador activo
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!nombre.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-md transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

interface NewTrabajadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (nombre: string, activo: boolean) => void;
}

const NewTrabajadorModal = ({ isOpen, onClose, onCreate }: NewTrabajadorModalProps) => {
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);

  const handleCreate = () => {
    if (nombre.trim()) {
      onCreate(nombre.trim(), activo);
      setNombre('');
      setActivo(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Agregar Nuevo Trabajador
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del trabajador"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Trabajador activo
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!nombre.trim()}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-md transition-colors"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  );
};

export const TrabajadoresManager = () => {
  const [editingTrabajador, setEditingTrabajador] = useState<Trabajador | null>(null);
  const [isNewTrabajadorModalOpen, setIsNewTrabajadorModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [soloActivos, setSoloActivos] = useState(false);

  const pageSize = 20;

  const fetcher = (url: string) => 
    fetch(url, { credentials: 'include' }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    });

  const { data: trabajadoresData, mutate, isLoading, error } = useSWR<{
    trabajadores: Trabajador[];
    total: number;
    take: number;
    skip: number;
  }>(
    `/api/admin/trabajadores?take=${pageSize}&skip=${(currentPage - 1) * pageSize}&solo_activos=${soloActivos}`,
    fetcher
  );

  const handleEdit = async (trabajadorId: number, nombre: string, activo: boolean) => {
    try {
      const response = await fetch(`/api/admin/trabajadores/${trabajadorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre, activo })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return;
      }

      setEditingTrabajador(null);
      mutate();
      alert('Trabajador actualizado correctamente');
    } catch (error) {
      alert('Error al actualizar el trabajador');
    }
  };

  const handleDelete = async (trabajadorId: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar al trabajador ${nombre}?\n\nSi tiene fichas asignadas, no se podrá eliminar y deberás desactivarlo en su lugar.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/trabajadores/${trabajadorId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return;
      }

      mutate();
      alert('Trabajador eliminado correctamente');
    } catch (error) {
      alert('Error al eliminar el trabajador');
    }
  };

  const handleCreate = async (nombre: string, activo: boolean) => {
    try {
      const response = await fetch('/api/admin/trabajadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre, activo })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return;
      }

      setIsNewTrabajadorModalOpen(false);
      mutate();
      alert('Trabajador creado correctamente');
    } catch (error) {
      alert('Error al crear el trabajador');
    }
  };

  const getStatusBadge = (activo: boolean) => {
    return activo ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        ✅ Activo
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        ❌ Inactivo
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
        Error cargando trabajadores. Verifica que tengas permisos de administrador.
      </div>
    );
  }

  const trabajadores = trabajadoresData?.trabajadores || [];
  const total = trabajadoresData?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Trabajadores para Asignación de Fichas ({total})
          </h2>
          <p className="text-sm text-gray-600">
            Administra trabajadores que aparecen en las fichas (sin relación con acceso al sistema)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={soloActivos}
              onChange={(e) => {
                setSoloActivos(e.target.checked);
                setCurrentPage(1);
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Solo activos</span>
          </label>
          <button
            onClick={() => setIsNewTrabajadorModalOpen(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            ➕ Agregar Trabajador
          </button>
        </div>
      </div>

      <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden mb-6">
        {trabajadores.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay trabajadores {soloActivos ? 'activos' : 'registrados'}
          </div>
        ) : (
          trabajadores.map((trabajador) => (
            <div key={trabajador.id} className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium text-gray-900">{trabajador.nombre}</p>
                  <p className="text-sm text-gray-500">Slug: {trabajador.slug}</p>
                </div>
                {getStatusBadge(trabajador.activo)}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingTrabajador(trabajador)}
                  className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(trabajador.id, trabajador.nombre)}
                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Página {currentPage} de {totalPages} ({total} total)
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      <TrabajadorEditModal
        trabajador={editingTrabajador}
        isOpen={!!editingTrabajador}
        onClose={() => setEditingTrabajador(null)}
        onSave={handleEdit}
      />

      <NewTrabajadorModal
        isOpen={isNewTrabajadorModalOpen}
        onClose={() => setIsNewTrabajadorModalOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
};