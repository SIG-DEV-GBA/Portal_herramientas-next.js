// src/app/dashboard/fichas/page.tsx
import TopBarFichas from "@/components/TopBarFichas";
import FichasClient from "./FichasClient"; // o tu _client.tsx

export const dynamic = "force-dynamic";

export default function FichasPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <TopBarFichas />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-semibold">Gestor de fichas</h1>
        <FichasClient />
      </main>
    </div>
  );
}
