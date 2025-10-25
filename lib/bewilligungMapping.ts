/**
 * Utility functions for matching clients with their authorization files
 */

/**
 * Finds the matching authorization file for a client
 * Tries different matching strategies
 */
export function findBewilligungFilename(
  klientName: string,
  availableFiles: string[]
): string | null {

  // Normalize client name (extract last name)
  const cleanName = klientName
    .split(',')[0] // "Koppe, Hans" → "Koppe"
    .split('-')[0] // "trump - PG3" → "trump"
    .trim()
    .toLowerCase();

  console.log('🔍 Searching bewilligung for:', cleanName);
  console.log('📂 Available files:', availableFiles);

  // Strategy 1: Exact match (e.g., "Koppe.xlsx" or "koppe.xlsx")
  let match = availableFiles.find(file => {
    const fileNameLower = file.toLowerCase().replace(/\.(xlsx|xls)$/i, '');
    return fileNameLower === cleanName ||
           fileNameLower === `bewilligung ${cleanName}`;
  });

  if (match) {
    console.log('✓ Match found (exact):', match);
    return match;
  }

  // Strategy 2: Contains match (e.g., "Bewilligung Koppe 2025.xlsx")
  match = availableFiles.find(file => {
    const fileNameLower = file.toLowerCase();
    return fileNameLower.includes(cleanName);
  });

  if (match) {
    console.log('✓ Match found (contains):', match);
    return match;
  }

  // Strategy 3: Partial match (client name contains filename or vice versa)
  match = availableFiles.find(file => {
    const fileBaseName = file.toLowerCase()
      .replace(/\.(xlsx|xls)$/i, '')
      .replace(/^(bewil_|bewil|bewilligung_|bewilligung)\s*/i, '');

    return cleanName.includes(fileBaseName) || fileBaseName.includes(cleanName);
  });

  if (match) {
    console.log('✓ Match found (partial):', match);
    return match;
  }

  console.log('✗ No bewilligung found for:', cleanName);
  return null;
}

/**
 * Extracts client name from filename
 * Examples:
 * - "Koppe.xlsx" → "Koppe"
 * - "Bewil_Koppe_2025.xlsx" → "Koppe"
 * - "trump.xlsx" → "trump"
 * - "Bewilligung Alijevic 01.01.25-31.12.25.xlsx" → "Alijevic"
 */
export function extractKlientFromFilename(filename: string): string {
  // Remove extension
  const withoutExt = filename.replace(/\.(xlsx|xls)$/i, '');

  // Remove prefixes like "Bewil_", "Bewilligung "
  const withoutPrefix = withoutExt.replace(/^(Bewil_|bewil_|Bewilligung\s+)/i, '');

  // Extract first word (usually the last name)
  const firstWord = withoutPrefix.split(/[\s_-]/)[0];

  return firstWord.trim();
}

/**
 * Validates if a filename matches naming conventions
 */
export function isValidBewilligungFilename(filename: string): boolean {
  // Must be .xlsx or .xls
  if (!/\.(xlsx|xls)$/i.test(filename)) {
    return false;
  }

  // Must contain at least one alphabetic character
  if (!/[a-zA-ZäöüßÄÖÜ]/.test(filename)) {
    return false;
  }

  return true;
}

/**
 * Suggests a filename for a client
 */
export function suggestBewilligungFilename(klientName: string): string {
  const cleanName = klientName
    .split(',')[0]
    .split('-')[0]
    .trim();

  return `Bewilligung ${cleanName}.xlsx`;
}
