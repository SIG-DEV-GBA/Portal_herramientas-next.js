"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Home, User } from "lucide-react";
import { useCurrentUser } from "@/shared/hooks/useCurrentUser";
import { useCorporateColors } from "@/shared/hooks/useCorporateColors";

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export default function AppHeader({ 
  title = "Gestor de Fichas", 
  showBackButton = true 
}: AppHeaderProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const colors = useCorporateColors();

  const handleLogout = async () => {
    try {
      // Limpiar datos locales antes de cerrar sesión
      localStorage.removeItem('portal_user_domain');
      localStorage.removeItem('portal_last_email');
      
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Limpiar datos locales aunque haya error y forzar redirección
      localStorage.removeItem('portal_user_domain');
      localStorage.removeItem('portal_last_email');
      router.push("/login");
    }
  };

  return (
    <header 
      className="border-b border-gray-200 shadow-sm sticky top-0 z-50"
      style={{
        background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary}10 50%, ${colors.secondary} 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Back button and title */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium 
                         bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm
                         hover:bg-white hover:shadow-md
                         focus:outline-none focus:ring-2 focus:ring-offset-2
                         transition-all duration-200"
                style={{ 
                  color: colors.primary,
                  '--focus-ring-color': colors.primary + '40'
                } as any}
                onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}40`}
                onBlur={(e) => e.currentTarget.style.boxShadow = ''}
              >
                <Home size={16} />
                <span className="hidden sm:inline">Portal Principal</span>
                <span className="sm:hidden">Portal</span>
              </Link>
            )}
            
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
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
            {/* User info */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-700">
              <User className="w-5 h-5" style={{ color: colors.primary }} />
              <span className="font-medium">{user?.email || 'Usuario'}</span>
            </div>
            
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium 
                       bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm
                       hover:bg-white hover:shadow-md
                       focus:outline-none focus:ring-2 focus:ring-offset-2
                       transition-all duration-200"
              style={{ 
                color: colors.primary,
                '--focus-ring-color': colors.primary + '40'
              } as any}
              onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}40`}
              onBlur={(e) => e.currentTarget.style.boxShadow = ''}
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