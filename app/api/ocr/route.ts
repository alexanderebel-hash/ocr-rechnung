import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "OCR temporarily disabled for refactor" },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "OCR temporarily disabled for refactor" },
    { status: 501 }
  );
}
