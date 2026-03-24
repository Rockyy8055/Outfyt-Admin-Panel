import api from './config';
import type { AuthResponse, LoginCredentials, Admin } from '@/types';
import { createClient } from '@/lib/supabase/client';

function setCookie(name: string, value: string, days: number = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const supabase = createClient();
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('Login failed - no session');

    const token = data.session.access_token;
    
    // Store Supabase token in localStorage and cookie
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
      setCookie('admin_token', token);
    }

    // Use user data from Supabase - don't fetch profile which may fail
    const admin: Admin = {
      id: data.user?.id || '',
      email: data.user?.email || credentials.email,
      name: data.user?.user_metadata?.name || credentials.email.split('@')[0],
      role: 'admin',
    };
    
    localStorage.setItem('admin_user', JSON.stringify(admin));
    return { token, admin };
  },

  logout: async (): Promise<void> => {
    const supabase = createClient();
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      deleteCookie('admin_token');
    }
  },

  getProfile: async (): Promise<Admin> => {
    const response = await api.get('/me');
    return response.data;
  },

  updateProfile: async (data: Partial<Admin>): Promise<Admin> => {
    const response = await api.put('/auth/admin/profile', data);
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    if (error) throw new Error(error.message);
  },

  forgotPassword: async (email: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },

  signup: async (data: { email: string; password: string; name: string }): Promise<AuthResponse> => {
    const supabase = createClient();
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name } },
    });
    if (error) throw new Error(error.message);
    if (!result.session) throw new Error('Signup successful - please verify email');
    
    const token = result.session.access_token;
    localStorage.setItem('admin_token', token);
    setCookie('admin_token', token);
    
    return { 
      token, 
      admin: { id: result.user?.id || '', email: data.email, name: data.name, role: 'admin' } 
    };
  },

  getSession: async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
};

export default authApi;
