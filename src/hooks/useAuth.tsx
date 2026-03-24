'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Admin, LoginCredentials } from '@/types';
import { authApi } from '@/services/api/auth';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const supabase = createClient();
      
      // Get Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('[useAuth] No session found');
        setAdmin(null);
        return;
      }

      console.log('[useAuth] Session found for:', session.user?.email);

      // Store token in localStorage for API calls
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_token', session.access_token);
      }

      // Use user data from Supabase session
      const adminData: Admin = {
        id: session.user?.id || '',
        email: session.user?.email || '',
        name: session.user?.user_metadata?.name || session.user?.email?.split('@')[0] || 'Admin',
        role: 'admin',
      };
      
      setAdmin(adminData);
      localStorage.setItem('admin_user', JSON.stringify(adminData));
      console.log('[useAuth] Admin set:', adminData.email);
    } catch (error) {
      console.error('[useAuth] Error:', error);
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    checkAuth().finally(() => setIsLoading(false));
  }, [checkAuth]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    console.log('[useAuth] Login called for:', credentials.email);
    const response = await authApi.login(credentials);
    console.log('[useAuth] Login response:', response);
    setAdmin(response.admin);
    setIsLoading(false);
    router.push('/admin');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setAdmin(null);
      router.push('/login');
    }
  }, [router]);

  const refreshProfile = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: !!admin,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
