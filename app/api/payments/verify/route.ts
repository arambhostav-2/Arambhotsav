import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getBooking } from '@/lib/store';
import { confirmOnlineBooking } from '@/lib/online-pay';

// Client calls this after Razorpay checkout success.
// Webhook below is the backup source of truth; both funnel into confirmOnlineBooking.
export async function POST(req: NextRequest) {
  const { bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();
  const b = await getBooking(String(bookingId || ''));
  if (!b) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (b.payment_status === 'paid') return NextResponse.json({ ok: true, already: true });

  if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature) {
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (expected !== razorpay_signature) return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }
  // Bind payment to booking: the order id must match the one we created for it.
  if (b.razorpay_order_id && razorpay_order_id && b.razorpay_order_id !== razorpay_order_id) {
    return NextResponse.json({ error: 'Payment does not match this booking.' }, { status: 400 });
  }
  try {
    const r = await confirmOnlineBooking(b.id, {
      txnRef: razorpay_payment_id ? String(razorpay_payment_id) : undefined,
      via: 'online',
    });
    return NextResponse.json({ ok: true, already: r.already });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not confirm payment' }, { status: 409 });
  }
}
