import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ---------- Types ----------
export type TicketType = {
  id: string;
  code: 'EARLY_BIRD' | 'SINGLE' | 'COUPLE' | 'GROUP3' | 'GROUP5' | 'GROUP9' | 'GROUP3_NR' | 'GROUP5_NR' | 'GROUP9_NR';
  name: string;
  price: number;
  total_quantity: number;
  remaining_quantity: number;
  sales_open: boolean;
  perks: string[];
};

export type Booking = {
  id: string;
  ticket_type_id: string;
  event_session: string;
  qty: number;
  amount: number;
  name: string;
  phone: string;
  email: string;
  payment_status: 'held' | 'pending' | 'paid' | 'failed' | 'released';
  razorpay_order_id?: string | null;
  upi_txn_ref?: string | null;
  qr_code: string;
  checked_in: boolean;
  created_at: string;
  rice_packets?: number | null;
};

export type GalleryPhoto = {
  id: string;
  url: string;
  path?: string | null;
  caption?: string;
  position?: number;
  created_at?: string;
};

export const SESSIONS = [
  'Oct 15 — 6pm to 11pm',
];

// Veg rice: base packets included per group pass; extra packets cost ₹149 each
export const RICE_PACKET_PRICE = 149;
export const INCLUDED_RICE: Record<string, number> = { GROUP3: 1, GROUP5: 2, GROUP9: 3 };

const DEFAULT_TICKETS: TicketType[] = [
  { id: 't-earlybird', code: 'EARLY_BIRD', name: 'Single Early Bird', price: 299, total_quantity: 250, remaining_quantity: 250, sales_open: true, perks: ['1 Garba night entry', 'Access to food stalls', 'Early-bird pricing — limited'] },
  { id: 't-single', code: 'SINGLE', name: 'Single', price: 399, total_quantity: 250, remaining_quantity: 250, sales_open: true, perks: ['1 Garba night entry', 'Access to food stalls'] },
  { id: 't-couple', code: 'COUPLE', name: 'Couple', price: 749, total_quantity: 200, remaining_quantity: 200, sales_open: true, perks: ['2 entries, same night', 'Priority entry lane', '1 free chaas each'] },
  { id: 't-group3', code: 'GROUP3', name: 'Group of 3', price: 1299, total_quantity: 60, remaining_quantity: 60, sales_open: true, perks: ['3 entries, same night', 'Dedicated group Garba circle', '1 veg rice (for 1 person)'] },
  { id: 't-group5', code: 'GROUP5', name: 'Group of 5', price: 2299, total_quantity: 50, remaining_quantity: 50, sales_open: true, perks: ['5 entries, same night', 'Dedicated group Garba circle', '2 veg rice (for 2 persons)'] },
  { id: 't-group9', code: 'GROUP9', name: 'Group of 9', price: 3999, total_quantity: 40, remaining_quantity: 40, sales_open: true, perks: ['9 entries, same night', 'Dedicated group Garba circle', '3 veg rice (for 3 persons)'] },
  { id: 't-group3-nr', code: 'GROUP3_NR', name: 'Group of 3 (No Rice)', price: 1199, total_quantity: 60, remaining_quantity: 60, sales_open: true, perks: ['3 entries, same night', 'Dedicated group Garba circle', 'Without rice packet'] },
  { id: 't-group5-nr', code: 'GROUP5_NR', name: 'Group of 5 (No Rice)', price: 1999, total_quantity: 50, remaining_quantity: 50, sales_open: true, perks: ['5 entries, same night', 'Dedicated group Garba circle', 'Without rice packet'] },
  { id: 't-group9-nr', code: 'GROUP9_NR', name: 'Group of 9 (No Rice)', price: 3499, total_quantity: 40, remaining_quantity: 40, sales_open: true, perks: ['9 entries, same night', 'Dedicated group Garba circle', 'Without rice packet'] },
];

// In-memory fallback (demo mode, per-server-instance; Supabase used when configured)
const mem = globalThis as unknown as {
  __tickets?: TicketType[];
  __bookings?: Booking[];
  __gallery?: GalleryPhoto[];
};
if (!mem.__tickets) mem.__tickets = structuredClone(DEFAULT_TICKETS);
if (!mem.__bookings) mem.__bookings = [];
if (!mem.__gallery) mem.__gallery = [];

