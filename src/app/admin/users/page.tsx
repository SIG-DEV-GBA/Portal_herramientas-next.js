"use client";

import { useState, useEffect } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { UsersManager } from "@/components/management/UsersManager";
import { TrabajadoresManager } from "@/components/management/TrabajadoresManager";
import { useCurrentUser } from "@/shared/hooks/useCurrentUser";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'trabajadores'>('users');
  const { user, loading, isAdmin } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-2xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">No tienes permisos de administrador para acceder a esta página.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Administración del Sistema"
        showBackButton={true}
        isAdminPage={true}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-600 mt-1">
              Gestiona permisos de acceso al portal y trabajadores para asignación de fichas
            </p>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔐 Permisos de Acceso al Portal
              </button>
              <button
                onClick={() => setActiveTab('trabajadores')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'trabajadores'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👷 Trabajadores (para Fichas)
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' && <UsersManager />}
            {activeTab === 'trabajadores' && <TrabajadoresManager />}
          </div>
        </div>
      </div>
    </div>
  );
}