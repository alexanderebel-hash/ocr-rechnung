/**
 * Supabase Client für DomusVita Pflegeabrechnung
 * 
 * Installation:
 * npm install @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js'

// Supabase Credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkipppgvcsucrdzjedwo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraXBwcGd2Y3N1Y3JkemplZHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTQ3MDIsImV4cCI6MjA3Njc3MDcwMn0.R1PvND9HHQTSWIq3Z9xY_GTmmSV2W6iS1W_IwFMFlm0'

// Supabase Client erstellen
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// TYPESCRIPT TYPES
// ============================================

export interface Client {
  id: string
  vorname: string
  nachname: string
  versichertennummer: string | null
  pflegegrad: number | null
  bezirksamt: string | null
  ik_nummer: string
  created_at: string
  updated_at: string
}

export interface Bewilligung {
  id: string
  client_id: string
  genehmigungsnummer: string | null
  gueltig_von: string
  gueltig_bis: string
  bezirksamt: string | null
  leistungen: BewilligteLeistung[]
  notizen: string | null
  created_at: string
  updated_at: string
}

export interface BewilligteLeistung {
  lk_code: string
  je_woche: number | null
  je_monat: number | null
  genehmigt: boolean
}

export interface Leistungskomplex {
  lk_code: string
  bezeichnung: string
  preis_pro_einheit: number
  aub_preis: number
  kategorie: string | null
  aktiv: boolean
  gueltig_ab: string
}

export interface Korrekturrechnung {
  id: string
  client_id: string
  bewilligung_id: string | null
  rechnungsnummer: string | null
  rechnungsdatum: string | null
  leistungszeitraum_von: string | null
  leistungszeitraum_bis: string | null
  nettobetrag: number | null
  bruttobetrag: number | null
  zinv_betrag: number | null
  pflegekasse_betrag: number | null
  pdf_url: string | null
  pdf_filename: string | null
  json_data: any
  status: 'erstellt' | 'versendet' | 'bezahlt' | 'storniert'
  notizen: string | null
  created_at: string
  updated_at: string
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Alle Klienten laden
 */
export async function getAllClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('nachname', { ascending: true })

  if (error) {
    console.error('Fehler beim Laden der Klienten:', error)
    throw error
  }

  return data || []
}

/**
 * Klient nach ID laden
 */
export async function getClientById(clientId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error) {
    console.error('Fehler beim Laden des Klienten:', error)
    return null
  }

  return data
}

/**
 * Aktive Bewilligung für Klient finden
 */
export async function getActiveBewilligung(
  clientId: string,
  datum: Date = new Date()
): Promise<Bewilligung | null> {
  const dateString = datum.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('bewilligungen')
    .select('*')
    .eq('client_id', clientId)
    .lte('gueltig_von', dateString)
    .gte('gueltig_bis', dateString)
    .order('gueltig_von', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Fehler beim Laden der Bewilligung:', error)
    return null
  }

  return data
}

/**
 * Alle Bewilligungen für Klient laden
 */
export async function getAllBewilligungen(clientId: string): Promise<Bewilligung[]> {
  const { data, error } = await supabase
    .from('bewilligungen')
    .select('*')
    .eq('client_id', clientId)
    .order('gueltig_von', { ascending: false })

  if (error) {
    console.error('Fehler beim Laden der Bewilligungen:', error)
    throw error
  }

  return data || []
}

/**
 * Alle Leistungskomplexe laden
 */
export async function getAllLeistungskomplexe(): Promise<Leistungskomplex[]> {
  const { data, error } = await supabase
    .from('leistungskomplexe')
    .select('*')
    .eq('aktiv', true)
    .order('lk_code', { ascending: true })

  if (error) {
    console.error('Fehler beim Laden der Leistungskomplexe:', error)
    throw error
  }

  return data || []
}

/**
 * Korrekturrechnung speichern
 */
export async function saveKorrekturrechnung(
  rechnung: Omit<Korrekturrechnung, 'id' | 'created_at' | 'updated_at'>
): Promise<Korrekturrechnung | null> {
  const { data, error } = await supabase
    .from('korrekturrechnungen')
    .insert(rechnung)
    .select()
    .single()

  if (error) {
    console.error('Fehler beim Speichern der Korrekturrechnung:', error)
    throw error
  }

  return data
}

/**
 * PDF in Storage hochladen
 */
export async function uploadPDF(
  file: File,
  path: string
): Promise<{ path: string; url: string } | null> {
  const { data, error } = await supabase.storage
    .from('korrekturrechnungen')
    .upload(path, file, {
      contentType: 'application/pdf',
      upsert: false
    })

  if (error) {
    console.error('Fehler beim Upload des PDFs:', error)
    throw error
  }

  // Public URL generieren
  const { data: urlData } = supabase.storage
    .from('korrekturrechnungen')
    .getPublicUrl(data.path)

  return {
    path: data.path,
    url: urlData.publicUrl
  }
}

/**
 * Alle Korrekturrechnungen für Klient laden
 */
export async function getKorrekturrechnungen(
  clientId: string
): Promise<Korrekturrechnung[]> {
  const { data, error } = await supabase
    .from('korrekturrechnungen')
    .select('*')
    .eq('client_id', clientId)
    .order('rechnungsdatum', { ascending: false })

  if (error) {
    console.error('Fehler beim Laden der Korrekturrechnungen:', error)
    throw error
  }

  return data || []
}

/**
 * Neuen Klient anlegen
 */
export async function createClient(
  client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'ik_nummer'>
): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single()

  if (error) {
    console.error('Fehler beim Anlegen des Klienten:', error)
    throw error
  }

  return data
}

/**
 * Bewilligung anlegen
 */
export async function createBewilligung(
  bewilligung: Omit<Bewilligung, 'id' | 'created_at' | 'updated_at'>
): Promise<Bewilligung | null> {
  const { data, error } = await supabase
    .from('bewilligungen')
    .insert(bewilligung)
    .select()
    .single()

  if (error) {
    console.error('Fehler beim Anlegen der Bewilligung:', error)
    throw error
  }

  return data
}
