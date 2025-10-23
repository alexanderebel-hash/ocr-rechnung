# Supabase Database Setup - Professional Version

Diese Anleitung erklärt, wie du die professionelle Datenbank für die DomusVita OCR-App einrichtest.

## Voraussetzungen

- ✅ Supabase-Account erstellt
- ✅ Projekt in Supabase angelegt
- ✅ `.env.local` mit `NEXT_PUBLIC_SUPABASE_KEY` konfiguriert

## Schritt 1: Datenbank-Schema erstellen

1. **Öffne das Supabase Dashboard**: https://supabase.com/dashboard
2. Wähle dein Projekt aus
3. Gehe zu **SQL Editor** (linkes Menü)
4. Klicke auf **New Query**
5. **Kopiere den kompletten Inhalt** der Datei [`supabase-schema-new.sql`](supabase-schema-new.sql)
6. Füge ihn im SQL Editor ein
7. Klicke auf **Run** (oder drücke `Ctrl+Enter`)

### Was wird erstellt?

Das Script erstellt 7 Tabellen:

```
pflegedienst           → Pflegedienst-Stammdaten (DomusVita)
leistungskomplexe      → LK-Codes mit Preisen (LK02, LK03b, LK20.2, etc.)
klienten               → Klienten-Stammdaten
bezirksaemter          → Bezirksämter (Wedding, Kreuzberg, etc.)
pflegekassen           → Pflegekassen (AOK, Barmer, etc.)
bewilligungen          → Bewilligungen mit Zeiträumen
bewilligte_leistungen  → Bewilligte LK-Codes pro Bewilligung
```

Plus:
- 📊 **3 Views** für einfache Abfragen
- ⚡ **Indexes** für Performance
- 🔒 **Row Level Security (RLS)** Policies
- 🔧 **Functions** für ZINV-Berechnung
- ⏰ **Triggers** für automatische Timestamps

## Schritt 2: Daten importieren

1. Im **SQL Editor** → **New Query**
2. **Kopiere den kompletten Inhalt** der Datei [`supabase-seed-data.sql`](supabase-seed-data.sql)
3. Füge ihn ein und klicke auf **Run**

### Was wird importiert?

- ✅ DomusVita Pflegedienst-Stammdaten (IK 461104096)
- ✅ 10 Leistungskomplexe mit Preisen (LK02, LK03b, LK11b, LK12, LK13, LK14, LK15, LK17a, LK17b, LK20.2)
- ✅ 2 Beispiel-Klienten (Bollweber, Sweidan)
- ✅ 2 Bezirksämter (Wedding, Kreuzberg)
- ✅ 2 Pflegekassen (AOK Nordost, Barmer)
- ✅ 2 Bewilligungen mit bewilligten Leistungen

## Schritt 3: Weitere Klienten hinzufügen

Du hast jetzt 2 Beispiel-Klienten in der Datenbank. Um die restlichen 16 Klienten hinzuzufügen:

### Option A: Über Supabase Dashboard (Manuell)

1. Gehe zu **Table Editor** → **klienten**
2. Klicke auf **Insert** → **Insert row**
3. Füge die Klientendaten ein:
   - Name (z.B. "Tschida")
   - Vorname (z.B. "Klaus")
   - Versichertennummer (optional)
   - Pflegegrad (1-5)
   - Strasse, Hausnummer, PLZ, Ort

4. Kopiere die generierte **UUID** (id)
5. Gehe zu **bewilligungen** Tabelle
6. Klicke auf **Insert** → **Insert row**
7. Füge hinzu:
   - bewilligungs_id (z.B. "BEW-003")
   - klienten_id (die kopierte UUID)
   - zeitraum_von / zeitraum_bis
   - status: "aktiv"
   - zinv_prozentsatz: 3.38
   - zinv_berechnungsmodus: "ba"

