"use client";

import { useState } from "react";
import useSWR from "swr";

interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  created_at: string;
  updated_at: string;
}

interface UserEditModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: number, role: string) => void;
}

const UserEditModal = ({ user, isOpen, onClose, onSave }: UserEditModalProps) => {
  const [selectedRole, setSelectedRole] = useState(user?.role || 'VIEWER');

  const handleSave = () => {
    if (user) {
      onSave(user.id, selectedRole);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Cambiar Permisos de Acceso
        </h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Usuario:</p>
          <p className="font-medium">{user.email}</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de Permisos
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ADMIN">👑 ADMIN - Acceso completo</option>
            <option value="EDITOR">✏️ EDITOR - Crear y editar</option>
            <option value="VIEWER">👁️ VIEWER - Solo lectura</option>
          </select>
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
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (email: string, role: string) => void;
}

const NewUserModal = ({ isOpen, onClose, onCreate }: NewUserModalProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');

  const handleCreate = () => {
    if (email.trim() && role) {
      onCreate(email.trim(), role);
      setEmail('');
      setRole('VIEWER');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Dar Acceso al Portal
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de Permisos
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ADMIN">👑 ADMIN - Acceso completo</option>
            <option value="EDITOR">✏️ EDITOR - Crear y editar</option>
            <option value="VIEWER">👁️ VIEWER - Solo lectura</option>
          </select>
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
            disabled={!email.trim()}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-md transition-colors"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  );
};

export const UsersManager = () => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);

  const fetcher = (url: string) => 
    fetch(url, { credentials: 'include' }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    });

  const { data: usersData, mutate, isLoading, error } = useSWR<{ users: User[] }>(
    '/api/admin/user-permissions',
    fetcher
  );

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/user-permissions/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return;
      }

      setEditingUser(null);
      mutate();
      alert('Rol actualizado correctamente');
    } catch (error) {
      alert('Error al actualizar el rol');
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!confirm(`¿Estás seguro de eliminar el acceso de ${userEmail}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/user-permissions/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return;
      }

      mutate();
      alert('Usuario eliminado correctamente');
    } catch (error) {
      alert('Error al eliminar el usuario');
    }
  };

  const handleCreateUser = async (email: string, role: string) => {
    try {
      const response = await fetch('/api/admin/user-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, role })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return;
      }

      setIsNewUserModalOpen(false);
      mutate();
      alert('Usuario creado correctamente');
    } catch (error) {
      alert('Error al crear el usuario');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      ADMIN: 'bg-red-100 text-red-800 border-red-200',
      EDITOR: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      VIEWER: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const icons = {
      ADMIN: '👑',
      EDITOR: '✏️',
      VIEWER: '👁️'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[role as keyof typeof styles]}`}>
        {icons[role as keyof typeof icons]} {role}
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
        {[...Array(3)].map((_, i) => (
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
        Error cargando usuarios. Verifica que tengas permisos de administrador.
      </div>
    );
  }

  const users = usersData?.users || [];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Permisos de Acceso al Portal ({users.length})
          </h2>
          <p className="text-sm text-gray-600">
            Controla quién puede acceder al sistema y con qué permisos (ADMIN/EDITOR/VIEWER)
          </p>
        </div>
        <button
          onClick={() => setIsNewUserModalOpen(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
        >
          ➕ Dar Acceso a Usuario
        </button>
      </div>

      <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay usuarios registrados
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    Creado: {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                {getRoleBadge(user.role)}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingUser(user)}
                  className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id, user.email)}
                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <UserEditModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleRoleChange}
      />

      <NewUserModal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        onCreate={handleCreateUser}
      />
    </>
  );
};