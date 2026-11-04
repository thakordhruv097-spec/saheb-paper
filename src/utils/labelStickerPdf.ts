import { jsPDF } from 'jspdf';
import { downloadBlobFile } from './fileDownloader';

export interface LabelStickerData {
  id?: string;
  reelNo: string;
  gsm?: string | number;
  weight?: string | number;
  dia?: string | number;
  ply?: string | number;
  product?: string;
  rollNo?: string | number;
  joint?: string | number;
  qrValue?: string;
  copies?: number;
}

export interface LabelStickerPdfOptions {
  showLogo?: boolean;
  logoDataUrl?: string;
  format?: [number, number]; // [100, 150] mm
}

/**
 * Loads an image from a URL into an in-memory base64 data URL via HTML5 Canvas.
 */
let cachedLogoDataUrl: string | null = null;
export async function getLogoBase64DataUrl(url = '/saheb-sticker-logo.png'): Promise<string> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  if (typeof window === 'undefined') return '';

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          cachedLogoDataUrl = canvas.toDataURL('image/png');
          resolve(cachedLogoDataUrl);
          return;
        }
      } catch (e) {
        console.warn('[LabelPdf] Logo canvas export failed:', e);
      }
      resolve('');
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
}

/**
 * Converts any DOM SVG element into a PNG Data URL using an offscreen Canvas.
 */
export async function convertSvgElementToPngDataUrl(
  svgEl: SVGElement,
  targetWidth = 240,
  targetHeight = 240
): Promise<string> {
  if (typeof window === 'undefined') return '';

  return new Promise((resolve) => {
    try {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgEl);
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const pngDataUrl = canvas.toDataURL('image/png');
            URL.revokeObjectURL(blobUrl);
            resolve(pngDataUrl);
            return;
          }
        } catch {
          // ignore
        }
        URL.revokeObjectURL(blobUrl);
        resolve('');
      };
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        resolve('');
      };
      img.src = blobUrl;
    } catch {
      resolve('');
    }
  });
}

/**
 * Finds a QR code SVG in the DOM for a given reel number.
 */
export function findQrCodeSvgForReel(reelNo: string): SVGElement | null {
  if (typeof document === 'undefined') return null;

  // 1. Try finding in batch print portal
  const portal = document.getElementById('label-studio-print-portal');
  if (portal) {
    const pages = portal.querySelectorAll('.print-label-page');
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (page.textContent?.includes(reelNo)) {
        const svg = page.querySelector('svg');
        if (svg) return svg;
      }
    }
  }

  // 2. Try finding in live preview
  const preview = document.getElementById('reel-print-label');
  if (preview && preview.textContent?.includes(reelNo)) {
    const svg = preview.querySelector('svg');
    if (svg) return svg;
  }

  // 3. Fallback: Any SVG inside reel label
  const anyLabel = document.querySelector('.reel-thermal-label');
  if (anyLabel) {
    const svg = anyLabel.querySelector('svg');
    if (svg) return svg;
  }

  return null;
}

/**
 * Generates an executive, standard 100mm x 150mm (4" x 6" TSC Thermal Roll)
 * vector PDF document for single or batch reel labels.
 */
