
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://zqexgraljvprliaufxeg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZXhncmFsanZwcmxpYXVmeGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMTk2OTIsImV4cCI6MjA1NjY5NTY5Mn0.m9i3fhu8yZDbXJNiD4DHXn2hVmkdswyyckt1NOaKzGY";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Add helper function to check if the current session is active
export const isSessionActive = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Define types for the RPC functions to help TypeScript understand the return types
declare module '@supabase/supabase-js' {
  interface SupabaseClient<Database> {
    rpc<T = any>(
      fn: 'get_linked_users',
      params?: {}
    ): Promise<{ data: { email: string, relationship: string }[]; error: Error | null }>;
    rpc<T = any>(
      fn: 'link_users',
      params: { other_user_email: string; relationship_type: string }
    ): Promise<{ data: boolean; error: Error | null }>;
  }
}
