import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import type { ApprovalFile } from "@/lib/approvalsTypes";

export const dynamic = "force-dynamic";

/**
 * POST /api/upload-bewilligung
 * Erwartet FormData mit "file" (Excel-Datei)
 * Speichert privat im Blob, gibt signierte URL + Metadaten zurück
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, error: "no file" }, { status: 400 });
    }

    // Dateiname unter approvals/
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeName = file.name.replace(/\s+/g, "_");
    const pathname = `approvals/${timestamp}_${safeName}`;

    // 🔒 private upload
    const stored = await put(pathname, file, { access: "private" as any });

    const item: ApprovalFile = {
      id: stored.pathname,
      name: safeName,
      url:
        typeof stored.url === "string"
          ? stored.url
          : new URL(stored.url).toString(),
      size: stored.size,
      uploadedAt:
        stored.uploadedAt instanceof Date
          ? stored.uploadedAt.toISOString()
          : String(stored.uploadedAt),
    };

    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    console.error("upload-bewilligung:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "upload failed" },
      { status: 500 }
    );
  }
}
