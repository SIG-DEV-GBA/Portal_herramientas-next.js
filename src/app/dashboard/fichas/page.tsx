// src/app/dashboard/fichas/page.tsx
import AppHeaderWithNav from "@/components/AppHeaderWithNav";
import FichasClient from "./FichasClient";

export const dynamic = "force-dynamic";

export default function FichasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AppHeaderWithNav 
        showBackButton={true}
        backHref="/dashboard"
        backLabel="Portal de herramientas"
        title="Gestor de fichas"
      />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#D17C22] to-[#8E8D29]"></div>
            <h2 className="text-xl font-medium text-slate-600">
              Dashboard de análisis y gestión
            </h2>
          </div>
          <p className="text-sm text-slate-500 pl-6">
            Visualiza estadísticas, filtra datos y gestiona fichas del sistema
          </p>
        </div>
        <FichasClient />
      </main>
    </div>
  );
}
