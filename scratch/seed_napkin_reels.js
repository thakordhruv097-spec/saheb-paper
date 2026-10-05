const DEMO_URL = 'https://scyiwfqkknuphzhvklok.supabase.co';
const DEMO_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjeWl3ZnFra251cGh6aHZrbG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2OTI1NjgsImV4cCI6MjEwNDI2ODU2OH0.uSIcsebYEW2uIgn_E6__Y2jg9te2NSHLMl3liZp3qmw';

const weights = [
  2020, 1980, 2010, 1990, 2030,
  1970, 2005, 1995, 2015, 1985,
  2025, 1975, 2000, 2010, 1990
];

const totalWeight = weights.reduce((a, b) => a + b, 0);
console.log(`Creating ${weights.length} reels, total weight: ${totalWeight} kg`);

const reels = weights.map((w, idx) => {
  const reelNo = `261000${String(idx + 1).padStart(2, '0')}`;
  return {
    reel_no: reelNo,
    parent_roll_no: 'ROLL-20261006-01',
    product: 'Napkin Tissue (Virgin Pulp)',
    gsm: 16,
    size: 30,
    ply: 2,
    weight: w,
    dia: 1175,
    joint: 0,
    status: 'IN_STOCK',
    qc_grade: 'A',
    production_date: '2026-10-06 08:00',
    challan_no: null,
    qc_inspector: 'Plant Supervisor',
    qc_timestamp: '2026-10-06 08:30',
    qc_gsm_result: 16.0,
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
  console.log('Sample reel inserted:', data[0]?.reel_no, data[0]?.product, data[0]?.weight, 'kg');
}

insertReels();
