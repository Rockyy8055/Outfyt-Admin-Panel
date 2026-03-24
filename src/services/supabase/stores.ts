import { createClient } from '@/lib/supabase/client';
import type { Store, Product, PaginatedResponse } from '@/types';

interface StoreFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: Store['status'];
}

interface ProductFilters {
  page?: number;
  limit?: number;
}

export const storesApi = {
  async getAll(filters?: StoreFilters): Promise<PaginatedResponse<Store>> {
    const supabase = createClient();
    
    let query = supabase
      .from('stores')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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
      data: data as Store[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async getById(id: string): Promise<Store> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as Store;
  },

  async approve(id: string): Promise<Store> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('stores')
      .update({ status: 'approved', rejection_reason: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Store;
  },

  async reject(id: string, reason: string): Promise<Store> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('stores')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Store;
  },

  async disable(id: string, reason: string): Promise<Store> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('stores')
      .update({ status: 'disabled', rejection_reason: reason })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Store;
  },

  async enable(id: string): Promise<Store> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('stores')
      .update({ status: 'approved', rejection_reason: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Store;
  },

  async getProducts(storeId: string, filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const supabase = createClient();
    
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .range(from, to);

    if (error) throw new Error(error.message);

    return {
      data: data as Product[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async search(query: string): Promise<Store[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);

    if (error) throw new Error(error.message);
    return data as Store[];
  },
};
