export async function runOcr(file: File, type: 'bewilligung' | 'rechnung') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('type', type);

  const res = await fetch('/api/ocr', {
    method: 'POST',
    body: fd,
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    throw new Error(`Ungültige Serverantwort (HTTP ${res.status}).`);
  }

  if (!res.ok || !payload?.success) {
    const msg = payload?.error || `OCR fehlgeschlagen (HTTP ${res.status}).`;
    throw new Error(msg);
  }

  return payload as { success: true; data: any; raw: string; meta?: any };
}
