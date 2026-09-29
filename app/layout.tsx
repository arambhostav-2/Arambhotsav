import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Navratri Garba Nights 2026 — Book Dandiya Tickets',
  description:
    'One spectacular night of Garba, Dandiya, live music and food stalls. Book Single, Couple & Group passes with live seat availability, UPI payments & QR e-tickets.',
  openGraph: {
    title: 'Navratri Garba Nights 2026',
    description: 'Book Garba/Dandiya tickets — live availability, UPI payments, QR entry.',
    images: ['/assets/durga-hero.jpg'],
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Yatra+One&family=Rajdhani:wght@500;600;700&family=Mukta:wght@400;500;600&family=Cinzel+Decorative:wght@700;900&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&display=swap"
          rel="stylesheet"
        />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body suppressHydrationWarning>
        <div id="loader" suppressHydrationWarning className="fixed inset-0 z-[100] grid place-items-center bg-night transition-opacity duration-500">
          <div suppressHydrationWarning className="flex flex-col items-center gap-4">
            <div suppressHydrationWarning className="rangoli" />
            <p suppressHydrationWarning className="font-display text-gold tracking-widest">SHUBH NAVRATRI…</p>
          </div>
        </div>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `window.addEventListener('load',()=>{setTimeout(()=>{var l=document.getElementById('loader');if(l){l.style.opacity='0';setTimeout(()=>l.remove(),550)}} ,700)});setTimeout(()=>{var l=document.getElementById('loader');if(l){l.style.opacity='0';setTimeout(()=>l.remove(),550)}},3500);` }} />
      </body>
    </html>
  );
}
