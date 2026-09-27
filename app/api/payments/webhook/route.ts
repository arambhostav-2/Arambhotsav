import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { listBookings, markBooking } from '@/lib/store';

// Razorpay webhook — source of truth. Configure URL in Razorpay dashboard:
// https://<your-domain>/api/payments/webhook  (events: payment.captured)
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get('x-razorpay-signature') || '';
  if (process.env.RAZORPAY_KEY_SECRET) {
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(raw).digest('hex');
    if (expected !== sig) return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }
  try {
    const evt = JSON.parse(raw);
    const orderId = evt?.payload?.payment?.entity?.order_id;
    if (orderId && evt.event?.includes('captured')) {
      const all = await listBookings();
      const b = all.find((x) => x.razorpay_order_id === orderId);
      if (b && b.payment_status !== 'paid') await markBooking(b.id, { payment_status: 'paid' });
    }
  } catch {}
  return NextResponse.json({ ok: true });
}
