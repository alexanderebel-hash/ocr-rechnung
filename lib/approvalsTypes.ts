export type Frequency = 'weekly' | 'monthly';
export interface ApprovalLK {
  code: string;
  label: string;
  approved: boolean;
  freq: Frequency;
  qty: number;
}
export interface ApprovalFile {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}
export interface ApprovalPayload {
  klientId?: string | null;
  period?: string | null;   // e.g. "2025-01"
  lks: ApprovalLK[];
}
