'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { SESSIONS, TicketType, conveniencePerTicket, INCLUDED_RICE, RICE_PACKET_PRICE } from '@/lib/store';

declare global { interface Window { Razorpay?: any } }

type HoldResp = {
  bookingId: string; subtotal: number; gst: number; convenience: number; grand: number;
  riceExtra?: number; riceAmount?: number; riceTotal?: number;
  qrCode: string; order: any; demoPay: boolean; razorpayKeyId: string | null;
  upi?: boolean; upiId?: string; upiName?: string; upiDeepLink?: string; upiAmount?: number;
};

export default function BookingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen grid place-items-center"><div className="rangoli" /></main>}>
      <BookingInner />
    </Suspense>
  );
}

function BookingInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [session, setSession] = useState(SESSIONS[0]);
  const [code, setCode] = useState(sp.get('type') || 'SINGLE');
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [method, setMethod] = useState<'upi' | 'gateway'>('upi');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<HoldResp | null>(null);
  const [err, setErr] = useState('');
  const [upiData, setUpiData] = useState<HoldResp | null>(null);
  const [qrData, setQrData] = useState('');
  
  const [txnRef, setTxnRef] = useState('');
  const [txnErr, setTxnErr] = useState('');
  const [savingRef, setSavingRef] = useState(false);
  const [auth, setAuth] = useState<'loading' | 'out' | 'in'>('loading');
  const [riceExtra, setRiceExtra] = useState(0);

  const load = () => fetch('/api/availability', { cache: 'no-store' }).then((r) => r.json()).then((d) => setTickets(d.tickets || []));
  useEffect(() => {
    (async () => {
      const s = getSession();
      if (s) setForm((f) => ({ name: f.name || s.name || '', phone: f.phone || s.phone || '', email: f.email || s.email || '' }));
      const sb = getSupabaseBrowser();
      if (sb) {
        const { data } = await sb.auth.getSession();
        const u = data.session?.user;
        if (u) {
          const meta = (u.user_metadata || {}) as { full_name?: string; name?: string; phone?: string };
          setForm((f) => ({
            name: f.name || meta.full_name || meta.name || '',
            phone: f.phone || meta.phone || '',
            email: f.email || u.email || '',
          }));
          setAuth('in');
          return;
        }
      }
      setAuth(s ? 'in' : 'out');
    })();
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  async function getToken(): Promise<string | null> {
    const sb = getSupabaseBrowser();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? null;
  }

  const sel = useMemo(() => tickets.find((t) => t.code === code), [tickets, code]);
  const subtotal = sel ? sel.price * qty : 0;
  const feePer = sel ? conveniencePerTicket(sel.code) : 5;
  const convenience = subtotal ? feePer * qty : 0;
  const includedRice = sel ? INCLUDED_RICE[sel.code] ?? 0 : 0;
  const riceAmount = includedRice ? riceExtra * RICE_PACKET_PRICE : 0;
  const riceTotal = includedRice ? includedRice * qty + riceExtra : 0;
  const grand = subtotal + convenience + riceAmount;
  useEffect(() => { setRiceExtra(0); }, [code]);

  async function pay(hold: HoldResp) {
    if (hold.demoPay) {
      await fetch('/api/payments/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: hold.bookingId }) });
      confetti({ particleCount: 160, spread: 75, origin: { y: 0.6 }, colors: ['#f5c451', '#ff7a1a', '#e11d48', '#ffffff'] });
      router.push(`/my-bookings?id=${hold.bookingId}&fresh=1`);
      return;
    }
    const rz = new window.Razorpay({
      key: hold.razorpayKeyId, amount: hold.grand * 100, currency: 'INR',
      name: 'Garba Nights 2026', description: `${session} — ${code} x ${qty}`,
      order_id: hold.order.id,
      handler: async (resp: any) => {
        await fetch('/api/payments/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: hold.bookingId, ...resp }) });
        confetti({ particleCount: 180, spread: 80, origin: { y: 0.6 } });
        router.push(`/my-bookings?id=${hold.bookingId}&fresh=1`);
      },
      theme: { color: '#8b0000' },
    });
    rz.on('payment.failed', () => setErr('Payment failed — your hold stays for 10 minutes, you can retry from My Bookings.'));
    rz.open();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const token = await getToken();
      if (!token) { setAuth('out'); throw new Error('Please login or sign up to book tickets.'); }
      const r = await fetch('/api/bookings/hold', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session, ticketCode: code, qty, ...form, paymentMethod: method, riceExtra: includedRice ? riceExtra : 0 }) });
      const d = await r.json();
      if (r.status === 401) { setAuth('out'); throw new Error(d.error || 'Please login or sign up to book tickets.'); }
      if (!r.ok) throw new Error(d.error || 'Booking failed');
      setDone(d);
      if (d.upi) {
        setUpiData(d);
        const qr = await QRCode.toDataURL(d.upiDeepLink, { width: 240, margin: 1, color: { dark: '#160409', light: '#ffffff' } });
        setQrData(qr);
      } else {
        await pay(d);
      }
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); load(); }
  }

  async function submitTxnRef() {
    if (!upiData) return;
    setTxnErr('');
    if (!txnRef.trim()) { setTxnErr('Enter the transaction ID from your UPI app.'); return; }
    setSavingRef(true);
    try {
      const r = await fetch('/api/payments/upi-ref', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: upiData.bookingId, txnRef: txnRef.trim() }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not save reference');
      router.push(`/my-bookings?id=${upiData.bookingId}&fresh=1`);
    } catch (e: any) { setTxnErr(e.message); }
    finally { setSavingRef(false); }
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 max-w-6xl mx-auto">
      <Navbar />
      <h1 className="font-display text-4xl md:text-5xl gold-text text-center">Book Your Garba Night</h1>
      <p className="text-center text-orange-100/70 mt-2">🔴 Live seats — auto-refreshes. Payments must confirm within 8 minutes or the hold is released.</p>

      {auth === 'loading' ? (
        <div className="grid place-items-center h-64 mt-8"><div className="rangoli" /></div>
      ) : auth === 'out' ? (
        <div className="mandala-border rounded-3xl p-8 bg-black/40 max-w-xl mx-auto mt-10 text-center">
          <p className="text-5xl">🎟️</p>
          <h2 className="font-display text-2xl gold-text mt-3">Login required to book</h2>
          <p className="text-orange-100/75 mt-2">Please login or create a free account to book tickets — your e-tickets will be linked to your account and shown under My Bookings.</p>
          <div className="flex gap-3 justify-center mt-6 flex-wrap">
            <Link href="/login?redirect=%2Fbooking" className="btn-festive !py-3 !px-8">Login →</Link>
            <Link href="/signup?redirect=%2Fbooking" className="rounded-full px-7 py-3 border border-gold/60 text-goldlight font-display hover:bg-gold/10 transition">Sign Up</Link>
          </div>
        </div>
      ) : (
      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_360px] gap-6 mt-8">
        <div className="space-y-5">
          <div className="mandala-border rounded-3xl p-5 bg-black/30">
            <p className="font-display text-xl text-gold">1 • Pick session</p>
            <select value={session} onChange={(e) => setSession(e.target.value)} className="mt-3 w-full rounded-xl bg-night border border-gold/40 p-3">
              {SESSIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="mandala-border rounded-3xl p-5 bg-black/30">
            <p className="font-display text-xl text-gold">2 • Ticket type <span className="text-xs text-emerald-300 ml-2">● LIVE</span></p>
            {tickets.length > 0 && (
              <p className="text-sm font-semibold text-emerald-300 mt-2">1000 seats total • {tickets.reduce((s, t) => s + t.remaining_quantity, 0)} left overall</p>
            )}
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {tickets.map((t) => (
                <button type="button" key={t.id} disabled={!t.sales_open || t.remaining_quantity === 0}
                  onClick={() => setCode(t.code)}
                  className={`rounded-2xl border p-4 text-left transition ${code === t.code ? 'border-gold bg-gold/10 scale-[1.02]' : 'border-white/15 hover:border-gold/50'} disabled:opacity-40`}>
                  <p className="font-display text-lg">{t.name}</p>
                  <p className="gold-text font-display text-2xl">₹{t.price}</p>
                  <p className="text-sm text-orange-100/70">{t.sales_open ? 'Sales open' : 'Sales closed'}</p>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4">
              <p className="font-display text-xl text-gold">Qty</p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 rounded-full border border-gold/50 text-2xl">−</button>
                <span className="font-display text-3xl w-10 text-center">{qty}</span>
                <button type="button" onClick={() => setQty(Math.min(10, qty + 1))} className="w-10 h-10 rounded-full border border-gold/50 text-2xl">+</button>
              </div>
              <span className="text-xs text-orange-100/60">Max 10 per booking</span>
            </div>

            {includedRice > 0 && (
              <div className="mt-4 rounded-2xl border border-gold/30 bg-black/40 p-4">
                <p className="font-display text-lg text-goldlight">🧺 Veg rice packets <span className="text-xs text-emerald-300 ml-1">{includedRice} included per pass</span></p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <p className="text-sm text-orange-100/80">Extra packets</p>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setRiceExtra(Math.max(0, riceExtra - 1))} className="w-9 h-9 rounded-full border border-gold/50 text-xl">−</button>
                    <span className="font-display text-2xl w-8 text-center">{riceExtra}</span>
                    <button type="button" onClick={() => setRiceExtra(Math.min(20, riceExtra + 1))} className="w-9 h-9 rounded-full border border-gold/50 text-xl">+</button>
                  </div>
                  <span className="text-xs text-orange-100/60">₹{RICE_PACKET_PRICE} each{riceExtra > 0 ? ` • +₹${riceAmount}` : ''}</span>
                </div>
                <p className="text-xs text-orange-100/60 mt-1.5">Total packets in this booking: <b className="text-goldlight">{riceTotal}</b> ({includedRice} × {qty} included{riceExtra > 0 ? ` + ${riceExtra} extra` : ''})</p>
              </div>
            )}
          </div>
          <div className="mandala-border rounded-3xl p-5 bg-black/30">
            <p className="font-display text-xl text-gold">3 • Your details</p>
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl bg-night border border-gold/40 p-3" />
              <input required inputMode="numeric" placeholder="10-digit mobile" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl bg-night border border-gold/40 p-3" />
              <input required readOnly value={form.email} title="Bookings are linked to your account email" placeholder="Email for e-ticket" onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl bg-night border border-gold/40 p-3 text-orange-100/70" />
            </div>
          </div>
          <div className="mandala-border rounded-3xl p-5 bg-black/30">
            <p className="font-display text-xl text-gold">4 • Payment method</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <button type="button" onClick={() => setMethod('upi')}
                className="rounded-2xl border p-4 text-left transition border-gold bg-gold/10">
                <p className="font-display text-lg">UPI QR <span className="ml-1 text-xs rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5">0% FEE</span></p>
                <p className="text-sm text-orange-100/70">Pay from any UPI app, submit your UTR, and our team confirms your ticket.</p>
              </button>
            </div>
            <p className="text-xs text-orange-100/60 mt-3">💡 Pay to our UPI ID on the next screen, then enter your transaction ID (UTR) under My Bookings — your e-ticket is emailed once we verify the credit.</p>
          </div>
          {err && <p className="rounded-xl bg-red-900/60 border border-red-400/40 p-3 text-sm">⚠️ {err}</p>}
        </div>

        <aside className="mandala-border rounded-3xl p-6 bg-gradient-to-b from-[#2a0d12] to-[#160409] h-fit lg:sticky lg:top-24">
          <p className="font-display text-2xl text-gold">Bill</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt>{sel?.name} × {qty}</dt><dd>₹{subtotal}</dd></div>
            <div className="flex justify-between text-orange-100/70"><dt>Convenience (₹{feePer}/ticket)</dt><dd>₹{subtotal ? feePer * qty : 0}</dd></div>
            {riceAmount > 0 && (
              <div className="flex justify-between text-orange-100/70"><dt>Extra veg rice × {riceExtra} (@ ₹{RICE_PACKET_PRICE})</dt><dd>₹{riceAmount}</dd></div>
            )}
            <div className="flex justify-between font-display text-2xl gold-text border-t border-gold/30 pt-3"><dt>Total</dt><dd>₹{grand}</dd></div>
          </dl>
          <button disabled={loading || !sel} className="btn-festive w-full mt-5 animate-pulse-glow disabled:opacity-50">
            {loading ? 'Holding seats…' : method === 'upi' ? `Get UPI QR • ₹${grand}` : `Pay ₹${grand} →`}
          </button>
          <p className="text-xs text-orange-100/60 mt-3">
            0% fee. Your booking shows as pending until our team verifies your payment — usually within a few minutes.
          </p>
        </aside>
      </form>
      )}

      {/* UPI PAY MODAL */}
      <AnimatePresence>
        {upiData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm grid place-items-center p-4"
            onClick={() => setUpiData(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="mandala-border rounded-3xl bg-gradient-to-b from-[#2a0d12] to-[#160409] p-6 w-full max-w-md text-center overflow-y-auto max-h-[92vh]"
            >
              <div className="flex justify-end">
                <button onClick={() => setUpiData(null)} className="rounded-full border border-gold/40 w-9 h-9 text-goldlight hover:bg-gold/10" aria-label="Close">✕</button>
              </div>
              <p className="text-3xl">📲</p>
              <h2 className="font-display text-2xl gold-text mt-1">Pay ₹{upiData.upiAmount} via UPI</h2>
              <p className="text-sm text-orange-100/70">0% fee • scan with GPay, PhonePe, Paytm, BHIM</p>

              <div className="mt-4 mx-auto w-fit p-3 rounded-2xl bg-white">
                {qrData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrData} alt="UPI QR code" className="w-52 h-52" />
                ) : (
                  <div className="w-52 h-52 grid place-items-center"><div className="rangoli" /></div>
                )}
              </div>

              <ol className="mt-4 text-left text-sm text-orange-100/75 space-y-1.5">
                <li>1. Open any UPI app (PhonePe, GPay, BHIM, Paytm) and <b className="text-gold">scan the QR above live with your camera</b> → pay <b className="text-gold">₹{upiData.upiAmount}</b>.</li>
                <li>2. Or pay directly to our UPI ID <b className="text-gold">{upiData.upiId}</b> ({upiData.upiName}) — same amount.</li>
                <li>3. Paste the <b className="text-goldlight">transaction ID / UTR</b> shown in your payment app below.</li>
                <li>4. Within <b className="text-gold">3 minutes</b> your ticket is confirmed. ✅</li>
              </ol>
              <p className="text-[11px] text-amber-200/70 mt-2">⚠️ Don&apos;t pay via screenshot upload — UPI apps cap screenshot payments at ₹2,000.</p>

              <div className="mt-4 text-left">
                <label className="text-xs font-semibold tracking-[0.18em] text-goldlight/80">UPI TRANSACTION ID / UTR *</label>
                <input
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  placeholder="e.g. 412345678901"
                  autoComplete="off"
                  className="mt-1.5 w-full rounded-2xl bg-black/50 border border-gold/30 px-4 py-3 text-[15px] placeholder:text-orange-100/35 outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
                {txnErr && <p className="text-xs text-red-300 mt-1.5">⚠️ {txnErr}</p>}
                <p className="text-[11px] text-orange-100/50 mt-1.5">Found in GPay (payment ID), PhonePe/Paytm (transaction ID, uppercase). Helpful to find the credit at the venue.</p>
              </div>

              <p className="text-[11px] text-orange-100/50 mt-2">Keep your booking ID safe. Hold releases automatically after 8 minutes if unpaid.</p>

              <button
                onClick={submitTxnRef}
                disabled={savingRef}
                className="btn-festive w-full mt-5 !py-3 disabled:opacity-60"
              >
                {savingRef ? 'Saving…' : "I've paid → Verify my ticket"}
              </button>
              <button onClick={() => setUpiData(null)} className="text-sm underline text-orange-100/60 mt-3 block mx-auto">
                I&apos;ll pay later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}