import { NextRequest, NextResponse } from 'next/server';
import {
  adminClient,
  supabaseConfigured,
  getGalleryPhotos,
  addGalleryPhoto,
  deleteGalleryPhoto,
  galleryId,
  publicStorageUrl,
} from '@/lib/store';
import { verifyToken } from '@/lib/supabase-server';

async function authed(req: NextRequest) {
  const email = await verifyToken(req);
  return email === process.env.ADMIN_EMAIL;
}

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

function extFor(type: string) {
  if (type === 'image/png') return '.png';
  if (type === 'image/webp') return '.webp';
  if (type === 'image/gif') return '.gif';
  if (type === 'image/avif') return '.avif';
  return '.jpg';
}

export async function GET() {
  const photos = await getGalleryPhotos();
  return NextResponse.json(
    { photos, configured: supabaseConfigured() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(req: NextRequest) {
  if (!await authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get('file');
    const caption = String(form.get('caption') || '').trim();
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use JPG, PNG, WEBP, GIF or AVIF.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large — max 6 MB.' }, { status: 400 });
    }

    const id = galleryId();
    const name = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-40) || 'photo';

    if (supabaseConfigured()) {
      const sb = adminClient();
      if (!sb) return NextResponse.json({ error: 'Supabase not configured.' }, { status: 500 });
      const path = `${id}-${name}${extFor(file.type)}`;
      const { error: upErr } = await sb.storage
        .from('gallery')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) {
        return NextResponse.json(
          { error: `Storage upload failed (${upErr.message}). Create a public bucket named "gallery" in Supabase → Storage.` },
          { status: 500 }
        );
      }
      await addGalleryPhoto({ id, url: publicStorageUrl(path), path, caption });
      return NextResponse.json({ ok: true, photo: { id, url: publicStorageUrl(path), caption } });
    }

    // Demo mode: store as data URL in memory (small images only)
    const buf = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buf.toString('base64')}`;
    await addGalleryPhoto({ id, url: dataUrl, path: null, caption });
    return NextResponse.json({ ok: true, photo: { id, url: dataUrl, caption } });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!await authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
    await deleteGalleryPhoto(String(id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Delete failed.' },
      { status: 500 }
    );
  }
}