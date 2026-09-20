import XLSX from 'xlsx-js-style';
import { COMPANY_CONFIG } from '../config/company';

export const EXCEL_THEME = {
  NAVY_HEADER: '1B365D',  // Deep corporate navy
  GOLD_TITLE: 'FFC000',   // High-contrast gold accent
  ICE_BLUE_BG: 'E8EEF5',  // Soft ice-blue for metadata & totals
  TEXT_WHITE: 'FFFFFF',   // Pure white for navy headers
  TEXT_DARK: '0F172A',    // High-contrast dark slate body
  TEXT_MUTED: '64748B',   // Muted slate for footer
  BORDER_LIGHT: 'CBD5E1', // Crisp light-gray gridline
  BORDER_NAVY: '1B365D',  // Heavy navy bounding line
};

export interface SheetMetadataPair {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
}

export interface StyledSheetConfig {
  title: string;
  metadata?: SheetMetadataPair[];
  headers: string[];
  rows: (string | number)[][];
  alignments?: ('left' | 'center' | 'right')[];
  colWidths?: number[];
  totals?: {
    label: string;
    value: string | number;
    subLabel?: string;
    subValue?: string | number;
  };
  footerNote?: string;
}

/**
 * Creates an ultra-premium styled worksheet matching the Saheb Paper design standard.
 */
