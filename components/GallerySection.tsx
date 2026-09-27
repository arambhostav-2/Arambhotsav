'use client';

import { useEffect, useState } from 'react';
import Reveal from '@/components/Reveal';

type Photo = { id: string; url: string; caption?: string };

const FALLBACK = [
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=70',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=70',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=70',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=70',
];

export default function GallerySection() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<Photo | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/gallery', { cache: 'no-store' });
        const d = await r.json();
        const list: Photo[] = d.photos || [];
        setPhotos(list.length ? list : FALLBACK.map((url, i) => ({ id: String(i), url })));
      } catch {
        setPhotos(FALLBACK.map((url, i) => ({ id: String(i), url })));
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const fallback: Photo[] = FALLBACK.map((url, i) => ({ id: String(i), url }));
  const images = photos.length ? photos : fallback;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActive(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return (
    <section id="gallery" className="max-w-7xl mx-auto px-4 mt-20">
      <Reveal>
        <h2 className="font-display text-4xl md:text-5xl text-center gold-text">Glimpses of Last Year</h2>
        <p className="text-center text-orange-100/70 mt-2">Fresh photos uploaded by our team.</p>
      </Reveal>
      {!loaded ? (
        <div className="grid place-items-center h-52 mt-8"><div className="rangoli" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {images.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <button type="button" onClick={() => setActive(p)} className="block w-full cursor-zoom-in" aria-label="Open photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.caption || `Garba night ${i + 1}`}
                  loading="lazy"
                  className="rounded-2xl h-52 w-full object-cover border border-gold/25 hover:scale-[1.03] transition-transform"
                />
              </button>
            </Reveal>
          ))}
        </div>
      )}

      {/* LIGHTBOX — quarter-screen popup */}
      {active && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="w-[86vw] h-[45vh] md:w-1/2 md:h-1/2 max-w-[720px] max-h-[540px] relative grid place-items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.caption || 'Garba night'}
              className="max-w-full max-h-full object-contain rounded-xl border border-gold/40 shadow-[0_10px_60px_rgba(0,0,0,.7)]"
            />
            {active.caption && (
              <p className="absolute -bottom-7 left-0 right-0 text-center text-xs text-orange-100/80">{active.caption}</p>
            )}
            <button
              onClick={() => setActive(null)}
              aria-label="Close"
              className="absolute -top-10 right-0 md:-right-10 w-9 h-9 rounded-full border border-gold/60 text-goldlight hover:bg-gold/20 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}