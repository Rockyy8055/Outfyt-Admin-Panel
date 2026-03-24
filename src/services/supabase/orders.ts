import { createClient } from '@/lib/supabase/client';
import type { Order, OrderStatus, PaginatedResponse, OrderFilters } from '@/types';

export const ordersApi = {
  async getAll(filters?: OrderFilters): Promise<PaginatedResponse<Order>> {
    const supabase = createClient();
    
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters?.search) {
      query = query.or(`order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`);
    }

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order('created_at', { ascending: false });
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    return {
      data: data as Order[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async getById(id: string): Promise<Order> {
    const supabase = createClient();
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) throw new Error(orderError.message);

    // Get timeline
    const { data: timeline, error: timelineError } = await supabase
      .from('order_timeline')
      .select('*')
      .eq('order_id', id)
      .order('timestamp', { ascending: false });

    if (timelineError) throw new Error(timelineError.message);

    return {
      ...order,
      timeline: timeline || [],
    } as Order;
  },

  async updateStatus(id: string, status: OrderStatus, description?: string): Promise<Order> {
    const supabase = createClient();
    
    // Update order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    // Add timeline entry
    await supabase
      .from('order_timeline')
      .insert({
        order_id: id,
        status,
        description: description || `Order status updated to ${status}`,
        actor: 'admin',
      });

    return order as Order;
  },

  async cancel(id: string, reason: string): Promise<Order> {
    const supabase = createClient();
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: 'admin',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    // Add timeline entry
    await supabase
      .from('order_timeline')
      .insert({
        order_id: id,
        status: 'cancelled',
        description: `Order cancelled: ${reason}`,
        actor: 'admin',
      });

    return order as Order;
  },

  async issueRefund(id: string, amount?: number, reason?: string): Promise<Order> {
    const supabase = createClient();
    
    // Get order first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) throw new Error(orderError.message);

    const refundAmount = amount || order.total;

    // Create refund payment record
    await supabase
      .from('payments')
      .insert({
        order_id: id,
        user_id: order.user_id,
        store_id: order.store_id,
        user_name: order.customer_name,
        store_name: order.store_name,
        order_number: order.order_number,
        amount: refundAmount,
        type: 'refund',
        status: 'completed',
        refund_reason: reason,
      });

    // Update order payment status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ payment_status: 'refunded' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    // Add timeline entry
    await supabase
      .from('order_timeline')
      .insert({
        order_id: id,
        status: order.status,
        description: `Refund of ₹${refundAmount} issued. ${reason || ''}`,
        actor: 'admin',
      });

    return updatedOrder as Order;
  },

  async assignRider(id: string, riderId: string): Promise<Order> {
    const supabase = createClient();
    
    // Get rider info
    const { data: rider, error: riderError } = await supabase
      .from('riders')
      .select('id, name')
      .eq('id', riderId)
      .single();

    if (riderError) throw new Error(riderError.message);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        rider_id: riderId,
        rider_name: rider.name,
      })
      .eq('id', id)
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    // Add timeline entry
    await supabase
      .from('order_timeline')
      .insert({
        order_id: id,
        status: order.status,
        description: `Rider ${rider.name} assigned to order`,
        actor: 'admin',
        actor_id: riderId,
      });

    return order as Order;
  },

  async getRecent(limit: number = 10): Promise<Order[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data as Order[];
  },
};
