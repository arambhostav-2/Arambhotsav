import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/supabase-server';
import { listBookings } from '@/lib/store';

/** Returns every booking belonging to the currently logged-in user. */
export async function GET(req: NextRequest) {
  const email = await verifyToken(req);
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const bookings = await listBookings();
  const mine = bookings.filter((b) => b.email === email);
  return NextResponse.json({ bookings: mine });
}
