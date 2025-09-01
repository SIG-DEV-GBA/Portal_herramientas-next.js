import dynamic from 'next/dynamic';
import { FullPageSkeleton } from '@/components/ui/LoadingSkeletons';

const TematicasManager = dynamic(() => 
  import('@/components/management/TematicasManager').then(mod => ({ default: mod.TematicasManager })),
  {
    loading: () => <FullPageSkeleton />
  }
);

export default function TematicasPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <TematicasManager />
    </div>
  );
}