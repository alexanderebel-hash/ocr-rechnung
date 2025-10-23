# 🚀 SCHNELLSTART - DomusVita Pflegeabrechnung

## ✅ Projekt-Credentials

```
Project URL: https://jkipppgvcsucrdzjedwo.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraXBwcGd2Y3N1Y3JkemplZHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTQ3MDIsImV4cCI6MjA3Njc3MDcwMn0.R1PvND9HHQTSWIq3Z9xY_GTmmSV2W6iS1W_IwFMFlm0
```

---

## 📋 SETUP IN 3 SCHRITTEN

### **Schritt 1: Datenbank aufsetzen (2 Min)**

1. Öffne: https://supabase.com/dashboard/project/jkipppgvcsucrdzjedwo/editor
2. Klicke auf **"New Query"**
3. Kopiere **ALLES** aus der Datei `01_MAIN_SETUP.sql`
4. Klicke auf **"Run"** (grüner Button oder Strg+Enter)
5. Warte bis "Success" erscheint ✓

**Was passiert:**
- ✅ 4 Tabellen werden erstellt (clients, bewilligungen, leistungskomplexe, korrekturrechnungen)
- ✅ 26 Leistungskomplexe mit Preisen werden importiert
- ✅ Beispiel-Klient "Ewert" mit Bewilligung wird angelegt
- ✅ Helper-Functions für einfache Queries werden erstellt

---

### **Schritt 2: Storage Bucket erstellen (1 Min)**

1. Öffne: https://supabase.com/dashboard/project/jkipppgvcsucrdzjedwo/storage/buckets
2. Klicke auf **"New Bucket"**
3. Einstellungen:
   - **Name:** `korrekturrechnungen`
   - **Public:** ❌ AUS
4. Klicke auf **"Create bucket"**
5. ✅ Fertig!

_(Detaillierte Anleitung in `02_STORAGE_SETUP.txt`)_

---

### **Schritt 3: Ewert-Stammdaten anpassen (Optional)**

Die Beispieldaten für Ewert sind:
- Vorname: Max
- Versichertennummer: V-EWERT-2025
- Pflegegrad: 3
- Bezirksamt: Friedrichshain-Kreuzberg

**Zum Ändern:**
1. Gehe zu: https://supabase.com/dashboard/project/jkipppgvcsucrdzjedwo/editor
2. Klicke auf "Table Editor" (linkes Menü)
3. Wähle Tabelle **"clients"**
4. Bearbeite die Ewert-Zeile
5. Speichern ✓

---

## 🗂️ DATENBANK-STRUKTUR

```
📦 clients (Klientenstammdaten)
├─ id (UUID)
├─ vorname, nachname
├─ versichertennummer
├─ pflegegrad (1-5)
└─ bezirksamt

📦 bewilligungen (Bewilligungsbescheide)
├─ id (UUID)
├─ client_id → clients.id
├─ genehmigungsnummer
├─ gueltig_von, gueltig_bis
└─ leistungen (JSONB)
    └─ [{lk_code, je_woche, je_monat, genehmigt}]

📦 leistungskomplexe (LK-Katalog)
├─ lk_code (PRIMARY KEY)
├─ bezeichnung
├─ preis_pro_einheit
├─ aub_preis
└─ kategorie

📦 korrekturrechnungen (Archiv)
├─ id (UUID)
├─ client_id → clients.id
├─ bewilligung_id → bewilligungen.id
├─ rechnungsnummer
├─ rechnungsdatum
├─ leistungszeitraum_von/bis
├─ nettobetrag, bruttobetrag
├─ pdf_url (Storage)
├─ json_data (JSONB - komplette Rechnungsdaten)
└─ status (erstellt/versendet/bezahlt/storniert)
```

---

## 🔌 FRONTEND-INTEGRATION

### Next.js / React

```bash
npm install @supabase/supabase-js
```

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://jkipppgvcsucrdzjedwo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraXBwcGd2Y3N1Y3JkemplZHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTQ3MDIsImV4cCI6MjA3Njc3MDcwMn0.R1PvND9HHQTSWIq3Z9xY_GTmmSV2W6iS1W_IwFMFlm0'
)
```

### Beispiel-Queries

```typescript
// Alle Klienten laden
const { data: clients } = await supabase
  .from('clients')
  .select('*')
  .order('nachname')

