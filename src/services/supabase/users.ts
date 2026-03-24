import { createClient } from '@/lib/supabase/client';
import type { User, PaginatedResponse } from '@/types';

interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'blocked';
}

export const usersApi = {
  async getAll(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    const supabase = createClient();
    
    let query = supabase
      .from('users')
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
      data: data as User[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async getById(id: string): Promise<User> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as User;
  },

  async block(id: string, reason?: string): Promise<User> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('users')
      .update({ status: 'blocked' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as User;
  },

  async unblock(id: string): Promise<User> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as User;
  },

  async search(query: string): Promise<User[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(10);

    if (error) throw new Error(error.message);
    return data as User[];
  },
};
