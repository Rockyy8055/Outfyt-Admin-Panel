'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { storesApi } from '@/services/api';
import type { Store, Product, PaginatedResponse } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Store as StoreIcon,
  Check,
  X,
  Ban,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function StoresPage() {
  const [stores, setStores] = useState<PaginatedResponse<Store> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'disabled'>('all');
  const [page, setPage] = useState(1);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showProductsDialog, setShowProductsDialog] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<PaginatedResponse<Product> | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchStores = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await storesApi.getAll({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        isApproved: statusFilter === 'approved' ? true : undefined,
        isDisabled: statusFilter === 'disabled' ? true : undefined,
      });
      setStores(data);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (store: Store) => {
    if (store.isDisabled) {
      return 'bg-gray-100 text-gray-700';
    }
    if (!store.isApproved) {
      return 'bg-yellow-100 text-yellow-700';
    }
    return 'bg-green-100 text-green-700';
  };

  const getStatusText = (store: Store) => {
    if (store.isDisabled) return 'Disabled';
    if (!store.isApproved) return 'Pending';
    return 'Approved';
  };

  const handleApprove = async (store: Store) => {
    setIsUpdating(true);
    try {
      await storesApi.approve(store.id);
      await fetchStores();
    } catch (error) {
      console.error('Failed to approve store:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!selectedStore || !reason.trim()) return;
    
    setIsUpdating(true);
    try {
      await storesApi.reject(selectedStore.id, reason);
      await fetchStores();
      setShowRejectDialog(false);
      setSelectedStore(null);
      setReason('');
    } catch (error) {
      console.error('Failed to reject store:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDisable = async () => {
    if (!selectedStore || !reason.trim()) return;
    
    setIsUpdating(true);
    try {
      await storesApi.disable(selectedStore.id, reason);
      await fetchStores();
      setShowDisableDialog(false);
      setSelectedStore(null);
      setReason('');
    } catch (error) {
      console.error('Failed to disable store:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEnable = async (store: Store) => {
    setIsUpdating(true);
    try {
      await storesApi.enable(store.id);
      await fetchStores();
    } catch (error) {
      console.error('Failed to enable store:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const viewProducts = async (store: Store) => {
    setSelectedStore(store);
    setShowProductsDialog(true);
    setIsLoadingProducts(true);
    try {
      const data = await storesApi.getProducts(store.id, { limit: 50 });
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
        <p className="text-gray-500">Manage vendor stores</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search stores..."
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
                setStatusFilter(value as 'all' | 'approved' | 'pending' | 'disabled');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stores Table */}
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
                    <TableHead>Store</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No stores found
                      </TableCell>
                    </TableRow>
                  ) : (
                    stores?.data.map((store) => (
                      <TableRow key={store.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                              {store.imageUrl ? (
                                <img src={store.imageUrl} alt={store.name} className="h-full w-full rounded-lg object-cover" />
                              ) : (
                                <StoreIcon className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{store.name}</p>
                              <p className="text-sm text-gray-500">{store.address}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">{store.phone || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{store.owner?.name || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(store)}>
                            {getStatusText(store)}
                          </Badge>
                        </TableCell>
                        <TableCell>{store.totalOrders}</TableCell>
                        <TableCell className="text-gray-500">
                          {format(new Date(store.createdAt), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!store.isApproved && !store.isDisabled && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleApprove(store)}
                                  disabled={isUpdating}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedStore(store);
                                    setShowRejectDialog(true);
                                  }}
                                  disabled={isUpdating}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {store.isApproved && !store.isDisabled && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => viewProducts(store)}
                                >
                                  <Package className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedStore(store);
                                    setShowDisableDialog(true);
                                  }}
                                  disabled={isUpdating}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {store.isDisabled && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleApprove(store)}
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" /> Enable
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {stores && stores.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * 10) + 1} to{' '}
                    {Math.min(page * 10, stores.total)} of {stores.total} stores
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm">Page {page} of {stores.totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === stores.totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(stores.totalPages)} disabled={page === stores.totalPages}>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Store</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {selectedStore?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for rejection</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isUpdating || !reason.trim()}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject Store'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Store</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable {selectedStore?.name}? The store will not be able to receive orders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for disabling</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for disabling..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisable} disabled={isUpdating || !reason.trim()}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable Store'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Products Dialog */}
      <Dialog open={showProductsDialog} onOpenChange={setShowProductsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Products - {selectedStore?.name}</DialogTitle>
          </DialogHeader>
          {isLoadingProducts ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products?.data.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <Badge className={product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {product.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
