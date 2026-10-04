import { NextRequest, NextResponse } from 'next/server';
import { getBooking, markBooking } from '@/lib/store';

// Create a fresh Razorpay order for an existing unpaid hold (e.g. customer
// closed the checkout mid-payment and taps "Pay online" from My Bookings).
export async function POST(req: NextRequest) {
  const { bookingId } = await req.json();
  if (!bookingId) return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });
  const b = await getBooking(String(bookingId));
  if (!b) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (b.payment_status === 'paid') return NextResponse.json({ ok: true, already: true });
  if (b.payment_status !== 'held' && b.payment_status !== 'pending') {
    return NextResponse.json({ error: 'This booking cannot be paid online right now.' }, { status: 400 });
  }
  if (!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)) {
    return NextResponse.json({ error: 'Online payments are not configured yet. Please use UPI QR.' }, { status: 400 });
  }
  try {
    const Razorpay = (await import('razorpay')).default;
    const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
    const order = await rz.orders.create({ amount: Math.round(b.amount * 100), currency: 'INR', receipt: b.id });
    await markBooking(b.id, { razorpay_order_id: order.id });
    return NextResponse.json({ ok: true, order, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || null });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not start online payment' }, { status: 502 });
  }
}
