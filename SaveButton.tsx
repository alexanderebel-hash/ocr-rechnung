/**
 * Komponente zum Speichern von Korrekturrechnungen
 * Generiert PDF und speichert in Supabase
 */

'use client'

import { useState } from 'react'
import { saveKorrekturrechnung, uploadPDF, type Client, type Bewilligung } from '@/lib/supabase'

interface SaveButtonProps {
  client: Client | null
  bewilligung: Bewilligung | null
  rechnungsdaten: any // Die korrigierten Rechnungsdaten
  pdfBlob?: Blob // Optional: Falls du schon ein PDF-Blob hast
  onSaved?: (rechnungId: string) => void
}

export default function SaveButton({
  client,
  bewilligung,
  rechnungsdaten,
  pdfBlob,
  onSaved
}: SaveButtonProps) {
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!client) {
      alert('❌ Kein Klient ausgewählt!')
      return
    }

    if (!rechnungsdaten) {
      alert('❌ Keine Rechnungsdaten vorhanden!')
      return
    }

    try {
      setSaving(true)

      // 1. PDF generieren (falls noch nicht vorhanden)
      let pdf = pdfBlob
      if (!pdf) {
        // Hier würdest du deine PDF-Generierung aufrufen
        // z.B. mit jsPDF oder html2pdf
        alert('⚠️ PDF-Generierung muss noch implementiert werden')
        return
      }

      // 2. Dateinamen generieren
      const datum = new Date()
      const monat = String(datum.getMonth() + 1).padStart(2, '0')
      const jahr = datum.getFullYear()
      const filename = `${client.nachname}_${jahr}-${monat}_korrektur.pdf`
      const storagePath = `${jahr}/${monat}/${filename}`

      // 3. PDF hochladen
      const file = new File([pdf], filename, { type: 'application/pdf' })
      const uploadResult = await uploadPDF(file, storagePath)

      if (!uploadResult) {
        throw new Error('PDF-Upload fehlgeschlagen')
      }

      // 4. Metadaten in Datenbank speichern
      const rechnung = await saveKorrekturrechnung({
        client_id: client.id,
        bewilligung_id: bewilligung?.id || null,
        rechnungsnummer: rechnungsdaten.rechnungsnummer || null,
        rechnungsdatum: rechnungsdaten.rechnungsdatum || new Date().toISOString().split('T')[0],
        leistungszeitraum_von: rechnungsdaten.leistungszeitraum_von || null,
        leistungszeitraum_bis: rechnungsdaten.leistungszeitraum_bis || null,
        nettobetrag: rechnungsdaten.nettobetrag || null,
        bruttobetrag: rechnungsdaten.bruttobetrag || null,
        zinv_betrag: rechnungsdaten.zinv_betrag || null,
        pflegekasse_betrag: rechnungsdaten.pflegekasse_betrag || null,
        pdf_url: uploadResult.url,
        pdf_filename: filename,
        json_data: rechnungsdaten,
        status: 'erstellt',
        notizen: null
      })

      if (!rechnung) {
        throw new Error('Speichern in Datenbank fehlgeschlagen')
      }

      // 5. Erfolg!
      alert('✅ Korrekturrechnung erfolgreich gespeichert!')
      
      if (onSaved) {
        onSaved(rechnung.id)
      }

    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      alert('❌ Fehler beim Speichern: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const isDisabled = !client || !rechnungsdaten || saving

  return (
    <button
      onClick={handleSave}
      disabled={isDisabled}
      className={`
        px-6 py-3 rounded-lg font-medium text-white
        ${isDisabled 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-green-600 hover:bg-green-700 active:scale-95'
        }
        transition-all duration-200
        flex items-center gap-2
      `}
    >
      {saving ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Speichere...
        </>
      ) : (
        <>
          💾 Rechnung speichern
        </>
      )}
    </button>
  )
}
