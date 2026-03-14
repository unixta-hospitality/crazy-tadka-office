import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client.
 * Prefers service role key (bypasses RLS) but falls back to anon key.
 * Returns null when no Supabase credentials are configured at all.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const key = serviceKey || anonKey;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY required)');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Try to create a server client — returns null instead of throwing.
 * Use this when Supabase is optional (e.g., feature toggles with fallback).
 */
export function tryCreateServerClient() {
  try {
    return createServerClient();
  } catch {
    return null;
  }
}
