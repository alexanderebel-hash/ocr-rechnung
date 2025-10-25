/* eslint-disable @typescript-eslint/no-explicit-any */
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';

const MAX_FILE_BYTES = 32 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf']);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const type = String(form.get('type') || '').toLowerCase();

    if (!file) {
      return jsonError('Keine Datei übergeben.', 400);
    }
    if (!['bewilligung', 'rechnung'].includes(type)) {
      return jsonError('Ungültiger "type". Erlaubt: "bewilligung" | "rechnung".', 400);
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError(`Ungültiger Content-Type: ${file.type || 'unbekannt'}. Nur PDF erlaubt.`, 400);
    }
    if (file.size > MAX_FILE_BYTES) {
      return jsonError(`PDF zu groß (${formatBytes(file.size)}). Maximal ${formatBytes(MAX_FILE_BYTES)}.`, 413);
    }

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const pdfBase64 = buffer.toString('base64');

    const approxPages = approxPdfPageCount(buffer);
    if (approxPages && approxPages > 100) {
      return jsonError(`PDF hat vermutlich ${approxPages} Seiten. Maximal 100 Seiten unterstützt.`, 413);
    }

    const prompt = type === 'bewilligung' ? buildBewilligungPrompt() : buildRechnungPrompt();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return jsonError('Server-Fehler: ANTHROPIC_API_KEY nicht gesetzt.', 500);
    }
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const outputText = (message.content ?? [])
      .filter((p: any) => p?.type === 'text')
      .map((p: any) => p.text)
      .join('\n')
      .trim();

    const data = safeExtractJson(outputText);

    return Response.json({
      success: true,
      meta: { approxPages },
      data,
      raw: outputText,
    });
  } catch (err: any) {
    const msg = err?.message || 'Unbekannter Serverfehler';
    const code = asHttpStatus(err?.status) ?? 500;
    return jsonError(`OCR-Processing fehlgeschlagen: ${msg}`, code, err);
  }
}

function jsonError(message: string, status = 400, details?: any) {
  return new Response(JSON.stringify({ success: false, error: message, details }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function asHttpStatus(maybe: any): number | undefined {
  if (typeof maybe === 'number' && maybe >= 400 && maybe <= 599) return maybe;
  return undefined;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function approxPdfPageCount(buf: Buffer): number | null {
  try {
    const txt = buf.toString('latin1');
    const m = txt.match(/\/Type\s*\/Page\b/g);
    return m ? m.length : null;
  } catch {
    return null;
  }
}

function buildBewilligungPrompt(): string {
  return [
    'Du bist ein präziser Extraktor. Lies das angehängte PDF (Pflegekassen-Bewilligung, DE).',
    'Gib **ausschließlich** folgendes JSON zurück (keine Kommentare, kein Freitext):',
    '{',
    '  "klient": { "nachname": "", "vorname": "" },',
    '  "zeitraum": { "von": "", "bis": "" },',
    '  "leistungen": [',
    '    { "leistungsart": "", "menge": "", "einheit": "" }',
    '  ],',
    '  "kasse": "",',
    '  "versichertennummer": ""',
    '}',
  ].join('\n');
}

function buildRechnungPrompt(): string {
  return [
    'Du bist ein präziser Extraktor. Lies das angehängte PDF (Rechnung, DE).',
    'Gib **ausschließlich** folgendes JSON zurück (keine Kommentare, kein Freitext):',
    '{',
    '  "rechnungsnummer": "",',
    '  "rechnungsdatum": "",',
    '  "klient": { "nachname": "", "vorname": "" },',
    '  "positionen": [',
    '    { "beschreibung": "", "menge": "", "einheit": "", "einzelpreis": "", "gesamt": "" }',
    '  ],',
    '  "summe_netto": "",',
    '  "mwst": "",',
    '  "summe_brutto": ""',
    '}',
  ].join('\n');
}

function safeExtractJson(text: string): any | null {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}$/m);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
