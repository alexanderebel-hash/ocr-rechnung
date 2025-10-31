"use client";

import React, { useEffect, useState } from "react";
import type { ApprovalFile, ApprovalPayload, ApprovalLK } from "@/lib/approvalsTypes";
import { listApprovals, loadApproval as loadApprovalFromApi } from "@/lib/approvalsSource";

export default function BewilligungDropdown({
  onLoaded,
  adminMode = false,
}: {
  onLoaded: (approval: ApprovalPayload, file?: ApprovalFile) => void;
  adminMode?: boolean;
}) {
  const [items, setItems] = useState<ApprovalFile[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [approval, setApproval] = useState<ApprovalPayload | null>(null);

  // Liste laden
  useEffect(() => {
    (async () => {
      try {
        const files = await listApprovals();
        setItems(files);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // Gewählte Datei laden (approved beibehalten!)
  const fetchApproval = async (id: string) => {
    setLoading(true);
    try {
      const data = await loadApprovalFromApi(id);
      setApproval(data);
      const fileMeta = items.find((f) => f.id === id);
      onLoaded(data, fileMeta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproved = (idx: number) => {
    if (!approval) return;
    const next: ApprovalPayload = {
      ...approval,
      lks: approval.lks.map((lk, i) =>
        i === idx ? { ...lk, approved: !lk.approved } : lk
      ),
    };
    setApproval(next);
    onLoaded(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          className="border rounded px-2 py-1 text-sm min-w-[280px]"
          value={selectedId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedId(id);
            if (id) fetchApproval(id);
          }}
        >
          <option value="">– Bewilligung wählen –</option>
          {items.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        {loading && <span className="text-xs text-gray-500">lädt…</span>}
      </div>

      {/* Mini-Vorschau & Admin-Approved-Toggles */}
      {approval && (
        <div className="border rounded p-3">
          <div className="text-sm font-medium mb-2">Bewilligte LKs</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {approval.lks.map((lk: ApprovalLK, i: number) => (
              <div key={lk.code + i} className="flex items-center justify-between border rounded px-2 py-1">
                <div className="text-sm">
                  <div className="font-medium">{lk.code} — {lk.label}</div>
                  <div className="text-xs text-gray-500">
                    {lk.freq === 'weekly' ? 'pro Woche' : 'pro Monat'}: {lk.qty}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${lk.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {lk.approved ? 'approved' : 'not approved'}
                  </span>
                  {adminMode && (
                    <button
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                      onClick={() => toggleApproved(i)}
                    >
                      Toggle
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
