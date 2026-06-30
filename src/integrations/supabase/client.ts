import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_PUBLISHABLE_KEY = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

export const missingSupabaseEnvVars = [
  !SUPABASE_URL ? 'VITE_SUPABASE_URL' : null,
  !SUPABASE_PUBLISHABLE_KEY
    ? 'VITE_SUPABASE_ANON_KEY o VITE_SUPABASE_PUBLISHABLE_KEY'
    : null,
].filter(Boolean) as string[];

export const isSupabaseConfigured = missingSupabaseEnvVars.length === 0;

if (!isSupabaseConfigured) {
  console.error(
    `Supabase no está configurado. Faltan: ${missingSupabaseEnvVars.join(', ')}`
  );
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
