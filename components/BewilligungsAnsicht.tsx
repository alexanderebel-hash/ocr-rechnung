"use client";

import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { BewilligungsEintrag, RechnungEintrag } from "../lib/approvalsTypes";
import { vergleicheBewilligungMitRechnung } from "../lib/compareAbgleich";

/**
 * BewilligungsAnsicht
 * -------------------
 * Lokales Test-UI: Excel (Bewilligung) + JSON/CSV (Rechnung) laden und Abgleich anzeigen.
 * Hinweis: Für Online-Bewilligungen nutze zusätzlich den BewilligungDropdown.
 */
export default function BewilligungsAnsicht() {
  const [bew, setBew] = useState<BewilligungsEintrag[] | null>(null);
  const [rch, setRch] = useState<RechnungEintrag[] | null>(null);

  const rows = useMemo(() => {
    if (!bew) return [];
    return vergleicheBewilligungMitRechnung(bew, rch ?? []);
  }, [bew, rch]);

  return (
    <div className="p-6 space-y-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-xl font-semibold text-gray-900">Bewilligungsansicht</h1>

      {/* Upload Bewilligung (Excel) */}
      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Bewilligung (Excel-Datei)</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleExcelUpload(setBew)}
          className="block border rounded p-2 text-sm"
        />
        <p className="text-xs text-gray-500">
          Erwartete Spalten (Beispiele): <code>LK-Code</code>, <code>Leistungsbezeichnung</code>,
          <code>Bewilligt pro Woche</code>, <code>Bewilligt pro Monat</code>
        </p>
      </section>

      {/* Upload Rechnung (JSON oder CSV) */}
      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Rechnung (JSON oder CSV)</label>
        <input
          type="file"
          accept=".json,.csv"
          onChange={handleInvoiceUpload(setRch)}
          className="block border rounded p-2 text-sm"
        />
        <p className="text-xs text-gray-500">
          JSON-Format: <code>[{"{ lkCode, anzahlImMonat }"}]</code> · CSV-Header: <code>lkCode,anzahlimmonat</code>
        </p>
      </section>

      {/* Ergebnis-Tabelle */}
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <Th>LK-Code</Th>
              <Th>Leistungsbezeichnung</Th>
              <Th className="text-right">Bewilligt / Woche</Th>
              <Th className="text-right">Bewilligt / Monat</Th>
              <Th className="text-right">Erbracht / Monat</Th>
              <Th className="text-right">Δ</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((z, i) => (
              <tr key={z.lkCode + i} className="border-t">
                <Td>{z.lkCode}</Td>
                <Td>{z.leistungsbezeichnung}</Td>
                <Td className="text-right">{fmt(z.bewilligtProWoche)}</Td>
                <Td className="text-right">{fmt(z.bewilligtProMonat)}</Td>
                <Td className="text-right">{fmt(z.erbrachteAnzahl)}</Td>
                <Td className="text-right">{fmt(z.delta, true)}</Td>
                <Td><StatusChip kind={z.abweichung} /></Td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <Td colSpan={7} className="text-center py-8 text-gray-500">
                  Bitte Bewilligung (und optional Rechnung) hochladen.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------- Helpers ------------------------- */

function handleExcelUpload(setBew: React.Dispatch<React.SetStateAction<BewilligungsEintrag[] | null>>) {
  return async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });

    const norm = (s: string) => (s ?? "").toString().replace(/\s+/g, " ").trim().toLowerCase();

    const mapped: BewilligungsEintrag[] = raw
      .map((r: any) => {
        const cols: Record<string, any> = {};
        for (const k of Object.keys(r)) cols[norm(k)] = r[k];

        return {
          lkCode: String(cols["lk-code"] ?? cols["lkcode"] ?? cols["lk"] ?? "").trim(),
          leistungsbezeichnung: String(cols["leistungsbezeichnung"] ?? cols["bezeichnung"] ?? "").trim(),
          bewilligtProWoche: toNum(cols["bewilligt pro woche"] ?? cols["pro woche"]),
          bewilligtProMonat: toNum(cols["bewilligt pro monat"] ?? cols["pro monat"]),
        };
      })
      .filter((x) => x.lkCode);

    setBew(mapped);
  };
}

function handleInvoiceUpload(setRch: React.Dispatch<React.SetStateAction<RechnungEintrag[] | null>>) {
  return async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.name.endsWith(".json")) {
      const txt = await f.text();
      const arr = JSON.parse(txt) as RechnungEintrag[];
      setRch(arr.filter((x) => x.lkCode));
      return;
    }

    // CSV
    const txt = await f.text();
    const lines = txt.split(/\r?\n/).filter(Boolean);
    const [header, ...rows] = lines;
    const cols = header.split(",").map((s) => s.trim().toLowerCase());
    const iCode = cols.indexOf("lkcode") >= 0 ? cols.indexOf("lkcode") : cols.indexOf("lk-code");
    const iAnz = cols.indexOf("anzahlimmonat");

    const out: RechnungEintrag[] = rows
      .map((line) => {
        const c = line.split(",");
        return {
          lkCode: (c[iCode] ?? "").trim(),
          anzahlImMonat: Number((c[iAnz] ?? "0").trim()) || 0,
        };
      })
      .filter((x) => x.lkCode);

    setRch(out);
  };
}

function Th({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th className={`px-3 py-2 text-left font-medium text-gray-700 ${className || ""}`}>
      {children}
    </th>
  );
}

function Td({ children, className, colSpan }: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
  return (
    <td className={`px-3 py-2 ${className || ""}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

function StatusChip({
  kind,
}: {
  kind: "OK" | "ZU_WENIG" | "ZU_VIEL" | "NICHT_BEWILLIGT" | "NICHT_ERBRACHT";
}) {
  const label = {
    OK: "OK",
    ZU_WENIG: "Zu wenig",
    ZU_VIEL: "Zu viel",
    NICHT_BEWILLIGT: "Nicht bewilligt",
    NICHT_ERBRACHT: "Nicht erbracht",
  }[kind];

  const styles = {
    OK: "bg-green-100 text-green-800",
    ZU_WENIG: "bg-yellow-100 text-yellow-800",
    ZU_VIEL: "bg-red-100 text-red-800",
    NICHT_BEWILLIGT: "bg-purple-100 text-purple-800",
    NICHT_ERBRACHT: "bg-gray-100 text-gray-700",
  }[kind];

  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${styles}`}>
      {label}
    </span>
  );
}

function toNum(v: any): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function fmt(n: number | null | undefined, sign = false) {
  if (n == null) return "–";
  const s = Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(n);
  return sign && n > 0 ? `+${s}` : s;
}