8. Gehe zu **bewilligte_leistungen** Tabelle
9. Füge die LK-Codes hinzu:
   - bewilligungs_id (z.B. "BEW-003")
   - lk_code (z.B. "LK02")
   - genehmigt_pro_woche (z.B. 10)
   - ODER genehmigt_pro_monat (z.B. 43)

### Option B: Per SQL-Script (Schneller)

Erstelle eine neue Query im SQL Editor:

```sql
-- Beispiel: Tschida, Klaus hinzufügen
INSERT INTO klienten (name, vorname, pflegegrad, strasse, hausnummer, plz, ort)
VALUES ('Tschida', 'Klaus', 3, 'Beispielstr.', '1', '10999', 'Berlin')
RETURNING id;

-- Kopiere die zurückgegebene ID und füge sie unten ein
INSERT INTO bewilligungen (
  bewilligungs_id,
  klienten_id,
  zeitraum_von,
  zeitraum_bis,
  status,
  zinv_prozentsatz,
  zinv_berechnungsmodus
) VALUES (
  'BEW-003',
  'HIER_DIE_KOPIERTE_UUID_EINFÜGEN',
  '2025-01-01',
  '2025-12-31',
  'aktiv',
  3.38,
  'ba'
);

-- Bewilligte Leistungen hinzufügen
INSERT INTO bewilligte_leistungen (bewilligungs_id, lk_code, genehmigt_pro_woche) VALUES
('BEW-003', 'LK02', 10),
('BEW-003', 'LK03b', 5),
('BEW-003', 'LK20.2', NULL); -- Wenn pro_monat: genehmigt_pro_monat = 3

-- Für genehmigt_pro_monat statt pro_woche:
INSERT INTO bewilligte_leistungen (bewilligungs_id, lk_code, genehmigt_pro_monat) VALUES
('BEW-003', 'LK20.2', 3);
```

## Schritt 4: Testen

1. Starte den Development-Server:
   ```bash
   npm run dev
   ```

2. Öffne http://localhost:3000

3. Öffne die Browser-Konsole (F12)

4. Du solltest sehen:
   ```
   🔄 Loading clients from Supabase...
   ✅ Loaded 2 clients from Supabase
   ```

5. Das Klienten-Dropdown sollte die Klienten mit der Anzahl bewilligter Leistungen anzeigen

## Schritt 5: Daten überprüfen

### Im Supabase Dashboard:

1. Gehe zu **Table Editor**
2. Wähle **klienten** → Du solltest deine Klienten sehen
3. Wähle **bewilligungen** → Du solltest die Bewilligungen sehen
4. Wähle **bewilligte_leistungen** → Du solltest die LK-Codes sehen

### Mit Views (Empfohlen):

Im **SQL Editor** kannst du diese Views nutzen:

```sql
-- Alle Klienten mit Bewilligungen
SELECT * FROM v_klienten_overview;

-- Alle Bewilligungen komplett
SELECT * FROM v_bewilligungen_komplett;

-- Bewilligte Leistungen für eine bestimmte Bewilligung
SELECT * FROM v_bewilligte_leistungen_detail
WHERE bewilligungs_id = 'BEW-001';
```

## Datenbank-Struktur im Detail

### Klienten-Hierarchie

```
klienten (Bollweber, Klaus)
  ↓
bewilligungen (BEW-001: 2025-01-01 bis 2025-12-31)
  ↓
bewilligte_leistungen
  - LK02: 10x pro Woche
  - LK03b: 5x pro Woche
  - LK20.2: 3x pro Monat
```

### Wichtige Felder

**bewilligte_leistungen:**
- `genehmigt_pro_woche` → Wird automatisch in Monatsmenge umgerechnet (× 4.33)
- `genehmigt_pro_monat` → Direkte Monatsmenge
- `bemerkung` → z.B. "erbracht, aktuell nicht bewilligt"

**bewilligungen:**
- `zinv_prozentsatz` → Normalerweise 3.38
- `zinv_berechnungsmodus` → "ba" oder "privat"
- `pflegekasse_budget` → Monatliches Budget (z.B. 1497.00 für Pflegegrad 3)

