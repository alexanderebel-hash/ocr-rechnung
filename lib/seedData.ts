import { parseExcelBewilligung, ParsedBewilligung } from './excelParser';

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
  // Add remaining 15 clients with similar structure...
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
