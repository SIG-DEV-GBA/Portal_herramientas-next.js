import { Suspense } from "react";
import AppHeader from "@/components/AppHeader";
import { FullPageSkeleton } from "@/components/ui/LoadingSkeletons";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <AppHeader />
      <Suspense fallback={
        <div className="max-w-6xl mx-auto px-4 py-8">
          <FullPageSkeleton />
        </div>
      }>
        {children}
      </Suspense>
    </div>
  );
}