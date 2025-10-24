import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OpenAIOCR || process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OpenAIOCR || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAIOCR oder OPENAI_API_KEY ist nicht konfiguriert. Bitte in Vercel Environment Variables setzen.' },
        { status: 500 }
      );
    }
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'bewilligung' oder 'rechnung'

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
    }

    if (!type || !['bewilligung', 'rechnung'].includes(type)) {
      return NextResponse.json({ error: 'Ungültiger Typ' }, { status: 400 });
    }

    // Convert PDF to buffer for upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Prepare prompt based on document type
    const prompt = type === 'bewilligung' ? getBewilligungPrompt() : getRechnungPrompt();

    // Upload PDF to OpenAI (vision purpose enables multimodal parsing)
    const filename =
      (file as any).name && typeof (file as any).name === 'string'
        ? (file as any).name
        : `${type}-upload-${Date.now()}.pdf`;

    const fileForUpload = await OpenAI.toFile(buffer, filename, {
      type: 'application/pdf',
    });

    const uploadedFile = await openai.files.create({
      file: fileForUpload,
      purpose: 'vision',
    });

    const response = await openai.responses.parse({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_file', file_id: uploadedFile.id },
          ],
        },
      ],
      max_output_tokens: 4096,
    });

    // Attempt to delete uploaded file to avoid storage accumulation
    void openai.files.del(uploadedFile.id).catch((err) => {
      console.warn('OpenAI file cleanup failed:', err);
    });

    const extractedData =
      response.output[0]?.content[0]?.type === 'json_object'
        ? response.output[0].content[0].json
        : response.output[0]?.content[0]?.type === 'output_text'
          ? JSON.parse(response.output[0].content[0].text ?? '{}')
          : response.output_text
            ? JSON.parse(response.output_text)
            : null;

    if (!extractedData) {
      return NextResponse.json(
        {
          error: 'Keine strukturierten Daten gefunden',
          rawResponse: response,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      type,
      data: extractedData,
    });

  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim OCR-Processing',
        details: error
      },
      { status: 500 }
    );
  }
}

function getBewilligungPrompt(): string {
  return `Analysiere dieses Bewilligungs-PDF und extrahiere die folgenden Informationen in JSON-Format:

{
  "klientData": {
    "name": "Name des Klienten (Nachname, Vorname)",
    "zeitraumVon": "Start-Datum im Format YYYY-MM-DD",
    "zeitraumBis": "End-Datum im Format YYYY-MM-DD",
    "geburtsdatum": "Geburtsdatum im Format YYYY-MM-DD",
    "pflegegrad": Pflegegrad als Zahl (2-5),
    "debitor": "Debitor-Nummer falls vorhanden",
    "belegNr": "Beleg-Nummer falls vorhanden",
    "genehmigungsDatum": "Genehmigungsdatum im Format DD.MM.YYYY",
    "genehmigungsNr": "Genehmigungsnummer"
  },
  "bewilligung": [
    {
      "lkCode": "LK-Code (z.B. LK01, LK02, etc.)",
      "bezeichnung": "Leistungsbezeichnung",
      "jeWoche": Anzahl je Woche als Zahl,
      "jeMonat": Anzahl je Monat als Zahl
    }
  ],
  "investitionskosten": "Investitionskosten falls vorhanden, sonst null"
}

WICHTIG:
- Extrahiere ALLE LK-Codes mit ihren Mengen
- Achte auf die korrekte Schreibweise der LK-Codes (z.B. LK01, LK02, LK03A, LK03B, etc.)
- "Je Woche" und "Je Monat" sind Zahlen
- Gib NUR das JSON zurück, keine zusätzlichen Erklärungen`;
}

function getRechnungPrompt(): string {
  return `Analysiere dieses Rechnungs-PDF und extrahiere die folgenden Informationen in JSON-Format:

{
  "rechnungsPositionen": [
    {
      "lkCode": "LK-Code (z.B. LK01, LK02, etc.)",
      "bezeichnung": "Leistungsbezeichnung",
      "menge": Anzahl/Menge als Zahl,
      "preis": Einzelpreis als Zahl (mit Dezimalpunkt),
      "gesamt": Gesamtbetrag als Zahl (mit Dezimalpunkt),
      "istAUB": true falls es eine AUB-Position ist, sonst false
    }
  ],
  "zinv": "ZINV-Betrag falls vorhanden, sonst null",
  "gesamtbetrag": Gesamtbetrag der Rechnung als Zahl,
  "abrechnungszeitraumVon": "Start-Datum des Abrechnungszeitraums im Format YYYY-MM-DD",
  "abrechnungszeitraumBis": "End-Datum des Abrechnungszeitraums im Format YYYY-MM-DD",
  "pflegedienstIK": "IK-Nummer des Pflegedienstes (z.B. 461104151 oder 461104096)",
  "wohnheimAdresse": "Adresse des Wohnheims falls vorhanden (Straße und Hausnummer)"
}

WICHTIG:
- Extrahiere ALLE Rechnungspositionen (sowohl normale LK-Codes als auch AUB-Positionen)
- AUB-Positionen sind oft mit "AUB" oder "Ausbildungsumlage" gekennzeichnet
- Preise und Beträge mit Dezimalpunkt (nicht Komma)
- Berechne gesamt = menge * preis falls nicht direkt angegeben
- ZINV steht für "Zusätzliche Investitionskosten"
- Extrahiere den Abrechnungszeitraum (z.B. "2025-09-01 bis 2025-09-30")
- Extrahiere die IK-Nummer des Pflegedienstes (461104151 = Kreuzberg, 461104096 = Treptow)
- Extrahiere die Wohnheim-Adresse falls sichtbar (Hartriegelstr. 132 = Hebron, Waldemarstr. 10a = Siefos)
- Gib NUR das JSON zurück, keine zusätzlichen Erklärungen`;
}
