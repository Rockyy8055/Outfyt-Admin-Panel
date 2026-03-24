'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Loader2 } from 'lucide-react';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, admin } = useAuth();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Wait for loading to complete before checking auth
    if (!isLoading) {
      setHasChecked(true);
      // Check if we have a token in localStorage
      const token = localStorage.getItem('admin_token');
      const user = localStorage.getItem('admin_user');
      if (token && user) {
        console.log('[AdminLayout] Found token in localStorage, allowing render');
        setShouldRender(true);
      } else {
        console.log('[AdminLayout] No token in localStorage, redirecting to login');
        router.push('/login');
      }
    }
  }, [isLoading, router]);

  if (isLoading || !hasChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!shouldRender) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  console.log('[AdminLayout] Rendering dashboard for:', admin?.email);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Topbar />
      <main className="ml-64 pt-16">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}

export default AdminLayout;
