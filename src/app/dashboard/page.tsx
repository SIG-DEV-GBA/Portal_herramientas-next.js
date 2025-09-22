"use client";

import ToolGridClient, { ToolItem } from "@/components/ToolGridClient";
import { Database, Wand2, Settings, Users, BarChart3, Shield } from "lucide-react";
import { useCorporateColors } from "@/shared/hooks/useCorporateColors";
import CorporateFooter from "@/components/layout/CorporateFooter";
import DashboardHeader from "@/components/layout/DashboardHeader";

export default function Dashboard() {
  const colors = useCorporateColors();
  // Herramientas disponibles
  const tools: ToolItem[] = [
    {
      key: "gestor-fichas",
      title: "Gestor de fichas",
      description: "Introducir información de fichas publicadas en la web a la base de datos.",
      href: "/apps/gestor-fichas/dashboard",
      icon: <Database size={20} />,
      tags: ["Fichas"],
    },
    {
      key: "admin-users",
      title: "Gestión de usuarios",
      description: "Administrar permisos de usuarios y trabajadores del sistema (solo admins).",
      href: "/admin/users",
      icon: <Shield size={20} />,
      tags: ["Administración"],
      adminOnly: true,
    },
    {
      key: "generador-fichas-ia",
      title: "Generador de fichas (IA)",
      description: "Crear fichas asistidas por IA a partir de contenidos y plantillas.",
      href: "/apps/generador-fichas-ia",
      icon: <Wand2 size={20} />,
      tags: ["Fichas"],
      disabled: true,
      badge: "En desarrollo",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-3 blur-3xl"
          style={{ backgroundColor: colors.primary }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-3 blur-3xl"
          style={{ backgroundColor: colors.accent }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-slate-200/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-slate-200/15" />
      </div>

      {/* Dashboard Header */}
      <DashboardHeader />
      
      {/* Hero Header Moderno */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            {/* Status Badge Moderno */}
            <div className="inline-flex items-center gap-3 mb-8 px-6 py-3 bg-white/80 backdrop-blur-xl border border-white/20 rounded-full shadow-lg">
              <div 
                className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
                style={{ backgroundColor: colors.primary }}
              />
              <span className="text-sm font-semibold text-slate-700">Sistema operativo</span>
              <div className="w-1 h-4 bg-slate-300 rounded-full" />
              <span className="text-xs text-slate-500 font-medium">v{new Date().getFullYear()}</span>
            </div>
            
            {/* Título Principal */}
            <h1 className="text-6xl lg:text-7xl font-bold text-slate-800 mb-6 tracking-tight leading-none">
              Portal de{" "}
              <span 
                className="bg-gradient-to-r bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`
                }}
              >
                Herramientas
              </span>
            </h1>
            
            {/* Subtítulo */}
            <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto mb-12 leading-relaxed font-light">
              Plataforma unificada para el acceso y gestión de aplicaciones corporativas.
              <br className="hidden sm:block" />
              <span className="text-slate-500">Diseñada para optimizar tu productividad.</span>
            </p>
            
            {/* Características destacadas */}
            <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6">
              {[
                { icon: Users, label: "Acceso corporativo", color: colors.primary },
                { icon: BarChart3, label: "Gestión integrada", color: colors.accent },
                { icon: Settings, label: "Herramientas internas", color: colors.primary }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: item.color + '15' }}
                  >
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: colors.primary }} />
            <h2 className="text-3xl font-bold text-slate-800">Herramientas Disponibles</h2>
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: colors.accent }} />
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Selecciona una herramienta para comenzar. Todas están protegidas con autenticación corporativa.
          </p>
        </div>

        <ToolGridClient items={tools} />

      </main>
      
      <CorporateFooter />
    </div>
  );
}