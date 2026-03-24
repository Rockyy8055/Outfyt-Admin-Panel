import { createClient } from '@/lib/supabase/client';
import type { SearchResult } from '@/types';

export const searchApi = {
  async global(query: string): Promise<SearchResult> {
    const supabase = createClient();
    
    const [orders, users, stores] = await Promise.all([
      this.searchOrders(query),
      this.searchUsers(query),
      this.searchStores(query),
    ]);

    return { orders, users, stores };
  },

  async searchOrders(query: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, status, total, created_at')
      .or(`order_number.ilike.%${query}%,customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%`)
      .limit(5);

    if (error) throw new Error(error.message);
    return data?.map(order => ({
      id: order.id,
      type: 'order' as const,
      title: `#${order.order_number}`,
      subtitle: order.customer_name,
      status: order.status,
    })) || [];
  },

  async searchUsers(query: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, status')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(5);

    if (error) throw new Error(error.message);
    return data?.map(user => ({
      id: user.id,
      type: 'user' as const,
      title: user.name,
      subtitle: user.email || user.phone,
      status: user.status,
    })) || [];
  },

  async searchStores(query: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, email, status')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(5);

    if (error) throw new Error(error.message);
    return data?.map(store => ({
      id: store.id,
      type: 'store' as const,
      title: store.name,
      subtitle: store.email || '',
      status: store.status,
    })) || [];
  },
};
