import { list, put } from "@vercel/blob";
import type { ApprovalFile } from "@/lib/approvalsTypes";

/**
 * Holt alle Bewilligungs-Excel-Dateien aus dem Vercel Blob-Storage.
 * Nutzt das Verzeichnis "bewilligungen/" (statt "approvals/").
 * Gibt für jede Datei ein Objekt vom Typ ApprovalFile zurück.
 */
export async function listApprovals(prefix = "bewilligungen/"): Promise<ApprovalFile[]> {
  const res = await list({ prefix });

  return res.blobs
    .filter((b) => /\.xls$|\.xlsx$/i.test(b.pathname))
    .map<ApprovalFile>((b) => ({
      id: b.pathname,
      // entfernt den Prefix aus dem Anzeigenamen
      name: b.pathname.replace(/^bewilligungen\//, ""),
      // URL in String konvertieren (signierte URL vom Blob-Service)
      url: typeof b.url === "string" ? b.url : new URL(b.url).toString(),
      size: b.size,
      uploadedAt:
        b.uploadedAt instanceof Date
          ? b.uploadedAt.toISOString()
          : String(b.uploadedAt),
    }));
}

/**
 * Privater Upload-Wrapper für API-Routen.
 * Speichert Dateien mit "private"-Zugriff im Vercel-Blob.
 */
export async function putPrivate(path: string, file: File | Blob) {
  return await put(path, file, { access: "private" as any });
}
