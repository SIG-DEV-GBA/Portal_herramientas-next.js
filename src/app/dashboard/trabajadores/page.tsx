import dynamic from 'next/dynamic';
import { FullPageSkeleton } from '@/components/ui/LoadingSkeletons';

const TrabajadoresManager = dynamic(() => 
  import('@/components/management/TrabajadoresManager').then(mod => ({ default: mod.TrabajadoresManager })),
  {
    loading: () => <FullPageSkeleton />
  }
);

export default function TrabajadoresPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <TrabajadoresManager />
    </div>
  );
}