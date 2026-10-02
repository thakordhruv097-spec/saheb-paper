import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://znyvmlwggwckjxxsxiwq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueXZtbHdnZ3dja2p4eHN4aXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTE0NjUsImV4cCI6MjEwNTA2NzQ2NX0._NNVeLFW1OvXnTGYZbCcEmd4eYSF2J8g5Zxi6T4kdqY';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

export const ERP_SECRET_HEADER_KEY = 'x-saheb-erp-key';
export const ERP_SECRET_HEADER_VAL = 'Saheb-ERP-SecKey-8000563666-2025';

// Safely initialize Supabase client only when valid credentials exist.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          [ERP_SECRET_HEADER_KEY]: ERP_SECRET_HEADER_VAL,
        },
      },
    })
  : null;

