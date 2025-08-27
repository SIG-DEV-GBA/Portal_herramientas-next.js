"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Home } from "lucide-react";
import { useState } from "react";

export default function TopBarFichas() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50"
            title="Volver al portal de herramientas"
          >
            <Home size={16} />
            <span>Volver al portal</span>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          disabled={loading}
          title="Cerrar sesión"
        >
          <LogOut size={16} />
          <span>{loading ? "Saliendo…" : "Cerrar sesión"}</span>
        </button>
      </div>
    </div>
  );
}
