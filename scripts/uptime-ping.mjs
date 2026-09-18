/**
 * Saheb Paper ERP — Supabase Health Check & Uptime Ping Bot
 * Checks Supabase REST connectivity and measures latency.
 */

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || 'https://znyvmlwggwckjxxsxiwq.supabase.co').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueXZtbHdnZ3dja2p4eHN4aXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTE0NjUsImV4cCI6MjEwNTA2NzQ2NX0._NNVeLFW1OvXnTGYZbCcEmd4eYSF2J8g5Zxi6T4kdqY';

async function checkHealth() {
  const startTime = Date.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=count`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Range: '0-0',
      },
    });

    const duration = Date.now() - startTime;
    if (res.ok) {
      console.log(`✅ [UPTIME OK] Supabase response time: ${duration}ms (Status: ${res.status})`);
      process.exit(0);
    } else {
      console.error(`❌ [UPTIME ERROR] Supabase responded with status: ${res.status}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ [UPTIME FAILED] Connection error:`, err.message);
    process.exit(1);
  }
}

checkHealth();
