import type { PaperTestReport } from '../data/types';
import { COMPANY_CONFIG } from '../config/company';

export function printPaperTestReport(report: PaperTestReport): void {
  try {
    const sessionData = localStorage.getItem('erp_active_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (session?.role === 'Viewer' || session?.username === 'viewer' || session?.roles?.includes('Viewer')) {
        alert('Printing test certificate is locked for Viewer (Read-Only Mode).');
        return;
      }
    }
  } catch {
    // ignore
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Paper Test Report - ${report.rollNo} - ${COMPANY_CONFIG.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 10px;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .report-container {
      max-width: 820px;
      margin: 0 auto;
      border: 2px solid #1e3a8a;
      padding: 16px;
      background: #ffffff;
      border-radius: 8px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .company-name {
      font-size: 22px;
      font-weight: 900;
      color: #1e3a8a;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin: 0;
    }
    .report-title {
      font-size: 15px;
      font-weight: 800;
      color: #dc2626;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 4px 0 0 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #64748b;
      padding: 5px 8px;
      text-align: center;
    }
    .meta-table {
      margin-bottom: 12px;
      background-color: #f8fafc;
    }
    .meta-table td {
      font-weight: 600;
    }
    .label-cell {
      color: #dc2626;
      text-transform: uppercase;
      font-weight: 800 !important;
      background: #f1f5f9;
      width: 14%;
      font-size: 11px;
    }
    .val-cell {
      color: #1e3a8a;
      font-weight: 700 !important;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
    .main-grid {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .gsm-column {
      width: 32%;
    }
    .param-column {
      width: 68%;
    }
    .section-header {
      background: #1e3a8a;
      color: #ffffff;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 1px;
    }
    .gsm-row-num {
      font-weight: 700;
      color: #334155;
    }
    .gsm-val {
      font-weight: 700;
      color: #dc2626;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
    .stat-label {
      font-weight: 800;
      color: #0f172a;
      background: #f1f5f9;
      text-align: left;
    }
    .stat-val {
      font-weight: 800;
      color: #dc2626;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
    .param-name {
      text-align: left;
      font-weight: 800;
      color: #1e3a8a;
      font-size: 11px;
    }
    .param-sub {
      color: #64748b;
      font-size: 10px;
      font-weight: 500;
    }
    .param-result {
      font-weight: 800;
      color: #059669;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
    .footer-section {
      margin-top: 14px;
      border: 1px solid #64748b;
      border-radius: 6px;
      padding: 10px;
      background: #f8fafc;
    }
    .remarks-box {
      font-size: 11px;
      font-weight: 500;
      color: #1e293b;
      min-height: 36px;
      line-height: 1.5;
    }
    
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: right; margin-bottom: 12px; max-width: 820px; margin-left: auto; margin-right: auto;">
    <button onclick="window.print()" style="padding: 9px 18px; background: #1e3a8a; color: white; border: none; border-radius: 8px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; font-size: 12px; shadow: 0 2px 4px rgba(0,0,0,0.1);">Print / Save as PDF</button>
  </div>

  <div class="report-container">
    <!-- Header -->
    <div class="header">
      <h1 class="company-name">${COMPANY_CONFIG.name}</h1>
      <h2 class="report-title">PAPER TEST REPORT (COA)</h2>
    </div>

    <!-- Metadata Top Table -->
    <table class="meta-table">
      <tr>
        <td class="label-cell">QUALITY:</td>
        <td class="val-cell">${report.product}</td>
        <td class="label-cell">ROLL NO:</td>
        <td class="val-cell">${report.rollNo}</td>
        <td class="label-cell">SHIFT:</td>
        <td class="val-cell">${(report.shift as string) === 'A' || (report.shift as string) === 'Day' ? 'Day' : (report.shift as string) === 'B' || (report.shift as string) === 'Night' ? 'Night' : report.shift}</td>
        <td class="label-cell">DATE:</td>
        <td class="val-cell">${report.date.split('-').reverse().join('.')}</td>
      </tr>
      <tr>
        <td class="label-cell">GSM:</td>
        <td class="val-cell">${report.targetGsm}</td>
        <td class="label-cell">WEIGHT:</td>
        <td class="val-cell">${report.weight} kg</td>
        <td class="label-cell">SPEED:</td>
        <td class="val-cell">${report.speed}</td>
        <td class="label-cell">TIME:</td>
        <td class="val-cell">${report.time}</td>
      </tr>
      <tr>
        <td class="label-cell">CREPING:</td>
        <td class="val-cell">${report.crepingPct.toFixed(2)}%</td>
        <td colspan="6" style="border: none; background: transparent;"></td>
      </tr>
    </table>

    <!-- Dual Column Main Layout -->
    <div class="main-grid">
      
      <!-- Left Column: GSM Profile (14 Samples & Auto Stats) -->
      <div class="gsm-column">
        <table>
          <tr class="section-header">
            <th style="width: 40%;">SR NO</th>
            <th style="width: 60%;">GSM</th>
          </tr>
          ${(report.gsmSamples || Array(14).fill(16.5)).slice(0, 14).map((val, idx) => `
            <tr>
              <td class="gsm-row-num">${idx + 1}</td>
              <td class="gsm-val">${(Number(val) || 0).toFixed(1)}</td>
            </tr>
          `).join('')}
          <tr style="background: #f1f5f9;">
            <td class="stat-label">Avg.</td>
            <td class="stat-val">${report.avgGsm.toFixed(1)}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td class="stat-label">Max.</td>
            <td class="stat-val">${report.maxGsm.toFixed(1)}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td class="stat-label">Min.</td>
            <td class="stat-val">${report.minGsm.toFixed(1)}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td class="stat-label">Range.</td>
            <td class="stat-val">${report.rangeGsm.toFixed(2)}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td class="stat-label">Breakage:</td>
            <td class="stat-val" style="color: ${report.breakageCount > 0 ? '#dc2626' : '#059669'};">${report.breakageCount}</td>
          </tr>
        </table>
      </div>

      <!-- Right Column: 13 Test Parameters Table -->
      <div class="param-column">
        <table>
          <tr class="section-header">
            <th style="width: 8%;">SR NO</th>
            <th style="width: 32%;">TEST PARAMETER</th>
            <th style="width: 25%;">SPEC / ORIENTATION</th>
            <th style="width: 15%;">UNITS</th>
            <th style="width: 20%;">RESULT</th>
          </tr>
          <tr>
            <td>1</td>
            <td class="param-name">GSM</td>
            <td class="param-sub">Target Match</td>
            <td>g/m2</td>
            <td class="param-result">${report.labResultGsm.toFixed(1)}</td>
          </tr>
          <tr>
            <td>2</td>
            <td class="param-name">MOISTURE</td>
            <td class="param-sub">Content %</td>
            <td>%</td>
            <td class="param-result">${report.moisturePct.toFixed(2)}</td>
          </tr>
          <tr>
            <td>3</td>
            <td class="param-name">CALIPER</td>
            <td class="param-sub">Thickness</td>
            <td>MM</td>
            <td class="param-result">${report.caliperMm}</td>
          </tr>
          <tr>
            <td>4</td>
            <td class="param-name">BULK</td>
            <td class="param-sub">Specific Volume</td>
            <td>cc/gm</td>
            <td class="param-result">${report.bulkCcGm.toFixed(2)}</td>
          </tr>
          <tr>
            <td>5</td>
            <td class="param-name">BREAKING LENGTH</td>
            <td class="param-sub">10 cm length (MD)</td>
            <td>Mtr</td>
            <td class="param-result">${report.breakingLengthMd.toFixed(3)}</td>
          </tr>
          <tr>
            <td>6</td>
            <td class="param-name">BREAKING LENGTH</td>
            <td class="param-sub">10 cm length (CD)</td>
            <td>Mtr</td>
            <td class="param-result">${report.breakingLengthCd.toFixed(3)}</td>
          </tr>
          <tr>
            <td>7</td>
            <td class="param-name">BRIGHTNESS</td>
            <td class="param-sub">Optical ISO %</td>
            <td>%</td>
            <td class="param-result" style="color: #dc2626;">${report.brightnessPct.toFixed(1)}</td>
          </tr>
          <tr>
            <td>8</td>
            <td class="param-name">TEAR</td>
            <td class="param-sub">Tear Resistance (MD)</td>
            <td>J/m2</td>
            <td class="param-result">${report.tearMd.toFixed(2)}</td>
          </tr>
          <tr>
            <td>9</td>
            <td class="param-name">TEAR</td>
            <td class="param-sub">Tear Resistance (CD)</td>
            <td>J/m2</td>
            <td class="param-result">${report.tearCd.toFixed(2)}</td>
          </tr>
          <tr>
            <td>10</td>
            <td class="param-name">TENSILE DRY</td>
            <td class="param-sub">1 PLY (MD)</td>
            <td>N/M</td>
            <td class="param-result">${report.tensileDryMd.toFixed(2)}</td>
          </tr>
          <tr>
            <td>11</td>
            <td class="param-name">TENSILE DRY</td>
            <td class="param-sub">1 PLY (CD)</td>
            <td>N/M</td>
            <td class="param-result">${report.tensileDryCd.toFixed(2)}</td>
          </tr>
          <tr>
            <td>12</td>
            <td class="param-name">STERACH DRY</td>
            <td class="param-sub">1 PLY (MD)</td>
            <td>%</td>
            <td class="param-result">${report.stretchDryMd.toFixed(2)}</td>
          </tr>
          <tr>
            <td>13</td>
            <td class="param-name">STERACH DRY</td>
            <td class="param-sub">1 PLY (CD)</td>
            <td>%</td>
            <td class="param-result">${report.stretchDryCd.toFixed(2)}</td>
          </tr>
        </table>
      </div>

    </div>

    <!-- Footer Remarks -->
    <div class="footer-section">
      <div style="font-weight: 800; color: #dc2626; font-size: 11px; margin-bottom: 4px;">Remark:</div>
      <div class="remarks-box">${report.remarks || 'Sample meets all physical strength, moisture & GSM quality benchmarks.'}</div>
    </div>

    <!-- Company Footer -->
    <div style="text-align: center; font-size: 9px; font-weight: 600; color: #64748b; margin-top: 14px; border-top: 1px solid #cbd5e1; padding-top: 6px;">
      ${COMPANY_CONFIG.name} &bull; ${COMPANY_CONFIG.address} &bull; Mo: ${COMPANY_CONFIG.phone} &bull; ${COMPANY_CONFIG.website}
    </div>
  </div>
</body>
</html>
  `;

  const jobTitle = `COA_Roll_${report.rollNo}_${report.date || 'Report'}`;

  // 1. Android Native Capacitor Bridge (Direct Android Print Spooler in APK)
  if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.printHtml) {
    try {
      (window as any).AndroidNativeBridge.printHtml(html, jobTitle);
      return;
    } catch (androidErr) {
      console.warn('[LabPrint] AndroidNativeBridge.printHtml failed, falling back:', androidErr);
    }
  }

  // 2. Open directly in dedicated print tab / window (Mobile Browser & Desktop)
  try {
    const printWin = window.open('', '_blank');
    if (printWin && printWin.document) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();

      setTimeout(() => {
        try {
          printWin.print();
        } catch (e) {
          console.warn('[LabPrint] printWin.print() error:', e);
        }
      }, 300);
      return;
    }
  } catch (winErr) {
    console.warn('[LabPrint] window.open blocked, falling back to hidden iframe:', winErr);
  }

  // 3. Fallback: Silent hidden iframe (never flashes or scrolls the main app)
  try {
    const existingIframe = document.getElementById('saheb-silent-print-frame');
    if (existingIframe && document.body.contains(existingIframe)) {
      document.body.removeChild(existingIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'saheb-silent-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (iframeErr) {
          console.warn('[LabPrint] iframe print failed:', iframeErr);
          window.print();
        } finally {
          setTimeout(() => {
            if (iframe && document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 60000);
        }
      }, 350);
      return;
    }
  } catch (frameErr) {
    console.warn('[LabPrint] hidden iframe failed, falling back to window.print():', frameErr);
    window.print();
  }
}
