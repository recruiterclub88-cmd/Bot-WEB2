import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using the Service Role key.
 * Keep these env vars only on the server (Vercel Environment Variables).
 */
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env SUPABASE_URL');
}

if (!serviceRoleKey) {
  throw new Error('Missing env SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
