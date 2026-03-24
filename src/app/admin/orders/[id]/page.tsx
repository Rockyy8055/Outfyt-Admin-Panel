'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Label } from '@/components/ui/label';
import { ordersApi, ridersApi, paymentsApi } from '@/services/api';
import type { Order, OrderStatus, Rider, Payment } from '@/types';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
  Package,
  User,
  Store,
  Bike,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

const orderStatuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [availableRiders, setAvailableRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number | null>(null);
  const [selectedRider, setSelectedRider] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderData = await ordersApi.getById(id);
        setOrder(orderData);
        setSelectedStatus(orderData.status);
        
        const paymentsData = await paymentsApi.getByOrderId(id);
        setPayments(paymentsData);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const fetchAvailableRiders = async () => {
    try {
      const riders = await ridersApi.getAvailable();
      setAvailableRiders(riders);
    } catch (error) {
      console.error('Failed to fetch riders:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-orange-100 text-orange-700',
      ready: 'bg-purple-100 text-purple-700',
      picked_up: 'bg-indigo-100 text-indigo-700',
      in_transit: 'bg-cyan-100 text-cyan-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-700';
  };

  const getPaymentBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-purple-100 text-purple-700',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-700';
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus || selectedStatus === order?.status) return;
    
    setIsUpdating(true);
    try {
      const updatedOrder = await ordersApi.updateStatus(id, selectedStatus);
      setOrder(updatedOrder);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    
    setIsUpdating(true);
    try {
      const updatedOrder = await ordersApi.cancel(id, cancelReason);
      setOrder(updatedOrder);
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefund = async () => {
    setIsUpdating(true);
    try {
      const updatedOrder = await ordersApi.issueRefund(
        id,
        refundAmount || undefined,
        refundReason || undefined
      );
      setOrder(updatedOrder);
      setShowRefundDialog(false);
      setRefundReason('');
      setRefundAmount(null);
    } catch (error) {
      console.error('Failed to issue refund:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignRider = async () => {
    if (!selectedRider) return;
    
    setIsUpdating(true);
    try {
      const updatedOrder = await ordersApi.assignRider(id, selectedRider);
      setOrder(updatedOrder);
      setShowAssignDialog(false);
      setSelectedRider('');
    } catch (error) {
      console.error('Failed to assign rider:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getTimelineIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'confirmed':
        return CheckCircle;
      case 'preparing':
        return Package;
      case 'ready':
        return Package;
      case 'picked_up':
        return Bike;
      case 'in_transit':
        return Bike;
      case 'delivered':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Order not found</h2>
        <Button className="mt-4" onClick={() => router.push('/admin/orders')}>
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-gray-500">
              Created {format(new Date(order.createdAt), 'PPP at p')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <>
              <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Order
              </Button>
              {order.paymentStatus === 'paid' && (
                <Button variant="outline" onClick={() => setShowRefundDialog(true)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refund
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover rounded-lg" />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{order.deliveryAddress.street}</p>
              {order.deliveryAddress.landmark && (
                <p className="text-gray-500">{order.deliveryAddress.landmark}</p>
              )}
              <p className="text-gray-500">
                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
              </p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {order.timeline.map((event, index) => {
                    const Icon = getTimelineIcon(event.status);
                    return (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`rounded-full p-2 ${
                            index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {index < order.timeline.length - 1 && (
                            <div className="h-full w-px bg-gray-200" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="font-medium capitalize">{event.status.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-500">{event.description}</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(event.timestamp), 'PPp')}
                            {event.actor && ` by ${event.actor}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">Current Status</Label>
                <Badge className={`mt-1 ${getStatusBadge(order.status)}`}>
                  {order.status.replace('_', ' ')}
                </Badge>
              </div>

              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <div className="space-y-2">
                  <Label>Update Status</Label>
                  <div className="flex gap-2">
                    <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as OrderStatus)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleStatusUpdate} disabled={isUpdating || selectedStatus === order.status}>
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <Label className="text-sm text-gray-500">Payment Status</Label>
                <Badge className={`mt-1 ${getPaymentBadge(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </Badge>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Payment Method</Label>
                <p className="font-medium capitalize">{order.paymentMethod}</p>
              </div>
            </CardContent>
          </Card>

          {/* Customer Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="h-4 w-4" />
                {order.customerPhone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4" />
                {order.customerEmail}
              </div>
              <Link
                href={`/admin/users/${order.customerId}`}
                className="text-sm text-blue-600 hover:underline"
              >
                View customer profile
              </Link>
            </CardContent>
          </Card>

          {/* Store Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">{order.storeName}</p>
              <Link
                href={`/admin/stores/${order.storeId}`}
                className="text-sm text-blue-600 hover:underline"
              >
                View store profile
              </Link>
            </CardContent>
          </Card>

          {/* Rider Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bike className="h-5 w-5" />
                Delivery Partner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.riderId && order.riderName ? (
                <>
                  <p className="font-medium">{order.riderName}</p>
                  <Link
                    href={`/admin/riders/${order.riderId}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View rider profile
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-gray-500">No rider assigned yet</p>
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        fetchAvailableRiders();
                        setShowAssignDialog(true);
                      }}
                    >
                      Assign Rider
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for cancellation</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter the reason for cancellation..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isUpdating || !cancelReason.trim()}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Refund</DialogTitle>
            <DialogDescription>
              Process a refund for this order. Leave amount empty for full refund.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Refund Amount (Optional)</Label>
              <input
                type="number"
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                value={refundAmount || ''}
                onChange={(e) => setRefundAmount(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder={`Full refund: ${formatCurrency(order.total)}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter the reason for refund..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Rider Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery Partner</DialogTitle>
            <DialogDescription>
              Select an available rider to assign to this order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Rider</Label>
              <Select value={selectedRider} onValueChange={setSelectedRider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a rider" />
                </SelectTrigger>
                <SelectContent>
                  {availableRiders.map((rider) => (
                    <SelectItem key={rider.id} value={rider.id}>
                      {rider.name} - {rider.vehicleType} ({rider.rating} rating)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRider} disabled={isUpdating || !selectedRider}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign Rider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
