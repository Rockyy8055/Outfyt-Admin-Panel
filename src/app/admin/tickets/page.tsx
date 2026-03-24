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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ticketsApi } from '@/services/api';
import type { Ticket, PaginatedResponse } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<PaginatedResponse<Ticket> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Ticket['status'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<Ticket['type'] | 'all'>('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ticketsApi.getAll({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const getStatusBadge = (status: Ticket['status']) => {
    const statusStyles: Record<string, string> = {
      OPEN: 'bg-yellow-100 text-yellow-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      RESOLVED: 'bg-green-100 text-green-700',
      CLOSED: 'bg-gray-100 text-gray-700',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityBadge = (priority: Ticket['priority']) => {
    const priorityStyles: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-orange-100 text-orange-700',
      URGENT: 'bg-red-100 text-red-700',
    };
    return priorityStyles[priority] || 'bg-gray-100 text-gray-700';
  };

  const getTypeBadge = (type: Ticket['type']) => {
    const typeStyles: Record<string, string> = {
      DELIVERY: 'bg-purple-100 text-purple-700',
      PAYMENT: 'bg-green-100 text-green-700',
      PRODUCT: 'bg-blue-100 text-blue-700',
      STORE: 'bg-orange-100 text-orange-700',
      RIDER: 'bg-cyan-100 text-cyan-700',
      OTHER: 'bg-gray-100 text-gray-700',
    };
    return typeStyles[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <p className="text-gray-500">Manage customer support tickets</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tickets..."
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
                setStatusFilter(value as Ticket['status'] | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as Ticket['type'] | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DELIVERY">Delivery</SelectItem>
                <SelectItem value="PAYMENT">Payment</SelectItem>
                <SelectItem value="PRODUCT">Product</SelectItem>
                <SelectItem value="STORE">Store</SelectItem>
                <SelectItem value="RIDER">Rider</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
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
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No tickets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets?.data.map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/admin/tickets/${ticket.id}`}
                        className="contents"
                      >
                        <TableRow className="cursor-pointer hover:bg-gray-50">
                          <TableCell className="font-medium">
                            #{ticket.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{ticket.user?.name || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{ticket.user?.phone || 'N/A'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeBadge(ticket.type)}>
                              {ticket.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {ticket.subject}
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityBadge(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(ticket.status)}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {format(new Date(ticket.createdAt), 'dd MMM, HH:mm')}
                          </TableCell>
                        </TableRow>
                      </Link>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {tickets && tickets.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * 10) + 1} to{' '}
                    {Math.min(page * 10, tickets.total)} of {tickets.total} tickets
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm">Page {page} of {tickets.totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === tickets.totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(tickets.totalPages)} disabled={page === tickets.totalPages}>
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
