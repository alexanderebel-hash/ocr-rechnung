import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
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
    const base64 = buffer.toString('base64');

    // Prepare prompt based on document type
    const prompt = type === 'bewilligung'
      ? getBewilligungPrompt()
      : getRechnungPrompt();

    // Call Claude API with vision
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract JSON from response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Find JSON in response (Claude might wrap it in markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        error: 'Keine strukturierten Daten gefunden',
        rawResponse: responseText
      }, { status: 500 });
    }

    const extractedData = JSON.parse(jsonMatch[0]);

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
  "rechnungsnummer": "Rechnungsnummer falls vorhanden"
}

WICHTIG:
- Extrahiere ALLE Rechnungspositionen (sowohl normale LK-Codes als auch AUB-Positionen)
- AUB-Positionen sind oft mit "AUB" oder "Ausbildungsumlage" gekennzeichnet
- Preise und Beträge mit Dezimalpunkt (nicht Komma)
- Berechne gesamt = menge * preis falls nicht direkt angegeben
- ZINV steht für "Zusätzliche Investitionskosten"
- Gib NUR das JSON zurück, keine zusätzlichen Erklärungen`;
}
