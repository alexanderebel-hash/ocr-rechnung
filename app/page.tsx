'use client'

import { useState } from 'react'
import Hero from '@/components/Hero'
import PDFUpload from '@/components/PDFUpload'
import { InvoicePDFViewer } from '@/components/InvoicePDFViewer'
import BewilligungDropdown from '@/components/BewilligungDropdown'
import RechnungsVorschau from '@/components/RechnungsVorschau'
import { computeCorrection, type Bewilligung as BillingBewilligung, type Invoice as BillingInvoice } from '@/lib/billing/calc'
import { PRICES, AUB } from '@/lib/billing/prices'

// LK-Preise (Berliner Pflegesystem 2025)
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

const normalizeLKCode = (value: string | undefined | null) => {
  const upper = String(value || '').toUpperCase().trim().replace(/\s+/g, '');
  const special: Record<string, string> = {
    LK03A: 'LK03a',
    LK03B: 'LK03b',
    LK07A: 'LK07a',
    LK07B: 'LK07b',
    LK08A: 'LK08a',
    LK08B: 'LK08b',
    LK11A: 'LK11a',
    LK11B: 'LK11b',
    LK17A: 'LK17a',
    LK17B: 'LK17b',
  };
  return special[upper] ?? upper;
};

interface RechnungsPosition {
  lkCode: string;
  bezeichnung: string;
  menge: number;
  preis: number;
  gesamt: number;
  bewilligt?: boolean;
  istAUB?: boolean;
  gekuerztVon?: number;
}

