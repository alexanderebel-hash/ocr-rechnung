'use client';

interface RechnungsPosition {
  lkCode: string;
  bezeichnung: string;
  menge: number;
  preis: number;
  gesamt: number;
}

interface RechnungsDaten {
  rechnungsNummer?: string;
  rechnungsDatum?: string;
  zeitraum?: {
    monat?: string;
    von?: string;
    bis?: string;
  };
  klient?: {
    name?: string;
    adresse?: string;
  };
  rechnungsPositionen: RechnungsPosition[];
  zwischensumme: number;
  zinv?: number;
  gesamtbetrag: number;
}

interface RechnungsVorschauProps {
  rechnungsDaten: RechnungsDaten | null;
  isLoading?: boolean;
}

export default function RechnungsVorschau({ rechnungsDaten, isLoading }: RechnungsVorschauProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Originalrechnung Vorschau
        </h2>
        <div className="text-center py-8 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Verarbeite Rechnung...</p>
        </div>
      </div>
    );
  }

  if (!rechnungsDaten) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Originalrechnung Vorschau
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p>Keine Rechnungsdaten geladen</p>
          <p className="text-sm mt-2">Bitte laden Sie eine PDF-Rechnung hoch</p>
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
          Rechnungspositionen ({rechnungsDaten.rechnungsPositionen.length})
        </h4>

        {rechnungsDaten.rechnungsPositionen.length === 0 ? (
          <p className="text-gray-500 text-sm">Keine Positionen vorhanden</p>
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
            {rechnungsDaten.rechnungsPositionen.map((pos, index) => (
              <div
                key={index}
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
              {rechnungsDaten.zwischensumme.toFixed(2)} €
            </span>
          </div>

          {rechnungsDaten.zinv !== undefined && rechnungsDaten.zinv > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-700">ZINV (3,38%):</span>
              <span className="font-semibold text-gray-900">
                {rechnungsDaten.zinv.toFixed(2)} €
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t-2 border-blue-300">
            <span className="text-lg font-bold text-gray-900">Gesamtbetrag:</span>
            <span className="text-xl font-bold text-blue-600">
              {rechnungsDaten.gesamtbetrag.toFixed(2)} €
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
