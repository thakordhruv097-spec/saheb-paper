import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { blobToBase64 } from './fileDownloader';

export interface PrintDocumentOptions {
  title: string;
  filename: string;
  htmlContent?: string;
  jobName?: string;
  onSuccess?: (msg: string) => void;
  onError?: (err: string) => void;
}

/**
 * Universal print and download service designed for:
 * 1. Android Capacitor APK (Direct Print Spooler with "Save as PDF" + Share/Save file)
 * 2. Mobile Browser (Web Share API)
 * 3. Desktop Electron & Web (Silent Iframe / Window Print)
 * 
 * CRITICAL: Never calls window.open('', '_blank') which launches external blank Chrome on Android.
 */
export async function universalPrintOrDownload(options: PrintDocumentOptions): Promise<void> {
  const { title, filename, htmlContent, jobName = filename.replace(/\.[^/.]+$/, '') } = options;

  // 1. Android Native Capacitor Bridge: printHtml (Direct Android Print Spooler with "Save as PDF" option)
  if (typeof window !== 'undefined' && htmlContent && (window as any).AndroidNativeBridge?.printHtml) {
    try {
      (window as any).AndroidNativeBridge.printHtml(htmlContent, jobName);
      options.onSuccess?.(`📄 ${filename} sent to Android Print Spooler / Save as PDF!`);
      return;
    } catch (androidErr) {
      console.warn('[UniversalPrint] AndroidNativeBridge.printHtml failed, falling back:', androidErr);
    }
  }

  // 2. Android Native Bridge: printDocument (uses current WebView)
  if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.printDocument) {
    try {
      (window as any).AndroidNativeBridge.printDocument(jobName);
      options.onSuccess?.(`📄 ${filename} sent to Android Print Spooler / Save as PDF!`);
      window.print();
      return;
    } catch (e) {
      console.warn('[UniversalPrint] AndroidNativeBridge.printDocument failed:', e);
    }
  }

  // 3. Capacitor Filesystem & Share on Mobile APK
  const isCapacitor = typeof window !== 'undefined' && (
    (window as any)?.Capacitor?.isNativePlatform?.() ||
    (window as any)?.Capacitor?.getPlatform?.() === 'android'
  );

  if (isCapacitor && htmlContent) {
    try {
      const htmlBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const base64Data = await blobToBase64(htmlBlob);
      const safeFilename = filename.endsWith('.html') ? filename : `${filename}.html`;
      const writeResult = await Filesystem.writeFile({
        path: safeFilename,
        data: base64Data,
        directory: Directory.Cache,
      });

      if (writeResult && writeResult.uri) {
        await Share.share({
          title,
          text: `Download / Print: ${title}`,
          url: writeResult.uri,
          dialogTitle: `Save / Print ${filename}`,
        });
        options.onSuccess?.(`📄 ${filename} ready to save / share!`);
        return;
      }
    } catch (capErr: any) {
      if (
        capErr?.message?.includes('canceled') ||
        capErr?.message?.includes('dismiss') ||
        capErr?.name === 'AbortError'
      ) {
        options.onSuccess?.(`📄 ${filename} download sheet closed.`);
        return;
      }
      console.warn('[UniversalPrint] Capacitor share failed, falling back:', capErr);
    }
  }

  // 4. Web & Desktop: Silent hidden iframe (never flashes, navigates, or opens Chrome)
  if (htmlContent) {
    try {
      let iframe = document.getElementById('saheb-universal-print-frame') as HTMLIFrameElement;
      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }

      iframe = document.createElement('iframe');
      iframe.id = 'saheb-universal-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlContent);
        frameDoc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            options.onSuccess?.(`📄 ${filename} sent to printer!`);
          } catch (iframeErr) {
            console.warn('[UniversalPrint] iframe print failed:', iframeErr);
            window.print();
          } finally {
            setTimeout(() => {
              if (iframe && document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 60000);
          }
        }, 350);
        return;
      }
    } catch (frameErr) {
      console.warn('[UniversalPrint] hidden iframe failed, falling back to window.print():', frameErr);
    }
  }

  // 5. Standard fallback
  window.print();
  options.onSuccess?.(`📄 ${filename} print dialog opened!`);
}
