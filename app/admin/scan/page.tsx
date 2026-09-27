'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export default function Scan() {
  const [scanQrDataUrl, setScanQrDataUrl] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [status, setStatus] = useState('Waiting…');
  const [laptopHost, setLaptopHost] = useState('');
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    setLaptopHost(window.location.host);
    (async () => {
      const sb = getSupabaseBrowser();
      if (!sb) { setStatus('🔒 Admin login required.'); return; }
      const { data: s } = await sb.auth.getSession();
      if (!s.session) { setStatus('🔒 Admin login required.'); return; }
      const token = s.session.access_token;
      // Encode the phone URL so staff phones connect (production uses https)
      const phoneUrl = `https://${laptopHost}/admin/scan/phone?t=${token}`;
      const url = await QRCode.toDataURL(phoneUrl, { width: 240, margin: 2, color: { dark: '#160409', light: '#ffffff' } });
      setScanQrDataUrl(url);
      setStatus('Scan the QR below with your phone');
      setPolling(true);
      const id = setInterval(async () => {
        try {
          const r = await fetch('/api/admin/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'list' }),
          });
          if (r.ok) {
            const d = await r.json();
            if (d.results) setResults(d.results);
          }
        } catch {}
      }, 3000);
      return () => { clearInterval(id); };
    })();
  }, [laptopHost]);

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto pt-6">
      <Link href="/admin" className="underline text-sm text-gold">← Dashboard</Link>
      <h1 className="font-display text-3xl gold-text mt-2 text-center">📷 Gate Scanner</h1>
      <p className="text-center text-orange-100/60 text-sm mt-1">Laptop view — phone scans tickets</p>

      <div className="mandala-border rounded-2xl p-5 bg-black/40 mt-6 text-center">
        <p className="text-xs text-gold tracking-widest">SCAN QR WITH YOUR PHONE</p>
        <p className="text-sm text-orange-100/60 mt-1 break-all">{laptopHost && `https://${laptopHost}`}</p>
        <p className="text-[11px] text-orange-100/50 mt-1">Phone needs internet (camera requires HTTPS). Keep this page open on the big screen.</p>
        {scanQrDataUrl ? (
          <img src={scanQrDataUrl} alt="Scan me" className="w-48 h-48 mx-auto mt-3 rounded-xl bg-white p-2" />
        ) : (
          <div className="w-48 h-48 mx-auto mt-3 grid place-items-center"><div className="rangoli" /></div>
        )}
        <p className="text-sm text-orange-100/75 mt-2">{status}</p>
      </div>

      {/* Live results */}
      <div className="mt-6 space-y-3">
        <p className="font-display text-lg gold-text">📋 Live Check-ins</p>
        {results.length === 0 ? (
          <p className="text-sm text-orange-100/50">No check-ins yet.</p>
        ) : (
          results.map((r: any, i: number) => (
            <div key={i} className={`rounded-xl border p-3 ${
              r.ok ? 'bg-emerald-900/30 border-emerald-500/30' :
              'bg-red-900/30 border-red-500/30'
            }`}>
              <p className={`font-bold ${r.ok ? 'text-emerald-300' : 'text-red-300'}`}>
                {r.ok ? (r.already ? '⚠️ ' : '✅ ') + r.id + ' — ' + r.name : '❌ ' + r.id + ': ' + r.error}
              </p>
              <p className="text-xs text-orange-100/50">{new Date(r.time).toLocaleString('en-IN')}</p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
