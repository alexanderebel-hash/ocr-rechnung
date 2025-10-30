import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  BewilligungsEintrag,
  RechnungEintrag,
} from "../lib/bewilligungTypes";
import { vergleicheBewilligungMitRechnung } from "../lib/compareAbgleich";

/**
 * BewilligungsAnsicht-Komponente
 * -------------------------------
 * Lädt eine Bewilligung (Excel-Datei) und optional eine Rechnung (JSON oder CSV).
 * Zeigt anschließend den Abgleich als Tabelle an.
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
      <h1 className="text-xl font-semibold text-gray-900">
        Bewilligungsansicht
      </h1>

      {/* Upload Bewilligung (Excel) */}
      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Bewilligung (Excel-Datei)
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const buf = await f.arrayBuffer();
            const wb = XLSX.read(buf, { type: "array" });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const raw = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });

            const norm = (s: string) =>
              (s || "").toString().replace(/\s+/g, " ").trim().toLowerCase();

            const mapped: BewilligungsEintrag[] = raw.map((r: any) => {
              const cols = Object.keys(r).reduce<Record<string, any>>((acc, k) => {
                acc[norm(k)] = r[k];
                return acc;
              }, {});

              return {
                lkCode: String(cols["lk-code"] ?? "").trim(),
                leistungsbezeichnung: String(
                  cols["leistungsbezeichnung"] ?? ""
                ).trim(),
                bewilligtProWoche: num(cols["bewilligt pro woche"]),
                bewilligt
