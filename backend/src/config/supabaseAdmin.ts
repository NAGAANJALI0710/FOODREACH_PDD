import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://ocsgzbmnnldpcsbfgocz.supabase.co';

// Use SUPABASE_SERVICE_KEY (already in backend/.env)
// If the current key is revoked, go to:
//   Supabase Dashboard → Settings → API → Secret keys → "+ New secret key"
// and update SUPABASE_SERVICE_KEY in backend/.env
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

if (!SERVICE_KEY) {
  console.warn(
    '\n[supabaseAdmin] ⚠️  WARNING: No Supabase service key found!\n' +
    '  → Go to Supabase Dashboard → Settings → API → Secret keys → "+ New secret key"\n' +
    '  → Add to backend/.env:  SUPABASE_SERVICE_KEY=sb_secret_...\n' +
    '  Donation API endpoints will fail until this is set.\n'
  );
}

/**
 * Backend-only Supabase admin client.
 * Uses service-role key — bypasses RLS.
 * NEVER expose this client or its key to the frontend.
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
