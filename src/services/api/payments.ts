import api from './config';
import type { Payment, PaginatedResponse, PaginationParams } from '@/types';

export interface PaymentsQueryParams extends PaginationParams {
  status?: Payment['status'];
  type?: Payment['type'];
  startDate?: string;
  endDate?: string;
}

export const paymentsApi = {
  getAll: async (params: PaymentsQueryParams): Promise<PaginatedResponse<Payment>> => {
    const response = await api.get('/admin/transactions', { params });
    const res = response.data;
    return {
      data: res.data || [],
      total: res.pagination?.total || 0,
      page: res.pagination?.page || 1,
      limit: res.pagination?.limit || 10,
      totalPages: res.pagination?.totalPages || 1,
    };
  },

  getByOrderId: async (orderId: string): Promise<Payment[]> => {
    const response = await api.get('/admin/transactions', { params: { orderId } });
    return response.data.data || [];
  },

  refund: async (paymentId: string, reason?: string): Promise<void> => {
    await api.post(`/admin/transactions/${paymentId}/refund`, { reason });
  },
};

export default paymentsApi;
