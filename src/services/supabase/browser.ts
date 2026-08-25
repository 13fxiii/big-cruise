import { createBrowserClient } from '@supabase/ssr';
import { getPublicEnv } from '@/lib/env';

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase public environment variables are not configured.');
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
