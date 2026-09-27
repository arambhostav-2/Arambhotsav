'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  AuthShell,
  Field,
  PasswordField,
  Spinner,
  StrengthMeter,
  ToastView,
  isStrongPassword,
  type Toast,
} from '@/components/auth/AuthUI';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

function ResetInner() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<Toast>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  // Exchange ?code (PKCE) or hash token for a session so updateUser works.
  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      if (!sb) {
        setToast({ kind: 'error', msg: 'Auth backend not connected.' });
        return;
      }
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) await sb.auth.exchangeCodeForSession(code);
        const { data } = await sb.auth.getSession();
        if (data.session) setReady(true);
        else
          setToast({
            kind: 'error',
            msg: 'Reset link invalid or expired. Request a new one from Forgot Password.',
          });
      } catch {
        setToast({ kind: 'error', msg: 'Could not verify reset link. Request a new one.' });
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!isStrongPassword(pw)) errs.pw = 'Min 8 chars with uppercase, lowercase & number.';
    if (confirm !== pw) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;
    setBusy(true);
    setToast(null);
    try {
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) throw error;
      await sb.auth.signOut();
      router.replace('/login?reset=success');
    } catch (err: unknown) {
      setToast({ kind: 'error', msg: err instanceof Error ? err.message : 'Could not update password.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <AuthShell
        title="New Password"
        subtitle="Create a strong new password for your account."
      >
        <div className="space-y-3">
          <ToastView toast={toast} />
        </div>
        {ready ? (
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <Field label="NEW PASSWORD" error={errors.pw}>
              <PasswordField value={pw} onChange={setPw} placeholder="Min 8 chars, Aa + 123" autoComplete="new-password" />
              <StrengthMeter pw={pw} />
            </Field>
            <Field label="CONFIRM PASSWORD" error={errors.confirm}>
              <PasswordField value={confirm} onChange={setConfirm} placeholder="Repeat new password" autoComplete="new-password" />
            </Field>
            <button disabled={busy} className="btn-festive w-full !py-3.5 disabled:opacity-60">
              {busy ? (
                <>
                  <Spinner /> Updating…
                </>
              ) : (
                'Update Password →'
              )}
            </button>
          </form>
        ) : (
          <p className="text-sm text-orange-100/70 mt-4 text-center">Verifying reset link…</p>
        )}
      </AuthShell>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <ResetInner />
    </Suspense>
  );
}
