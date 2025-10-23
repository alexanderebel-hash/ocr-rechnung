-- =====================================================
-- DomusVita OCR Database Schema - Professional Version
-- =====================================================
-- This schema provides a complete database structure for
-- managing care service authorizations and invoicing.
--
-- Run this SQL in your Supabase SQL Editor to create all tables.
-- =====================================================

-- =====================================================
-- 1. PFLEGEDIENST (Care Service Provider)
-- =====================================================
CREATE TABLE IF NOT EXISTS pflegedienst (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  strasse TEXT NOT NULL,
  hausnummer TEXT NOT NULL,
  plz TEXT NOT NULL,
  ort TEXT NOT NULL,
  telefon TEXT NOT NULL,
  email TEXT NOT NULL,
  web TEXT,
  ik_nummer TEXT NOT NULL UNIQUE,
  hrb TEXT,
  bank_name TEXT,
  iban TEXT,
  bic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. LEISTUNGSKOMPLEXE (Service Codes / LK-Codes)
-- =====================================================
CREATE TABLE IF NOT EXISTS leistungskomplexe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lk_code TEXT NOT NULL UNIQUE,
  bezeichnung TEXT NOT NULL,
  einzelpreis DECIMAL(10,2) NOT NULL,
  einheit TEXT DEFAULT 'mal',
  kategorie TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. KLIENTEN (Clients)
-- =====================================================
CREATE TABLE IF NOT EXISTS klienten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vorname TEXT,
  versichertennummer TEXT,
  pflegegrad INTEGER NOT NULL CHECK (pflegegrad >= 1 AND pflegegrad <= 5),
  strasse TEXT,
  hausnummer TEXT,
  plz TEXT,
  ort TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. BEZIRKSÄMTER (District Offices)
-- =====================================================
CREATE TABLE IF NOT EXISTS bezirksaemter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  standort TEXT,
  strasse TEXT,
  hausnummer TEXT,
  plz TEXT,
  ort TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. PFLEGEKASSEN (Care Insurance Companies)
-- =====================================================
CREATE TABLE IF NOT EXISTS pflegekassen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ikz TEXT,
  typ TEXT CHECK (typ IN ('gesetzlich', 'privat')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. BEWILLIGUNGEN (Authorizations)
-- =====================================================
CREATE TABLE IF NOT EXISTS bewilligungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bewilligungs_id TEXT UNIQUE,
  klienten_id UUID NOT NULL REFERENCES klienten(id) ON DELETE CASCADE,
  bezirksamt_id UUID REFERENCES bezirksaemter(id),
  pflegekasse_id UUID REFERENCES pflegekassen(id),
  genehmigungsnummer TEXT,
  zeitraum_von DATE NOT NULL,
  zeitraum_bis DATE NOT NULL,
  leistungsgrundlage TEXT,
  pflegekasse_budget DECIMAL(10,2),
  zinv_prozentsatz DECIMAL(5,2) DEFAULT 3.38,
  zinv_berechnungsmodus TEXT DEFAULT 'ba' CHECK (zinv_berechnungsmodus IN ('ba', 'privat')),
  status TEXT NOT NULL DEFAULT 'aktiv' CHECK (status IN ('aktiv', 'abgelaufen', 'gekündigt')),
  erstellt_am TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. BEWILLIGTE LEISTUNGEN (Authorized Services)
-- =====================================================
CREATE TABLE IF NOT EXISTS bewilligte_leistungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bewilligungs_id TEXT NOT NULL,
  lk_code TEXT NOT NULL,
  genehmigt_pro_woche DECIMAL(10,2),
  genehmigt_pro_monat DECIMAL(10,2),
  bemerkung TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_bewilligung FOREIGN KEY (bewilligungs_id) REFERENCES bewilligungen(bewilligungs_id) ON DELETE CASCADE,
  CONSTRAINT fk_leistung FOREIGN KEY (lk_code) REFERENCES leistungskomplexe(lk_code)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_klienten_name ON klienten(name);
CREATE INDEX IF NOT EXISTS idx_klienten_versichertennummer ON klienten(versichertennummer);
CREATE INDEX IF NOT EXISTS idx_bewilligungen_klienten_id ON bewilligungen(klienten_id);
CREATE INDEX IF NOT EXISTS idx_bewilligungen_status ON bewilligungen(status);
CREATE INDEX IF NOT EXISTS idx_bewilligungen_zeitraum ON bewilligungen(zeitraum_von, zeitraum_bis);
CREATE INDEX IF NOT EXISTS idx_bewilligte_leistungen_bewilligungs_id ON bewilligte_leistungen(bewilligungs_id);
CREATE INDEX IF NOT EXISTS idx_bewilligte_leistungen_lk_code ON bewilligte_leistungen(lk_code);
CREATE INDEX IF NOT EXISTS idx_pflegedienst_ik ON pflegedienst(ik_nummer);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE pflegedienst ENABLE ROW LEVEL SECURITY;
ALTER TABLE leistungskomplexe ENABLE ROW LEVEL SECURITY;
ALTER TABLE klienten ENABLE ROW LEVEL SECURITY;
ALTER TABLE bezirksaemter ENABLE ROW LEVEL SECURITY;
ALTER TABLE pflegekassen ENABLE ROW LEVEL SECURITY;
ALTER TABLE bewilligungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE bewilligte_leistungen ENABLE ROW LEVEL SECURITY;

-- Public access policies (you can restrict these later)
CREATE POLICY "Enable all access for all users" ON pflegedienst FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON leistungskomplexe FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON klienten FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON bezirksaemter FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON pflegekassen FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON bewilligungen FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON bewilligte_leistungen FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate monthly quantity from weekly quantity
CREATE OR REPLACE FUNCTION berechne_monatsmenge(wochenmenge DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(wochenmenge * 4.33, 2);
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate ZINV (investment costs)
CREATE OR REPLACE FUNCTION berechne_zinv(
  betrag DECIMAL,
  zinv_prozent DECIMAL DEFAULT 3.38,
  modus VARCHAR DEFAULT 'ba'
) RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(betrag * (zinv_prozent / 100), 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_pflegedienst_updated_at BEFORE UPDATE ON pflegedienst
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leistungskomplexe_updated_at BEFORE UPDATE ON leistungskomplexe
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_klienten_updated_at BEFORE UPDATE ON klienten
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bezirksaemter_updated_at BEFORE UPDATE ON bezirksaemter
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pflegekassen_updated_at BEFORE UPDATE ON pflegekassen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bewilligungen_updated_at BEFORE UPDATE ON bewilligungen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bewilligte_leistungen_updated_at BEFORE UPDATE ON bewilligte_leistungen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS
-- =====================================================

-- Complete authorization view with all related data
CREATE OR REPLACE VIEW v_bewilligungen_komplett AS
SELECT
  b.id,
  b.bewilligungs_id,
  k.name || COALESCE(', ' || k.vorname, '') AS klient_name,
  k.name AS klient_nachname,
  k.vorname AS klient_vorname,
  k.versichertennummer,
  k.pflegegrad,
  k.strasse || ' ' || COALESCE(k.hausnummer, '') AS klient_adresse,
  k.plz || ' ' || COALESCE(k.ort, '') AS klient_ort,
  ba.name AS bezirksamt,
  ba.standort AS ba_standort,
  b.genehmigungsnummer,
  b.zeitraum_von,
  b.zeitraum_bis,
  pk.name AS pflegekasse,
  b.pflegekasse_budget,
  b.zinv_prozentsatz,
  b.zinv_berechnungsmodus,
  b.status,
  b.erstellt_am
FROM bewilligungen b
JOIN klienten k ON b.klienten_id = k.id
LEFT JOIN bezirksaemter ba ON b.bezirksamt_id = ba.id
LEFT JOIN pflegekassen pk ON b.pflegekasse_id = pk.id;

-- Detailed authorized services view
CREATE OR REPLACE VIEW v_bewilligte_leistungen_detail AS
SELECT
  bl.id,
  bl.bewilligungs_id,
  bl.lk_code,
  lk.bezeichnung,
  lk.einzelpreis,
  lk.einheit,
  lk.kategorie,
  bl.genehmigt_pro_woche,
  CASE
    WHEN bl.genehmigt_pro_monat IS NULL AND bl.genehmigt_pro_woche IS NOT NULL
    THEN berechne_monatsmenge(bl.genehmigt_pro_woche)
    ELSE bl.genehmigt_pro_monat
  END AS genehmigt_pro_monat_berechnet,
  bl.bemerkung
FROM bewilligte_leistungen bl
JOIN leistungskomplexe lk ON bl.lk_code = lk.lk_code;

-- Complete client overview with authorization count
CREATE OR REPLACE VIEW v_klienten_overview AS
SELECT
  k.id,
  k.name,
  k.vorname,
  k.name || COALESCE(', ' || k.vorname, '') AS full_name,
  k.pflegegrad,
  k.strasse || ' ' || COALESCE(k.hausnummer, '') AS adresse,
  k.plz || ' ' || COALESCE(k.ort, '') AS ort,
  COUNT(DISTINCT b.id) as anzahl_bewilligungen,
  COUNT(DISTINCT bl.id) as anzahl_leistungen,
  MAX(b.zeitraum_bis) as letzte_bewilligung_bis
FROM klienten k
LEFT JOIN bewilligungen b ON k.id = b.klienten_id
LEFT JOIN bewilligte_leistungen bl ON b.bewilligungs_id = bl.bewilligungs_id
GROUP BY k.id, k.name, k.vorname, k.pflegegrad, k.strasse, k.hausnummer, k.plz, k.ort
ORDER BY k.name;
