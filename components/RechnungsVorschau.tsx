'use client';

import React from 'react';

// LK-Preise für Bezeichnungen (Berliner Pflegesystem 2025)
const LK_PREISE: Record<string, { bezeichnung: string; preis: number }> = {
  'LK01': { bezeichnung: 'Erweiterte kleine Körperpflege', preis: 25.51 },
  'LK02': { bezeichnung: 'Kleine Körperpflege', preis: 17.01 },
  'LK03A': { bezeichnung: 'Erweiterte große Körperpflege', preis: 38.30 },
  'LK03a': { bezeichnung: 'Erweiterte große Körperpflege', preis: 38.30 },
  'LK03B': { bezeichnung: 'Erweiterte große Körperpflege m. Baden', preis: 51.02 },
  'LK03b': { bezeichnung: 'Erweiterte große Körperpflege m. Baden', preis: 51.02 },
  'LK04': { bezeichnung: 'Große Körperpflege', preis: 34.01 },
  'LK05': { bezeichnung: 'Lagern/Betten', preis: 8.50 },
  'LK06': { bezeichnung: 'Hilfe bei der Nahrungsaufnahme', preis: 21.30 },
  'LK07A': { bezeichnung: 'Darm- und Blasenentleerung', preis: 6.77 },
  'LK07a': { bezeichnung: 'Darm- und Blasenentleerung', preis: 6.77 },
  'LK07B': { bezeichnung: 'Darm- und Blasenentleerung erweitert', preis: 17.01 },
  'LK07b': { bezeichnung: 'Darm- und Blasenentleerung erweitert', preis: 17.01 },
  'LK08A': { bezeichnung: 'Hilfestelll. beim Verl.o.Wiederaufs. d. Wohng.', preis: 5.94 },
  'LK08a': { bezeichnung: 'Hilfestelll. beim Verl.o.Wiederaufs. d. Wohng.', preis: 5.94 },
  'LK08B': { bezeichnung: 'Hilfestellung beim Wiederaufsuchen der Wohnung', preis: 5.94 },
  'LK08b': { bezeichnung: 'Hilfestellung beim Wiederaufsuchen der Wohnung', preis: 5.94 },
  'LK09': { bezeichnung: 'Begleitung ausser Haus', preis: 51.02 },
  'LK11A': { bezeichnung: 'Kleine Reinigung der Wohnung', preis: 7.43 },
  'LK11a': { bezeichnung: 'Kleine Reinigung der Wohnung', preis: 7.43 },
  'LK11B': { bezeichnung: 'Große Reinigung der Wohnung', preis: 22.29 },
  'LK11b': { bezeichnung: 'Große Reinigung der Wohnung', preis: 22.29 },
  'LK12': { bezeichnung: 'Wechseln u. Waschen der Kleidung', preis: 39.62 },
  'LK13': { bezeichnung: 'Einkaufen', preis: 19.81 },
  'LK14': { bezeichnung: 'Zubereitung warme Mahlzeit', preis: 22.29 },
  'LK15': { bezeichnung: 'Zubereitung kleine Mahlzeit', preis: 7.43 },
  'LK17A': { bezeichnung: 'Einsatzpauschale', preis: 5.37 },
  'LK17a': { bezeichnung: 'Einsatzpauschale', preis: 5.37 },
  'LK17B': { bezeichnung: 'Einsatzpauschale WE', preis: 10.73 },
  'LK17b': { bezeichnung: 'Einsatzpauschale WE', preis: 10.73 },
  'LK20': { bezeichnung: 'Häusliche Betreuung §124 SGB XI', preis: 8.26 },
  'LK20_HH': { bezeichnung: 'Häusliche Betreuung §124 SGB XI (Haushaltsbuch)', preis: 8.26 },
  'LK20.1': { bezeichnung: 'Häusliche Betreuung §124 SGB XI', preis: 8.26 },
  'LK20.2': { bezeichnung: 'Häusliche Betreuung §124 SGB XI (Haushaltsbuch)', preis: 8.26 },
};

interface RechnungsVorschauProps {
  rechnungsDaten: {
    rechnungsNummer?: string | null;
    rechnungsDatum?: string | null;
    zeitraum?: {
      monat?: string | null;
      von?: string | null;
      bis?: string | null;
    } | null;
    klient?: {
      name?: string | null;
      adresse?: string | null;
    } | null;
    positionen?: Array<{
      lkCode?: string | null;
      bezeichnung?: string | null;
      menge?: number | string | null;
      preis?: number | string | null;
      gesamt?: number | string | null;
    }> | null;
    zwischensumme?: number | string | null;
    gesamtbetrag?: number | string | null;
    zinv?: number | string | null;
  };
  isLoading?: boolean; // ✅ HINZUGEFÜGT
}

function toNumber(
  value: number | string | null | undefined,
  fallback: number = 0,
): number {
  if (value === null || value === undefined || value === '') return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(num) ? num : fallback;
}

