'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  AuthShell,
  Field,
  Spinner,
  ToastView,
  isEmail,
  type Toast,
} from '@/components/auth/AuthUI';
import { getSupabaseBrowser, appUrl } from '@/lib/supabase-browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<Toast>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setToast(null);
    setError('');
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!isEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setToast({ kind: 'error', msg: 'Auth backend not connected. Add Supabase keys first.' });
      return;
    }
    setBusy(true);
    try {
      const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${appUrl()}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      setToast({ kind: 'success', msg: `Reset link sent to ${email.trim()} — check inbox & spam.` });
    } catch (err: unknown) {
      setToast({ kind: 'error', msg: err instanceof Error ? err.message : 'Could not send reset link.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <AuthShell
        title="Forgot Password"
        subtitle="Enter your account email — we'll send a secure reset link."
        footer={
          <p className="text-orange-100/75">
            Remembered it?{' '}
            <Link href="/login" className="text-gold font-semibold hover:underline">
              Back to Login
            </Link>
          </p>
        }
      >
        <div className="space-y-3">
          <ToastView toast={toast} />
        </div>
        {sent ? (
          <div className="mt-4 rounded-2xl bg-emerald-500/10 border border-emerald-300/30 p-5 text-center">
            <p className="text-4xl">📩</p>
            <p className="font-display text-xl text-emerald-200 mt-2">Check your email</p>
            <p className="text-sm text-orange-100/70 mt-1">
              Click the link to create a new password, then login.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
            <Field label="EMAIL ADDRESS" error={error}>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">✉️</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-2xl bg-black/50 border border-gold/30 pl-11 pr-4 py-3.5 text-[15px] placeholder:text-orange-100/35 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </Field>
            <button disabled={busy} className="btn-festive w-full !py-3.5 disabled:opacity-60">
              {busy ? (
                <>
                  <Spinner /> Sending link…
                </>
              ) : (
                'Send Reset Link →'
              )}
            </button>
          </form>
        )}
      </AuthShell>
    </main>
  );
}
