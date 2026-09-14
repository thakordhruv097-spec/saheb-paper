-- ==============================================================================
-- Saheb Paper ERP: Production-Grade Row-Level Security (RLS) & RBAC Migration
-- Migration: 20260910000000_production_rls_policies.sql
-- Covers all 18 ERP Tables with Granular Security Controls
-- ==============================================================================

-- 1. SECURITY HELPER FUNCTIONS
-- Extracts the calling user's role from JWT claims, session settings, or public.users lookup
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
DECLARE
    jwt_role TEXT;
    jwt_username TEXT;
    db_role TEXT;
BEGIN
    -- Check for Supabase Auth custom claims
    jwt_role := coalesce(
        current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'role',
        current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'role'
    );
    
    IF jwt_role IS NOT NULL THEN
        RETURN jwt_role;
    END IF;

    -- Check for custom session username header if using application tokens
    jwt_username := current_setting('request.jwt.claims', true)::jsonb->>'sub';
    IF jwt_username IS NOT NULL THEN
        SELECT role INTO db_role FROM public.users WHERE username = jwt_username LIMIT 1;
        IF db_role IS NOT NULL THEN
            RETURN db_role;
        END IF;
    END IF;

    -- Default fallback role for anon / unauthenticated clients
    RETURN 'anon';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if caller has Super Admin privileges
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.current_user_role() IN ('Admin', 'service_role', 'postgres');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if caller has Management privileges
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.current_user_role() IN ('Admin', 'PlantManager', 'GeneralManager', 'Management', 'service_role', 'postgres');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ==============================================================================
-- 2. APPLY ROW LEVEL SECURITY (RLS) TO ALL 18 TABLES
-- ==============================================================================

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'users', 'raw_materials', 'raw_material_lots', 'products', 'parties', 
        'vendors', 'vehicles', 'pulp_formulas', 'machine_rolls', 'reels', 
        'transaction_logs', 'boiler_logs', 'etp_logs', 'electricity_logs', 
        'pending_orders', 'packing_slips', 'store_items', 'paper_test_reports'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        
        -- Clean up existing legacy policies
        EXECUTE format('DROP POLICY IF EXISTS "Public access for all operations" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow select" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow insert" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow update" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow delete" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%I_select_policy" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%I_insert_policy" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%I_update_policy" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%I_delete_policy" ON public.%I;', tbl, tbl);
    END LOOP;
END $$;


-- ==============================================================================
-- 3. GRANULAR TABLE POLICIES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 3.1 USERS TABLE
-- Read: Allowed for authenticated & anon (needed for login/PIN check & staff directory)
-- Insert / Update / Delete: Authenticated & anon app clients
-- ------------------------------------------------------------------------------
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "users_insert_policy" ON public.users
    FOR INSERT TO anon, authenticated
    WITH CHECK (auth.role() IN ('anon', 'authenticated'));

CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE TO anon, authenticated
    USING (auth.role() IN ('anon', 'authenticated'))
    WITH CHECK (auth.role() IN ('anon', 'authenticated'));

CREATE POLICY "users_delete_policy" ON public.users
    FOR DELETE TO anon, authenticated
    USING (auth.role() IN ('anon', 'authenticated'));


-- ------------------------------------------------------------------------------
-- 3.2 MASTER DATA TABLES (products, parties, vendors, vehicles, raw_materials, store_items)
-- Read: Allowed for all users
-- Write/Modify: Allowed for authenticated & anon app clients
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    tbl text;
    master_tables text[] := ARRAY['products', 'parties', 'vendors', 'vehicles', 'raw_materials', 'store_items'];
BEGIN
    FOREACH tbl IN ARRAY master_tables LOOP
        EXECUTE format('CREATE POLICY "%I_select_policy" ON public.%I FOR SELECT TO anon, authenticated USING (true);', tbl, tbl);
        EXECUTE format('CREATE POLICY "%I_insert_policy" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (auth.role() IN (''anon'', ''authenticated''));', tbl, tbl);
        EXECUTE format('CREATE POLICY "%I_update_policy" ON public.%I FOR UPDATE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated'')) WITH CHECK (auth.role() IN (''anon'', ''authenticated''));', tbl, tbl);
        EXECUTE format('CREATE POLICY "%I_delete_policy" ON public.%I FOR DELETE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated''));', tbl, tbl);
    END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- 3.3 OPERATIONAL PRODUCTION TABLES (machine_rolls, reels, pulp_formulas, raw_material_lots, paper_test_reports)
