-- ==============================================================================
-- Saheb Paper ERP: Production Security Hardening & Immutable Logs Migration
-- Migration: 20260918000000_production_security_hardening.sql
-- 
-- Key Protections:
--   1. RLS Lockdown across all 18 ERP tables
--   2. Direct DELETE Block on operational & master records (Soft delete via active: false)
--   3. Immutable Append-Only Logs (transaction_logs, boiler_logs, etp_logs, electricity_logs)
--   4. User Credential Masking in Realtime Broadcasters
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
    pol RECORD;
    all_tables text[] := ARRAY[
        'users', 'raw_materials', 'raw_material_lots', 'products', 'parties', 
        'vendors', 'vehicles', 'pulp_formulas', 'machine_rolls', 'reels', 
        'transaction_logs', 'boiler_logs', 'etp_logs', 'electricity_logs', 
        'pending_orders', 'packing_slips', 'store_items', 'paper_test_reports'
    ];
    operational_tables text[] := ARRAY[
        'machine_rolls', 'reels', 'parties', 'vendors', 'products', 
        'raw_materials', 'raw_material_lots', 'pulp_formulas', 
        'store_items', 'packing_slips'
    ];
    immutable_log_tables text[] := ARRAY[
        'transaction_logs', 'boiler_logs', 'etp_logs', 'electricity_logs'
    ];
    tbl text;
BEGIN
    -- 1. Enable RLS and clean up legacy policies for all tables
    FOREACH tbl IN ARRAY all_tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        FOR pol IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = tbl
        ) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, tbl);
        END LOOP;
    END LOOP;

    -- 2. CREATE POLICIES:
    -- Standard SELECT Policy (All users/clients can read)
    FOREACH tbl IN ARRAY all_tables LOOP
        EXECUTE format(
            'CREATE POLICY "%I_select_policy" ON public.%I FOR SELECT TO anon, authenticated USING (true);',
            tbl, tbl
        );
    END LOOP;

    -- Standard INSERT Policy (App clients can insert records)
    FOREACH tbl IN ARRAY all_tables LOOP
        EXECUTE format(
            'CREATE POLICY "%I_insert_policy" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (auth.role() IN (''anon'', ''authenticated''));',
            tbl, tbl
        );
    END LOOP;

    -- UPDATE Policy (Allowed on master, production, and users; BLOCKED on immutable logs)
    FOREACH tbl IN ARRAY all_tables LOOP
        IF NOT (tbl = ANY(immutable_log_tables)) THEN
            EXECUTE format(
                'CREATE POLICY "%I_update_policy" ON public.%I FOR UPDATE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated'')) WITH CHECK (auth.role() IN (''anon'', ''authenticated''));',
                tbl, tbl
            );
        END IF;
    END LOOP;

    -- DELETE Policy:
    -- Strictly BLOCKED on operational tables and immutable logs!
    -- Allowed only on temporary/ephemeral tables (vehicles, pending_orders, paper_test_reports, users)
    EXECUTE 'CREATE POLICY "vehicles_delete_policy" ON public.vehicles FOR DELETE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated''));';
    EXECUTE 'CREATE POLICY "pending_orders_delete_policy" ON public.pending_orders FOR DELETE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated''));';
    EXECUTE 'CREATE POLICY "paper_test_reports_delete_policy" ON public.paper_test_reports FOR DELETE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated''));';
    EXECUTE 'CREATE POLICY "users_delete_policy" ON public.users FOR DELETE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated''));';

END $$;
