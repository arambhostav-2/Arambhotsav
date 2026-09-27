import { NextRequest, NextResponse } from 'next/server';
import { getBooking } from '@/lib/store';
import { verifyToken } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const email = await verifyToken(req);
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
  const b = await getBooking(id);
  if (!b) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (b.email !== email) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ booking: b });
}
