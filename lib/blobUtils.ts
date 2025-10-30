import { list, put } from "@vercel/blob";
import type { ApprovalFile } from "@/lib/approvalsTypes";

/** Holt alle Bewilligungs-Excel-Dateien (privat, signierte URLs) */
export async function listApprovals(prefix = "approvals/"): Promise<ApprovalFile[]> {
  const res = await list({ prefix });
  return res.blobs
    .filter((b) => /\.xls$|\.xlsx$/i.test(b.pathname))
    .map<ApprovalFile>((b) => ({
      id: b.pathname,
      name: b.pathname.replace(/^approvals\//, ""),
      url:
        typeof b.url === "string"
          ? b.url
          : new URL(b.url).toString(),
      size: b.size,
      uploadedAt:
        b.uploadedAt instanceof Date
          ? b.uploadedAt.toISOString()
          : String(b.uploadedAt),
    }));
}

/** Private Upload – Wrapper für API-Routen */
export async function putPrivate(path: string, file: File | Blob) {
  return await put(path, file, { access: "private" as any });
}
