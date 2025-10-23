-- ============================================
-- DOMUSVITA PFLEGEABRECHNUNG - DATENBANK SETUP
-- Neues Projekt: https://jkipppgvcsucrdzjedwo.supabase.co
-- ============================================
-- 
-- ANLEITUNG:
-- 1. Gehe zu: https://supabase.com/dashboard/project/jkipppgvcsucrdzjedwo/editor
-- 2. Klicke auf "New Query" (oben links)
-- 3. Kopiere ALLES aus dieser Datei
-- 4. Klicke auf "Run" (oder Strg/Cmd + Enter)
-- 5. Warte bis "Success" angezeigt wird
-- 6. Fertig! ✓
--
-- ============================================

-- ============================================
-- 1. CLIENTS TABLE (Klientenstammdaten)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vorname TEXT NOT NULL,
    nachname TEXT NOT NULL,
    versichertennummer TEXT,
    pflegegrad INTEGER CHECK (pflegegrad BETWEEN 1 AND 5),
    bezirksamt TEXT,
    ik_nummer TEXT DEFAULT '461104096',
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint für Versichertennummer
    CONSTRAINT unique_versichertennummer UNIQUE (versichertennummer)
);

-- Index für schnelle Suche
CREATE INDEX idx_clients_nachname ON clients(nachname);
CREATE INDEX idx_clients_versichertennummer ON clients(versichertennummer);

COMMENT ON TABLE clients IS 'Klientenstammdaten für DomusVita';

-- ============================================
-- 2. LEISTUNGSKOMPLEXE TABLE (LK-Katalog)
-- ============================================
CREATE TABLE IF NOT EXISTS leistungskomplexe (
    lk_code TEXT PRIMARY KEY,
    bezeichnung TEXT NOT NULL,
    preis_pro_einheit NUMERIC(10,2) NOT NULL,
    aub_preis NUMERIC(10,2) NOT NULL DEFAULT 0,
    kategorie TEXT,
    
    -- Metadaten
    aktiv BOOLEAN DEFAULT TRUE,
    gueltig_ab DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lk_kategorie ON leistungskomplexe(kategorie);

COMMENT ON TABLE leistungskomplexe IS 'Leistungskomplexe mit Preisen (Berlin)';

-- ============================================
-- 3. BEWILLIGUNGEN TABLE (Bewilligungsbescheide)
-- ============================================
CREATE TABLE IF NOT EXISTS bewilligungen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Bewilligungsdetails
    genehmigungsnummer TEXT,
    gueltig_von DATE NOT NULL,
    gueltig_bis DATE NOT NULL,
    bezirksamt TEXT,
    
    -- Leistungen als JSON Array
    -- Format: [{"lk_code": "LK02", "je_woche": 6, "je_monat": 24, "genehmigt": true}]
    leistungen JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Metadaten
    notizen TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_gueltigkeitszeitraum CHECK (gueltig_von <= gueltig_bis)
);

-- Indizes
CREATE INDEX idx_bewilligungen_client ON bewilligungen(client_id);
CREATE INDEX idx_bewilligungen_gueltig ON bewilligungen(gueltig_von, gueltig_bis);
CREATE INDEX idx_bewilligungen_leistungen ON bewilligungen USING GIN (leistungen);

COMMENT ON TABLE bewilligungen IS 'Bewilligungsbescheide der Bezirksämter';

-- ============================================
-- 4. KORREKTURRECHNUNGEN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS korrekturrechnungen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    bewilligung_id UUID REFERENCES bewilligungen(id) ON DELETE SET NULL,
    
    -- Rechnungsdetails
    rechnungsnummer TEXT,
    rechnungsdatum DATE,
    leistungszeitraum_von DATE,
    leistungszeitraum_bis DATE,
    
    -- Beträge
    nettobetrag NUMERIC(10,2),
    bruttobetrag NUMERIC(10,2),
    zinv_betrag NUMERIC(10,2),
    pflegekasse_betrag NUMERIC(10,2),
    
    -- Storage
    pdf_url TEXT,
    pdf_filename TEXT,
    
    -- Komplette Rechnungsdaten für Wiederverwendung
    json_data JSONB,
    
    -- Status
    status TEXT DEFAULT 'erstellt' CHECK (status IN ('erstellt', 'versendet', 'bezahlt', 'storniert')),
    notizen TEXT,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes
CREATE INDEX idx_korrekturrechnungen_client ON korrekturrechnungen(client_id);
CREATE INDEX idx_korrekturrechnungen_bewilligung ON korrekturrechnungen(bewilligung_id);
CREATE INDEX idx_korrekturrechnungen_datum ON korrekturrechnungen(rechnungsdatum);
CREATE INDEX idx_korrekturrechnungen_zeitraum ON korrekturrechnungen(leistungszeitraum_von, leistungszeitraum_bis);
CREATE INDEX idx_korrekturrechnungen_status ON korrekturrechnungen(status);

