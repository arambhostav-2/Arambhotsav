'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';

export default function Admin() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [q, setQ] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [galMsg, setGalMsg] = useState('');

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

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) { setLoading(false); return; }
    async function check() {
      try {
        const { data: s } = await sb!.auth.getSession();
        if (!s.session) { router.replace('/login?redirect=/admin'); return; }
        const email = s.session.user.email;
        if (email !== ADMIN_EMAIL) { router.replace('/'); return; }
        setUser({ email, name: (s.session.user.user_metadata as { full_name?: string })?.full_name });
      } catch { router.replace('/login?redirect=/admin'); }
      setLoading(false);
    }
    check();
    const { data: listener } = sb.auth.onAuthStateChange((event, session) => {
      if (!session) { router.replace('/login?redirect=/admin'); return; }
      const email = session.user.email;
      if (email !== ADMIN_EMAIL) { router.replace('/'); return; }
      setUser({ email, name: (session.user.user_metadata as { full_name?: string })?.full_name });
      setLoading(false);
    });
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  async function load() {
    const r = await authedFetch('/api/admin/stats');
    if (r.ok) { setData(await r.json()); } else { alert('Session expired — please login again.'); router.replace('/login?redirect=/admin'); }
  }
  async function loadGallery() {
    const r = await authedFetch('/api/gallery');
    if (r.ok) { const d = await r.json(); setPhotos(d.photos || []); setGalMsg(d.configured ? '' : 'Demo mode — uploads are kept in memory only. Configure Supabase for durable photos.'); }
  }

  useEffect(() => { if (!loading && user) { load(); loadGallery(); const id = setInterval(() => load(), 15000); return () => clearInterval(id); } }, [user]);

  async function uploadPhoto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('file') as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) { setGalMsg('Select an image first.'); return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('caption', caption);
    setUploading(true); setGalMsg('');
    try {
      const r = await authedFetch('/api/gallery', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Upload failed');
      setCaption(''); input.value = '';
      setGalMsg('✅ Photo uploaded.');
      await loadGallery();
    } catch (err: any) {
      setGalMsg('⚠️ ' + (err.message || 'Upload failed'));
    } finally { setUploading(false); }
  }

  async function deletePhoto(id: string) {
    if (!confirm('Delete this photo?')) return;
    const r = await authedFetch('/api/gallery', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const d = await r.json();
    if (!r.ok) setGalMsg('⚠️ ' + (d.error || 'Delete failed'));
    else await loadGallery();
  }

  async function confirmPayment(id: string) {
    const txnRef = window.prompt('Confirm UPI payment received for this booking.\nEnter the UPI transaction ID / UTR you see in your bank or UPI app:');
    if (txnRef === null) return;
    if (!txnRef.trim()) { alert('Enter the transaction reference to confirm.'); return; }
    const r = await authedFetch('/api/admin/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'confirmPayment', id, txnRef: txnRef.trim() }) });
    const d = await r.json();
    if (!r.ok) alert('⚠️ ' + (d.error || 'Failed')); else load();
  }

  async function checkin(id: string) {
    const r = await authedFetch('/api/admin/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'checkin', id }) });
    const d = await r.json();
    if (!r.ok) alert(d.error); else load();
  }
  function csv() {
    if (!data) return;
    const rows = [['id', 'name', 'phone', 'email', 'session', 'qty', 'amount', 'status', 'checked_in'],
      ...data.bookings.map((b: any) => [b.id, b.name, b.phone, b.email, b.event_session, b.qty, b.amount, b.payment_status, b.checked_in])];
    const blob = new Blob([rows.map((r: any) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'garba-bookings.csv'; a.click();
  }

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center"><div className="rangoli" /><p className="font-display text-gold tracking-widest text-sm mt-4">LOADING…</p></main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <div className="mandala-border rounded-3xl p-8 bg-black/40 w-full max-w-sm text-center">
          <p className="text-4xl">🔒</p>
          <h1 className="font-display text-3xl gold-text mt-2">Admin Only</h1>
          <p className="text-sm text-orange-100/60 mt-2">Only the admin email can access this dashboard.</p>
          <Link href="/login" className="btn-festive inline-block mt-5 !py-3">Login as admin →</Link>
        </div>
      </main>
    );
  }

  const rows = (data?.bookings || []).filter((b: any) => JSON.stringify(b).toLowerCase().includes(q.toLowerCase()));
  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="font-display text-3xl gold-text">🪔 Live Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="rounded-full px-4 py-2 border border-gold/60 text-goldlight font-display text-sm">🙏 {user.name || user.email.split('@')[0]}</span>
          <Link href="/admin/scan" className="rounded-full px-5 py-2 border border-gold/60">📷 Gate Scanner</Link>
          <button onClick={csv} className="btn-festive !py-2 !text-base">Export CSV</button>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <div className="mandala-border rounded-2xl p-5 bg-black/40"><p className="text-xs tracking-widest text-gold">REVENUE</p><p className="font-display text-4xl gold-text">₹{data?.revenue?.toLocaleString('en-IN')}</p></div>
        <div className="mandala-border rounded-2xl p-5 bg-black/40"><p className="text-xs tracking-widest text-gold">TICKETS SOLD</p><p className="font-display text-4xl">{data?.ticketsSold}</p></div>
        <div className="mandala-border rounded-2xl p-5 bg-black/40"><p className="text-xs tracking-widest text-gold">BOOKINGS</p><p className="font-display text-4xl">{data?.bookings?.length}</p></div>
      </div>
      <div className="mandala-border rounded-2xl p-5 bg-black/40 mt-4 h-64">
        <p className="font-display text-gold mb-2">Sold per type (live)</p>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data?.perType}><XAxis dataKey="code" stroke="#f5c451" /><YAxis stroke="#f5c451" /><Tooltip /><Bar dataKey="sold" fill="#f5c451" radius={[8, 8, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / phone / id / status…" className="mt-6 w-full rounded-xl bg-black/40 border border-gold/40 p-3" />
      <div className="overflow-x-auto mt-3 rounded-2xl border border-gold/25">
        <table className="w-full text-sm min-w-[760px]">
          <thead><tr className="bg-gold/10 text-gold text-left"><th className="p-3">ID</th><th className="p-3">Name/Phone</th><th className="p-3">Session</th><th className="p-3">Qty</th><th className="p-3">₹</th><th className="p-3">Status</th><th className="p-3">Entry</th></tr></thead>
          <tbody>
            {rows.map((b: any) => (
              <tr key={b.id} className="border-t border-white/10">
                <td className="p-3 font-mono text-xs">{b.id}</td>
                <td className="p-3">{b.name}<br /><span className="text-orange-100/60">{b.phone}</span></td>
                <td className="p-3 text-xs">{b.event_session}</td>
                <td className="p-3">{b.qty}{b.rice_packets > 0 && <span className="block text-xs text-gold">🧺 +{b.rice_packets} rice</span>}</td><td className="p-3">₹{b.amount}</td>
                <td className="p-3">{b.payment_status === 'pending' && !b.upi_txn_ref ? (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300">NOT PAID</span>
                ) : b.payment_status === 'pending' ? (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">AWAITING VERIFICATION</span>
                ) : b.payment_status === 'paid' ? (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300">PAID</span>
                ) : (
                  b.payment_status
                )}</td>
                <td className="p-3">{b.checked_in ? '✓ IN' : b.payment_status === 'pending' ? <>
                  {b.upi_txn_ref ? <>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 mb-1">NOT CONFIRMED</span>
                    <p className="text-[10px] font-mono text-orange-100/60 mb-1">REF: {b.upi_txn_ref}</p>
                    <button onClick={() => confirmPayment(b.id)} className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-300/40 font-bold hover:bg-emerald-500/30">✓ Confirm (UPI)</button>
                  </> : (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-orange-100/50">Not Confirm</span>
                  )}
                </> : <button onClick={() => checkin(b.id)} className="px-3 py-1 rounded-full bg-gold text-maroon font-bold">Check in</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GALLERY MANAGER */}
      <div className="mandala-border rounded-3xl p-5 bg-black/40 mt-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="font-display text-2xl text-gold">📸 Gallery Manager</p>
          <p className="text-xs text-orange-100/50">Photos shown on the homepage — uploaded from here.</p>
        </div>
        {galMsg && <p className="text-xs mt-2 text-orange-100/80">{galMsg}</p>}
        <form onSubmit={uploadPhoto} className="flex flex-col sm:flex-row gap-3 mt-4">
          <input type="file" name="file" accept="image/*" className="flex-1 rounded-xl bg-black/40 border border-gold/40 p-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-gold file:text-maroon file:font-bold file:px-4 file:py-1.5 file:cursor-pointer cursor-pointer" />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" className="flex-1 rounded-xl bg-black/40 border border-gold/40 p-3 text-sm" />
          <button disabled={uploading} className="btn-festive !py-2.5 !text-sm disabled:opacity-50">
            {uploading ? 'Uploading…' : 'Upload →'}
          </button>
        </form>
        {photos.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4">
            {photos.map((p: any) => (
              <div key={p.id} className="relative group rounded-xl overflow-hidden border border-gold/25">
                <img src={p.url} alt={p.caption || 'gallery photo'} className="h-32 w-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-2">
                  <p className="text-[11px] leading-tight truncate">{p.caption || 'No caption'}</p>
                  <button onClick={() => deletePhoto(p.id)} className="self-end rounded-full bg-red-600/90 text-white text-[11px] px-3 py-1 font-bold hover:bg-red-500">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-orange-100/60 mt-4">No photos yet — upload the first one above. (Homepage falls back to demo images until then.)</p>
        )}
      </div>
    </main>
  );
}
