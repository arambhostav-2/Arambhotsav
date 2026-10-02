'use client';
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';

export default function Footer() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    const check = async () => {
      const { data } = await sb.auth.getSession();
      setIsAdmin(data.session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    };
    check();
    const { data: listener } = sb.auth.onAuthStateChange((_e, session) => {
      setIsAdmin(session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <footer className="mt-24 border-t border-gold/20 bg-black/40">
      <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
        <div>
          <p className="font-display text-2xl gold-text">🪔 Garba Nights 2026</p>
          <p className="mt-1 text-xs text-orange-100/60">Organised by Arambhotsav</p>
          <p className="mt-2 text-sm text-orange-100/70">Zoroastrian Club Function Hall,<br />1-8-183 to 185, SP Road, Secunderabad, Hyderabad 500003<br />Oct 15 • 6 PM onwards<br /><a href="tel:+918096322227" className="underline">80963 22227</a> • <a href="tel:+918317660854" className="underline">83176 60854</a> • arambhostav@gmail.com</p>
          <div className="flex gap-4 mt-4 text-sm">
            <a href="/about" className="underline text-orange-100/75">About Us</a>
            <a href="/privacy" className="underline text-orange-100/75">Privacy Policy</a>
            <a href="/terms" className="underline text-orange-100/75">Terms</a>
            <a href="/refunds" className="underline text-orange-100/75">Refunds</a>
          </div>
        </div>
        <div>
          <p className="font-display text-lg text-gold">Find us</p>
          <iframe title="Venue map" className="mt-3 w-full h-48 rounded-2xl border border-gold/30" loading="lazy"
            src="https://www.google.com/maps?q=Zoroastrian+Club+Function+Hall+Secunderabad+Hyderabad&output=embed" />
        </div>
        <div>
          <p className="font-display text-lg text-gold">Good to know</p>
          <ul className="mt-3 text-sm space-y-2 text-orange-100/75">
            <li>• Pay by UPI — team verifies & confirms your ticket</li>
            <li>• QR e-ticket + PDF download after payment</li>
            <li>• Any queries? Chat with us: <a href="tel:+918096322227" className="underline">80963 22227</a> / <a href="tel:+918317660854" className="underline">83176 60854</a></li>
            {isAdmin && (
              <li>• <a className="underline" href="/admin">Staff/Admin login</a> • <a className="underline" href="/admin/scan">Gate scanner</a></li>
            )}
          </ul>
        </div>
      </div>
      <p className="text-center text-xs text-orange-100/50 pb-6">© 2026 Garba Nights • Organised by Arambhotsav • Made with 💛 for Navratri</p>
    </footer>
  );
}
