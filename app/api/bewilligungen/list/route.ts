import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { unstable_noStore as noStore } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  noStore(); // kein Cache

  try {
    // Blob prefix for bewilligungen
    const prefix = 'bewilligungen/';
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    const { blobs } = await list({ prefix, token });

    const items = blobs
      .filter(b => b.pathname.toLowerCase().endsWith('.xlsx'))
      .map(b => ({
        key: b.pathname,
        filename: b.pathname.split('/').pop()!,
        size: b.size,
        uploadedAt: b.uploadedAt,
      }))
      .sort((a, b) => a.filename.localeCompare(b.filename, 'de'));

    return NextResponse.json(
      { success: true, items },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Blob-Liste fehlgeschlagen' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