export function createStyledWorksheet(config: StyledSheetConfig): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const totalCols = Math.max(config.headers.length, 6);
  const lastColIdx = totalCols - 1;
  const merges: XLSX.Range[] = [];
  const rowHeights: { hpt?: number; hpx?: number }[] = [];

  let currentRow = 0;

  // Cell helper
  const setCell = (r: number, c: number, val: any, style: any) => {
    const ref = XLSX.utils.encode_cell({ r, c });
    ws[ref] = {
      v: val === undefined || val === null ? '' : val,
      t: typeof val === 'number' ? 'n' : 's',
      s: style,
    };
  };

  const fillRowRange = (r: number, startC: number, endC: number, val: any, style: any) => {
    for (let c = startC; c <= endC; c++) {
      setCell(r, c, c === startC ? val : '', style);
    }
  };

  // 1. TOP HEADER BLOCK: Corporate Navy (#1B365D)
  // Row 0: Company Name
  fillRowRange(currentRow, 0, lastColIdx, COMPANY_CONFIG.name, {
    fill: { fgColor: { rgb: EXCEL_THEME.NAVY_HEADER } },
    font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: EXCEL_THEME.TEXT_WHITE } },
    alignment: { horizontal: 'center', vertical: 'center' },
  });
  merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: lastColIdx } });
  rowHeights.push({ hpt: 26 });
  currentRow++;

  // Row 1: Address
  fillRowRange(currentRow, 0, lastColIdx, `Address: ${COMPANY_CONFIG.address}`, {
    fill: { fgColor: { rgb: EXCEL_THEME.NAVY_HEADER } },
    font: { name: 'Calibri', sz: 9.5, color: { rgb: EXCEL_THEME.TEXT_WHITE } },
    alignment: { horizontal: 'center', vertical: 'center' },
  });
  merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: lastColIdx } });
  rowHeights.push({ hpt: 18 });
  currentRow++;

  // Row 2: Phone | Email | Website
  fillRowRange(currentRow, 0, lastColIdx, `Phone: ${COMPANY_CONFIG.phone}  |  Email: ${COMPANY_CONFIG.email}  |  Website: ${COMPANY_CONFIG.website}`, {
    fill: { fgColor: { rgb: EXCEL_THEME.NAVY_HEADER } },
    font: { name: 'Calibri', sz: 9.5, color: { rgb: EXCEL_THEME.TEXT_WHITE } },
    alignment: { horizontal: 'center', vertical: 'center' },
  });
  merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: lastColIdx } });
  rowHeights.push({ hpt: 18 });
  currentRow++;

  // Row 3: Golden Document Title (Uninterrupted navy header)
  fillRowRange(currentRow, 0, lastColIdx, config.title.toUpperCase(), {
    fill: { fgColor: { rgb: EXCEL_THEME.NAVY_HEADER } },
    font: { name: 'Calibri', sz: 12.5, bold: true, color: { rgb: EXCEL_THEME.GOLD_TITLE } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      bottom: { style: 'medium', color: { rgb: EXCEL_THEME.BORDER_NAVY } },
    },
  });
  merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: lastColIdx } });
  rowHeights.push({ hpt: 25 });
  currentRow++;

  // 2. METADATA INFO BOX (Ice Blue #E8EEF5 with light border)
  if (config.metadata && config.metadata.length > 0) {
    const splitCol = Math.ceil(totalCols / 2);
    config.metadata.forEach(meta => {
      const leftText = `  ${meta.leftLabel}: ${meta.leftValue}`;
      const rightText = `  ${meta.rightLabel}: ${meta.rightValue}`;

      const metaStyle = {
        fill: { fgColor: { rgb: EXCEL_THEME.ICE_BLUE_BG } },
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: EXCEL_THEME.TEXT_DARK } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: EXCEL_THEME.BORDER_LIGHT } },
          bottom: { style: 'thin', color: { rgb: EXCEL_THEME.BORDER_LIGHT } },
          left: { style: 'thin', color: { rgb: EXCEL_THEME.BORDER_LIGHT } },
          right: { style: 'thin', color: { rgb: EXCEL_THEME.BORDER_LIGHT } },
        },
      };

      // Left Box (Col 0 to splitCol - 1)
      fillRowRange(currentRow, 0, splitCol - 1, leftText, metaStyle);
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: splitCol - 1 } });

      // Right Box (Col splitCol to lastColIdx)
      fillRowRange(currentRow, splitCol, lastColIdx, rightText, metaStyle);
      merges.push({ s: { r: currentRow, c: splitCol }, e: { r: currentRow, c: lastColIdx } });

      rowHeights.push({ hpt: 22 });
      currentRow++;
    });
  }

  // 3. TABLE HEADER ROW (Navy #1B365D, Bold White Text)
  config.headers.forEach((h, colIdx) => {
    setCell(currentRow, colIdx, h, {
      fill: { fgColor: { rgb: EXCEL_THEME.NAVY_HEADER } },
      font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: EXCEL_THEME.TEXT_WHITE } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: EXCEL_THEME.NAVY_HEADER } },
        bottom: { style: 'thin', color: { rgb: EXCEL_THEME.NAVY_HEADER } },
        left: { style: 'thin', color: { rgb: '335588' } },
        right: { style: 'thin', color: { rgb: '335588' } },
      },
    });
  });
  rowHeights.push({ hpt: 26 });
  currentRow++;

  // 4. DATA ROWS
  config.rows.forEach((row) => {
    row.forEach((val, colIdx) => {
      const align = config.alignments ? (config.alignments[colIdx] || 'center') : 'center';
      setCell(currentRow, colIdx, val, {
        fill: { fgColor: { rgb: 'FFFFFF' } },
        font: { name: 'Calibri', sz: 10, color: { rgb: EXCEL_THEME.TEXT_DARK } },
        alignment: { horizontal: align, vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: EXCEL_THEME.BORDER_LIGHT } },
          bottom: { style: 'thin', color: { rgb: EXCEL_THEME.BORDER_LIGHT } },
          left: { style: 'thin', color: { rgb: EXCEL_THEME.BORDER_LIGHT } },
          right: { style: 'thin', color: { rgb: EXCEL_THEME.BORDER_LIGHT } },
        },
      });
    });
    rowHeights.push({ hpt: 20 });
    currentRow++;
  });

  // 5. TOTALS ROW (Ice Blue #E8EEF5, Bold Text)
  if (config.totals) {
    const totalLabelSpan = lastColIdx - 1; // Span all columns except the last one
    const totalsStyle = {
      fill: { fgColor: { rgb: EXCEL_THEME.ICE_BLUE_BG } },
      font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: EXCEL_THEME.TEXT_DARK } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: EXCEL_THEME.BORDER_LIGHT } },
        bottom: { style: 'double', color: { rgb: EXCEL_THEME.NAVY_HEADER } },
        left: { style: 'thin', color: { rgb: EXCEL_THEME.BORDER_LIGHT } },
        right: { style: 'thin', color: { rgb: EXCEL_THEME.BORDER_LIGHT } },
      },
    };

    fillRowRange(currentRow, 0, totalLabelSpan, config.totals.label, totalsStyle);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: totalLabelSpan } });

    setCell(currentRow, lastColIdx, config.totals.value, {
      ...totalsStyle,
      alignment: { horizontal: 'center', vertical: 'center' },
    });

    rowHeights.push({ hpt: 24 });
    currentRow++;
  }

  // 6. FOOTER NOTE (Directly contiguous, Italic Muted Slate with Navy Bottom Accent)
  const defaultFooter = 'This is a system-generated delivery challan and does not require a physical stamp unless otherwise specified.';
  const footerNote = config.footerNote || defaultFooter;
  fillRowRange(currentRow, 0, lastColIdx, footerNote, {
    fill: { fgColor: { rgb: 'FFFFFF' } },
    font: { name: 'Calibri', sz: 9, italic: true, color: { rgb: EXCEL_THEME.TEXT_MUTED } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: EXCEL_THEME.BORDER_LIGHT } },
      bottom: { style: 'medium', color: { rgb: EXCEL_THEME.BORDER_NAVY } },
    },
  });
  merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: lastColIdx } });
  rowHeights.push({ hpt: 22 });
  currentRow++;

  // Set Bounds Range
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: currentRow - 1, c: lastColIdx },
  });

  // Set Column Widths
  if (config.colWidths && config.colWidths.length > 0) {
    ws['!cols'] = config.colWidths.map(w => ({ wch: w }));
  } else {
    // Standard default proportional widths
    ws['!cols'] = Array.from({ length: totalCols }, () => ({ wch: 18 }));
  }

  ws['!merges'] = merges;
  ws['!rows'] = rowHeights;

  return ws;
}

