import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Garba Nights 2026',
  description: 'How Garba Nights (Arambhotsav) collects, uses and protects your personal data.',
};

const SECTIONS: Array<[string, string[]]> = [
  ['1. Who we are', [
    'Garba Nights 2026 is organised by Arambhotsav, Secunderabad, Hyderabad.',
    'For any privacy question, contact us at arambhostav@gmail.com or 80963 22227 / 83176 60854.',
  ]],
  ['2. Data we collect', [
    'Account details: your name and email address when you sign up or log in.',
    'Booking details: name, 10-digit mobile number, email, ticket type, quantity and event session.',
    'Payment references: the UPI transaction ID / UTR you submit after paying (we currently collect payments via manual UPI transfer). If online payments are enabled in future, we will additionally receive the transaction reference returned by our payment partner — we never see or store your UPI PIN, card numbers or bank passwords.',
    'Technical data: login session and basic device/browser information needed to keep you signed in and prevent fraud.',
  ]],
  ['3. How we use your data', [
    'To create and manage your ticket bookings and e-tickets (including the entry QR code).',
    'To confirm payments, verify UPI credits and send booking confirmations by email.',
    'To check you in at the venue and provide customer support.',
    'To send important event updates (timing, venue or gate changes). We do not send marketing spam.',
  ]],
  ['4. Who we share it with', [
    'Payment processing: we currently collect payments via manual UPI transfer to our UPI ID, verified against the transaction ID / UTR you submit. If online gateway payments are enabled in future, our payment partner will receive the amount and order details needed to process your payment.',
    'Email delivery: our email service provider, to send confirmations and tickets.',
    'We do not sell, rent or share your personal data with any third party for their own marketing.',
  ]],
  ['5. Storage & security', [
    'Your data is stored securely on Supabase infrastructure with restricted, authenticated access available only to the organising team.',
    'Entry staff at the gate see only the details needed to verify your ticket (name and booking validity).',
  ]],
  ['6. Data retention', [
    'Booking records are retained for the event and a reasonable accounting period afterwards.',
    'You may request deletion of your account data at any time by writing to arambhostav@gmail.com — we will delete what the law allows us to delete.',
  ]],
  ['7. Your rights', [
    'You can ask for a copy of the data we hold about you, ask us to correct it, or ask us to delete it, by contacting arambhostav@gmail.com. We respond within 7 working days.',
  ]],
  ['8. Children', [
    'Bookings are made by adults. Kids under 5 enter free with parents and we do not knowingly collect data directly from children.',
  ]],
  ['9. Changes to this policy', [
    'If this policy changes, the updated version will be posted on this page with a revised date. Continued use of the site after changes means you accept the updated policy.',
  ]],
];

export default function Privacy() {
  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <Navbar />
      <div className="max-w-3xl mx-auto">
        <p className="tracking-[0.3em] text-xs text-gold text-center">GARBA NIGHTS 2026</p>
        <h1 className="font-display text-4xl gold-text text-center mt-2">Privacy Policy</h1>
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
            Questions? <Link href="/booking" className="underline text-gold">Book tickets</Link> or write to{' '}
            <a href="mailto:arambhostav@gmail.com" className="underline text-gold">arambhostav@gmail.com</a>.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