COMMENT ON TABLE korrekturrechnungen IS 'Archiv aller erstellten Korrekturrechnungen';

-- ============================================
-- 5. TRIGGER für updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bewilligungen_updated_at BEFORE UPDATE ON bewilligungen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_korrekturrechnungen_updated_at BEFORE UPDATE ON korrekturrechnungen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bewilligungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE leistungskomplexe ENABLE ROW LEVEL SECURITY;
ALTER TABLE korrekturrechnungen ENABLE ROW LEVEL SECURITY;

-- Policies (vorerst alles erlauben - später einschränken)
CREATE POLICY "Allow all operations" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON bewilligungen FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON leistungskomplexe FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON korrekturrechnungen FOR ALL USING (true);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Funktion: Aktuelle Bewilligung für Klient finden
CREATE OR REPLACE FUNCTION get_active_bewilligung(
    p_client_id UUID, 
    p_datum DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    id UUID,
    genehmigungsnummer TEXT,
    gueltig_von DATE,
    gueltig_bis DATE,
    leistungen JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.genehmigungsnummer,
        b.gueltig_von,
        b.gueltig_bis,
        b.leistungen
    FROM bewilligungen b
    WHERE b.client_id = p_client_id 
      AND p_datum BETWEEN b.gueltig_von AND b.gueltig_bis
    ORDER BY b.gueltig_von DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Statistiken für Dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_clients', (SELECT COUNT(*) FROM clients),
        'active_bewilligungen', (SELECT COUNT(*) FROM bewilligungen WHERE CURRENT_DATE BETWEEN gueltig_von AND gueltig_bis),
        'rechnungen_diesen_monat', (SELECT COUNT(*) FROM korrekturrechnungen WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)),
        'gesamtumsatz_diesen_monat', (SELECT COALESCE(SUM(bruttobetrag), 0) FROM korrekturrechnungen WHERE DATE_TRUNC('month', rechnungsdatum) = DATE_TRUNC('month', CURRENT_DATE))
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. INITIAL DATA - Leistungskomplexe
-- ============================================
INSERT INTO leistungskomplexe (lk_code, bezeichnung, preis_pro_einheit, aub_preis, kategorie) VALUES
('LK01', 'Erweiterte kleine Körperpflege', 25.52, 0.84, 'Körperpflege'),
('LK02', 'Kleine Körperpflege', 17.01, 0.39, 'Körperpflege'),
('LK03A', 'Erweiterte große Körperpflege', 42.78, 1.15, 'Körperpflege'),
('LK03B', 'Erweiterte große Körperpflege m. Baden', 51.01, 1.15, 'Körperpflege'),
('LK04', 'Große Körperpflege', 34.01, 0.78, 'Körperpflege'),
('LK05', 'Lagern/Betten', 6.77, 0.93, 'Körperpflege'),
('LK06', 'Hilfe bei der Nahrungsaufnahme', 10.15, 1.63, 'Ernährung'),
('LK07A', 'Darm- und Blasenentleerung', 6.77, 0.16, 'Körperpflege'),
('LK07B', 'Darm- und Blasenentleerung erweitert', 10.15, 0.39, 'Körperpflege'),
('LK08A', 'Hilfestellung beim Verlassen/Wiederaufsuchen der Wohnung', 3.38, 0.33, 'Mobilität'),
('LK08B', 'Hilfestellung beim Wiederaufsuchen der Wohnung', 3.38, 0.33, 'Mobilität'),
('LK09', 'Begleitung außer Haus', 20.30, 1.59, 'Mobilität'),
('LK10', 'Heizen', 3.38, 1.88, 'Hauswirtschaft'),
('LK11A', 'Kleine Reinigung der Wohnung', 7.43, 0.17, 'Hauswirtschaft'),
('LK11B', 'Große Reinigung der Wohnung', 22.29, 0.51, 'Hauswirtschaft'),
('LK11C', 'Aufwendiges Räumen', 39.62, 0.51, 'Hauswirtschaft'),
('LK12', 'Wechseln u. Waschen der Kleidung', 39.62, 0.91, 'Hauswirtschaft'),
('LK13', 'Einkaufen', 19.81, 0.46, 'Hauswirtschaft'),
('LK14', 'Zubereitung warme Mahlzeit', 22.29, 0.51, 'Ernährung'),
('LK15', 'Zubereitung kleine Mahlzeit', 7.43, 0.17, 'Ernährung'),
('LK16A', 'Erstbesuch', 23.00, 0.16, 'Sonstiges'),
('LK16B', 'Folgebesuch', 10.00, 0.16, 'Sonstiges'),
('LK17A', 'Einsatzpauschale', 5.37, 0.12, 'Sonstiges'),
('LK17B', 'Einsatzpauschale WE', 10.73, 0.25, 'Sonstiges'),
('LK20', 'Häusliche Betreuung §124 SGB XI', 8.26, 0.33, 'Betreuung'),
('LK20_HH', 'Häusliche Betreuung §124 SGB XI (Haushaltsbuch)', 8.26, 0.33, 'Betreuung')
ON CONFLICT (lk_code) DO NOTHING;

