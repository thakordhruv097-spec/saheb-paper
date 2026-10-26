-- ==============================================================================
-- SAHEB PAPER ERP - DROP UNUSED MODULE TABLES (DEMO DATABASE: scyiwfqkknuphzhvklok)
-- 
-- Modules Removed:
--   1. Raw Material Stock (raw_materials, raw_material_lots)
--   2. Pulp Mill Operations (pulp_formulas)
--   3. Lab Quality Control (paper_test_reports)
--   4. Utilities & ETP (boiler_logs, etp_logs, electricity_logs)
--   5. Order Bookings (pending_orders)
--   6. Spares Store (store_items)
--
-- Retained Tables (100% Intact & Active):
--   - machine_rolls & reels (Rewinder Roll-to-Reel & Stock Categorization)
--   - packing_slips (Dispatch Receipt)
--   - products, parties, vendors, vehicles (Admin Masters & Label Studio)
--   - users & transaction_logs (Access & Audit Trail)
-- ==============================================================================

DROP TABLE IF EXISTS public.raw_materials CASCADE;
DROP TABLE IF EXISTS public.raw_material_lots CASCADE;
DROP TABLE IF EXISTS public.pulp_formulas CASCADE;
DROP TABLE IF EXISTS public.paper_test_reports CASCADE;
DROP TABLE IF EXISTS public.boiler_logs CASCADE;
DROP TABLE IF EXISTS public.etp_logs CASCADE;
DROP TABLE IF EXISTS public.electricity_logs CASCADE;
DROP TABLE IF EXISTS public.pending_orders CASCADE;
DROP TABLE IF EXISTS public.store_items CASCADE;
