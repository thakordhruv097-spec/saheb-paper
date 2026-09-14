-- Saheb Paper ERP Initial Database Schema
-- 18 Tables covering all ERP production & management modules

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    username TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    roles JSONB DEFAULT '[]'::jsonb,
    pin TEXT NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    needs_pin_reset BOOLEAN DEFAULT false,
    security_question TEXT,
    security_answer TEXT,
    emp_id TEXT,
    designation TEXT,
    custom_modules JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RAW MATERIALS
CREATE TABLE IF NOT EXISTS public.raw_materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    stock NUMERIC(12,2) DEFAULT 0,
    min_threshold NUMERIC(12,2) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    used_in_module TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RAW MATERIAL LOTS
CREATE TABLE IF NOT EXISTS public.raw_material_lots (
    lot_no TEXT PRIMARY KEY,
    material_id TEXT NOT NULL,
    material_name TEXT NOT NULL,
    weight NUMERIC(12,2) NOT NULL,
    vendor_name TEXT NOT NULL,
    date TEXT NOT NULL,
    operator TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT DEFAULT 'A',
    gsm NUMERIC(8,2) NOT NULL,
    size NUMERIC(8,2) NOT NULL,
    ply INT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PARTIES (CUSTOMERS)
CREATE TABLE IF NOT EXISTS public.parties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT,
    address TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VENDORS
CREATE TABLE IF NOT EXISTS public.vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT,
    address TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. VEHICLES
CREATE TABLE IF NOT EXISTS public.vehicles (
    id TEXT PRIMARY KEY,
    vehicle_no TEXT NOT NULL,
    driver_name TEXT,
    driver_contact TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PULP FORMULAS
CREATE TABLE IF NOT EXISTS public.pulp_formulas (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    waste_mix JSONB DEFAULT '{}'::jsonb,
    chemicals JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MACHINE ROLLS
CREATE TABLE IF NOT EXISTS public.machine_rolls (
    roll_no TEXT PRIMARY KEY,
    product TEXT NOT NULL,
    weight NUMERIC(12,2) NOT NULL,
    gsm NUMERIC(8,2) NOT NULL,
    width NUMERIC(8,2) NOT NULL,
    dia NUMERIC(8,2),
    joint INT DEFAULT 0,
    shift TEXT DEFAULT 'A',
    start_time TEXT,
    off_time TEXT,
    working_minutes INT DEFAULT 0,
    downtime_reason TEXT,
    date TEXT NOT NULL,
    formula_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REELS (FINISHED CUT REELS)
CREATE TABLE IF NOT EXISTS public.reels (
    reel_no TEXT PRIMARY KEY,
    parent_roll_no TEXT NOT NULL,
    product TEXT NOT NULL,
    gsm NUMERIC(8,2) NOT NULL,
    size NUMERIC(8,2) NOT NULL,
    ply INT DEFAULT 1,
    weight NUMERIC(12,2) NOT NULL,
    dia NUMERIC(8,2),
    joint INT DEFAULT 0,
    status TEXT NOT NULL,
    qc_grade TEXT DEFAULT 'PENDING',
    production_date TEXT NOT NULL,
    challan_no TEXT,
    qc_inspector TEXT,
    qc_timestamp TEXT,
    qc_gsm_result NUMERIC(8,2),
    qc_brightness NUMERIC(8,2),
    qc_softness NUMERIC(8,2),
    dispatch_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TRANSACTION LOGS / AUDIT TRAIL
CREATE TABLE IF NOT EXISTS public.transaction_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. BOILER LOGS
CREATE TABLE IF NOT EXISTS public.boiler_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    wood_used NUMERIC(12,2) DEFAULT 0,
    water_used NUMERIC(12,2) DEFAULT 0,
    pressure NUMERIC(8,2) DEFAULT 0,
    temperature NUMERIC(8,2),
    operator TEXT NOT NULL,
    shift TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ETP LOGS
CREATE TABLE IF NOT EXISTS public.etp_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    flock_liq NUMERIC(12,2) DEFAULT 0,
    flock_master NUMERIC(12,2) DEFAULT 0,
    operator TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ELECTRICITY LOGS
CREATE TABLE IF NOT EXISTS public.electricity_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    units NUMERIC(12,2) DEFAULT 0,
    operator TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. PENDING ORDERS
CREATE TABLE IF NOT EXISTS public.pending_orders (
    id TEXT PRIMARY KEY,
    party_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    gsm NUMERIC(8,2) NOT NULL,
    size NUMERIC(8,2) NOT NULL,
    ply INT DEFAULT 1,
    qty INT NOT NULL,
    weight_tons NUMERIC(10,3),
    receive_date TEXT,
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    dispatched_qty INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. PACKING SLIPS
CREATE TABLE IF NOT EXISTS public.packing_slips (
    id TEXT PRIMARY KEY,
    slip_no TEXT NOT NULL,
    date TEXT NOT NULL,
    party_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    reel_nos JSONB DEFAULT '[]'::jsonb,
    driver_signature TEXT,
    receiver_signature TEXT,
    status TEXT DEFAULT 'DRAFT',
    dispatch_date TEXT,
    dispatch_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. STORE ITEMS (SPARES, BEARINGS, V-BELTS)
CREATE TABLE IF NOT EXISTS public.store_items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    pcs INT DEFAULT 0,
    group_name TEXT,
    usage_area TEXT,
    target_machine TEXT,
    min_stock INT DEFAULT 0,
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. PAPER TEST REPORTS (LAB QC)
CREATE TABLE IF NOT EXISTS public.paper_test_reports (
    id TEXT PRIMARY KEY,
    product TEXT NOT NULL,
    roll_no TEXT NOT NULL,
    shift TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    target_gsm NUMERIC(8,2) NOT NULL,
    weight NUMERIC(12,2) NOT NULL,
    speed NUMERIC(8,2) NOT NULL,
    creping_pct NUMERIC(8,2) NOT NULL,
    gsm_samples JSONB DEFAULT '[]'::jsonb,
    avg_gsm NUMERIC(8,2) NOT NULL,
    max_gsm NUMERIC(8,2) NOT NULL,
    min_gsm NUMERIC(8,2) NOT NULL,
    range_gsm NUMERIC(8,2) NOT NULL,
    breakage_count INT DEFAULT 0,
    lab_result_gsm NUMERIC(8,2),
    moisture_pct NUMERIC(8,2),
    caliper_mm NUMERIC(8,3),
    bulk_cc_gm NUMERIC(8,2),
    breaking_length_md NUMERIC(8,3),
    breaking_length_cd NUMERIC(8,3),
    brightness_pct NUMERIC(8,2),
    tear_md NUMERIC(8,2),
    tear_cd NUMERIC(8,2),
    tensile_dry_md NUMERIC(8,2),
    tensile_dry_cd NUMERIC(8,2),
    stretch_dry_md NUMERIC(8,2),
    stretch_dry_cd NUMERIC(8,2),
    qc_status TEXT DEFAULT 'GRADE_A',
    remarks TEXT,
    inspector TEXT,
    timestamp TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY AND SECURE POLICIES FOR ALL TABLES
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'users', 'raw_materials', 'raw_material_lots', 'products', 'parties', 
        'vendors', 'vehicles', 'pulp_formulas', 'machine_rolls', 'reels', 
        'transaction_logs', 'boiler_logs', 'etp_logs', 'electricity_logs', 
        'pending_orders', 'packing_slips', 'store_items', 'paper_test_reports'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public access for all operations" ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS "%I_select_policy" ON public.%I;', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%I_insert_policy" ON public.%I;', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%I_update_policy" ON public.%I;', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%I_delete_policy" ON public.%I;', t, t);

        EXECUTE format('CREATE POLICY "%I_select_policy" ON public.%I FOR SELECT TO anon, authenticated USING (true);', t, t);
        EXECUTE format('CREATE POLICY "%I_insert_policy" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (auth.role() IN (''anon'', ''authenticated''));', t, t);
        EXECUTE format('CREATE POLICY "%I_update_policy" ON public.%I FOR UPDATE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated'')) WITH CHECK (auth.role() IN (''anon'', ''authenticated''));', t, t);
        EXECUTE format('CREATE POLICY "%I_delete_policy" ON public.%I FOR DELETE TO anon, authenticated USING (auth.role() IN (''anon'', ''authenticated''));', t, t);
    END LOOP;
END $$;
