import React, { useEffect, useMemo, useState } from "react";
import type { ApprovalLK } from "@/lib/approvalsTypes";

export type TableRow = {
  code: string;
  label: string;
  bewWoche: number;
  bewMonat: number;
  ist: number;
  manuell?: number;
};

function validateWeekly(n: number) {
  return Number.isFinite(n) && n >= 0 && n <= 7;
}
function validateMonthly(n: number) {
  return Number.isFinite(n) && n >= 0 && n <= 31;
}

export default function EditableApprovalTable({
  lks,
  istWerteByCode,
  onChange,
}: {
  lks: ApprovalLK[];
  istWerteByCode?: Record<string, number>;
  onChange?: (rows: TableRow[]) => void;
}) {
  const initialRows = useMemo<TableRow[]>(() => {
    return lks.map((lk) => {
      const bewWoche = lk.freq === "weekly" ? lk.qty : 0;
      const bewMonat = lk.freq === "monthly" ? lk.qty : Math.round(lk.qty * 4.33);
      const ist = istWerteByCode?.[lk.code] ?? 0;
      return {
        code: lk.code,
        label: lk.label || lk.code,
        bewWoche,
        bewMonat,
        ist,
      };
    });
  }, [lks, istWerteByCode]);

  const [rows, setRows] = useState<TableRow[]>(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    onChange?.(rows);
  }, [rows, onChange]);

  function set(rowIdx: number, patch: Partial<TableRow>) {
    setRows((prev) => prev.map((r, i) => (i === rowIdx ? { ...r, ...patch } : r)));
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Leistungen</h2>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <Th>Leistung</Th>
              <Th className="text-right">Bewilligt / Woche</Th>
              <Th className="text-right">Bewilligt / Monat</Th>
              <Th className="text-right">Tatsächlich erbracht</Th>
              <Th className="text-right">Manuelle Korrektur</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.code + i} className="border-t">
                <Td>
                  <div className="font-medium">{r.label}</div>
                  <div className="text-xs text-gray-500">{r.code}</div>
                </Td>

                <Td className="text-right">
                  <input
                    className="border rounded px-2 py-1 w-24 text-right"
                    type="number"
                    min={0}
                    max={7}
                    value={r.bewWoche}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!validateWeekly(val)) return;
                      const bewMonat = Math.round(val * 4.33);
                      set(i, { bewWoche: val, bewMonat });
                    }}
                  />
                </Td>

                <Td className="text-right">
                  <input
                    className="border rounded px-2 py-1 w-24 text-right"
                    type="number"
                    min={0}
                    max={31}
                    value={r.bewMonat}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!validateMonthly(val)) return;
                      set(i, { bewMonat: val });
                    }}
                  />
                </Td>

                <Td className="text-right">
                  <input
                    className="border rounded px-2 py-1 w-24 text-right"
                    type="number"
                    min={0}
                    value={r.ist}
                    onChange={(e) => set(i, { ist: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </Td>

                <Td className="text-right">
                  <input
                    className="border rounded px-2 py-1 w-24 text-right"
                    type="number"
                    min={0}
                    value={r.manuell ?? ""}
                    placeholder="-"
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : Math.max(0, Number(e.target.value) || 0);
                      set(i, { manuell: val as number | undefined });
                    }}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <th className={`px-3 py-2 text-left font-medium text-gray-700 ${className || ""}`}>{children}</th>;
}
function Td({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`px-3 py-2 ${className || ""}`}>{children}</td>;
}
