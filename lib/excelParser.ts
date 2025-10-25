import * as XLSX from 'xlsx';

export interface ParsedBewilligung {
  klient: {
    name: string;
    pflegegrad: number;
    adresse: string;
    pflegedienst: string;
    standort: string;
    stadtteil: string;
  };
  zeitraum: {
    von: string;
    bis: string;
  };
  leistungen: Array<{
    lk_code: string;
    leistung: string;
    je_woche: number;
    je_monat: number;
    einzelpreis: number;
  }>;
}

export async function parseExcelBewilligung(source: string | ArrayBuffer): Promise<ParsedBewilligung> {
  let arrayBuffer: ArrayBuffer;

  if (typeof source === 'string') {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Fehler beim Laden der Datei (${response.status})`);
    }
    arrayBuffer = await response.arrayBuffer();
  } else {
    arrayBuffer = source;
  }
  const workbook = XLSX.read(arrayBuffer);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

  // Initialize variables
  let name = '';
  let pflegegrad = 3;
  let adresse = '';
  let zeitraumVon = '';
  let zeitraumBis = '';

  // Parse header area (typically first 20 rows)
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const firstCol = String(row[0] || '').toLowerCase();

    // Look for name/klient
    if (firstCol.includes('name') || firstCol.includes('klient') || firstCol.includes('leistungsempfänger')) {
      name = String(row[1] || '').trim();
    }

    // Look for pflegegrad
    if (firstCol.includes('pflegegrad') || firstCol.includes('pg')) {
      const pgValue = String(row[1] || '');
      const pgMatch = pgValue.match(/\d+/);
      if (pgMatch) {
        pflegegrad = parseInt(pgMatch[0]);
      }
    }

    // Look for address
    if (firstCol.includes('adresse') || firstCol.includes('anschrift') || firstCol.includes('straße')) {
      adresse = String(row[1] || '').trim();
    }

    // Look for dates
    if (firstCol.includes('gültig von') || firstCol.includes('bewilligungszeitraum von') || firstCol.includes('von')) {
      const dateStr = String(row[1] || '').trim();
      zeitraumVon = parseDateString(dateStr);
    }

    if (firstCol.includes('gültig bis') || firstCol.includes('bewilligungszeitraum bis') || firstCol.includes('bis')) {
      const dateStr = String(row[1] || row[2] || row[3] || '').trim();
      zeitraumBis = parseDateString(dateStr);
    }
  }

  // Standard values if empty
  if (!adresse || adresse.trim() === '') {
    adresse = 'Kreuzberg, Berlin';
  }

  // Find service table (search for "LK" header)
  let tableStart = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const hasLK = row.some(cell => {
      const cellStr = String(cell || '').toLowerCase();
      return cellStr.includes('lk code') || cellStr.includes('lk-code') || cellStr === 'lk';
    });
    if (hasLK) {
      tableStart = i + 1;
      break;
    }
  }

  const leistungen: ParsedBewilligung['leistungen'] = [];

  if (tableStart > 0) {
    for (let i = tableStart; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const lkCode = String(row[0] || '').trim().toUpperCase();

      // Check if valid LK code
      if (!lkCode || !lkCode.match(/^LK\d+/i)) continue;

      const leistung = String(row[1] || '').trim();
      const jeWoche = parseFloat(String(row[2] || '0')) || 0;
      const jeMonat = parseFloat(String(row[3] || '0')) || 0;
      const einzelpreis = parseFloat(String(row[4] || '0')) || 0;

      // Only add if there's actual service data
      if (jeWoche > 0 || jeMonat > 0) {
        leistungen.push({
          lk_code: lkCode,
          leistung: leistung || lkCode,
          je_woche: jeWoche,
          je_monat: jeMonat,
          einzelpreis: einzelpreis,
        });
      }
    }
  }

  return {
    klient: {
      name,
      pflegegrad,
      adresse,
      pflegedienst: 'DomusVita Gesundheit GmbH',
      standort: 'Kreuzberg',
      stadtteil: 'Kreuzberg / Sievos',
    },
    zeitraum: {
      von: zeitraumVon,
      bis: zeitraumBis,
    },
    leistungen,
  };
}

function parseDateString(dateStr: string): string {
  if (!dateStr) return '';

  // Try different date formats
  // Format: DD.MM.YYYY or DD.MM.YY
  const germanDate = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (germanDate) {
    let day = germanDate[1].padStart(2, '0');
    let month = germanDate[2].padStart(2, '0');
    let year = germanDate[3];

    // Convert 2-digit year to 4-digit
    if (year.length === 2) {
      year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    }

    return `${year}-${month}-${day}`;
  }

  // Format: DD/MM/YYYY
  const slashDate = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slashDate) {
    let day = slashDate[1].padStart(2, '0');
    let month = slashDate[2].padStart(2, '0');
    let year = slashDate[3];

    if (year.length === 2) {
      year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    }

    return `${year}-${month}-${day}`;
  }

  // Format: DD-MM-YYYY
  const dashDate = dateStr.match(/(\d{1,2})-(\d{1,2})-(\d{2,4})/);
  if (dashDate) {
    let day = dashDate[1].padStart(2, '0');
    let month = dashDate[2].padStart(2, '0');
    let year = dashDate[3];

    if (year.length === 2) {
      year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    }

    return `${year}-${month}-${day}`;
  }

  // Already in YYYY-MM-DD format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }

  return dateStr;
}
