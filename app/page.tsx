'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Particles from '@/components/Particles';
import Countdown from '@/components/Countdown';
import Reveal from '@/components/Reveal';
import TicketTiers from '@/components/TicketTiers';
import GallerySection from '@/components/GallerySection';
import Faq from '@/components/Faq';
import Footer from '@/components/Footer';

function useParallax() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const fn = () => { el.style.transform = `translateY(${window.scrollY * 0.22}px)`; };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return ref;
}

function Counters() {
  const [daysLeft, setDaysLeft] = useState(0);
  useEffect(() => {
    const target = Math.max(0, Math.ceil((new Date('2026-10-15').getTime() - Date.now()) / 86400000));
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 1400);
      setDaysLeft(Math.round(target * p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);
  return (
    <div className="max-w-xs mx-auto">
      <div className="mandala-border rounded-2xl bg-black/40 py-5 text-center">
        <div className="font-display text-3xl md:text-4xl gold-text tabular-nums">{daysLeft.toLocaleString('en-IN')}</div>
        <div className="text-xs tracking-[0.25em] text-goldlight/70 mt-1">DAYS LEFT</div>
      </div>
    </div>
  );
}

export default function Home() {
  const bgRef = useParallax();
  const sponsors = ['Shree Jewels', 'Amulya Sarees', 'Dandiya Beats FM', 'Swad Food Court', 'UPI Pay', 'Heritage Silks', 'City Cabs', 'Glow Cosmetics'];
  return (
    <main className="overflow-x-clip">
      <Navbar />
      {/* HERO */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
        <div ref={bgRef} className="absolute -inset-y-16 inset-x-0 will-change-transform">
          {/* Blurred fill so the hero always covers the screen */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/durga-hero.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-[120%] object-cover blur-2xl scale-110 opacity-60 animate-ken-burns"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          {/* Full image — never cropped */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/durga-hero.jpg" alt="Goddess Durga Maa" className="absolute inset-x-0 top-0 w-full h-full object-contain [object-position:50%_0%]"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?w=1920&q=80'; }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-night/20 via-night/25 to-[#3a0b07]" />
        <div className="absolute inset-0 petals"><Particles density={70} /></div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-28 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
            className="mt-2 drop-shadow-[0_3px_18px_rgba(0,0,0,.9)]"
          >
            <div className="flex items-center justify-center gap-4">
              <span className="h-px w-14 md:w-28 bg-gradient-to-r from-transparent to-gold/80" />
              <p className="font-cormorant font-semibold tracking-[0.45em] text-gold text-xs md:text-sm">SHUBH NAVRATRI</p>
              <span className="h-px w-14 md:w-28 bg-gradient-to-l from-transparent to-gold/80" />
            </div>
            <p className="mt-2 font-cormorant tracking-[0.35em] text-goldlight/90 text-[11px] md:text-xs">OCT 15 • SECUNDERABAD</p>
            <h1 className="mt-4 font-royal font-black gold-text text-6xl md:text-8xl leading-none">Garba Night</h1>
            <p className="mt-2 font-cormorant font-semibold tracking-[0.22em] gold-text text-3xl md:text-5xl">ARAMBHOTSAV</p>
            <div className="mt-1 flex items-center justify-center gap-4">
              <span className="text-gold/70 text-2xl md:text-3xl inline-block -scale-x-100">❧</span>
              <span className="font-royal font-bold gold-text text-5xl md:text-6xl">2.0</span>
              <span className="text-gold/70 text-2xl md:text-3xl">❧</span>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4">
              <span className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent to-gold/70" />
              <p className="font-cormorant tracking-[0.3em] text-goldlight text-sm md:text-base">by OG Crew</p>
              <span className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent to-gold/70" />
            </div>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 text-orange-100/85 max-w-2xl mx-auto">
            Photo booths • Instant reels • 20+ food stalls • Traditional bazaar.<br />Zoroastrian Club, Secunderabad, 6 PM onwards.
          </motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }} className="mt-6">
            <Countdown />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-8 flex gap-4 justify-center flex-wrap">
            <Link href="/booking" className="btn-festive animate-pulse-glow">🎟️ Book Tickets</Link>
            <a href="#about" className="rounded-full px-8 py-4 border border-gold/60 text-goldlight font-display hover:bg-gold/10">Explore Event</a>
          </motion.div>
        </div>
      </section>

      {/* COUNTERS */}
      <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-10"><Reveal><Counters /></Reveal></section>

      {/* ABOUT */}
      <section id="about" className="max-w-7xl mx-auto px-4 mt-20">
        <Reveal><h2 className="font-display text-4xl md:text-5xl text-center gold-text">About the Event</h2></Reveal>
        <div className="grid md:grid-cols-3 gap-5 mt-8">
          {[
             ['🥁', 'Live Garba & Dandiya', 'Folk + DJ night with photo booths, instant reels and a 5000-person Garba circle.'],
            ['🍛', 'Food & Bazaar', 'Kutchi dabeli to Jain specials, plus bandhani, chaniya-choli & jewellery stalls.'],
            ['📸', 'Photo Booth & Instant Reels', 'Themed Garba booths, 360° reels and instant Instagram-ready videos to capture your night.'],
          ].map(([e, h, p], i) => (
            <Reveal key={h} delay={i * 0.15}><div className="mandala-border rounded-3xl p-6 bg-black/40">
              <div className="text-4xl">{e}</div><h3 className="font-display text-2xl mt-2 text-goldlight">{h}</h3><p className="text-orange-100/75 mt-2">{p}</p>
            </div></Reveal>
          ))}
        </div>
      </section>

      {/* TICKETS */}
      <section id="tickets" className="max-w-7xl mx-auto px-4 mt-20">
        <Reveal><h2 className="font-display text-4xl md:text-5xl text-center gold-text">Choose Your Pass</h2>
        <p className="text-center text-orange-100/70 mt-2">Live availability — seats update in real time for everyone.</p></Reveal>
        <div className="mt-8"><TicketTiers /></div>
      </section>

      {/* GALLERY */}
      <GallerySection />

      {/* SPONSORS */}
      <section className="mt-20 border-y border-gold/20 bg-black/30 py-5 overflow-hidden">
        <div className="marquee-track flex gap-10 whitespace-nowrap w-max px-4">
          {[...sponsors, ...sponsors].map((s, i) => (
            <span key={i} className="font-display text-xl text-goldlight/80">✦ {s}</span>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-7xl mx-auto px-4 mt-20">
        <Reveal><h2 className="font-display text-4xl md:text-5xl text-center gold-text">FAQs</h2></Reveal>
        <div className="mt-8"><Faq /></div>
      </section>

      <Footer />
    </main>
  );
}
