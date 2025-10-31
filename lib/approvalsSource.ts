import type { ApprovalFile, ApprovalPayload } from "@/lib/approvalsTypes";

/**
 * Holt die Liste aller Bewilligungen aus dem Blob-Storage
 * (via /api/bewilligungen/list)
 */
export async function listApprovals(): Promise<ApprovalFile[]> {
  const res = await fetch("/api/bewilligungen/list", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`listApprovals failed: ${res.status}`);
  }
  const json = await res.json();
  return (json.items ?? []) as ApprovalFile[];
}

/**
 * Lädt eine spezifische Bewilligung per GET /api/bewilligungen/load?file=<pfad>
 */
export async function loadApproval(id: string): Promise<ApprovalPayload> {
  const res = await fetch(
    `/api/bewilligungen/load?file=${encodeURIComponent(id)}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error(`loadApproval failed: ${res.status}`);
  }
  const json = await res.json();
  if (!json?.ok) {
    throw new Error(json?.error || "unknown error");
  }
  return json.approval as ApprovalPayload;
}
