/**
 * Saheb Paper ERP — Automated Nightly Database Backup Script
 * Fetches all 18 PostgreSQL tables from Supabase and saves a timestamped JSON artifact.
 */

import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || 'https://znyvmlwggwckjxxsxiwq.supabase.co').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueXZtbHdnZ3dja2p4eHN4aXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTE0NjUsImV4cCI6MjEwNTA2NzQ2NX0._NNVeLFW1OvXnTGYZbCcEmd4eYSF2J8g5Zxi6T4kdqY';

const TABLES = [
  'users',
  'raw_materials',
  'raw_material_lots',
  'products',
  'parties',
  'vendors',
  'vehicles',
  'pulp_formulas',
  'machine_rolls',
  'reels',
  'transaction_logs',
  'boiler_logs',
  'etp_logs',
  'electricity_logs',
  'pending_orders',
  'packing_slips',
  'store_items',
  'paper_test_reports',
];

async function fetchTableData(tableName) {
  const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*`;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.warn(`⚠️ Warning: Table '${tableName}' returned status ${response.status}`);
    return [];
  }

  return response.json();
}

async function runBackup() {
  console.log(`📦 [Saheb Paper ERP] Starting Nightly Database Backup...`);
  console.log(`📡 Connecting to: ${SUPABASE_URL}`);

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      source: SUPABASE_URL,
      version: '1.0',
      totalTables: TABLES.length,
    },
    tables: {},
  };

  for (const table of TABLES) {
    try {
      const rows = await fetchTableData(table);
      // Sanitize sensitive user credentials in backup metadata
      if (table === 'users' && Array.isArray(rows)) {
        backupData.tables[table] = rows.map(u => ({
          ...u,
          security_answer: u.security_answer ? '***MASKED***' : null,
        }));
      } else {
        backupData.tables[table] = rows;
      }
      console.log(`  ✓ Table '${table}': ${Array.isArray(rows) ? rows.length : 0} records fetched`);
    } catch (err) {
      console.error(`  ✗ Error fetching '${table}':`, err.message);
      backupData.tables[table] = [];
    }
  }

  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filePath = path.join(backupDir, `saheb_paper_backup_${dateStr}.json`);
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log(`\n✅ Backup successfully generated: ${filePath}`);
}

runBackup().catch(err => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
