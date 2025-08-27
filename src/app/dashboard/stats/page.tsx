// src/app/dashboard/stats/page.tsx
import StatsClient from "../fichas/_client";

export const metadata = {
  title: "Estadísticas",
};

export default function StatsPage() {
  return (
    <main className="p-4 md:p-6 space-y-6">
      <StatsClient />
    </main>
  );
}
