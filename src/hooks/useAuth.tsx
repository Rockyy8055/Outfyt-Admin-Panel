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
        return;
      }

      // Check localStorage for stored admin data
      const storedToken = localStorage.getItem('admin_token');
      const storedUser = localStorage.getItem('admin_user');

      if (!storedToken || !storedUser) {
        console.log('[useAuth] No stored credentials');
        setAdmin(null);
        return;
      }

      console.log('[useAuth] Found stored credentials');
      const adminData = JSON.parse(storedUser);
      setAdmin(adminData);
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
    setIsLoading(true);
    const response = await authApi.login(credentials);
    console.log('[useAuth] Login response:', response);
    setAdmin(response.admin);
    setIsLoading(false);
    // Use window.location for hard navigation to ensure state persists
    window.location.href = '/admin';
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setAdmin(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
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
