-- Migration: Enable DELETE policy for packing_slips
-- Date: 2026-09-21
-- Description: Allows authorized deletion of dispatch packing slips / delivery challans so that deleted slips do not reappear after sync.

DO $$
BEGIN
    -- Drop existing delete policy if present
    DROP POLICY IF EXISTS "packing_slips_delete_policy" ON public.packing_slips;

    -- Create DELETE policy for packing_slips
    CREATE POLICY "packing_slips_delete_policy" ON public.packing_slips
        FOR DELETE
        TO anon, authenticated
        USING (auth.role() IN ('anon', 'authenticated'));
END $$;
