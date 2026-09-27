'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import {
  AuthShell,
  AuthFooterLinks,
  Field,
  PasswordField,
  Spinner,
  ToastView,
  isEmail,
  type Toast,
} from '@/components/auth/AuthUI';
import { getSupabaseBrowser, supabaseBrowserConfigured } from '@/lib/supabase-browser';
import { setSession } from '@/lib/session';

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [toast, setToast] = useState<Toast>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  // Legacy support: /login?mode=signup -> /signup
  useEffect(() => {
    if (sp.get('mode') === 'signup') router.replace('/signup');
  }, [sp, router]);

  // If already logged in -> Events/Home
  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      if (!sb) {
        setChecking(false);
        return;
      }
      const { data } = await sb.auth.getSession();
      if (data.session) {
        const next = sp.get('redirect') || '/';
        router.replace(next);
      } else {
        setChecking(false);
      }
    })();
  }, [router, sp]);

  useEffect(() => {
    if (sp.get('registered') === '1')
      setToast({ kind: 'success', msg: 'Account created! Please login with your email & password.' });
    if (sp.get('reset') === 'success')
      setToast({ kind: 'success', msg: 'Password updated! Login with your new password.' });
  }, [sp]);

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!isEmail(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onLogin(ev: React.FormEvent) {
    ev.preventDefault();
    setToast(null);
    if (!validate()) return;
    const sb = getSupabaseBrowser();
    if (!sb || !supabaseBrowserConfigured()) {
      setToast({ kind: 'error', msg: 'Auth backend not connected. Add Supabase keys to .env.local and restart.' });
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes('invalid login') || m.includes('invalid credentials'))
          throw new Error('Invalid email or password. Please try again.');
        if (m.includes('email not confirmed'))
          throw new Error('Please verify your email first — check your inbox for the confirmation link.');
        throw error;
      }
      const user = data.user;
      // Fetch profile for name/phone to prefill booking
      let fullName = (user?.user_metadata as { full_name?: string })?.full_name;
      let phone = (user?.user_metadata as { phone?: string })?.phone ?? '';
      if (user) {
        const { data: prof } = await sb
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .maybeSingle();
        if (prof) {
          fullName = (prof as { full_name?: string }).full_name ?? fullName;
          phone = (prof as { phone?: string }).phone ?? phone;
        }
      }
      setSession({ name: fullName || undefined, phone: phone || '', email: email.trim().toLowerCase() });
      try {
        window.dispatchEvent(new Event('storage'));
      } catch {}
      setToast({ kind: 'success', msg: 'Welcome back! Redirecting to events…' });
      setTimeout(() => router.replace(sp.get('redirect') || '/'), 700);
    } catch (err: unknown) {
      setToast({ kind: 'error', msg: err instanceof Error ? err.message : 'Login failed. Try again.' });
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Navbar />
        <div className="flex flex-col items-center gap-3">
          <div className="rangoli" />
          <p className="font-display text-gold tracking-widest text-sm">CHECKING SESSION…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <AuthShell
        title="Welcome Back"
        subtitle="Login to book Garba nights, manage tickets & check-in faster."
        footer={<AuthFooterLinks mode="login" />}
      >
        <div className="space-y-3">
          <ToastView toast={toast} />
        </div>
        <form onSubmit={onLogin} className="mt-4 space-y-4" noValidate>
          <Field label="EMAIL ADDRESS" error={errors.email}>
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

          <Field label="PASSWORD" error={errors.password}>
            <PasswordField value={password} onChange={setPassword} placeholder="Enter your password" />
          </Field>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-gold hover:underline font-semibold">
              Forgot Password?
            </Link>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={busy}
            className="btn-festive w-full !py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? (
              <>
                <Spinner /> Logging you in…
              </>
            ) : (
              'Login →'
            )}
          </motion.button>
        </form>
      </AuthShell>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
