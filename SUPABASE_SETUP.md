# Supabase Database Setup

Diese Anleitung zeigt, wie du die Supabase-Datenbank für die DomusVita OCR-App einrichtest.

## 1. Datenbank-Tabellen erstellen

1. Öffne dein **Supabase Dashboard**: https://supabase.com/dashboard
2. Wähle dein Projekt aus
3. Gehe zu **SQL Editor** im linken Menü
4. Klicke auf **New Query**
5. Kopiere den gesamten Inhalt der Datei `supabase-schema.sql` und füge ihn ein
6. Klicke auf **Run** (oder drücke `Ctrl+Enter`)

Das Script erstellt folgende Tabellen:
- `klienten` - Klientendaten (Name, Pflegegrad, Adresse, etc.)
- `bewilligungen` - Bewilligungszeiträume pro Klient
- `leistungen` - Bewilligte Leistungskomplexe (LK-Codes) mit Mengen

## 2. API Key konfigurieren

1. Im Supabase Dashboard → **Settings** → **API**
2. Kopiere den **anon/public** Key (nicht den service_role key!)
3. Erstelle eine `.env.local` Datei im Projektordner (falls nicht vorhanden):

```bash
NEXT_PUBLIC_SUPABASE_KEY=dein_anon_public_key_hier
ClaudeOCR=dein_claude_api_key  # Bestehendes Environment Variable
```

4. Für Vercel Deployment:
   - Vercel Dashboard → Settings → Environment Variables
   - Füge hinzu: `NEXT_PUBLIC_SUPABASE_KEY` mit deinem anon/public Key

## 3. Bewilligungsdaten eintragen

### Option A: Manuell über Supabase Dashboard

1. Gehe zu **Table Editor** im Supabase Dashboard
2. Wähle die Tabelle `klienten` aus
3. Klicke auf **Insert** → **Insert row**
4. Füge einen Klienten hinzu (Name, Pflegegrad, Adresse, etc.)
5. Kopiere die generierte `id` (UUID)
6. Wechsle zur Tabelle `bewilligungen`
7. Füge eine Bewilligung hinzu mit der kopierten `klient_id`
8. Kopiere die `bewilligung_id` (UUID)
9. Wechsle zur Tabelle `leistungen`
10. Füge die bewilligten LK-Codes hinzu (z.B. LK1, LK5, LK20) mit Mengen

### Option B: Mit Seed-Script (Empfohlen)

1. **Bewilligungsdaten hinzufügen:**
   - Öffne die Datei `scripts/seed-database.ts`
   - Füge die echten Bewilligungsdaten ein (siehe Kommentare im Script)
   - Für jeden Klienten:
     ```typescript
     {
       name: 'Tschida, Klaus',
       pflegegrad: 3,
       // ... andere Felder
       bewilligung: {
         gueltig_von: '2025-01-01',
         gueltig_bis: '2025-12-31',
         leistungen: [
           { lk_code: 'LK1', menge: 10 },
           { lk_code: 'LK5', menge: 5 },
           { lk_code: 'LK20', menge: 3 },
           // Weitere LK-Codes...
         ],
       },
     }
     ```

2. **Script ausführen:**
   ```bash
   # Environment Variable setzen
   export NEXT_PUBLIC_SUPABASE_KEY=dein_key_hier

   # TSX installieren (falls noch nicht vorhanden)
   npm install -D tsx

   # Seed-Script ausführen
   npx tsx scripts/seed-database.ts
   ```

3. **Ausgabe überprüfen:**
   ```
   🌱 Starting database seeding...
   🗑️  Clearing existing data...

   ➕ Adding client: Tschida, Klaus
      ✅ Client created with ID: ...
      ✅ Authorization created (valid until 2025-12-31)
      ✅ Added 5 services

   ➕ Adding client: Sweidan, Omar
      ...

   ✅ Database seeding completed!
   📊 Summary:
      - Clients: 18
      - Authorizations: 18
      - Services: 85
   ```

## 4. Testen

1. Starte die Development-Server:
   ```bash
   npm run dev
   ```

2. Öffne http://localhost:3000

3. In der Browser-Konsole (F12) solltest du sehen:
   ```
   🔄 Attempting to load clients from Supabase...
   ✅ Loaded 18 clients from Supabase
   ```

4. Das Klienten-Dropdown sollte jetzt alle 18 Klienten anzeigen
5. Jeder Klient sollte die Anzahl der bewilligten Leistungen anzeigen (z.B. "5 Leistungen bewilligt")

## 5. Fehlerbehebung

### Problem: "No clients found in Supabase"
- Überprüfe, ob die Tabellen erstellt wurden (SQL Editor → Ausführungslogs)
- Überprüfe, ob Daten in den Tabellen sind (Table Editor)
- Überprüfe die RLS (Row Level Security) Policies - müssen für alle aktiviert sein

### Problem: "NEXT_PUBLIC_SUPABASE_KEY ist nicht konfiguriert"
- Überprüfe `.env.local` Datei
- Stelle sicher, dass der Key mit `NEXT_PUBLIC_` beginnt
- Starte den Dev-Server neu nach Änderungen an .env.local

### Problem: Seed-Script schlägt fehl
- Überprüfe, ob die Tabellen existieren
- Überprüfe, ob der API Key korrekt ist
- Überprüfe die RLS Policies (müssen INSERT erlauben)

## Datenbank-Struktur

```
klienten
├── id (UUID, Primary Key)
├── name (Text)
├── pflegegrad (Integer 1-5)
├── adresse (Text)
├── pflegedienst (Text)
├── standort (Text)
├── stadtteil (Text)
└── pflegedienst_adresse (Text)

bewilligungen
├── id (UUID, Primary Key)
├── klient_id (UUID, Foreign Key → klienten.id)
├── gueltig_von (Date)
├── gueltig_bis (Date)
├── status (Text: 'aktiv', 'abgelaufen', 'gekündigt')
├── pflegedienst_name (Text)
├── pflegedienst_standort (Text)
├── pflegedienst_adresse (Text)
├── pflegedienst_telefon (Text)
├── pflegedienst_email (Text)
└── pflegedienst_ik (Text)

leistungen
├── id (UUID, Primary Key)
├── bewilligung_id (UUID, Foreign Key → bewilligungen.id)
├── lk_code (Text, z.B. 'LK1', 'LK5', 'LK20')
└── menge (Integer, Anzahl pro Monat)
```

## Was du noch brauchst

**WICHTIG:** Du musst noch die tatsächlichen Bewilligungsdaten hinzufügen!

Für jeden der 18 Klienten benötigen wir:
- Welche LK-Codes sind bewilligt? (z.B. LK1, LK5, LK20, LK36)
- Wie viele Einheiten pro Monat? (die Menge)

Diese Daten sollten aus den Excel-Dateien oder den Screenshots kommen, die du vorhin geschickt hast.

Schicke mir die Screenshots nochmal oder liste die Bewilligungsdaten als Text auf, dann fülle ich das Seed-Script damit!
