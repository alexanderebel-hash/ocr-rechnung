import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { unstable_noStore as noStore } from 'next/cache';
import * as XLSX from 'xlsx';

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
    const data = parseBewilligungXlsx(buf);
    return NextResponse.json({ success: true, data, meta: { key, filename: blob.pathname.split('/').pop() } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? 'Unbekannter Fehler' }, { status: 500 });
  }
}

function parseBewilligungXlsx(ab: ArrayBuffer) {
  const wb = XLSX.read(ab, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

  const first = rows[0] || {};
  const klient = {
    nachname: String(first['Klient_Nachname'] ?? '').trim(),
    vorname: String(first['Klient_Vorname'] ?? '').trim(),
  };
  const zeitraum = {
    von: normalizeDate(first['Von']),
    bis: normalizeDate(first['Bis']),
  };
  const kasse = String(first['Kasse'] ?? '').trim();
  const versichertennummer = String(first['Versichertennummer'] ?? '').trim();

  const leistungen = rows
    .map(r => ({
      leistungsart: String(r['Leistung'] ?? '').trim(),
      einheit: String(r['Einheit'] ?? 'x/Woche').trim(),
      menge: toNumber(r['Menge']),
      minuten: toNumber(r['Minuten']),
    }))
    .filter(l => l.leistungsart);

  return { klient, zeitraum, leistungen, kasse, versichertennummer };
}

function toNumber(v: any): number {
  const n = Number((v ?? 0).toString().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function normalizeDate(v: any): string {
  if (!v) return '';
  if (typeof v === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + v * 86400000);
    return fmtDate(d);
  }
  const s = String(v).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
  const de = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return de ? s : '';
}

function fmtDate(d: Date) {
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}.${month}.${year}`;
}
