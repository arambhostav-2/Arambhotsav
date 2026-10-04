import { getBooking, holdTickets, markBooking } from './store';
import { sendEmail } from './notify';

// Single funnel for online-payment confirmation (Razorpay verify + webhook + retry).
// Idempotent: confirming an already-paid booking is a no-op (no double email, no double hold).
export async function confirmOnlineBooking(
  bookingId: string,
  opts: { txnRef?: string; via?: string } = {}
): Promise<{ ok: boolean; already?: boolean }> {
  const b = await getBooking(bookingId);
  if (!b) throw new Error('Booking not found');
  if (b.payment_status === 'paid') return { ok: true, already: true };
  if (b.payment_status !== 'held' && b.payment_status !== 'pending') {
    throw new Error('This booking cannot be confirmed right now.');
  }
  // Money is captured — reserve the seats, then mark paid.
  const held = await holdTickets(b.ticket_type_id, b.qty);
  if (!held) throw new Error('Not enough seats left — contact support for a refund.');
  await markBooking(bookingId, { payment_status: 'paid', ...(opts.txnRef ? { upi_txn_ref: opts.txnRef } : {}) });
  try {
    const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    await sendEmail(
      b.email,
      `🎟️ Garba Nights confirmed — ${bookingId}`,
      `<h2>Shubh Navratri, ${b.name}!</h2><p>Booking <b>${bookingId}</b> • ${b.event_session} • Qty ${b.qty} • ₹${b.amount} — <b>PAID</b>${opts.via ? ` (${opts.via})` : ''}</p><p>Show the QR on <a href="${base}/my-bookings?id=${bookingId}">My Bookings</a> at the gate.</p>${b.qr_code ? `<img src="${b.qr_code}" width="220"/>` : ''}`
    );
  } catch {}
  return { ok: true };
}
