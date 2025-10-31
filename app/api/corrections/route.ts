import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.rows)) {
      return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, saved: body, ts: Date.now() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}
