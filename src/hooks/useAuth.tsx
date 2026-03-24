'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Admin, LoginCredentials } from '@/types';
import { authApi } from '@/services/api/auth';

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
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('admin_token');
      const storedUser = localStorage.getItem('admin_user');

      if (!token) {
        setAdmin(null);
        setIsLoading(false);
        return;
      }

      // Use stored user data first for quick load
      if (storedUser) {
        setAdmin(JSON.parse(storedUser));
      }

      // Verify token by fetching profile
      const profile = await authApi.getProfile();
      setAdmin(profile);
      localStorage.setItem('admin_user', JSON.stringify(profile));
    } catch {
      // Token invalid, clear storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_user', JSON.stringify(profile));
      }
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
