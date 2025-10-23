'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Client } from '@/lib/supabase'

interface RechnungArchivProps {
  client: Client | null
}

interface ArchivedRechnung {
  id: string
  rechnungsnummer: string
  rechnungsdatum: string
  leistungszeitraum_von: string
  leistungszeitraum_bis: string
  gesamt_betrag: number
  status: string
  created_at: string
  rechnungsdaten: any
}

export default function RechnungArchiv({ client }: RechnungArchivProps) {
  const [rechnungen, setRechnungen] = useState<ArchivedRechnung[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRechnung, setSelectedRechnung] = useState<ArchivedRechnung | null>(null)

  useEffect(() => {
    if (client) {
      loadRechnungen()
    } else {
      setRechnungen([])
    }
  }, [client])

  const loadRechnungen = async () => {
    if (!client) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('rechnungen')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setRechnungen(data || [])
    } catch (err: any) {
      console.error('❌ Fehler beim Laden der Rechnungen:', err)
      setError(err.message || 'Fehler beim Laden der Rechnungen')
    } finally {
      setLoading(false)
    }
  }

  if (!client) {
    return (
      <div className="text-center py-12 text-gray-500">
        ℹ️ Bitte wählen Sie zuerst einen Klienten aus
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Lade Rechnungen...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        ❌ {error}
      </div>
    )
  }

  if (rechnungen.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-4xl mb-4">📭</div>
        <p className="text-gray-600 font-medium">Noch keine Rechnungen gespeichert</p>
        <p className="text-sm text-gray-500 mt-2">
          Für {client.vorname} {client.nachname} wurden noch keine Rechnungen archiviert.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Rechnungsliste */}
      <div className="grid gap-4">
        {rechnungen.map((rechnung) => (
          <div
            key={rechnung.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedRechnung(rechnung)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {rechnung.rechnungsnummer}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rechnung.status === 'gespeichert'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {rechnung.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Rechnungsdatum:</span>{' '}
                    {new Date(rechnung.rechnungsdatum).toLocaleDateString('de-DE')}
                  </div>
                  <div>
                    <span className="font-medium">Leistungszeitraum:</span>{' '}
                    {new Date(rechnung.leistungszeitraum_von).toLocaleDateString('de-DE')} - {' '}
                    {new Date(rechnung.leistungszeitraum_bis).toLocaleDateString('de-DE')}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Gesamtbetrag:</span>{' '}
                    <span className="text-lg font-bold text-indigo-600">
                      {rechnung.gesamt_betrag.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-2xl">📄</div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail-Ansicht (Modal) */}
      {selectedRechnung && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRechnung(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedRechnung.rechnungsnummer}
              </h2>
              <button
                onClick={() => setSelectedRechnung(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Grunddaten */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Rechnungsdatum:</span>
                  <p className="text-gray-900">
                    {new Date(selectedRechnung.rechnungsdatum).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Leistungszeitraum:</span>
                  <p className="text-gray-900">
                    {new Date(selectedRechnung.leistungszeitraum_von).toLocaleDateString('de-DE')} -{' '}
                    {new Date(selectedRechnung.leistungszeitraum_bis).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>

              {/* Rechnungsdaten (JSONB) */}
              {selectedRechnung.rechnungsdaten && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Rechnungsdetails</h3>
                  <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedRechnung.rechnungsdaten, null, 2)}
                  </pre>
                </div>
              )}

              {/* Gesamtbetrag */}
              <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-900">Gesamtbetrag:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {selectedRechnung.gesamt_betrag.toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
