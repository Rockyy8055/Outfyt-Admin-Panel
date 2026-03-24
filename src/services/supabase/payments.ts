import { createClient } from '@/lib/supabase/client';
import type { Payment, PaginatedResponse } from '@/types';

interface PaymentFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: Payment['status'];
  type?: Payment['type'];
}

export const paymentsApi = {
  async getAll(filters?: PaymentFilters): Promise<PaginatedResponse<Payment>> {
    const supabase = createClient();
    
    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.search) {
      query = query.ilike('transaction_id', `%${filters.search}%`);
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
      data: data as Payment[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async getById(id: string): Promise<Payment> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as Payment;
  },

  async refund(id: string, reason?: string): Promise<Payment> {
    const supabase = createClient();
    
    // Get original payment
    const { data: originalPayment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (paymentError) throw new Error(paymentError.message);

    // Create refund payment record
    const { data: refundPayment, error: refundError } = await supabase
      .from('payments')
      .insert({
        order_id: originalPayment.order_id,
        user_id: originalPayment.user_id,
        store_id: originalPayment.store_id,
        user_name: originalPayment.user_name,
        store_name: originalPayment.store_name,
        order_number: originalPayment.order_number,
        amount: originalPayment.amount,
        type: 'refund',
        status: 'completed',
        refund_reason: reason,
        refunded_amount: originalPayment.amount,
      })
      .select()
      .single();

    if (refundError) throw new Error(refundError.message);

    // Update original payment status
    await supabase
      .from('payments')
      .update({ status: 'refunded' })
      .eq('id', id);

    // Update order payment status
    await supabase
      .from('orders')
      .update({ payment_status: 'refunded' })
      .eq('id', originalPayment.order_id);

    return refundPayment as Payment;
  },

  async getByOrderId(orderId: string): Promise<Payment[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Payment[];
  },
};
