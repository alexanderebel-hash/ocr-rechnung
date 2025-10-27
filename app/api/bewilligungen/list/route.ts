import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { unstable_noStore as noStore } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Extract Klient name and Zeitraum from filename
 * Expected formats:
 * - "Nachname_Vorname_2024-01-2024-12.xlsx"
 * - "Nachname Vorname_2024-01-2024-12.xlsx"
 * - "Vorname Nachname_2024-01-2024-12.xlsx"
 */
function parseFilename(filename: string) {
  // Remove .xlsx extension
  const nameWithoutExt = filename.replace(/\.xlsx$/i, '');

  // Try to extract zeitraum pattern (YYYY-MM-YYYY-MM or YYYY-MM)
  const zeitraumMatch = nameWithoutExt.match(/(\d{4}-\d{2})[-_]?(\d{4}-\d{2})?/);
  let zeitraum = '';
  let namepart = nameWithoutExt;

  if (zeitraumMatch) {
    if (zeitraumMatch[2]) {
      // Format: 2024-01-2024-12
      zeitraum = `${zeitraumMatch[1]} bis ${zeitraumMatch[2]}`;
    } else {
      // Format: 2024-01
      zeitraum = zeitraumMatch[1];
    }
    // Remove zeitraum from filename to get name
    namepart = nameWithoutExt.substring(0, zeitraumMatch.index).replace(/[_\s-]+$/, '');
  }

  // Try to split name into vorname/nachname
  // Common patterns: "Nachname_Vorname", "Nachname Vorname", "Vorname_Nachname"
  let vorname = '';
  let nachname = '';

  if (namepart.includes('_')) {
    const parts = namepart.split('_');
    if (parts.length >= 2) {
      // Assume "Nachname_Vorname" or "Vorname_Nachname"
      // We'll use the first part as nachname and rest as vorname
      nachname = parts[0].trim();
      vorname = parts.slice(1).join(' ').trim();
    } else {
      nachname = namepart.trim();
    }
  } else if (namepart.includes(' ')) {
    const parts = namepart.split(/\s+/);
    if (parts.length >= 2) {
      // Assume last part is nachname
      nachname = parts[parts.length - 1].trim();
      vorname = parts.slice(0, -1).join(' ').trim();
    } else {
      nachname = namepart.trim();
    }
  } else {
    nachname = namepart.trim();
  }

  return { vorname, nachname, zeitraum };
}

export async function GET() {
  noStore(); // kein Cache

  try {
    // Blob prefix for bewilligungen
    const prefix = 'bewilligungen/';
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    const { blobs } = await list({ prefix, token });

    // Extract info from filenames (fast, no parsing needed)
    const items = blobs
      .filter(b => b.pathname.toLowerCase().endsWith('.xlsx'))
      .map((b) => {
        const filename = b.pathname.split('/').pop()!;
        const { vorname, nachname, zeitraum } = parseFilename(filename);

        return {
          key: b.pathname,
          filename,
          size: b.size,
          uploadedAt: b.uploadedAt,
          nachname,
          vorname,
          zeitraum,
        };
      });

    // Sort alphabetically by Nachname, then Vorname
    const sortedItems = items.sort((a, b) => {
      const nachnameCompare = a.nachname.localeCompare(b.nachname, 'de');
      if (nachnameCompare !== 0) return nachnameCompare;
      return a.vorname.localeCompare(b.vorname, 'de');
    });

    return NextResponse.json(
      { success: true, items: sortedItems },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err: any) {
    console.error('Error listing bewilligungen:', err);
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Blob-Liste fehlgeschlagen' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
