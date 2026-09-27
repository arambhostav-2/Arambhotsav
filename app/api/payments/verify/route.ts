import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getBooking, markBooking } from '@/lib/store';

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({ from: process.env.RESEND_FROM || 'Garba Nights <tickets@example.com>', to, subject, html });
}

// Client calls this after Razorpay success (demo-pay calls it directly).
// Webhook below is the source of truth; this marks paid only with valid signature OR demo mode.
export async function POST(req: NextRequest) {
  const { bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();
  const b = await getBooking(bookingId);
  if (!b) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (b.payment_status === 'paid') return NextResponse.json({ ok: true, already: true });

  if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature) {
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (expected !== razorpay_signature) return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }
  await markBooking(bookingId, { payment_status: 'paid' });
  try {
    await sendEmail(b.email, `🎟️ Garba Nights confirmed — ${bookingId}`,
      `<h2>Shubh Navratri, ${b.name}!</h2><p>Booking <b>${bookingId}</b> • ${b.event_session} • Qty ${b.qty} • ₹${b.amount} — <b>PAID</b></p><p>Show the QR on <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-bookings?id=${bookingId}">My Bookings</a> at the gate.</p><img src="${b.qr_code}" width="220"/>`);
  } catch {}
  return NextResponse.json({ ok: true });
}
