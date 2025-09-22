import FichasClient from "@/app/apps/gestor-fichas/pages/FichasClient";

// Disable static generation for this page since it uses useSearchParams
export const dynamic = 'force-dynamic';

export default function FichasDashboardPage() {
  return <FichasClient />;
}