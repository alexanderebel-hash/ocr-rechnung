'use client'

import { useState } from 'react'
import Hero from '@/components/Hero'
import PDFUpload from '@/components/PDFUpload'
import { InvoicePDFViewer } from '@/components/InvoicePDFViewer'
import BlobBewilligungPicker from '@/components/BlobBewilligungPicker'
import { computeCorrection, type Bewilligung as BillingBewilligung, type Invoice as BillingInvoice } from '@/lib/billing/calc'
import { PRICES, AUB } from '@/lib/billing/prices'

// LK-Preise (Berliner Pflegesystem 2025)
const LK_PREISE: Record<string, { bezeichnung: string; preis: number }> = {
  'LK01': { bezeichnung: 'Erweiterte Kleine Körperpflege', preis: 13.31 },
  'LK02': { bezeichnung: 'Kleine Körperpflege', preis: 9.18 },
  'LK03A': { bezeichnung: 'Erweiterte Große Körperpflege', preis: 19.97 },
  'LK03a': { bezeichnung: 'Erweiterte Große Körperpflege', preis: 19.97 },
  'LK03B': { bezeichnung: 'Große Körperpflege inkl. Prophylaxen', preis: 23.13 },
  'LK03b': { bezeichnung: 'Große Körperpflege inkl. Prophylaxen', preis: 23.13 },
  'LK04': { bezeichnung: 'Große Körperpflege', preis: 16.64 },
  'LK11B': { bezeichnung: 'Hilfe bei der Nahrungsaufnahme (besonders aufwändig)', preis: 18.80 },
  'LK11b': { bezeichnung: 'Hilfe bei der Nahrungsaufnahme (besonders aufwändig)', preis: 18.80 },
  'LK12': { bezeichnung: 'Hilfe bei der Nahrungsaufnahme', preis: 9.41 },
  'LK13': { bezeichnung: 'Hilfe beim Verlassen/Wiederaufsuchen der Wohnung', preis: 4.45 },
  'LK14': { bezeichnung: 'Warme Mahlzeit', preis: 22.29 },
  'LK15': { bezeichnung: 'Kleine Mahlzeit', preis: 4.80 },
  'LK17A': { bezeichnung: 'Hauswirtschaftliche Versorgung (aufwändig)', preis: 20.85 },
  'LK17a': { bezeichnung: 'Hauswirtschaftliche Versorgung (aufwändig)', preis: 20.85 },
  'LK17B': { bezeichnung: 'Hauswirtschaftliche Versorgung (besonders aufwändig)', preis: 26.47 },
  'LK17b': { bezeichnung: 'Hauswirtschaftliche Versorgung (besonders aufwändig)', preis: 26.47 },
  'LK20_HH': { bezeichnung: 'Hausbesuch (hauswirtschaftlich)', preis: 7.87 },
  'LK20.1': { bezeichnung: 'Hausbesuch (pflegerisch)', preis: 7.87 },
  'LK20.2': { bezeichnung: 'Hausbesuch (pflegerisch)', preis: 7.87 },
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
  const [invoiceData, setInvoiceData] = useState<any>(null)

  // Berechne Korrekturrechnung mit neuer Billing Engine
  const berechneKorrekturrechnung = () => {
    if (!bewilligung || !invoiceData) return null;

    console.log('\n=== STARTE KORREKTURRECHNUNG (Neue Billing Engine) ===');

    // Transform bewilligung data to billing engine format
    const billingBew: BillingBewilligung = {
      klient: bewilligung.klient,
      zeitraum: bewilligung.zeitraum,
      leistungen: (bewilligung.leistungen || []).map((l: any) => ({
        code: l.lkCode || l.leistungsart,
        menge: l.menge || l.jeMonat || l.jeWoche || 0,
        einheit: l.jeWoche ? 'x/Woche' : 'x/Monat',
      }))
    };

    // Transform invoice data to billing engine format
    const billingInv: BillingInvoice = {
      zeitraum: { monat: invoiceData.zeitraum?.monat },
      positionen: (invoiceData.rechnungsPositionen || [])
        .filter((p: any) => !p.istAUB) // AUBs werden von Engine automatisch berechnet
        .map((p: any) => ({
          code: p.lkCode || p.code,
          menge: Number(p.menge) || 0,
          einzelpreis: Number(p.preis) || undefined,
        }))
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

        {/* Blob Bewilligung Picker - Cold Load */}
        <BlobBewilligungPicker
          onBewilligungLoaded={(data, meta) => {
            console.log('✅ Bewilligung geladen:', meta.filename);
            console.log('Klient:', `${data.klient.vorname} ${data.klient.nachname}`);
            console.log('Zeitraum:', `${data.zeitraum.von} - ${data.zeitraum.bis}`);
            console.log('Leistungen:', data.leistungen.length);

            // Transform data structure to match existing billing logic
            const transformedBewilligung = {
              ...data,
              leistungen: data.leistungen.map(l => ({
                lkCode: l.leistungsart,
                jeWoche: l.einheit.includes('Woche') ? l.menge : 0,
                jeMonat: l.einheit.includes('Monat') ? l.menge : 0,
                menge: l.menge,
                minuten: l.minuten,
              }))
            };

            setBewilligung(transformedBewilligung);
            setBewilligungMeta(meta);
          }}
        />

        {/* Bewilligungs-Info */}
        {bewilligung && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start gap-3">
              <div className="text-green-600 text-2xl">✅</div>
              <div className="flex-1">
                <p className="font-semibold text-green-900 text-lg mb-2">
                  Bewilligung geladen
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

        {/* PDF Upload - nur aktiv wenn Bewilligung geladen */}
        {!bewilligung && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <p className="text-yellow-800 text-center">
              ⚠️ Bitte zuerst eine Bewilligung aus dem Blob laden
            </p>
          </div>
        )}

        {bewilligung && (
          <PDFUpload
            type="rechnung"
            onDataExtracted={(data) => {
              setInvoiceData(data)
              console.log('Rechnung analysiert:', data)
            }}
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
            <li>Bewilligung aus Blob-Storage laden (Cold Fetch)</li>
            <li>Rechnung (PDF) hochladen → Claude analysiert via OCR</li>
            <li>Korrekturrechnung wird gemäß Bewilligung erstellt</li>
            <li>PDF herunterladen und verwenden</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
