import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── 1. MAIN PRODUCTION DATABASE (Live Factory Data for Cloudflare / GitHub / APK / EXE) ──
export const PROD_SUPABASE_CONFIG = {
  url: 'https://znyvmlwggwckjxxsxiwq.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueXZtbHdnZ3dja2p4eHN4aXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTE0NjUsImV4cCI6MjEwNTA2NzQ2NX0._NNVeLFW1OvXnTGYZbCcEmd4eYSF2J8g5Zxi6T4kdqY',
  name: 'Main Factory Database (Production)',
  target: 'prod' as const,
};

// ── 2. DEMO / TEST DATABASE (Isolated Sandbox for Localhost Testing) ──
export const DEMO_SUPABASE_CONFIG = {
  url: 'https://scyiwfqkknuphzhvklok.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjeWl3ZnFra251cGh6aHZrbG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2OTI1NjgsImV4cCI6MjEwNDI2ODU2OH0.uSIcsebYEW2uIgn_E6__Y2jg9te2NSHLMl3liZp3qmw',
  name: 'Demo Sandbox Database (Testing)',
  target: 'demo' as const,
};

export interface SupabaseDatabaseConfig {
  url: string;
  anonKey: string;
  name: string;
  target: 'prod' | 'demo';
}

/**
 * Resolves the active database configuration.
 * Order of precedence:
 * 1. User localStorage override (`saheb_database_target` = 'prod' | 'demo')
 * 2. Vite environment variable `VITE_DATABASE_TARGET` ('prod' | 'demo')
 * 3. Default environment:
 *    - In Development (localhost / dev server): DEMO Sandbox Database
 *    - In Production build (Cloudflare / APK / EXE): PROD Factory Database
 */
export function getActiveDatabaseConfig(): SupabaseDatabaseConfig {
  let target = '';

  if (typeof window !== 'undefined') {
    try {
      target = (localStorage.getItem('saheb_database_target') || '').trim().toLowerCase();
    } catch {
      // ignore
    }
  }

  if (!target) {
    target = (import.meta.env.VITE_DATABASE_TARGET || '').trim().toLowerCase();
  }

  if (target === 'prod' || target === 'production') {
    return PROD_SUPABASE_CONFIG;
  }

  if (target === 'demo' || target === 'test') {
    return DEMO_SUPABASE_CONFIG;
  }

  // Auto-detect based on host / build environment:
  const isLocalDev = Boolean(
    import.meta.env.DEV ||
      (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.startsWith('192.168.')))
  );

  return isLocalDev ? DEMO_SUPABASE_CONFIG : PROD_SUPABASE_CONFIG;
}

/**
 * Helper to switch database target and reload
 */
export function setDatabaseTarget(target: 'prod' | 'demo'): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('saheb_database_target', target);
    window.location.reload();
  }
}

/**
 * Helper to reset database target back to auto-detect default
 */
export function resetDatabaseTarget(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('saheb_database_target');
    window.location.reload();
  }
}

// Global console helpers for immediate debugging / switching:
if (typeof window !== 'undefined') {
  (window as any).switchDatabase = (target: 'prod' | 'demo') => setDatabaseTarget(target);
  (window as any).resetDatabase = () => resetDatabaseTarget();
  (window as any).getDatabaseConfig = () => getActiveDatabaseConfig();
}

const activeConfig = getActiveDatabaseConfig();

// Respect explicit custom URL/Key if provided in environment, otherwise use resolved active config
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_DATABASE_TARGET ? import.meta.env.VITE_SUPABASE_URL : activeConfig.url).trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY && !import.meta.env.VITE_DATABASE_TARGET ? import.meta.env.VITE_SUPABASE_ANON_KEY : activeConfig.anonKey).trim();

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

// Inform developer in console
if (typeof window !== 'undefined') {
  console.log(
    `%c[Saheb ERP Database]%c Connected to: ${activeConfig.name} [${activeConfig.target.toUpperCase()}]`,
    'background: #0f172a; color: #38bdf8; font-weight: 800; padding: 3px 8px; border-radius: 6px;',
    'color: #10b981; font-weight: bold; margin-left: 6px;'
  );
}


