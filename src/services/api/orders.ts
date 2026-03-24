import api from './config';
import type { Order, OrderStatus, PaginatedResponse, PaginationParams, OrderFilters } from '@/types';

export interface OrdersQueryParams extends PaginationParams, OrderFilters {}

export const ordersApi = {
  getAll: async (params: OrdersQueryParams): Promise<PaginatedResponse<Order>> => {
    const response = await api.get('/public/admin-orders', { params });
    const res = response.data;
    return {
      data: res.data || [],
      total: res.pagination?.total || 0,
      page: res.pagination?.page || 1,
      limit: res.pagination?.limit || 10,
      totalPages: res.pagination?.totalPages || 1,
    };
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data.data;
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await api.put(`/admin/orders/${id}/status`, { status });
    return response.data.data;
  },

  cancel: async (id: string, reason: string): Promise<Order> => {
    const response = await api.post(`/admin/orders/${id}/cancel`, { reason });
    return response.data.data;
  },

  issueRefund: async (id: string, amount?: number, reason?: string): Promise<Order> => {
    const response = await api.post(`/admin/orders/${id}/refund`, { amount, reason });
    return response.data.data;
  },

  assignRider: async (id: string, riderId: string): Promise<Order> => {
    const response = await api.put(`/admin/orders/${id}/assign-rider`, { riderId });
    return response.data.data;
  },

  getRecent: async (limit: number = 10): Promise<Order[]> => {
    const response = await api.get('/public/admin-orders', { params: { limit } });
    return response.data.data || [];
  },
};

export default ordersApi;
