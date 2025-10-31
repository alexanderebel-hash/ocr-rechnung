'use client'

import { useState } from 'react'
import Hero from '@/components/Hero'
import PDFUpload from '@/components/PDFUpload'
import BewilligungDropdown from '@/components/BewilligungDropdown'
import RechnungsVorschau from '@/components/RechnungsVorschau'

export default function Home() {
  const [bewilligung, setBewilligung] = useState<any>(null)
  const [bewilligungConfirmed, setBewilligungConfirmed] = useState(false)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false)

  // Berechne Korrekturrechnung mit neuer Billing Engine
  const berechneKorrekturrechnung = () => {
    console.warn('Korrekturrechnung derzeit deaktiviert');
    return null;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Hero />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        {/* Bewilligung Dropdown mit Vorschau und Bearbeitung */}
        <BewilligungDropdown
          onLoaded={(approval) => {
            console.log('✅ Bewilligung geladen:', approval);
            setBewilligung(approval);
            setBewilligungConfirmed(true);
            setInvoiceData(null);
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
                    <span className="font-medium">Klient-ID:</span>{' '}
                    {bewilligung.klientId ?? 'unbekannt'}
                  </p>
                  <p>
                    <span className="font-medium">Zeitraum:</span>{' '}
                    {bewilligung.period ?? '—'}
                  </p>
                  <p>
                    <span className="font-medium">Leistungen:</span>{' '}
                    {bewilligung.lks.length}
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

        {/* Korrekturrechnung vorübergehend deaktiviert */}
        {invoiceData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Korrekturrechnung
            </h2>
            <p className="text-sm text-gray-600">
              Die automatische Korrekturrechnung wird aktuell überarbeitet und ist vorübergehend deaktiviert.
            </p>
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
