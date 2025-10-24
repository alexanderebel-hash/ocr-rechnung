'use client'

import { useState } from 'react'
import Hero from '@/components/Hero'
import { KlientenDropdown } from '@/components/KlientenDropdown'
import PDFUpload from '@/components/PDFUpload'
import { InvoicePDF } from '@/components/InvoicePDF'
import AdminBewilligungStorage from '@/components/AdminBewilligungStorage'

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
  const [selectedKlient, setSelectedKlient] = useState<any>(null)
  const [bewilligung, setBewilligung] = useState<any>(null)
  const [invoiceData, setInvoiceData] = useState<any>(null)

  // Sonderregeln für Pflegeabrechnung
  const wendeSonderregelnAn = (positionen: RechnungsPosition[], bewilligungData: any[]): RechnungsPosition[] => {
    let result = [...positionen];

    // ============================================
    // SONDERREGEL 1: LK14 → LK15
    // Warme Mahlzeit → Kleine Mahlzeit
    // ============================================
    const lk14Pos = result.find(p => p.lkCode === 'LK14');
    const lk15Pos = result.find(p => p.lkCode === 'LK15');
    const lk14Bewilligt = bewilligungData.find(b => b.lkCode.toUpperCase() === 'LK14');
    const lk15Bewilligt = bewilligungData.find(b => b.lkCode.toUpperCase() === 'LK15');

    if (lk14Pos && lk14Pos.menge > 0 && !lk14Bewilligt && lk15Bewilligt) {
      const lk15MaxMenge = lk15Bewilligt.menge || (lk15Bewilligt.jeWoche * 4.33);
      const lk14Menge = lk14Pos.menge;
      const lk15Menge = lk15Pos ? lk15Pos.menge : 0;
      const summeMengen = lk14Menge + lk15Menge;

      if (summeMengen <= lk15MaxMenge) {
        console.log(`✓ Sonderregel LK14→LK15: ${lk14Menge} + ${lk15Menge} = ${summeMengen} ≤ ${lk15MaxMenge}`);

        if (lk15Pos) {
          const lk15Index = result.indexOf(lk15Pos);
          result[lk15Index] = {
            ...lk15Pos,
            menge: summeMengen,
            gesamt: summeMengen * lk15Pos.preis,
            bewilligt: true
          };
        } else {
          const lk15Data = LK_PREISE['LK15'];
          result.push({
            lkCode: 'LK15',
            bezeichnung: lk15Data.bezeichnung,
            menge: lk14Menge,
            preis: lk15Data.preis,
            gesamt: lk14Menge * lk15Data.preis,
            bewilligt: true,
            istAUB: false
          });
        }

        const lk14Index = result.indexOf(lk14Pos);
        result[lk14Index] = {
          ...lk14Pos,
          menge: 0,
          gesamt: 0,
          bewilligt: false
        };
      } else {
        console.log(`✗ Sonderregel LK14→LK15 nicht anwendbar: ${summeMengen} > ${lk15MaxMenge}`);
        const lk14Index = result.indexOf(lk14Pos);
        result[lk14Index] = {
          ...lk14Pos,
          menge: 0,
          gesamt: 0,
          bewilligt: false
        };
      }
    }

    // ============================================
    // SONDERREGEL 2: LK04 ↔ LK02
    // Große Körperpflege ↔ Kleine Körperpflege
    // NUR wenn LK04 bewilligt ist!
    // ============================================
    const lk02Pos = result.find(p => p.lkCode === 'LK02');
    const lk04Pos = result.find(p => p.lkCode === 'LK04');
    const lk04Bewilligt = bewilligungData.find(b => b.lkCode.toUpperCase() === 'LK04');
    const lk02Bewilligt = bewilligungData.find(b => b.lkCode.toUpperCase() === 'LK02');

    if (lk04Bewilligt && !lk02Bewilligt) {
      const lk04MaxMenge = lk04Bewilligt.menge || (lk04Bewilligt.jeWoche * 4.33);
      const lk02Menge = lk02Pos ? lk02Pos.menge : 0;
      const lk04Menge = lk04Pos ? lk04Pos.menge : 0;
      const summeMengen = lk02Menge + lk04Menge;

      if (lk02Menge > 0 || lk04Menge > 0) {
        console.log(`✓ Sonderregel LK04↔LK02: LK04 bewilligt (${lk04MaxMenge}), LK02+LK04 = ${summeMengen}`);

        if (summeMengen <= lk04MaxMenge) {
          if (lk02Pos) {
            const lk02Index = result.indexOf(lk02Pos);
            result[lk02Index] = { ...lk02Pos, bewilligt: true };
          }
          if (lk04Pos) {
            const lk04Index = result.indexOf(lk04Pos);
            result[lk04Index] = { ...lk04Pos, bewilligt: true };
          }
        } else {
          if (lk04Pos) {
            const lk04Index = result.indexOf(lk04Pos);
            const lk04NeueMenge = Math.min(lk04Menge, lk04MaxMenge);
            result[lk04Index] = {
              ...lk04Pos,
              menge: lk04NeueMenge,
              gesamt: lk04NeueMenge * lk04Pos.preis,
              bewilligt: true,
              gekuerztVon: lk04Menge > lk04NeueMenge ? lk04Menge : undefined
            };
          }

          if (lk02Pos) {
            const verbleibend = lk04MaxMenge - (lk04Pos ? Math.min(lk04Menge, lk04MaxMenge) : 0);
            const lk02Index = result.indexOf(lk02Pos);
            const lk02NeueMenge = Math.min(lk02Menge, Math.max(0, verbleibend));
            result[lk02Index] = {
              ...lk02Pos,
              menge: lk02NeueMenge,
              gesamt: lk02NeueMenge * lk02Pos.preis,
              bewilligt: lk02NeueMenge > 0,
              gekuerztVon: lk02Menge > lk02NeueMenge ? lk02Menge : undefined
            };
          }
        }
      }
    }

    // ============================================
    // SONDERREGEL 3: LK03a → LK01
    // Erweiterte große Körperpflege → Erweiterte kleine
    // NUR wenn LK03a bewilligt ist!
    // ============================================
    const lk01Pos = result.find(p => p.lkCode === 'LK01');
    const lk03aPos = result.find(p => p.lkCode === 'LK03A' || p.lkCode === 'LK03a');
    const lk03aBewilligt = bewilligungData.find(b =>
      b.lkCode.toUpperCase() === 'LK03A' || b.lkCode.toUpperCase() === 'LK03a'
    );
    const lk01Bewilligt = bewilligungData.find(b => b.lkCode.toUpperCase() === 'LK01');

    if (lk03aBewilligt && !lk01Bewilligt) {
      const lk03aMaxMenge = lk03aBewilligt.menge || (lk03aBewilligt.jeWoche * 4.33);
      const lk01Menge = lk01Pos ? lk01Pos.menge : 0;
      const lk03aMenge = lk03aPos ? lk03aPos.menge : 0;
      const summeMengen = lk01Menge + lk03aMenge;

      if (lk01Menge > 0 || lk03aMenge > 0) {
        console.log(`✓ Sonderregel LK03a→LK01: LK03a bewilligt (${lk03aMaxMenge}), LK01+LK03a = ${summeMengen}`);

        if (summeMengen <= lk03aMaxMenge) {
          if (lk01Pos) {
            const lk01Index = result.indexOf(lk01Pos);
            result[lk01Index] = { ...lk01Pos, bewilligt: true };
          }
          if (lk03aPos) {
            const lk03aIndex = result.indexOf(lk03aPos);
            result[lk03aIndex] = { ...lk03aPos, bewilligt: true };
          }
        } else {
          if (lk03aPos) {
            const lk03aIndex = result.indexOf(lk03aPos);
            const lk03aNeueMenge = Math.min(lk03aMenge, lk03aMaxMenge);
            result[lk03aIndex] = {
              ...lk03aPos,
              menge: lk03aNeueMenge,
              gesamt: lk03aNeueMenge * lk03aPos.preis,
              bewilligt: true,
              gekuerztVon: lk03aMenge > lk03aNeueMenge ? lk03aMenge : undefined
            };
          }

          if (lk01Pos) {
            const verbleibend = lk03aMaxMenge - (lk03aPos ? Math.min(lk03aMenge, lk03aMaxMenge) : 0);
            const lk01Index = result.indexOf(lk01Pos);
            const lk01NeueMenge = Math.min(lk01Menge, Math.max(0, verbleibend));
            result[lk01Index] = {
              ...lk01Pos,
              menge: lk01NeueMenge,
              gesamt: lk01NeueMenge * lk01Pos.preis,
              bewilligt: lk01NeueMenge > 0,
              gekuerztVon: lk01Menge > lk01NeueMenge ? lk01Menge : undefined
            };
          }
        }
      }
    }

    return result;
  };

  // Berechne Korrekturrechnung mit allen Regeln
  const berechneKorrekturrechnung = () => {
    if (!bewilligung || !invoiceData) return null;

    const bewilligungData = bewilligung.leistungen || [];

    console.log('\n=== STARTE KORREKTURRECHNUNG ===');
    console.log('Bewilligte LKs:', bewilligungData.map((b: any) => `${b.lkCode} (${b.jeWoche || 0}×W, ${b.menge || 0}×M)`));

    // Originale Rechnungspositionen
    const rechnungPositionen = (invoiceData.rechnungsPositionen || []).map((pos: any) => ({
      lkCode: pos.lkCode,
      bezeichnung: pos.bezeichnung,
      menge: Number(pos.menge) || 0,
      preis: Number(pos.preis) || 0,
      gesamt: Number(pos.gesamt) || (Number(pos.menge) * Number(pos.preis)) || 0,
      istAUB: pos.istAUB || false,
      bewilligt: false
    }));

    console.log('Erbrachte Positionen:', rechnungPositionen.filter((p: RechnungsPosition) => !p.istAUB && p.menge > 0).map((p: RechnungsPosition) => `${p.lkCode}: ${p.menge}`));

    // Nur nicht-AUB Positionen für Bewilligungsprüfung
    let positionen = rechnungPositionen.filter((p: RechnungsPosition) => !p.istAUB && p.menge > 0);

    console.log('\n--- VOR Sonderregeln ---');
    console.log(positionen.map((p: RechnungsPosition) => `${p.lkCode}: ${p.menge} (bewilligt: ${p.bewilligt})`));

    // SCHRITT 1: Sonderregeln anwenden
    positionen = wendeSonderregelnAn(positionen, bewilligungData);

    console.log('\n--- NACH Sonderregeln ---');
    console.log(positionen.map((p: RechnungsPosition) => `${p.lkCode}: ${p.menge} (bewilligt: ${p.bewilligt})`));

    // SCHRITT 2: Bewilligungsprüfung und Mengenkürzung
    positionen = positionen.map((pos: RechnungsPosition) => {
      const bewilligteLK = bewilligungData.find((b: any) => b.lkCode.toUpperCase() === pos.lkCode.toUpperCase());

      if (!bewilligteLK) {
        // Nicht bewilligt → Menge auf 0
        return { ...pos, menge: 0, gesamt: 0, bewilligt: false };
      }

      // Bereits durch Sonderregel bewilligt?
      if (pos.bewilligt) {
        return pos;
      }

      // Normale Bewilligungsprüfung
      const maxMenge = bewilligteLK.menge || (bewilligteLK.jeWoche * 4.33);

      if (pos.menge <= maxMenge) {
        return { ...pos, bewilligt: true };
      } else {
        // Menge kürzen
        return {
          ...pos,
          menge: maxMenge,
          gesamt: maxMenge * pos.preis,
          bewilligt: true,
          gekuerztVon: pos.menge
        };
      }
    });

    // SCHRITT 3: Nur bewilligte Positionen mit Menge > 0
    const bewilligtePositionen = positionen.filter((p: RechnungsPosition) => p.bewilligt && p.menge > 0);

    // AUB Positionen hinzufügen
    const aubPositionen = rechnungPositionen.filter((p: RechnungsPosition) => p.istAUB && p.menge > 0);

    const allePositionen = [...bewilligtePositionen, ...aubPositionen];

    const zwischensumme = allePositionen.reduce((sum: number, pos: RechnungsPosition) => sum + pos.gesamt, 0);
    const zinv = zwischensumme * 0.0338; // 3.38%
    const gesamtbetrag = zwischensumme + zinv;

    // Berechne Pflegekasse-Anteil (nur bewilligte, ohne AUB)
    const pflegekassePositionen = bewilligtePositionen.filter((p: RechnungsPosition) => !p.istAUB);
    const pflegekasseSumme = pflegekassePositionen.reduce((sum: number, pos: RechnungsPosition) => sum + pos.gesamt, 0);

    const pflegekasse = pflegekasseSumme;
    const rechnungsbetrag = gesamtbetrag - pflegekasse;

    console.log('\n=== ERGEBNIS ===');
    console.log('Bewilligte Positionen:', bewilligtePositionen.map((p: RechnungsPosition) => `${p.lkCode}: ${p.menge}`));
    console.log('Zwischensumme:', zwischensumme.toFixed(2), '€');
    console.log('ZINV (3.38%):', zinv.toFixed(2), '€');
    console.log('Gesamtbetrag:', gesamtbetrag.toFixed(2), '€');
    console.log('./. Pflegekasse:', pflegekasse.toFixed(2), '€');
    console.log('Rechnungsbetrag BA:', rechnungsbetrag.toFixed(2), '€');

    return {
      positionen: allePositionen,
      zwischensumme,
      zinv,
      gesamtbetrag,
      pflegekasse,
      rechnungsbetrag
    };
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Hero />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        {/* Admin Upload */}
        <AdminBewilligungStorage />

        {/* Klienten-Auswahl */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Klient auswählen
          </h2>

          <KlientenDropdown
            onSelect={(klient) => {
              setSelectedKlient(klient)
              // Automatisch die erste Bewilligung laden
              if (klient.bewilligungen && klient.bewilligungen.length > 0) {
                setBewilligung(klient.bewilligungen[0])
              }
              console.log('Klient ausgewählt:', klient)
            }}
            onNewKlient={() => {
              console.log('Neuen Klient anlegen')
              // TODO: Modal zum Anlegen eines neuen Klienten
            }}
          />

          {/* Bewilligungs-Info */}
          {selectedKlient && bewilligung && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-green-600 text-xl">✅</div>
                <div className="flex-1">
                  <p className="font-medium text-green-900 mb-1">
                    Aktive Bewilligung geladen
                  </p>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>
                      <span className="font-medium">Klient:</span>{' '}
                      {selectedKlient.name || `${selectedKlient.nachname}, ${selectedKlient.vorname}`}
                    </p>
                    <p>
                      <span className="font-medium">Gültig:</span>{' '}
                      {new Date(bewilligung.gueltig_von).toLocaleDateString('de-DE')}
                      {' bis '}
                      {new Date(bewilligung.gueltig_bis).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PDF Upload */}
        <PDFUpload
          type="rechnung"
          onDataExtracted={(data) => {
            setInvoiceData(data)
            console.log('Rechnung analysiert:', data)
          }}
        />

        {/* Korrekturrechnung */}
        {invoiceData && selectedKlient && bewilligung && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Korrekturrechnung
            </h2>

            <InvoicePDF
              data={(() => {
                // Berechne Korrekturrechnung mit allen Sonderregeln
                const korrektur = berechneKorrekturrechnung();

                if (!korrektur) {
                  return null;
                }

                return {
                  ...invoiceData,
                  klient: {
                    name: selectedKlient.name,
                    adresse: selectedKlient.adresse,
                    pflegegrad: selectedKlient.pflegegrad,
                  },
                  dienst: bewilligung.pflegedienst,
                  rechnungsDatum: new Date().toLocaleDateString('de-DE'),
                  rechnungsnummer: `RG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
                  debitor: selectedKlient.id,
                  ik: bewilligung.pflegedienst.ik,
                  zeitraumVon: invoiceData.abrechnungszeitraumVon || bewilligung.gueltig_von,
                  zeitraumBis: invoiceData.abrechnungszeitraumBis || bewilligung.gueltig_bis,
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

        {invoiceData && (!selectedKlient || !bewilligung) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <p className="text-yellow-800">
              ⚠️ Bitte wähle zuerst einen Klienten aus, bevor du eine Rechnung hochlädst.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Workflow:</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Klient auswählen → Bewilligung wird automatisch aus CSV geladen</li>
            <li>Rechnung (PDF) hochladen → Claude analysiert via OCR</li>
            <li>Korrekturrechnung wird gemäß Bewilligung erstellt</li>
            <li>PDF herunterladen und verwenden</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
