import api from './config';
import type { AuthResponse, LoginCredentials, Admin } from '@/types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/admin/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/admin/auth/logout');
  },

  getProfile: async (): Promise<Admin> => {
    const response = await api.get<Admin>('/admin/auth/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<Admin>): Promise<Admin> => {
    const response = await api.put<Admin>('/admin/auth/profile', data);
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.put('/admin/auth/password', data);
  },
};

export default authApi;