/**
 * Convenience helper to convert JSON array of objects into a Saheb Paper styled worksheet.
 */
export function createStyledJsonWorksheet(
  title: string,
  data: Record<string, any>[],
  options?: {
    metadata?: SheetMetadataPair[];
    colWidths?: number[];
    alignments?: ('left' | 'center' | 'right')[];
    totals?: {
      label: string;
      value: string | number;
    };
    footerNote?: string;
  }
): XLSX.WorkSheet {
  if (!data || data.length === 0) {
    return createStyledWorksheet({
      title,
      metadata: options?.metadata,
      headers: ['Status', 'Message'],
      rows: [['INFO', 'No records found in this dataset']],
      colWidths: [15, 40],
      footerNote: options?.footerNote,
    });
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(item => headers.map(h => (item[h] !== undefined && item[h] !== null ? item[h] : '')));

  // Auto-determine sensible alignments
  const alignments: ('left' | 'center' | 'right')[] = options?.alignments || headers.map(h => {
    const lower = h.toLowerCase();
    if (lower.includes('weight') || lower.includes('tonnage') || lower.includes('stock') || lower.includes('kg') || lower.includes('mt')) {
      return 'right';
    }
    if (lower.includes('number') || lower.includes('id') || lower.includes('no') || lower.includes('date') || lower.includes('gsm') || lower.includes('size') || lower.includes('ply') || lower.includes('grade') || lower.includes('status') || lower.includes('timestamp')) {
      return 'center';
    }
    return 'left';
  });

  return createStyledWorksheet({
    title,
    metadata: options?.metadata,
    headers,
    rows,
    alignments,
    colWidths: options?.colWidths,
    totals: options?.totals,
    footerNote: options?.footerNote,
  });
}
