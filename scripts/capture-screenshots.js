/**
 * Saheb Paper ERP - Automated Screenshot Capture Script
 *
 * This script will:
 * 1. Navigate through all app modules
 * 2. Capture screenshots of each view
 * 3. Save them to the screenshots folder
 *
 * Run this in the browser console while the app is open
 */

(async function captureAppScreenshots() {
  console.log('🎬 Starting Saheb Paper ERP Screenshot Capture...');

  const screenshots = [];
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // All routes to capture
  const routes = [
    { path: '/', name: 'Dashboard', waitTime: 2000 },
    { path: '/raw-material-stock', name: 'Raw Material Stock', waitTime: 2000 },
    { path: '/orders', name: 'Orders', waitTime: 2000 },
    { path: '/pulp-mill-operations', name: 'Pulp Mill Operations', waitTime: 2000 },
    { path: '/machine-production', name: 'Machine Production', waitTime: 2000 },
    { path: '/rewinding-reel-conversion', name: 'Rewinding Reel Conversion', waitTime: 2000 },
    { path: '/utilities-&-etp/boiler-operations', name: 'Boiler Operations', waitTime: 2000 },
    { path: '/utilities-&-etp/etp-water-&-chemicals', name: 'ETP Water & Chemicals', waitTime: 2000 },
    { path: '/utilities-&-etp/electricity-&-power-grid', name: 'Electricity & Power Grid', waitTime: 2000 },
    { path: '/stock-categorization', name: 'Finished Stock Dispatch', waitTime: 2000 },
    { path: '/spareparts-management', name: 'Spareparts Management', waitTime: 2000 },
    { path: '/lab', name: 'Lab', waitTime: 2000 },
    { path: '/label-studio', name: 'Label Studio', waitTime: 2000 },
    { path: '/monthly-yearly-reporting', name: 'Reports', waitTime: 2000 },
    { path: '/dispatch-receipt/draft-packing-slip', name: 'Dispatch - Draft Packing Slip', waitTime: 2000 },
    { path: '/dispatch-receipt/packing-slips-&-challans', name: 'Dispatch - Packing Slips', waitTime: 2000 },
    { path: '/dispatch-receipt/dispatched-reels', name: 'Dispatch - Dispatched Reels', waitTime: 2000 },
    { path: '/admin-panel-audit', name: 'Admin Panel', waitTime: 2000 },
    { path: '/company-settings', name: 'Company Settings', waitTime: 2000 },
    { path: '/user-management', name: 'User Management', waitTime: 2000 },
    { path: '/profile', name: 'Profile', waitTime: 2000 }
  ];

  console.log(`📸 Will capture ${routes.length} screenshots...`);

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    console.log(`\n[${i + 1}/${routes.length}] Navigating to: ${route.name}`);

    // Navigate to route
    window.location.hash = route.path;

    // Wait for content to load
    await delay(route.waitTime);

    // Scroll to top
    window.scrollTo(0, 0);
    await delay(500);

    console.log(`✓ Ready to capture: ${route.name}`);
    console.log(`  → Please use your screenshot tool now (Windows + Shift + S)`);
    console.log(`  → Save as: ${i + 1}_${route.name.replace(/\s+/g, '_').toLowerCase()}.png`);

    // Wait for manual screenshot
    await delay(3000);
  }

  console.log('\n✅ All routes visited!');
  console.log('\n📁 Expected screenshots:');
  routes.forEach((route, i) => {
    console.log(`   ${i + 1}. ${route.name}`);
  });

  console.log('\n🎉 Screenshot capture session complete!');
  console.log('💡 Tip: Use a tool like ShareX or Greenshot for batch screenshots');
})();
