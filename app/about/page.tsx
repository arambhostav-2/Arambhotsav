import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'About Us — Garba Nights 2026',
  description: 'Arambhotsav presents Garba Nights 2026 — a Navratri Garba celebration in Secunderabad, Hyderabad.',
};

export default function About() {
  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <Navbar />
      <div className="max-w-3xl mx-auto">
        <p className="tracking-[0.3em] text-xs text-gold text-center">ORGANISED BY ARAMBHOTSAV</p>
        <h1 className="font-display text-4xl gold-text text-center mt-2">About Us</h1>
        <div className="mandala-border rounded-3xl p-6 md:p-8 bg-black/40 mt-8 space-y-4">
          <p className="text-sm text-orange-100/80 leading-relaxed">
            <b className="text-goldlight">Arambhotsav</b> is an event organising team based in Secunderabad, Hyderabad.
            We bring people together around festivals, music and community — and <b className="text-goldlight">Garba Nights 2026</b> is
            our Navratri celebration: one spectacular night of Garba, Dandiya, live music and food stalls.
          </p>
          <p className="text-sm text-orange-100/80 leading-relaxed">
            The event takes place on <b className="text-goldlight">Oct 15, 2026, 6 PM – midnight</b> at the{' '}
            <b className="text-goldlight">Zoroastrian Club Function Hall, 1-8-183 to 185, SP Road, Secunderabad, Hyderabad 500003</b>.
            Tickets are sold exclusively through this website — choose Single, Couple or Group passes, pay securely,
            and enter with your QR e-ticket.
          </p>
          <p className="text-sm text-orange-100/80 leading-relaxed">
            Questions? Reach us at <a href="tel:+918096322227" className="underline text-gold">80963 22227</a> /{' '}
            <a href="tel:+918317660854" className="underline text-gold">83176 60854</a> or{' '}
            <a href="mailto:arambhostav@gmail.com" className="underline text-gold">arambhostav@gmail.com</a>.
          </p>
          <p className="text-sm text-orange-100/60 pt-2">
            <Link href="/booking" className="underline text-gold">Book tickets</Link>
            {' • '}
            <Link href="/terms" className="underline text-gold">Terms</Link>
            {' • '}
            <Link href="/privacy" className="underline text-gold">Privacy</Link>
            {' • '}
            <Link href="/refunds" className="underline text-gold">Refunds</Link>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
