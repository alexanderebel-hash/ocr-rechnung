export type Frequency = 'weekly' | 'monthly';

export interface ApprovalLK {
  code: string;            // "LK02"
  label: string;           // "Kleine Körperpflege ..."
  approved: boolean;       // <-- MUSS end-to-end erhalten bleiben
  freq: Frequency;         // 'weekly' | 'monthly'
  qty: number;             // bewilligte Menge (pro freq)
}

export interface ApprovalFile {
  id: string;              // z.B. Blob pathname
  name: string;            // Anzeigename
  url: string;             // signierte (expiring) URL zum Download
  size: number;
  uploadedAt: string;
}

export interface ApprovalPayload {
  klientId?: string | null;
  period?: string | null;  // z.B. "2025-01"
  lks: ApprovalLK[];
}

// --- Excel-facing types used by BewilligungsAnsicht ---

export interface BewilligungsEintrag {
  /** Leistungs­komplex-Code, e.g., "LK14" */
  lkCode: string;
  /** Beschreibung laut Bewilligung */
  leistungsbezeichnung: string;
  /** Anzahl bewilligter Leistungen pro Woche (optional) */
  bewilligtProWoche?: number | null;
  /** Anzahl bewilligter Leistungen pro Monat (optional) */
  bewilligtProMonat?: number | null;
}

export interface RechnungEintrag {
  /** LK-Code, e.g., "LK14" */
  lkCode: string;
  /** Anzahl laut Rechnung (OCR/Medifox) */
  anzahlImMonat: number;
  /** Optionale Beschreibung aus Rechnung */
  leistungsbezeichnung?: string | null;
}