export async function generateLabelStickersPdfDoc(
  labels: LabelStickerData[],
  options: LabelStickerPdfOptions = {}
): Promise<jsPDF> {
  const { showLogo = false } = options;

  // Pre-load logo data URL if needed
  let logoDataUrl = options.logoDataUrl || '';
  if (showLogo && !logoDataUrl) {
    logoDataUrl = await getLogoBase64DataUrl('/saheb-sticker-logo.png');
  }

  // 4" x 6" Thermal Roll Standard: 100mm wide x 150mm high
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150],
  });

  // Expand copies
  const expandedLabels: LabelStickerData[] = [];
  labels.forEach((item) => {
    const copies = Math.max(1, item.copies || 1);
    for (let c = 0; c < copies; c++) {
      expandedLabels.push(item);
    }
  });

  for (let idx = 0; idx < expandedLabels.length; idx++) {
    const label = expandedLabels[idx];
    if (idx > 0) {
      doc.addPage([100, 150], 'portrait');
    }

    // Pure White Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 100, 150, 'F');

    // ───── 1. HEADER / LOGO ZONE (Y = 6 to 34 mm) ─────
    if (showLogo && logoDataUrl) {
      try {
        // Center the 120px emblem (aspect ~3.8:1) at X=50, Y=7, width=64mm, height=24mm
        doc.addImage(logoDataUrl, 'PNG', 18, 7, 64, 24);
      } catch (imgErr) {
        console.warn('[LabelPdf] Could not add logo to PDF:', imgErr);
        // Fallback clean text emblem
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('SAHEB PAPER', 50, 20, { align: 'center' });
      }
    }

    // Solid Black Divider below Header (Y = 35)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(6, 35, 94, 35);

    // ───── 2. GRID 1: GSM & WEIGHT (Y = 38 to 55 mm) ─────
    // Left Box: GSM
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(6, 38, 42, 17, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('GSM', 9, 44);

    doc.setFontSize(18);
    doc.text(String(label.gsm || '16'), 9, 52);

    // Right Box: WEIGHT
    doc.roundedRect(52, 38, 42, 17, 1.5, 1.5, 'FD');

    doc.setFontSize(8);
    doc.text('WEIGHT', 55, 44);

    doc.setFontSize(16);
    const weightDisplay = String(label.weight || '1,450').replace(/kg/i, '').trim();
    doc.text(`${weightDisplay} KG`, 55, 52);

    // ───── 3. GRID 2: DIA & PLY (Y = 57 to 74 mm) ─────
    // Left Box: DIA
    doc.roundedRect(6, 57, 42, 17, 1.5, 1.5, 'FD');

    doc.setFontSize(8);
    doc.text('DIA', 9, 63);

    doc.setFontSize(16);
    const diaDisplay = String(label.dia || '115 CM');
    doc.text(diaDisplay, 9, 71);

    // Right Box: PLY
    doc.roundedRect(52, 57, 42, 17, 1.5, 1.5, 'FD');

    doc.setFontSize(8);
    doc.text('PLY', 55, 63);

    doc.setFontSize(16);
    const plyDisplay = String(label.ply || '2 Ply').includes('Ply')
      ? String(label.ply || '2 Ply')
      : `${label.ply || 2} Ply`;
    doc.text(plyDisplay, 55, 71);

    // ───── 4. GRID 3: PRODUCT (Y = 76 to 91 mm) ─────
    doc.roundedRect(6, 76, 88, 15, 1.5, 1.5, 'FD');

    doc.setFontSize(8);
    doc.text('PRODUCT', 9, 85);

    doc.setFontSize(12);
    const productDisplay = String(label.product || 'Napkin Tissue').substring(0, 24);
    doc.text(productDisplay, 34, 85);

    // ───── 5. GRID 4: QR CODE & REEL NO (Y = 93 to 132 mm) ─────
    doc.roundedRect(6, 93, 88, 39, 1.5, 1.5, 'FD');

    // Draw QR code image from DOM if available
    let qrAdded = false;
    const svgEl = findQrCodeSvgForReel(label.reelNo);
    if (svgEl) {
      try {
        const qrPngDataUrl = await convertSvgElementToPngDataUrl(svgEl, 200, 200);
        if (qrPngDataUrl) {
          doc.addImage(qrPngDataUrl, 'PNG', 9, 96, 32, 32);
          qrAdded = true;
        }
      } catch (qrErr) {
        console.warn('[LabelPdf] Could not convert QR SVG to image:', qrErr);
      }
    }

    // Fallback vector QR frame if image unavailable
    if (!qrAdded) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(10, 97, 30, 30, 'S');
      doc.setFontSize(6.5);
      doc.text('QR CODE', 25, 113, { align: 'center' });
    }

    // Text labels next to QR code
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('REEL IDENTIFIER / QR CODE', 44, 101);

    doc.setFontSize(7.5);
    doc.text('REEL NO.', 44, 107);

    doc.setFontSize(18);
    doc.text(label.reelNo, 44, 118);

    // ───── 6. FOOTER DIVIDER & MADE IN INDIA ─────
    doc.setLineWidth(0.4);
    doc.line(6, 136, 94, 136);

    doc.setFontSize(8.5);
    doc.text('M A D E   I N   I N D I A', 50, 142, { align: 'center' });
  }

  return doc;
}

/**
 * High-level helper: Downloads/shares a 4" x 6" TSC Thermal PDF of the specified labels.
 * 100% Native support for Android APK (Downloads folder + Share Sheet) and Web browsers.
 */
export async function downloadLabelStickersPdf(
  labels: LabelStickerData[],
  filename: string,
  options: LabelStickerPdfOptions = {}
): Promise<void> {
  const doc = await generateLabelStickersPdfDoc(labels, options);
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const blob = doc.output('blob');
  await downloadBlobFile(blob, safeFilename);
}
