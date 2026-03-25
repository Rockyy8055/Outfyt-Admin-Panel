'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { analyticsApi } from '@/services/api';
import type { DashboardStats, Order } from '@/types';
import {
  Package,
  DollarSign,
  Store,
  Bike,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, ordersData] = await Promise.all([
          analyticsApi.getDashboardStats(),
          analyticsApi.getRecentOrders(10),
        ]);
        setStats(statsData);
        setRecentOrders(ordersData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      ACCEPTED: 'bg-blue-100 text-blue-700',
      PACKING: 'bg-orange-100 text-orange-700',
      READY: 'bg-purple-100 text-purple-700',
      PICKED_UP: 'bg-indigo-100 text-indigo-700',
      OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-700';
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Stores',
      value: stats?.activeStores || 0,
      icon: Store,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Active Riders',
      value: stats?.activeRiders || 0,
      icon: Bike,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const orderStatusCards = [
    {
      title: 'Pending',
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Delivered',
      value: stats?.deliveredOrders || 0,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Cancelled',
      value: stats?.cancelledOrders || 0,
      icon: XCircle,
      color: 'text-red-600',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here&apos;s what&apos;s happening with your platform.</p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="flex items-center p-6">
              <div className={`mr-4 rounded-lg p-3 ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {orderStatusCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                )}
              </div>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      No recent orders
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="contents"
                    >
                      <TableRow className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium">
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.user?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{order.user?.phone || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.store?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(order.status)}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                      </TableRow>
                    </Link>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
