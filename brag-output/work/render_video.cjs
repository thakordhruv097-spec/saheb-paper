const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG_PATH = require('ffmpeg-static');
const HTML_PATH = 'file:///' + path.resolve(__dirname, 'video_view.html').replace(/\\/g, '/');
const SOUNDTRACK_PATH = path.resolve(__dirname, 'soundtrack.wav');
const OUTPUT_MP4 = path.resolve(__dirname, '../brag.mp4');
const POSTER_JPG = path.resolve(__dirname, '../brag.jpg');

const FPS = 30;
const DURATION_SEC = 20.0;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 600 frames (0 to 599)

(async () => {
  console.log('=== STARTING SAHEB PAPER ERP VIDEO RENDER ===');
  console.log(`Resolution: 1080x1920 (9:16 Vertical) | FPS: ${FPS} | Duration: ${DURATION_SEC}s`);
  console.log(`Using Chrome: ${CHROME_PATH}`);
  console.log(`Using FFmpeg: ${FFMPEG_PATH}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--allow-file-access-from-files',
      '--disable-web-security',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.goto(HTML_PATH, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');

  // Generate poster frame from settled outro (t = 19.5s)
  console.log('Rendering poster frame (t = 19.5s)...');
  await page.evaluate((t) => window.setVideoTime(t), 19.5);
  await new Promise(r => setTimeout(r, 80));
  const posterBuffer = await page.screenshot({ type: 'jpeg', quality: 95 });
  fs.writeFileSync(POSTER_JPG, posterBuffer);
  console.log(`Saved poster image: ${POSTER_JPG}`);

  // Also get PNG buffer of poster for Frame 0
  const posterPng = await page.screenshot({ type: 'png' });

  // Spawn FFmpeg process
  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'png',
    '-r', String(FPS),
    '-i', '-',
    '-i', SOUNDTRACK_PATH,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'medium',
    '-crf', '18',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    OUTPUT_MP4
  ];

  console.log('Launching FFmpeg encoder pipeline...');
  const ffmpegProc = spawn(FFMPEG_PATH, ffmpegArgs);

  ffmpegProc.stderr.on('data', (data) => {
    // Only print on fatal errors
    const str = data.toString();
    if (str.includes('Error') || str.includes('Fatal')) {
      console.error('FFmpeg stderr:', str);
    }
  });

  ffmpegProc.on('error', (err) => {
    console.error('FFmpeg spawn error:', err);
  });

  const ffmpegFinished = new Promise((resolve, reject) => {
    ffmpegProc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with error code ${code}`));
      }
    });
  });

  console.log('Piping 600 frames into FFmpeg...');
  const startTime = Date.now();

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    let framePng;

    if (f === 0) {
      // Bake settled poster frame into Frame 0
      framePng = posterPng;
    } else {
      const t = f / FPS;
      await page.evaluate((currT) => window.setVideoTime(currT), t);
      framePng = await page.screenshot({ type: 'png' });
    }

    // Write to ffmpeg stdin with drain handling
    const canWrite = ffmpegProc.stdin.write(framePng);
    if (!canWrite) {
      await new Promise(resolve => ffmpegProc.stdin.once('drain', resolve));
    }

    if (f % 60 === 0 || f === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = Math.round((f / TOTAL_FRAMES) * 100);
      const fpsRender = (f / Math.max(1, (Date.now() - startTime) / 1000)).toFixed(1);
      console.log(`Progress: ${pct}% (frame ${f}/${TOTAL_FRAMES}) | Elapsed: ${elapsed}s | ${fpsRender} fps`);
    }
  }

  ffmpegProc.stdin.end();
  console.log('Finished streaming frames. Waiting for FFmpeg to finalize container...');

  await ffmpegFinished;
  await browser.close();

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const stats = fs.statSync(OUTPUT_MP4);
  console.log(`=== RENDER COMPLETE ===`);
  console.log(`Output: ${OUTPUT_MP4} (${(stats.size / (1024 * 1024)).toFixed(2)} MB in ${totalSec}s)`);
})();
