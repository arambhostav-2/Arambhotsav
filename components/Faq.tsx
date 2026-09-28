'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';

const FAQS = [
  ['🎟️ How do I book a ticket? (step-by-step)',
    '1️⃣ Login or sign up for a free account — your e-tickets are linked to your account.\n2️⃣ Go to the Booking page and pick your session, ticket type and quantity (max 10 per booking).\n3️⃣ Enter your name, 10-digit mobile number and email.\n4️⃣ Tap "Get UPI QR" — scan the QR with any UPI app (GPay, PhonePe, Paytm, BHIM) and pay the exact amount. Screenshot the QR first if you pay from the same phone.\n5️⃣ Copy the transaction ID / UTR from your UPI app (12-digit number in GPay payment details, or Transaction ID in PhonePe/Paytm), paste it in the UTR box and hit "I\'ve paid → Verify my ticket".\n6️⃣ Your booking shows as AWAITING VERIFICATION under My Bookings — our team confirms it within a few minutes and emails your e-ticket.\n7️⃣ On event day, open My Bookings and show your ticket QR at the gate. That\'s it — Shubh Navratri! 🪔'],
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
          className={`mandala-border rounded-2xl bg-black/30 overflow-hidden ${i === 0 ? 'ring-2 ring-gold shadow-[0_0_28px_rgba(245,196,81,0.35)] bg-gold/5' : ''}`}
        >
          <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full text-left px-5 py-4 font-display text-lg flex justify-between items-center" aria-expanded={open === i}>
            <span>{q}{i === 0 && <span className="ml-2 align-middle text-[11px] font-sans font-bold tracking-widest bg-gold text-maroon rounded-full px-2.5 py-0.5">START HERE</span>}</span>
            <span className={`text-gold text-2xl transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
          </button>
          <div className={`faq-panel ${open === i ? 'open' : ''}`}>
            <div className="faq-inner"><p className="px-5 pb-5 text-orange-100/80 whitespace-pre-line">{a}</p></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
