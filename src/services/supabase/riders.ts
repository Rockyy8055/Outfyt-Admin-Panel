import { createClient } from '@/lib/supabase/client';
import type { Rider, PaginatedResponse } from '@/types';

interface RiderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: Rider['status'];
}

export const ridersApi = {
  async getAll(filters?: RiderFilters): Promise<PaginatedResponse<Rider>> {
    const supabase = createClient();
    
    let query = supabase
      .from('riders')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
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
      data: data as Rider[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async getById(id: string): Promise<Rider> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('riders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as Rider;
  },

  async approve(id: string): Promise<Rider> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('riders')
      .update({ status: 'approved', suspension_reason: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Rider;
  },

  async suspend(id: string, reason: string): Promise<Rider> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('riders')
      .update({ status: 'suspended', suspension_reason: reason, is_available: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Rider;
  },

  async activate(id: string): Promise<Rider> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('riders')
      .update({ status: 'approved', suspension_reason: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Rider;
  },

  async getAvailable(): Promise<Rider[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('riders')
      .select('*')
      .eq('status', 'approved')
      .eq('is_available', true);

    if (error) throw new Error(error.message);
    return data as Rider[];
  },
};
