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
    genehmigt: boolean;  // ✅ NEU: Genehmigt-Status
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
  let genehmigIndex = -1;  // ✅ NEU: Index der "Genehmigt"-Spalte
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    // Suche nach Header-Zeile mit "LK Code"
    const lkIndex = row.findIndex((cell: any) => {
      const cellStr = String(cell || '').toLowerCase();
      return cellStr.includes('lk code') || cellStr.includes('lk-code') || cellStr === 'lk';
    });
    
    if (lkIndex !== -1) {
      tableStart = i + 1;
      
      // ✅ NEU: Finde die "Genehmigt"-Spalte
      genehmigIndex = row.findIndex((cell: any) => {
        const cellStr = String(cell || '').toLowerCase().trim();
        return cellStr === 'genehmigt' || cellStr === 'bewilligt' || cellStr === 'y/n';
      });
      
      // Debug-Log (optional, kann später entfernt werden)
      console.log('📋 Excel-Header gefunden:');
      console.log('  LK-Code bei Index:', lkIndex);
      console.log('  Genehmigt bei Index:', genehmigIndex);
      console.log('  Header-Zeile:', row);
      
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
      
      // ✅ NEU: Einzelpreis könnte bei Index 4 ODER 5 sein (je nachdem ob Genehmigt vorher oder nachher kommt)
      let einzelpreis = 0;
      let genehmigt = false;
      
      if (genehmigIndex === 4) {
        // Excel-Struktur: [LK-Code, Leistung, Je Woche, Je Monat, Genehmigt, Einzelpreis]
        const genehmigRaw = String(row[4] || '').trim().toUpperCase();
        genehmigt = genehmigRaw === 'Y' || genehmigRaw === 'JA' || genehmigRaw === 'TRUE' || genehmigRaw === '1';
        einzelpreis = parseFloat(String(row[5] || '0')) || 0;
      } else if (genehmigIndex === 5) {
        // Excel-Struktur: [LK-Code, Leistung, Je Woche, Je Monat, Einzelpreis, Genehmigt]
        einzelpreis = parseFloat(String(row[4] || '0')) || 0;
        const genehmigRaw = String(row[5] || '').trim().toUpperCase();
        genehmigt = genehmigRaw === 'Y' || genehmigRaw === 'JA' || genehmigRaw === 'TRUE' || genehmigRaw === '1';
      } else {
        // Fallback: Keine "Genehmigt"-Spalte gefunden
        // Dann nehmen wir an: Wenn je_woche oder je_monat > 0, dann genehmigt
        einzelpreis = parseFloat(String(row[4] || '0')) || 0;
        genehmigt = (jeWoche > 0 || jeMonat > 0);
        
        console.warn(`⚠️  Keine "Genehmigt"-Spalte gefunden für ${lkCode}. Fallback: ${genehmigt ? 'genehmigt' : 'nicht genehmigt'}`);
      }

      // ✅ NEU: Füge ALLE Leistungen hinzu (auch nicht genehmigte für dokumentarische Zwecke)
      // Die Filterung auf genehmigte Leistungen passiert später in der Korrekturrechnung
      leistungen.push({
        lk_code: lkCode,
        leistung: leistung || lkCode,
        je_woche: jeWoche,
        je_monat: jeMonat,
        einzelpreis: einzelpreis,
        genehmigt: genehmigt,  // ✅ NEU: Status wird gespeichert
      });
      
      // Debug-Log (optional)
      console.log(`  ${lkCode}: ${genehmigt ? '✅ genehmigt' : '❌ nicht genehmigt'} (je_monat: ${jeMonat})`);
    }
  }

  // ✅ NEU: Log-Zusammenfassung
  const genehmigteCount = leistungen.filter(l => l.genehmigt).length;
  console.log(`\n📊 Gesamt: ${leistungen.length} Leistungen, davon ${genehmigteCount} genehmigt`);

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
