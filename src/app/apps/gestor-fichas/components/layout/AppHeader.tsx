"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Home } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export default function AppHeader({ 
  title = "Gestor de Fichas", 
  showBackButton = true 
}: AppHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Forzar redirección aunque haya error
      router.push("/login");
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Back button and title */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 
                         bg-white border border-gray-300 rounded-lg shadow-sm
                         hover:bg-gray-50 hover:border-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         transition-all duration-200"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Volver al Portal</span>
                <Home size={16} className="sm:hidden" />
              </Link>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">GF</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Gestión de fichas del portal</p>
              </div>
            </div>
          </div>

          {/* Right side - User actions */}
          <div className="flex items-center space-x-3">
            {/* User info - could be expanded with user context */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-700">
              <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
              <span>Usuario</span>
            </div>
            
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 
                       bg-white border border-gray-300 rounded-lg shadow-sm
                       hover:bg-red-50 hover:border-red-300 hover:text-red-700
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                       transition-all duration-200"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}