import AppHeader from "@/components/AppHeader";
import ToolGridClient, { ToolItem } from "@/components/ToolGridClient";
import { Database, Wand2 } from "lucide-react";

export default async function Dashboard() {
  // Herramientas actuales
  const tools: ToolItem[] = [
    {
      key: "gestor-fichas",
      title: "Gestor de fichas",
      description: "Introducir información de fichas publicadas en la web a la base de datos.",
      href: "/tools/fichas/gestor", // ajusta la ruta real
      icon: <Database size={20} />,
      tags: ["Fichas"],
    },
    {
      key: "generador-fichas-ia",
      title: "Generador de fichas (IA)",
      description: "Crear fichas asistidas por IA a partir de contenidos y plantillas.",
      href: "/tools/fichas/ia",     // futura ruta
      icon: <Wand2 size={20} />,
      tags: ["Fichas"],
      disabled: true,
      badge: "En desarrollo",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-[#111827]">Portal de herramientas</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Accede a las aplicaciones internas de la organización. Usa el buscador o filtra por categoría.
          </p>
        </header>

        <ToolGridClient items={tools} />
      </main>
    </div>
  );
}
