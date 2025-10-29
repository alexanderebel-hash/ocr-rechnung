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
