import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText, Lock } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useMobileBackHandler } from '../hooks/useMobileBackHandler';
import { downloadBlobFile } from '../utils/fileDownloader';

export interface DocumentPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  filename: string;
  htmlContent: string;
  jobName?: string;
  isViewer?: boolean;
  onToast?: (message: string) => void;
}

export const DocumentPrintPreviewModal: React.FC<DocumentPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  filename,
  htmlContent,
  jobName,
  isViewer = false,
  onToast,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useBodyScrollLock(isOpen);
  useMobileBackHandler(isOpen, onClose, 'docPrintPreviewModal');

  if (!isOpen) return null;

  const handlePrintOrDownload = async () => {
    if (isViewer) {
      if (onToast) onToast('Printing is locked for Viewer (Read-Only Mode).');
      return;
    }

    const cleanJobName = jobName || filename.replace(/\.[^/.]+$/, '');

    // 1. In-DOM print container for native print (works on mobile Chrome, desktop, Electron)
    let printContainer = document.getElementById('saheb-lab-print-container');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'saheb-lab-print-container';
      document.body.appendChild(printContainer);
    }
    printContainer.innerHTML = htmlContent;
    document.body.classList.add('printing-lab-report');

    // 2. Android Capacitor APK Native Bridge (Direct Android Print Spooler with "Save as PDF")
    if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.printHtml) {
      try {
        (window as any).AndroidNativeBridge.printHtml(htmlContent, cleanJobName);
      } catch (androidErr) {
        console.warn('[DocumentPreview] AndroidNativeBridge.printHtml failed:', androidErr);
      }
    } else if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.printDocument) {
      try {
        (window as any).AndroidNativeBridge.printDocument(cleanJobName);
      } catch (e) {
        console.warn('[DocumentPreview] AndroidNativeBridge.printDocument failed:', e);
      }
    }

    // 3. Trigger native window.print() (opens Print Spooler / Save as PDF on Mobile Chrome & Desktop)
    try {
      window.print();
    } catch (e) {
      console.warn('[DocumentPreview] window.print() failed:', e);
      // Fallback: try printing iframe
      try {
        iframeRef.current?.contentWindow?.print();
      } catch (iframeErr) {
        console.warn('[DocumentPreview] iframe print fallback failed:', iframeErr);
      }
    }

    // 4. Download file directly so the user gets a physical file copy
    try {
      const htmlBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      await downloadBlobFile(htmlBlob, filename.endsWith('.html') ? filename : `${filename}.html`);
    } catch (dlErr) {
      console.warn('[DocumentPreview] downloadBlobFile fallback:', dlErr);
    }

    // 5. Success toast notification showing exactly what was downloaded
    if (onToast) {
      onToast(`📄 ${filename} downloaded successfully!`);
    }

    // 6. Cleanup print classes
    setTimeout(() => {
      document.body.classList.remove('printing-lab-report');
      if (printContainer && document.body.contains(printContainer)) {
        printContainer.innerHTML = '';
      }
    }, 2000);
  };

  return createPortal(
    <div
      id="printable-lab-modal"
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-150 print:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div
        className="bg-white dark:bg-[#131d38] text-slate-900 dark:text-white rounded-2xl sm:rounded-3xl max-w-4xl w-full p-3 sm:p-5 space-y-3 shadow-2xl my-auto relative border border-slate-200/80 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition cursor-pointer z-30 shadow-xs active:scale-95"
          title="Close Preview (or tap outside)"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Top Header / Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3 pr-8 sm:pr-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0 border border-purple-200/60 dark:border-purple-800/50">
              <FileText className="h-4 sm:h-5 w-4 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h3
                id="preview-modal-title"
                className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider truncate"
              >
                {title}
              </h3>
              {subtitle && (
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isViewer}
              onClick={handlePrintOrDownload}
              title={isViewer ? 'Printing is locked for Viewer (Read-Only Mode)' : 'Print or Save Document'}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 rounded-xl transition shadow-xs cursor-pointer active:scale-95 ${
                isViewer
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'btn-primary-gradient shadow-purple-500/25'
              }`}
            >
              {isViewer ? (
                <Lock className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <Printer className="h-3.5 w-3.5" />
              )}
              <span>{isViewer ? 'Locked' : 'Print / Save as PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Live In-App Document Preview Container */}
        <div className="w-full bg-slate-100 dark:bg-slate-900/60 p-1 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
          <iframe
            ref={iframeRef}
            title={title}
            srcDoc={htmlContent}
            className="w-full h-[62vh] sm:h-[72vh] rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 bg-white shadow-inner"
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
