import { NextRequest, NextResponse } from 'next/server';
import { getBooking, markBooking } from '@/lib/store';
import { notifyAdminUpiPaid } from '@/lib/notify';

// Customer records their UPI transaction reference (UTR) after paying.
// Admin later matches this against the credit in their bank/UPI app.
export async function POST(req: NextRequest) {
  const { bookingId, txnRef } = await req.json();
  const ref = String(txnRef || '').replace(/\s+/g, '').toUpperCase();
  if (!bookingId) return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });
  if (!/^[A-Z0-9]{8,20}$/.test(ref)) {
    return NextResponse.json({ error: 'Enter the transaction ID / UTR from your UPI app (letters & numbers).' }, { status: 400 });
  }
  const b = await getBooking(String(bookingId));
  if (!b) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (b.payment_status !== 'pending') {
    return NextResponse.json({ error: 'This booking cannot accept a UPI reference right now.' }, { status: 400 });
  }
  await markBooking(String(bookingId), { upi_txn_ref: ref });
  await notifyAdminUpiPaid({ ...b, upi_txn_ref: ref });
  return NextResponse.json({ ok: true });
}