'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { analyticsApi } from '@/services/api';
import type { AnalyticsData, DashboardStats } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, TrendingDown, Package, DollarSign, Users, Store } from 'lucide-react';

type DateRange = '7d' | '30d' | '90d' | '1y';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const endDate = new Date();
        const startDate = new Date();
        
        switch (dateRange) {
          case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
          case '1y':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        }

        const [statsData, analytics] = await Promise.all([
          analyticsApi.getDashboardStats(),
          analyticsApi.getFullAnalytics({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
        ]);

        setStats(statsData);
        setAnalyticsData(analytics);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Active Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: '+15%',
      trendUp: true,
    },
    {
      title: 'Active Stores',
      value: stats?.activeStores || 0,
      icon: Store,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: '+5%',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Platform performance metrics</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trendUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {stat.trend}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">{stat.title}</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData?.ordersCount || []}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    labelFormatter={(label) => formatDate(label as string)}
                    formatter={(value) => [value as number, 'Orders']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOrders)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData?.revenue || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    labelFormatter={(label) => formatDate(label as string)}
                    formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Active Users Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active Users Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData?.activeUsers || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    labelFormatter={(label) => formatDate(label as string)}
                    formatter={(value) => [value as number, 'Active Users']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Pending</span>
                  <span className="font-medium">{stats?.pendingOrders || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Delivered</span>
                  <span className="font-medium">{stats?.deliveredOrders || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Cancelled</span>
                  <span className="font-medium">{stats?.cancelledOrders || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Active Riders</span>
                  <span className="font-medium">{stats?.activeRiders || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Avg. Delivery Time</span>
                  <span className="font-medium">32 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Order Success Rate</span>
                  <span className="font-medium text-green-600">94.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Customer Satisfaction</span>
                  <span className="font-medium">4.6/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Refund Rate</span>
                  <span className="font-medium text-red-600">2.3%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Men&apos;s Fashion</span>
                  <span className="font-medium">35%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Women&apos;s Fashion</span>
                  <span className="font-medium">28%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Accessories</span>
                  <span className="font-medium">18%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Footwear</span>
                  <span className="font-medium">19%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
