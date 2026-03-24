import api from './config';
import type { Ticket, PaginatedResponse, PaginationParams, TicketFilters, TicketReply } from '@/types';

export interface TicketsQueryParams extends PaginationParams, TicketFilters {}

export const ticketsApi = {
  getAll: async (params: TicketsQueryParams): Promise<PaginatedResponse<Ticket>> => {
    const response = await api.get('/admin/tickets', { params });
    const res = response.data;
    return {
      data: res.data || [],
      total: res.pagination?.total || 0,
      page: res.pagination?.page || 1,
      limit: res.pagination?.limit || 10,
      totalPages: res.pagination?.totalPages || 1,
    };
  },

  getById: async (id: string): Promise<Ticket> => {
    const response = await api.get(`/admin/tickets/${id}`);
    return response.data.data;
  },

  assign: async (id: string, adminId: string): Promise<Ticket> => {
    const response = await api.put(`/admin/tickets/${id}/assign`, { adminId });
    return response.data.data;
  },

  reply: async (id: string, message: string, isInternal: boolean = false): Promise<TicketReply> => {
    const response = await api.post(`/admin/tickets/${id}/reply`, { message, isInternal });
    return response.data.data;
  },

  updateStatus: async (id: string, status: string): Promise<Ticket> => {
    const response = await api.put(`/admin/tickets/${id}/status`, { status });
    return response.data.data;
  },

  resolve: async (id: string, resolution: string): Promise<Ticket> => {
    const response = await api.put(`/admin/tickets/${id}/status`, { status: 'RESOLVED' });
    return response.data.data;
  },

  updatePriority: async (id: string, priority: string): Promise<Ticket> => {
    const response = await api.put(`/admin/tickets/${id}`, { priority });
    return response.data.data;
  },
};

export default ticketsApi;
