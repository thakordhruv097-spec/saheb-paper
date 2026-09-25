import * as XLSX from 'xlsx';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
  // 1. Android Native Capacitor Bridge: Direct save to phone's public Downloads directory
  if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.saveToDownloads) {
    try {
      const base64Data = await blobToBase64(blob);
      const saved = (window as any).AndroidNativeBridge.saveToDownloads(base64Data, filename, blob.type || 'application/octet-stream');
      if (saved) {
        return;
      }
    } catch (bridgeErr) {
      console.warn('[FileDownloader] AndroidNativeBridge.saveToDownloads failed, trying fallbacks:', bridgeErr);
    }
  }

  // 2. Capacitor Filesystem: Write to Documents directory with permission check if needed
  const isCapacitor = typeof window !== 'undefined' && (
    (window as any)?.Capacitor?.isNativePlatform?.() ||
    (window as any)?.Capacitor?.getPlatform?.() === 'android'
  );

  if (isCapacitor) {
    try {
      const base64Data = await blobToBase64(blob);
      try {
        const permStatus = await Filesystem.checkPermissions();
        if (permStatus.publicStorage !== 'granted') {
          await Filesystem.requestPermissions();
        }
      } catch {
        // Permissions not needed or auto-handled on Android 10+
      }

      try {
        await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
        return;
      } catch (docErr) {
        console.warn('[FileDownloader] Write to Documents failed, falling back to Cache + Share:', docErr);
        const writeResult = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
        });

        if (writeResult && writeResult.uri) {
          await Share.share({
            title: filename,
            text: `Download / Save: ${filename}`,
            url: writeResult.uri,
            dialogTitle: `Save ${filename}`,
          });
          return;
        }
      }
    } catch (capErr: any) {
      if (
        capErr?.message?.includes('canceled') ||
        capErr?.message?.includes('dismiss') ||
        capErr?.message?.includes('user denied') ||
        capErr?.name === 'AbortError'
      ) {
        return;
      }
      console.warn('[FileDownloader] Capacitor Filesystem failed:', capErr);
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
