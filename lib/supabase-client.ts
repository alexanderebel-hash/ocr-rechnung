import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gdjqnlvkfgsfaybhnncj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

if (!supabaseKey) {
  console.warn('⚠️ NEXT_PUBLIC_SUPABASE_KEY is not configured');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================
// DATABASE TYPES
// =====================================================

export interface DbPflegedienst {
  id: string;
  name: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  web?: string;
  ik_nummer: string;
  hrb?: string;
  bank_name?: string;
  iban?: string;
  bic?: string;
}

export interface DbLeistungskomplex {
  id: string;
  lk_code: string;
  bezeichnung: string;
  einzelpreis: number;
  einheit: string;
  kategorie?: string;
}

export interface DbKlient {
  id: string;
  name: string;
  vorname?: string;
  versichertennummer?: string;
  pflegegrad: number;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
}

export interface DbBezirksamt {
  id: string;
  name: string;
  standort?: string;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
}

export interface DbPflegekasse {
  id: string;
  name: string;
  ikz?: string;
  typ?: 'gesetzlich' | 'privat';
}

export interface DbBewilligung {
  id: string;
  bewilligungs_id?: string;
  klienten_id: string;
  bezirksamt_id?: string;
  pflegekasse_id?: string;
  genehmigungsnummer?: string;
  zeitraum_von: string;
  zeitraum_bis: string;
  leistungsgrundlage?: string;
  pflegekasse_budget?: number;
  zinv_prozentsatz: number;
  zinv_berechnungsmodus: 'ba' | 'privat';
  status: 'aktiv' | 'abgelaufen' | 'gekündigt';
}

export interface DbBewilligteLeistung {
  id: string;
  bewilligungs_id: string;
  lk_code: string;
  genehmigt_pro_woche?: number;
  genehmigt_pro_monat?: number;
  bemerkung?: string;
}

// =====================================================
// COMBINED TYPES FOR APP USE
// =====================================================

export interface KlientMitBewilligungen {
  id: string;
  name: string;
  vorname?: string;
  pflegegrad: number;
  adresse: string;
  pflegedienst: string;
  standort: string;
  stadtteil: string;
  pflegedienst_adresse: string;
  bewilligungen: Array<{
    id: string;
    gueltig_von: string;
    gueltig_bis: string;
    status: string;
    leistungen: Array<{
      lkCode: string;
      menge: number;
    }>;
    pflegedienst: {
      name: string;
      standort: string;
      adresse: string;
      telefon: string;
      email: string;
      ik: string;
    };
  }>;
}

// =====================================================
// DATABASE ACCESS FUNCTIONS
// =====================================================

/**
 * Get all clients with their authorizations and services
 */
export async function getAllKlienten(): Promise<KlientMitBewilligungen[]> {
  try {
    console.log('🔄 Loading clients from Supabase...');
    console.log('📡 Supabase URL:', supabaseUrl);
    console.log('🔑 Supabase Key configured:', !!supabaseKey);

    // Fetch all clients
    const { data: klienten, error: klientenError } = await supabase
      .from('klienten')
      .select('*')
      .order('name');

    if (klientenError) {
      console.error('❌ Klienten Error:', klientenError);
      throw klientenError;
    }

    if (!klienten || klienten.length === 0) {
      console.log('⚠️ No clients found in database');
      return [];
    }

    // Fetch all authorizations
    const { data: bewilligungen, error: bewilligungenError } = await supabase
      .from('bewilligungen')
      .select('*');

    if (bewilligungenError) throw bewilligungenError;

    // Fetch all authorized services
    const { data: bewilligteLeistungen, error: leistungenError } = await supabase
      .from('bewilligte_leistungen')
      .select('*');

    if (leistungenError) throw leistungenError;

    // Get default Pflegedienst (DomusVita)
    const { data: pflegedienst } = await supabase
      .from('pflegedienst')
      .select('*')
      .eq('ik_nummer', '461104096')
      .single();

    const defaultPflegedienst = pflegedienst || {
      name: 'DomusVita Gesundheit GmbH',
      strasse: 'Waldemarstr.',
      hausnummer: '12',
      plz: '10999',
      ort: 'Berlin',
      telefon: '030/6120152-0',
      email: 'kreuzberg@domusvita.de',
      ik_nummer: '461104096',
    };

    // Combine data into expected format
    const result: KlientMitBewilligungen[] = klienten.map((klient) => {
      const klientBewilligungen = (bewilligungen || [])
        .filter((b) => b.klienten_id === klient.id)
        .map((bewilligung) => {
          // Get services for this authorization
          const leistungen = (bewilligteLeistungen || [])
            .filter((l) => l.bewilligungs_id === bewilligung.bewilligungs_id)
            .map((l) => ({
              lkCode: l.lk_code,
              menge: l.genehmigt_pro_monat || (l.genehmigt_pro_woche ? l.genehmigt_pro_woche * 4.33 : 0),
            }));

          return {
            id: bewilligung.id,
            gueltig_von: bewilligung.zeitraum_von,
            gueltig_bis: bewilligung.zeitraum_bis,
            status: bewilligung.status,
            leistungen,
            pflegedienst: {
              name: defaultPflegedienst.name,
              standort: 'Kreuzberg',
              adresse: `${defaultPflegedienst.strasse} ${defaultPflegedienst.hausnummer}, ${defaultPflegedienst.plz} ${defaultPflegedienst.ort}`,
              telefon: defaultPflegedienst.telefon,
              email: defaultPflegedienst.email,
              ik: defaultPflegedienst.ik_nummer,
            },
          };
        });

      // Build address string
      const adressParts = [
        klient.strasse && klient.hausnummer ? `${klient.strasse} ${klient.hausnummer}` : null,
        klient.plz && klient.ort ? `${klient.plz} ${klient.ort}` : null,
      ].filter(Boolean);

      return {
        id: klient.id,
        name: klient.vorname ? `${klient.name}, ${klient.vorname}` : klient.name,
        vorname: klient.vorname,
        pflegegrad: klient.pflegegrad,
        adresse: adressParts.join(', ') || 'Berlin',
        pflegedienst: defaultPflegedienst.name,
        standort: 'Kreuzberg',
        stadtteil: 'Kreuzberg / Sievos',
        pflegedienst_adresse: `${defaultPflegedienst.strasse} ${defaultPflegedienst.hausnummer}, ${defaultPflegedienst.plz} ${defaultPflegedienst.ort}`,
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

/**
 * Get a single client by ID
 */
export async function getKlientById(id: string): Promise<DbKlient | null> {
  try {
    const { data, error } = await supabase
      .from('klienten')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error loading client:', error);
    return null;
  }
}

/**
 * Get all LK codes with prices
 */
export async function getAllLeistungskomplexe(): Promise<DbLeistungskomplex[]> {
  try {
    const { data, error } = await supabase
      .from('leistungskomplexe')
      .select('*')
      .order('lk_code');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error loading LK codes:', error);
    return [];
  }
}

/**
 * Get Pflegedienst info by IK number
 */
export async function getPflegedienstByIK(ik_nummer: string): Promise<DbPflegedienst | null> {
  try {
    const { data, error } = await supabase
      .from('pflegedienst')
      .select('*')
      .eq('ik_nummer', ik_nummer)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error loading Pflegedienst:', error);
    return null;
  }
}

/**
 * Get authorizations for a client
 */
export async function getBewilligungenForKlient(klienten_id: string): Promise<DbBewilligung[]> {
  try {
    const { data, error } = await supabase
      .from('bewilligungen')
      .select('*')
      .eq('klienten_id', klienten_id)
      .order('zeitraum_von', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error loading authorizations:', error);
    return [];
  }
}

/**
 * Get authorized services for an authorization
 */
export async function getBewilligteLeistungen(bewilligungs_id: string): Promise<DbBewilligteLeistung[]> {
  try {
    const { data, error } = await supabase
      .from('bewilligte_leistungen')
      .select('*')
      .eq('bewilligungs_id', bewilligungs_id);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error loading authorized services:', error);
    return [];
  }
}
