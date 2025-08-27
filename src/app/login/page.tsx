"use client";

import { LogIn, Eye, EyeOff } from "lucide-react";
import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false); // ⬅️ por defecto false y sincronizamos al montar
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  // Cargar email recordado y sincronizar checkbox
  useEffect(() => {
    const saved = localStorage.getItem("portal_last_email");
    if (saved) {
      setEmail(saved);
      setRemember(true);
    } else {
      setRemember(false);
    }
  }, []);

  // (Opcional) Si el usuario desmarca, borra inmediatamente lo guardado
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
        // lee el error normalizado que ya devolvemos desde la API, con fallback
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

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel lateral corporativo */}
        <aside className="hidden md:flex rounded-2xl overflow-hidden shadow-md">
          <div className="relative flex-1 bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D17C22]/15 via-transparent to-[#8E8D29]/15" />
            <div className="relative h-full flex flex-col justify-between p-8">
              <div>
                {/* Logo/Marca */}
                <div className="w-12 h-12 rounded-lg bg-[#D17C22] flex items-center justify-center shadow">
                  <LogIn className="text-white" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-[#1f2937]">
                  Portal de herramientas
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#4b5563]">
                  Accede con tus credenciales corporativas para usar las
                  herramientas internas de la organización. Uso exclusivo para personal autorizado.
                </p>
              </div>
              <div className="text-xs text-[#6b7280]">
                © {new Date().getFullYear()} — Área Interna
              </div>
            </div>
          </div>
        </aside>

        {/* Card de login */}
        <div className="rounded-2xl bg-white border border-[#e5e7eb] shadow-md p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#D17C22] flex items-center justify-center shadow-sm">
              <LogIn className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#111827]">Acceso al portal</h1>
              <p className="text-sm text-[#6b7280]">Introduce tu email y contraseña</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={onSubmit} autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[#111827]
                          outline-none focus:ring-2 focus:ring-[#8E8D29]/30 focus:border-[#8E8D29] transition"
                placeholder="tu@solidaridadintergeneracional.es"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 pr-10 text-[#111827]
                            outline-none focus:ring-2 focus:ring-[#8E8D29]/30 focus:border-[#8E8D29] transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6b7280] hover:text-[#374151]"
                  aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 select-none text-sm text-[#4b5563]">
                <input
                  type="checkbox"
                  className="accent-[#8E8D29]"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Recordar email en este equipo
              </label>
              {/* futuro: enlace a soporte/ayuda */}
              {/* <a className="text-sm text-[#8E8D29] hover:underline" href="#">¿Necesitas ayuda?</a> */}
            </div>

            {error && (
              <p className="text-sm text-[#b91c1c] bg-[#fee2e2] border border-[#fecaca] rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#D17C22] text-white py-2.5 font-medium
                         hover:bg-[#c4711f] active:bg-[#b7671c] transition
                         focus:outline-none focus:ring-2 focus:ring-[#D17C22]/30
                         disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* sello de privacidad / aviso breve */}
          <p className="mt-6 text-xs text-[#6b7280]">
            El acceso implica aceptación de las políticas internas de seguridad y uso de datos.
          </p>
        </div>
      </div>
    </div>
  );
}
