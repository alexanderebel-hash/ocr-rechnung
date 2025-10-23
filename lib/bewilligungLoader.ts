export interface BewilligteLeistung {
  lk_code: string;
  beschreibung: string;
  anzahl: number;
  pflegegrad: number;
  gueltig_von: string;
  gueltig_bis: string;
}

export async function loadBewilligungenForKlient(nachname: string): Promise<BewilligteLeistung[]> {
  try {
    const response = await fetch('/bewilligungen_alle.csv');
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
      console.warn('CSV file is empty or has no data rows');
      return [];
    }

    const bewilligungen: BewilligteLeistung[] = [];

    // Skip header row (index 0)
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');

      // Check if this row belongs to the requested client
      const rowNachname = values[0]?.trim();
      if (rowNachname === nachname) {
        bewilligungen.push({
          lk_code: values[1]?.trim() || '',
          beschreibung: values[2]?.trim() || '',
          anzahl: parseFloat(values[3]) || 0,
          pflegegrad: parseInt(values[4]) || 0,
          gueltig_von: values[5]?.trim() || '',
          gueltig_bis: values[6]?.trim() || ''
        });
      }
    }

    console.log(`✅ Loaded ${bewilligungen.length} Bewilligungen for ${nachname}`);
    return bewilligungen;
  } catch (error) {
    console.error(`❌ Error loading Bewilligungen for ${nachname}:`, error);
    return [];
  }
}

export async function getAllKlientenFromCSV(): Promise<string[]> {
  try {
    const response = await fetch('/bewilligungen_alle.csv');
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');

    const klientenSet = new Set<string>();

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const nachname = values[0]?.trim();
      if (nachname) {
        klientenSet.add(nachname);
      }
    }

    return Array.from(klientenSet).sort();
  } catch (error) {
    console.error('❌ Error loading Klienten from CSV:', error);
    return [];
  }
}
