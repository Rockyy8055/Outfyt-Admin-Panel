'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Admin, LoginCredentials } from '@/types';
import { authApi } from '@/services/supabase';
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAdmin(null);
        setIsLoading(false);
        return;
      }

      const profile = await authApi.getProfile();
      setAdmin(profile);
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setAdmin(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          try {
            const profile = await authApi.getProfile();
            setAdmin(profile);
          } catch {
            setAdmin(null);
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
      // Ignore logout API errors
    } finally {
      setAdmin(null);
      router.push('/admin/login');
    }
  }, [router]);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authApi.getProfile();
      setAdmin(profile);
    } catch {
      // Ignore refresh errors
    }
  }, []);

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
