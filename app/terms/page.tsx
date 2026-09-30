import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions — Garba Nights 2026',
  description: 'Terms of ticket purchase and event entry for Garba Nights 2026.',
};

const SECTIONS: Array<[string, string[]]> = [
  ['1. The event', [
    'Garba Nights 2026 is organised by Arambhotsav on Oct 15, 2026, 6 PM – midnight at Zoroastrian Club Function Hall, 1-8-183 to 185, SP Road, Secunderabad, Hyderabad 500003. Gates open at 5 PM.',
  ]],
  ['2. Tickets & entry', [
    'Each booking admits the purchased quantity of guests for the selected session only.',
    'Entry requires a valid ticket QR shown from the My Bookings page (printed or on phone). Each QR admits entry once — first scan wins.',
    'You may transfer your ticket by forwarding your QR, but whoever scans first gets entry. We are not responsible for shared or copied QRs.',
    'Kids under 5 enter free with parents.',
    'Please carry a valid photo ID; entry staff may ask to verify the booking name.',
  ]],
  ['3. Conduct & safety', [
    'Outside food, alcohol, tobacco and prohibited items are not allowed inside the venue.',
    'The organisers may refuse entry or remove guests for unsafe behaviour, intoxication or rule violations, without refund.',
    'A family Garba circle is separated from the high-energy DJ circle — please follow volunteer and security instructions.',
  ]],
  ['4. Payments', [
    'Ticket prices and the per-ticket convenience fee are shown before you pay. The amount you approve is the final amount.',
    'Online payments are processed securely by our payment partner (PhonePe). UPI QR payments are verified manually by our team against the transaction ID / UTR you submit.',
    'A booking is confirmed only after payment succeeds (online) or is verified by our team (UPI). Unpaid bookings are not valid for entry.',
  ]],
  ['5. Changes to the event', [
    'If the event is rescheduled, your ticket remains valid for the new date. If it is cancelled by the organisers, you receive a full refund as per our Refund Policy.',
  ]],
  ['6. Liability', [
    'Attendance is at your own risk. The organisers are not liable for personal injury, loss of belongings, or indirect losses, except where the law does not allow such exclusion.',
    'Our total liability for any booking is limited to the ticket amount paid for that booking.',
  ]],
  ['7. Contact', [
    'For queries: 80963 22227 / 83176 60854 or arambhostav@gmail.com.',
  ]],
];

export default function Terms() {
  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <Navbar />
      <div className="max-w-3xl mx-auto">
        <p className="tracking-[0.3em] text-xs text-gold text-center">GARBA NIGHTS 2026</p>
        <h1 className="font-display text-4xl gold-text text-center mt-2">Terms & Conditions</h1>
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
            Also see our <Link href="/refunds" className="underline text-gold">Refund Policy</Link> and{' '}
            <Link href="/privacy" className="underline text-gold">Privacy Policy</Link>.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
