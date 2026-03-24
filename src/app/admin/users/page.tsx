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
import { usersApi } from '@/services/api';
import type { User, PaginatedResponse } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  MoreHorizontal,
  UserX,
  UserCheck,
  Mail,
  Phone,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

export default function UsersPage() {
  const [users, setUsers] = useState<PaginatedResponse<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await usersApi.getAll({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        isBlocked: statusFilter !== 'all' ? statusFilter === 'blocked' : undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      });
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getInitials = (name: string) => {
    return (name || 'U')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleBlock = async () => {
    if (!selectedUser) return;
    
    setIsUpdating(true);
    try {
      await usersApi.block(selectedUser.id, blockReason);
      await fetchUsers();
      setShowBlockDialog(false);
      setSelectedUser(null);
      setBlockReason('');
    } catch (error) {
      console.error('Failed to block user:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnblock = async (user: User) => {
    setIsUpdating(true);
    try {
      await usersApi.unblock(user.id);
      await fetchUsers();
    } catch (error) {
      console.error('Failed to unblock user:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const openBlockDialog = (user: User) => {
    setSelectedUser(user);
    setShowBlockDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500">Manage platform users</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, or phone..."
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
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="STORE">Store</SelectItem>
                <SelectItem value="RIDER">Rider</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
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
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users?.data.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{getInitials(user.name || '')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name || 'N/A'}</p>
                              <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {user.email || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Phone className="h-3 w-3" />
                              {user.phone || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              !user.isBlocked
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }
                          >
                            {user.isBlocked ? 'Blocked' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {format(new Date(user.createdAt), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!user.isBlocked ? (
                                <DropdownMenuItem onClick={() => openBlockDialog(user)}>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Block User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUnblock(user)}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Unblock User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {users && users.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * 10) + 1} to{' '}
                    {Math.min(page * 10, users.total)} of {users.total} users
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
                      Page {page} of {users.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === users.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(users.totalPages)}
                      disabled={page === users.totalPages}
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

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
            <DialogDescription>
              Are you sure you want to block {selectedUser?.name || 'this user'}? They will not be able to
              place orders or access their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for blocking (Optional)</Label>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter the reason for blocking..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlock} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Block User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
