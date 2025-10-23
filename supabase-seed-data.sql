-- SQL Import für Bewilligungsdaten - DomusVita Pflegeabrechnung
-- Adresse: Waldemarstr. 12, 10999 Berlin

-- =====================================================
-- 1. PFLEGEDIENST STAMMDATEN
-- =====================================================
INSERT INTO pflegedienst (
  name, 
  strasse, 
  hausnummer,
  plz, 
  ort, 
  telefon, 
  email, 
  web, 
  ik_nummer, 
  hrb, 
  bank_name, 
  iban, 
  bic
) VALUES (
  'DomusVita Gesundheit GmbH',
  'Waldemarstr.',
  '12',
  '10999',
  'Berlin',
  '030/6120152-0',
  'kreuzberg@domusvita.de',
  'www.domusvita.de',
  '461104096',
  '87436 B',
  'Berliner Sparkasse',
  'DE53100500000190998890',
  'BELADEBEXXX'
);

-- =====================================================
-- 2. LEISTUNGSKOMPLEXE (LK) STAMMDATEN
-- =====================================================
INSERT INTO leistungskomplexe (lk_code, bezeichnung, einzelpreis, einheit, kategorie) VALUES
('LK02', 'LK02 Kleine Körperpflege', 17.01, 'mal', 'Grundpflege'),
('LK03b', 'LK03b Erweiterte große Körperpflege m. Baden', 51.02, 'mal', 'Grundpflege'),
('LK11b', 'LK11b Große Reinigung der Wohnung', 22.29, 'mal', 'Hauswirtschaft'),
('LK12', 'LK12 Wechseln u. Waschen der Kleidung', 39.62, 'mal', 'Hauswirtschaft'),
('LK13', 'LK13 Einkaufen', 19.81, 'mal', 'Hauswirtschaft'),
('LK14', 'LK14 Zubereitung warme Mahlzeit', 22.29, 'mal', 'Hauswirtschaft'),
('LK15', 'LK15 Zubereitung kleine Mahlzeit', 7.43, 'mal', 'Hauswirtschaft'),
('LK17a', 'LK17a Einsatzpauschale', 5.37, 'mal', 'Pauschale'),
('LK17b', 'LK17b Einsatzpauschale WE', 10.73, 'mal', 'Pauschale'),
('LK20.2', 'LK20.2 Häusliche Betreuung §124 SGB XI (Haushaltsbuch)', 8.26, 'mal', 'Betreuung');

-- =====================================================
-- 3. KLIENTEN STAMMDATEN
-- =====================================================
INSERT INTO klienten (name, vorname, versichertennummer, pflegegrad, strasse, hausnummer, plz, ort) VALUES
('Bollweber', 'Klaus', '12345678', 3, 'Hartriegelstr.', '132', '12439', 'Berlin'),
('Sweidan', 'Omar', '87654321', 4, 'Beispielstraße', '45', '10999', 'Berlin');

-- =====================================================
-- 4. BEZIRKSÄMTER STAMMDATEN
-- =====================================================
INSERT INTO bezirksaemter (name, standort, strasse, hausnummer, plz, ort) VALUES
('Bezirksamt Mitte von Berlin', 'Wedding', 'Müllerstraße', '146-147', '13344', 'Berlin'),
('Bezirksamt Friedrichshain-Kreuzberg', 'Kreuzberg', 'Yorckstraße', '4-11', '10965', 'Berlin');

-- =====================================================
-- 5. PFLEGEKASSEN STAMMDATEN
-- =====================================================
INSERT INTO pflegekassen (name, ikz, typ) VALUES
('AOK Nordost', '109876543', 'gesetzlich'),
('Barmer GEK', '109876544', 'gesetzlich');

