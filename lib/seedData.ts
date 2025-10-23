import { parseExcelBewilligung, ParsedBewilligung } from './excelParser';
import { loadBewilligungForKlient, getAllKlientenNames } from './bewilligungLoader';

const bewilligungFiles = [
  'Bewilligung_Tschida_01_01_25-31_12_25.xlsx',
  'Bewilligung_Sweidan_01_04_25-31_10_25.xlsx',
  'Bewilligung_Sommermann_01_02_25-31_12_25.xlsx',
  'Bewilligung_Rudek_01_01_25-31_12_25.xlsx',
  'Bewilligung_Plu_mpe_01_12_24-30_11_25.xlsx',
  'Bewilligung_Nakoinz_01_04_25-31_03_226.xlsx',
  'Bewilligung_Mankowski_01_01_25-31_12_25.xlsx',
  'Bewilligung_Ko_pke_01_06_25-31_12_25.xlsx',
  'Bewilligung_Konjetzky_16_08_25-31_12_25.xlsx',
  'Bewilligung_Hensler_17_06_25-30_09_25.xlsx',
  'Bewilligung_Hennings_19_01_25-31_01_26.xlsx',
  'Bewilligung_Gullatz_02-12-2025.xlsx',
  'Bewilligung_Fialkowski_01_06_25-30_11_25.xlsx',
  'Bewilligung_Dreßler_01_04_25-31_03_26.xlsx',
  'Bewilligung_Budach_01_08_25-31_07_26.xlsx',
  'Bewilligung_Bollweber_01_01_25-31_12_25.xlsx',
  'Bewilligung_Block_16_05_25-30_04_26.xlsx',
  'Bewilligung_Alijevic_01_01_25-31_12_25.xlsx',
];

