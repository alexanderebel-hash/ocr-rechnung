'use client'

import { useState } from 'react'
import Hero from '@/components/Hero'
import { KlientenDropdown } from '@/components/KlientenDropdown'
import PDFUpload from '@/components/PDFUpload'
import { InvoicePDF } from '@/components/InvoicePDF'

export default function Home() {
  const [selectedKlient, setSelectedKlient] = useState<any>(null)
  const [bewilligung, setBewilligung] = useState<any>(null)
  const [invoiceData, setInvoiceData] = useState<any>(null)

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Hero />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
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
              data={{
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
                positionen: invoiceData.rechnungsPositionen || [],
                pflegekasse: invoiceData.gesamtbetrag || 0,
                zahlungsziel: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
              }}
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
