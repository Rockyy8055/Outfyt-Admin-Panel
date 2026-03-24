import api from './config';
import type { Store, Product, PaginatedResponse, PaginationParams } from '@/types';

export interface StoresQueryParams extends PaginationParams {
  isApproved?: boolean;
  isDisabled?: boolean;
}

export const storesApi = {
  getAll: async (params: StoresQueryParams): Promise<PaginatedResponse<Store>> => {
    const response = await api.get('/public/admin-stores', { params });
    const res = response.data;
    return {
      data: res.data || [],
      total: res.pagination?.total || 0,
      page: res.pagination?.page || 1,
      limit: res.pagination?.limit || 10,
      totalPages: res.pagination?.totalPages || 1,
    };
  },

  getById: async (id: string): Promise<Store> => {
    const response = await api.get(`/admin/stores/${id}`);
    return response.data.data;
  },

  approve: async (id: string): Promise<Store> => {
    const response = await api.put(`/admin/stores/${id}/approve`);
    return response.data.data;
  },

  reject: async (id: string, reason: string): Promise<Store> => {
    const response = await api.put(`/admin/stores/${id}/reject`, { reason });
    return response.data.data;
  },

  disable: async (id: string, reason: string): Promise<Store> => {
    const response = await api.put(`/admin/stores/${id}/disable`, { reason });
    return response.data.data;
  },

  enable: async (id: string): Promise<Store> => {
    const response = await api.put(`/admin/stores/${id}/approve`);
    return response.data.data;
  },

  getProducts: async (storeId: string, params?: PaginationParams): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/admin/products', { params: { ...params, storeId } });
    const res = response.data;
    return {
      data: res.data || [],
      total: res.pagination?.total || 0,
      page: res.pagination?.page || 1,
      limit: res.pagination?.limit || 10,
      totalPages: res.pagination?.totalPages || 1,
    };
  },

  search: async (query: string): Promise<Store[]> => {
    const response = await api.get('/admin/search', { params: { q: query } });
    return response.data.data?.stores || [];
  },
};

export default storesApi;
