import { jsPDF } from 'jspdf';
import type { Reel, PackingSlip, Party, Vehicle } from '../data/types';
import { getCompanyConfig } from '../config/company';
import { getLinkedReelsForSlip, resolveSlipEntities } from './dispatchReceiptService';
import { downloadBlobFile } from './fileDownloader';

/**
 * Generates an executive, razor-sharp standalone vector jsPDF document for
 * Delivery Challan & Gate Pass (Dispatch Receipt).
 *
 * 100% Vector layout: crisp on all zoom levels, standard A4 portrait format,
 * lightweight (~30-50KB), perfectly formatted for physical paper printing.
 */
export function generateDispatchReceiptPdfDoc(
  slip: PackingSlip,
  customReels?: Reel[],
  customParties?: Party[],
  customVehicles?: Vehicle[],
  groupMode: 'grouped' | 'sequential' = 'grouped'
): jsPDF {
  const company = getCompanyConfig();
  const linkedReels = getLinkedReelsForSlip(slip, customReels);
  const { partyName, vehicleNo, partyObj, vehicleObj } = resolveSlipEntities(slip, customParties, customVehicles);

  const rawSlipNo = (slip.slipNo || 'CHALLAN').trim();
  const normalizedSlipNo = rawSlipNo.startsWith('PS-') ? rawSlipNo : `PS-${rawSlipNo}`;
  const dispatchDate = slip.date || new Date().toISOString().substring(0, 10);
  const formattedDate = dispatchDate.includes('-')
    ? dispatchDate.split('-').reverse().join('.')
    : dispatchDate;

  const grandTotalWeight = linkedReels.reduce((sum, r) => sum + (r.weight || 0), 0);

  // Group summary by specification
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
    groupLabel: string;
  };

  const sortedReelItems: PrintableReelItem[] = [];
  let runningSr = 0;

  if (groupMode === 'grouped') {
    specGroupsList.forEach(group => {
      group.reels.forEach(reel => {
        runningSr += 1;
        sortedReelItems.push({
          ...reel,
          displayIndex: runningSr,
          groupLabel: `${group.product} • ${group.gsm} GSM • ${group.size} MM • ${group.ply} PLY`,
        });
      });
    });
  } else {
    linkedReels.forEach((reel, idx) => {
      sortedReelItems.push({
        ...reel,
        displayIndex: idx + 1,
        groupLabel: '',
      });
    });
  }

  // Calculate pages
  interface PageData {
    pageNumber: number;
    reels: PrintableReelItem[];
    summaryItems: typeof specGroupsList;
    showGrandTotal: boolean;
    showSignatures: boolean;
  }

  const pages: PageData[] = [];
  const totalReelsCount = sortedReelItems.length;
  const totalSummaryCount = specGroupsList.length;

  if (totalReelsCount <= 7) {
    pages.push({
      pageNumber: 1,
      reels: sortedReelItems,
      summaryItems: specGroupsList,
      showGrandTotal: true,
      showSignatures: true,
    });
  } else if (totalReelsCount <= 14) {
    if (totalSummaryCount <= 2) {
      pages.push({
        pageNumber: 1,
        reels: sortedReelItems,
        summaryItems: specGroupsList,
        showGrandTotal: true,
        showSignatures: true,
      });
    } else {
      const p1SummaryCount = Math.min(3, Math.ceil(totalSummaryCount / 2));
      pages.push({
        pageNumber: 1,
        reels: sortedReelItems,
        summaryItems: specGroupsList.slice(0, p1SummaryCount),
        showGrandTotal: false,
        showSignatures: false,
      });
      pages.push({
        pageNumber: 2,
        reels: [],
        summaryItems: specGroupsList.slice(p1SummaryCount),
        showGrandTotal: true,
        showSignatures: true,
      });
    }
  } else {
    // Large order: 14 reels on Page 1, remaining reels on Page 2+
    const p1Reels = sortedReelItems.slice(0, 14);
    let remainingReels = sortedReelItems.slice(14);
    pages.push({
      pageNumber: 1,
      reels: p1Reels,
      summaryItems: [],
      showGrandTotal: false,
      showSignatures: false,
    });

    let pageIdx = 2;
    while (remainingReels.length > 0) {
      const chunk = remainingReels.slice(0, 18);
      remainingReels = remainingReels.slice(18);
      const isLastChunk = remainingReels.length === 0;

      pages.push({
        pageNumber: pageIdx,
        reels: chunk,
        summaryItems: isLastChunk ? specGroupsList : [],
        showGrandTotal: isLastChunk,
        showSignatures: isLastChunk,
      });
      pageIdx++;
    }
  }

  const totalPages = pages.length;

  // Initialize jsPDF document (A4 portrait = 210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Render each page
  pages.forEach((pageData, pIdx) => {
    if (pIdx > 0) {
      doc.addPage('a4', 'portrait');
    }

    // 1. Outer Border Frame (Navy blue #1e3a8a)
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.5);
    doc.roundedRect(8, 8, 194, 281, 2, 2, 'S');

    // 2. Company Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14.5);
    doc.setTextColor(30, 58, 138);
    doc.text(company.name.toUpperCase(), 105, 17, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Regd. Office & Mill: Survey No. 123, Chandisar, Palanpur, Banaskantha, Gujarat - 385510', 105, 21.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('GSTIN: 24AABCS1234F1Z5  |  State: Gujarat (24)  |  Email: info@sahebpaper.com', 105, 25.5, { align: 'center' });

    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.35);
    doc.line(10, 28, 200, 28);

    // 3. Document Title Pill
    doc.setFillColor(30, 58, 138);
    doc.roundedRect(55, 30.5, 100, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text('DELIVERY CHALLAN & GATE PASS', 105, 35.2, { align: 'center' });

    // 4. Metadata Details Box (2 Columns)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(10, 39.5, 190, 25, 1.5, 1.5, 'FD');

    // Left Column: Party / Consignee
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(220, 38, 38); // Red label
    doc.text('CONSIGNEE / BILLED TO:', 13, 44);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(partyName || 'Customer / Walk-in', 13, 48.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const partyAddr = partyObj?.address || (slip as any).partyAddress || 'Plant / Mill Delivery';
    doc.text(partyAddr.substring(0, 55), 13, 53);

    const partyGst = (partyObj as any)?.gstNumber || 'URP';
    const partyPhone = partyObj?.contact || (slip as any).partyContact || 'N/A';
    doc.text(`GSTIN: ${partyGst}   |   Contact: ${partyPhone}`, 13, 57.5);

    // Vertical Divider inside Metadata Box
    doc.setDrawColor(226, 232, 240);
    doc.line(115, 41, 115, 63);

    // Right Column: Challan, Vehicle, Transporter
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text(`Challan No: ${normalizedSlipNo}`, 118, 44.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`Date: ${formattedDate}`, 118, 49);

    doc.setFont('helvetica', 'bold');
    doc.text(`Vehicle No: ${vehicleNo}`, 118, 53.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const transporter = (vehicleObj as any)?.transporter || vehicleObj?.driverName || 'Mill Arranged Transport';
    const driverPhone = vehicleObj?.driverContact || (slip as any).driverContact || 'N/A';
    doc.text(`Transporter: ${transporter}   |   Driver: ${driverPhone}`, 118, 58);

    // 5. Reels Table
    let currentY = 67;

    if (pageData.reels.length > 0) {
      // Table Header Row
      doc.setFillColor(30, 58, 138);
      doc.rect(10, currentY, 190, 6.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('SR', 14, currentY + 4.5);
      doc.text('REEL NO.', 25, currentY + 4.5);
      doc.text('PRODUCT DESCRIPTION', 60, currentY + 4.5);
      doc.text('GSM', 115, currentY + 4.5, { align: 'center' });
      doc.text('SIZE (MM)', 135, currentY + 4.5, { align: 'center' });
      doc.text('PLY', 152, currentY + 4.5, { align: 'center' });
      doc.text('WEIGHT (KG)', 196, currentY + 4.5, { align: 'right' });

      currentY += 6.5;

      // Table Rows
      pageData.reels.forEach((reel, rIdx) => {
        const isEven = rIdx % 2 === 0;
        doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
        doc.rect(10, currentY, 190, 5.8, 'F');

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(10, currentY + 5.8, 200, currentY + 5.8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);

        doc.text(String(reel.displayIndex), 14, currentY + 4);

        doc.setFont('helvetica', 'bold');
        doc.text(reel.reelNo, 25, currentY + 4);

        doc.setFont('helvetica', 'normal');
        doc.text((reel.product || 'Tissue Paper').substring(0, 32), 60, currentY + 4);

        doc.text(String(reel.gsm || '---'), 115, currentY + 4, { align: 'center' });
        doc.text(String(reel.size || '---'), 135, currentY + 4, { align: 'center' });
        doc.text(`${reel.ply || 1} Ply`, 152, currentY + 4, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text(`${(reel.weight || 0).toLocaleString()} KG`, 196, currentY + 4, { align: 'right' });

        currentY += 5.8;
      });

      currentY += 3;
    }

    // 6. Specification Summary Table
    if (pageData.summaryItems.length > 0) {
      doc.setFillColor(51, 65, 85);
      doc.rect(10, currentY, 190, 6, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('SR', 14, currentY + 4.2);
      doc.text('SPECIFICATION SUMMARY BREAKDOWN', 25, currentY + 4.2);
      doc.text('GSM', 115, currentY + 4.2, { align: 'center' });
      doc.text('SIZE (MM)', 135, currentY + 4.2, { align: 'center' });
      doc.text('PLY', 152, currentY + 4.2, { align: 'center' });
      doc.text('REELS', 170, currentY + 4.2, { align: 'center' });
      doc.text('TOTAL WT (KG)', 196, currentY + 4.2, { align: 'right' });

      currentY += 6;

      pageData.summaryItems.forEach((group, gIdx) => {
        const isEven = gIdx % 2 === 0;
        doc.setFillColor(isEven ? 255 : 241, isEven ? 255 : 245, isEven ? 255 : 249);
        doc.rect(10, currentY, 190, 5.5, 'F');

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(10, currentY + 5.5, 200, currentY + 5.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);

        doc.text(String(gIdx + 1), 14, currentY + 3.8);
        doc.text(group.product, 25, currentY + 3.8);

        doc.setFont('helvetica', 'normal');
        doc.text(String(group.gsm), 115, currentY + 3.8, { align: 'center' });
        doc.text(String(group.size), 135, currentY + 3.8, { align: 'center' });
        doc.text(`${group.ply} Ply`, 152, currentY + 3.8, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.text(String(group.reels.length), 170, currentY + 3.8, { align: 'center' });

        doc.setTextColor(30, 58, 138);
        doc.text(`${group.totalWeight.toLocaleString()} KG`, 196, currentY + 3.8, { align: 'right' });

        currentY += 5.5;
      });

      currentY += 3;
    }

    // 7. Grand Totals Banner
    if (pageData.showGrandTotal) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.4);
      doc.roundedRect(10, currentY, 190, 8.5, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`TOTAL REELS: ${linkedReels.length} REELS`, 15, currentY + 5.5);

      doc.setTextColor(30, 58, 138);
      doc.setFontSize(9.5);
      doc.text(`GRAND TOTAL NET WEIGHT: ${grandTotalWeight.toLocaleString()} KG`, 196, currentY + 5.5, { align: 'right' });

      currentY += 12;
    }

    // 8. Signatures Block (Pinned to bottom of page when active)
    if (pageData.showSignatures) {
      const sigY = 250;

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(10, sigY - 4, 200, sigY - 4);

      // Col 1: Receiver
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text("Receiver's Stamp & Signature", 25, sigY + 18, { align: 'center' });
      doc.setLineDashPattern([1.5, 1], 0);
      doc.line(15, sigY + 14, 45, sigY + 14);

      // Col 2: Driver
      doc.text('Transporter / Driver Signature', 105, sigY + 18, { align: 'center' });
      doc.line(85, sigY + 14, 125, sigY + 14);

      // Col 3: Company
      doc.text('For Saheb Paper Pvt. Ltd.', 180, sigY + 3, { align: 'center' });
      doc.text('(Authorized Signatory)', 180, sigY + 18, { align: 'center' });
      doc.line(160, sigY + 14, 198, sigY + 14);
      doc.setLineDashPattern([], 0); // reset dash
    }

    // 9. Document Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Subject to Banaskantha Jurisdiction. Goods once sold/dispatched will not be returned.',
      14,
      283
    );

    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${pageData.pageNumber} of ${totalPages}`, 196, 283, { align: 'right' });
  });

  return doc;
}

/**
 * High-level helper: Generates delivery challan vector PDF and downloads/shares
 * reliably across Android APK (Downloads folder + Share Sheet) and Desktop Web.
 */
export async function downloadDispatchReceiptPdf(
  slip: PackingSlip,
  customReels?: Reel[],
  customParties?: Party[],
  customVehicles?: Vehicle[],
  groupMode: 'grouped' | 'sequential' = 'grouped'
): Promise<void> {
  const doc = generateDispatchReceiptPdfDoc(slip, customReels, customParties, customVehicles, groupMode);
  const rawSlipNo = (slip.slipNo || 'CHALLAN').trim();
  const normalizedSlipNo = rawSlipNo.startsWith('PS-') ? rawSlipNo : `PS-${rawSlipNo}`;
  const filename = `Delivery_Challan_${normalizedSlipNo}.pdf`;
  const blob = doc.output('blob');
  await downloadBlobFile(blob, filename);
}
