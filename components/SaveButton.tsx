'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Client, Bewilligung } from '@/lib/supabase'

interface SaveButtonProps {
  client: Client | null
  bewilligung: Bewilligung | null
  rechnungsdaten: any
  onSaved?: (rechnungId: string) => void
}

export default function SaveButton({
  client,
  bewilligung,
  rechnungsdaten,
  onSaved
}: SaveButtonProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!client || !bewilligung || !rechnungsdaten) {
      setError('Fehlende Daten: Klient, Bewilligung oder Rechnungsdaten fehlen')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // 1. Speichere die Rechnung in der Datenbank
      const { data: rechnung, error: rechnungError } = await supabase
        .from('rechnungen')
        .insert([
          {
            client_id: client.id,
            bewilligung_id: bewilligung.id,
            rechnungsdatum: rechnungsdaten.rechnungsdatum || new Date().toISOString(),
            rechnungsnummer: rechnungsdaten.rechnungsnummer || `RN-${Date.now()}`,
            leistungszeitraum_von: rechnungsdaten.leistungszeitraum_von,
            leistungszeitraum_bis: rechnungsdaten.leistungszeitraum_bis,
            gesamt_betrag: rechnungsdaten.gesamtbetrag || 0,
            status: 'gespeichert',
            rechnungsdaten: rechnungsdaten, // Speichere die kompletten Daten als JSONB
          },
        ])
        .select()
        .single()

      if (rechnungError) throw rechnungError

      console.log('✅ Rechnung gespeichert:', rechnung)

      // 2. Optional: Speichere die einzelnen Leistungspositionen
      if (rechnungsdaten.leistungen && Array.isArray(rechnungsdaten.leistungen)) {
        const leistungspositions = rechnungsdaten.leistungen.map((leistung: any) => ({
          rechnung_id: rechnung.id,
          lk_code: leistung.lkCode || leistung.code,
          bezeichnung: leistung.bezeichnung || leistung.name,
          menge: leistung.menge || 0,
          einzelpreis: leistung.einzelpreis || 0,
          gesamtpreis: leistung.gesamtpreis || 0,
        }))

        const { error: leistungenError } = await supabase
          .from('leistungspositionen')
          .insert(leistungspositions)

        if (leistungenError) {
          console.warn('⚠️ Fehler beim Speichern der Leistungspositionen:', leistungenError)
        }
      }

      // Erfolg!
      if (onSaved) {
        onSaved(rechnung.id)
      }
    } catch (err: any) {
      console.error('❌ Fehler beim Speichern:', err)
      setError(err.message || 'Unbekannter Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSave}
        disabled={saving || !client || !bewilligung || !rechnungsdaten}
        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
          saving || !client || !bewilligung || !rechnungsdaten
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
        }`}
      >
        {saving ? '💾 Speichert...' : '💾 Rechnung speichern'}
      </button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
          ❌ {error}
        </div>
      )}
    </div>
  )
}
