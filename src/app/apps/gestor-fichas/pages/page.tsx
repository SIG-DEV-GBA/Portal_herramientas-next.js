import FichasClient from "./FichasClient";

export const dynamic = "force-dynamic";

export default function FichasPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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
    </div>
  );
}
