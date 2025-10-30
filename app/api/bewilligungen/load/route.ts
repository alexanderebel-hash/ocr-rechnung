import { NextResponse } from "next/server";
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

    const parsed = await parseExcelBewilligung(buf);
    const lks = parsed.leistungen
      .map(toApprovalLK)
      .filter(Boolean) as ApprovalLK[];

    const approval: ApprovalPayload = {
      klientId: slugify(parsed.klient?.name),
      period:
        parsed.zeitraum?.von && parsed.zeitraum?.bis
          ? `${parsed.zeitraum.von}..${parsed.zeitraum.bis}`
          : undefined,
      lks,
    };

    const client = {
      name: parsed.klient?.name ?? "",
      pflegegrad: parsed.klient?.pflegegrad ?? null,
      adresse: parsed.klient?.adresse ?? "",
      pflegedienst: parsed.klient?.pflegedienst ?? "",
      standort: parsed.klient?.standort ?? "",
      stadtteil: parsed.klient?.stadtteil ?? "",
    };

    const period = {
      from: parsed.zeitraum?.von ?? "",
      to: parsed.zeitraum?.bis ?? "",
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
