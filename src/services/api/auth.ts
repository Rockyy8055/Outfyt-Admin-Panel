import api from './config';
import type { AuthResponse, LoginCredentials, Admin } from '@/types';

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
    const response = await api.post('/auth/admin/login', credentials);
    const data = response.data;
    // Store token in localStorage and cookie
    if (typeof window !== 'undefined' && data.token) {
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      setCookie('admin_token', data.token);
    }
    return data;
  },

  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      deleteCookie('admin_token');
    }
  },

  getProfile: async (): Promise<Admin> => {
    const response = await api.get('/auth/admin/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<Admin>): Promise<Admin> => {
    const response = await api.put('/auth/admin/profile', data);
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.post('/auth/admin/change-password', data);
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/admin/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post('/auth/admin/reset-password', { token, password });
  },

  signup: async (data: { email: string; password: string; name: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/admin/signup', data);
    return response.data;
  },
};

export default authApi;
