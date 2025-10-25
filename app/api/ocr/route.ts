import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY oder CLAUDE_API_KEY ist nicht konfiguriert. Bitte in Vercel Environment Variables setzen.' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'bewilligung' oder 'rechnung'

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
    }

    if (!type || !['bewilligung', 'rechnung'].includes(type)) {
      return NextResponse.json({ error: 'Ungültiger Typ' }, { status: 400 });
    }

    // Convert PDF to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64PDF = buffer.toString('base64');

    // Prepare prompt based on document type
    const prompt = type === 'bewilligung' ? getBewilligungPrompt() : getRechnungPrompt();

    console.log(`📄 Processing ${type} PDF with Claude...`);

    // Call Claude API with PDF (using beta PDF support)
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document' as any,
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64PDF,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      betas: ['pdfs-2024-09-25'],
    } as any);

    // Extract text from Claude's response
    let outputText = '';
    for (const content of message.content) {
      if (content.type === 'text') {
        outputText += content.text;
      }
    }

    console.log('✅ Claude response received');

    if (!outputText) {
      return NextResponse.json(
        {
          error: 'Keine strukturierten Daten gefunden',
          details: 'Claude hat keine Antwort zurückgegeben',
        },
        { status: 500 }
      );
    }

    // Remove markdown code blocks if present
    let jsonText = outputText.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    try {
      const extractedData = JSON.parse(jsonText);

      return NextResponse.json({
        success: true,
        type,
        data: extractedData,
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw output:', outputText);

      return NextResponse.json(
        {
          error: 'Konnte JSON nicht parsen',
          details: parseError instanceof Error ? parseError.message : 'Unknown error',
          rawOutput: outputText.substring(0, 500), // First 500 chars for debugging
        },
        { status: 500 }
      );
    }

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
