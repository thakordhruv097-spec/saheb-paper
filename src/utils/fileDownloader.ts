<<<<<<< HEAD
import * as XLSX from 'xlsx';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
=======
import XLSX from 'xlsx-js-style';
>>>>>>> 23e8b9a3370fa9d07fed9e91814b8f4864ba8c93

/**
 * Converts a Blob to a pure base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Universal file downloader that works reliably across Mobile (Android Chrome, iOS Safari, WebViews, Capacitor APK) and Desktop browsers.
 */
export async function downloadBlobFile(blob: Blob, filename: string): Promise<void> {
  // 1. Capacitor Native Platform (Android APK & iOS Native)
  const isCapacitor = typeof window !== 'undefined' && (
    (window as any)?.Capacitor?.isNativePlatform?.() ||
    (window as any)?.Capacitor?.getPlatform?.() === 'android'
  );

  if (isCapacitor) {
    try {
      const base64Data = await blobToBase64(blob);
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      if (writeResult && writeResult.uri) {
        await Share.share({
          title: filename,
          text: `File export: ${filename}`,
          url: writeResult.uri,
          dialogTitle: `Save / Share ${filename}`,
        });
        return;
      }
    } catch (capErr: any) {
      if (
        capErr?.message?.includes('canceled') ||
        capErr?.message?.includes('dismiss') ||
        capErr?.message?.includes('user denied') ||
        capErr?.name === 'AbortError'
      ) {
        // User dismissed the native share sheet intentionally
        return;
      }
      console.warn('[FileDownloader] Capacitor Filesystem/Share failed, falling back to Web APIs:', capErr);
    }
  }

  // 2. Web Share API (Primary choice for Mobile browsers like Android Chrome / iOS Safari)
  if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
    try {
      const file = new File([blob], filename, {
        type: blob.type || 'application/octet-stream',
        lastModified: Date.now(),
      });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
        });
        return;
      }
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') {
        // User dismissed the system share sheet intentionally
        return;
      }
      console.warn('[FileDownloader] Web Share API not completed, falling back to direct download:', shareErr);
    }
  }

  // 3. File System Access API (Supported on Desktop Chrome/Edge)
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window && !isCapacitor) {
    try {
      const isXlsx = filename.endsWith('.xlsx');
      const isJson = filename.endsWith('.json');
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: isXlsx
          ? [{
              description: 'Excel Spreadsheet (*.xlsx)',
              accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
            }]
          : isJson
          ? [{
              description: 'JSON Data (*.json)',
              accept: { 'application/json': ['.json'] },
            }]
          : [{
              description: 'File',
              accept: { 'application/octet-stream': [`.${filename.split('.').pop() || 'bin'}`] },
            }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (fsErr: any) {
      if (fsErr?.name === 'AbortError') {
        return;
      }
    }
  }

  // 4. Microsoft msSaveBlob check
  const nav = window.navigator as any;
  if (typeof nav !== 'undefined' && nav.msSaveOrOpenBlob) {
    nav.msSaveOrOpenBlob(blob, filename);
    return;
  }

  // 5. Standard Clean Blob Object URL Download
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.setAttribute('download', filename);
  link.setAttribute('target', '_self');
  link.setAttribute('rel', 'noopener noreferrer');

  document.body.appendChild(link);

  try {
    link.click();
  } catch {
    const evt = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(evt);
  }

  // Clean-up with safe delay (critical for mobile async download queues)
  setTimeout(() => {
    try {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, 10000);
}

/**
 * Universal Excel (.xlsx) file generator and downloader
 */
export async function exportExcelWorkbook(workbook: XLSX.WorkBook, filename: string): Promise<void> {
  const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  try {
    // Generate binary buffer using SheetJS
    const wbout = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      bookSST: false,
    });

    // Standard RFC-compliant XLSX MIME type without invalid text charset parameter
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await downloadBlobFile(blob, finalFilename);
  } catch (error) {
    console.error('[ExcelDownloader] Blob export failed, trying XLSX.writeFile fallback:', error);
    try {
      XLSX.writeFile(workbook, finalFilename);
    } catch (fallbackError) {
      console.error('[ExcelDownloader] All export methods failed:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Universal JSON file downloader
 */
export async function exportJsonData(data: any, filename: string): Promise<void> {
  try {
    const finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], {
      type: 'application/json',
    });
    await downloadBlobFile(blob, finalFilename);
  } catch (error) {
    console.error('[JsonDownloader] Failed to export JSON:', error);
  }
}
