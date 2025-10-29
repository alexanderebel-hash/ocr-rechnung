import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import type { ApprovalPayload, ApprovalLK, Frequency } from '@/lib/approvalsTypes';

export const dynamic = 'force-dynamic';

function norm(s: any) {
  return (s ?? '').toString().replace(/\s+/g, ' ').trim().toLowerCase();
}
function num(v: any): number | null {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
function toFreq(row: Record<string, any>): Frequency {
  const weekly = row['bewilligt pro woche'] ?? row['pro woche'];
  const monthly = row['bewilligt pro monat'] ?? row['pro monat'];
  if (weekly != null && monthly == null) return 'weekly';
  if (monthly != null && weekly == null) return 'monthly';
  // Default: monthly, falls beide vorhanden → nimm Monatszahl
  return 'monthly';
}
function qtyFrom(row: Record<string, any>, freq: Frequency): number {
  const w = num(row['bewilligt pro woche'] ?? row['pro woche']);
  const m = num(row['bewilligt pro monat'] ?? row['pro monat']);
  if (freq === 'weekly' && w != null) return w;
  if (freq === 'monthly' && m != null) return m;
  // Fallbacks
  if (m != null) return m;
  if (w != null) return Math.round(w * 4.3);
  return 0;
}

export async function POST(req: Request) {
  try {
    const { url, klientId, period } = await req.json() as { url: string; klientId?: string; period?: string };
    if (!url) return NextResponse.json({ ok: false, error: 'url missing' }, { status: 400 });

    const r = await fetch(url);
    if (!r.ok) return NextResponse.json({ ok: false, error: `fetch failed (${r.status})` }, { status: 502 });
    const buf = await r.arrayBuffer();

    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });

    const rows = raw.map((row: any) => {
      const cols: Record<string, any> = {};
      for (const k of Object.keys(row)) cols[norm(k)] = row[k];
      return cols;
    });

    // Mapping auf ApprovalLK (approved TRUE als Default, wenn in Bewilligungsliste enthalten)
    const lks: ApprovalLK[] = rows
      .map((r) => {
        const code = String(r['lk-code'] ?? r['lk'] ?? '').trim();
        const label = String(r['leistungsbezeichnung'] ?? r['bezeichnung'] ?? '').trim();
        if (!code) return null;
        const freq = toFreq(r);
        const qty = qtyFrom(r, freq);
        // Wichtig: approved NICHT verlieren
        const approvedCell = r['approved'] ?? r['genehmigt'] ?? true;
        const approved = typeof approvedCell === 'string'
          ? /^(true|ja|1|x)$/i.test(approvedCell.trim())
          : Boolean(approvedCell);

        return { code, label, approved, freq, qty } as ApprovalLK;
      })
      .filter(Boolean) as ApprovalLK[];

    const payload: ApprovalPayload = {
      klientId: klientId ?? null,
      period: period ?? null,
      lks,
    };

    return NextResponse.json({ ok: true, approval: payload });
  } catch (err: any) {
    console.error('bewilligungen/load:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'load failed' }, { status: 500 });
  }
}
