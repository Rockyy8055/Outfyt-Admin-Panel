'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Users,
  Store,
  Bike,
  MessageSquare,
  CreditCard,
  BarChart3,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: Package },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Stores', href: '/admin/stores', icon: Store },
  { name: 'Riders', href: '/admin/riders', icon: Bike },
  { name: 'Tickets', href: '/admin/tickets', icon: MessageSquare },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white pt-16">
      <div className="flex h-full flex-col overflow-y-auto pb-4">
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
