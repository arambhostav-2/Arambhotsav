'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

/* ---------- validators ---------- */
export const isEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export const isPhoneIN = (v: string) =>
  /^[6-9]\d{9}$/.test(v.replace(/\D/g, '').slice(-10));

export type Strength = { score: number; label: string; color: string };

export function passwordStrength(pw: string): Strength {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12 && score >= 3) score = 4;
  const clamped = Math.min(4, score);
  const map: Strength[] = [
    { score: 0, label: 'Too weak', color: '#f87171' },
    { score: 1, label: 'Weak', color: '#fb923c' },
    { score: 2, label: 'Fair', color: '#facc15' },
    { score: 3, label: 'Strong', color: '#4ade80' },
    { score: 4, label: 'Excellent', color: '#22c55e' },
  ];
  return map[clamped];
}

export const isStrongPassword = (pw: string) =>
  pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw);

/* ---------- toast ---------- */
export type Toast = { kind: 'success' | 'error' | 'info'; msg: string } | null;

export function ToastView({ toast }: { toast: Toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          className={`rounded-2xl border p-3 text-sm text-left backdrop-blur-md ${
            toast.kind === 'success'
              ? 'bg-emerald-500/15 border-emerald-300/40 text-emerald-100'
              : toast.kind === 'error'
                ? 'bg-red-500/15 border-red-300/40 text-red-100'
                : 'bg-gold/10 border-gold/40 text-goldlight'
          }`}
        >
          <span className="mr-2">
            {toast.kind === 'success' ? '✅' : toast.kind === 'error' ? '⚠️' : '🪔'}
          </span>
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- shell ---------- */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden pt-28 pb-16 px-4">
      {/* premium background orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full bg-orange-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -left-32 h-[380px] w-[380px] rounded-full bg-gold/15 blur-[110px]" />
        <div className="absolute bottom-0 -right-24 h-[380px] w-[420px] rounded-full bg-rose-700/25 blur-[110px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-md mx-auto"
      >
        <div className="mandala-border rounded-[2rem] bg-black/45 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,.55)] overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-gold via-orange-500 to-rose-600" />
          <div className="p-7 md:p-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mx-auto w-14 h-14 grid place-items-center rounded-2xl bg-gradient-to-b from-goldlight to-gold text-2xl shadow-lg"
            >
              🪔
            </motion.div>
            <h1 className="font-display text-3xl gold-text text-center mt-3">{title}</h1>
            <p className="text-center text-orange-100/70 text-sm mt-1">{subtitle}</p>
            <div className="mt-6">{children}</div>
            {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
          </div>
        </div>
        <p className="text-center text-[11px] tracking-[0.3em] text-goldlight/50 mt-5 font-display">
          GARBA NIGHTS • 2026
        </p>
      </motion.div>
    </div>
  );
}

/* ---------- fields ---------- */
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-left">
      <span className="text-xs font-semibold tracking-[0.18em] text-goldlight/80">{label}</span>
      <div className="mt-1.5">{children}</div>
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="block text-xs text-red-300 mt-1.5"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

export const inputCls =
  'w-full rounded-2xl bg-black/50 border border-gold/30 pl-11 pr-4 py-3.5 text-[15px] placeholder:text-orange-100/35 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30 focus:bg-black/65';

export function PasswordField({
  value,
  onChange,
  placeholder = 'Enter password',
  autoComplete = 'current-password',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔒</span>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${inputCls} pr-12`}
      />
      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full hover:bg-gold/15 transition text-lg"
      >
        <motion.span
          key={String(show)}
          initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ duration: 0.18 }}
        >
          {show ? '🙈' : '👁️'}
        </motion.span>
      </motion.button>
    </div>
  );
}

export function StrengthMeter({ pw }: { pw: string }) {
  if (!pw) return null;
  const s = passwordStrength(pw);
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            layout
            className="h-1.5 flex-1 rounded-full"
            style={{ background: i < s.score ? s.color : 'rgba(255,255,255,.14)' }}
          />
        ))}
      </div>
      <p className="text-[11px] mt-1" style={{ color: s.color }}>
        {s.label} — use 8+ chars with upper, lower & number
      </p>
    </div>
  );
}

export function Spinner() {
  return (
    <span className="inline-block w-5 h-5 rounded-full border-2 border-maroon/30 border-t-maroon animate-spin align-[-4px] mr-2" />
  );
}

export function AuthFooterLinks({ mode }: { mode: 'login' | 'signup' }) {
  if (mode === 'login')
    return (
      <p className="text-orange-100/75">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-gold font-semibold hover:underline">
          Sign Up
        </Link>
      </p>
    );
  return (
    <p className="text-orange-100/75">
      Already have an account?{' '}
      <Link href="/login" className="text-gold font-semibold hover:underline">
        Login
      </Link>
    </p>
  );
}
