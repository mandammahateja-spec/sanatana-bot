/**
 * 🕉️ Sanatana Bot — Supabase Client
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Database features will be disabled.');
}

/**
 * Supabase client using the service role key (bypasses RLS).
 * Will be null if env vars are not configured.
 */
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Check if database is available
 */
export function isDatabaseAvailable() {
  return supabase !== null;
}
