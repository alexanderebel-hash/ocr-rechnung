import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const url = body?.url as string | undefined;

    if (!url) {
      return NextResponse.json(
        { ok: false, error: "url missing" },
        { status: 400 }
      );
    }

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`download failed (${res.status})`);
    }
    const buf = await res.arrayBuffer();

    const workbook = XLSX.read(buf);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });
    void raw;

    // --- Try to read first 10 header rows for client and period info ---
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
        const u = new URL(url);
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

    const approval: ApprovalPayload = {
      klientId: clientName ?? slugify(parsed.klient?.name) ?? null,
      period: periodFrom && periodTo ? `${periodFrom}–${periodTo}` : null,
      lks,
    };

    const client = {
      name: clientName ?? parsed.klient?.name ?? "",
      pflegegrad: parsed.klient?.pflegegrad ?? null,
      adresse: parsed.klient?.adresse ?? "",
      pflegedienst: parsed.klient?.pflegedienst ?? "",
      standort: parsed.klient?.standort ?? "",
      stadtteil: parsed.klient?.stadtteil ?? "",
    };

    const period = {
      from: periodFrom ?? parsed.zeitraum?.von ?? "",
      to: periodTo ?? parsed.zeitraum?.bis ?? "",
    };

    return NextResponse.json({
      ok: true,
      approval,
      meta: {
        client,
        period,
      },
    });
  } catch (err: any) {
    console.error("bewilligungen/load:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "load failed" },
      { status: 500 }
    );
  }
}
