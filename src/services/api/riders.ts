import api from './config';
import type { Rider, PaginatedResponse, PaginationParams } from '@/types';

export interface RidersQueryParams extends PaginationParams {
  isBlocked?: boolean;
}

export const ridersApi = {
  getAll: async (params: RidersQueryParams): Promise<PaginatedResponse<Rider>> => {
    const response = await api.get('/public/admin-riders', { params });
    const res = response.data;
    return {
      data: res.data || [],
      total: res.pagination?.total || 0,
      page: res.pagination?.page || 1,
      limit: res.pagination?.limit || 10,
      totalPages: res.pagination?.totalPages || 1,
    };
  },

  getById: async (id: string): Promise<Rider> => {
    const response = await api.get(`/admin/riders/${id}`);
    return response.data.data;
  },

  approve: async (id: string): Promise<Rider> => {
    const response = await api.put(`/admin/riders/${id}/approve`);
    return response.data.data;
  },

  suspend: async (id: string, reason: string): Promise<Rider> => {
    const response = await api.put(`/admin/riders/${id}/suspend`, { reason });
    return response.data.data;
  },

  activate: async (id: string): Promise<Rider> => {
    const response = await api.put(`/admin/riders/${id}/approve`);
    return response.data.data;
  },

  getAvailable: async (): Promise<Rider[]> => {
    const response = await api.get('/public/admin-riders', { params: { isBlocked: false } });
    return response.data.data || [];
  },
};

export default ridersApi;