-- =====================================================
-- 6. BEWILLIGUNGEN (Haupttabelle)
-- =====================================================
INSERT INTO bewilligungen (
  bewilligungs_id,
  klienten_id,
  bezirksamt_id,
  pflegekasse_id,
  genehmigungsnummer,
  zeitraum_von,
  zeitraum_bis,
  leistungsgrundlage,
  pflegekasse_budget,
  zinv_prozentsatz,
  zinv_berechnungsmodus,
  status,
  erstellt_am
) VALUES
(
  'BEW-001',
  (SELECT id FROM klienten WHERE versichertennummer = '12345678'),
  (SELECT id FROM bezirksaemter WHERE name = 'Bezirksamt Mitte von Berlin'),
  (SELECT id FROM pflegekassen WHERE name = 'AOK Nordost'),
  'BA-2025-001234',
  '2025-01-01',
  '2025-12-31',
  'SGB XI §36',
  1497.00,
  3.38,
  'ba',
  'aktiv',
  CURRENT_TIMESTAMP
),
(
  'BEW-002',
  (SELECT id FROM klienten WHERE versichertennummer = '87654321'),
  (SELECT id FROM bezirksaemter WHERE name = 'Bezirksamt Friedrichshain-Kreuzberg'),
  (SELECT id FROM pflegekassen WHERE name = 'Barmer GEK'),
  'BA-2025-005678',
  '2025-01-01',
  '2025-06-30',
  'SGB XI §36',
  1995.00,
  3.38,
  'ba',
  'aktiv',
  CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. BEWILLIGTE LEISTUNGEN (Detail-Tabelle)
-- =====================================================
INSERT INTO bewilligte_leistungen (
  bewilligungs_id,
  lk_code,
  genehmigt_pro_woche,
  genehmigt_pro_monat,
  bemerkung
) VALUES
-- Bewilligung BEW-001 (Tschida, Klaus)
('BEW-001', 'LK02', 10, NULL, 'erbracht, aktuell nicht bewilligt'),
('BEW-001', 'LK03b', 5, NULL, NULL),
('BEW-001', 'LK20.2', NULL, 3, NULL),

-- Bewilligung BEW-002 (Sweidan, Omar)
('BEW-002', 'LK02', 8, NULL, NULL),
('BEW-002', 'LK03b', NULL, 12, NULL),
('BEW-002', 'LK11b', 4, NULL, NULL);

-- =====================================================
-- 8. HILFSFUNKTIONEN
-- =====================================================

-- Funktion: Berechne monatliche Menge aus wöchentlicher Menge
CREATE OR REPLACE FUNCTION berechne_monatsmenge(wochenmenge DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(wochenmenge * 4.33, 2);
END;
$$ LANGUAGE plpgsql;

-- Funktion: Berechne ZINV
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
-- 9. VIEWS für einfache Abfragen
-- =====================================================

CREATE OR REPLACE VIEW v_bewilligungen_komplett AS
SELECT 
  b.bewilligungs_id,
  k.name || ', ' || k.vorname AS klient_name,
  k.versichertennummer,
  k.pflegegrad,
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
JOIN bezirksaemter ba ON b.bezirksamt_id = ba.id
JOIN pflegekassen pk ON b.pflegekasse_id = pk.id;

CREATE OR REPLACE VIEW v_bewilligte_leistungen_detail AS
SELECT 
  bl.bewilligungs_id,
  lk.lk_code,
  lk.bezeichnung,
  lk.einzelpreis,
  bl.genehmigt_pro_woche,
  CASE 
    WHEN bl.genehmigt_pro_monat IS NULL 
    THEN berechne_monatsmenge(bl.genehmigt_pro_woche)
    ELSE bl.genehmigt_pro_monat
  END AS genehmigt_pro_monat_berechnet,
  bl.bemerkung
FROM bewilligte_leistungen bl
JOIN leistungskomplexe lk ON bl.lk_code = lk.lk_code;

-- =====================================================
-- TESTABFRAGEN
-- =====================================================

-- Alle Bewilligungen anzeigen
-- SELECT * FROM v_bewilligungen_komplett;

-- Alle bewilligten Leistungen für eine Bewilligung
-- SELECT * FROM v_bewilligte_leistungen_detail WHERE bewilligungs_id = 'BEW-001';

-- Berechne Gesamtkosten für eine Bewilligung (Monat September 2025)
/*
SELECT 
  bewilligungs_id,
  SUM(einzelpreis * genehmigt_pro_monat_berechnet) AS gesamtkosten_lk,
  berechne_zinv(SUM(einzelpreis * genehmigt_pro_monat_berechnet), 3.38, 'ba') AS zinv_betrag
FROM v_bewilligte_leistungen_detail
WHERE bewilligungs_id = 'BEW-001'
GROUP BY bewilligungs_id;
*/
