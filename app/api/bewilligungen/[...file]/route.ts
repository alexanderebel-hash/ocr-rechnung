// app/api/bewilligungen/[...file]/route.ts
import { NextResponse } from "next/server";
import { getDownloadUrl } from "@vercel/blob";
import type { ApprovalPayload } from "@/lib/approvalsTypes";

export const dynamic = "force-dynamic";

function slugify(str: string | null | undefined) {
  return String(str ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function parseFromFilename(file: string) {
  const filename = file.split("/").pop() || "";
  const period = filename.match(/(\d{2}\.\d{2}\.\d{2,4})[–-](\d{2}\.\d{2}\.\d{2,4})/);
  const nachname = filename
    .replace(/^bewilligung_?/i, "")
    .replace(/\.xlsx?$/i, "")
    .split("_")[1] || null;

  return {
    klientId: nachname ? slugify(nachname) : null,
    period: period ? `${period[1]}–${period[2]}` : null,
  };
}

/**
 * GET /api/bewilligungen/<irgendein/pfad.xlsx>
 * → kompatibel zu älteren UI-Aufrufen.
 */
export async function GET(
  _req: Request,
  ctx: { params: { file?: string[] } }
) {
  try {
    const parts = ctx.params.file ?? [];
    let file = decodeURIComponent(parts.join("/"));
    if (!file.startsWith("bewilligungen/")) {
      file = `bewilligungen/${file}`;
    }

    // Existenz prüfen
    try {
      await getDownloadUrl(file);
    } catch {
      return NextResponse.json({ ok: false, error: "file not found" }, { status: 404 });
    }

    const meta = parseFromFilename(file);
    const approval: ApprovalPayload = {
      klientId: meta.klientId,
      period: meta.period,
      lks: [],
    };

    return NextResponse.json({ ok: true, approval });
  } catch (err: any) {
    console.error("bewilligungen/[...file]:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "load failed" }, { status: 500 });
  }
}
