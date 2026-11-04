import * as XLSX from 'xlsx';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { uploadDocumentToCloud, triggerCloudDownload } from './cloudDocumentStorage';

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
  const isCapacitor = typeof window !== 'undefined' && Boolean(
    (window as any)?.Capacitor?.isNativePlatform?.() ||
    (window as any)?.Capacitor?.getPlatform?.() === 'android' ||
    (window as any)?.AndroidNativeBridge
  );

  // 1. Android Capacitor Native APK: 100% Reliable File Saving & Downloads
  if (isCapacitor) {
    let savedToDevice = false;
    let base64Data = '';
    try {
      base64Data = await blobToBase64(blob);
    } catch (bErr) {
      console.warn('[FileDownloader] blobToBase64 conversion failed:', bErr);
    }

    // 1A. Direct save to Android public /storage/emulated/0/Download/ via Native MediaStore Bridge
    if (base64Data && (window as any).AndroidNativeBridge?.saveToDownloads) {
      try {
        const directSaved = (window as any).AndroidNativeBridge.saveToDownloads(
          base64Data,
          filename,
          blob.type || 'application/pdf'
        );
        if (directSaved) {
          console.log('[FileDownloader] Successfully saved to Downloads via AndroidNativeBridge');
          return;
        }
      } catch (bridgeErr) {
        console.warn('[FileDownloader] AndroidNativeBridge.saveToDownloads failed:', bridgeErr);
      }
    }

    // 1B. Direct write to public Documents directory via Capacitor Filesystem
    if (base64Data) {
      try {
        const docResult = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
        if (docResult && docResult.uri) {
          console.log('[FileDownloader] Wrote file to Directory.Documents:', docResult.uri);
          savedToDevice = true;
        }
      } catch (docErr) {
        console.warn('[FileDownloader] Capacitor write to Directory.Documents failed:', docErr);
      }
    }

    // 1C. Cloud Storage Upload + Android System DownloadManager Trigger
    // Uploads file to Supabase 'documents' bucket with Content-Disposition: attachment
    // and triggers Android system browser (Chrome/DownloadManager) to save into /storage/emulated/0/Download/
    try {
      const cloudUrls = await uploadDocumentToCloud(blob, filename);
      if (cloudUrls?.downloadUrl) {
        console.log('[FileDownloader] Uploaded to cloud storage:', cloudUrls.downloadUrl);

        // Download directly to Documents via Capacitor downloadFile with MediaScanner indexing
        try {
          await Filesystem.downloadFile({
            url: cloudUrls.downloadUrl,
            path: filename,
            directory: Directory.Documents,
          });
          console.log('[FileDownloader] Filesystem.downloadFile succeeded');
          savedToDevice = true;
        } catch (dlErr) {
          console.warn('[FileDownloader] Filesystem.downloadFile to Documents failed:', dlErr);
        }

        // Open in system browser (Chrome) which forces direct download to /storage/emulated/0/Download/
        try {
          window.open(cloudUrls.downloadUrl, '_system');
          savedToDevice = true;
        } catch (openErr) {
          console.warn('[FileDownloader] window.open _system failed:', openErr);
        }
      }
    } catch (cloudErr) {
      console.warn('[FileDownloader] Cloud storage route failed:', cloudErr);
    }

    // 1D. Native Share Sheet Fallback (allows user to tap "Save to device", "Files", or "Drive")
    if (!savedToDevice && base64Data) {
      try {
        const cacheResult = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
        });

        if (cacheResult && cacheResult.uri) {
          await Share.share({
            title: filename,
            url: cacheResult.uri,
            dialogTitle: `Save ${filename} to Device`,
          });
          savedToDevice = true;
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
        console.warn('[FileDownloader] Capacitor Filesystem / Share fallback failed:', capErr);
      }
    }

    if (!savedToDevice) {
      throw new Error(`Unable to save ${filename} to storage. Please check storage permissions.`);
    }

    return;
  }

  // 2. Supabase Cloud Storage (for Mobile Web Browsers e.g. Chrome on Android outside APK)
  // Uploads file to Supabase 'documents' bucket and triggers real HTTPS download with Content-Disposition: attachment.
  // This completely eliminates blob URL restrictions on Android Chrome, PWA, and mobile browsers.
  if (typeof window !== 'undefined') {
    try {
      const cloudUrls = await uploadDocumentToCloud(blob, filename);
      if (cloudUrls?.downloadUrl) {
        triggerCloudDownload(cloudUrls.downloadUrl, filename);
        return;
      }
    } catch (cloudErr) {
      console.warn('[FileDownloader] Cloud storage route failed, falling back to local:', cloudErr);
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
