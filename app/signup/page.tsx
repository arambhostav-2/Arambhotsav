'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import {
  AuthShell,
  AuthFooterLinks,
  Field,
  PasswordField,
  Spinner,
  StrengthMeter,
  ToastView,
  isEmail,
  isPhoneIN,
  isStrongPassword,
  type Toast,
} from '@/components/auth/AuthUI';
import { getSupabaseBrowser, supabaseBrowserConfigured, appUrl } from '@/lib/supabase-browser';
import { setSession } from '@/lib/session';

function SignupInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get('redirect') || '/';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<Toast>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      if (!sb) {
        setChecking(false);
        return;
      }
      const { data } = await sb.auth.getSession();
      if (data.session) router.replace(redirectTo);
      else setChecking(false);
    })();
  }, [router, redirectTo]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Enter your full name.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!isEmail(email)) e.email = 'Enter a valid email address.';
    if (!phone.trim()) e.phone = 'Mobile number is required.';
    else if (!isPhoneIN(phone)) e.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (!password) e.password = 'Password is required.';
    else if (!isStrongPassword(password))
      e.password = 'Min 8 chars with uppercase, lowercase & number.';
    if (!confirm) e.confirm = 'Please confirm your password.';
    else if (confirm !== password) e.confirm = 'Passwords do not match.';
    if (!terms) e.terms = 'You must accept the Terms & Conditions.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSignup(ev: React.FormEvent) {
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
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      const { data, error } = await sb.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: name.trim(), phone: cleanPhone },
          emailRedirectTo: `${appUrl()}/login?registered=1`,
        },
      });
      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes('already registered') || m.includes('already exists') || m.includes('duplicate'))
          throw new Error('This email is already registered. Try logging in instead.');
        throw error;
      }

      // Store profile row (id = auth UUID). RLS allows own insert; service trigger is backup.
      if (data.user) {
        const { error: pErr } = await sb.from('profiles').upsert(
          {
            id: data.user.id,
            full_name: name.trim(),
            email: cleanEmail,
            phone: cleanPhone,
          },
          { onConflict: 'id' }
        );
        // Ignore RLS error silently — trigger may have created it. Log only.
        if (pErr && !/row-level|policy|duplicate|conflict/i.test(pErr.message)) throw pErr;
      }

      if (data.session && data.user) {
        // Email confirmation OFF -> auto-logged in
        setSession({ name: name.trim(), phone: cleanPhone, email: cleanEmail });
        try {
          window.dispatchEvent(new Event('storage'));
        } catch {}
        setToast({ kind: 'success', msg: 'Account created! Taking you to events…' });
        setTimeout(() => router.replace(redirectTo), 800);
      } else {
        // Email confirmation ON -> ask to verify
        setToast({
          kind: 'success',
          msg: 'Account created! Check your email to verify, then login.',
        });
        setTimeout(() => router.replace(`/login?registered=1&redirect=${encodeURIComponent(redirectTo)}`), 1600);
      }
    } catch (err: unknown) {
      setToast({ kind: 'error', msg: err instanceof Error ? err.message : 'Could not create account.' });
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Navbar />
        <div className="rangoli" />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <AuthShell
        title="Create Account"
        subtitle="Join Garba Nights — faster checkout, QR e-tickets & order history."
        footer={<AuthFooterLinks mode="signup" />}
      >
        <div className="space-y-3">
          <ToastView toast={toast} />
        </div>
        <form onSubmit={onSignup} className="mt-4 space-y-4" noValidate>
          <Field label="FULL NAME" error={errors.name}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">👤</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Patel"
                autoComplete="name"
                className="w-full rounded-2xl bg-black/50 border border-gold/30 pl-11 pr-4 py-3.5 text-[15px] placeholder:text-orange-100/35 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
              />
            </div>
          </Field>

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

          <Field label="MOBILE NUMBER" error={errors.phone}>
            <div className="flex gap-2">
              <span className="rounded-2xl bg-black/50 border border-gold/30 px-4 py-3.5 text-goldlight font-semibold">
                +91
              </span>
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">📱</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  inputMode="numeric"
                  autoComplete="tel"
                  className="w-full rounded-2xl bg-black/50 border border-gold/30 pl-11 pr-4 py-3.5 text-[15px] placeholder:text-orange-100/35 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>
          </Field>

          <Field label="PASSWORD" error={errors.password}>
            <PasswordField value={password} onChange={setPassword} placeholder="Min 8 chars, Aa + 123" autoComplete="new-password" />
            <StrengthMeter pw={password} />
          </Field>

          <Field label="CONFIRM PASSWORD" error={errors.confirm}>
            <PasswordField value={confirm} onChange={setConfirm} placeholder="Repeat password" autoComplete="new-password" />
          </Field>

          <label className="flex items-start gap-3 text-left text-sm text-orange-100/80 cursor-pointer">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#f5c451]"
            />
            <span>
              I agree to the <span className="text-gold underline">Terms & Conditions</span> and{' '}
              <span className="text-gold underline">Privacy Policy</span>.
            </span>
          </label>
          {errors.terms && <p className="text-xs text-red-300 text-left">{errors.terms}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={busy}
            className="btn-festive w-full !py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? (
              <>
                <Spinner /> Creating account…
              </>
            ) : (
              'Create Account →'
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
      <SignupInner />
    </Suspense>
  );
}
