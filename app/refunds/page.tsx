import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Refund & Cancellation Policy — Garba Nights 2026',
  description: 'Refund rules for Garba Nights 2026 tickets: cancellations, rescheduling, failed and duplicate payments.',
};

const SECTIONS: Array<[string, string[]]> = [
  ['1. Event cancelled by the organisers', [
    'If Garba Nights 2026 is cancelled, every booking receives a 100% refund including the convenience fee.',
    'UPI payments are refunded to your UPI ID / bank account within 3–5 working days after you share your booking ID and UPI details with us.',
    'If online gateway payments are enabled in future, they will be refunded to the original payment source within 5–7 working days.',
  ]],
  ['2. Event rescheduled', [
    'Your ticket stays valid for the new date automatically — nothing to do.',
    'If you cannot attend the new date, you may request a full refund within 7 days of the reschedule announcement.',
  ]],
  ['3. Change of plans / no-show', [
    'Tickets are non-refundable for change of mind or non-attendance.',
    'One date/session change per booking is allowed up to 48 hours before the event, subject to seat availability — contact us with your booking ID.',
  ]],
  ['4. Failed or duplicate payments', [
    'If money left your account but no confirmed ticket was issued, it is refunded in full once verified (3–5 working days for UPI; 5–7 working days if online gateway payments are enabled).',
    'Duplicate payments for the same booking are refunded in full on request.',
  ]],
  ['5. Convenience fee', [
    'The per-ticket convenience fee is non-refundable except when the organisers cancel the event.',
  ]],
  ['6. How to request a refund', [
    'Write to arambhostav@gmail.com or call/WhatsApp 80963 22227 / 83176 60854 with your booking ID (e.g. GRB-XXXX-XXXX) and the mobile number used for booking.',
    'Eligible refunds are initiated within 2 working days of approval; bank processing times above apply after that.',
  ]],
];

export default function Refunds() {
  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <Navbar />
      <div className="max-w-3xl mx-auto">
        <p className="tracking-[0.3em] text-xs text-gold text-center">GARBA NIGHTS 2026</p>
        <h1 className="font-display text-4xl gold-text text-center mt-2">Refund & Cancellation Policy</h1>
        <p className="text-center text-orange-100/60 text-sm mt-2">Last updated: October 2026</p>
        <div className="mandala-border rounded-3xl p-6 md:p-8 bg-black/40 mt-8 space-y-6">
          {SECTIONS.map(([h, ps]) => (
            <section key={h}>
              <h2 className="font-display text-xl text-gold">{h}</h2>
              {ps.map((p, i) => (
                <p key={i} className="text-sm text-orange-100/80 mt-2 leading-relaxed">• {p}</p>
              ))}
            </section>
          ))}
          <p className="text-sm text-orange-100/60 pt-2">
            Also see our <Link href="/terms" className="underline text-gold">Terms & Conditions</Link> and{' '}
            <Link href="/privacy" className="underline text-gold">Privacy Policy</Link>.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
