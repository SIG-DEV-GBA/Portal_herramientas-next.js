"use client";

import { LogIn, Eye, EyeOff, Shield, Users, Building2 } from "lucide-react";
import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCorporateColors } from "@/shared/hooks/useCorporateColors";
import CorporateFooter from "@/components/layout/CorporateFooter";

function LoginContent() {
  const colors = useCorporateColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("portal_last_email");
    if (saved) {
      setEmail(saved);
      setRemember(true);
    } else {
      setRemember(false);
    }
  }, []);

  useEffect(() => {
    if (!remember) {
      localStorage.removeItem("portal_last_email");
    }
  }, [remember]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        const msg =
          (data?.error ??
           data?.detail ??
           data?.message) || "Credenciales inválidas";
        throw new Error(msg);
      }

      if (remember && email) {
        localStorage.setItem("portal_last_email", email);
      } else {
        localStorage.removeItem("portal_last_email");
      }

      router.push(next);
    } catch (err: any) {
      setError(err?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  // Usar colores fijos para evitar problemas de hidratación (siempre Fundación por defecto)
  const safeColors = {
    primary: '#A10D59',
    secondary: '#FFFFFF', 
    accent: '#A10D59'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-5 blur-3xl"
          style={{ backgroundColor: safeColors.primary }}
        />
        <div 
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-5 blur-3xl"
          style={{ backgroundColor: safeColors.accent }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-slate-200/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-slate-200/20" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Panel lateral moderno */}
        <aside className="hidden lg:flex">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-black/5 p-12 flex flex-col justify-between min-h-[600px] relative overflow-hidden">
            {/* Gradiente sutil de fondo */}
            <div 
              className="absolute inset-0 opacity-3"
              style={{
                background: `linear-gradient(135deg, ${safeColors.primary}15 0%, transparent 50%, ${safeColors.accent}10 100%)`
              }}
            />
            
            <div className="relative z-10">
              {/* Logo corporativo moderno */}
              <div className="flex items-center gap-4 mb-8">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-black/10"
                  style={{ 
                    background: `linear-gradient(135deg, ${safeColors.primary} 0%, ${safeColors.accent} 100%)` 
                  }}
                >
                  <Building2 className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                    Portal Corporativo
                  </h2>
                  <p className="text-slate-500 text-sm font-medium">
                    Herramientas internas
                  </p>
                </div>
              </div>

              {/* Descripción moderna */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-700">
                  Acceso seguro a tu área de trabajo
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Plataforma unificada para el acceso a herramientas y recursos internos de la organización. 
                  Diseñada para optimizar tu productividad y colaboración.
                </p>

                {/* Características destacadas */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: safeColors.primary + '15' }}
                    >
                      <Shield size={16} style={{ color: safeColors.primary }} />
                    </div>
                    <span className="text-sm text-slate-600 font-medium">Seguridad empresarial</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: safeColors.accent + '15' }}
                    >
                      <Users size={16} style={{ color: safeColors.accent }} />
                    </div>
                    <span className="text-sm text-slate-600 font-medium">Colaboración centralizada</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer corporativo */}
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>© {new Date().getFullYear()} Portal Interno</span>
              <span className="px-2 py-1 bg-slate-100 rounded-full text-slate-500 font-medium">
                v2.0
              </span>
            </div>
          </div>
        </aside>

        {/* Card de login moderno */}
        <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-black/5 p-8 lg:p-12">
          {/* Header del formulario */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-6">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${safeColors.primary} 0%, ${safeColors.accent} 100%)` 
                }}
              >
                <LogIn className="text-white" size={24} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Iniciar sesión
            </h1>
            <p className="text-slate-500">
              Accede con tus credenciales corporativas
            </p>
          </div>

          <form className="space-y-6" onSubmit={onSubmit} autoComplete="off">
            {/* Campo de email moderno */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Correo electrónico
              </label>
              <div className="relative group">
                <input
                  type="email"
                  className="w-full h-12 rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 text-slate-800 text-sm
                            placeholder-slate-400 transition-all duration-200 ease-out
                            focus:bg-white focus:border-transparent focus:ring-2 focus:outline-none
                            group-hover:border-slate-300"
                  style={{ 
                    '--tw-ring-color': safeColors.primary + '40'
                  } as any}
                  onFocus={(e) => {
                    e.target.style.setProperty('--tw-ring-color', safeColors.primary + '40');
                    e.target.classList.add('ring-2');
                  }}
                  onBlur={(e) => {
                    e.target.classList.remove('ring-2');
                  }}
                  placeholder="tu-email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Campo de contraseña moderno */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Contraseña
              </label>
              <div className="relative group">
                <input
                  type={show ? "text" : "password"}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 pr-12 text-slate-800 text-sm
                            placeholder-slate-400 transition-all duration-200 ease-out
                            focus:bg-white focus:border-transparent focus:ring-2 focus:outline-none
                            group-hover:border-slate-300"
                  style={{ 
                    '--tw-ring-color': safeColors.primary + '40'
                  } as any}
                  onFocus={(e) => {
                    e.target.style.setProperty('--tw-ring-color', safeColors.primary + '40');
                    e.target.classList.add('ring-2');
                  }}
                  onBlur={(e) => {
                    e.target.classList.remove('ring-2');
                  }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 
                            transition-colors duration-200 rounded-lg hover:bg-slate-100"
                  aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Checkbox y opciones */}
            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-3 select-none cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <div 
                    className={`w-5 h-5 rounded-md border-2 transition-all duration-200 ${
                      remember 
                        ? 'border-transparent shadow-sm' 
                        : 'border-slate-300 group-hover:border-slate-400'
                    }`}
                    style={remember ? { backgroundColor: safeColors.primary } : {}}
                  >
                    {remember && (
                      <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-600 font-medium">
                  Recordar en este dispositivo
                </span>
              </label>
            </div>

            {/* Mensaje de error moderno */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Botón de login moderno */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-white font-semibold text-sm
                         transition-all duration-200 ease-out transform
                         hover:scale-[1.02] active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                         shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20"
              style={{ 
                background: loading 
                  ? '#94a3b8' 
                  : `linear-gradient(135deg, ${safeColors.primary} 0%, ${safeColors.accent} 100%)`
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verificando...</span>
                </div>
              ) : (
                "Acceder al portal"
              )}
            </button>
          </form>

          {/* Aviso de privacidad moderno */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Al acceder, aceptas las{" "}
              <span className="font-medium text-slate-600">políticas internas de seguridad</span>{" "}
              y el tratamiento de datos corporativos conforme a la normativa vigente.
            </p>
          </div>
        </div>
      </div>
      
      <CorporateFooter colors={safeColors} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}