export default function RechnungsVorschau({ rechnungsDaten, isLoading }: RechnungsVorschauProps) {
  const positionen = (rechnungsDaten?.positionen ?? []).map((pos, index) => {
    const lkCodeRaw =
      typeof pos?.lkCode === 'string' && pos.lkCode.trim().length > 0
        ? pos.lkCode
        : undefined;

    const bezeichnungRaw =
      typeof pos?.bezeichnung === 'string' && pos.bezeichnung.trim().length > 0
        ? pos.bezeichnung
        : undefined;

    const menge = toNumber(pos?.menge);
    const preis = toNumber(pos?.preis);
    const gesamt = toNumber(
      pos?.gesamt,
      Number.isFinite(menge * preis) ? menge * preis : 0,
    );

    const lkCode = lkCodeRaw ?? `Pos-${index + 1}`;
    
    // ✅ FIX: Hole Bezeichnung aus LK_PREISE wenn OCR keine liefert
    const bezeichnung = bezeichnungRaw ?? LK_PREISE[lkCode]?.bezeichnung ?? 'Unbekannte Leistung';

    return {
      key: `${lkCode}-${index}`,
      lkCode,
      bezeichnung,
      menge,
      preis,
      gesamt,
    };
  });

const hatPositionen = positionen.length > 0;
  const zwischensumme = toNumber(rechnungsDaten?.zwischensumme);
  const gesamtbetrag = toNumber(rechnungsDaten?.gesamtbetrag);
  const zinvValue =
    rechnungsDaten?.zinv === null || rechnungsDaten?.zinv === undefined
      ? null
      : toNumber(rechnungsDaten?.zinv);

  // ✅ Loading State anzeigen
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Originalrechnung Vorschau
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Rechnung wird analysiert...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Originalrechnung Vorschau
      </h2>

      {/* Rechnungskopf */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          {rechnungsDaten.rechnungsNummer && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Rechnungsnummer</label>
              <p className="font-medium text-gray-900">{rechnungsDaten.rechnungsNummer}</p>
            </div>
          )}
          {rechnungsDaten.rechnungsDatum && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Rechnungsdatum</label>
              <p className="font-medium text-gray-900">{rechnungsDaten.rechnungsDatum}</p>
            </div>
          )}
        </div>
      </div>

      {/* Zeitraum */}
      {rechnungsDaten.zeitraum && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Leistungszeitraum</h4>
          {rechnungsDaten.zeitraum.monat && (
            <p className="text-gray-900">{rechnungsDaten.zeitraum.monat}</p>
          )}
          {(rechnungsDaten.zeitraum.von || rechnungsDaten.zeitraum.bis) && (
            <p className="text-gray-600 text-sm">
              {rechnungsDaten.zeitraum.von || '?'} - {rechnungsDaten.zeitraum.bis || '?'}
            </p>
          )}
        </div>
      )}

      {/* Klient */}
      {rechnungsDaten.klient && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Klient</h4>
          {rechnungsDaten.klient.name && (
            <p className="text-gray-900">{rechnungsDaten.klient.name}</p>
          )}
          {rechnungsDaten.klient.adresse && (
            <p className="text-gray-600 text-sm">{rechnungsDaten.klient.adresse}</p>
          )}
        </div>
      )}

      {/* Rechnungspositionen */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-gray-900 mb-3">
          Rechnungspositionen ({positionen.length})
        </h4>

        {!hatPositionen ? (
          <div className="text-gray-500 text-sm space-y-1">
            <p>Keine Rechnungspositionen vorhanden oder nicht erkannt.</p>
            <p className="text-xs">
              Bitte prüfen Sie die OCR-Erkennung oder ergänzen Sie die Positionen manuell.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 pb-2 border-b border-gray-300 text-xs font-semibold text-gray-600">
              <div className="col-span-2">LK-Code</div>
              <div className="col-span-5">Bezeichnung</div>
              <div className="col-span-2 text-right">Menge</div>
              <div className="col-span-2 text-right">Preis</div>
              <div className="col-span-1 text-right">Gesamt</div>
            </div>

            {/* Positionen */}
            {positionen.map((pos) => (
              <div
                key={pos.key}
                className="grid grid-cols-12 gap-2 py-2 border-b border-gray-200 text-sm"
              >
                <div className="col-span-2 font-semibold text-gray-900">
                  {pos.lkCode}
                </div>
                <div className="col-span-5 text-gray-700">
                  {pos.bezeichnung || '-'}
                </div>
                <div className="col-span-2 text-right text-gray-900">
                  {pos.menge.toFixed(2)}
                </div>
                <div className="col-span-2 text-right text-gray-900">
                  {pos.preis.toFixed(2)} €
                </div>
                <div className="col-span-1 text-right font-medium text-gray-900">
                  {pos.gesamt.toFixed(2)} €
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summen */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Zwischensumme:</span>
            <span className="font-semibold text-gray-900">
              {zwischensumme.toFixed(2)} €
            </span>
          </div>

          {zinvValue !== null && zinvValue > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-700">ZINV (3,38%):</span>
              <span className="font-semibold text-gray-900">
                {zinvValue.toFixed(2)} €
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t-2 border-blue-300">
            <span className="text-lg font-bold text-gray-900">Gesamtbetrag:</span>
            <span className="text-xl font-bold text-blue-600">
              {gesamtbetrag.toFixed(2)} €
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          ℹ️ Diese Daten wurden automatisch aus der hochgeladenen PDF-Rechnung extrahiert.
          Die Korrekturrechnung wird auf Basis dieser Originalrechnung und der ausgewählten Bewilligung berechnet.
        </p>
      </div>
    </div>
  );
}