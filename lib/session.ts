'use client';

// Tiny client session: Supabase-authenticated email OR guest details.
// Persisted in localStorage so the booking form can pre-fill.
export type UserSession = { name?: string; phone?: string; email: string };

const KEY = 'garba-user';

export function getSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UserSession) : null;
  } catch {
    return null;
  }
}

export function setSession(s: UserSession) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function supabaseAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
