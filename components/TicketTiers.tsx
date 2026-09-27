'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { TicketType } from '@/lib/store';

function tilt(e: React.MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.transform = `perspective(900px) rotateX(${-y * 10}deg) rotateY(${x * 12}deg) translateY(-4px)`;
}
function untilt(e: React.MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
}

export default function TicketTiers() {
  const [tiers, setTiers] = useState<TicketType[]>([]);
  useEffect(() => {
    const load = () => fetch('/api/availability').then((r) => r.json()).then((d) => setTiers(d.tickets || []));
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);
  const totalRemaining = tiers.reduce((s, t) => s + t.remaining_quantity, 0);
  const totalAll = 1000;
  return (
    <>
      {tiers.length > 0 && (
        <p className={`text-center text-sm font-semibold mb-4 ${totalRemaining < 100 ? 'text-red-300' : 'text-emerald-300'}`}>
          {totalAll} seats total • {totalRemaining} left overall
        </p>
      )}
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {tiers.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 56, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
        <div
          onMouseMove={tilt}
          onMouseLeave={untilt}
          className="card-tilt mandala-border rounded-3xl p-6 bg-gradient-to-b from-[#2a0d12]/90 to-[#1a060a]/90 backdrop-blur h-full"
        >
          <p className="text-gold tracking-[0.3em] text-xs">{t.code}</p>
          <h3 className="font-display text-2xl mt-1">{t.name}</h3>
          <p className="font-display text-4xl gold-text mt-2">₹{t.price}</p>
          <p className={`mt-1 text-sm font-semibold ${!t.sales_open ? 'text-red-300' : 'text-emerald-300'}`}>
            {t.sales_open ? 'Sales open' : 'Sales closed'}
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-orange-100/85">
            {t.perks?.map((p) => <li key={p}>✦ {p}</li>)}
          </ul>
          <Link href={`/booking?type=${t.code}`} className="btn-festive !text-base !px-6 !py-3 mt-6 inline-block w-full text-center">
            Book {t.code === 'SINGLE' ? 'Single' : t.name}
          </Link>
        </div>
        </motion.div>
      ))}
    </div>
    </>
  );
}
