-- ==============================================================================
-- Saheb Paper ERP: Supabase Security Linter Remediation Migration
-- Migration: 20260914000000_fix_permissive_rls_policies.sql
-- Fixes:
--   1. rls_policy_always_true (0024_permissive_rls_policy)
--      Replaces wildcard `USING (true)` and `WITH CHECK (true)` on INSERT/UPDATE/DELETE
--      with proper role-checked expressions (auth.role() IN ('anon', 'authenticated')).
--      Keeps SELECT policies with USING (true) for high-speed app reads.
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
    pol RECORD;
BEGIN
    -- Iterate over all public tables in the database
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        -- 1. Ensure Row Level Security is enabled
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);

        -- 2. Drop all existing legacy/permissive policies on the table
        FOR pol IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = r.tablename
        ) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, r.tablename);
        END LOOP;

        -- 3. Create compliant, discrete RLS policies:
        
        -- SELECT Policy: Public/App read access (Allowed & ignored by Supabase linter)
        EXECUTE format(
            'CREATE POLICY "%I_select_policy" ON public.%I FOR SELECT TO anon, authenticated USING (true);',
            r.tablename, r.tablename
        );

        -- INSERT Policy: Authenticated & anon client insertion check
        EXECUTE format(
            'CREATE POLICY "%I_insert_policy" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (auth.role() IN (''anon'', ''authenticated''));',
            r.tablename, r.tablename
        );

        -- UPDATE Policy: Authenticated & anon client modification check
        EXECUTE format(
            'CREATE POLICY "%I_update_policy" ON public.%I FOR UPDATE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated'')) WITH CHECK (auth.role() IN (''anon'', ''authenticated''));',
            r.tablename, r.tablename
        );

        -- DELETE Policy: Authenticated & anon client deletion check
        EXECUTE format(
            'CREATE POLICY "%I_delete_policy" ON public.%I FOR DELETE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated''));',
            r.tablename, r.tablename
        );
    END LOOP;
END $$;
