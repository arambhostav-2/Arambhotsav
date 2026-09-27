'use client';
import { useEffect, useState } from 'react';

export const EVENT_DATE = new Date('2026-10-15T18:00:00+05:30');

export default function Countdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const fn = () => {
      const diff = Math.max(0, EVENT_DATE.getTime() - Date.now());
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor(diff / 3600000) % 24,
        m: Math.floor(diff / 60000) % 60,
        s: Math.floor(diff / 1000) % 60,
      });
    };
    fn();
    const id = setInterval(fn, 1000);
    return () => clearInterval(id);
  }, []);
  const cells = [
    [t.d, 'Days'], [t.h, 'Hours'], [t.m, 'Mins'], [t.s, 'Secs'],
  ] as const;
  return (
    <div className="flex gap-3 justify-center">
      {cells.map(([v, l]) => (
        <div key={l} className="mandala-border rounded-2xl bg-black/40 backdrop-blur px-4 py-3 min-w-[74px] text-center">
          <div className="font-display text-3xl gold-text tabular-nums">{String(v).padStart(2, '0')}</div>
          <div className="text-[11px] tracking-[0.25em] text-goldlight/80">{l.toUpperCase()}</div>
        </div>
      ))}
    </div>
  );
}
