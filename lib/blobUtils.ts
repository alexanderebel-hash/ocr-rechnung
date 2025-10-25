export function sanitizeBlobFileName(fileName: string): string {
  return fileName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9.\- _]/g, '');
}

export function buildBewilligungBlobPath(fileName: string): string {
  return `bewilligungen/${sanitizeBlobFileName(fileName)}`;
}
