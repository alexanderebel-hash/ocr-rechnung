import { NextResponse } from "next/server";
import { OCRResultSchema } from "@/lib/schemas";
import { sanitizeOCRResult } from "@/lib/ocrSanitize";

const ALLOWED_CT = new Set(["application/pdf", "application/octet-stream"]);
const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620";
const API_KEY = process.env.ANTHROPIC_API_KEY;
const API_URL = "https://api.anthropic.com/v1/messages";

function toBase64(buf: ArrayBuffer) {
  return Buffer.from(buf).toString("base64");
}

function buildPromptJSONOnly() {
  return `Extract PDF billing data JSON ... (same schema as OCRResultSchema)`;
}

async function anthropicOCRFromPdfBase64(pdfB64: string, timeoutMs = 60000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      signal: ctl.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdfB64,
                },
              },
              { type: "text", text: buildPromptJSONOnly() },
            ],
          },
        ],
      }),
    });
    const json = await res.json();
    const text = json?.content?.[0]?.text || "";
    return JSON.parse(text.match(/\{[\s\S]*\}$/)?.[0] || text);
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file") as File | null;
    const type = (file?.type || "").split(";")[0];
    if (!file || !ALLOWED_CT.has(type)) throw new Error("PDF missing/invalid");
    const buf = await file.arrayBuffer();
    const raw = await anthropicOCRFromPdfBase64(toBase64(buf));
    const clean = sanitizeOCRResult(raw);
    const safe = OCRResultSchema.parse(clean);
    const subtotal = safe.positions.reduce((s, p) => s + p.totalPrice, 0);
    return NextResponse.json({ ok: true, ocr: safe, subtotal });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "ocr failed" },
      { status: 422 }
    );
  }
}
