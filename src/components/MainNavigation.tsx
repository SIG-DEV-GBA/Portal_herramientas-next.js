'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Database, Layers3, Globe, Users, Home } from 'lucide-react';

export function MainNavigation() {
  const pathname = usePathname();
  const { canAccess, loading } = useCurrentUser();

  const tabs = [
    {
      name: 'Herramientas',
      href: '/dashboard',
      icon: Home,
      active: pathname === '/dashboard',
      show: true,
    },
    {
      name: 'Fichas',
      href: '/dashboard/fichas',
      icon: Database,
      active: pathname.startsWith('/dashboard/fichas'),
      show: canAccess('fichas', 'read'),
    },
    {
      name: 'Temáticas',
      href: '/dashboard/tematicas',
      icon: Layers3,
      active: pathname.startsWith('/dashboard/tematicas'),
      show: canAccess('tematicas', 'read'),
    },
    {
      name: 'Portales',
      href: '/dashboard/portales',
      icon: Globe,
      active: pathname.startsWith('/dashboard/portales'),
      show: canAccess('portales', 'read'),
    },
    {
      name: 'Usuarios',
      href: '/dashboard/users',
      icon: Users,
      active: pathname.startsWith('/dashboard/users'),
      show: canAccess('users', 'read'),
    },
  ];

  if (loading) {
    return (
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="inline-flex items-center gap-2 px-4 py-3">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex space-x-0">
          {tabs
            .filter(tab => tab.show)
            .map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`
                    inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                    ${tab.active
                      ? 'border-[#D17C22] text-[#D17C22] bg-[#D17C22]/5'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={16} />
                  {tab.name}
                </Link>
              );
            })}
        </div>
      </div>
    </nav>
  );
}