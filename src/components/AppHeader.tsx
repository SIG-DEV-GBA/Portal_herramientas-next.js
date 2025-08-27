import Image from "next/image";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/env";
import { pyFetch } from "@/lib/http";
import { LogOut } from "lucide-react";

export default async function AppHeader() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(AUTH_COOKIE)?.value;

  if (!sid) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
          <Brand />
        </div>
      </header>
    );
  }

  const res = await pyFetch("/auth/me", { headers: { Cookie: `${AUTH_COOKIE}=${sid}` } });
  const me = await res.json().catch(() => null);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
        <Brand />
        {me?.ok && (
          <div className="flex items-center gap-6">
            <span className="hidden text-sm text-[#374151] md:inline">{me.email}</span>
            <form action="/api/auth/logout" method="POST">
              <button
                className="group inline-flex items-center gap-2 rounded-lg border-2 border-[#D17C22] px-5 py-2 text-sm font-medium
                           text-[#D17C22] shadow-sm transition
                           hover:bg-[#D17C22] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#D17C22]/40"
              >
                <span>Cerrar sesión</span>
                <LogOut size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
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
    <div className="flex items-center gap-4">
      {/* Logo muy grande en desktop, más compacto en móvil */}
      <div className="relative h-16 w-40 md:h-20 md:w-[300px]">
        <Image
          src="/logo.png"
          alt="Logo entidad"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
