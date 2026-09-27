import { NextRequest, NextResponse } from 'next/server';
import { getBooking, markBooking, updateTicketType, listBookings } from '@/lib/store';
import { verifyToken } from '@/lib/supabase-server';

async function authed(req: NextRequest) {
  const email = await verifyToken(req);
  return email === process.env.ADMIN_EMAIL;
}

async function sendConfirmEmail(b: any) {
  if (!process.env.BREVO_API_KEY) return;
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const link = `${base}/my-bookings?id=${encodeURIComponent(b.id)}&fresh=1`;
  const { sendEmail } = await import('@/lib/notify');
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#160409;color:#fff7ed;padding:28px;border-radius:18px;max-width:560px">
      <p style="font-size:24px;margin:0">🪔 Garba Nights 2026</p>
      <h1 style="color:#f5c451;font-size:22px;margin:14px 0 6px">✅ Your ticket is confirmed!</h1>
      <p style="margin:0 0 4px">Shubh Navratri, <b>${b.name}</b>!</p>
      <p style="margin:0 0 18px;color:#fed7aa">Your UPI payment has been verified. Your e-ticket is ready — you can view it and download / print it any time.</p>
      <div style="background:rgba(0,0,0,.35);border:1px solid rgba(245,196,81,.4);border-radius:14px;padding:16px">
        <p style="margin:0 0 6px"><b>Booking ID:</b> ${b.id}</p>
        <p style="margin:0 0 6px"><b>Session:</b> ${b.event_session}</p>
        <p style="margin:0 0 6px"><b>Tickets:</b> ${b.qty}</p>
        <p style="margin:0"><b>Amount paid:</b> ₹${b.amount}${b.upi_txn_ref ? ` &nbsp;•&nbsp; <b>UPI Ref:</b> <code>${b.upi_txn_ref}</code>` : ''}</p>
      </div>
      <p style="margin:22px 0 8px;text-align:center">
        <a href="${link}" style="background:#f5c451;color:#5c0a0a;padding:13px 26px;border-radius:9999px;text-decoration:none;font-weight:bold;display:inline-block">View &amp; Download Ticket</a>
      </p>
      ${b.qr_code ? `<p style="text-align:center;margin:10px 0 0"><img src="${b.qr_code}" width="200" alt="Ticket QR" style="background:#fff;padding:8px;border-radius:12px"/></p>
      <p style="text-align:center;color:#fed7aa;font-size:13px;margin-top:8px">Show this QR at the gate 🎫</p>` : ''}
      <p style="color:#fdba74;font-size:13px;margin-top:22px">Zoroastrian Club Function Hall, 1-8-183 to 185, SP Road, Secunderabad, Hyderabad 500003 • Oct 15, 6 PM onwards<br/>Queries: 80963 22227 / 83176 60854</p>
    </div>`;
  await sendEmail(b.email, `🎟️ Your Garba Nights ticket is confirmed — ${b.id}`, html);
}

export async function POST(req: NextRequest) {
  if (!await authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  if (body.action === 'list') {
    const all = await listBookings();
    const recent = all.filter((b: any) => b.checked_in).slice(-20).map((b: any) => ({
      id: b.id, name: b.name, phone: b.phone, event_session: b.event_session,
      ok: true, time: b.created_at,
    }));
    return NextResponse.json({ results: recent });
  }
  if (body.action === 'checkin') {
    let id = String(body.id || '');
    try { const p = JSON.parse(id); if (p.bid) id = p.bid; } catch {}
    const b = await getBooking(id);
    if (!b) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    if (b.payment_status !== 'paid') return NextResponse.json({ error: 'Ticket not paid' }, { status: 400 });
    if (b.checked_in) return NextResponse.json({ ok: true, already: true, booking: b });
    await markBooking(id, { checked_in: true });
    return NextResponse.json({ ok: true, booking: { ...b, checked_in: true } });
  }
  if (body.action === 'confirmPayment') {
    const enteredRef = String(body.txnRef || '').replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z0-9]{8,20}$/.test(enteredRef)) {
      return NextResponse.json({ error: 'Enter the valid transaction ID / UTR from your UPI app.' }, { status: 400 });
    }
    let id = String(body.id || '');
    try { const p = JSON.parse(id); if (p.bid) id = p.bid; } catch {}
    const b = await getBooking(id);
    if (!b) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    if (b.payment_status === 'paid') return NextResponse.json({ ok: true, already: true });
    if (b.payment_status !== 'pending') return NextResponse.json({ error: 'This booking is not awaiting UPI confirmation.' }, { status: 400 });
    const storedRef = String(b.upi_txn_ref || '').toUpperCase();
    if (!storedRef) {
      return NextResponse.json({ error: 'No transaction reference recorded yet. The customer must submit their UTR first.' }, { status: 400 });
    }
    if (enteredRef !== storedRef) {
      return NextResponse.json({ error: `Mismatch: you entered ${enteredRef}, the customer recorded ${storedRef}. Only a matching UTR confirms the payment.` }, { status: 400 });
    }
    await markBooking(id, { payment_status: 'paid', upi_txn_ref: enteredRef });
    try {
      await sendConfirmEmail(b);
      console.log(`[confirm-email] sent for booking ${b.id}`);
    } catch (e) {
      console.error('[confirm-email] FAILED for booking', b.id, e);
    }
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'updateTicket') {
    await updateTicketType(body.id, { total_quantity: body.total_quantity, remaining_quantity: body.remaining_quantity, sales_open: body.sales_open });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
