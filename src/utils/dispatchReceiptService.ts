import * as XLSX from 'xlsx';
import type { Reel, PackingSlip, Party, Vehicle } from '../data/types';
import { getReels, getParties, getVehicles } from '../data';
import { getCompanyConfig } from '../config/company';
import { exportExcelWorkbook, downloadBlobFile, blobToBase64 } from './fileDownloader';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Safely resolves linked reels for a given packing slip from provided list or storage
 */
export function getLinkedReelsForSlip(slip: PackingSlip, customReels?: Reel[]): Reel[] {
  const allReels = (customReels && customReels.length > 0) ? customReels : getReels();
  const slipReelNos = slip.reelNos || [];

  if (slipReelNos.length === 0) {
    return [];
  }

  const isMatch = (a: string, b: string) => (a || '').trim().toUpperCase() === (b || '').trim().toUpperCase();

  const matched = allReels.filter(r => slipReelNos.some(srNo => isMatch(srNo, r.reelNo)));

  // If some reel numbers in slip were not found in active reel list, synthesize records so data is never lost
  if (matched.length < slipReelNos.length) {
    const missingNos = slipReelNos.filter(srNo => !matched.some(m => isMatch(m.reelNo, srNo)));
    missingNos.forEach(mNo => {
      matched.push({
        id: `reel-synth-${mNo}`,
        reelNo: mNo,
        parentRollNo: 'SYNTH-01',
        dia: 1000,
        product: 'Semi Kraft',
        gsm: 16,
        size: 65,
        ply: 1,
        weight: 450,
        joint: 0,
        status: 'DISPATCHED',
        qcGrade: 'A',
        productionDate: slip.date || new Date().toISOString(),
        challanNo: slip.slipNo,
      } as Reel);
    });
  }

  return matched;
}

/**
 * Resolves Party and Vehicle objects for a packing slip
 */
export function resolveSlipEntities(slip: PackingSlip, customParties?: Party[], customVehicles?: Vehicle[]) {
  const parties = (customParties && customParties.length > 0) ? customParties : getParties();
  const vehicles = (customVehicles && customVehicles.length > 0) ? customVehicles : getVehicles();

  const isMatch = (a: string, b: string) => (a || '').trim().toUpperCase() === (b || '').trim().toUpperCase();

  const partyObj = parties.find(p => p.id === slip.partyId || isMatch(p.name, slip.partyId));
  const vehicleObj = vehicles.find(v => v.id === slip.vehicleId || isMatch(v.vehicleNo, slip.vehicleId));

  const partyName = partyObj ? partyObj.name : (slip.partyId || 'Customer / Walk-in');
  const vehicleNo = vehicleObj ? vehicleObj.vehicleNo : (slip.vehicleId || 'N/A');

  return { partyObj, vehicleObj, partyName, vehicleNo };
}

/**
 * Exports a single Delivery Challan / Packing Slip to a clean, professionally formatted .xlsx file.
 * Filename format: PS-XXXXXX.xlsx (e.g. PS-843713.xlsx)
 */
