import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/utils/env";
import { pyFetch } from "@/lib/api/http";
import { LogOut, ArrowLeft, Grid3X3 } from "lucide-react";

type Props = {
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  title?: string;
};

export default async function AppHeaderWithNav({ 
  showBackButton = false, 
  backHref = "/dashboard", 
  backLabel = "Portal de herramientas",
  title
}: Props) {
  const cookieStore = await cookies();
  const sid = cookieStore.get(AUTH_COOKIE)?.value;

  if (!sid) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/60 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Brand />
          {showBackButton && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#D17C22]/20 px-4 py-2.5 text-sm font-medium
                         bg-gradient-to-r from-white to-[#D17C22]/5 text-[#D17C22] shadow-sm transition-all duration-200
                         hover:border-[#D17C22] hover:bg-gradient-to-r hover:from-[#D17C22] hover:to-[#8E8D29] hover:text-white 
                         hover:shadow-md hover:shadow-[#D17C22]/25"
            >
              <ArrowLeft size={16} />
              <span>{backLabel}</span>
            </Link>
          )}
        </div>
      </header>
    );
  }

  const res = await pyFetch("/auth/me", { headers: { Cookie: `${AUTH_COOKIE}=${sid}` } });
  const me = await res.json().catch(() => null);

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-white via-white to-amber-50/30 backdrop-blur-md border-b border-gradient">
      <div className="border-b border-[#D17C22]/20 bg-gradient-to-r from-white to-[#D17C22]/5">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Brand />
            {showBackButton && (
              <div className="flex items-center gap-4">
                <div className="w-px h-8 bg-[#D17C22]/20"></div>
                <Link
                  href={backHref}
                  className="group inline-flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium
                             bg-white text-slate-700 shadow-sm transition-all duration-200
                             hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 hover:shadow-md
                             focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                >
                  <ArrowLeft size={16} className="transition-all duration-200 group-hover:-translate-x-0.5" />
                  <Grid3X3 size={16} className="transition-all duration-200 group-hover:rotate-3" />
                  <span>{backLabel}</span>
                </Link>
                {title && (
                  <>
                    <div className="w-px h-8 bg-[#D17C22]/20"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#8E8D29] to-[#D17C22]"></div>
                      <h1 className="text-lg font-semibold text-slate-700">{title}</h1>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {me?.ok && (
            <div className="flex items-center gap-6">
              {/* User info con diseño moderno */}
              <div className="hidden md:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D17C22] to-[#8E8D29] flex items-center justify-center text-white font-semibold text-sm">
                  {me.email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-700">{me.email}</div>
                </div>
              </div>
              
              {/* Botón logout moderno */}
              <form action="/api/auth/logout" method="POST">
                <button
                  className="group inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium
                             bg-white text-red-600 shadow-sm transition-all duration-200
                             hover:bg-red-50 hover:border-red-400 hover:text-red-700 hover:shadow-md
                             focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                >
                  <span>Cerrar sesión</span>
                  <LogOut size={16} className="transition-all duration-200 group-hover:translate-x-0.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-4">
      {/* Contenedor del logo con efecto hover */}
      <div className="group relative h-14 w-36 md:h-16 md:w-[280px] transition-all duration-300 hover:scale-105">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#D17C22]/10 to-[#8E8D29]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <Image
          src="/logo.png"
          alt="Logo entidad"
          fill
          className="object-contain relative z-10 filter group-hover:brightness-110 transition-all duration-300"
          priority
        />
      </div>
    </div>
  );
}