'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

type Booking = {
  id: string; ticket_type_id?: string; event_session: string; qty: number; amount: number;
  name: string; phone: string; email: string; payment_status: string;
  checked_in: boolean; qr_code: string; created_at: string;
  upi_txn_ref?: string | null; rice_packets?: number | null;
};

const RICE_BY_TYPE: Record<string, number> = { 't-group3': 1, 't-group5': 2, 't-group9': 3 };

async function getToken(): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  const { data: s } = await sb.auth.getSession();
  return s.session?.access_token ?? null;
}

async function authedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const headers: HeadersInit = { ...init.headers, Authorization: `Bearer ${token}` };
  return fetch(url, { ...init, headers, cache: 'no-store' });
}

function BookingsContent() {
  const sp = useSearchParams();
  const fresh = sp.get('fresh') === '1';
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [utrs, setUtrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [utrErrs, setUtrErrs] = useState<Record<string, string>>({});

  async function load() {
    try {
      const r = await authedFetch('/api/bookings/me');
      if (r.ok) { const d = await r.json(); setBookings(d.bookings || []); }
      else setErr('Could not load bookings.');
    } catch { setErr('Network error.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function submitUtr(bookingId: string) {
    const ref = utrs[bookingId]?.trim() || '';
    if (!ref) { setUtrErrs({ ...utrErrs, [bookingId]: 'Enter the transaction ID / UTR.' }); return; }
    if (!/^[A-Z0-9]{8,20}$/.test(ref.replace(/\s+/g, '').toUpperCase())) {
      setUtrErrs({ ...utrErrs, [bookingId]: 'Letters & numbers only (8-20 chars).' }); return;
    }
    setSaving({ ...saving, [bookingId]: true });
    try {
      const rr = await authedFetch('/api/payments/upi-ref', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, txnRef: ref }) });
      const d = await rr.json();
      if (!rr.ok) throw new Error(d.error || 'Could not save reference');
      await load();
    } catch (e: any) { setUtrErrs({ ...utrErrs, [bookingId]: e.message }); }
    finally { setSaving({ ...saving, [bookingId]: false }); }
  }

  function downloadPDF() { window.print(); }

  const statusBadge = (st: string) => {
    const m: Record<string, string> = {
      paid: 'bg-emerald-500/20 text-emerald-300',
      pending: 'bg-amber-500/20 text-amber-300',
      failed: 'bg-red-500/20 text-red-300',
      held: 'bg-orange-500/20 text-orange-300',
      released: 'bg-red-500/20 text-red-300',
    };
    const label: Record<string, string> = { paid: 'PAID', pending: 'AWAITING VERIFICATION', failed: 'FAILED', held: 'INCOMPLETE', released: 'RELEASED' };
    return <span className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-bold ${m[st] || ''}`}>{label[st] || st.toUpperCase()}</span>;
  };

  return (
    <>
      <style>{`@media print { body { background: white !important; color: black !important; } nav, header { display: none !important; } .gold-text { color: black !important; -webkit-text-fill-color: black !important; } }`}</style>
      <main className="min-h-screen pt-24 px-4 max-w-4xl mx-auto pb-16 print:bg-white print:text-black">
        <div className="print:hidden"><Navbar /></div>
      <h1 className="font-display text-3xl md:text-4xl gold-text text-center">My Bookings</h1>
      <p className="text-center text-orange-100/70 mt-2">Your bookings &amp; payment status appear below.</p>

      {fresh && bookings.some((b) => b.payment_status === 'paid') && (
        <div className="text-center mt-6">
          <svg viewBox="0 0 52 52" className="w-16 h-16 mx-auto"><circle cx="26" cy="26" r="24" fill="none" stroke="#f5c451" strokeWidth="2" /><path className="check-path" fill="none" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" d="M14 27l8 8 16-17" /></svg>
          <h2 className="font-display text-2xl gold-text mt-2">Booking Confirmed! &#127875;</h2>
          <p className="text-orange-100/70">Shubh Navratri! Show this QR at the gate.</p>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center h-40 mt-8"><div className="rangoli" /></div>
      ) : err ? (
        <p className="text-center text-red-300 mt-8">&#9888; {err} <Link href="/booking" className="underline text-gold">Back to booking</Link></p>
      ) : bookings.length === 0 ? (
        <div className="mandala-border rounded-3xl p-8 bg-black/30 mt-6 text-center">
          <p className="text-4xl">&#127942;</p>
          <h2 className="font-display text-2xl gold-text mt-2">No bookings yet</h2>
          <p className="text-orange-100/75 mt-2">Book your Garba nights to see them here.</p>
          <Link href="/booking" className="btn-festive inline-block mt-5 !py-3">Book tickets &#8594;</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {bookings.map((b) => (
            <div key={b.id} className="mandala-border rounded-3xl p-5 bg-black/40 print:bg-white print:text-black print:border-black">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <p className="tracking-[0.3em] text-xs text-gold">GARBA NIGHTS 2026</p>
                  <h3 className="font-display text-xl mt-1">{b.event_session}</h3>
                  <p className="text-orange-100/75 text-sm">{b.name} &middot; {b.phone}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {statusBadge(b.payment_status)}
                    {b.checked_in && <span className="mt-2 inline-block px-3 py-1 rounded-full text-sm font-bold bg-gold/20 text-maroon">&#10003; CHECKED IN</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl gold-text">&#8377;{b.amount}</p>
                  <p className="text-xs text-orange-100/60">{b.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
                <div className="rounded-xl bg-black/30 p-3"><span className="text-orange-100/60">Qty</span><p className="font-bold">{b.qty}</p></div>
                <div className="rounded-xl bg-black/30 p-3"><span className="text-orange-100/60">Date</span><p className="font-bold">{new Date(b.created_at).toLocaleString('en-IN')}</p></div>
                <div className="rounded-xl bg-black/30 p-3"><span className="text-orange-100/60">Booking ID</span><p className="font-bold">{b.id}</p></div>
                <div className="rounded-xl bg-black/30 p-3"><span className="text-orange-100/60">Payment</span><p className="font-bold capitalize">{b.payment_status}</p></div>
              </div>

                          {b.payment_status === 'paid' && (
                <div className="mt-5 border-2 border-gold/60 rounded-2xl p-5 bg-black/30 print:bg-white print:text-black print:border-black">
                  <div className="flex justify-between items-center flex-wrap gap-3 mb-3">
                    <div>
                      <p className="text-xs tracking-[0.3em] text-emerald-300 font-bold">🎫 TICKET CONFIRMED</p>
                      <p className="font-display text-xl gold-text mt-1">Ticket ID</p>
                      <p className="font-mono text-sm text-goldlight break-all">{b.id}</p>
                    </div>
                    <span className="inline-block px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-sm">&#10003; PAID</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="rounded-xl bg-black/30 p-3"><span className="text-orange-100/60">Session</span><p className="font-bold text-sm">{b.event_session}</p></div>
                    <div className="rounded-xl bg-black/30 p-3"><span className="text-orange-100/60">Qty</span><p className="font-bold">{b.qty}</p></div>
                    <div className="rounded-xl bg-black/30 p-3"><span className="text-orange-100/60">Total</span><p className="font-bold">₹{b.amount}</p></div>
                    <div className="rounded-xl bg-black/30 p-3"><span className="text-orange-100/60">Name</span><p className="font-bold text-sm">{b.name}</p></div>
                  </div>
                  {(RICE_BY_TYPE[b.ticket_type_id || ''] || 0) > 0 && (
                    <div className="rounded-xl bg-black/30 p-3 mt-3 text-sm">
                      <span className="text-orange-100/60">🧺 Veg rice packets</span>
                      <p className="font-bold">{(RICE_BY_TYPE[b.ticket_type_id || ''] || 0) * b.qty + (b.rice_packets || 0)} total <span className="font-normal text-orange-100/70">({RICE_BY_TYPE[b.ticket_type_id || '']} × {b.qty} included{b.rice_packets ? ` + ${b.rice_packets} extra` : ''})</span></p>
                    </div>
                  )}
                  {b.upi_txn_ref && (
                    <p className="mt-3 text-xs text-emerald-300 font-semibold">UPTRef: {b.upi_txn_ref}</p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-5 mt-4 items-start">
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.qr_code} alt={`Ticket QR ${b.id}`} className="w-48 h-48 rounded-xl bg-white p-2 mx-auto print:border print:border-black" />
                      <p className="text-center text-xs text-orange-100/50 mt-1 print:text-black">Scan this QR at the gate</p>
                    </div>
                    <div className="flex gap-3 flex-wrap print:hidden">
                      <button onClick={downloadPDF} className="btn-festive !py-2.5 !text-sm">&#8681; Download / Print</button>
                      <Link href="/booking" className="rounded-full px-5 py-2.5 border border-gold/60 text-sm">Book more</Link>
                    </div>
                  </div>
                </div>
              )}

              {b.payment_status === 'pending' && (
                <div className="mt-4 text-left max-w-sm">
                  {!b.upi_txn_ref ? (
                    <>
                      <p className="text-xs font-semibold tracking-[0.18em] text-goldlight/80">ENTER YOUR UPI TRANSACTION ID / UTR</p>
                      <div className="flex gap-2 mt-1.5">
                        <input
                          value={utrs[b.id] || ''}
                          onChange={(e) => setUtrs({ ...utrs, [b.id]: e.target.value })}
                          placeholder="e.g. 412345678901"
                          className="flex-1 rounded-xl bg-black/50 border border-gold/30 px-4 py-2.5 text-[15px] placeholder:text-orange-100/35 outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                        />
                        <button onClick={() => submitUtr(b.id)} disabled={saving[b.id]} className="btn-festive !py-2.5 !text-sm disabled:opacity-50">
                          {saving[b.id] ? '...' : 'Submit'}
                        </button>
                      </div>
                      {utrErrs[b.id] && <p className="text-xs text-red-300 mt-1">&#9888; {utrErrs[b.id]}</p>}
                      <p className="text-[11px] text-orange-100/50 mt-1">Found in your UPI app after paying. 8-minute window.</p>
                    </>
                  ) : (
                    <p className="text-sm text-emerald-300 mt-2">&#10003; Ref recorded &#8212; our team is verifying.</p>
                  )}
                </div>
              )}

              {(b.payment_status === 'failed' || b.payment_status === 'held') && (
                <div className="mt-4">
                  <Link href="/booking" className="btn-festive !py-2.5 !text-sm inline-block">Book again &#8594;</Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </main>
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <BookingsContent />
    </Suspense>
  );
}
