-- DomusVita OCR Database Schema
-- Run this SQL in your Supabase SQL Editor to create the tables

-- Table: klienten (Clients)
CREATE TABLE IF NOT EXISTS klienten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pflegegrad INTEGER NOT NULL CHECK (pflegegrad >= 1 AND pflegegrad <= 5),
  adresse TEXT NOT NULL,
  pflegedienst TEXT NOT NULL,
  standort TEXT NOT NULL,
  stadtteil TEXT NOT NULL,
  pflegedienst_adresse TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: bewilligungen (Authorizations)
CREATE TABLE IF NOT EXISTS bewilligungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  klient_id UUID NOT NULL REFERENCES klienten(id) ON DELETE CASCADE,
  gueltig_von DATE NOT NULL,
  gueltig_bis DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'aktiv' CHECK (status IN ('aktiv', 'abgelaufen', 'gekündigt')),
  pflegedienst_name TEXT NOT NULL,
  pflegedienst_standort TEXT NOT NULL,
  pflegedienst_adresse TEXT NOT NULL,
  pflegedienst_telefon TEXT NOT NULL,
  pflegedienst_email TEXT NOT NULL,
  pflegedienst_ik TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: leistungen (Services/LK-Codes)
CREATE TABLE IF NOT EXISTS leistungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bewilligung_id UUID NOT NULL REFERENCES bewilligungen(id) ON DELETE CASCADE,
  lk_code TEXT NOT NULL,
  menge INTEGER NOT NULL CHECK (menge > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bewilligungen_klient_id ON bewilligungen(klient_id);
CREATE INDEX IF NOT EXISTS idx_leistungen_bewilligung_id ON leistungen(bewilligung_id);
CREATE INDEX IF NOT EXISTS idx_klienten_name ON klienten(name);
CREATE INDEX IF NOT EXISTS idx_bewilligungen_status ON bewilligungen(status);
CREATE INDEX IF NOT EXISTS idx_bewilligungen_dates ON bewilligungen(gueltig_von, gueltig_bis);

-- Enable Row Level Security (RLS)
ALTER TABLE klienten ENABLE ROW LEVEL SECURITY;
ALTER TABLE bewilligungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE leistungen ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can restrict this later)
CREATE POLICY "Enable read access for all users" ON klienten FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON klienten FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON klienten FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON klienten FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON bewilligungen FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON bewilligungen FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON bewilligungen FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON bewilligungen FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON leistungen FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON leistungen FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON leistungen FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON leistungen FOR DELETE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_klienten_updated_at BEFORE UPDATE ON klienten
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bewilligungen_updated_at BEFORE UPDATE ON bewilligungen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leistungen_updated_at BEFORE UPDATE ON leistungen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample view to see all data together (optional)
CREATE OR REPLACE VIEW klienten_overview AS
SELECT
  k.id as klient_id,
  k.name as klient_name,
  k.pflegegrad,
  k.standort,
  k.stadtteil,
  b.id as bewilligung_id,
  b.gueltig_von,
  b.gueltig_bis,
  b.status,
  COUNT(l.id) as anzahl_leistungen,
  SUM(l.menge) as total_menge
FROM klienten k
LEFT JOIN bewilligungen b ON k.id = b.klient_id
LEFT JOIN leistungen l ON b.id = l.bewilligung_id
GROUP BY k.id, k.name, k.pflegegrad, k.standort, k.stadtteil,
         b.id, b.gueltig_von, b.gueltig_bis, b.status
ORDER BY k.name;