// Aktive Bewilligung für Klient finden
const { data: bewilligung } = await supabase
  .from('bewilligungen')
  .select('*')
  .eq('client_id', clientId)
  .lte('gueltig_von', new Date().toISOString())
  .gte('gueltig_bis', new Date().toISOString())
  .single()

// Korrekturrechnung speichern
const { data, error } = await supabase
  .from('korrekturrechnungen')
  .insert({
    client_id: clientId,
    bewilligung_id: bewilligungId,
    rechnungsnummer: 'RN-2025-001',
    rechnungsdatum: '2025-01-15',
    leistungszeitraum_von: '2025-01-01',
    leistungszeitraum_bis: '2025-01-31',
    nettobetrag: 1234.56,
    bruttobetrag: 1234.56,
    pdf_url: 'storage-url',
    json_data: {...},
    status: 'erstellt'
  })

// PDF hochladen
const file = new File([pdfBlob], 'rechnung.pdf', { type: 'application/pdf' })
const { data, error } = await supabase.storage
  .from('korrekturrechnungen')
  .upload(`2025/01/${clientName}_${month}.pdf`, file)
```

---

## 🧪 TESTEN

### SQL-Tests im Dashboard

```sql
-- Alle Klienten anzeigen
SELECT * FROM clients;

-- Bewilligung mit Leistungen für Ewert
SELECT 
  c.nachname,
  b.genehmigungsnummer,
  b.gueltig_von,
  b.gueltig_bis,
  b.leistungen
FROM clients c
JOIN bewilligungen b ON b.client_id = c.id
WHERE c.nachname = 'Ewert';

-- Alle Leistungskomplexe mit Preisen
SELECT * FROM leistungskomplexe ORDER BY kategorie, lk_code;

-- Dashboard-Statistiken
SELECT * FROM get_dashboard_stats();

-- Aktive Bewilligung für Ewert finden (via Helper Function)
SELECT * FROM get_active_bewilligung(
  (SELECT id FROM clients WHERE nachname = 'Ewert'),
  CURRENT_DATE
);
```

---

## 📊 WORKFLOW

### Monat 1 (Erste Korrektur)
1. **Klient auswählen** (Ewert)
2. **Bewilligung laden** → ist schon in DB ✓
3. **Rechnung hochladen** → OCR
4. **Korrekturrechnung erstellen** (mit Claude)
5. **PDF generieren**
6. **"Speichern" klicken:**
   - PDF → Supabase Storage
   - Metadaten → `korrekturrechnungen` Tabelle
7. ✅ Fertig!

### Monat 2-12 (Folgemonate)
1. **Klient auswählen** (Ewert) → Bewilligung automatisch geladen ✓
2. **Neue Rechnung hochladen**
3. **Korrigieren → Speichern**
4. ✅ Fertig in 30 Sekunden!

---

## 🆘 HILFE & DEBUGGING

### Tabellen anzeigen
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### Daten löschen (für Neustart)
```sql
TRUNCATE clients, bewilligungen, korrekturrechnungen CASCADE;
```

### Alle Tabellen löschen (kompletter Reset)
```sql
DROP TABLE IF EXISTS korrekturrechnungen CASCADE;
DROP TABLE IF EXISTS bewilligungen CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS leistungskomplexe CASCADE;
```

---

## 📁 DATEIEN

- `01_MAIN_SETUP.sql` → Komplettes Datenbank-Setup (ALLES IN EINEM!)
- `02_STORAGE_SETUP.txt` → Anleitung für Storage Bucket
- `03_SCHNELLSTART.md` → Diese Datei
- `04_API_EXAMPLES.ts` → Frontend-Code-Beispiele (kommt noch)

---

## ✅ CHECKLISTE

- [ ] `01_MAIN_SETUP.sql` in Supabase ausgeführt
- [ ] Storage Bucket "korrekturrechnungen" erstellt
- [ ] Ewert-Stammdaten angepasst (optional)
- [ ] Frontend mit Supabase verbunden
- [ ] Erste Test-Rechnung erstellt

---

## 🎯 NÄCHSTE SCHRITTE

1. ✅ **Datenbank ist fertig!**
2. Als Nächstes baue ich:
   - UI zum Klienten-Auswahl (Dropdown)
   - Excel-Upload für neue Bewilligungen
   - "Speichern"-Button für PDFs
   - Archiv-Ansicht aller Korrekturrechnungen
   - Dashboard mit Statistiken

**Sag mir wenn Setup fertig ist, dann baue ich die UI! 🚀**
