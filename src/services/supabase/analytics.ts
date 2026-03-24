import { createClient } from '@/lib/supabase/client';
import type { DashboardStats, AnalyticsData } from '@/types';

interface AnalyticsFilters {
  startDate: string;
  endDate: string;
}

export const analyticsApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    const supabase = createClient();
    
    // Get total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Get total revenue
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total')
      .eq('status', 'delivered')
      .eq('payment_status', 'paid');

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    // Get active stores
    const { count: activeStores } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    // Get active riders
    const { count: activeRiders } = await supabase
      .from('riders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get pending orders
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get delivered orders
    const { count: deliveredOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'delivered');

    // Get cancelled orders
    const { count: cancelledOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled');

    return {
      totalOrders: totalOrders || 0,
      totalRevenue,
      activeStores: activeStores || 0,
      activeRiders: activeRiders || 0,
      totalUsers: totalUsers || 0,
      pendingOrders: pendingOrders || 0,
      deliveredOrders: deliveredOrders || 0,
      cancelledOrders: cancelledOrders || 0,
    };
  },

  async getOrdersAnalytics(filters: AnalyticsFilters): Promise<{ date: string; count: number }[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('orders')
      .select('created_at')
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate);

    if (error) throw new Error(error.message);

    // Group by date
    const grouped = data?.reduce((acc: Record<string, number>, order) => {
      const date = order.created_at?.split('T')[0] || '';
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped || {}).map(([date, count]) => ({ date, count }));
  },

  async getRevenueAnalytics(filters: AnalyticsFilters): Promise<{ date: string; amount: number }[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total')
      .eq('status', 'delivered')
      .eq('payment_status', 'paid')
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate);

    if (error) throw new Error(error.message);

    // Group by date
    const grouped = data?.reduce((acc: Record<string, number>, order) => {
      const date = order.created_at?.split('T')[0] || '';
      acc[date] = (acc[date] || 0) + (order.total || 0);
      return acc;
    }, {});

    return Object.entries(grouped || {}).map(([date, amount]) => ({ date, amount }));
  },

  async getUsersAnalytics(filters: AnalyticsFilters): Promise<{ date: string; count: number }[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('orders')
      .select('created_at, user_id')
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate);

    if (error) throw new Error(error.message);

    // Group by date and count unique users
    const grouped = data?.reduce((acc: Record<string, Set<string>>, order) => {
      const date = order.created_at?.split('T')[0] || '';
      if (!acc[date]) acc[date] = new Set();
      if (order.user_id) acc[date].add(order.user_id);
      return acc;
    }, {} as Record<string, Set<string>>);

    return Object.entries(grouped || {}).map(([date, users]) => ({ date, count: users.size }));
  },

  async getFullAnalytics(filters: AnalyticsFilters): Promise<AnalyticsData> {
    const [ordersCount, revenue, activeUsers] = await Promise.all([
      this.getOrdersAnalytics(filters),
      this.getRevenueAnalytics(filters),
      this.getUsersAnalytics(filters),
    ]);

    return {
      ordersCount,
      revenue,
      activeUsers,
    };
  },
};
