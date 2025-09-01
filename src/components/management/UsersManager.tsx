'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNotification } from '@/hooks/useNotification';
import { Modal } from '@/components/ui/Modal';
import { FullPageSkeleton } from '@/components/ui/LoadingSkeletons';

interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  created_at: string;
  updated_at: string;
}

interface UserFormData {
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

export function UsersManager() {
  const { canAccess, loading: userLoading } = useCurrentUser();
  const { showNotification } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({ email: '', role: 'VIEWER' });

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        showNotification('Error al cargar usuarios', 'error');
      }
    } catch (error) {
      showNotification('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && canAccess('users', 'read')) {
      fetchUsers();
    } else if (!userLoading && !canAccess('users', 'read')) {
      setLoading(false);
    }
  }, [userLoading, canAccess]);

  // Mostrar skeleton mientras carga el usuario o los datos
  if (userLoading || (loading && canAccess('users', 'read'))) {
    return <FullPageSkeleton />;
  }

  // Verificar permisos después de cargar
  if (!canAccess('users', 'read')) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes permisos para acceder a la gestión de usuarios.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showNotification(
          editingUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente',
          'success'
        );
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({ email: '', role: 'VIEWER' });
        fetchUsers();
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Error al procesar la solicitud', 'error');
      }
    } catch (error) {
      showNotification('Error de conexión', 'error');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ email: user.email, role: user.role });
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: number, userEmail: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el usuario ${userEmail}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showNotification('Usuario eliminado exitosamente', 'success');
        fetchUsers();
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Error al eliminar usuario', 'error');
      }
    } catch (error) {
      showNotification('Error de conexión', 'error');
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ email: '', role: 'VIEWER' });
    setIsModalOpen(true);
  };

  const getRoleBadgeClass = (role: string) => {
    const classes = {
      ADMIN: 'bg-red-100 text-red-800',
      EDITOR: 'bg-blue-100 text-blue-800',
      VIEWER: 'bg-green-100 text-green-800',
    };
    return classes[role as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="p-6 text-center">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
        {canAccess('users', 'create') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Crear Usuario
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                  {canAccess('users', 'update') && (
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Editar
                    </button>
                  )}
                  {canAccess('users', 'delete') && (
                    <button
                      onClick={() => handleDelete(user.id, user.email)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        title={editingUser ? 'Editar Usuario' : 'Crear Usuario'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="VIEWER">VIEWER - Solo lectura de fichas</option>
              <option value="EDITOR">EDITOR - Puede gestionar datos excepto usuarios</option>
              <option value="ADMIN">ADMIN - Control total</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingUser ? 'Actualizar' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingUser(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}