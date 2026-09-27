'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';

const FAQS = [
  ['When & where is the event?', 'Oct 15, 2026, 6 PM – midnight at Zoroastrian Club Function Hall, SP Road, Secunderabad. Gates open 5 PM.'],
  ['Do I need to bring dandiya sticks?', 'You can purchase dandiya sticks at the event (stalls available). You may also bring your own decorated sticks.'],
  ['Is there an age limit / kids policy?', 'Kids under 5 enter free with parents. Family Garba circle is separated from the high-energy DJ circle for safety.'],
  ['How does QR entry work?', 'After payment you get a booking ID + QR e-ticket (downloadable PDF). Show it at the gate; staff scan it once to mark checked-in.'],
  ['Refunds & date change?', 'Full refund if the event day is cancelled. Date change allowed once up to 48 hrs before, subject to availability. UPI refunds settle in 3–5 days.'],
  ['What about food & parking?', '20+ food stalls (veg/Jain options), paid parking 500 m from gate, free shuttle every 15 min. Outside food not allowed.'],
];

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {FAQS.map(([q, a], i) => (
        <motion.div
          key={q}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: Math.min(i, 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mandala-border rounded-2xl bg-black/30 overflow-hidden"
        >
          <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full text-left px-5 py-4 font-display text-lg flex justify-between items-center" aria-expanded={open === i}>
            <span>{q}</span>
            <span className={`text-gold text-2xl transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
          </button>
          <div className={`faq-panel ${open === i ? 'open' : ''}`}>
            <div className="faq-inner"><p className="px-5 pb-5 text-orange-100/80">{a}</p></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
