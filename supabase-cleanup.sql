-- =====================================================
-- CLEANUP SCRIPT - Remove old database schema
-- =====================================================
-- Run this BEFORE running supabase-schema-new.sql
-- This removes all old tables, views, and policies
-- =====================================================

-- Drop old views first
DROP VIEW IF EXISTS v_klienten_overview CASCADE;
DROP VIEW IF EXISTS v_bewilligte_leistungen_detail CASCADE;
DROP VIEW IF EXISTS v_bewilligungen_komplett CASCADE;

-- Drop old tables (in reverse order of dependencies)
DROP TABLE IF EXISTS bewilligte_leistungen CASCADE;
DROP TABLE IF EXISTS bewilligungen CASCADE;
DROP TABLE IF EXISTS pflegekassen CASCADE;
DROP TABLE IF EXISTS bezirksaemter CASCADE;
DROP TABLE IF EXISTS klienten CASCADE;
DROP TABLE IF EXISTS leistungen CASCADE;  -- Old simple schema table
DROP TABLE IF EXISTS leistungskomplexe CASCADE;
DROP TABLE IF EXISTS pflegedienst CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS berechne_zinv(DECIMAL, DECIMAL, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS berechne_monatsmenge(DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Success message
SELECT 'Database cleanup completed! Now run supabase-schema-new.sql' AS message;
