'use client'

import { useState } from 'react'
import Hero from '@/components/Hero'
import { KlientenDropdown } from '@/components/KlientenDropdown'
import PDFUpload from '@/components/PDFUpload'
import { InvoicePDF } from '@/components/InvoicePDF'
// NEU: Supabase Komponenten für Archiv und Speichern
import SaveButton from '@/components/SaveButton'
import RechnungArchiv from '@/components/RechnungArchiv'
import { type Client, type Bewilligung } from '@/lib/supabase'

export default function Home() {
  const [selectedKlient, setSelectedKlient] = useState<any>(null)
  const [bewilligung, setBewilligung] = useState<any>(null)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [showArchive, setShowArchive] = useState(false)

  // Konvertiere selectedKlient zu Client Type für die neuen Komponenten
  const clientForSupabase: Client | null = selectedKlient ? {
    id: selectedKlient.id,
    // Split name into vorname and nachname if needed
    vorname: selectedKlient.vorname || selectedKlient.name?.split(' ')[0] || '',
    nachname: selectedKlient.nachname || selectedKlient.name?.split(' ').slice(1).join(' ') || '',
    versichertennummer: selectedKlient.versichertennummer || '',
    pflegegrad: selectedKlient.pflegegrad,
    bezirksamt: selectedKlient.bezirksamt || selectedKlient.stadtteil || '',
    ik_nummer: selectedKlient.ik_nummer || '461104096',
    created_at: selectedKlient.created_at || new Date().toISOString(),
    updated_at: selectedKlient.updated_at || new Date().toISOString()
  } : null

  const bewilligungForSupabase: Bewilligung | null = bewilligung ? {
    id: bewilligung.id,
    client_id: bewilligung.client_id || selectedKlient?.id || '',
    genehmigungsnummer: bewilligung.genehmigungsnummer || '',
    gueltig_von: bewilligung.gueltig_von,
    gueltig_bis: bewilligung.gueltig_bis,
    bezirksamt: bewilligung.bezirksamt || selectedKlient?.stadtteil || '',
    leistungen: bewilligung.leistungen || [],
    notizen: bewilligung.notizen,
    created_at: bewilligung.created_at || new Date().toISOString(),
    updated_at: bewilligung.updated_at || new Date().toISOString()
  } : null

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Hero />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Klienten-Auswahl + Archiv Button */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Klient auswählen
            </h2>
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="px-4 py-2 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors font-medium"
            >
              {showArchive ? '📄 Zurück zur Korrektur' : '📚 Archiv anzeigen'}
            </button>
          </div>

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

        {/* Archiv ODER Upload/Korrektur */}
        {showArchive ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📚 Gespeicherte Korrekturrechnungen
            </h2>
            <RechnungArchiv client={clientForSupabase} />
          </div>
        ) : (
          <>
            {/* PDF Upload */}
            <PDFUpload
              selectedKlient={selectedKlient}
              bewilligung={bewilligung}
              onInvoiceDataGenerated={(data) => {
                setInvoiceData(data)
                console.log('Rechnung analysiert:', data)
              }}
            />

            {/* Korrekturrechnung + Speichern Button */}
            {invoiceData && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Korrekturrechnung
                  </h2>
                  
                  {/* NEU: Speichern Button */}
                  <SaveButton
                    client={clientForSupabase}
                    bewilligung={bewilligungForSupabase}
                    rechnungsdaten={invoiceData}
                    onSaved={(rechnungId) => {
                      console.log('✅ Rechnung gespeichert:', rechnungId)
                      alert('✅ Rechnung erfolgreich in der Datenbank gespeichert!')
                      // Zum Archiv wechseln
                      setShowArchive(true)
                    }}
                  />
                </div>
                
                <InvoicePDF data={invoiceData} />
              </div>
            )}
          </>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Workflow:</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Klient auswählen → Bewilligung wird automatisch geladen</li>
            <li>Rechnung (PDF) hochladen → Claude analysiert via OCR</li>
            <li>Korrekturrechnung wird gemäß Bewilligung erstellt</li>
            <li><strong>NEU:</strong> Klicke "Rechnung speichern" → PDF + Daten in Supabase</li>
            <li><strong>NEU:</strong> Alle Rechnungen im Archiv abrufbar</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
