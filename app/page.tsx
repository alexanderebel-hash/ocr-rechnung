"use client";

import { useMemo, useState } from "react";
import BewilligungDropdown from "@/components/BewilligungDropdown";
import type { ApprovalPayload, ApprovalFile } from "@/lib/approvalsTypes";
import ApprovalHeader, { type HeaderData } from "@/components/ApprovalHeader";
import EditableApprovalTable, { type TableRow } from "@/components/EditableApprovalTable";

export default function Home() {
  const [approval, setApproval] = useState<ApprovalPayload | null>(null);
  const [meta, setMeta] = useState<ApprovalFile | null>(null);
  const [header, setHeader] = useState<HeaderData>({});
  const [rows, setRows] = useState<TableRow[]>([]);
  const approvalId = useMemo(
    () => (approval?.klientId ? `${approval.klientId}__${approval?.period ?? ""}` : null),
    [approval]
  );

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">DomusVita – Bewilligungen</h1>
        <p className="text-sm text-gray-600">
          Bewilligung laden → Werte prüfen/bearbeiten → „In Korrekturrechnung übernehmen“ speichert die Änderungen für die spätere Abrechnung.
        </p>
      </header>

      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <BewilligungDropdown
          onLoaded={(data, fileMeta) => {
            setApproval(data);
            setMeta(fileMeta ?? null);
            setRows([]);
          }}
        />
      </section>

      {approval && (
        <>
          <ApprovalHeader
            fileName={meta?.name}
            onChange={(d) => setHeader(d)}
          />

          <EditableApprovalTable
            lks={approval.lks}
            onChange={(r) => setRows(r)}
          />

          <div className="flex justify-end">
            <button
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={async () => {
                if (!approvalId) return alert("Fehlende Klient-ID.");
                const body = {
                  approvalId,
                  period: approval?.period ?? null,
                  header,
                  rows,
                  meta: {
                    file: meta?.name ?? "",
                    uploadedAt: meta?.uploadedAt ?? null,
                  },
                };
                const res = await fetch("/api/corrections", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify(body),
                });
                const json = await res.json();
                if (!json?.ok) {
                  console.error(json);
                  return alert("Speichern fehlgeschlagen.");
                }
                alert("Korrekturen übernommen (gespeichert).");
              }}
            >
              In Korrekturrechnung übernehmen
            </button>
          </div>
        </>
      )}
    </main>
  );
}
