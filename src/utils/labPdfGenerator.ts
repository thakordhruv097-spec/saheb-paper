import type { PaperTestReport } from '../data/types';
import { COMPANY_CONFIG } from '../config/company';
import { downloadBlobFile } from './fileDownloader';

/**
 * Generates clean, zero-scrolling, print-perfect HTML document for Paper Test Report (COA)
 */
export function generateLabReportHtml(report: PaperTestReport): string {
  const gsmSamples = (report.gsmSamples && report.gsmSamples.length > 0 ? report.gsmSamples : Array(14).fill(16.5)).slice(0, 14);
  const formattedDate = report.date ? report.date.split('-').reverse().join('.') : new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
  const shiftDisplay = (report.shift as string) === 'A' || (report.shift as string) === 'Day' ? 'Day' : (report.shift as string) === 'B' || (report.shift as string) === 'Night' ? 'Night' : (report.shift || 'Day');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>COA - Roll ${report.rollNo} - ${COMPANY_CONFIG.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    @page {
      size: A4 portrait;
      margin: 6mm 6mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #e2e8f0;
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100vh;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Fixed Top Action Toolbar */
    .no-print-bar {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      background: #0f172a;
      color: #ffffff;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.18);
      z-index: 9999;
    }
    .bar-title {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .bar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      text-decoration: none;
      font-family: inherit;
    }
    .btn-print {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-print:hover {
      background: #1d4ed8;
    }
    .btn-download {
      background: #059669;
      color: #ffffff;
    }
    .btn-download:hover {
      background: #047857;
    }
    .btn-close {
      background: #334155;
      color: #f1f5f9;
    }
    .btn-close:hover {
      background: #475569;
    }

    /* Page View Container - Zero Scroll Calibration */
    .page-wrapper {
      padding: 12px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: calc(100vh - 50px);
    }

    .report-container {
      width: 100%;
      max-width: 790px;
      background: #ffffff;
      border: 2px solid #1e3a8a;
      border-radius: 6px;
      padding: 12px 14px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      box-sizing: border-box;
      margin: 0 auto;
    }

    /* Header */
    .header {
      text-align: center;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 5px;
      margin-bottom: 6px;
    }
    .company-name {
      font-size: 19px;
      font-weight: 900;
      color: #1e3a8a;
      letter-spacing: 1px;
      text-transform: uppercase;
      line-height: 1.15;
    }
    .report-title {
      font-size: 12.5px;
      font-weight: 800;
      color: #dc2626;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 2px;
    }

    /* Standard Table Styles */
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 9.5px;
    }
    th, td {
      border: 1px solid #64748b;
      padding: 3px 4px;
      text-align: center;
      vertical-align: middle;
      word-break: break-word;
      overflow: hidden;
      line-height: 1.25;
    }

    /* Top Metadata Table */
    .meta-table {
      margin-bottom: 6px;
      background-color: #f8fafc;
    }
    .label-cell {
      color: #dc2626;
      text-transform: uppercase;
      font-weight: 800 !important;
      background: #f1f5f9;
      font-size: 9px;
      letter-spacing: 0.3px;
      width: 13.5%;
    }
    .val-cell {
      color: #1e3a8a;
      font-weight: 700 !important;
      font-size: 10px;
      font-variant-numeric: tabular-nums;
      width: 11.5%;
    }

    /* Dual Column Layout */
    .main-grid {
      display: flex;
      gap: 6px;
      align-items: flex-start;
      width: 100%;
    }
    .gsm-column {
      flex: 0 0 26%;
      max-width: 26%;
    }
    .param-column {
      flex: 0 0 74%;
      max-width: 74%;
    }

    /* Section Headers */
    .section-header {
      background: #1e3a8a;
      color: #ffffff;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.5px;
    }
    .section-header th {
      border: 1px solid #1e3a8a;
      padding: 3px 2px;
    }

    .gsm-row-num {
      font-weight: 700;
      color: #334155;
      font-size: 9px;
    }
    .gsm-val {
      font-weight: 700;
      color: #dc2626;
      font-size: 10px;
      font-variant-numeric: tabular-nums;
    }
    .stat-label {
      font-weight: 800;
      color: #0f172a;
      background: #f1f5f9;
      text-align: left;
      font-size: 8.5px;
      padding-left: 4px;
    }
    .stat-val {
      font-weight: 800;
      color: #dc2626;
      font-size: 9.5px;
      font-variant-numeric: tabular-nums;
    }

    .param-name {
      text-align: left;
      font-weight: 800;
      color: #1e3a8a;
      font-size: 9px;
      padding-left: 4px;
    }
    .param-sub {
      color: #475569;
      font-size: 8px;
      font-weight: 600;
      text-align: left;
      padding-left: 4px;
    }
    .param-unit {
      font-size: 8.5px;
      font-weight: 600;
      color: #334155;
    }
    .param-result {
      font-weight: 800;
      color: #059669;
      font-size: 10px;
      font-variant-numeric: tabular-nums;
    }

    /* Remarks Box */
    .footer-section {
      margin-top: 6px;
      border: 1px solid #64748b;
      border-radius: 4px;
      padding: 5px 8px;
      background: #f8fafc;
    }
    .remarks-title {
      font-weight: 800;
      color: #dc2626;
      font-size: 9px;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .remarks-box {
      font-size: 9px;
      font-weight: 600;
      color: #1e293b;
      min-height: 20px;
      line-height: 1.35;
    }

    /* Footer Company Info */
    .company-footer {
      text-align: center;
      font-size: 8px;
      font-weight: 600;
      color: #64748b;
      margin-top: 6px;
      border-top: 1px solid #cbd5e1;
      padding-top: 3px;
    }

    /* Print Styles */
    @media print {
      @page {
        size: A4 portrait;
        margin: 5mm 5mm;
      }
      html, body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        height: auto !important;
        min-height: auto !important;
      }
      .no-print-bar {
        display: none !important;
      }
      .page-wrapper {
        padding: 0 !important;
        margin: 0 !important;
        min-height: auto !important;
      }
      .report-container {
        border: 2px solid #1e3a8a !important;
        box-shadow: none !important;
        max-width: 100% !important;
        width: 100% !important;
        padding: 8px !important;
        border-radius: 0 !important;
        margin: 0 !important;
      }
    }
  </style>
</head>
<body>
  <!-- Floating Top Action Toolbar (Hidden during print) -->
  <div class="no-print-bar">
    <div class="bar-title">
      <span>📄 Saheb Paper — Paper Test Certificate (Roll #${report.rollNo})</span>
    </div>
    <div class="bar-actions">
      <button type="button" class="btn btn-print" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg>
        Print / Save as PDF
      </button>
      <button type="button" class="btn btn-download" onclick="downloadReport()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Download HTML
      </button>
      <button type="button" class="btn btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="page-wrapper">
    <div class="report-container">
      <!-- 1. Header -->
      <div class="header">
        <h1 class="company-name">${COMPANY_CONFIG.name}</h1>
        <h2 class="report-title">PAPER TEST REPORT (COA)</h2>
      </div>

      <!-- 2. Metadata Top Table -->
      <table class="meta-table">
        <tr>
          <td class="label-cell">QUALITY:</td>
          <td class="val-cell">${report.product}</td>
          <td class="label-cell">ROLL NO:</td>
          <td class="val-cell">${report.rollNo}</td>
          <td class="label-cell">SHIFT:</td>
          <td class="val-cell">${shiftDisplay}</td>
          <td class="label-cell">DATE:</td>
          <td class="val-cell">${formattedDate}</td>
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

      <!-- 3. Dual Column Main Layout (Left: GSM 14 Profile, Right: 13 Specs) -->
      <div class="main-grid">
        
        <!-- Left Column: GSM Profile Table -->
        <div class="gsm-column">
          <table>
            <tr class="section-header">
              <th style="width: 42%;">SR NO</th>
              <th style="width: 58%;">GSM</th>
            </tr>
            ${gsmSamples.map((val, idx) => `
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
              <td class="stat-val" style="color: ${report.breakageCount > 0 ? '#dc2626' : '#059669'}; font-weight: 900;">${report.breakageCount}</td>
            </tr>
          </table>
        </div>

        <!-- Right Column: 13 Test Parameters Table -->
        <div class="param-column">
          <table>
            <tr class="section-header">
              <th style="width: 8%;">SR NO</th>
              <th style="width: 32%;">TEST PARAMETER</th>
              <th style="width: 27%;">SPEC / ORIENTATION</th>
              <th style="width: 13%;">UNITS</th>
              <th style="width: 20%;">RESULT</th>
            </tr>
            <tr>
              <td>1</td>
              <td class="param-name">GSM</td>
              <td class="param-sub">Target Match</td>
              <td class="param-unit">g/m2</td>
              <td class="param-result">${report.labResultGsm.toFixed(1)}</td>
            </tr>
            <tr>
              <td>2</td>
              <td class="param-name">MOISTURE</td>
              <td class="param-sub">Content %</td>
              <td class="param-unit">%</td>
              <td class="param-result">${report.moisturePct.toFixed(2)}</td>
            </tr>
            <tr>
              <td>3</td>
              <td class="param-name">CALIPER</td>
              <td class="param-sub">Thickness</td>
              <td class="param-unit">MM</td>
              <td class="param-result">${report.caliperMm}</td>
            </tr>
            <tr>
              <td>4</td>
              <td class="param-name">BULK</td>
              <td class="param-sub">Specific Volume</td>
              <td class="param-unit">cc/gm</td>
              <td class="param-result">${report.bulkCcGm.toFixed(2)}</td>
            </tr>
            <tr>
              <td>5</td>
              <td class="param-name">BREAKING LENGTH</td>
              <td class="param-sub">10 cm length (MD)</td>
              <td class="param-unit">Mtr</td>
              <td class="param-result">${report.breakingLengthMd.toFixed(3)}</td>
            </tr>
            <tr>
              <td>6</td>
              <td class="param-name">BREAKING LENGTH</td>
              <td class="param-sub">10 cm length (CD)</td>
              <td class="param-unit">Mtr</td>
              <td class="param-result">${report.breakingLengthCd.toFixed(3)}</td>
            </tr>
            <tr>
              <td>7</td>
              <td class="param-name">BRIGHTNESS</td>
              <td class="param-sub">Optical ISO %</td>
              <td class="param-unit">%</td>
              <td class="param-result" style="color: #dc2626;">${report.brightnessPct.toFixed(1)}</td>
            </tr>
            <tr>
              <td>8</td>
              <td class="param-name">TEAR</td>
              <td class="param-sub">Tear Resistance (MD)</td>
              <td class="param-unit">J/m2</td>
              <td class="param-result">${report.tearMd.toFixed(2)}</td>
            </tr>
            <tr>
              <td>9</td>
              <td class="param-name">TEAR</td>
              <td class="param-sub">Tear Resistance (CD)</td>
              <td class="param-unit">J/m2</td>
              <td class="param-result">${report.tearCd.toFixed(2)}</td>
            </tr>
            <tr>
              <td>10</td>
              <td class="param-name">TENSILE DRY</td>
              <td class="param-sub">1 PLY (MD)</td>
              <td class="param-unit">N/M</td>
              <td class="param-result">${report.tensileDryMd.toFixed(2)}</td>
            </tr>
            <tr>
              <td>11</td>
              <td class="param-name">TENSILE DRY</td>
              <td class="param-sub">1 PLY (CD)</td>
              <td class="param-unit">N/M</td>
              <td class="param-result">${report.tensileDryCd.toFixed(2)}</td>
            </tr>
            <tr>
              <td>12</td>
              <td class="param-name">STERACH DRY</td>
              <td class="param-sub">1 PLY (MD)</td>
              <td class="param-unit">%</td>
              <td class="param-result">${report.stretchDryMd.toFixed(2)}</td>
            </tr>
            <tr>
              <td>13</td>
              <td class="param-name">STERACH DRY</td>
              <td class="param-sub">1 PLY (CD)</td>
              <td class="param-unit">%</td>
              <td class="param-result">${report.stretchDryCd.toFixed(2)}</td>
            </tr>
          </table>
        </div>

      </div>

      <!-- 4. Footer Remarks -->
      <div class="footer-section">
        <div class="remarks-title">Remark:</div>
        <div class="remarks-box">${report.remarks || 'Sample meets all physical strength, moisture & GSM quality benchmarks.'}</div>
      </div>

      <!-- 5. Company Footer Identity -->
      <div class="company-footer">
        ${COMPANY_CONFIG.name} &bull; ${COMPANY_CONFIG.address} &bull; Mo: ${COMPANY_CONFIG.phone} &bull; ${COMPANY_CONFIG.website}
      </div>
    </div>
  </div>

  <script>
    function downloadReport() {
      try {
        const cloned = document.documentElement.cloneNode(true);
        const bar = cloned.querySelector('.no-print-bar');
        if (bar) bar.remove();
        const htmlText = '<!DOCTYPE html>\\n' + cloned.outerHTML;
        const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'COA_Report_Roll_${report.rollNo}_${report.date}.html';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
          if (document.body.contains(a)) document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1500);
      } catch (err) {
        alert('Download error: ' + err.message);
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Direct file download helper for Paper Test Certificate (COA) HTML file
 */
export async function downloadLabReportHtml(report: PaperTestReport): Promise<void> {
  const fullHtml = generateLabReportHtml(report);
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const filename = `COA_Report_Roll_${report.rollNo}_${report.date || new Date().toISOString().substring(0, 10)}.html`;
  await downloadBlobFile(blob, filename);
}

/**
 * Universal print handler for Lab Paper Test Certificate
 */
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

  // Dispatch custom in-app viewer event so LabView can open the modal reliably without popup blocking
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('saheb_view_lab_report', { detail: report }));
  }

  const html = generateLabReportHtml(report);

  // Strategy 1: Open clean print document in new window/tab
  try {
    const printWin = window.open('', '_blank', 'width=950,height=850,menubar=no,toolbar=no,location=no,status=no');
    if (printWin && printWin.document) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();

      setTimeout(() => {
        try {
          printWin.print();
        } catch (e) {
          console.warn('[LabPrint] printWin.print() error, toolbar button available:', e);
        }
      }, 350);
      return;
    }
  } catch (winErr) {
    console.warn('[LabPrint] window.open blocked or unsupported, falling back to iframe:', winErr);
  }

  // Strategy 2: Offscreen visible-dimensioned iframe
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '0';
    iframe.style.top = '0';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.opacity = '0.001';
    iframe.style.pointerEvents = 'none';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error('[LabPrint] Iframe print failed, falling back to window.print():', err);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 4000);
        }
      }, 350);
      return;
    }
  } catch (iframeErr) {
    console.error('[LabPrint] Iframe setup failed, falling back to window.print():', iframeErr);
    window.print();
  }
}

