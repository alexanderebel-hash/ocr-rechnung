import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { unstable_noStore as noStore } from 'next/cache';
import { parseExcelBewilligung } from '@/lib/excelParser';

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

    // Load and parse each bewilligung to extract klient info
    const itemsWithKlient = await Promise.all(
      blobs
        .filter(b => b.pathname.toLowerCase().endsWith('.xlsx'))
        .map(async (b) => {
          try {
            const cacheBuster = `?t=${Date.now()}`;
            const res = await fetch(b.url + cacheBuster, { cache: 'no-store' });
            if (!res.ok) throw new Error('Download failed');

            const buf = await res.arrayBuffer();
            const parsed = await parseExcelBewilligung(buf);

            const filename = b.pathname.split('/').pop()!;
            const nameParts = parsed.klient.name.split(' ');
            const nachname = nameParts.pop() || '';
            const vorname = nameParts.join(' ') || '';

            // Extract zeitraum from filename (e.g., "Name_2024-01-2024-12.xlsx")
            const zeitraumMatch = filename.match(/(\d{4}-\d{2})-(\d{4}-\d{2})/);
            let zeitraum = '';
            if (zeitraumMatch) {
              zeitraum = `${zeitraumMatch[1]} bis ${zeitraumMatch[2]}`;
            } else if (parsed.zeitraum.von && parsed.zeitraum.bis) {
              zeitraum = `${parsed.zeitraum.von} bis ${parsed.zeitraum.bis}`;
            }

            return {
              key: b.pathname,
              filename,
              size: b.size,
              uploadedAt: b.uploadedAt,
              nachname,
              vorname,
              zeitraum,
            };
          } catch (err) {
            // If parsing fails, still include the file but without klient info
            const filename = b.pathname.split('/').pop()!;
            return {
              key: b.pathname,
              filename,
              size: b.size,
              uploadedAt: b.uploadedAt,
              nachname: '',
              vorname: '',
              zeitraum: '',
            };
          }
        })
    );

    // Sort alphabetically by Nachname, then Vorname
    const sortedItems = itemsWithKlient.sort((a, b) => {
      const nachnameCompare = a.nachname.localeCompare(b.nachname, 'de');
      if (nachnameCompare !== 0) return nachnameCompare;
      return a.vorname.localeCompare(b.vorname, 'de');
    });

    return NextResponse.json(
      { success: true, items: sortedItems },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Blob-Liste fehlgeschlagen' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
