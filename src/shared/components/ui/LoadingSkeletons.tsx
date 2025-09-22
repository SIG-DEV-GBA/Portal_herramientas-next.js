import ContentLoader from 'react-content-loader';

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
      <ContentLoader
        speed={2}
        width="100%"
        height={400}
        backgroundColor="#f3f4f6"
        foregroundColor="#e5e7eb"
      >
        {/* Header */}
        <rect x="24" y="20" rx="4" ry="4" width="150" height="20" />
        <rect x="24" y="50" rx="3" ry="3" width="300" height="16" />
        
        {/* Table headers */}
        <rect x="24" y="100" rx="3" ry="3" width="80" height="12" />
        <rect x="150" y="100" rx="3" ry="3" width="120" height="12" />
        <rect x="320" y="100" rx="3" ry="3" width="100" height="12" />
        
        {/* Table rows */}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect x="24" y={140 + i * 50} rx="3" ry="3" width="40" height="12" />
            <rect x="150" y={140 + i * 50} rx="3" ry="3" width="180" height="12" />
            <rect x="320" y={140 + i * 50} rx="3" ry="3" width="80" height="12" />
          </g>
        ))}
      </ContentLoader>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <ContentLoader
          speed={2}
          width={300}
          height={60}
          backgroundColor="#f3f4f6"
          foregroundColor="#e5e7eb"
        >
          <rect x="0" y="0" rx="4" ry="4" width="200" height="24" />
          <rect x="0" y="35" rx="3" ry="3" width="280" height="16" />
        </ContentLoader>
      </div>
      <ContentLoader
        speed={2}
        width={140}
        height={40}
        backgroundColor="#f3f4f6"
        foregroundColor="#e5e7eb"
      >
        <rect x="0" y="0" rx="8" ry="8" width="140" height="40" />
      </ContentLoader>
    </div>
  );
}

export function FullPageSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}