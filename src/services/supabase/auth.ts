import { createClient } from '@/lib/supabase/client';
import { createServerClient } from '@supabase/ssr';
import type { Admin, LoginCredentials, AuthResponse } from '@/types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed');

    // Check if user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (adminError || !adminData) {
      throw new Error('Access denied. Not an admin user.');
    }

    // Update last login
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminData.id);

    return {
      token: data.session?.access_token || '',
      admin: adminData as Admin,
    };
  },

  async signup(credentials: { email: string; password: string }): Promise<void> {
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Signup failed');

    // Create admin record
    const { error: adminError } = await supabase
      .from('admins')
      .insert({
        user_id: data.user.id,
        email: credentials.email,
        name: credentials.email.split('@')[0],
        role: 'moderator',
        status: 'active',
      });

    if (adminError) throw new Error(adminError.message);
  },

  async resetPasswordDirect(email: string, newPassword: string): Promise<void> {
    // Call API route to reset password using service role key
    const response = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }
  },

  async resetPassword(email: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw new Error(error.message);
  },

  async updatePassword(newPassword: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw new Error(error.message);
  },

  async logout(): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getProfile(): Promise<Admin> {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw new Error(error.message);
    return data as Admin;
  },

  async updateProfile(id: string, updates: Partial<Admin>): Promise<Admin> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('admins')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Admin;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw new Error(error.message);
  },

  async getSession() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
};
