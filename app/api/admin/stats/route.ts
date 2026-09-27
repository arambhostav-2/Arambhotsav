import { NextRequest, NextResponse } from 'next/server';
import { getTicketTypes, listBookings } from '@/lib/store';
import { verifyToken } from '@/lib/supabase-server';

async function authed(req: NextRequest) {
  const email = await verifyToken(req);
  return email === process.env.ADMIN_EMAIL;
}

export async function GET(req: NextRequest) {
  if (!await authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const [tickets, bookings] = await Promise.all([getTicketTypes(), listBookings()]);
  const paid = bookings.filter((b) => b.payment_status === 'paid');
  const revenue = paid.reduce((s, b) => s + b.amount, 0);
  const perType = tickets.map((t) => ({
    code: t.code, sold: t.total_quantity - t.remaining_quantity, remaining: t.remaining_quantity,
    revenue: paid.filter((b) => b.ticket_type_id === t.id).reduce((s, b) => s + b.amount, 0),
  }));
  return NextResponse.json({ revenue, ticketsSold: paid.reduce((s, b) => s + b.qty, 0), bookings, perType });
}
