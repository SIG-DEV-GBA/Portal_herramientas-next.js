import dynamic from 'next/dynamic';
import { FullPageSkeleton } from '@/components/ui/LoadingSkeletons';

const PortalesManager = dynamic(() => 
  import('@/components/management/PortalesManager').then(mod => ({ default: mod.PortalesManager })),
  {
    loading: () => <FullPageSkeleton />
  }
);

export default function PortalesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PortalesManager />
    </div>
  );
}