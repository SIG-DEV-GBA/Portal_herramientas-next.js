import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/utils/env";
import { pyFetch } from "@/lib/api/http";
import { LogOut, Grid3X3 } from "lucide-react";

export default async function AppHeader() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(AUTH_COOKIE)?.value;

  if (!sid) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/60 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Brand />
        </div>
      </header>
    );
  }

  const res = await pyFetch("/auth/me", { headers: { Cookie: `${AUTH_COOKIE}=${sid}` } });
  const me = await res.json().catch(() => null);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/95 border-b border-slate-200/60 shadow-sm">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-3">
        <Brand />
        {me?.ok && (
          <div className="flex items-center gap-3">
            {/* Botón Herramientas */}
            <Link
              href="/dashboard"
              className="group relative inline-flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold
                         bg-gradient-to-br from-[#D17C22] to-[#B8641A] text-white rounded-2xl shadow-lg
                         hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out
                         before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br 
                         before:from-white/20 before:to-transparent before:opacity-0 
                         hover:before:opacity-100 before:transition-opacity before:duration-300"
            >
              <Grid3X3 size={18} className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              <span className="relative z-10">Herramientas</span>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#E8863A] to-[#C8742A] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </Link>

            {/* User info con diseño premium */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50/80 backdrop-blur-sm border border-slate-200/60">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D17C22] via-[#C8742A] to-[#8E8D29] flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {me.email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-slate-800 leading-tight">{me.email}</div>
                <div className="text-xs text-slate-500">Sesión activa</div>
              </div>
            </div>
            
            {/* Botón logout premium */}
            <form action="/api/auth/logout" method="POST">
              <button
                className="group relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                           bg-white text-slate-600 rounded-2xl border border-slate-200 shadow-sm
                           hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 hover:shadow-md
                           transition-all duration-300 ease-out hover:scale-[1.02]
                           focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                <span className="relative z-10">Salir</span>
                <LogOut size={16} className="transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-red-500" />
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

function Brand() {
  return (
    <div className="flex items-center">
      {/* Contenedor del logo con efecto moderno */}
      <div className="group relative h-12 w-32 md:h-14 md:w-[260px] transition-all duration-500 hover:scale-[1.03]">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#D17C22]/5 via-transparent to-[#8E8D29]/5 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
        <div className="absolute inset-0 rounded-2xl bg-white/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
        <Image
          src="/logo.png"
          alt="Logo entidad"
          fill
          className="object-contain relative z-10 filter group-hover:brightness-105 group-hover:contrast-110 transition-all duration-500"
          priority
        />
        {/* Efecto de brillo sutil */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform group-hover:translate-x-full"></div>
      </div>
    </div>
  );
}
