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
  const supabase = createClient();

  const checkAuth = useCallback(async () => {
    try {
      // Get Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAdmin(null);
        setIsLoading(false);
        return;
      }

      // Store token in localStorage for API calls
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_token', session.access_token);
      }

      // Get stored user or fetch from backend
      const storedUser = localStorage.getItem('admin_user');
      if (storedUser) {
        setAdmin(JSON.parse(storedUser));
      }

      // Verify session is valid
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const adminData: Admin = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Admin',
          role: 'admin',
        };
        setAdmin(adminData);
        localStorage.setItem('admin_user', JSON.stringify(adminData));
      }
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  useEffect(() => {
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setAdmin(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            localStorage.setItem('admin_token', session.access_token);
            checkAuth();
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuth, supabase.auth]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    setAdmin(response.admin);
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
