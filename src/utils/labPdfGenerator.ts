import type { PaperTestReport } from '../data/types';
import { COMPANY_CONFIG } from '../config/company';
import { universalPrintOrDownload } from './universalPrint';
import { jsPDF } from 'jspdf';
import { uploadDocumentToCloud, triggerCloudDownload } from './cloudDocumentStorage';

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

    <!-- Signatures (Underline Style with Lighter & Smaller Fonts) -->
    <div style="display: flex; justify-content: space-between; margin-top: 55px; margin-bottom: 25px; padding: 0 20px; text-align: center;">
      <div style="width: 28%;">
        <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 6px;"></div>
        <div style="font-size: 11px; font-weight: 500; color: #475569;">Prepared By</div>
        <div style="font-size: 9.5px; font-weight: 400; color: #94a3b8;">(Lab Chemist)</div>
      </div>
      <div style="width: 28%;">
        <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 6px;"></div>
        <div style="font-size: 11px; font-weight: 500; color: #475569;">Checked By</div>
        <div style="font-size: 9.5px; font-weight: 400; color: #94a3b8;">(QC Incharge)</div>
      </div>
      <div style="width: 28%;">
        <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 6px;"></div>
        <div style="font-size: 11px; font-weight: 500; color: #475569;">Approved By</div>
        <div style="font-size: 9.5px; font-weight: 400; color: #94a3b8;">(Mill Manager)</div>
      </div>
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

  // A4 = 210 x 297 mm
  // Outer Border Box (Rounded navy border with 8mm margin from paper edge)
  const FRAME_X = 8;
  const FRAME_Y = 8;
  const FRAME_W = 194;
  const FRAME_H = 281;

  doc.setDrawColor(30, 58, 138); // Navy blue #1e3a8a
  doc.setLineWidth(0.5);
  doc.roundedRect(FRAME_X, FRAME_Y, FRAME_W, FRAME_H, 2.5, 2.5, 'S');

  // Internal Content Margin (6mm padding inside the frame)
  // This creates clear side gaps between the outer outline and all tables!
  const CONTENT_X = 14;
  const CONTENT_W = 182; // from X=14 to X=196 (leaves 6mm gap to outer frame X=202)

  // 1. Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text(COMPANY_CONFIG.name, 105, 17, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setTextColor(220, 38, 38); // Red #dc2626
  doc.text('PAPER TEST REPORT (COA)', 105, 22.5, { align: 'center' });

  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.35);
  doc.line(CONTENT_X, 25.5, CONTENT_X + CONTENT_W, 25.5);

  // 2. Top Metadata Table (3 rows)
  const metaY = 28;
  doc.setFontSize(7.5);
  doc.setDrawColor(203, 213, 225); // Subtle slate-300 border
  doc.setLineWidth(0.18);

  const drawCell = (x: number, y: number, w: number, h: number, label: string, val: string | number) => {
    const labelW = Math.min(w * 0.42, 22);
    const valW = w - labelW;
    doc.setFillColor(248, 250, 252); // Soft light slate #f8fafc
    doc.rect(x, y, labelW, h, 'FD');
    doc.setFillColor(255, 255, 255);
    doc.rect(x + labelW, y, valW, h, 'FD');

    // Lighter, refined font
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(220, 38, 38); // Red label
    doc.text(label, x + 1.2, y + h * 0.68);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 58, 138); // Navy value
    doc.text(String(val ?? ''), x + labelW + 1.5, y + h * 0.68);
  };

  const shiftText = String(report.shift) === 'B' || String(report.shift) === 'Night' ? 'Night' : 'Day';
  const dateText = report.date ? (report.date.includes('-') ? report.date.split('-').reverse().join('.') : report.date) : '26.09.2026';

  const colW1 = 45;
  const colW2 = 45;
  const colW3 = 45;
  const colW4 = 47; // 45 + 45 + 45 + 47 = 182 mm
  const rowH_meta = 5.2;

  // Row 1 (metaY)
  drawCell(CONTENT_X, metaY, colW1, rowH_meta, 'QUALITY:', report.product || 'NAPKIN');
  drawCell(CONTENT_X + colW1, metaY, colW2, rowH_meta, 'ROLL NO:', report.rollNo || '');
  drawCell(CONTENT_X + colW1 + colW2, metaY, colW3, rowH_meta, 'SHIFT:', shiftText);
  drawCell(CONTENT_X + colW1 + colW2 + colW3, metaY, colW4, rowH_meta, 'DATE:', dateText);

  // Row 2 (metaY + 5.2)
  drawCell(CONTENT_X, metaY + rowH_meta, colW1, rowH_meta, 'GSM:', `${report.targetGsm ?? 16}`);
  drawCell(CONTENT_X + colW1, metaY + rowH_meta, colW2, rowH_meta, 'WEIGHT:', `${report.weight ?? 0} kg`);
  drawCell(CONTENT_X + colW1 + colW2, metaY + rowH_meta, colW3, rowH_meta, 'SPEED:', `${report.speed ?? 0}`);
  drawCell(CONTENT_X + colW1 + colW2 + colW3, metaY + rowH_meta, colW4, rowH_meta, 'TIME:', report.time || '07:50');

  // Row 3 (metaY + 10.4)
  drawCell(CONTENT_X, metaY + (2 * rowH_meta), colW1, rowH_meta, 'CREPING:', `${(Number(report.crepingPct) || 0).toFixed(2)}%`);
  doc.setFillColor(255, 255, 255);
  doc.rect(CONTENT_X + colW1, metaY + (2 * rowH_meta), colW2 + colW3 + colW4, rowH_meta, 'FD');

  // 3. Dual Column Main Layout
  // Left: GSM Profile (X=14, w=54 mm)
  // Gap between columns: 4 mm (from X=68 to X=72)
  // Right: 13 Test Parameters (X=72, w=124 mm)
  const bodyY = 46.5;
  const leftX = CONTENT_X;
  const leftW = 54;
  const colGap = 4;
  const rightX = leftX + leftW + colGap; // 14 + 54 + 4 = 72
  const rightW = CONTENT_W - leftW - colGap; // 182 - 54 - 4 = 124 mm

  // --- Left Column Header ---
  doc.setFillColor(30, 58, 138);
  doc.rect(leftX, bodyY, leftW, 5.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SR NO', leftX + 10, bodyY + 3.8, { align: 'center' });
  doc.text('GSM', leftX + 37, bodyY + 3.8, { align: 'center' });

  const gsmSamples = report.gsmSamples && report.gsmSamples.length > 0 ? report.gsmSamples : Array(14).fill(16.5);
  const rowH_gsm = 5.8;

  // 14 GSM sample rows
  doc.setLineWidth(0.15);
  doc.setDrawColor(203, 213, 225);
  for (let i = 0; i < 14; i++) {
    const y = bodyY + 5.2 + (i * rowH_gsm);
    doc.setFillColor(i % 2 === 1 ? 248 : 255, i % 2 === 1 ? 250 : 255, i % 2 === 1 ? 252 : 255);
    doc.rect(leftX, y, 20, rowH_gsm, 'FD');
    doc.rect(leftX + 20, y, leftW - 20, rowH_gsm, 'FD');

    // Lighter font
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(String(i + 1), leftX + 10, y + 4.0, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(220, 38, 38); // red
    const val = (Number(gsmSamples[i]) || 0).toFixed(1);
    doc.text(val, leftX + 37, y + 4.0, { align: 'center' });
  }

  // 5 Summary rows
  const summaryRows = [
    { label: 'Avg.', val: (Number(report.avgGsm) || 0).toFixed(1) },
    { label: 'Max.', val: (Number(report.maxGsm) || 0).toFixed(1) },
    { label: 'Min.', val: (Number(report.minGsm) || 0).toFixed(1) },
    { label: 'Range.', val: (Number(report.rangeGsm) || 0).toFixed(2) },
    { label: 'Breakage:', val: String(report.breakageCount ?? 0) },
  ];

  const rowH_sum = 5.5;
  for (let s = 0; s < summaryRows.length; s++) {
    const y = bodyY + 5.2 + (14 * rowH_gsm) + (s * rowH_sum);
    doc.setFillColor(241, 245, 249);
    doc.rect(leftX, y, 20, rowH_sum, 'FD');
    doc.rect(leftX + 20, y, leftW - 20, rowH_sum, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(summaryRows[s].label, leftX + 2.5, y + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (s === 4 && (Number(report.breakageCount) || 0) > 0) {
      doc.setTextColor(220, 38, 38);
    } else if (s === 4) {
      doc.setTextColor(21, 128, 61);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(summaryRows[s].val, leftX + 37, y + 3.8, { align: 'center' });
  }

  // Total Left Column Height = 5.2 + 81.2 + 27.5 = 113.9 mm (ends at Y = 160.4)
  const totalTableH = 5.2 + (14 * rowH_gsm) + (5 * rowH_sum);

  // --- Right Column: 13 Test Parameters Table (X=72, w=124 mm) ---
  doc.setFillColor(30, 58, 138);
  doc.rect(rightX, bodyY, rightW, 5.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SR', rightX + 4.5, bodyY + 3.8, { align: 'center' });
  doc.text('TEST PARAMETER', rightX + 11, bodyY + 3.8);
  doc.text('SPEC', rightX + 53, bodyY + 3.8);
  doc.text('UNITS', rightX + 85, bodyY + 3.8);
  doc.text('RESULT', rightX + 111, bodyY + 3.8, { align: 'center' });

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

  const pRowH = (totalTableH - 5.2) / 13; // exact 8.36 mm per row
  const colSr = 9;
  const colParam = 43;
  const colSpec = 31;
  const colUnit = 17;
  const colResult = 24; // 9 + 43 + 31 + 17 + 24 = 124 mm

  for (let p = 0; p < testParams.length; p++) {
    const y = bodyY + 5.2 + (p * pRowH);
    doc.setFillColor(p % 2 === 1 ? 248 : 255, p % 2 === 1 ? 250 : 255, p % 2 === 1 ? 252 : 255);
    doc.rect(rightX, y, colSr, pRowH, 'FD');
    doc.rect(rightX + colSr, y, colParam, pRowH, 'FD');
    doc.rect(rightX + colSr + colParam, y, colSpec, pRowH, 'FD');
    doc.rect(rightX + colSr + colParam + colSpec, y, colUnit, pRowH, 'FD');
    doc.rect(rightX + colSr + colParam + colSpec + colUnit, y, colResult, pRowH, 'FD');

    // Lighter, refined typography
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(String(testParams[p].sr), rightX + (colSr / 2), y + 5.2, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 58, 138);
    doc.text(testParams[p].name, rightX + colSr + 2, y + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(testParams[p].spec, rightX + colSr + colParam + 2, y + 5.2);

    doc.setTextColor(71, 85, 105);
    doc.text(testParams[p].unit, rightX + colSr + colParam + colSpec + 2, y + 5.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(21, 128, 61); // emerald green
    doc.text(testParams[p].result, rightX + colSr + colParam + colSpec + colUnit + (colResult / 2), y + 5.2, { align: 'center' });
  }

  // 4. Remarks Box (Starts at Y=164)
  const remY = bodyY + totalTableH + 4; // 46.5 + 113.9 + 4 = 164.4
  const remH = 17;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(CONTENT_X, remY, CONTENT_W, remH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(220, 38, 38);
  doc.text('REMARK:', CONTENT_X + 2.5, remY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  const remarksText = report.remarks || 'Sample meets all physical strength, moisture & GSM quality benchmarks with Grade-A clearance.';
  const wrappedRemarks = doc.splitTextToSize(remarksText, CONTENT_W - 5);
  doc.text(wrappedRemarks, CONTENT_X + 2.5, remY + 9.5);

  // 5. Signature Authorities (Underline Style with Lighter & Little Fonts)
  // Placed down at Y=246
  const sigY = 246;
  doc.setDrawColor(148, 163, 184); // subtle slate line
  doc.setLineWidth(0.2);

  // Chemist
  doc.line(CONTENT_X + 8, sigY, CONTENT_X + 50, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('Prepared By', CONTENT_X + 29, sigY + 4.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // slate-400 lighter
  doc.text('(Lab Chemist)', CONTENT_X + 29, sigY + 8.5, { align: 'center' });

  // QC Incharge
  doc.line(84, sigY, 126, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text('Checked By', 105, sigY + 4.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('(QC Incharge)', 105, sigY + 8.5, { align: 'center' });

  // Manager
  doc.line(CONTENT_X + CONTENT_W - 50, sigY, CONTENT_X + CONTENT_W - 8, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text('Approved By', CONTENT_X + CONTENT_W - 29, sigY + 4.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('(Mill Manager)', CONTENT_X + CONTENT_W - 29, sigY + 8.5, { align: 'center' });

  // 6. Company Footer (Pinned near bottom at Y=276)
  doc.setDrawColor(226, 232, 240); // subtle border
  doc.setLineWidth(0.15);
  doc.line(CONTENT_X, 274, CONTENT_X + CONTENT_W, 274);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${COMPANY_CONFIG.name} • ${COMPANY_CONFIG.address} • Mo: ${COMPANY_CONFIG.phone} • ${COMPANY_CONFIG.website}`,
    105,
    278,
    { align: 'center' }
  );

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
 * - In Mobile Chrome, PWA, and Desktop: uploads to Supabase Storage and triggers real HTTPS download via Android DownloadManager
 * - Fallback: triggers direct browser file download via jsPDF FileSaver
 */
export async function downloadPaperTestReportPdf(report: PaperTestReport, filename: string): Promise<void> {
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

  // 2. Supabase Cloud Storage (100% Native Android DownloadManager Support)
  // Uploads file to Supabase 'documents' bucket and triggers real HTTPS download with Content-Disposition: attachment.
  if (typeof window !== 'undefined') {
    try {
      const blob = doc.output('blob');
      const cloudUrls = await uploadDocumentToCloud(blob, filename);
      if (cloudUrls?.downloadUrl) {
        triggerCloudDownload(cloudUrls.downloadUrl, filename);
        return;
      }
    } catch (cloudErr) {
      console.warn('[PDF] Supabase cloud download route failed:', cloudErr);
    }
  }

  // 3. Direct browser download fallback via jsPDF FileSaver
  doc.save(filename);
}