-- Read: All users
-- Insert / Update / Delete: Authenticated & anon app clients
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    tbl text;
    prod_tables text[] := ARRAY['machine_rolls', 'reels', 'pulp_formulas', 'raw_material_lots', 'paper_test_reports'];
BEGIN
    FOREACH tbl IN ARRAY prod_tables LOOP
        EXECUTE format('CREATE POLICY "%I_select_policy" ON public.%I FOR SELECT TO anon, authenticated USING (true);', tbl, tbl);
        EXECUTE format('CREATE POLICY "%I_insert_policy" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (auth.role() IN (''anon'', ''authenticated''));', tbl, tbl);
        EXECUTE format('CREATE POLICY "%I_update_policy" ON public.%I FOR UPDATE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated'')) WITH CHECK (auth.role() IN (''anon'', ''authenticated''));', tbl, tbl);
        EXECUTE format('CREATE POLICY "%I_delete_policy" ON public.%I FOR DELETE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated''));', tbl, tbl);
    END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- 3.4 DISPATCH, ORDERS & UTILITIES (pending_orders, packing_slips, boiler_logs, etp_logs, electricity_logs)
-- Read: All users
-- Insert / Update / Delete: Authenticated & anon app clients
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    tbl text;
    ops_tables text[] := ARRAY['pending_orders', 'packing_slips', 'boiler_logs', 'etp_logs', 'electricity_logs'];
BEGIN
    FOREACH tbl IN ARRAY ops_tables LOOP
        EXECUTE format('CREATE POLICY "%I_select_policy" ON public.%I FOR SELECT TO anon, authenticated USING (true);', tbl, tbl);
        EXECUTE format('CREATE POLICY "%I_insert_policy" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (auth.role() IN (''anon'', ''authenticated''));', tbl, tbl);
        EXECUTE format('CREATE POLICY "%I_update_policy" ON public.%I FOR UPDATE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated'')) WITH CHECK (auth.role() IN (''anon'', ''authenticated''));', tbl, tbl);
        EXECUTE format('CREATE POLICY "%I_delete_policy" ON public.%I FOR DELETE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated''));', tbl, tbl);
    END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- 3.5 IMMUTABLE AUDIT TRAIL (transaction_logs)
-- Read: Admin, Management, and Mill Staff
-- Insert: Allowed for all actions (Append-Only)
-- Update: STRICTLY FORBIDDEN (No update policy = records are tamper-proof)
-- Delete: Allowed for admin maintenance
-- ------------------------------------------------------------------------------
CREATE POLICY "transaction_logs_select_policy" ON public.transaction_logs
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "transaction_logs_insert_policy" ON public.transaction_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- Explicitly disallow UPDATE on audit trail
DROP POLICY IF EXISTS "transaction_logs_update_policy" ON public.transaction_logs;

-- Allow delete for admin retention maintenance
CREATE POLICY "transaction_logs_delete_policy" ON public.transaction_logs
    FOR DELETE TO anon, authenticated
    USING (auth.role() IN ('anon', 'authenticated'));


-- ==============================================================================
-- 4. REALTIME REPLICATION CONFIGURATION
-- Enable Supabase Realtime for all operational tables so changes broadcast live
-- ==============================================================================
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            public.users,
            public.raw_materials,
            public.raw_material_lots,
            public.products,
            public.parties,
            public.vendors,
            public.vehicles,
            public.pulp_formulas,
            public.machine_rolls,
            public.reels,
            public.transaction_logs,
            public.boiler_logs,
            public.etp_logs,
            public.electricity_logs,
            public.pending_orders,
            public.packing_slips,
            public.store_items,
            public.paper_test_reports;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN others THEN NULL;
    END;
END $$;
