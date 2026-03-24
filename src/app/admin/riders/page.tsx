'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { ridersApi } from '@/services/api';
import type { Rider, PaginatedResponse } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Check,
  Ban,
  Star,
  Bike,
  Car,
} from 'lucide-react';
import { format } from 'date-fns';

export default function RidersPage() {
  const [riders, setRiders] = useState<PaginatedResponse<Rider> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [page, setPage] = useState(1);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchRiders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ridersApi.getAll({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        isBlocked: statusFilter !== 'all' ? statusFilter === 'blocked' : undefined,
      });
      setRiders(data);
    } catch (error) {
      console.error('Failed to fetch riders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const getInitials = (name: string) => {
    return (name || 'R')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (rider: Rider) => {
    if (rider.isBlocked) {
      return 'bg-red-100 text-red-700';
    }
    return 'bg-green-100 text-green-700';
  };

  const getStatusText = (rider: Rider) => {
    return rider.isBlocked ? 'Blocked' : 'Active';
  };

  const getVehicleIcon = (type: Rider['vehicleType']) => {
    switch (type) {
      case 'bike':
        return Bike;
      case 'car':
        return Car;
      case 'scooter':
        return Bike;
      default:
        return Bike;
    }
  };

  const handleApprove = async (rider: Rider) => {
    setIsUpdating(true);
    try {
      await ridersApi.approve(rider.id);
      await fetchRiders();
    } catch (error) {
      console.error('Failed to approve rider:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedRider || !suspendReason.trim()) return;
    
    setIsUpdating(true);
    try {
      await ridersApi.suspend(selectedRider.id, suspendReason);
      await fetchRiders();
      setShowSuspendDialog(false);
      setSelectedRider(null);
      setSuspendReason('');
    } catch (error) {
      console.error('Failed to suspend rider:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActivate = async (rider: Rider) => {
    setIsUpdating(true);
    try {
      await ridersApi.activate(rider.id);
      await fetchRiders();
    } catch (error) {
      console.error('Failed to activate rider:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Riders</h1>
        <p className="text-gray-500">Manage delivery partners</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search riders..."
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
                setStatusFilter(value as 'all' | 'active' | 'blocked');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Riders</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Riders Table */}
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
                    <TableHead>Rider</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deliveries</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riders?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No riders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    riders?.data.map((rider) => (
                      <TableRow key={rider.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{getInitials(rider.name || '')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{rider.name || 'N/A'}</p>
                              <p className="text-sm text-gray-500">ID: {rider.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">{rider.email || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{rider.phone || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Bike className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm">{rider.vehicleType || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{rider.vehicleNumber || 'N/A'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(rider)}>
                            {getStatusText(rider)}
                          </Badge>
                        </TableCell>
                        <TableCell>{rider._count?.deliveries || rider.totalDeliveries || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span>{(rider.rating || 0).toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {format(new Date(rider.createdAt), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!rider.isBlocked && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedRider(rider);
                                  setShowSuspendDialog(true);
                                }}
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                            {rider.isBlocked && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleApprove(rider)}
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" /> Activate
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
              {riders && riders.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * 10) + 1} to{' '}
                    {Math.min(page * 10, riders.total)} of {riders.total} riders
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm">Page {page} of {riders.totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === riders.totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(riders.totalPages)} disabled={page === riders.totalPages}>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Rider</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend {selectedRider?.name}? They will not be able to receive delivery assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for suspension</Label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter the reason for suspension..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={isUpdating || !suspendReason.trim()}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Suspend Rider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
