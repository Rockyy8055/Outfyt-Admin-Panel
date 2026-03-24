import { createClient } from '@/lib/supabase/client';
import type { Ticket, TicketReply, PaginatedResponse } from '@/types';

interface TicketFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: Ticket['status'];
  type?: Ticket['type'];
}

export const ticketsApi = {
  async getAll(filters?: TicketFilters): Promise<PaginatedResponse<Ticket>> {
    const supabase = createClient();
    
    let query = supabase
      .from('tickets')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.search) {
      query = query.or(`ticket_number.ilike.%${filters.search}%,subject.ilike.%${filters.search}%,user_name.ilike.%${filters.search}%`);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order('created_at', { ascending: false });
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    return {
      data: data as Ticket[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async getById(id: string): Promise<Ticket> {
    const supabase = createClient();
    
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (ticketError) throw new Error(ticketError.message);

    // Get conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (conversationError) throw new Error(conversationError.message);

    return {
      ...ticket,
      conversation: conversation || [],
    } as Ticket;
  },

  async assign(id: string, adminId: string, adminName: string): Promise<Ticket> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('tickets')
      .update({
        assigned_to: adminId,
        assigned_to_name: adminName,
        status: 'in_progress',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Add system message
    await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: id,
        sender_name: 'System',
        sender_role: 'system',
        message: `Ticket assigned to ${adminName}`,
      });

    return data as Ticket;
  },

  async reply(id: string, message: string, senderName: string): Promise<TicketReply> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: id,
        sender_name: senderName,
        sender_role: 'admin',
        message,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update ticket status if it was open
    await supabase
      .from('tickets')
      .update({ status: 'IN_PROGRESS' })
      .eq('id', id)
      .eq('status', 'OPEN');

    return data as TicketReply;
  },

  async resolve(id: string, resolution: string): Promise<Ticket> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('tickets')
      .update({
        status: 'RESOLVED',
        resolution,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Add system message
    await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: id,
        sender_name: 'System',
        sender_role: 'system',
        message: `Ticket resolved: ${resolution}`,
      });

    return data as Ticket;
  },

  async close(id: string): Promise<Ticket> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('tickets')
      .update({ status: 'CLOSED' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data as Ticket;
  },

  async reopen(id: string): Promise<Ticket> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('tickets')
      .update({ status: 'OPEN', resolution: null, resolved_at: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Add system message
    await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: id,
        sender_name: 'System',
        sender_role: 'system',
        message: 'Ticket reopened',
      });

    return data as Ticket;
  },

  async updatePriority(id: string, priority: Ticket['priority']): Promise<Ticket> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('tickets')
      .update({ priority })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Ticket;
  },
};
