'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ticketsApi } from '@/services/api';
import type { Ticket, TicketReply } from '@/types';
import {
  ArrowLeft,
  User,
  Clock,
  MessageSquare,
  Link as LinkIcon,
  Loader2,
  Send,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Ticket['priority'] | ''>('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await ticketsApi.getById(id);
        setTicket(data);
        setSelectedPriority(data.priority);
      } catch (error) {
        console.error('Failed to fetch ticket:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  const getStatusBadge = (status: Ticket['status']) => {
    const statusStyles: Record<string, string> = {
      open: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityBadge = (priority: Ticket['priority']) => {
    const priorityStyles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return priorityStyles[priority] || 'bg-gray-100 text-gray-700';
  };

  const getTypeBadge = (type: Ticket['type']) => {
    const typeStyles: Record<string, string> = {
      delivery: 'bg-purple-100 text-purple-700',
      payment: 'bg-green-100 text-green-700',
      product: 'bg-blue-100 text-blue-700',
      store: 'bg-orange-100 text-orange-700',
      rider: 'bg-cyan-100 text-cyan-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return typeStyles[type] || 'bg-gray-100 text-gray-700';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) return;
    
    setIsSending(true);
    try {
      const message = await ticketsApi.reply(id, replyMessage);
      setTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          replies: [...(prev.replies || []), message],
        };
      });
      setReplyMessage('');
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleResolve = async () => {
    setIsSending(true);
    try {
      const updatedTicket = await ticketsApi.resolve(id, 'Resolved by admin');
      setTicket(updatedTicket);
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdatePriority = async () => {
    if (!selectedPriority || selectedPriority === ticket?.priority) return;
    
    setIsSending(true);
    try {
      const updatedTicket = await ticketsApi.updatePriority(id, selectedPriority);
      setTicket(updatedTicket);
    } catch (error) {
      console.error('Failed to update priority:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <MessageSquare className="h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Ticket not found</h2>
        <Button className="mt-4" onClick={() => window.history.back()}>
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket.id.slice(0, 8)}...</h1>
            <p className="text-gray-500">
              Created {format(new Date(ticket.createdAt), 'PPP at p')}
            </p>
          </div>
        </div>
        {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
          <Button onClick={handleResolve} disabled={isSending}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Resolve
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversation */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4">
                  {ticket.replies?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.user?.role === 'admin' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={undefined} />
                        <AvatarFallback className={message.user?.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}>
                          {getInitials(message.user?.name || 'User')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[70%] ${message.user?.role === 'admin' ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{message.user?.name || 'User'}</span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(message.createdAt), 'p')}
                          </span>
                        </div>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.user?.role === 'admin'
                              ? 'bg-blue-600 text-white'
                              : message.isInternal
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                <>
                  <Separator className="my-4" />
                  <div className="flex gap-3">
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button onClick={handleReply} disabled={isSending || !replyMessage.trim()}>
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">Current Status</Label>
                <Badge className={`mt-1 ${getStatusBadge(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>

              <Separator />

              <div>
                <Label className="text-sm text-gray-500">Type</Label>
                <Badge className={`mt-1 ${getTypeBadge(ticket.type)}`}>
                  {ticket.type}
                </Badge>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Priority</Label>
                <div className="flex gap-2 mt-1">
                  <Badge className={getPriorityBadge(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>

              {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                <div className="space-y-2">
                  <Label>Update Priority</Label>
                  <div className="flex gap-2">
                    <Select value={selectedPriority} onValueChange={(v) => setSelectedPriority(v as Ticket['priority'])}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleUpdatePriority} disabled={isSending || selectedPriority === ticket.priority} size="sm">
                      Update
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">{ticket.user?.name || 'N/A'}</p>
              <p className="text-sm text-gray-500">{ticket.user?.email || ticket.user?.phone || 'N/A'}</p>
            </CardContent>
          </Card>

          {/* Linked Order */}
          {ticket.orderId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Linked Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/admin/orders/${ticket.orderId}`}
                  className="text-blue-600 hover:underline"
                >
                  Order #{ticket.orderId.slice(0, 8)}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Assigned To */}
          {ticket.assignedTo && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned To</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{ticket.assignee?.name || 'N/A'}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