export default function Home() {
  const [bewilligung, setBewilligung] = useState<any>(null)
  const [bewilligungMeta, setBewilligungMeta] = useState<any>(null)
  const [bewilligungConfirmed, setBewilligungConfirmed] = useState(false)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false)

  // Berechne Korrekturrechnung mit neuer Billing Engine
  const berechneKorrekturrechnung = () => {
    if (!bewilligung || !invoiceData) return null;

    const rechnungsPositionen = Array.isArray(invoiceData.rechnungsPositionen)
      ? invoiceData.rechnungsPositionen
      : [];

    if (
      invoiceData.rechnungsPositionen !== undefined &&
      !Array.isArray(invoiceData.rechnungsPositionen)
    ) {
      console.warn(
        '[Home] Ungültige Struktur für invoiceData.rechnungsPositionen; fallback auf leeres Array.',
      );
    }

    const allValidPositions =
      rechnungsPositionen.length > 0 &&
      rechnungsPositionen.every((p: any) => {
        const code = normalizeLKCode(p.lkCode || p.code || "");
        const price = Number(p.preis ?? p.einzelpreis ?? 0);
        return /^LK\d{1,2}[A-Za-z]?$/.test(code) && Number.isFinite(price) && price >= 0;
      });

    if (!allValidPositions) {
      console.warn('OCR invalid → abort correction');
      return null;
    }

    console.log('\n=== STARTE KORREKTURRECHNUNG (Neue Billing Engine) ===');

    // Transform bewilligung data to billing engine format
    const billingBew: BillingBewilligung = {
      klient: bewilligung.klient,
      zeitraum: bewilligung.zeitraum,
      leistungen: (bewilligung.leistungen || []).map((l: any) => ({
        code: normalizeLKCode(l.lkCode || l.leistungsart),
        menge: l.menge || l.jeMonat || l.jeWoche || 0,
        einheit: l.jeWoche ? 'x/Woche' : 'x/Monat',
        genehmigt: l.genehmigt ?? l.approved ?? true,
      }))
    };

    // Transform invoice data to billing engine format
    const billingInvPositionen = rechnungsPositionen
      .filter((p: any) => !p.istAUB) // AUBs werden von Engine automatisch berechnet
      .map((p: any) => {
        const code = normalizeLKCode(p.lkCode ?? p.code);
        const menge = Number(p.menge) || 0;
        const preisRaw = Number(p.preis);
        const fallbackPreis = (PRICES as Record<string, number>)[code];
        const einzelpreis = Number.isFinite(preisRaw) && preisRaw > 0 ? preisRaw : fallbackPreis;
        return {
          code,
          menge,
          einzelpreis,
        };
      })
      .filter((pos: any) => pos.menge > 0);

    const invalidOcrPositions = billingInvPositionen.filter((pos: any) => {
      const validCode = /^LK\d{1,2}[A-Za-z]?$/.test(pos.code);
      const validPreis = Number.isFinite(pos.einzelpreis) && (pos.einzelpreis as number) > 0;
      return !validCode || !validPreis;
    });

    if (invalidOcrPositions.length > 0) {
      console.warn('[Home] Abbruch: OCR-Positionen ohne gültigen LK-Code oder Preis', invalidOcrPositions);
      return null;
    }

    const billingInv: BillingInvoice = {
      zeitraum: { monat: invoiceData.zeitraum?.monat },
      positionen: billingInvPositionen,
    };

    // Get current month or use invoice month
    const now = new Date();
    const month = invoiceData.zeitraum?.monat || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Determine pflegekassen budget based on Pflegegrad (if available)
    const pflegegrad = bewilligung.klient?.pflegegrad || 2;
    const budgetMap: Record<number, number> = {
      1: 0,      // PG1 - keine Sachleistung
      2: 761,    // PG2
      3: 1432,   // PG3
      4: 1778,   // PG4
      5: 2200,   // PG5
    };
    const pflegekassenBudget = budgetMap[pflegegrad] || 761;

    console.log('Monat:', month);
    console.log('Pflegegrad:', pflegegrad, '→ Budget:', pflegekassenBudget, '€');
    console.log('Bewilligungen:', billingBew.leistungen.length);
    console.log('Rechnungspositionen:', billingInv.positionen.length);

    // Call billing engine
    const result = computeCorrection(billingBew, billingInv, {
      month,
      pflegekassenBudget,
      zinvSatz: 0.0338,
      priceTable: PRICES,
      aubTable: AUB,
    });

    console.log('\n=== DEBUG INFO ===');
    console.log('5-Wochen-Monat:', result.debug.weeklyFactor === 5);
    console.log('Limits:', result.debug.limit);
    console.log('Erbracht:', result.debug.erbracht);
    console.log('BA-Mengen:', result.debug.baMenge);
    console.log('Privat-Mengen:', result.debug.privatMenge);

    console.log('\n=== BA-RECHNUNG ===');
    console.log('Positionen:', result.ba.positionen.length);
    console.log('Zwischensumme:', result.ba.zwischensumme.toFixed(2), '€');
    console.log('ZINV:', result.ba.zinv.toFixed(2), '€');
    console.log('Gesamt:', result.ba.gesamt.toFixed(2), '€');
    console.log('./. Pflegekasse:', result.ba.pflegekassenAbzug.toFixed(2), '€');
    console.log('→ Rechnungsbetrag BA:', result.ba.rechnungsbetrag.toFixed(2), '€');

    console.log('\n=== PRIVATRECHNUNG ===');
    console.log('Positionen:', result.privat.positionen.length);
    console.log('Zwischensumme:', result.privat.zwischensumme.toFixed(2), '€');
    console.log('ZINV:', result.privat.zinv.toFixed(2), '€');
    console.log('→ Rechnungsbetrag Privat:', result.privat.rechnungsbetrag.toFixed(2), '€');

    // Convert back to old format for PDF component compatibility
    return {
      positionen: result.ba.positionen.map(p => ({
        lkCode: p.code,
        bezeichnung: p.text || p.code,
        menge: p.menge,
        preis: p.einzelpreis,
        gesamt: p.summe,
        istAUB: p.isAUB,
        bewilligt: true,
      })),
      zwischensumme: result.ba.zwischensumme,
      zinv: result.ba.zinv,
      gesamtbetrag: result.ba.gesamt,
      pflegekasse: result.ba.pflegekassenAbzug,
      rechnungsbetrag: result.ba.rechnungsbetrag,
      // Include privat data for potential dual-invoice PDF
      privat: {
        positionen: result.privat.positionen.map(p => ({
          lkCode: p.code,
          bezeichnung: p.text || p.code,
          menge: p.menge,
          preis: p.einzelpreis,
          gesamt: p.summe,
          istAUB: p.isAUB,
        })),
        zwischensumme: result.privat.zwischensumme,
        zinv: result.privat.zinv,
        gesamtbetrag: result.privat.gesamt,
        rechnungsbetrag: result.privat.rechnungsbetrag,
      }
    };
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Hero />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        {/* Bewilligung Dropdown mit Vorschau und Bearbeitung */}
        <BewilligungDropdown
          onLoaded={(approval) => {
            console.log('✅ Bewilligung geladen:', approval);
          }}
          adminMode={false}
        />

        {/* Bewilligungs-Bestätigung */}
        {bewilligungConfirmed && bewilligung && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start gap-3">
              <div className="text-green-600 text-2xl">✅</div>
              <div className="flex-1">
                <p className="font-semibold text-green-900 text-lg mb-2">
                  Bewilligung bestätigt
                </p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-medium">Klient:</span>{' '}
                    {bewilligung.klient.vorname} {bewilligung.klient.nachname}
                  </p>
                  <p>
                    <span className="font-medium">Zeitraum:</span>{' '}
                    {bewilligung.zeitraum.von} - {bewilligung.zeitraum.bis}
                  </p>
                  <p>
                    <span className="font-medium">Leistungen:</span>{' '}
                    {bewilligung.leistungen.length}
                  </p>
                  {bewilligung.kasse && (
                    <p>
                      <span className="font-medium">Kasse:</span>{' '}
                      {bewilligung.kasse}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    📄 {bewilligungMeta?.filename}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PDF Upload - nur aktiv wenn Bewilligung bestätigt */}
        {!bewilligungConfirmed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <p className="text-yellow-800 text-center">
              ⚠️ Bitte zuerst eine Bewilligung auswählen, bearbeiten und bestätigen
            </p>
          </div>
        )}

        {bewilligungConfirmed && (
          <PDFUpload
            type="rechnung"
            onDataExtracted={(data) => {
              setInvoiceData(data)
              setIsUploadingInvoice(false)
              console.log('Rechnung analysiert:', data)
            }}
          />
        )}

        {/* Rechnungsvorschau */}
        {bewilligungConfirmed && (
          <RechnungsVorschau
            rechnungsDaten={invoiceData}
            isLoading={isUploadingInvoice}
          />
        )}

        {/* Korrekturrechnung */}
        {invoiceData && bewilligung && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Korrekturrechnung
            </h2>

            <InvoicePDFViewer
              data={(() => {
                // Berechne Korrekturrechnung mit allen Sonderregeln
                const korrektur = berechneKorrekturrechnung();

                if (!korrektur) {
                  return null;
                }

                return {
                  ...invoiceData,
                  klient: {
                    name: `${bewilligung.klient.vorname} ${bewilligung.klient.nachname}`,
                    adresse: bewilligung.klient.adresse || '',
                    pflegegrad: bewilligung.klient.pflegegrad || 2,
                  },
                  dienst: {
                    name: 'DomusVita Gesundheit GmbH',
                    standort: 'Kreuzberg',
                    adresse: 'Waldemarstraße 10 A, 10999 Berlin',
                    telefon: '030/6120152-0',
                    email: 'kreuzberg@domusvita.de',
                    ik: '461104096',
                  },
                  rechnungsDatum: new Date().toLocaleDateString('de-DE'),
                  rechnungsnummer: `RG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
                  debitor: `${bewilligung.klient.nachname}_${Date.now()}`,
                  ik: '461104096',
                  zeitraumVon: invoiceData.abrechnungszeitraumVon || bewilligung.zeitraum?.von || '',
                  zeitraumBis: invoiceData.abrechnungszeitraumBis || bewilligung.zeitraum?.bis || '',
                  positionen: korrektur.positionen,
                  zwischensumme: korrektur.zwischensumme,
                  zinv: korrektur.zinv,
                  gesamtbetrag: korrektur.gesamtbetrag,
                  pflegekasse: korrektur.pflegekasse,
                  rechnungsbetrag: korrektur.rechnungsbetrag,
                  zahlungsziel: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
                };
              })()}
            />
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Workflow:</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Bewilligung aus Dropdown auswählen (alphabetisch sortiert nach Nachname, Vorname)</li>
            <li>Bewilligungsdaten in Vorschau prüfen und bei Bedarf bearbeiten</li>
            <li>Auf "Bewilligungsdaten für Korrekturrechnung verwenden" klicken</li>
            <li>Originalrechnung (PDF) hochladen → Claude analysiert via OCR</li>
            <li>Vorschau der Originalrechnung prüfen</li>
            <li>Korrekturrechnung wird automatisch gemäß Bewilligung erstellt</li>
            <li>PDF herunterladen und verwenden</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
