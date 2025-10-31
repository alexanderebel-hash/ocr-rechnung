import React, { useEffect, useMemo, useState } from "react";

export type HeaderData = {
  vorname?: string;
  nachname?: string;
  adresse?: string;
  pflegegrad?: number | null;
  zeitraumVon?: string;
  zeitraumBis?: string;
};

function parseFromFilename(name: string | undefined) {
  const n = String(name || "");
  const period = n.match(/(\d{2}\.\d{2}\.\d{2,4})\s*[–-]\s*(\d{2}\.\d{2}\.\d{2,4})/);
  const last = n
    .split(/[._\- ]+/)
    .find((tok) => /^[a-zA-ZäöüÄÖÜß]+$/.test(tok) && !/bewill/i.test(tok));
  return {
    nachname: last ? last.replace(/\.xlsx$/i, "") : "",
    von: period?.[1] ?? "",
    bis: period?.[2] ?? "",
  };
}

export default function ApprovalHeader({
  fileName,
  initial,
  onChange,
}: {
  fileName?: string;
  initial?: Partial<HeaderData>;
  onChange?: (data: HeaderData) => void;
}) {
  const parsed = useMemo(() => parseFromFilename(fileName), [fileName]);
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState<HeaderData>(() => ({
    vorname: initial?.vorname ?? "",
    nachname: initial?.nachname ?? parsed.nachname ?? "",
    adresse: initial?.adresse ?? "",
    pflegegrad: initial?.pflegegrad ?? null,
    zeitraumVon: initial?.zeitraumVon ?? parsed.von ?? "",
    zeitraumBis: initial?.zeitraumBis ?? parsed.bis ?? "",
  }));

  useEffect(() => {
    setData({
      vorname: initial?.vorname ?? "",
      nachname: initial?.nachname ?? parsed.nachname ?? "",
      adresse: initial?.adresse ?? "",
      pflegegrad: initial?.pflegegrad ?? null,
      zeitraumVon: initial?.zeitraumVon ?? parsed.von ?? "",
      zeitraumBis: initial?.zeitraumBis ?? parsed.bis ?? "",
    });
  }, [parsed.nachname, parsed.von, parsed.bis, initial?.vorname, initial?.nachname, initial?.adresse, initial?.pflegegrad, initial?.zeitraumVon, initial?.zeitraumBis]);

  useEffect(() => {
    onChange?.(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onChange?.(data);
  }, [data, onChange]);

  function upd<K extends keyof HeaderData>(key: K, val: HeaderData[K]) {
    const next = { ...data, [key]: val };
    setData(next);
    onChange?.(next);
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Vorschau</h2>
        <button
          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
          onClick={() => setEdit((v) => !v)}
        >
          {edit ? "Fertig" : "Bearbeiten"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Klient</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="flex flex-col">
              <span className="text-gray-600">Nachname</span>
              {edit ? (
                <input
                  className="border rounded px-2 py-1"
                  value={data.nachname || ""}
                  onChange={(e) => upd("nachname", e.target.value)}
                />
              ) : (
                <span>{data.nachname || "–"}</span>
              )}
            </label>
            <label className="flex flex-col">
              <span className="text-gray-600">Vorname</span>
              {edit ? (
                <input
                  className="border rounded px-2 py-1"
                  value={data.vorname || ""}
                  onChange={(e) => upd("vorname", e.target.value)}
                />
              ) : (
                <span>{data.vorname || "–"}</span>
              )}
            </label>
            <label className="flex flex-col col-span-2">
              <span className="text-gray-600">Adresse</span>
              {edit ? (
                <input
                  className="border rounded px-2 py-1"
                  value={data.adresse || ""}
                  onChange={(e) => upd("adresse", e.target.value)}
                />
              ) : (
                <span>{data.adresse || "–"}</span>
              )}
            </label>
            <label className="flex flex-col">
              <span className="text-gray-600">Pflegegrad</span>
              {edit ? (
                <input
                  className="border rounded px-2 py-1"
                  type="number"
                  min={1}
                  max={5}
                  value={data.pflegegrad ?? ""}
                  onChange={(e) => upd("pflegegrad", Number(e.target.value) || null)}
                />
              ) : (
                <span>{data.pflegegrad ?? "–"}</span>
              )}
            </label>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Zeitraum</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="flex flex-col">
              <span className="text-gray-600">Von</span>
              {edit ? (
                <input
                  className="border rounded px-2 py-1"
                  placeholder="TT.MM.JJJJ"
                  value={data.zeitraumVon || ""}
                  onChange={(e) => upd("zeitraumVon", e.target.value)}
                />
              ) : (
                <span>{data.zeitraumVon || "–"}</span>
              )}
            </label>
            <label className="flex flex-col">
              <span className="text-gray-600">Bis</span>
              {edit ? (
                <input
                  className="border rounded px-2 py-1"
                  placeholder="TT.MM.JJJJ"
                  value={data.zeitraumBis || ""}
                  onChange={(e) => upd("zeitraumBis", e.target.value)}
                />
              ) : (
                <span>{data.zeitraumBis || "–"}</span>
              )}
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
