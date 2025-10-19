# DomusVita OCR Setup

## PDF Upload & OCR Feature

Diese Anwendung nutzt Claude AI von Anthropic, um automatisch Daten aus PDF-Dokumenten zu extrahieren.

### 🚀 Setup

1. **Anthropic API Key erhalten**
   - Gehen Sie zu [https://console.anthropic.com/](https://console.anthropic.com/)
   - Erstellen Sie einen Account oder loggen Sie sich ein
   - Navigieren Sie zu "API Keys" und erstellen Sie einen neuen Key
   - Kopieren Sie den API Key

2. **API Key konfigurieren**
   - Öffnen Sie die Datei `.env.local` im Projektverzeichnis
   - Ersetzen Sie `your_api_key_here` mit Ihrem echten API Key:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

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
   - Claude OCR extrahiert automatisch:
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

- **OCR Engine**: Claude Sonnet 4 (claude-sonnet-4-20250514) mit PDF-Vision
- **API Route**: `/api/ocr`
- **Komponente**: `components/PDFUpload.tsx`
- **Max. Dateigröße**: Abhängig von Anthropic API Limits

### ⚠️ Wichtig

- Der API Key wird nur serverseitig verwendet (in der API Route)
- Der API Key ist NIEMALS im Client-Code sichtbar
- Laden Sie `.env.local` NICHT in Git hoch (bereits in .gitignore)
- Kosten entstehen pro API-Aufruf (siehe Anthropic Pricing)

### 🐛 Troubleshooting

**Fehler: "ANTHROPIC_API_KEY nicht gefunden"**
- Überprüfen Sie, ob `.env.local` existiert
- Stellen Sie sicher, dass der API Key korrekt eingetragen ist
- Starten Sie den Server neu

**Fehler: "OCR-Processing fehlgeschlagen"**
- Überprüfen Sie, ob die PDF-Datei valide ist
- Stellen Sie sicher, dass die PDF Text enthält (nicht nur Bilder)
- Prüfen Sie Ihr Anthropic API-Guthaben

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
