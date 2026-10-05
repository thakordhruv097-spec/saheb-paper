const DEMO_URL = 'https://scyiwfqkknuphzhvklok.supabase.co';
const DEMO_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjeWl3ZnFra251cGh6aHZrbG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2OTI1NjgsImV4cCI6MjEwNDI2ODU2OH0.uSIcsebYEW2uIgn_E6__Y2jg9te2NSHLMl3liZp3qmw';

const weights = [
  1880, 1890, 1875, 1910, 1885,
  1895, 1905, 1870, 1890
];

const totalWeight = weights.reduce((a, b) => a + b, 0);
console.log(`Creating ${weights.length} reels, total weight: ${totalWeight} kg`);

const reels = weights.map((w, idx) => {
  const reelNo = `261000${String(16 + idx).padStart(2, '0')}`; // 26100016 to 26100024
  return {
    reel_no: reelNo,
    parent_roll_no: 'ROLL-20261006-02',
    product: 'Napkin Tissue (Virgin Pulp)',
    gsm: 16,
    size: 30,
    ply: 2,
    weight: w,
    dia: 1160,
    joint: 0,
    status: 'IN_STOCK',
    qc_grade: 'A',
    production_date: '2026-10-06 09:00',
    challan_no: null,
    qc_inspector: 'Plant Supervisor',
    qc_timestamp: '2026-10-06 09:30',
    qc_gsm_result: 16.1,
    qc_brightness: 88,
    qc_softness: 94,
    dispatch_details: null,
  };
});

async function insertReels() {
  const res = await fetch(`${DEMO_URL}/rest/v1/reels`, {
    method: 'POST',
    headers: {
      'apikey': DEMO_KEY,
      'Authorization': `Bearer ${DEMO_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(reels),
  });

  console.log('Insert status:', res.status, res.statusText);
  if (!res.ok) {
    const err = await res.text();
    console.error('Error inserting reels:', err);
    return;
  }
  const data = await res.json();
  console.log('Successfully inserted/upserted reels count:', data.length);
  console.log('Inserted Reel Nos:', data.map(r => r.reel_no).join(', '));
  console.log('Total weight:', data.reduce((sum, r) => sum + r.weight, 0), 'kg');
}

insertReels();
