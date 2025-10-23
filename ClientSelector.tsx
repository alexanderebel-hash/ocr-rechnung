/**
 * Klienten-Auswahl Komponente
 * Dropdown zum Auswählen von Klienten mit automatischem Laden der Bewilligung
 */

'use client'

import { useState, useEffect } from 'react'
import { getAllClients, getActiveBewilligung, type Client, type Bewilligung } from '@/lib/supabase'

interface ClientSelectorProps {
  onClientSelect: (client: Client, bewilligung: Bewilligung | null) => void
  selectedClientId?: string
}

export default function ClientSelector({ onClientSelect, selectedClientId }: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<string>(selectedClientId || '')

  // Klienten beim Mount laden
  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      const data = await getAllClients()
      setClients(data)
    } catch (error) {
      console.error('Fehler beim Laden der Klienten:', error)
      alert('Fehler beim Laden der Klienten')
    } finally {
      setLoading(false)
    }
  }

  const handleClientChange = async (clientId: string) => {
    setSelectedClient(clientId)

    if (!clientId) {
      onClientSelect(null as any, null)
      return
    }

    // Klient laden
    const client = clients.find(c => c.id === clientId)
    if (!client) return

    // Aktive Bewilligung laden
    try {
      const bewilligung = await getActiveBewilligung(clientId)
      onClientSelect(client, bewilligung)

      if (!bewilligung) {
        alert('⚠️ Keine aktive Bewilligung für diesen Klienten gefunden!')
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bewilligung:', error)
      onClientSelect(client, null)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label htmlFor="client-select" className="block text-sm font-medium text-gray-700">
        Klient auswählen
      </label>
      
      <select
        id="client-select"
        value={selectedClient}
        onChange={(e) => handleClientChange(e.target.value)}
        className="block w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        <option value="">-- Bitte wählen --</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.nachname}, {client.vorname} 
            {client.pflegegrad && ` (PG ${client.pflegegrad})`}
            {client.versichertennummer && ` • ${client.versichertennummer}`}
          </option>
        ))}
      </select>

      {clients.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">
          Keine Klienten gefunden. Lege zuerst einen Klienten an.
        </p>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={loadClients}
          className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          🔄 Aktualisieren
        </button>
      </div>
    </div>
  )
}
