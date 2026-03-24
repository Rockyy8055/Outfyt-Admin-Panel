import api from './config';
import type { SearchResult } from '@/types';

export const searchApi = {
  global: async (query: string): Promise<SearchResult[]> => {
    const response = await api.get<SearchResult[]>('/admin/search', { params: { query } });
    return response.data;
  },

  searchOrders: async (query: string): Promise<SearchResult[]> => {
    const response = await api.get<SearchResult[]>('/admin/search/orders', { params: { query } });
    return response.data;
  },

  searchUsers: async (query: string): Promise<SearchResult[]> => {
    const response = await api.get<SearchResult[]>('/admin/search/users', { params: { query } });
    return response.data;
  },

  searchStores: async (query: string): Promise<SearchResult[]> => {
    const response = await api.get<SearchResult[]>('/admin/search/stores', { params: { query } });
    return response.data;
  },
};

export default searchApi;
