const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML_PATH = 'file:///' + path.resolve(__dirname, 'video_view.html').replace(/\\/g, '/');

const STILLS = [
  { name: 'scene1_settled.png', time: 1.5 },
  { name: 'trans_1_to_2.png', time: 2.9 },
  { name: 'scene2_cockpit.png', time: 5.0 },
  { name: 'scene3_rewinder_qr.png', time: 9.0 },
  { name: 'scene4_qc_dispatch.png', time: 13.0 },
  { name: 'scene5_multirole.png', time: 16.5 },
  { name: 'scene6_outro_poster.png', time: 19.5 }
];

(async () => {
  console.log('Launching Chrome to capture review stills...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--allow-file-access-from-files',
      '--disable-web-security'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.goto(HTML_PATH, { waitUntil: 'networkidle0' });

  // Ensure fonts are loaded
  await page.evaluateHandle('document.fonts.ready');

  const stillsDir = path.join(__dirname, 'stills');
  if (!fs.existsSync(stillsDir)) {
    fs.mkdirSync(stillsDir, { recursive: true });
  }

  for (const item of STILLS) {
    await page.evaluate((t) => window.setVideoTime(t), item.time);
    // Small timeout for layout settle
    await new Promise(r => setTimeout(r, 100));
    const outPath = path.join(stillsDir, item.name);
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`Captured still: ${item.name} at t=${item.time}s`);
  }

  await browser.close();
  console.log('All stills captured successfully.');
})();
