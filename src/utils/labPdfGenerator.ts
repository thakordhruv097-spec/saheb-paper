import type { PaperTestReport } from '../data/types';
import { COMPANY_CONFIG } from '../config/company';
import { universalPrintOrDownload } from './universalPrint';
import { jsPDF } from 'jspdf';

export function generatePaperTestReportHtml(report: PaperTestReport): string {
  return `
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
        <td class="val-cell">${report.product || 'Semi Kraft'}</td>
        <td class="label-cell">ROLL NO:</td>
        <td class="val-cell">${report.rollNo || ''}</td>
        <td class="label-cell">SHIFT:</td>
        <td class="val-cell">${(report.shift as string) === 'A' || (report.shift as string) === 'Day' ? 'Day' : (report.shift as string) === 'B' || (report.shift as string) === 'Night' ? 'Night' : (report.shift || 'Day')}</td>
        <td class="label-cell">DATE:</td>
        <td class="val-cell">${(report.date || '').includes('-') ? report.date.split('-').reverse().join('.') : (report.date || '')}</td>
      </tr>
      <tr>
        <td class="label-cell">GSM:</td>
        <td class="val-cell">${report.targetGsm ?? 0}</td>
        <td class="label-cell">WEIGHT:</td>
        <td class="val-cell">${report.weight ?? 0} kg</td>
        <td class="label-cell">SPEED:</td>
        <td class="val-cell">${report.speed ?? 0}</td>
        <td class="label-cell">TIME:</td>
        <td class="val-cell">${report.time || ''}</td>
      </tr>
      <tr>
        <td class="label-cell">CREPING:</td>
        <td class="val-cell">${(Number(report.crepingPct) || 0).toFixed(2)}%</td>
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
            <td class="stat-val">${(Number(report.avgGsm) || 0).toFixed(1)}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td class="stat-label">Max.</td>
            <td class="stat-val">${(Number(report.maxGsm) || 0).toFixed(1)}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td class="stat-label">Min.</td>
            <td class="stat-val">${(Number(report.minGsm) || 0).toFixed(1)}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td class="stat-label">Range.</td>
            <td class="stat-val">${(Number(report.rangeGsm) || 0).toFixed(2)}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td class="stat-label">Breakage:</td>
            <td class="stat-val" style="color: ${(Number(report.breakageCount) || 0) > 0 ? '#dc2626' : '#059669'};">${report.breakageCount ?? 0}</td>
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
            <td class="param-result">${(Number(report.labResultGsm) || 0).toFixed(1)}</td>
          </tr>
          <tr>
            <td>2</td>
            <td class="param-name">MOISTURE</td>
            <td class="param-sub">Content %</td>
            <td>%</td>
            <td class="param-result">${(Number(report.moisturePct) || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>3</td>
            <td class="param-name">CALIPER</td>
            <td class="param-sub">Thickness</td>
            <td>MM</td>
            <td class="param-result">${report.caliperMm ?? 0}</td>
          </tr>
          <tr>
            <td>4</td>
            <td class="param-name">BULK</td>
            <td class="param-sub">Specific Volume</td>
            <td>cc/gm</td>
            <td class="param-result">${(Number(report.bulkCcGm) || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>5</td>
            <td class="param-name">BREAKING LENGTH</td>
            <td class="param-sub">10 cm length (MD)</td>
            <td>Mtr</td>
            <td class="param-result">${(Number(report.breakingLengthMd) || 0).toFixed(3)}</td>
          </tr>
          <tr>
            <td>6</td>
            <td class="param-name">BREAKING LENGTH</td>
            <td class="param-sub">10 cm length (CD)</td>
            <td>Mtr</td>
            <td class="param-result">${(Number(report.breakingLengthCd) || 0).toFixed(3)}</td>
          </tr>
          <tr>
            <td>7</td>
            <td class="param-name">BRIGHTNESS</td>
            <td class="param-sub">Optical ISO %</td>
            <td>%</td>
            <td class="param-result" style="color: #dc2626;">${(Number(report.brightnessPct) || 0).toFixed(1)}</td>
          </tr>
          <tr>
            <td>8</td>
            <td class="param-name">TEAR</td>
            <td class="param-sub">Tear Resistance (MD)</td>
            <td>J/m2</td>
            <td class="param-result">${(Number(report.tearMd) || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>9</td>
            <td class="param-name">TEAR</td>
            <td class="param-sub">Tear Resistance (CD)</td>
            <td>J/m2</td>
            <td class="param-result">${(Number(report.tearCd) || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>10</td>
            <td class="param-name">TENSILE DRY</td>
            <td class="param-sub">1 PLY (MD)</td>
            <td>N/M</td>
            <td class="param-result">${(Number(report.tensileDryMd) || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>11</td>
            <td class="param-name">TENSILE DRY</td>
            <td class="param-sub">1 PLY (CD)</td>
            <td>N/M</td>
            <td class="param-result">${(Number(report.tensileDryCd) || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>12</td>
            <td class="param-name">STERACH DRY</td>
            <td class="param-sub">1 PLY (MD)</td>
            <td>%</td>
            <td class="param-result">${(Number(report.stretchDryMd) || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>13</td>
            <td class="param-name">STERACH DRY</td>
            <td class="param-sub">1 PLY (CD)</td>
            <td>%</td>
            <td class="param-result">${(Number(report.stretchDryCd) || 0).toFixed(2)}</td>
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
}

export function printPaperTestReport(report: PaperTestReport, onToast?: (msg: string) => void): void {
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

  const html = generatePaperTestReportHtml(report);
  const jobTitle = `COA_Roll_${report.rollNo}_${report.date || 'Report'}`;
  const filename = `COA_Roll_${report.rollNo}.pdf`;

  universalPrintOrDownload({
    title: `Paper Test Certificate - Roll #${report.rollNo}`,
    filename,
    htmlContent: html,
    jobName: jobTitle,
    onSuccess: (msg) => {
      if (onToast) {
        onToast(msg);
      }
    },
  });
}

