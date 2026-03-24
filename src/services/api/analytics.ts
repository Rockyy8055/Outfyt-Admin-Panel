import api from './config';
import type { DashboardStats, AnalyticsData } from '@/types';

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export const analyticsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/admin/dashboard');
    return response.data.data;
  },

  getOrdersAnalytics: async (params: DateRangeParams): Promise<AnalyticsData['ordersCount']> => {
    const response = await api.get('/admin/analytics', { params });
    return response.data.data;
  },

  getRevenueAnalytics: async (params: DateRangeParams): Promise<AnalyticsData['revenue']> => {
    const response = await api.get('/admin/analytics', { params });
    return response.data.data;
  },

  getUsersAnalytics: async (params: DateRangeParams): Promise<AnalyticsData['activeUsers']> => {
    const response = await api.get('/admin/analytics', { params });
    return response.data.data;
  },

  getFullAnalytics: async (params: DateRangeParams): Promise<AnalyticsData> => {
    const response = await api.get('/admin/analytics', { params });
    return response.data.data;
  },
};

export default analyticsApi;