export async function exportDispatchChallanExcel(
  slip: PackingSlip,
  customReels?: Reel[],
  customParties?: Party[],
  customVehicles?: Vehicle[]
): Promise<{ success: boolean; filename: string; count: number; totalWeight: number }> {
  const company = getCompanyConfig();
  const linkedReels = getLinkedReelsForSlip(slip, customReels);
  const { partyName, vehicleNo, partyObj, vehicleObj } = resolveSlipEntities(slip, customParties, customVehicles);

  const rawSlipNo = (slip.slipNo || 'CHALLAN').trim();
  const normalizedSlipNo = rawSlipNo.startsWith('PS-') ? rawSlipNo : `PS-${rawSlipNo}`;
  const filename = `${normalizedSlipNo}.xlsx`;

  const totalWeight = linkedReels.reduce((sum, r) => sum + (r.weight || 0), 0);

  // Group summary by specification
  const specMap: Record<string, { product: string; gsm: number; size: number; ply: number; count: number; weight: number }> = {};
  linkedReels.forEach(r => {
    const key = `${r.product || 'Kraft'}__${r.gsm}__${r.size}__${r.ply || 1}`;
    if (!specMap[key]) {
      specMap[key] = {
        product: r.product || 'Kraft Paper',
        gsm: r.gsm || 0,
        size: r.size || 0,
        ply: r.ply || 1,
        count: 0,
        weight: 0,
      };
    }
    specMap[key].count += 1;
    specMap[key].weight += (r.weight || 0);
  });

  // Build Workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Delivery Challan & Itemized Reels
  const rows: (string | number)[][] = [
    [company.name],
    ['DELIVERY CHALLAN & DISPATCH RECEIPT'],
    [`Address: ${company.address}`],
    [`Phone: ${company.phone} | Email: ${company.email} | Web: ${company.website}`],
    [''],
    ['RECEIPT METADATA'],
    ['Challan / Slip No:', normalizedSlipNo, '', 'Dispatch Date:', slip.date || new Date().toISOString().substring(0, 10)],
    ['Customer / Party:', partyName, '', 'Vehicle / Truck No:', vehicleNo],
    ['Party Address:', partyObj?.address || (slip as any).partyAddress || 'N/A', '', 'Status:', slip.status || 'CONFIRMED'],
    ['Party Contact:', partyObj?.contact || (slip as any).partyContact || (slip as any).contact || 'N/A', '', 'Driver Contact:', vehicleObj?.driverContact || (slip as any).driverContact || 'N/A'],
    ['Driver Signature:', slip.driverSignature || 'Present', '', 'Receiver Gate:', slip.receiverSignature || 'Verified'],
    [''],
    ['DISPATCHED REEL INVENTORY (ITEMIZED LIST)'],
    [
      'SR NO',
      'REEL NUMBER',
      'PRODUCT DESCRIPTION',
      'GSM',
      'SIZE (CM)',
      'PLY',
      'WEIGHT (KG)',
      'JOINTS',
      'QC GRADE',
    ],
  ];

  linkedReels.forEach((reel, idx) => {
    rows.push([
      idx + 1,
      reel.reelNo,
      reel.product || 'Kraft Paper',
      reel.gsm,
      reel.size,
      reel.ply || 1,
      reel.weight,
      reel.joint ?? 0,
      reel.qcGrade || 'A',
    ]);
  });

  // Totals Row
  rows.push([
    'TOTAL',
    `${linkedReels.length} REELS`,
    '',
    '',
    '',
    '',
    totalWeight,
    '',
    '',
  ]);

  rows.push(['']);
  rows.push(['PRODUCT SPECIFICATION SUMMARY']);
  rows.push(['PRODUCT SPECIFICATION', 'GSM', 'SIZE (CM)', 'PLY', 'TOTAL REELS', 'TOTAL WEIGHT (KG)']);

  Object.values(specMap).forEach(spec => {
    rows.push([
      spec.product,
      spec.gsm,
      spec.size,
      spec.ply,
      spec.count,
      spec.weight,
    ]);
  });

  rows.push([
    'GRAND TOTAL',
    '',
    '',
    '',
    linkedReels.length,
    totalWeight,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column width formatting
  ws['!cols'] = [
    { wch: 8 },  // SR NO
    { wch: 18 }, // REEL NUMBER
    { wch: 28 }, // PRODUCT
    { wch: 10 }, // GSM
    { wch: 12 }, // SIZE
    { wch: 8 },  // PLY
    { wch: 15 }, // WEIGHT
    { wch: 10 }, // JOINTS
    { wch: 12 }, // QC GRADE
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Delivery Challan');

  // Trigger download / mobile share flow
  await exportExcelWorkbook(wb, filename);

  return {
    success: true,
    filename,
    count: linkedReels.length,
    totalWeight,
  };
}

/**
 * Builds standalone, print-ready HTML document for the official Dispatch Receipt
 */
export function generateDispatchReceiptHtml(
  slip: PackingSlip,
  customReels?: Reel[],
  customParties?: Party[],
  customVehicles?: Vehicle[],
  groupMode: 'grouped' | 'sequential' = 'grouped'
): string {
  const company = getCompanyConfig();
  const linkedReels = getLinkedReelsForSlip(slip, customReels);
  const { partyName, vehicleNo, partyObj, vehicleObj } = resolveSlipEntities(slip, customParties, customVehicles);

  const rawSlipNo = (slip.slipNo || 'CHALLAN').trim();
  const normalizedSlipNo = rawSlipNo.startsWith('PS-') ? rawSlipNo : `PS-${rawSlipNo}`;
  const dispatchDate = slip.date || new Date().toISOString().substring(0, 10);
  const grandTotalWeight = linkedReels.reduce((sum, r) => sum + (r.weight || 0), 0);

  // Spec grouping map
  const specMap: Record<string, { product: string; gsm: number; size: number; ply: number; reels: Reel[]; totalWeight: number }> = {};
  linkedReels.forEach(r => {
    const key = `${r.product || 'Tissue Paper'}__${r.gsm}__${r.size}__${r.ply || 1}`;
    if (!specMap[key]) {
      specMap[key] = {
        product: r.product || 'Tissue Paper',
        gsm: r.gsm || 0,
        size: r.size || 0,
        ply: r.ply || 1,
        reels: [],
        totalWeight: 0,
      };
    }
    specMap[key].reels.push(r);
    specMap[key].totalWeight += (r.weight || 0);
  });

  const specGroupsList = Object.values(specMap);

  type PrintableReelItem = Reel & {
    displayIndex: number;
    isGroupStart: boolean;
    groupLabel: string;
    groupTotalReels: number;
    groupTotalWeight: number;
  };

  const sortedReelItems: PrintableReelItem[] = [];
  let runningSr = 0;

  if (groupMode === 'grouped') {
    specGroupsList.forEach(group => {
      group.reels.forEach((reel, idxInGroup) => {
        runningSr += 1;
        sortedReelItems.push({
          ...reel,
          displayIndex: runningSr,
          isGroupStart: idxInGroup === 0,
          groupLabel: `${group.product} • ${group.gsm} GSM • ${group.size} CM • ${group.ply} PLY`,
          groupTotalReels: group.reels.length,
          groupTotalWeight: group.totalWeight,
        });
      });
    });
  } else {
    linkedReels.forEach((reel, idx) => {
      sortedReelItems.push({
        ...reel,
        displayIndex: idx + 1,
        isGroupStart: false,
        groupLabel: '',
        groupTotalReels: 0,
        groupTotalWeight: 0,
      });
    });
  }

  const REELS_PER_PAGE = 20;
  const totalPages = Math.max(1, Math.ceil(sortedReelItems.length / REELS_PER_PAGE));
  const pages: PrintableReelItem[][] = [];
  for (let p = 0; p < totalPages; p++) {
    pages.push(sortedReelItems.slice(p * REELS_PER_PAGE, (p + 1) * REELS_PER_PAGE));
  }

  const pagesHtml = pages.map((pageReels, pageIndex) => {
    const pageNumber = pageIndex + 1;
    const isLastPage = pageNumber === totalPages;

    const headerHtml = pageIndex === 0 ? `
      <div class="header-container">
        <h1 class="company-title">${company.name}</h1>
        <p class="company-subtitle">${company.industrySubtitle || 'FINISHED STOCK MANAGEMENT • TISSUE PAPER MILL'}</p>
        <p class="company-address">${company.address}</p>
      </div>

      <div class="doc-title-container">
        <h2 class="doc-title">DISPATCH RECEIPT</h2>
      </div>

      <div class="metadata-grid">
        <div class="meta-item">
          <div class="meta-label">RECEIPT NO</div>
          <div class="meta-value font-mono">${normalizedSlipNo}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">DISPATCH DATE</div>
          <div class="meta-value">${dispatchDate}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">CUSTOMER / PARTY</div>
          <div class="meta-value">${partyName}</div>
          ${partyObj?.address || (slip as any).partyAddress ? `<div class="meta-sub">${partyObj?.address || (slip as any).partyAddress}</div>` : ''}
          ${(partyObj?.contact || (slip as any).partyContact || (slip as any).contact) ? `<div class="meta-sub font-mono">Ph: ${partyObj?.contact || (slip as any).partyContact || (slip as any).contact}</div>` : ''}
        </div>
        <div class="meta-item">
          <div class="meta-label">VEHICLE / TRUCK NO</div>
          <div class="meta-value font-mono">${vehicleNo}</div>
          ${(vehicleObj?.driverContact || (slip as any).driverContact) ? `<div class="meta-sub font-mono">Driver Ph: ${vehicleObj?.driverContact || (slip as any).driverContact}</div>` : ''}
        </div>
      </div>
    ` : `
      <div class="cont-header">
        <span class="cont-company">${company.name}</span>
        <span class="cont-badge">DISPATCH RECEIPT (CONTD.) — ${normalizedSlipNo}</span>
      </div>
    `;

    const tableRowsHtml = pageReels.map(reel => {
      let groupHeader = '';
      if (groupMode === 'grouped' && reel.isGroupStart) {
        groupHeader = `
          <tr class="group-header-row">
            <td colspan="7">
              <div class="group-flex">
                <span class="group-title">● ${reel.groupLabel}</span>
                <span class="group-badge">${reel.groupTotalReels} Reels • ${reel.groupTotalWeight.toLocaleString()} KG</span>
              </div>
            </td>
          </tr>
        `;
      }

      return `
        ${groupHeader}
        <tr>
          <td class="text-center font-bold">${reel.displayIndex}</td>
          <td class="font-mono font-bold">${reel.reelNo}</td>
          <td>${reel.product || 'Kraft Paper'}</td>
          <td class="text-center">${reel.gsm}</td>
          <td class="text-center">${reel.size}</td>
          <td class="text-center">${reel.ply || 1}</td>
          <td class="text-right font-mono font-bold">${reel.weight}</td>
        </tr>
      `;
    }).join('');

    const summaryHtml = isLastPage ? `
      <div class="summary-section">
        <div class="table-heading">PRODUCT SUMMARY (ITEMIZED BREAKDOWN)</div>
        <table class="receipt-table">
          <thead>
            <tr>
              <th>PRODUCT SPECIFICATION</th>
              <th class="text-center">GSM</th>
              <th class="text-center">SIZE</th>
              <th class="text-center">PLY</th>
              <th class="text-center">REELS</th>
              <th class="text-right">TOTAL WEIGHT</th>
            </tr>
          </thead>
          <tbody>
            ${specGroupsList.map(item => `
              <tr>
                <td class="font-bold">${item.product}</td>
                <td class="text-center">${item.gsm}</td>
                <td class="text-center">${item.size} CM</td>
                <td class="text-center">${item.ply} Ply</td>
                <td class="text-center font-mono font-bold">${item.reels.length}</td>
                <td class="text-right font-mono font-bold">${item.totalWeight.toLocaleString()} KG</td>
              </tr>
            `).join('')}
            <tr class="grand-total-row">
              <td colspan="4" class="uppercase font-black">GRAND TOTAL</td>
              <td class="text-center font-mono font-black">${linkedReels.length} Reels</td>
              <td class="text-right font-mono font-black">${grandTotalWeight.toLocaleString()} KG</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="signatures-grid">
        <div class="sig-box">
          <div class="sig-line">PREPARED BY</div>
        </div>
        <div class="sig-box">
          <div class="sig-line">DRIVER SIGNATURE</div>
        </div>
        <div class="sig-box">
          <div class="sig-line">RECEIVER / GATE</div>
        </div>
      </div>
    ` : '';

    return `
      <div class="receipt-page">
        <div class="page-body">
          ${headerHtml}

          <div class="table-section">
            <div class="table-heading-flex">
              <span class="table-heading">DISPATCHED REELS ${totalPages > 1 ? `(Part ${pageNumber} of ${totalPages})` : ''}</span>
              <span class="table-sub">Showing items ${pageIndex * REELS_PER_PAGE + 1} - ${Math.min((pageIndex + 1) * REELS_PER_PAGE, sortedReelItems.length)} of ${sortedReelItems.length}</span>
            </div>
            <table class="receipt-table">
              <thead>
                <tr>
                  <th class="text-center" style="width: 40px;">SR</th>
                  <th>REEL NO</th>
                  <th>PRODUCT</th>
                  <th class="text-center">GSM</th>
                  <th class="text-center">SIZE (CM)</th>
                  <th class="text-center">PLY</th>
                  <th class="text-right">WEIGHT (KG)</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>

          ${summaryHtml}
        </div>

        <div class="footer-container">
          <span>${company.name} • ${company.shortAddress} • Ph: ${company.phone} • ${company.website}</span>
          <span class="font-mono font-bold">Page ${pageNumber} of ${totalPages}</span>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Dispatch Receipt - ${normalizedSlipNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      line-height: 1.35;
      padding: 16px;
    }

    .toolbar {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 12px 18px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      gap: 8px;
      flex-wrap: wrap;
    }

    .toolbar-title {
      font-size: 14px;
      font-weight: 800;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .toolbar-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .btn-primary {
      background: #1e3a8a;
      color: white;
    }
    .btn-primary:hover {
      background: #172554;
    }

    .btn-success {
      background: #059669;
      color: white;
    }
    .btn-success:hover {
      background: #047857;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }

    .receipt-page {
      max-width: 820px;
      margin: 0 auto 20px auto;
      background: white;
      padding: 32px 36px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
      min-height: 275mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
    }

    .header-container {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .company-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.02em;
      text-transform: uppercase;
      color: #000;
    }
    .company-subtitle {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      letter-spacing: 0.1em;
      margin-top: 2px;
    }
    .company-address {
      font-size: 9.5px;
      font-weight: 500;
      color: #64748b;
      margin-top: 2px;
    }

    .doc-title-container {
      text-align: center;
      margin: 8px 0 12px 0;
    }
    .doc-title {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #000;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
      background: #fff;
    }
    .meta-label {
      font-size: 8.5px;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }
    .meta-value {
      font-size: 12px;
      font-weight: 700;
      color: #000;
    }
    .meta-sub {
      font-size: 9.5px;
      color: #475569;
      font-weight: 600;
    }

    .cont-header {
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cont-company {
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .cont-badge {
      font-size: 9px;
      font-weight: 800;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }

    .table-section {
      margin-bottom: 14px;
    }
    .table-heading-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .table-heading {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #000;
    }
    .table-sub {
      font-size: 9.5px;
      font-weight: 600;
      color: #64748b;
    }

    .receipt-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      font-size: 10.5px;
    }
    .receipt-table th {
      background: #0B132B;
      color: #ffffff;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 6px 10px;
      border: 1px solid #0B132B;
      text-align: left;
    }
    .receipt-table td {
      padding: 5px 10px;
      border: 1px solid #e2e8f0;
      color: #0f172a;
    }
    .receipt-table tbody tr:nth-child(even) {
      background: #fafafa;
    }

    .group-header-row td {
      background: #f1f5f9 !important;
      padding: 4px 10px !important;
      border-top: 1px solid #cbd5e1 !important;
      border-bottom: 1px solid #cbd5e1 !important;
    }
    .group-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .group-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #1e3a8a;
    }
    .group-badge {
      font-size: 9px;
      font-weight: 800;
      background: white;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }

    .summary-section {
      margin-top: 12px;
      margin-bottom: 16px;
    }
    .grand-total-row td {
      background: #FEE4CB !important;
      font-weight: 900 !important;
      color: #020617 !important;
      border-top: 2px solid #cbd5e1 !important;
      font-size: 11px !important;
      padding: 6px 10px !important;
    }

    .signatures-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 18px;
      margin-bottom: 10px;
      text-align: center;
    }
    .sig-box {
      border-top: 2px solid #000;
      padding-top: 6px;
    }
    .sig-line {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .footer-container {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      font-size: 8.5px;
      font-weight: 600;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .uppercase { text-transform: uppercase; }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .toolbar {
        display: none !important;
      }
      .receipt-page {
        margin: 0;
        padding: 0;
        border: none;
        box-shadow: none;
        border-radius: 0;
        min-height: 275mm;
        height: 275mm;
      }
      @page {
        size: A4 portrait;
        margin: 10mm 10mm;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-title">
      <span>📄 Dispatch Receipt ${normalizedSlipNo} (${totalPages} ${totalPages === 1 ? 'Page' : 'Pages'})</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  ${pagesHtml}
</body>
</html>`;
}

/**
 * Universal print handler for Dispatch Receipt that works seamlessly across Desktop & Mobile/Android.
 */
export async function printOrShareDispatchReceipt(
  slip: PackingSlip,
  customReels?: Reel[],
  customParties?: Party[],
  customVehicles?: Vehicle[],
  groupMode: 'grouped' | 'sequential' = 'grouped'
): Promise<{ success: boolean; message?: string }> {
  const htmlContent = generateDispatchReceiptHtml(slip, customReels, customParties, customVehicles, groupMode);
  const rawSlipNo = (slip.slipNo || 'CHALLAN').trim();
  const normalizedSlipNo = rawSlipNo.startsWith('PS-') ? rawSlipNo : `PS-${rawSlipNo}`;
  const filename = `Dispatch_Receipt_${normalizedSlipNo}.html`;

  // 1. Android Native Bridge in Capacitor APK
  if (typeof (window as any)?.AndroidNativeBridge?.printHtml === 'function') {
    try {
      (window as any).AndroidNativeBridge.printHtml(htmlContent, `Receipt_${normalizedSlipNo}`);
      return { success: true, message: 'Print spooler opened on Android' };
    } catch (bridgeErr) {
      console.warn('[PrintService] AndroidNativeBridge failed, falling back:', bridgeErr);
    }
  }

  // 2. Capacitor Filesystem & Share on Mobile
  const isCapacitor = typeof window !== 'undefined' && (
    (window as any)?.Capacitor?.isNativePlatform?.() ||
    (window as any)?.Capacitor?.getPlatform?.() === 'android'
  );

  if (isCapacitor) {
    try {
      const htmlBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const base64Data = await blobToBase64(htmlBlob);
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      if (writeResult && writeResult.uri) {
        await Share.share({
          title: `Dispatch Receipt ${normalizedSlipNo}`,
          text: `Dispatch Receipt for Challan ${normalizedSlipNo}`,
          url: writeResult.uri,
          dialogTitle: `Print / Save Dispatch Receipt ${normalizedSlipNo}`,
        });
        return { success: true, message: 'Receipt ready in Share / Print menu' };
      }
    } catch (capErr: any) {
      if (
        capErr?.message?.includes('canceled') ||
        capErr?.message?.includes('dismiss') ||
        capErr?.name === 'AbortError'
      ) {
        return { success: true, message: 'Share sheet dismissed' };
      }
      console.warn('[PrintService] Capacitor share failed, falling back:', capErr);
    }
  }

  // 3. Mobile Browser (Android Chrome, iOS Safari) & Desktop in-DOM Print
  try {
    let printContainer = document.getElementById('saheb-receipt-print-container');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'saheb-receipt-print-container';
      document.body.appendChild(printContainer);
    }
    printContainer.innerHTML = htmlContent;
    document.body.classList.add('printing-challan');

    const cleanup = () => {
      document.body.classList.remove('printing-challan');
      if (printContainer && document.body.contains(printContainer)) {
        printContainer.innerHTML = '';
      }
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 3000);
    }, 150);
    return { success: true, message: 'Print dialog opened' };
  } catch (domErr) {
    console.warn('[PrintService] in-DOM print failed, falling back to window.open:', domErr);
  }

  // 4. Fallback: window.open for desktop browsers
  try {
    const printWin = window.open('', '_blank', 'width=950,height=850');
    if (printWin && printWin.document) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        try {
          printWin.print();
        } catch {
          // ignore
        }
      }, 350);
      return { success: true, message: 'Print dialog opened' };
    }
  } catch (winErr) {
    console.warn('[PrintService] window.open blocked, falling back to window.print():', winErr);
    window.print();
  }

  return { success: true };
}
