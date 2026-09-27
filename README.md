# 🪔 Navratri Garba Nights — Ticket Booking App

Festival-themed, animated, production-style booking system: Next.js 14 + Tailwind + Framer Motion + Three.js diya, Supabase/Postgres (or in-memory demo), Razorpay test-mode payments, QR e-tickets, admin dashboard + gate scanner.

## Run locally (2 min, no keys needed)

```powershell
cd "ticket booking"
npm install
npm run dev   # http://localhost:3000
```

Demo mode works with **zero env vars** (in-memory inventory, instant demo-pay, no email). Add keys to go live.

## Env vars (copy `.env.example` → `.env.local`)

| Key | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Durable DB + realtime. Without these, app uses in-memory store. Run `supabase/schema.sql` in Supabase SQL editor, then enable Realtime for `ticket_types`, `bookings`. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Test-mode payments (`rzp_test_…`). Without these, checkout uses one-click demo-pay. Webhook: set `https://<domain>/api/payments/webhook` in Razorpay dashboard (event `payment.captured`) as source of truth. |
| `RESEND_API_KEY`, `RESEND_FROM` | Confirmation email with QR. Skipped silently if unset. |
| `ADMIN_PASSWORD` | Staff gate (default `garba-admin-123`). Use Supabase Auth in production. |
| `NEXT_PUBLIC_APP_URL` | Used in email links. |

## How booking prevents oversell

1. `POST /api/bookings/hold` validates + computes price **server-side**, then atomically decrements `remaining_quantity` via Postgres `hold_tickets()` RPC (`WHERE remaining >= qty`) or the in-memory equivalent.
2. Booking row created as `held` with QR payload; a 10-min timer auto-releases unpaid holds.
3. Razorpay order created (or demo-pay). `POST /api/payments/verify` checks the HMAC signature; the **webhook** (`/api/payments/webhook`) re-confirms `payment.captured` as source of truth.
4. Availability API is polled every 4s; with Supabase configured, swap to a realtime channel on `ticket_types` (realtime flag returned by the API).

## Key routes

- `/` — hero (parallax Durga image + particles + 3D diya + countdown), tiers, gallery, sponsors, FAQ
- `/booking` — session/type/qty/details → Razorpay/demo-pay → redirect to e-ticket
- `/my-bookings?id=GRB-…` — animated success + QR + print-to-PDF
- `/admin` — revenue, sold/type chart (Recharts), searchable table, check-in, CSV export
- `/admin/scan` — camera QR scanner for gate staff (html5-qrcode)

## Images

Drop your licensed Durga Maa photo at `public/assets/durga-hero.jpg` (currently falls back to Unsplash if missing). Compress to ~200–400 KB WebP/JPG and keep `next/image` lazy-loading for gallery.

## Deploy

Frontend → Vercel (`npm run build`). Set env vars in Vercel dashboard. Supabase free tier is enough for the event. Switch Razorpay to **live keys** only after a successful test payment + webhook delivery.

## Security notes

Server-side price calc, input validation, HMAC verification, webhook source-of-truth, naive IP rate-limit on holds (use Upstash/Vercel firewall in prod), admin key gate (replace with proper auth for real events).
