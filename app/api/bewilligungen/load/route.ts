import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { unstable_noStore as noStore } from 'next/cache';
import { parseExcelBewilligung } from '@/lib/excelParser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  noStore();

  try {
    const { key } = await req.json();
    if (!key || !key.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json({ success: false, error: 'Ungültiger Blob-Key.' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    const { blobs } = await list({ prefix: key, token });
    const blob = blobs.find(b => b.pathname === key);
    if (!blob?.url) {
      return NextResponse.json({ success: false, error: 'Datei im Blob nicht gefunden.' }, { status: 404 });
    }

    // Cold fetch – kein Cache
    const cacheBuster = `?t=${Date.now()}`;
    const res = await fetch(blob.url + cacheBuster, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Download-Fehler (${res.status})` }, { status: 502 });
    }

    const buf = await res.arrayBuffer();

    // Use existing excelParser for consistent parsing
    const parsed = await parseExcelBewilligung(buf);

    // Transform to format expected by frontend
    const data = {
      klient: {
        nachname: parsed.klient.name.split(' ').pop() || parsed.klient.name,
        vorname: parsed.klient.name.split(' ').slice(0, -1).join(' ') || '',
        pflegegrad: parsed.klient.pflegegrad,
        adresse: parsed.klient.adresse,
      },
      zeitraum: {
        von: formatDateToGerman(parsed.zeitraum.von),
        bis: formatDateToGerman(parsed.zeitraum.bis),
      },
      leistungen: parsed.leistungen.map(l => ({
        leistungsart: l.lk_code,
        bezeichnung: l.leistung,
        einheit: l.je_woche > 0 ? 'x/Woche' : 'x/Monat',
        menge: l.je_woche > 0 ? l.je_woche : l.je_monat,
        minuten: 0,
        einzelpreis: l.einzelpreis,
      })),
      kasse: '',
      versichertennummer: '',
    };

    return NextResponse.json({ success: true, data, meta: { key, filename: blob.pathname.split('/').pop() } });
  } catch (err: any) {
    console.error('Error loading bewilligung:', err);
    return NextResponse.json({ success: false, error: err?.message ?? 'Unbekannter Fehler' }, { status: 500 });
  }
}

function formatDateToGerman(isoDate: string): string {
  // Convert YYYY-MM-DD to DD.MM.YYYY
  if (!isoDate) return '';
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}.${match[2]}.${match[1]}`;
  }
  return isoDate;
}
