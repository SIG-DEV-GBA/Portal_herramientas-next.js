"use client";

import { useRouter } from "next/navigation";
import { LogOut, User, Settings, Home, Shield } from "lucide-react";
import { useCurrentUser } from "@/shared/hooks/useCurrentUser";
import { useCorporateColors } from "@/shared/hooks/useCorporateColors";
import { useState, useEffect } from "react";

interface DashboardHeaderProps {
  title?: string;
  showBackButton?: boolean;
  isAdminPage?: boolean;
}

export default function DashboardHeader({ 
  title = "Portal de Herramientas", 
  showBackButton = false,
  isAdminPage = false 
}: DashboardHeaderProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const colors = useCorporateColors();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Usar colores por defecto durante SSR para evitar problemas de hidratación
  const safeColors = isClient ? colors : {
    primary: '#6B7280',
    secondary: '#FFFFFF',
    accent: '#6B7280'
  };

  return (
    <header 
      className="border-b border-gray-200 shadow-sm sticky top-0 z-50"
      style={{
        background: `linear-gradient(135deg, ${safeColors.secondary} 0%, ${safeColors.primary}10 50%, ${safeColors.secondary} 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Back button and title */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium 
                         bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm
                         hover:bg-white hover:shadow-md
                         focus:outline-none focus:ring-2 focus:ring-offset-2
                         transition-all duration-200"
                style={{ 
                  color: safeColors.primary,
                  '--focus-ring-color': safeColors.primary + '40'
                } as any}
                onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${safeColors.primary}40`}
                onBlur={(e) => e.currentTarget.style.boxShadow = ''}
              >
                <Home size={16} />
                <span className="hidden sm:inline">Portal Principal</span>
                <span className="sm:hidden">Portal</span>
              </button>
            )}
            
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: safeColors.primary }}
              >
                {isAdminPage ? (
                  <Shield className="w-5 h-5 text-white" />
                ) : (
                  <Settings className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {isAdminPage ? "Administración del sistema" : "Centro de aplicaciones corporativas"}
                </p>
              </div>
            </div>
          </div>

          {/* Right side - User actions */}
          <div className="flex items-center space-x-3">
            {/* User info */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-700">
              <User className="w-5 h-5" style={{ color: safeColors.primary }} />
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
                color: safeColors.primary,
                '--focus-ring-color': safeColors.primary + '40'
              } as any}
              onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${safeColors.primary}40`}
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