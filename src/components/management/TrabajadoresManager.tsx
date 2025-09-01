"use client";
import React, { useState } from 'react';
import { NotificationModal, ConfirmModal } from '@/components/ui/Modal';
import { useNotification } from '@/hooks/useNotification';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { FullPageSkeleton } from '@/components/ui/LoadingSkeletons';
import { useLookupData } from '@/hooks/useApiData';

interface Trabajador {
  id: number;
  slug: string;
  nombre: string;
  activo: boolean;
}

export function TrabajadoresManager() {
  const { canAccess, loading: userLoading } = useCurrentUser();
  const { data: trabajadores = [], error, isLoading, mutate } = useLookupData<Trabajador[]>('trabajadores?solo_activos=false', !userLoading && canAccess('trabajadores', 'read'));
  const [editingTrabajador, setEditingTrabajador] = useState<Trabajador | null>(null);
  const [newTrabajador, setNewTrabajador] = useState({ nombre: '', activo: true });
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const { notification, confirm, showSuccess, showError, showConfirm, closeNotification, closeConfirm } = useNotification();


  // Mostrar skeleton mientras carga el usuario o los datos
  if (userLoading || (isLoading && canAccess('trabajadores', 'read'))) {
    return <FullPageSkeleton />;
  }

  // Verificar permisos después de cargar
  if (!canAccess('trabajadores', 'read')) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes permisos para acceder a la gestión de trabajadores.</p>
      </div>
    );
  }

  const handleAdd = async () => {
    try {
      const response = await fetch('/api/trabajadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrabajador),
      });
      if (response.ok) {
        setNewTrabajador({ nombre: '', activo: true });
        setShowAddForm(false);
        mutate(); // Revalidar cache
        showSuccess('Trabajador creado', `El trabajador "${newTrabajador.nombre}" ha sido creado exitosamente.`);
      } else {
        const errorData = await response.json();
        showError('Error al crear trabajador', errorData.error || 'Ha ocurrido un error inesperado.');
      }
    } catch (error) {
      console.error('Error adding trabajador:', error);
      showError('Error de conexión', 'No se pudo conectar con el servidor.');
    }
  };

  const handleEdit = async (trabajador: Trabajador) => {
    try {
      const response = await fetch(`/api/trabajadores/${trabajador.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: trabajador.nombre, 
          activo: trabajador.activo 
        }),
      });
      if (response.ok) {
        setEditingTrabajador(null);
        mutate(); // Revalidar cache
        showSuccess('Trabajador actualizado', `El trabajador "${trabajador.nombre}" ha sido actualizado exitosamente.`);
      } else {
        const errorData = await response.json();
        showError('Error al actualizar trabajador', errorData.error || 'Ha ocurrido un error inesperado.');
      }
    } catch (error) {
      console.error('Error updating trabajador:', error);
      showError('Error de conexión', 'No se pudo conectar con el servidor.');
    }
  };

  const handleDelete = async (id: number, nombre: string) => {
    showConfirm(
      'Eliminar trabajador',
      `¿Estás seguro de que quieres eliminar el trabajador "${nombre}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          const response = await fetch(`/api/trabajadores/${id}`, { method: 'DELETE' });
          if (response.ok) {
            mutate(); // Revalidar cache
            showSuccess('Trabajador eliminado', `El trabajador "${nombre}" ha sido eliminado exitosamente.`);
          } else {
            const errorData = await response.json();
            showError('Error al eliminar trabajador', errorData.error || 'Ha ocurrido un error inesperado.');
          }
        } catch (error) {
          console.error('Error deleting trabajador:', error);
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

  const toggleActivo = async (trabajador: Trabajador) => {
    const nuevoEstado = !trabajador.activo;
    const accion = nuevoEstado ? 'activado' : 'desactivado';
    
    try {
      const response = await fetch(`/api/trabajadores/${trabajador.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: trabajador.nombre, 
          activo: nuevoEstado 
        }),
      });
      if (response.ok) {
        mutate(); // Revalidar cache
        showSuccess('Estado actualizado', `El trabajador "${trabajador.nombre}" ha sido ${accion} exitosamente.`);
      } else {
        const errorData = await response.json();
        showError('Error al cambiar estado', errorData.error || 'Ha ocurrido un error inesperado.');
      }
    } catch (error) {
      console.error('Error toggling trabajador status:', error);
      showError('Error de conexión', 'No se pudo conectar con el servidor.');
    }
  };

  // Filtrar trabajadores según el filtro seleccionado
  const trabajadoresFiltrados = trabajadores.filter(trabajador => {
    switch (filter) {
      case 'activos':
        return trabajador.activo;
      case 'inactivos':
        return !trabajador.activo;
      case 'todos':
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-[#D17C22] rounded-full animate-spin"></div>
        <span className="ml-2 text-slate-600">Cargando trabajadores...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de Trabajadores</h2>
          <p className="text-slate-600 mt-1">Administra los trabajadores del sistema</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D17C22] text-white hover:bg-[#B8641A] transition-colors font-medium shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir Trabajador
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-semibold">✓</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-800">
                {trabajadores.filter(t => t.activo).length}
              </div>
              <div className="text-sm text-green-600">Activos</div>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <span className="text-red-600 font-semibold">✗</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-800">
                {trabajadores.filter(t => !t.activo).length}
              </div>
              <div className="text-sm text-red-600">Inactivos</div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold">#</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-800">{trabajadores.length}</div>
              <div className="text-sm text-blue-600">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Filtrar trabajadores</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('todos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'todos'
                  ? 'bg-[#D17C22] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos ({trabajadores.length})
            </button>
            <button
              onClick={() => setFilter('activos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'activos'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Activos ({trabajadores.filter(t => t.activo).length})
            </button>
            <button
              onClick={() => setFilter('inactivos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'inactivos'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              Inactivos ({trabajadores.filter(t => !t.activo).length})
            </button>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Añadir Nuevo Trabajador</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
              <input
                type="text"
                value={newTrabajador.nombre}
                onChange={(e) => setNewTrabajador({ ...newTrabajador, nombre: e.target.value })}
                placeholder="ej: Juan García López"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]"
              />
              <p className="text-sm text-slate-500 mt-1">El slug se generará automáticamente</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Estado</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNewTrabajador({ ...newTrabajador, activo: !newTrabajador.activo })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D17C22] focus:ring-offset-2 ${
                    newTrabajador.activo ? 'bg-green-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      newTrabajador.activo ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${
                  newTrabajador.activo ? 'text-green-700' : 'text-slate-500'
                }`}>
                  {newTrabajador.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Los trabajadores activos aparecerán en los filtros y formularios
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleAdd}
              disabled={!newTrabajador.nombre}
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

      {/* Trabajadores List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trabajadoresFiltrados.map((trabajador) => (
                <tr key={trabajador.id} className={`hover:bg-slate-50/80 transition-colors ${!trabajador.activo ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 text-sm text-slate-900">{trabajador.id}</td>
                  <td className="px-6 py-4">
                    {editingTrabajador?.id === trabajador.id ? (
                      <input
                        type="text"
                        value={editingTrabajador.nombre}
                        onChange={(e) => setEditingTrabajador({ ...editingTrabajador, nombre: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]"
                      />
                    ) : (
                      <span className="text-slate-900 font-medium">{trabajador.nombre}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingTrabajador?.id === trabajador.id ? (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 min-w-[60px]">Estado:</span>
                        <button
                          type="button"
                          onClick={() => setEditingTrabajador({ ...editingTrabajador, activo: !editingTrabajador.activo })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D17C22] focus:ring-offset-2 ${
                            editingTrabajador.activo ? 'bg-green-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              editingTrabajador.activo ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-medium ${
                          editingTrabajador.activo ? 'text-green-700' : 'text-slate-500'
                        }`}>
                          {editingTrabajador.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleActivo(trabajador)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D17C22] focus:ring-offset-2 ${
                            trabajador.activo ? 'bg-green-600' : 'bg-slate-300'
                          }`}
                          title={`Cambiar a ${trabajador.activo ? 'inactivo' : 'activo'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              trabajador.activo ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-sm font-medium ${
                          trabajador.activo ? 'text-green-700' : 'text-slate-500'
                        }`}>
                          {trabajador.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {editingTrabajador?.id === trabajador.id ? (
                        <>
                          <button
                            onClick={() => handleEdit(editingTrabajador)}
                            className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingTrabajador(null)}
                            className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingTrabajador(trabajador)}
                            className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(trabajador.id, trabajador.nombre)}
                            className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {trabajadoresFiltrados.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
              👥
            </div>
            <p className="text-slate-500 font-medium">
              {trabajadores.length === 0 
                ? 'No hay trabajadores registrados'
                : filter === 'activos' 
                  ? 'No hay trabajadores activos' 
                  : filter === 'inactivos'
                    ? 'No hay trabajadores inactivos'
                    : 'No hay trabajadores'
              }
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {trabajadores.length === 0 
                ? 'Añade el primer trabajador para empezar'
                : `Usa los filtros de arriba para ver trabajadores ${filter === 'todos' ? 'específicos' : 'de otro tipo'}`
              }
            </p>
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