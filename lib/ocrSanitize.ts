import { OCRResult, OCRPosition, OCRResultSchema } from "./schemas";
import { prices as defaultPrices } from "@/lib/billing/prices";

const nz = (n: any) => (Number.isFinite(+n) ? +n : 0);
const normCode = (s: string) =>
  String(s || "").toUpperCase().trim().replace(/\s+/g, "").replace("LK03A", "LK03a");

export function sanitizeOCRResult(
  raw: any,
  priceTable: Record<string, number> = defaultPrices
): OCRResult {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const positions: OCRPosition[] = (parsed.positions || [])
    .map((p: any) => {
      const code = normCode(p.code || "");
      const q = nz(p.quantity);
      const unitPrice = nz(p.unitPrice) || nz(priceTable[code]) || 0;
      const totalPrice = q * unitPrice;
      if (!/^LK\d{1,2}[A-Za-z]?$/.test(code) || q <= 0 || unitPrice < 0) return null;
      return {
        code,
        description: String(p.description || ""),
        quantity: q,
        unitPrice,
        totalPrice,
        parentLK: p.parentLK || undefined,
      } as OCRPosition;
    })
    .filter(Boolean) as OCRPosition[];

  const safe: OCRResult = {
    invoiceNumber: parsed.invoiceNumber || "",
    period:
      parsed.period?.from && parsed.period?.to ? parsed.period : undefined,
    positions,
    warnings: parsed.warnings || [],
  };
  // --- Fallback LK-code detection if OCR did not return structured codes ---
  if (!positions.length && typeof parsed.rawText === "string") {
    const lkMatches = [...parsed.rawText.matchAll(/LK\d{1,2}[A-Za-z]?/g)].map((m) => m[0]);
    const uniqueCodes = Array.from(new Set(lkMatches));
    positions.push(
      ...uniqueCodes.map((code) => ({
        code,
        description: "Erkannt per Fallback",
        quantity: 1,
        unitPrice: defaultPrices[code] || 0,
        totalPrice: defaultPrices[code] || 0,
      }))
    );
  }
  const val = OCRResultSchema.safeParse(safe);
  if (!val.success) {
    throw new Error(
      "Invalid OCR JSON: " +
        val.error.issues.map((i) => `${i.path.join(".")}:${i.message}`).join("; ")
    );
  }
  return safe;
}
