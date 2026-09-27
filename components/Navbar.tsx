'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { clearSession, getSession, setSession, type UserSession } from '@/lib/session';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const sb = getSupabaseBrowser();

    const loadUser = async () => {
      // Prefer Supabase Auth session (email/password)
      if (sb) {
        const { data } = await sb.auth.getSession();
        const authUser = data.session?.user;
        if (authUser) {
          let fullName =
            (authUser.user_metadata as { full_name?: string; name?: string })?.full_name ??
            (authUser.user_metadata as { name?: string })?.name ??
            '';
          let phone =
            (authUser.user_metadata as { phone?: string })?.phone ?? '';
          const { data: prof } = await sb
            .from('profiles')
            .select('full_name, phone')
            .eq('id', authUser.id)
            .maybeSingle();
          if (prof) {
            fullName = (prof as { full_name?: string }).full_name || fullName;
            phone = (prof as { phone?: string }).phone || phone;
          }
          const sess: UserSession = {
            name: fullName || undefined,
            phone,
            email: authUser.email ?? '',
          };
          setSession(sess); // keep booking prefill in sync
          setUser(sess);
          return;
        }
      }
      // Fallback: legacy local session
      setUser(getSession());
    };

    loadUser();

    const { data: listener } = sb
      ? sb.auth.onAuthStateChange(() => loadUser())
      : { data: { subscription: null } };
    const sync = () => loadUser();
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('storage', sync);
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function logout() {
    const sb = getSupabaseBrowser();
    if (sb) await sb.auth.signOut();
    clearSession();
    setUser(null);
    try {
      window.dispatchEvent(new Event('storage'));
    } catch {}
    router.push('/');
  }

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : '');

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-night/85 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,.5)] py-2' : 'bg-transparent py-4'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl">🪔</span>
          <span className="font-display text-xl md:text-2xl gold-text">Garba Nights 2026</span>
        </Link>
        <div className="hidden md:flex items-center gap-3 text-sm font-semibold tracking-wide">
          <Link href="/" className="rounded-full px-5 py-2 border border-gold/60 text-goldlight font-display hover:bg-gold/10 transition">Home</Link>
          <a href="/#about" className="rounded-full px-5 py-2 border border-gold/60 text-goldlight font-display hover:bg-gold/10 transition">About</a>
          <a href="/#tickets" className="rounded-full px-5 py-2 border border-gold/60 text-goldlight font-display hover:bg-gold/10 transition">Tickets</a>
          <a href="/#gallery" className="rounded-full px-5 py-2 border border-gold/60 text-goldlight font-display hover:bg-gold/10 transition">Gallery</a>
          <a href="/#faq" className="rounded-full px-5 py-2 border border-gold/60 text-goldlight font-display hover:bg-gold/10 transition">FAQ</a>
          <Link href="/my-bookings" className="rounded-full px-5 py-2 border border-gold/60 text-goldlight font-display hover:bg-gold/10 transition">My Bookings</Link>
        </div>
        {user && (user.email || user.name) ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full px-5 py-2 border border-gold/60 text-goldlight font-display text-sm max-w-[180px] truncate">🙏 {displayName}</span>
            <button
              onClick={logout}
              className="rounded-full px-5 py-2 border border-gold/60 text-goldlight font-display text-sm hover:bg-gold/10 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-5 py-2 border border-gold/60 text-goldlight font-display text-sm hover:bg-gold/10 transition">Login</Link>
            <Link href="/signup" className="btn-festive !px-6 !py-2.5 !text-base animate-pulse-glow">Sign Up</Link>
          </div>
        )}
      </nav>
    </motion.header>
  );
}
