import { NextResponse } from "next/server";
import { OCRResultSchema } from "@/lib/schemas";
import { sanitizeOCRResult } from "@/lib/ocrSanitize";

export const dynamic = "force-dynamic";

const ALLOWED_CT = new Set(["application/pdf", "application/octet-stream"]);
const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620";
const API_KEY = process.env.ANTHROPIC_API_KEY;
const API_URL = "https://api.anthropic.com/v1/messages";

function toBase64(buf: ArrayBuffer) {
  return Buffer.from(buf).toString("base64");
}

function buildPromptJSONOnly() {
  return `
Extract ONLY valid JSON for a Berlin nursing invoice. No prose, no code fences.
Schema:
{
  "invoiceNumber": "string (optional)",
  "period": {"from":"DD.MM.YYYY","to":"DD.MM.YYYY"} (optional),
  "positions": [
    {"code":"LK01|LK02|LK03a|LK03b|LK04|LK11b|LK12|LK13|LK14|LK15|LK17a|LK17b|LK20|LK20_HH", 
     "description":"string (optional)",
     "quantity": number (int >= 0),
     "unitPrice": number (>=0),
     "totalPrice": number (>=0 and = quantity*unitPrice)
    }
  ],
  "warnings": ["..."] (optional)
}
Rules:
- Each position MUST include a valid LK code as above; if the code is not visible in the PDF, omit that position.
- If a unit price is not printed, set it to 0 (the server will override from tariff).
Return strict JSON ONLY.`.trim();
}

async function anthropicOCRFromPdfBase64(pdfB64: string, timeoutMs = 60000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const body = {
      model: MODEL,
      max_tokens: 2000,
      temperature: 0,
      system: "Extract structured billing data from the provided PDF. Respond in strict JSON only.",
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
    };

    const res = await fetch(API_URL, {
      method: "POST",
      signal: ctl.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
    const json = await res.json();
    const text: string = json?.content?.[0]?.text || "";
    const raw = JSON.parse(text.match(/\{[\s\S]*\}$/)?.[0] || text);
    return raw;
  } finally {
    clearTimeout(t);
  }
}

async function readPdfFromRequest(req: Request): Promise<ArrayBuffer> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) throw new Error("file missing");
    const type = (file.type || "").split(";")[0];
    if (!ALLOWED_CT.has(type)) throw new Error(`unsupported content-type: ${type}`);
    return await file.arrayBuffer();
  }
  const body = (await req.json().catch(() => ({}))) as any;
  if (body.base64)
    return Uint8Array.from(Buffer.from(String(body.base64), "base64")).buffer;
  if (body.url) {
    const r = await fetch(body.url);
    if (!r.ok) throw new Error(`fetch url failed ${r.status}`);
    const type = (r.headers.get("content-type") || "").split(";")[0];
    if (!ALLOWED_CT.has(type)) throw new Error(`unsupported content-type: ${type}`);
    return await r.arrayBuffer();
  }
  throw new Error("no input (file, url or base64) provided");
}

export async function POST(req: Request) {
  try {
    const buf = await readPdfFromRequest(req);
    const b64 = toBase64(buf);

    let raw: any;
    try {
      raw = await anthropicOCRFromPdfBase64(b64, 60000);
    } catch {
      raw = await anthropicOCRFromPdfBase64(b64, 90000);
    }

    const clean = sanitizeOCRResult(raw);
    const safe = OCRResultSchema.parse(clean);
    const subtotal = safe.positions.reduce((s, p) => s + p.totalPrice, 0);

    // Build legacy shape the UI expects
    const legacy = {
      positionen: safe.positions.map((p) => ({
        code: p.code,
        text: p.description || "",
        menge: p.quantity,
        einzelpreis: p.unitPrice,
        summe: p.totalPrice,
      })),
      // Falls die UI bisher Summenfelder aus dem Response liest:
      zwischensumme: subtotal,
      gesamtsumme: subtotal,
      gesamtbetrag: subtotal,
      meta: {
        invoiceNumber: safe.invoiceNumber || "",
        period: safe.period || null,
      },
    };

    // Send both: modern + legacy; keep legacy also at top-level under the old key:
    return NextResponse.json({
      ok: true,
      ocr: safe,
      data: legacy,
      rechnungsDaten: legacy, // <— wichtig: alter Schlüsselname, damit deine UI sofort “richtige” Daten sieht
      subtotal,
    });
  } catch (err: any) {
    console.error("[/api/ocr] error:", err?.message);
    return NextResponse.json({ ok: false, error: err?.message || "ocr failed" }, { status: 422 });
  }
}
