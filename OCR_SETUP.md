# DomusVita OCR Setup

## PDF Upload & OCR Feature

Diese Anwendung nutzt das OpenAI Vision-Modell, um automatisch Daten aus PDF-Dokumenten zu extrahieren.

### 🚀 Setup

1. **OpenAI API Key erhalten**
   - Gehen Sie zu [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Erstellen Sie einen Account oder loggen Sie sich ein
   - Navigieren Sie zu "API Keys" und erstellen Sie einen neuen Key
   - Kopieren Sie den API Key

2. **API Key konfigurieren**
   - Öffnen Sie die Datei `.env.local` im Projektverzeichnis
   - Hinterlegen Sie Ihren Key in der Variablen `OpenAIOCR` (oder alternativ `OPENAI_API_KEY`):
   ```
   OpenAIOCR=sk-openai-...
   ```
   - In Vercel hinterlegen Sie denselben Key unter **Settings → Environment Variables** mit dem Namen `OpenAIOCR` (oder `OPENAI_API_KEY`). Vercel besitzt diesen Key bereits laut Projektkonfiguration.

3. **Server neu starten**
   ```bash
   npm run dev
   ```

### 📋 Verwendung

1. **Bewilligung PDF hochladen**
   - Klicken Sie auf den "Bewilligung PDF" Upload-Bereich (links)
   - Wählen Sie Ihre Bewilligungs-PDF aus oder ziehen Sie sie per Drag & Drop
   - Claude OCR extrahiert automatisch:
     - Klientendaten (Name, Pflegegrad, Zeitraum, etc.)
     - Alle LK-Codes mit Je Woche/Je Monat Mengen
     - Investitionskosten

2. **Rechnung PDF hochladen**
   - Klicken Sie auf den "Rechnung PDF" Upload-Bereich (rechts)
   - Wählen Sie Ihre Rechnungs-PDF aus oder ziehen Sie sie per Drag & Drop
   - Die OCR extrahiert automatisch:
     - Alle Rechnungspositionen mit LK-Codes
     - Mengen und Einzelpreise
     - AUB-Positionen
     - ZINV (Zusätzliche Investitionskosten)
     - Gesamtbetrag

3. **Daten überprüfen und anpassen**
   - Die extrahierten Daten werden automatisch in die Formulare eingefügt
   - Überprüfen Sie die Daten auf Richtigkeit
   - Passen Sie bei Bedarf manuell an

### 🎯 Unterstützte Formate

- **Bewilligung**: PDF-Dateien mit Bewilligungsinformationen von Pflegekassen
- **Rechnung**: PDF-Dateien mit Rechnungspositionen (z.B. von Medifox)

### 🔧 Technische Details

- **OCR Engine**: OpenAI GPT-4.1 Mini (gpt-4.1-mini) mit Vision-Unterstützung
- **API Route**: `/api/ocr`
- **Komponente**: `components/PDFUpload.tsx`
- **Max. Dateigröße**: Abhängig von OpenAI API Limits

### ⚠️ Wichtig

- Der API Key wird nur serverseitig verwendet (in der API Route)
- Der API Key ist NIEMALS im Client-Code sichtbar
- Laden Sie `.env.local` NICHT in Git hoch (bereits in .gitignore)
- Kosten entstehen pro API-Aufruf (siehe OpenAI Pricing)

### 🐛 Troubleshooting

**Fehler: "OpenAIOCR/OPENAI_API_KEY nicht gefunden"**
- Überprüfen Sie, ob `.env.local` existiert
- Stellen Sie sicher, dass der API Key korrekt eingetragen ist
- Starten Sie den Server neu

**Fehler: "OCR-Processing fehlgeschlagen"**
- Überprüfen Sie, ob die PDF-Datei valide ist
- Stellen Sie sicher, dass die PDF Text enthält (nicht nur Bilder)
- Prüfen Sie Ihr OpenAI API-Guthaben

**OCR erkennt Daten nicht korrekt**
- Die PDF-Struktur könnte ungewöhnlich sein
- Sie können die extrahierten Daten manuell nachbearbeiten
- Bei Bedarf können die OCR-Prompts in `app/api/ocr/route.ts` angepasst werden

### 📊 Extrahierte Felder

#### Bewilligung
```typescript
{
  klientData: {
    name: string
    zeitraumVon: string (YYYY-MM-DD)
    zeitraumBis: string (YYYY-MM-DD)
    geburtsdatum: string (YYYY-MM-DD)
    pflegegrad: number (2-5)
    debitor: string
    belegNr: string
    genehmigungsDatum: string (DD.MM.YYYY)
    genehmigungsNr: string
  },
  bewilligung: [{
    lkCode: string
    bezeichnung: string
    jeWoche: number
    jeMonat: number
  }],
  investitionskosten: string | null
}
```

#### Rechnung
```typescript
{
  rechnungsPositionen: [{
    lkCode: string
    bezeichnung: string
    menge: number
    preis: number
    gesamt: number
    istAUB: boolean
  }],
  zinv: string | null
  gesamtbetrag: number
  rechnungsnummer: string
}
```