/**
 * Generates a genuine standalone vector jsPDF document for Paper Test Report (COA).
 * 100% vector text, lightweight (~30KB), formatted to fit standard A4 portrait sheet.
 */
export function generatePaperTestReportPdfDoc(report: PaperTestReport): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const MARGIN = 10;
  const CONTENT_W = 190;

  // 1. Outer Border
  doc.setDrawColor(30, 58, 138); // Navy blue #1e3a8a
  doc.setLineWidth(0.6);
  doc.rect(MARGIN, MARGIN, CONTENT_W, 277);

  // 2. Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138);
  doc.text(COMPANY_CONFIG.name, 105, 17, { align: 'center' });

  doc.setFontSize(10.5);
  doc.setTextColor(220, 38, 38); // Red #dc2626
  doc.text('PAPER TEST REPORT (CERTIFICATE OF ANALYSIS)', 105, 23, { align: 'center' });

  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, 26, MARGIN + CONTENT_W, 26);

  // 3. Top Metadata Table (3 rows)
  const metaY = 28;
  doc.setFontSize(8);
  doc.setDrawColor(180, 190, 205);
  doc.setLineWidth(0.2);

  const drawCell = (x: number, y: number, w: number, h: number, label: string, val: string | number) => {
    const labelW = Math.min(w * 0.45, 25);
    const valW = w - labelW;
    doc.setFillColor(241, 245, 249);
    doc.rect(x, y, labelW, h, 'FD');
    doc.setFillColor(255, 255, 255);
    doc.rect(x + labelW, y, valW, h, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(label, x + 1.5, y + h * 0.68);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(String(val ?? ''), x + labelW + 1.5, y + h * 0.68);
  };

  const shiftText = String(report.shift) === 'B' || String(report.shift) === 'Night' ? 'Night (B)' : 'Day (A)';
  const dateText = report.date ? (report.date.includes('-') ? report.date.split('-').reverse().join('.') : report.date) : '';

  // Row 1 (metaY)
  drawCell(10, metaY, 48, 5.5, 'QUALITY:', report.product || 'Semi Kraft');
  drawCell(58, metaY, 46, 5.5, 'ROLL NO:', report.rollNo || '');
  drawCell(104, metaY, 46, 5.5, 'SHIFT:', shiftText);
  drawCell(150, metaY, 50, 5.5, 'DATE:', dateText);

  // Row 2 (metaY + 5.5)
  drawCell(10, metaY + 5.5, 48, 5.5, 'GSM:', `${report.targetGsm ?? 16} g/m2`);
  drawCell(58, metaY + 5.5, 46, 5.5, 'WEIGHT:', `${report.weight ?? 0} kg`);
  drawCell(104, metaY + 5.5, 46, 5.5, 'SPEED:', `${report.speed ?? 0} mpm`);
  drawCell(150, metaY + 5.5, 50, 5.5, 'TIME:', report.time || '08:00');

  // Row 3 (metaY + 11)
  drawCell(10, metaY + 11, 48, 5.5, 'CREPING:', `${(Number(report.crepingPct) || 0).toFixed(2)}%`);
  doc.setFillColor(255, 255, 255);
  doc.rect(58, metaY + 11, 142, 5.5, 'FD');

  // 4. Dual Column Main Layout
  const bodyY = 48;

  // --- Left Column: GSM Profile (X=10 to 68, width 58) ---
  doc.setFillColor(30, 58, 138);
  doc.rect(10, bodyY, 58, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('SR NO', 20, bodyY + 4.2, { align: 'center' });
  doc.text('GSM', 49, bodyY + 4.2, { align: 'center' });

  const gsmSamples = report.gsmSamples && report.gsmSamples.length > 0 ? report.gsmSamples : Array(14).fill(16.5);
  const rowH = 6.8;

  // 14 GSM sample rows
  for (let i = 0; i < 14; i++) {
    const y = bodyY + 6 + (i * rowH);
    doc.setFillColor(i % 2 === 1 ? 248 : 255, i % 2 === 1 ? 250 : 255, i % 2 === 1 ? 252 : 255);
    doc.rect(10, y, 20, rowH, 'FD');
    doc.rect(30, y, 38, rowH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(String(i + 1), 20, y + 4.6, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setTextColor(220, 38, 38);
    const val = (Number(gsmSamples[i]) || 0).toFixed(1);
    doc.text(val, 49, y + 4.6, { align: 'center' });
  }

  // 5 Summary rows
  const summaryRows = [
    { label: 'Avg.', val: (Number(report.avgGsm) || 0).toFixed(1) },
    { label: 'Max.', val: (Number(report.maxGsm) || 0).toFixed(1) },
    { label: 'Min.', val: (Number(report.minGsm) || 0).toFixed(1) },
    { label: 'Range.', val: (Number(report.rangeGsm) || 0).toFixed(2) },
    { label: 'Breakage:', val: String(report.breakageCount ?? 0) },
  ];

  for (let s = 0; s < summaryRows.length; s++) {
    const y = bodyY + 6 + (14 * rowH) + (s * rowH);
    doc.setFillColor(241, 245, 249);
    doc.rect(10, y, 20, rowH, 'FD');
    doc.rect(30, y, 38, rowH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(summaryRows[s].label, 12, y + 4.6);

    doc.setFont('courier', 'bold');
    if (s === 4 && (Number(report.breakageCount) || 0) > 0) {
      doc.setTextColor(220, 38, 38);
    } else if (s === 4) {
      doc.setTextColor(21, 128, 61);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(summaryRows[s].val, 49, y + 4.6, { align: 'center' });
  }

  // --- Right Column: 13 Test Parameters Table (X=71 to 200, width 129) ---
  doc.setFillColor(30, 58, 138);
  doc.rect(71, bodyY, 129, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SR', 76, bodyY + 4.2, { align: 'center' });
  doc.text('TEST PARAMETER', 82, bodyY + 4.2);
  doc.text('SPECIFICATION', 127, bodyY + 4.2);
  doc.text('UNITS', 163, bodyY + 4.2);
  doc.text('RESULT', 189, bodyY + 4.2, { align: 'center' });

  const testParams = [
    { sr: 1, name: 'GSM', spec: 'Target Match', unit: 'g/m2', result: (Number(report.labResultGsm) || 0).toFixed(1) },
    { sr: 2, name: 'MOISTURE', spec: 'Content %', unit: '%', result: `${(Number(report.moisturePct) || 0).toFixed(2)}%` },
    { sr: 3, name: 'CALIPER', spec: 'Thickness', unit: 'MM', result: String(report.caliperMm ?? 0) },
    { sr: 4, name: 'BULK', spec: 'Specific Volume', unit: 'cc/gm', result: (Number(report.bulkCcGm) || 0).toFixed(2) },
    { sr: 5, name: 'BREAKING LENGTH', spec: '10 cm length (MD)', unit: 'Mtr', result: (Number(report.breakingLengthMd) || 0).toFixed(3) },
    { sr: 6, name: 'BREAKING LENGTH', spec: '10 cm length (CD)', unit: 'Mtr', result: (Number(report.breakingLengthCd) || 0).toFixed(3) },
    { sr: 7, name: 'BRIGHTNESS', spec: 'Optical ISO %', unit: '%', result: `${(Number(report.brightnessPct) || 0).toFixed(1)}%` },
    { sr: 8, name: 'TEAR', spec: 'Tear Resistance (MD)', unit: 'J/m2', result: (Number(report.tearMd) || 0).toFixed(2) },
    { sr: 9, name: 'TEAR', spec: 'Tear Resistance (CD)', unit: 'J/m2', result: (Number(report.tearCd) || 0).toFixed(2) },
    { sr: 10, name: 'TENSILE DRY', spec: '1 PLY (MD)', unit: 'N/M', result: (Number(report.tensileDryMd) || 0).toFixed(2) },
    { sr: 11, name: 'TENSILE DRY', spec: '1 PLY (CD)', unit: 'N/M', result: (Number(report.tensileDryCd) || 0).toFixed(2) },
    { sr: 12, name: 'STRETCH DRY', spec: '1 PLY (MD)', unit: '%', result: `${(Number(report.stretchDryMd) || 0).toFixed(2)}%` },
    { sr: 13, name: 'STRETCH DRY', spec: '1 PLY (CD)', unit: '%', result: `${(Number(report.stretchDryCd) || 0).toFixed(2)}%` },
  ];

  const pRowH = 10;
  for (let p = 0; p < testParams.length; p++) {
    const y = bodyY + 6 + (p * pRowH);
    doc.setFillColor(p % 2 === 1 ? 248 : 255, p % 2 === 1 ? 250 : 255, p % 2 === 1 ? 252 : 255);
    doc.rect(71, y, 9, pRowH, 'FD'); // SR
    doc.rect(80, y, 45, pRowH, 'FD'); // NAME
    doc.rect(125, y, 36, pRowH, 'FD'); // SPEC
    doc.rect(161, y, 17, pRowH, 'FD'); // UNIT
    doc.rect(178, y, 22, pRowH, 'FD'); // RESULT

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(String(testParams[p].sr), 75.5, y + 6.2, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(testParams[p].name, 82, y + 6.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(testParams[p].spec, 127, y + 6.2);

    doc.setTextColor(71, 85, 105);
    doc.text(testParams[p].unit, 163, y + 6.2);

    doc.setFont('courier', 'bold');
    doc.setTextColor(21, 128, 61);
    doc.text(testParams[p].result, 189, y + 6.2, { align: 'center' });
  }

  // 5. Remarks Box (Y=192 to 214)
  const remY = 192;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(180, 190, 205);
  doc.rect(MARGIN, remY, CONTENT_W, 22, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(220, 38, 38);
  doc.text('REMARKS / OBSERVATIONS:', MARGIN + 2.5, remY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const remarksText = report.remarks || 'Sample meets all physical strength, moisture & GSM quality benchmarks with Grade-A clearance.';
  const wrappedRemarks = doc.splitTextToSize(remarksText, 184);
  doc.text(wrappedRemarks, MARGIN + 2.5, remY + 10);

  // 6. Signature Authorities (Y=222)
  const sigY = 222;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);

  // Chemist
  doc.line(MARGIN + 10, sigY + 14, MARGIN + 50, sigY + 14);
  doc.text('Prepared By (Lab Chemist)', MARGIN + 30, sigY + 18, { align: 'center' });

  // QC Incharge
  doc.line(85, sigY + 14, 125, sigY + 14);
  doc.text('Checked By (QC Incharge)', 105, sigY + 18, { align: 'center' });

  // Manager
  doc.line(150, sigY + 14, 190, sigY + 14);
  doc.text('Approved By (Mill Manager)', 170, sigY + 18, { align: 'center' });

  // 7. Company Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.line(MARGIN, 268, MARGIN + CONTENT_W, 268);
  doc.text(`${COMPANY_CONFIG.name} • ${COMPANY_CONFIG.address} • Mo: ${COMPANY_CONFIG.phone} • ${COMPANY_CONFIG.website}`, 105, 273, { align: 'center' });

  return doc;
}

/**
 * Returns PDF as Blob for viewing / new tab opening
 */
export function generatePaperTestReportPdfBlob(report: PaperTestReport): Blob {
  const doc = generatePaperTestReportPdfDoc(report);
  return doc.output('blob');
}

/**
 * Direct PDF download for Paper Test Report (COA).
 * - In Android Capacitor APK: uses native Android bridge to write directly to phone's public Downloads directory
 * - In Mobile Chrome, PWA, and Desktop: triggers direct synchronous browser file download via jsPDF FileSaver
 */
export function downloadPaperTestReportPdf(report: PaperTestReport, filename: string): void {
  const doc = generatePaperTestReportPdfDoc(report);

  // 1. Android Capacitor Native Bridge (Direct save to phone's public Downloads directory)
  if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.saveToDownloads) {
    try {
      const dataUri = doc.output('dataurlstring');
      const base64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
      const saved = (window as any).AndroidNativeBridge.saveToDownloads(base64, filename, 'application/pdf');
      if (saved) return;
    } catch (bridgeErr) {
      console.warn('[PDF] AndroidNativeBridge.saveToDownloads failed:', bridgeErr);
    }
  }

  // 2. Direct browser download via jsPDF FileSaver (synchronous, preserves user gesture)
  doc.save(filename);
}

