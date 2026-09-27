import { NextResponse } from 'next/server';
import { getTicketTypes, publicClient } from '@/lib/store';

export async function GET() {
  const tickets = await getTicketTypes();
  return NextResponse.json({ tickets, realtime: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
