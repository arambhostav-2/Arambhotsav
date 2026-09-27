// Server-side Supabase client. The client reads the Bearer token
// from the Authorization request header (sent by the browser).

import { createClient } from '@supabase/supabase-js';

export function getSupabaseServer() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, detectSessionInUrl: false, autoRefreshToken: false },
  });
}

/** Verify the Authorization header (Bearer token) or x-admin-key fallback, and return the user's email, or null. */
export async function verifyToken(req: Request): Promise<string | null> {
  try {
    const token =
      (req.headers.get('authorization')?.replace('Bearer ', '') || '') ||
      req.headers.get('x-admin-key');
    if (!token) return null;
    const sb = getSupabaseServer();
    // If it's the admin password key, allow directly
    if (token === (process.env.ADMIN_PASSWORD)) {
      return process.env.ADMIN_EMAIL ?? null;
    }
    const { data: { user } } = await sb.auth.getUser(token);
    return user?.email ?? null;
  } catch {
    return null;
  }
}
