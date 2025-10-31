import type { ApprovalFile } from "@/lib/approvalsTypes";
import { listApprovals } from "@/lib/blobUtils";

/**
 * Zentrale Funktion, um Bewilligungsdateien aus Vercel Blob zu holen.
 * → Vermeidet doppelte Loader (Dynamic etc.)
 */
export async function loadAllBewilligungen(): Promise<ApprovalFile[]> {
  try {
    const files = await listApprovals("approvals/");
    return files;
  } catch (err) {
    console.error("loadAllBewilligungen:", err);
    return [];
  }
}
