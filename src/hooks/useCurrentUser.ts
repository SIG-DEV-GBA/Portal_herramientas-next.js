import { useState, useEffect } from 'react';

export interface CurrentUser {
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user || data);
        } else {
          setError('No se pudo obtener la información del usuario');
        }
      } catch (err) {
        setError('Error al cargar el usuario');
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentUser();
  }, []);

  const canAccess = (resource: string, action: string): boolean => {
    if (loading || !user) return false;

    const permissions = {
      fichas: {
        read: ['ADMIN', 'EDITOR', 'VIEWER'],
        create: ['ADMIN', 'EDITOR', 'VIEWER'],
        update: ['ADMIN', 'EDITOR', 'VIEWER'],
        delete: ['ADMIN', 'EDITOR', 'VIEWER'],
      },
      portales: {
        read: ['ADMIN', 'EDITOR', 'VIEWER'],
        create: ['ADMIN', 'EDITOR'],
        update: ['ADMIN', 'EDITOR'],
        delete: ['ADMIN', 'EDITOR'],
      },
      tematicas: {
        read: ['ADMIN', 'EDITOR', 'VIEWER'],
        create: ['ADMIN', 'EDITOR'],
        update: ['ADMIN', 'EDITOR'],
        delete: ['ADMIN', 'EDITOR'],
      },
      trabajadores: {
        read: ['ADMIN', 'EDITOR', 'VIEWER'],
        create: ['ADMIN', 'EDITOR'],
        update: ['ADMIN', 'EDITOR'],
        delete: ['ADMIN', 'EDITOR'],
      },
      users: {
        read: ['ADMIN'],
        create: ['ADMIN'],
        update: ['ADMIN'],
        delete: ['ADMIN'],
      },
    };

    const resourcePermissions = permissions[resource as keyof typeof permissions];
    if (!resourcePermissions) return false;

    const actionPermissions = resourcePermissions[action as keyof typeof resourcePermissions];
    return actionPermissions?.includes(user.role) || false;
  };

  return {
    user,
    loading,
    error,
    canAccess,
    isAdmin: user?.role === 'ADMIN',
    isEditor: user?.role === 'EDITOR',
    isViewer: user?.role === 'VIEWER',
  };
}