export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function adminClient() {
  if (!supabaseConfigured()) return null;
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function publicClient() {
  if (!supabaseConfigured()) return null;
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getTicketTypes(): Promise<TicketType[]> {
  const sb = adminClient();
  if (sb) {
    const { data, error } = await sb.from('ticket_types').select('*').order('price');
    if (!error && data && data.length) return data as TicketType[];
  }
  return mem.__tickets!;
}

export async function updateTicketType(id: string, patch: Partial<TicketType>) {
  const sb = adminClient();
  if (sb) {
    const { error } = await sb.from('ticket_types').update(patch).eq('id', id);
    if (!error) return true;
  }
  const t = mem.__tickets!.find((x) => x.id === id);
  if (t) Object.assign(t, patch);
  return true;
}

/** Atomically hold qty. Returns false if insufficient. Uses Supabase RPC when available else atomic single-thread decrement. */
export async function holdTickets(ticketTypeId: string, qty: number): Promise<boolean> {
  const sb = adminClient();
  if (sb) {
    const { data, error } = await sb.rpc('hold_tickets', { p_ticket_type_id: ticketTypeId, p_qty: qty });
    if (!error) return data === true;
    // fallback to optimistic update
    const { data: row } = await sb.from('ticket_types').select('remaining_quantity').eq('id', ticketTypeId).single();
    if (!row || (row.remaining_quantity as number) < qty) return false;
    const { error: e2 } = await sb.from('ticket_types').update({ remaining_quantity: (row.remaining_quantity as number) - qty }).eq('id', ticketTypeId).gte('remaining_quantity', qty);
    return !e2;
  }
  const t = mem.__tickets!.find((x) => x.id === ticketTypeId);
  if (!t || !t.sales_open || t.remaining_quantity < qty) return false;
  t.remaining_quantity -= qty;
  return true;
}

export async function releaseTickets(ticketTypeId: string, qty: number) {
  const sb = adminClient();
  if (sb) {
    await sb.rpc('release_tickets', { p_ticket_type_id: ticketTypeId, p_qty: qty });
    return;
  }
  const t = mem.__tickets!.find((x) => x.id === ticketTypeId);
  if (t) t.remaining_quantity = Math.min(t.total_quantity, t.remaining_quantity + qty);
}

export async function createBookingRow(b: Booking) {
  const sb = adminClient();
  if (sb) {
    const { error } = await sb.from('bookings').insert(b);
    // Fallback: DB may not have the rice_packets column yet
    if (error && /rice_packets/.test(error.message)) {
      const { rice_packets: _omit, ...rest } = b;
      await sb.from('bookings').insert(rest);
    }
    return;
  }
  mem.__bookings!.unshift(b);
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  const sb = adminClient();
  if (sb) {
    const { data } = await sb.from('bookings').select('*').eq('id', id).single();
    if (data) {
      const b = data as Booking;
      // Lazy expiration: if hold/pending for > 8 min, mark failed + release tickets
      const created = new Date(b.created_at).getTime();
      if ((b.payment_status === 'held' || b.payment_status === 'pending') && Date.now() - created > 8 * 60 * 1000) {
        await sb.from('bookings').update({ payment_status: 'failed' }).eq('id', id);
        await releaseTickets(b.ticket_type_id, b.qty);
        b.payment_status = 'failed';
      }
      return b;
    }
  }
  return mem.__bookings!.find((x) => x.id === id);
}

export async function listBookings(): Promise<Booking[]> {
  const sb = adminClient();
  if (sb) {
    const { data } = await sb.from('bookings').select('*').order('created_at', { ascending: false }).limit(500);
    if (data) return data as Booking[];
  }
  return mem.__bookings!;
}

export async function markBooking(id: string, patch: Partial<Booking>) {
  const sb = adminClient();
  if (sb) {
    await sb.from('bookings').update(patch).eq('id', id);
    return;
  }
  const b = mem.__bookings!.find((x) => x.id === id);
  if (b) Object.assign(b, patch);
}

export function conveniencePerTicket(code?: string) {
  switch (code) {
    case 'COUPLE': return 10;
    case 'GROUP3':
    case 'GROUP3_NR': return 15;
    case 'GROUP5':
    case 'GROUP5_NR': return 25;
    case 'GROUP9':
    case 'GROUP9_NR': return 40;
    default: return 5;
  }
}

export function fees(total: number, qty = 1, code?: string) {
  const convenience = total > 0 ? conveniencePerTicket(code) * qty : 0;
  return { gst: 0, convenience, grand: total + convenience };
}

/* ---------- Gallery (uploaded photos) ---------- */
export function publicStorageUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  return `${base}/storage/v1/object/public/gallery/${path}`;
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const sb = adminClient();
  if (sb) {
    const { data, error } = await sb
      .from('gallery_photos')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });
    if (!error && data) return data as GalleryPhoto[];
  }
  return mem.__gallery!;
}

export async function addGalleryPhoto(p: GalleryPhoto) {
  const sb = adminClient();
  if (sb) {
    const { error } = await sb.from('gallery_photos').insert(p);
    if (error) throw new Error(error.message);
    return;
  }
  mem.__gallery!.unshift(p);
}

export async function deleteGalleryPhoto(id: string) {
  const sb = adminClient();
  if (sb) {
    const { data, error } = await sb.from('gallery_photos').select('path').eq('id', id).single();
    if (!error && data && (data as { path?: string | null }).path) {
      await sb.storage.from('gallery').remove([(data as { path: string }).path]);
    }
    const { error: delErr } = await sb.from('gallery_photos').delete().eq('id', id);
    if (delErr) throw new Error(delErr.message);
    return;
  }
  mem.__gallery! = mem.__gallery!.filter((g) => g.id !== id);
}

export function galleryId() {
  return 'gal-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}

export function bookingId() {
  return 'GRB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}
