import XLSX from 'xlsx-js-style';

/**
 * Universal file downloader that works reliably across Mobile (Android Chrome, iOS Safari, WebViews) and Desktop browsers.
 */
export async function downloadBlobFile(blob: Blob, filename: string): Promise<void> {
  // 1. Web Share API (Primary choice for Mobile browsers like Android Chrome / iOS Safari)
  // Hands file directly to native OS Share/Save sheet, bypassing Chrome's insecure download warnings on local network/HTTP
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

  // 2. File System Access API (Supported on Desktop Chrome/Edge and newer Android Chrome)
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
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

  // 3. Microsoft msSaveBlob check
  const nav = window.navigator as any;
  if (typeof nav !== 'undefined' && nav.msSaveOrOpenBlob) {
    nav.msSaveOrOpenBlob(blob, filename);
    return;
  }

  // 4. Standard Clean Blob Object URL Download
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
      alert('Could not download Excel file. Please check device download permissions.');
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
