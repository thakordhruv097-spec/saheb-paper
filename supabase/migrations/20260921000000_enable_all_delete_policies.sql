-- ==============================================================================
-- Saheb Paper ERP: Comprehensive DELETE RLS Policy Migration
-- Migration: 20260921000000_enable_all_delete_policies.sql
-- 
-- Allows DELETE operations for authorized app clients (anon & authenticated roles)
-- across all operational, log, and transactional tables so that:
--   1. Deleting a delivery challan / packing slip deletes it permanently in cloud
--   2. Deleting raw materials, products, parties, vendors, vehicles, users works
--   3. Factory Reset can successfully wipe cloud database tables
-- ==============================================================================

DO $$
DECLARE
    all_tables text[] := ARRAY[
        'users', 'raw_materials', 'raw_material_lots', 'products', 'parties', 
        'vendors', 'vehicles', 'pulp_formulas', 'machine_rolls', 'reels', 
        'transaction_logs', 'boiler_logs', 'etp_logs', 'electricity_logs', 
        'pending_orders', 'packing_slips', 'store_items', 'paper_test_reports'
    ];
    tbl text;
    pol RECORD;
BEGIN
    FOREACH tbl IN ARRAY all_tables LOOP
        -- Drop any existing DELETE policy on this table
        FOR pol IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = tbl AND cmd = 'DELETE'
        ) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, tbl);
        END LOOP;

        -- Create permissive DELETE policy for anon and authenticated roles
        EXECUTE format(
            'CREATE POLICY "%I_delete_policy" ON public.%I FOR DELETE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated''));',
            tbl, tbl
        );
    END LOOP;
END $$;
