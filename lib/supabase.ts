import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gdjqnlvkfgsfaybhnncj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

if (!supabaseKey) {
  console.warn('⚠️ NEXT_PUBLIC_SUPABASE_KEY is not configured');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database Types
export interface DbKlient {
  id: string;
  name: string;
  pflegegrad: number;
  adresse: string;
  pflegedienst: string;
  standort: string;
  stadtteil: string;
  pflegedienst_adresse: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbBewilligung {
  id: string;
  klient_id: string;
  gueltig_von: string;
  gueltig_bis: string;
  status: string;
  pflegedienst_name: string;
  pflegedienst_standort: string;
  pflegedienst_adresse: string;
  pflegedienst_telefon: string;
  pflegedienst_email: string;
  pflegedienst_ik: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbLeistung {
  id: string;
  bewilligung_id: string;
  lk_code: string;
  menge: number;
  created_at?: string;
  updated_at?: string;
}

// Database Access Functions
export async function getAllKlienten(): Promise<any[]> {
  try {
    // Fetch all clients with their authorizations and services
    const { data: klienten, error: klientenError } = await supabase
      .from('klienten')
      .select('*')
      .order('name');

    if (klientenError) throw klientenError;

    if (!klienten || klienten.length === 0) {
      return [];
    }

    // Fetch all authorizations
    const { data: bewilligungen, error: bewilligungenError } = await supabase
      .from('bewilligungen')
      .select('*');

    if (bewilligungenError) throw bewilligungenError;

    // Fetch all services
    const { data: leistungen, error: leistungenError } = await supabase
      .from('leistungen')
      .select('*');

    if (leistungenError) throw leistungenError;

    // Combine data into expected format
    const result = klienten.map((klient) => {
      const klientBewilligungen = (bewilligungen || [])
        .filter((b) => b.klient_id === klient.id)
        .map((bewilligung) => ({
          id: bewilligung.id,
          gueltig_von: bewilligung.gueltig_von,
          gueltig_bis: bewilligung.gueltig_bis,
          status: bewilligung.status,
          leistungen: (leistungen || [])
            .filter((l) => l.bewilligung_id === bewilligung.id)
            .map((l) => ({
              lkCode: l.lk_code,
              menge: l.menge,
            })),
          pflegedienst: {
            name: bewilligung.pflegedienst_name,
            standort: bewilligung.pflegedienst_standort,
            adresse: bewilligung.pflegedienst_adresse,
            telefon: bewilligung.pflegedienst_telefon,
            email: bewilligung.pflegedienst_email,
            ik: bewilligung.pflegedienst_ik,
          },
        }));

      return {
        id: klient.id,
        name: klient.name,
        pflegegrad: klient.pflegegrad,
        adresse: klient.adresse,
        pflegedienst: klient.pflegedienst,
        standort: klient.standort,
        stadtteil: klient.stadtteil,
        pflegedienst_adresse: klient.pflegedienst_adresse,
        bewilligungen: klientBewilligungen,
      };
    });

    console.log(`✅ Loaded ${result.length} clients from Supabase`);
    return result;
  } catch (error) {
    console.error('❌ Error loading clients from Supabase:', error);
    return [];
  }
}

export async function getKlientById(id: string): Promise<any | null> {
  try {
    const { data: klient, error } = await supabase
      .from('klienten')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return klient;
  } catch (error) {
    console.error('❌ Error loading client:', error);
    return null;
  }
}

export async function createKlient(klient: Omit<DbKlient, 'id' | 'created_at' | 'updated_at'>): Promise<DbKlient | null> {
  try {
    const { data, error } = await supabase
      .from('klienten')
      .insert([klient])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error creating client:', error);
    return null;
  }
}

export async function createBewilligung(bewilligung: Omit<DbBewilligung, 'id' | 'created_at' | 'updated_at'>): Promise<DbBewilligung | null> {
  try {
    const { data, error } = await supabase
      .from('bewilligungen')
      .insert([bewilligung])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error creating authorization:', error);
    return null;
  }
}

export async function createLeistung(leistung: Omit<DbLeistung, 'id' | 'created_at' | 'updated_at'>): Promise<DbLeistung | null> {
  try {
    const { data, error } = await supabase
      .from('leistungen')
      .insert([leistung])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error creating service:', error);
    return null;
  }
}

// NEW: Types for the invoice correction system
export interface Client {
  id: string;
  vorname: string;
  nachname: string;
  versichertennummer: string;
  pflegegrad: number;
  bezirksamt: string;
  ik_nummer: string;
  created_at: string;
  updated_at: string;
}

export interface Bewilligung {
  id: string;
  client_id: string;
  genehmigungsnummer: string;
  gueltig_von: string;
  gueltig_bis: string;
  bezirksamt: string;
  leistungen: Array<{
    lkCode: string;
    menge: number;
  }>;
  notizen?: string;
  created_at: string;
  updated_at: string;
}
