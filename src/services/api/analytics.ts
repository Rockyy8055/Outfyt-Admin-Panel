import api from './config';
import type { DashboardStats, AnalyticsData } from '@/types';

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface DashboardResponse {
  overview: DashboardStats;
  recentOrders: any[];
}

export const analyticsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/public/admin-dashboard');
    // Backend returns { success, data: { overview: {...}, recentOrders: [...] } }
    return response.data.data.overview;
  },

  getRecentOrders: async (limit: number = 10): Promise<any[]> => {
    const response = await api.get('/public/admin-dashboard');
    return response.data.data.recentOrders || [];
  },

  getOrdersAnalytics: async (params: DateRangeParams): Promise<AnalyticsData['ordersCount']> => {
    const response = await api.get('/public/admin-analytics', { params });
    return response.data.data.ordersByDay || [];
  },

  getRevenueAnalytics: async (params: DateRangeParams): Promise<AnalyticsData['revenue']> => {
    const response = await api.get('/public/admin-analytics', { params });
    return response.data.data.revenueByDay || [];
  },

  getUsersAnalytics: async (params: DateRangeParams): Promise<AnalyticsData['activeUsers']> => {
    const response = await api.get('/public/admin-analytics', { params });
    return response.data.data.ordersByDay || [];
  },

  getFullAnalytics: async (params: DateRangeParams): Promise<AnalyticsData> => {
    const response = await api.get('/public/admin-analytics', { params });
    return response.data.data;
  },
};

export default analyticsApi;
