/**
 * Archiv-Ansicht für gespeicherte Korrekturrechnungen
 * Zeigt alle Rechnungen eines Klienten mit Download-Links
 */

'use client'

import { useState, useEffect } from 'react'
import { getKorrekturrechnungen, type Korrekturrechnung, type Client } from '@/lib/supabase'

interface RechnungArchivProps {
  client: Client | null
}

export default function RechnungArchiv({ client }: RechnungArchivProps) {
  const [rechnungen, setRechnungen] = useState<Korrekturrechnung[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (client) {
      loadRechnungen()
    } else {
      setRechnungen([])
    }
  }, [client?.id])

  const loadRechnungen = async () => {
    if (!client) return

    try {
      setLoading(true)
      const data = await getKorrekturrechnungen(client.id)
      setRechnungen(data)
    } catch (error) {
      console.error('Fehler beim Laden der Rechnungen:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      erstellt: { color: 'bg-blue-100 text-blue-800', label: 'Erstellt' },
      versendet: { color: 'bg-yellow-100 text-yellow-800', label: 'Versendet' },
      bezahlt: { color: 'bg-green-100 text-green-800', label: 'Bezahlt' },
      storniert: { color: 'bg-red-100 text-red-800', label: 'Storniert' }
    }
    const badge = badges[status as keyof typeof badges] || badges.erstellt
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  if (!client) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
        Wähle einen Klienten aus um das Archiv zu sehen
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (rechnungen.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500 mb-2">Noch keine Korrekturrechnungen gespeichert</p>
        <p className="text-sm text-gray-400">
          Erstelle und speichere eine Rechnung, dann erscheint sie hier
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Archiv: {client.nachname}, {client.vorname}
        </h3>
        <button
          onClick={loadRechnungen}
          className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          🔄 Aktualisieren
        </button>
      </div>

      <div className="space-y-3">
        {rechnungen.map((rechnung) => (
          <div
            key={rechnung.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium text-gray-900">
                    {rechnung.rechnungsnummer || 'Ohne Rechnungsnummer'}
                  </h4>
                  {getStatusBadge(rechnung.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                  <div>
                    <span className="text-gray-400">Datum:</span>{' '}
                    {formatDate(rechnung.rechnungsdatum)}
                  </div>
                  <div>
                    <span className="text-gray-400">Zeitraum:</span>{' '}
                    {formatDate(rechnung.leistungszeitraum_von)} - {formatDate(rechnung.leistungszeitraum_bis)}
                  </div>
                  <div>
                    <span className="text-gray-400">Betrag:</span>{' '}
                    <span className="font-medium text-gray-900">
                      {formatCurrency(rechnung.bruttobetrag)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Erstellt:</span>{' '}
                    {formatDate(rechnung.created_at)}
                  </div>
                </div>

                {rechnung.notizen && (
                  <div className="mt-2 text-sm text-gray-500 italic">
                    {rechnung.notizen}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {rechnung.pdf_url && (
                  <a
                    href={rechnung.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                  >
                    📄 PDF öffnen
                  </a>
                )}
                <button
                  onClick={() => {
                    // Hier könntest du Details anzeigen oder bearbeiten
                    console.log('Rechnung Details:', rechnung)
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 whitespace-nowrap"
                >
                  📋 Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
        <strong>{rechnungen.length}</strong> {rechnungen.length === 1 ? 'Rechnung' : 'Rechnungen'} gespeichert
      </div>
    </div>
  )
}
