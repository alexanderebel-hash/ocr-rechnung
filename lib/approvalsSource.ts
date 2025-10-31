import type { ApprovalFile, ApprovalPayload } from '@/lib/approvalsTypes';

export async function listApprovals(): Promise<ApprovalFile[]> {
  const res = await fetch('/api/bewilligungen/list', { cache: 'no-store' });
  if (!res.ok) throw new Error('listApprovals failed');
  const json = await res.json();
  return (json.items ?? json.blobs ?? []) as ApprovalFile[];
}

export async function loadApproval(pathname: string): Promise<ApprovalPayload> {
  const res = await fetch(`/api/bewilligungen/load?file=${encodeURIComponent(pathname)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('loadApproval failed');
  const json = await res.json();
  const payload: ApprovalPayload = {
    klientId: json?.klientId ?? null,
    period: json?.period ?? null,
    lks: (json?.lks ?? json?.leistungen ?? []).map((x: any) => ({
      code: String(x.code || '').toUpperCase().replace(/\s+/g, ''),
      label: x.label ?? '',
      approved: x.approved ?? x.genehmigt ?? (Number(x.qty) > 0),
      freq: (x.freq ?? x.einheit ?? 'monthly').includes('Woche') ? 'weekly' : (x.freq ?? 'monthly'),
      qty: Number(x.qty ?? x.menge ?? 0) || 0,
    })),
  };
  return payload;
}
