import { parseExcelBewilligung } from './excelParser';

/**
 * Lists all available bewilligungen from Blob storage
 */
export async function listAllBewilligungen() {
  try {
    const response = await fetch('/api/bewilligungen/list');
    if (!response.ok) {
      throw new Error(`Server response: ${response.status}`);
    }

    const json = await response.json();
    if (!json?.success || !json?.bewilligungen) {
      throw new Error('Failed to load bewilligungen list');
    }

    return json.bewilligungen;
  } catch (error) {
    console.error('❌ Error loading bewilligungen list:', error);
    return [];
  }
}

/**
 * Loads a bewilligung by exact filename from Blob storage
 */
export async function loadBewilligungByFilename(filename: string) {
  try {
    const response = await fetch(`/api/bewilligung?file=${encodeURIComponent(filename)}`);
    if (!response.ok) {
      throw new Error(`Server response: ${response.status}`);
    }

    const json = await response.json();
    if (!json?.success || !json?.data) {
      throw new Error(json?.error || 'Unknown server response');
    }

    console.log(`✅ Bewilligung loaded: ${filename}`, json.data);
    return json.data;
  } catch (error) {
    console.error(`❌ Error loading bewilligung ${filename}:`, error);
    return null;
  }
}

/**
 * Searches for bewilligung by client name (searches in filename)
 */
export async function findBewilligungByKlientName(nachname: string) {
  try {
    const allBewilligungen = await listAllBewilligungen();

    // Search for filename containing the client name (case-insensitive)
    const matching = allBewilligungen.find((bewil: any) =>
      bewil.filename.toLowerCase().includes(nachname.toLowerCase())
    );

    if (!matching) {
      console.error(`❌ No bewilligung found for: ${nachname}`);
      return null;
    }

    console.log(`✓ Found bewilligung for ${nachname}: ${matching.filename}`);
    return await loadBewilligungByFilename(matching.filename);
  } catch (error) {
    console.error(`❌ Error searching bewilligung for ${nachname}:`, error);
    return null;
  }
}

/**
 * Extracts client name from bewilligung filename
 * Example: "Bewilligung Alijevic 01.01.25-31.12.25.xlsx" -> "Alijevic"
 */
export function extractKlientNameFromFilename(filename: string): string | null {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(xlsx|xls)$/i, '');

  // Pattern: "Bewilligung [Name] [dates]"
  const match = nameWithoutExt.match(/bewilligung\s+([a-zäöüß]+)/i);

  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Gets all unique client names from blob storage bewilligungen
 */
export async function getAllKlientenNamesFromBlob(): Promise<string[]> {
  try {
    const allBewilligungen = await listAllBewilligungen();

    const names = allBewilligungen
      .map((bewil: any) => extractKlientNameFromFilename(bewil.filename))
      .filter((name: string | null): name is string => name !== null)
      .sort();

    return Array.from(new Set(names)); // Remove duplicates
  } catch (error) {
    console.error('❌ Error getting client names from blob:', error);
    return [];
  }
}
