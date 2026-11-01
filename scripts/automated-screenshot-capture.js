/**
 * Automated Screenshot Capture Script for Saheb Paper ERP
 *
 * This script uses Puppeteer to automatically:
 * - Start the dev server (if needed)
 * - Navigate through all app modules
 * - Capture high-quality screenshots
 * - Save with organized naming
 *
 * Usage:
 *   npm install --save-dev puppeteer
 *   node scripts/automated-screenshot-capture.js
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const CONFIG = {
  appUrl: 'http://localhost:5178',
  screenshotDir: join(projectRoot, 'screenshots', 'app'),
  desktopDir: join(projectRoot, 'screenshots', 'desktop'),
  viewport: { width: 1920, height: 1080 },
  waitTime: 3000, // ms to wait for content to load (increased)
  quality: 100, // screenshot quality
};

// All routes to capture
const ROUTES = [
  { path: '/', name: '01_dashboard', description: 'Main Dashboard' },
  { path: '/raw-material-stock', name: '02_raw_material_stock', description: 'Raw Material Stock' },
  { path: '/orders', name: '03_orders', description: 'Orders Management' },
  { path: '/pulp-mill-operations', name: '04_pulp_mill_operations', description: 'Pulp Mill Operations' },
  { path: '/machine-production', name: '05_machine_production', description: 'Machine Production' },
  { path: '/rewinding-reel-conversion', name: '06_rewinding_reel_conversion', description: 'Rewinding Reel Conversion' },
  { path: '/utilities-&-etp/boiler-operations', name: '07_boiler_operations', description: 'Boiler Operations' },
  { path: '/utilities-&-etp/etp-water-&-chemicals', name: '08_etp_water_chemicals', description: 'ETP Water & Chemicals' },
  { path: '/utilities-&-etp/electricity-&-power-grid', name: '09_electricity_power_grid', description: 'Electricity & Power Grid' },
  { path: '/stock-categorization', name: '10_finished_stock_dispatch', description: 'Finished Stock Dispatch' },
  { path: '/spareparts-management', name: '11_spareparts_management', description: 'Spareparts Management' },
  { path: '/lab', name: '12_lab', description: 'Lab Module' },
  { path: '/label-studio', name: '13_label_studio', description: 'Label Studio' },
  { path: '/monthly-yearly-reporting', name: '14_reports', description: 'Monthly/Yearly Reports' },
  { path: '/dispatch-receipt/draft-packing-slip', name: '15_dispatch_draft_packing_slip', description: 'Dispatch - Draft Packing Slip' },
  { path: '/dispatch-receipt/packing-slips-&-challans', name: '16_dispatch_packing_slips', description: 'Dispatch - Packing Slips' },
  { path: '/dispatch-receipt/dispatched-reels', name: '17_dispatch_dispatched_reels', description: 'Dispatch - Dispatched Reels' },
  { path: '/admin-panel-audit', name: '18_admin_panel', description: 'Admin Panel' },
  { path: '/company-settings', name: '19_company_settings', description: 'Company Settings' },
  { path: '/user-management', name: '20_user_management', description: 'User Management' },
  { path: '/profile', name: '21_profile', description: 'User Profile' },
];

// Utility functions
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
}

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    progress: '⏳',
    screenshot: '📸'
  }[type] || 'ℹ️';

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function waitForServer(url, maxAttempts = 30) {
  log('Waiting for dev server to be ready...', 'progress');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        log('Dev server is ready!', 'success');
        return true;
      }
    } catch (err) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Dev server did not start in time');
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function captureScreenshot(page, route, index, total) {
  const { path, name, description } = route;

  log(`[${index}/${total}] Navigating to: ${description}`, 'progress');

  try {
    // Navigate using hash router
    await page.goto(`${CONFIG.appUrl}/#${path}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for content to load
    await sleep(CONFIG.waitTime);

    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(300);

    // Hide scrollbars for cleaner screenshot
    await page.evaluate(() => {
      document.body.style.overflow = 'hidden';
    });

    // Take screenshot
    const screenshotPath = join(CONFIG.screenshotDir, `${name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: false, // Only capture viewport
      type: 'png'
    });

    log(`Saved: ${name}.png`, 'screenshot');

    return { success: true, path: screenshotPath, name, description };
  } catch (error) {
    log(`Failed to capture ${name}: ${error.message}`, 'error');
    return { success: false, name, description, error: error.message };
  }
}

async function main() {
  console.log('\n🎬 Saheb Paper ERP - Automated Screenshot Capture\n');
  console.log('═'.repeat(60));

  // Create directories
  ensureDir(CONFIG.screenshotDir);
  ensureDir(CONFIG.desktopDir);

  // Check if dev server is running
  let serverRunning = false;
  try {
    const response = await fetch(CONFIG.appUrl);
    serverRunning = response.ok;
  } catch (err) {
    serverRunning = false;
  }

  let devServer = null;

  if (!serverRunning) {
    log('Dev server not running. Starting it now...', 'progress');

    // Start dev server
    devServer = spawn('npm', ['run', 'dev'], {
      cwd: projectRoot,
      shell: true,
      stdio: 'pipe'
    });

    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:')) {
        log('Dev server started!', 'success');
      }
    });

    // Wait for server to be ready
    await waitForServer(CONFIG.appUrl);
  } else {
    log('Dev server already running', 'success');
  }

  console.log('\n' + '═'.repeat(60));
  log(`Starting screenshot capture for ${ROUTES.length} modules...`, 'progress');
  console.log('═'.repeat(60) + '\n');

  // Launch browser with installed Chrome
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const launchOptions = {
    headless: false,
    defaultViewport: CONFIG.viewport,
    args: [
      '--start-maximized',
      '--disable-notifications',
      '--disable-infobars',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  };

  if (fs.existsSync(chromePath)) {
    launchOptions.executablePath = chromePath;
  } else {
    launchOptions.channel = 'chrome';
  }

  const browser = await puppeteer.launch(launchOptions);

  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);

  // Pre-seed admin authentication in localStorage so all modules are directly accessible
  log('Setting up admin session...', 'progress');
  await page.goto(CONFIG.appUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const adminUser = {
      username: 'admin',
      role: 'Admin',
      roles: ['Admin'],
      pin: '1234',
      displayName: 'Saheb Paper Admin',
      email: 'sahebpaper@gmail.com',
      phone: '8000563666',
      empId: 'EMP-001',
      designation: 'Admin / Owner',
      customModules: [
        'dashboard', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion', 'lab',
        'boiler', 'etp', 'electricity', 'orders', 'finished_stock_dispatch', 'dispatch', 'spareparts_management', 'label_studio', 'monthly_yearly_reporting'
      ]
    };
    const session = {
      token: 'auto-capture-token-' + Date.now(),
      expiresAt: Date.now() + 8 * 3600 * 1000,
      user: adminUser
    };
    localStorage.setItem('saheb_session', JSON.stringify(session));
    localStorage.setItem('saheb_active_user', JSON.stringify(adminUser));
  });

  // Navigate to verify session
  await page.goto(`${CONFIG.appUrl}/#/`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  log('Admin session active!', 'success');

  // Capture all screenshots
  const results = [];

  for (let i = 0; i < ROUTES.length; i++) {
    const result = await captureScreenshot(page, ROUTES[i], i + 1, ROUTES.length);
    results.push(result);

    // Small delay between captures
    await sleep(500);
  }

  // Close browser
  await browser.close();
  log('Browser closed', 'success');

  // Stop dev server if we started it
  if (devServer) {
    devServer.kill();
    log('Dev server stopped', 'success');
  }

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 CAPTURE SUMMARY');
  console.log('═'.repeat(60) + '\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successful: ${successful}/${ROUTES.length}`);
  console.log(`❌ Failed: ${failed}/${ROUTES.length}`);

  if (failed > 0) {
    console.log('\n❌ Failed captures:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.description}: ${r.error}`);
    });
  }

  console.log(`\n📁 Screenshots saved to: ${CONFIG.screenshotDir}`);

  // Generate summary file
  const summaryPath = join(CONFIG.screenshotDir, '_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    captureDate: new Date().toISOString(),
    total: ROUTES.length,
    successful,
    failed,
    results: results.map(r => ({
      name: r.name,
      description: r.description,
      success: r.success,
      path: r.path,
      error: r.error
    }))
  }, null, 2));

  console.log(`📄 Summary saved to: ${summaryPath}`);

  console.log('\n✨ Screenshot capture complete!\n');

  // Instructions for next steps
  console.log('═'.repeat(60));
  console.log('🎬 NEXT STEPS FOR VIDEO PRODUCTION');
  console.log('═'.repeat(60));
  console.log('\n1. Review screenshots in: screenshots/app/');
  console.log('2. Edit if needed (crop, blur sensitive data)');
  console.log('3. Use in video:');
  console.log('   - Import to Runway ML / Pika Labs as references');
  console.log('   - Use in motion graphics video');
  console.log('   - Add to NullMotion for breakdown\n');

  process.exit(0);
}

// Run the script
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
