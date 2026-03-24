'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { paymentsApi } from '@/services/api';
import type { Payment, PaginatedResponse } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaginatedResponse<Payment> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Payment['status'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<Payment['type'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await paymentsApi.getAll({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setPayments(data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: Payment['status']) => {
    const statusStyles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      SUCCESS: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-700';
  };

  const getTypeBadge = (type: Payment['type']) => {
    const typeStyles: Record<string, string> = {
      PAYMENT: 'bg-green-100 text-green-700',
      REFUND: 'bg-purple-100 text-purple-700',
    };
    return typeStyles[type] || 'bg-gray-100 text-gray-700';
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;
    
    setIsRefunding(true);
    try {
      await paymentsApi.refund(selectedPayment.id, refundReason || undefined);
      await fetchPayments();
      setShowRefundDialog(false);
      setSelectedPayment(null);
      setRefundReason('');
    } catch (error) {
      console.error('Failed to process refund:', error);
    } finally {
      setIsRefunding(false);
    }
  };

  const openRefundDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowRefundDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500">Manage transactions and refunds</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by transaction ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as Payment['status'] | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as Payment['type'] | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PAYMENT">Payment</SelectItem>
                <SelectItem value="REFUND">Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
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
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments?.data.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          #{payment.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/orders/${payment.orderId}`}
                            className="text-blue-600 hover:underline"
                          >
                            #{payment.order?.orderNumber || 'N/A'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.user?.name || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{payment.order?.store?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getTypeBadge(payment.type)}>
                            {payment.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {format(new Date(payment.createdAt), 'dd MMM, HH:mm')}
                        </TableCell>
                        <TableCell>
                          {payment.status === 'SUCCESS' && payment.type === 'PAYMENT' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openRefundDialog(payment)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {payments && payments.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * 10) + 1} to{' '}
                    {Math.min(page * 10, payments.total)} of {payments.total} payments
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm">Page {page} of {payments.totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === payments.totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(payments.totalPages)} disabled={page === payments.totalPages}>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Are you sure you want to refund {selectedPayment && formatCurrency(selectedPayment.amount)} for this transaction?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for refund (Optional)</Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter the reason for refund..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Cancel</Button>
            <Button onClick={handleRefund} disabled={isRefunding}>
              {isRefunding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
