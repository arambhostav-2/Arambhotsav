'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export default function PhoneScan() {
  const [msg, setMsg] = useState('Starting camera…');
  const [lastTicket, setLastTicket] = useState<any>(null);
  const scannerRef = useRef<any>(null);
  const tokenRef = useRef<string | null>(null);
  const [synced, setSynced] = useState(false);
  const [manualId, setManualId] = useState('');

  useEffect(() => {
    (async () => {
      // 1) URL ?t= token (from laptop QR)
      let t = new URLSearchParams(window.location.search).get('t');
      // 2) else try phone's own admin session
      if (!t) {
        const sb = getSupabaseBrowser();
        if (sb) {
          const { data: s } = await sb.auth.getSession();
          t = s.session?.access_token ?? null;
        }
      }
      if (t) {
        tokenRef.current = t;
        setSynced(true);
        setMsg('Scanning ticket QR…');
      } else {
        setMsg('Not synced — login on phone or scan laptop QR');
      }
      startScanner();
    })();
    return () => { try { scannerRef.current?.stop()?.catch(() => {}); } catch {} };
  }, []);

  async function startScanner() {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (scannerRef.current) { try { await scannerRef.current.stop(); } catch {} }
      const html5Qr = new Html5Qrcode('qr-reader');
      scannerRef.current = html5Qr;
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          // If not synced, try to treat scan as laptop sync URL
          if (!tokenRef.current) {
            try {
              const u = new URL(decodedText);
              const tok = u.searchParams.get('t');
              if (tok) {
                tokenRef.current = tok;
                setSynced(true);
                setMsg('Phone synced! Now scan ticket QRs.');
                window.history.replaceState({}, '', '/admin/scan/phone?t=' + encodeURIComponent(tok));
                setTimeout(() => setMsg('Scanning ticket QR…'), 1500);
                return;
              }
            } catch {}
            setMsg('❌ Not synced — login at /login on phone or scan laptop QR');
            return;
          }
          setMsg('Verifying…');
          const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` };
          const r = await fetch('/api/admin/checkin', { method: 'POST', headers, body: JSON.stringify({ action: 'checkin', id: decodedText }) });
          const d = await r.json();
          if (r.ok) {
            if (d.already) setMsg('⚠️ Already checked in: ' + d.booking.id + ' (' + d.booking.name + ')');
            else { setMsg('✅ Entry allowed: ' + d.booking.id + ' — ' + d.booking.name); setLastTicket(d.booking); }
            setTimeout(() => setMsg('Scanning ticket QR…'), 3000);
          } else {
            setMsg('❌ ' + d.error);
            setTimeout(() => setMsg('Scanning ticket QR…'), 3000);
          }
        },
        () => {}
      );
    } catch {
      setMsg('⚠️ Camera blocked. Allow camera permission and reload. Use HTTPS URL.');
    }
  }

  async function manualCheckin() {
    if (!manualId.trim()) return;
    if (!tokenRef.current) { setMsg('❌ Not synced — login at /login first'); return; }
    setMsg('Verifying…');
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` };
    const r = await fetch('/api/admin/checkin', { method: 'POST', headers, body: JSON.stringify({ action: 'checkin', id: manualId.trim() }) });
    const d = await r.json();
    if (r.ok) {
      if (d.already) setMsg('⚠️ Already checked in: ' + d.booking.id);
      else { setMsg('✅ Entry allowed: ' + d.booking.id); setLastTicket(d.booking); }
    } else setMsg('❌ ' + d.error);
  }

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto pt-6">
      <Link href="/admin/scan" className="underline text-sm text-gold">← Laptop view</Link>
      <h1 className="font-display text-3xl gold-text mt-2 text-center">📱 Phone Scanner</h1>
      <p className="text-center text-orange-100/60 text-sm mt-1">{synced ? 'Hold 15cm from ticket QR — good light' : 'Login on phone, then scan ticket directly'}</p>
      {!synced && (
        <div className="mt-3 rounded-xl bg-amber-900/30 border border-amber-500/30 p-4 text-center">
          <p className="text-sm font-bold text-amber-200">⚠️ Phone not logged in as admin</p>
          <p className="text-xs text-amber-100/70 mt-1">Choose one option to sync:</p>
          <div className="mt-3 grid gap-2">
            <Link href="/login?redirect=/admin/scan/phone" className="btn-festive !py-3 text-center block">1️⃣ Login on this phone as admin</Link>
            <p className="text-xs text-orange-100/50">OR</p>
            <p className="text-xs text-amber-100/70">2️⃣ Point camera at the QR on laptop at <span className="font-mono">/admin/scan</span></p>
          </div>
        </div>
      )}
      <div className="mt-4">
        <div id="qr-reader" className="rounded-2xl overflow-hidden bg-black mx-auto" style={{ width: 320, height: 320 }} />
        {msg && (
          <div className={`mt-3 rounded-xl border p-4 font-bold text-center ${msg.startsWith('✅') ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300' : msg.startsWith('⚠️') ? 'bg-amber-900/40 border-amber-500/50 text-amber-300' : msg.startsWith('❌') ? 'bg-red-900/40 border-red-500/50 text-red-300' : 'bg-black/50 border-gold/40 text-orange-100'}`}>
            {msg}
          </div>
        )}
        {lastTicket && (
          <div className="mt-3 rounded-xl bg-black/40 border border-gold/30 p-4">
            <p className="text-xs text-gold tracking-widest">TICKET CHECKED IN ✓</p>
            <p className="font-display text-lg gold-text mt-1">{lastTicket.id}</p>
            <p className="text-sm text-orange-100/75 mt-1">{lastTicket.name} • {lastTicket.phone}</p>
            <p className="text-xs text-orange-100/60 mt-1">{lastTicket.event_session}</p>
          </div>
        )}
        <div className="mt-4 rounded-xl bg-black/40 border border-gold/30 p-3">
          <p className="text-xs text-gold tracking-widest">MANUAL ENTRY</p>
          <div className="flex gap-2 mt-2">
            <input value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="GRB-..." className="flex-1 rounded-xl bg-black/50 border border-gold/30 px-3 py-2 text-sm" />
            <button onClick={manualCheckin} className="btn-festive !py-2 !text-sm">Check</button>
          </div>
        </div>
      </div>
    </main>
  );
}