## Hilfreiche SQL-Queries

### Alle Klienten mit Anzahl Leistungen

```sql
SELECT
  k.name || ', ' || k.vorname AS name,
  k.pflegegrad,
  COUNT(bl.id) AS anzahl_leistungen
FROM klienten k
LEFT JOIN bewilligungen b ON k.id = b.klienten_id
LEFT JOIN bewilligte_leistungen bl ON b.bewilligungs_id = bl.bewilligungs_id
GROUP BY k.id, k.name, k.vorname, k.pflegegrad
ORDER BY k.name;
```

### Berechne Gesamtkosten für eine Bewilligung

```sql
SELECT
  bl.bewilligungs_id,
  SUM(
    lk.einzelpreis *
    COALESCE(bl.genehmigt_pro_monat, berechne_monatsmenge(bl.genehmigt_pro_woche))
  ) AS gesamtkosten_lk,
  berechne_zinv(
    SUM(
      lk.einzelpreis *
      COALESCE(bl.genehmigt_pro_monat, berechne_monatsmenge(bl.genehmigt_pro_woche))
    )
  ) AS zinv_betrag
FROM bewilligte_leistungen bl
JOIN leistungskomplexe lk ON bl.lk_code = lk.lk_code
WHERE bl.bewilligungs_id = 'BEW-001'
GROUP BY bl.bewilligungs_id;
```

### Aktive Bewilligungen anzeigen

```sql
SELECT * FROM v_bewilligungen_komplett
WHERE status = 'aktiv'
  AND zeitraum_von <= CURRENT_DATE
  AND zeitraum_bis >= CURRENT_DATE;
```

## Troubleshooting

### Problem: "No clients found in database"
- ✅ Überprüfe, ob die Tabellen erstellt wurden (Table Editor)
- ✅ Überprüfe, ob Daten in den Tabellen sind
- ✅ Überprüfe die RLS Policies (sollten "Enable all access" haben)
- ✅ Überprüfe Browser-Konsole für Fehlermeldungen

### Problem: "NEXT_PUBLIC_SUPABASE_KEY ist nicht konfiguriert"
- ✅ Überprüfe `.env.local` Datei
- ✅ Key muss mit `NEXT_PUBLIC_` beginnen
- ✅ Starte Dev-Server neu nach Änderungen

### Problem: Foreign Key Constraint Error
- ✅ Stelle sicher, dass Klienten vor Bewilligungen eingefügt werden
- ✅ Stelle sicher, dass LK-Codes in `leistungskomplexe` existieren
- ✅ Verwende die korrekten UUIDs und IDs

### Problem: Leistungen werden nicht angezeigt
- ✅ Überprüfe, ob `bewilligungs_id` in `bewilligte_leistungen` korrekt ist
- ✅ Muss exakt mit `bewilligungs_id` in `bewilligungen` Tabelle übereinstimmen
- ✅ Nicht verwechseln mit der UUID `id` Spalte!

## Nächste Schritte

1. ✅ Schema erstellt → `supabase-schema-new.sql` ausführen
2. ✅ Daten importiert → `supabase-seed-data.sql` ausführen
3. ✅ App testen → `npm run dev`
4. 📝 Weitere Klienten hinzufügen (siehe Schritt 3)
5. 🚀 Deployment zu Vercel mit `NEXT_PUBLIC_SUPABASE_KEY` Environment Variable

## Wichtige Dateien

- `supabase-schema-new.sql` - Datenbank-Schema (Tabellen, Views, Functions)
- `supabase-seed-data.sql` - Beispiel-Daten zum Import
- `lib/supabase-client.ts` - Supabase Client mit TypeScript Types
- `lib/seedData.ts` - Lädt Daten aus Supabase oder Fallback
- `SUPABASE_SETUP_V2.md` - Diese Anleitung