export interface Klient {
  id: string;
  name: string;
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
    leistungen: any[];
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

export async function loadAllKlienten(): Promise<Klient[]> {
  // Load from Excel files - this is our primary data source now
  try {
    console.log('🔄 Loading clients with Excel Bewilligungen...');
    const klientenWithExcel = await loadKlientenWithExcelBewilligungen();
    if (klientenWithExcel.length > 0) {
      console.log(`✅ Loaded ${klientenWithExcel.length} clients with Excel Bewilligungen`);
      return klientenWithExcel;
    }
  } catch (error) {
    console.error('❌ Error loading Excel Bewilligungen:', error);
  }

  // Fallback to static data if Excel fails
  console.log('⚠️ Using fallback static data');
  return fallbackKlienten;
}

async function loadKlientenWithExcelBewilligungen(): Promise<Klient[]> {
  const klientenWithBewilligungen: Klient[] = [];
  const klientenNames = getAllKlientenNames();

  for (const nachname of klientenNames) {
    try {
      const excelData = await loadBewilligungForKlient(nachname);

      if (excelData) {
        // Convert Excel data to Klient format
        const leistungen = excelData.leistungen.map((l: any) => ({
          lkCode: l.lk_code.toUpperCase(),
          menge: l.je_monat,
          jeWoche: l.je_woche,
          einzelpreis: l.einzelpreis
        }));

        klientenWithBewilligungen.push({
          id: generateId(),
          name: nachname,
          pflegegrad: excelData.klient.pflegegrad,
          adresse: excelData.klient.adresse,
          pflegedienst: 'DomusVita Gesundheit GmbH',
          standort: excelData.klient.standort || 'Kreuzberg',
          stadtteil: excelData.klient.stadtteil || 'Kreuzberg / Sievos',
          pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          bewilligungen: [
            {
              id: generateId(),
              gueltig_von: excelData.zeitraum.von,
              gueltig_bis: excelData.zeitraum.bis,
              status: 'aktiv',
              leistungen: leistungen,
              pflegedienst: {
                name: 'DomusVita Gesundheit GmbH',
                standort: 'Kreuzberg',
                adresse: 'Waldemarstraße 10 A, 10999 Berlin',
                telefon: '030/6120152-0',
                email: 'kreuzberg@domusvita.de',
                ik: '461104096',
              },
            },
          ],
        });
      }
    } catch (error) {
      console.error(`Error loading Excel for ${nachname}:`, error);
    }
  }

  return klientenWithBewilligungen;
}

async function loadKlientenFromExcelOrFallback(): Promise<Klient[]> {
  const klienten: Klient[] = [];

  for (const file of bewilligungFiles) {
    try {
      const data = await parseExcelBewilligung(`/bewilligungen/${file}`);

      // Extract name from filename if not in Excel
      const nameFromFile = file
        .replace('Bewilligung_', '')
        .replace(/_\d{2}_\d{2}_\d{2}.*\.xlsx$/, '')
        .replace(/_/g, ' ')
        .replace('Plu mpe', 'Plümpe')
        .replace('Ko pke', 'Köpke')
        .replace('Dreßler', 'Dreßler');

      klienten.push({
        id: generateId(),
        name: data.klient.name || nameFromFile,
        pflegegrad: data.klient.pflegegrad,
        adresse: data.klient.adresse,
        pflegedienst: 'DomusVita Gesundheit GmbH',
        standort: 'Kreuzberg',
        stadtteil: 'Kreuzberg / Sievos',
        pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
        bewilligungen: [
          {
            id: generateId(),
            gueltig_von: data.zeitraum.von,
            gueltig_bis: data.zeitraum.bis,
            status: 'aktiv',
            leistungen: data.leistungen,
            pflegedienst: {
              name: 'DomusVita Gesundheit GmbH',
              standort: 'Kreuzberg',
              adresse: 'Waldemarstraße 10 A, 10999 Berlin',
              telefon: '030/6120152-0',
              email: 'kreuzberg@domusvita.de',
              ik: '461104096',
            },
          },
        ],
      });
    } catch (error) {
      console.error(`Error parsing ${file}:`, error);
      // Continue with next file
    }
  }

  return klienten;
}

// Standard Leistungen für Pflegegrad 2
const standardLeistungenPG2 = [
  { lkCode: 'LK02', menge: 4 },
  { lkCode: 'LK11A', menge: 4 },
  { lkCode: 'LK13', menge: 4 },
  { lkCode: 'LK15', menge: 60 }
];

// Standard Leistungen für Pflegegrad 3
const standardLeistungenPG3 = [
  { lkCode: 'LK02', menge: 4 },
  { lkCode: 'LK11B', menge: 4 },
  { lkCode: 'LK12', menge: 4 },
  { lkCode: 'LK13', menge: 4 },
  { lkCode: 'LK15', menge: 90 }
];

// Fallback static data if Excel parsing fails
export const fallbackKlienten: Klient[] = [
  {
    id: '1',
    name: 'Tschida, Klaus',
    pflegegrad: 3,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b1',
        gueltig_von: '2025-01-01',
        gueltig_bis: '2025-12-31',
        status: 'aktiv',
        leistungen: standardLeistungenPG3,
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '2',
    name: 'Sweidan, Omar',
    pflegegrad: 2,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b2',
        gueltig_von: '2025-04-01',
        gueltig_bis: '2025-10-31',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '3',
    name: 'Sommermann, Ulrich',
    pflegegrad: 3,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b3',
        gueltig_von: '2025-02-01',
        gueltig_bis: '2025-12-31',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '4',
    name: 'Rudek, Beate',
    pflegegrad: 3,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b4',
        gueltig_von: '2025-01-01',
        gueltig_bis: '2025-12-31',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '5',
    name: 'Plümpe',
    pflegegrad: 2,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b5',
        gueltig_von: '2024-12-01',
        gueltig_bis: '2025-11-30',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '6',
    name: 'Nakoinz',
    pflegegrad: 3,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b6',
        gueltig_von: '2025-04-01',
        gueltig_bis: '2026-03-31',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '7',
    name: 'Mankowski',
    pflegegrad: 2,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b7',
        gueltig_von: '2025-01-01',
        gueltig_bis: '2025-12-31',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '8',
    name: 'Köpke',
    pflegegrad: 3,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b8',
        gueltig_von: '2025-06-01',
        gueltig_bis: '2025-12-31',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '9',
    name: 'Konjetzky',
    pflegegrad: 2,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b9',
        gueltig_von: '2025-08-16',
        gueltig_bis: '2025-12-31',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '10',
    name: 'Hensler',
    pflegegrad: 3,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b10',
        gueltig_von: '2025-06-17',
        gueltig_bis: '2025-09-30',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '11',
    name: 'Hennings',
    pflegegrad: 2,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b11',
        gueltig_von: '2025-01-19',
        gueltig_bis: '2026-01-31',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '12',
    name: 'Gullatz',
    pflegegrad: 3,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b12',
        gueltig_von: '2025-12-02',
        gueltig_bis: '2025-12-02',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '13',
    name: 'Fialkowski',
    pflegegrad: 2,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b13',
        gueltig_von: '2025-06-01',
        gueltig_bis: '2025-11-30',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '14',
    name: 'Dreßler',
    pflegegrad: 3,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b14',
        gueltig_von: '2025-04-01',
        gueltig_bis: '2026-03-31',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '15',
    name: 'Budach',
    pflegegrad: 2,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b15',
        gueltig_von: '2025-08-01',
        gueltig_bis: '2026-07-31',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '16',
    name: 'Bollweber',
    pflegegrad: 3,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b16',
        gueltig_von: '2025-01-01',
        gueltig_bis: '2025-12-31',
        status: 'aktiv',
        leistungen: [
          { lkCode: 'LK02', menge: 4 },
          { lkCode: 'LK11B', menge: 4 },
          { lkCode: 'LK12', menge: 4 },
          { lkCode: 'LK13', menge: 4 },
          { lkCode: 'LK15', menge: 90 }
        ],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '17',
    name: 'Block',
    pflegegrad: 2,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b17',
        gueltig_von: '2025-05-16',
        gueltig_bis: '2026-04-30',
        status: 'aktiv',
        leistungen: standardLeistungenPG2,
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
  {
    id: '18',
    name: 'Alijevic',
    pflegegrad: 3,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligungen: [
      {
        id: 'b18',
        gueltig_von: '2025-01-01',
        gueltig_bis: '2025-12-31',
        status: 'aktiv',
        leistungen: [],
        pflegedienst: {
          name: 'DomusVita Gesundheit GmbH',
          standort: 'Kreuzberg',
          adresse: 'Waldemarstraße 10 A, 10999 Berlin',
          telefon: '030/6120152-0',
          email: 'kreuzberg@domusvita.de',
          ik: '461104096',
        },
      },
    ],
  },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