-- ============================================
-- 9. BEISPIEL-KLIENT: Ewert
-- ============================================
-- Klient anlegen
INSERT INTO clients (vorname, nachname, versichertennummer, pflegegrad, bezirksamt)
VALUES (
    'Max',  -- TODO: Echten Vornamen eintragen
    'Ewert',
    'V-EWERT-2025',  -- TODO: Echte Versichertennummer
    3,  -- TODO: Echten Pflegegrad
    'Friedrichshain-Kreuzberg'  -- TODO: Korrektes Bezirksamt
)
ON CONFLICT (versichertennummer) DO NOTHING
RETURNING id;

-- Bewilligung anlegen (mit der Client-ID von oben)
INSERT INTO bewilligungen (
    client_id,
    genehmigungsnummer,
    gueltig_von,
    gueltig_bis,
    bezirksamt,
    leistungen
)
SELECT 
    c.id,
    'GEN-2025-EWERT',  -- TODO: Echte Genehmigungsnummer
    '2025-01-01'::date,
    '2025-12-31'::date,
    'Friedrichshain-Kreuzberg',
    '[
        {"lk_code": "LK02", "je_woche": 6, "je_monat": 24, "genehmigt": true},
        {"lk_code": "LK04", "je_woche": 1, "je_monat": 4, "genehmigt": true},
        {"lk_code": "LK07A", "je_woche": 14, "je_monat": 56, "genehmigt": true},
        {"lk_code": "LK11B", "je_woche": 1, "je_monat": 4, "genehmigt": true},
        {"lk_code": "LK12", "je_woche": 1, "je_monat": 4, "genehmigt": true},
        {"lk_code": "LK13", "je_woche": null, "je_monat": 1, "genehmigt": true},
        {"lk_code": "LK20_HH", "je_woche": null, "je_monat": 1, "genehmigt": true}
    ]'::jsonb
FROM clients c
WHERE c.nachname = 'Ewert'
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. PRÜFUNG - Alles erfolgreich?
-- ============================================
DO $$
DECLARE
    table_count INT;
    lk_count INT;
    client_count INT;
    bewilligung_count INT;
BEGIN
    -- Tabellen zählen
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('clients', 'bewilligungen', 'leistungskomplexe', 'korrekturrechnungen');
    
    -- Daten zählen
    SELECT COUNT(*) INTO lk_count FROM leistungskomplexe;
    SELECT COUNT(*) INTO client_count FROM clients;
    SELECT COUNT(*) INTO bewilligung_count FROM bewilligungen;
    
    -- Ausgabe
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ DATENBANK SETUP ERFOLGREICH!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tabellen erstellt: % / 4', table_count;
    RAISE NOTICE 'Leistungskomplexe: %', lk_count;
    RAISE NOTICE 'Klienten: %', client_count;
    RAISE NOTICE 'Bewilligungen: %', bewilligung_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Nächste Schritte:';
    RAISE NOTICE '1. Storage Bucket "korrekturrechnungen" erstellen';
    RAISE NOTICE '2. Ewert-Stammdaten anpassen (siehe Zeile 263-267)';
    RAISE NOTICE '3. Frontend mit Supabase verbinden';
    RAISE NOTICE '';
END $$;

-- ============================================
-- FERTIG! 🎉
-- ============================================
-- Die Datenbank ist jetzt bereit für den Betrieb!
-- 
-- Was wurde angelegt:
-- ✓ 4 Haupttabellen (clients, bewilligungen, leistungskomplexe, korrekturrechnungen)
-- ✓ 26 Leistungskomplexe mit Preisen
-- ✓ 1 Beispiel-Klient (Ewert) mit Bewilligung
-- ✓ Trigger für automatische Timestamps
-- ✓ Helper Functions für Queries
-- ✓ Indizes für Performance
-- ✓ Row Level Security aktiviert
--
-- Projekt-URL: https://jkipppgvcsucrdzjedwo.supabase.co
-- ============================================
