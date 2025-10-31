import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDownloadUrl } from "@vercel/blob";
import { parseExcelBewilligung } from "@/lib/excelParser";
import type { ApprovalPayload, ApprovalLK } from "@/lib/approvalsTypes";

export const dynamic = "force-dynamic";

function slugify(value: string | undefined | null) {
  return value
    ? value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    : undefined;
}

function toApprovalLK(leistung: {
  lk_code: string;
  leistung: string;
  je_woche: number;
  je_monat: number;
  genehmigt: boolean;
}): ApprovalLK | null {
  const qty = leistung.je_monat > 0 ? leistung.je_monat : leistung.je_woche;
  if (!qty || qty <= 0) {
    return null;
  }

  const freq = leistung.je_monat > 0 ? "monthly" : "weekly";
  return {
    code: leistung.lk_code,
    label: leistung.leistung || leistung.lk_code,
    approved: Boolean(leistung.genehmigt),
    freq,
    qty,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const file = searchParams.get("file");
    if (!file) {
      return NextResponse.json({ error: "file missing" }, { status: 400 });
    }

    let downloadUrl: string | null = null;
    try {
      downloadUrl = await Promise.resolve(getDownloadUrl(file));
    } catch {
      downloadUrl = null;
    }
    if (!downloadUrl) {
      return NextResponse.json({ error: "file not found" }, { status: 404 });
    }

    const res = await fetch(downloadUrl, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`download failed (${res.status})`);
    }
    const buf = await res.arrayBuffer();

    const workbook = XLSX.read(buf);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const metaRows = XLSX.utils
      .sheet_to_json(sheet, { header: 1 })
      .slice(0, 10) as any[][];
    let clientName: string | null = null;
    let periodFrom: string | null = null;
    let periodTo: string | null = null;

    for (const row of metaRows) {
      if (!Array.isArray(row)) continue;
      const joined = row.map((cell) => String(cell ?? "")).join(" ").toLowerCase();
      if ((joined.includes("nachname") || joined.includes("klient")) && !clientName) {
        const candidate = String(row[1] ?? row[0] ?? "").trim();
        if (candidate) clientName = candidate;
      }
      if (joined.includes("von") && !periodFrom) {
        const candidate = String(row[1] ?? row[0] ?? "").trim();
        if (candidate) periodFrom = candidate;
      }
      if (joined.includes("bis") && !periodTo) {
        const candidate = String(row[1] ?? row[0] ?? "").trim();
        if (candidate) periodTo = candidate;
      }
    }

    // --- Fallback: Zeitraum aus Dateinamen parsen, falls Header nichts liefern ---
    try {
      if (!periodFrom && !periodTo) {
        const u = new URL(downloadUrl);
        const fname = decodeURIComponent(u.pathname.split("/").pop() || "");
        const m = fname.match(/(\d{2}\.\d{2}\.\d{2,4})-(\d{2}\.\d{2}\.\d{2,4})/);
        if (m) {
          periodFrom = m[1];
          periodTo = m[2];
        }
      }
    } catch {}

    const parsed = await parseExcelBewilligung(buf);
    const lks = parsed.leistungen
      .map(toApprovalLK)
      .filter(Boolean) as ApprovalLK[];

    if (!clientName && parsed.klient?.name) {
      clientName = parsed.klient.name;
    }
    if (!periodFrom && parsed.zeitraum?.von) {
      periodFrom = parsed.zeitraum.von;
    }
    if (!periodTo && parsed.zeitraum?.bis) {
      periodTo = parsed.zeitraum.bis;
    }

    const klientId = slugify(clientName ?? parsed.klient?.name) ?? null;
    const payload: ApprovalPayload = {
      klientId,
      period: periodFrom && periodTo ? `${periodFrom}–${periodTo}` : null,
      lks,
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("bewilligungen/load:", err);
    return NextResponse.json({ error: err?.message ?? "load failed" }, { status: 500 });
  }
}
