"use client";
import React, { useState } from 'react';
import { NotificationModal, ConfirmModal } from '@/components/ui/Modal';
import { useNotification } from '@/hooks/useNotification';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { FullPageSkeleton } from '@/components/ui/LoadingSkeletons';
import { useLookupData } from '@/hooks/useApiData';

interface Portal {
  id: number;
  slug: string;
  nombre: string;
}

export function PortalesManager() {
  const { canAccess, loading: userLoading } = useCurrentUser();
  const { data: portales = [], error, isLoading, mutate } = useLookupData<Portal[]>('portales', !userLoading && canAccess('portales', 'read'));
  const [editingPortal, setEditingPortal] = useState<Portal | null>(null);
  const [newPortal, setNewPortal] = useState({ nombre: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const { notification, confirm, showSuccess, showError, showConfirm, closeNotification, closeConfirm } = useNotification();

  // Mostrar skeleton mientras carga el usuario o los datos
  if (userLoading || (isLoading && canAccess('portales', 'read'))) {
    return <FullPageSkeleton />;
  }

  // Verificar permisos después de cargar
  if (!canAccess('portales', 'read')) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes permisos para acceder a la gestión de portales.</p>
      </div>
    );
  }

  const handleAdd = async () => {
    try {
      const response = await fetch('/api/portales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPortal),
      });
      if (response.ok) {
        setNewPortal({ nombre: '' });
        setShowAddForm(false);
        mutate(); // Revalidar cache
        showSuccess('Portal creado', `El portal "${newPortal.nombre}" ha sido creado exitosamente.`);
      } else {
        const errorData = await response.json();
        showError('Error al crear portal', errorData.error || 'Ha ocurrido un error inesperado.');
      }
    } catch (error) {
      console.error('Error adding portal:', error);
      showError('Error de conexión', 'No se pudo conectar con el servidor.');
    }
  };

  const handleEdit = async (portal: Portal) => {
    try {
      const response = await fetch(`/api/portales/${portal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: portal.nombre }),
      });
      if (response.ok) {
        setEditingPortal(null);
        mutate(); // Revalidar cache
        showSuccess('Portal actualizado', `El portal "${portal.nombre}" ha sido actualizado exitosamente.`);
      } else {
        const errorData = await response.json();
        showError('Error al actualizar portal', errorData.error || 'Ha ocurrido un error inesperado.');
      }
    } catch (error) {
      console.error('Error updating portal:', error);
      showError('Error de conexión', 'No se pudo conectar con el servidor.');
    }
  };

  const handleDelete = async (id: number, nombre: string) => {
    showConfirm(
      'Eliminar portal',
      `¿Estás seguro de que quieres eliminar el portal "${nombre}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          const response = await fetch(`/api/portales/${id}`, { method: 'DELETE' });
          if (response.ok) {
            mutate(); // Revalidar cache
            showSuccess('Portal eliminado', `El portal "${nombre}" ha sido eliminado exitosamente.`);
          } else {
            const errorData = await response.json();
            showError('Error al eliminar portal', errorData.error || 'Ha ocurrido un error inesperado.');
          }
        } catch (error) {
          console.error('Error deleting portal:', error);
          showError('Error de conexión', 'No se pudo conectar con el servidor.');
        }
      },
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-[#D17C22] rounded-full animate-spin"></div>
        <span className="ml-2 text-slate-600">Cargando portales...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de Portales</h2>
          <p className="text-slate-600 mt-1">Administra los portales del sistema</p>
        </div>
        {canAccess('portales', 'create') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D17C22] text-white hover:bg-[#B8641A] transition-colors font-medium shadow-sm"
          >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir Portal
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Añadir Nuevo Portal</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
              <input
                type="text"
                value={newPortal.nombre}
                onChange={(e) => setNewPortal({ ...newPortal, nombre: e.target.value })}
                placeholder="ej: Portal de Mayores"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]"
              />
              <p className="text-sm text-slate-500 mt-1">El slug se generará automáticamente</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleAdd}
              disabled={!newPortal.nombre}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D17C22] text-white hover:bg-[#B8641A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Guardar
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Portales List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {portales.map((portal) => (
                <tr key={portal.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-900">{portal.id}</td>
                  <td className="px-6 py-4">
                    {editingPortal?.id === portal.id ? (
                      <input
                        type="text"
                        value={editingPortal.nombre}
                        onChange={(e) => setEditingPortal({ ...editingPortal, nombre: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]"
                      />
                    ) : (
                      <span className="text-slate-900 font-medium">{portal.nombre}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {editingPortal?.id === portal.id ? (
                        <>
                          <button
                            onClick={() => handleEdit(editingPortal)}
                            className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingPortal(null)}
                            className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          {canAccess('portales', 'update') && (
                            <button
                              onClick={() => setEditingPortal(portal)}
                              className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              Editar
                            </button>
                          )}
                          {canAccess('portales', 'delete') && (
                            <button
                              onClick={() => handleDelete(portal.id, portal.nombre)}
                              className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            >
                              Eliminar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {portales.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
              🌐
            </div>
            <p className="text-slate-500 font-medium">No hay portales registrados</p>
            <p className="text-slate-400 text-sm mt-1">Añade el primer portal para empezar</p>
          </div>
        )}
      </div>

      {/* Modales */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
      
      <ConfirmModal
        isOpen={confirm.isOpen}
        onClose={closeConfirm}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        type={confirm.type}
      />
    </div>
  );
}