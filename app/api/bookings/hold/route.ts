import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { SESSIONS, bookingId, createBookingRow, fees, getTicketTypes, INCLUDED_RICE, RICE_PACKET_PRICE } from '@/lib/store';
import { verifyToken } from '@/lib/supabase-server';
import { notifyAdminUpiPending, sendPaymentInstructions } from '@/lib/notify';

// Rate-limit: naive in-memory per IP
const hits = new Map<string, { n: number; t: number }>();
function rateLimit(ip: string) {
  const now = Date.now();
  const h = hits.get(ip) || { n: 0, t: now };
  if (now - h.t > 60_000) { h.n = 0; h.t = now; }
  h.n++;
  hits.set(ip, h);
  return h.n <= 20;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'local';
  if (!rateLimit(ip)) return NextResponse.json({ error: 'Too many requests. Try again in a minute.' }, { status: 429 });

  // Booking is only allowed for logged-in users (Supabase session token)
  const authEmail = await verifyToken(req);
  if (!authEmail) return NextResponse.json({ error: 'Please login or sign up to book tickets.' }, { status: 401 });

  const body = await req.json();
  const { session, ticketCode, qty, name, phone, paymentMethod } = body;
  const method = paymentMethod === 'upi' ? 'upi' : 'gateway';
  if (!SESSIONS.includes(session)) return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  const q = Math.min(10, Math.max(1, Number(qty) || 1));
  if (!name || String(name).length < 2) return NextResponse.json({ error: 'Enter your name' }, { status: 400 });
  if (!/^[6-9]\d{9}$/.test(String(phone).replace(/\D/g, '').slice(-10))) return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number' }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(authEmail || ''))) return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 });

  const tickets = await getTicketTypes();
  const tt = tickets.find((t) => t.code === ticketCode && t.sales_open);
  if (!tt) return NextResponse.json({ error: 'Ticket type unavailable' }, { status: 400 });

  // NEVER trust client price — compute server-side
  const subtotal = tt.price * q;
  const { gst, convenience, grand: ticketGrand } = fees(subtotal, q, tt.code);

  // Extra veg rice packets (group passes only) — ₹149 each, base packets included
  const includedRice = INCLUDED_RICE[tt.code] ?? 0;
  let riceExtra = Math.floor(Number(body.riceExtra) || 0);
  if (!Number.isFinite(riceExtra) || riceExtra < 0) riceExtra = 0;
  if (riceExtra > 0 && !includedRice) riceExtra = 0;
  if (riceExtra > 20) riceExtra = 20;
  const riceAmount = riceExtra * RICE_PACKET_PRICE;
  const grand = ticketGrand + riceAmount;
  const riceTotal = includedRice * q + riceExtra;

  const upiId = process.env.NEXT_PUBLIC_UPI_ID;
  const upiName = process.env.NEXT_PUBLIC_UPI_NAME || 'Garba Nights';
  if (method === 'upi' && !upiId) {
    return NextResponse.json({ error: 'UPI payments are not configured yet. Please contact the organisers or use Card.' }, { status: 400 });
  }

  const id = bookingId();
  const qrPayload = JSON.stringify({ bid: id, s: session, t: tt.code, q });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 280, margin: 1 });

  const booking = {
    id,
    ticket_type_id: tt.id,
    event_session: session,
    qty: q,
    amount: grand,
    name: String(name).slice(0, 80),
    phone: String(phone).slice(-10),
    email: String(authEmail).slice(0, 120),
    payment_status: (method === 'upi' ? 'pending' : 'held') as 'pending' | 'held',
    razorpay_order_id: null,
    qr_code: qrDataUrl,
    checked_in: false,
    created_at: new Date().toISOString(),
    rice_packets: riceExtra,
  };
  await createBookingRow(booking);

  // UPI (zero-fee): no gateway order — customer pays to your VPA, team confirms.
  if (method === 'upi') {
    await notifyAdminUpiPending(booking);
    await sendPaymentInstructions(booking);
    const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId!)}&pn=${encodeURIComponent(upiName.trim())}&am=${grand}&cu=INR&tn=${encodeURIComponent(id)}`;
    return NextResponse.json({
      bookingId: id, subtotal, gst, convenience, grand, riceExtra, riceAmount, riceTotal,
      qrCode: qrDataUrl, order: null, demoPay: false,
      razorpayKeyId: null,
      upi: true, upiId, upiName: upiName.trim(), upiDeepLink, upiAmount: grand,
    });
  }

  // Online (Razorpay) payments require gateway keys — never confirm without real payment.
  if (method === 'gateway' && !(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)) {
    return NextResponse.json({ error: 'Online payments are not configured yet. Please use UPI QR.' }, { status: 400 });
  }

  // Create Razorpay order
  let order = null;
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const Razorpay = (await import('razorpay')).default;
    const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
    order = await rz.orders.create({ amount: grand * 100, currency: 'INR', receipt: id });
    const { markBooking } = await import('@/lib/store');
    await markBooking(id, { razorpay_order_id: order.id });
  }

  return NextResponse.json({
    bookingId: id, subtotal, gst, convenience, grand, riceExtra, riceAmount, riceTotal,
    qrCode: qrDataUrl, order, demoPay: !order,
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || null,
  });
}
