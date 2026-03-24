'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ordersApi } from '@/services/api';
import type { Order, OrderStatus, PaginatedResponse } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Filter,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const orderStatuses: OrderStatus[] = [
  'PENDING',
  'ACCEPTED',
  'PACKING',
  'READY',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<PaginatedResponse<Order> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>(
    (searchParams.get('status') as OrderStatus) || 'all'
  );
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const data = await ordersApi.getAll(params as any);
      setOrders(data);

      // Update URL params
      const urlParams = new URLSearchParams();
      if (debouncedSearch) urlParams.set('search', debouncedSearch);
      if (statusFilter !== 'all') urlParams.set('status', statusFilter);
      if (startDate) urlParams.set('startDate', startDate);
      if (endDate) urlParams.set('endDate', endDate);
      if (page > 1) urlParams.set('page', page.toString());
      router.push(`/admin/orders?${urlParams.toString()}`, { scroll: false });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, startDate, endDate, router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const getPaymentBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      SUCCESS: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-700';
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || startDate || endDate;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">Manage and track all orders</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by order ID, customer name, phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-gray-100' : ''}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
                    Active
                  </span>
                )}
              </Button>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value as OrderStatus | 'all');
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {orderStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders?.data.map((order) => (
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
                          <TableCell>
                            <Badge className={getPaymentBadge(order.paymentStatus)}>
                              {order.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.totalAmount)}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {format(new Date(order.createdAt), 'dd MMM, HH:mm')}
                          </TableCell>
                        </TableRow>
                      </Link>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {orders && orders.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * 10) + 1} to{' '}
                    {Math.min(page * 10, orders.total)} of {orders.total} orders
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm">
                      Page {page} of {orders.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === orders.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(orders.totalPages)}
                      disabled={page === orders.totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
