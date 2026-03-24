import api from './config';
import type { User, PaginatedResponse, PaginationParams } from '@/types';

export interface UsersQueryParams extends PaginationParams {
  status?: 'active' | 'blocked';
  role?: string;
}

export const usersApi = {
  getAll: async (params: UsersQueryParams): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/admin/users', { params });
    const res = response.data;
    return {
      data: res.data || [],
      total: res.pagination?.total || 0,
      page: res.pagination?.page || 1,
      limit: res.pagination?.limit || 10,
      totalPages: res.pagination?.totalPages || 1,
    };
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data.data;
  },

  block: async (id: string, reason?: string): Promise<User> => {
    const response = await api.put(`/admin/users/${id}/block`, { reason });
    return response.data.data;
  },

  unblock: async (id: string): Promise<User> => {
    const response = await api.put(`/admin/users/${id}/unblock`);
    return response.data.data;
  },

  search: async (query: string): Promise<User[]> => {
    const response = await api.get('/admin/search', { params: { q: query } });
    return response.data.data?.users || [];
  },
};

export default usersApi;
