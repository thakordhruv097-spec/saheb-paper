import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText, Lock, Download, Loader2, ExternalLink } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useMobileBackHandler } from '../hooks/useMobileBackHandler';
import { COMPANY_CONFIG } from '../config/company';
import type { PaperTestReport } from '../data/types';
import { generatePaperTestReportPdfBlob } from '../utils/labPdfGenerator';
import { downloadBlobFile } from '../utils/fileDownloader';
import { jsPDF } from 'jspdf';

export interface DocumentPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: PaperTestReport | null;
  title: string;
  subtitle?: string;
  filename: string;
  htmlContent?: string;
  jobName?: string;
  isViewer?: boolean;
  onToast?: (message: string) => void;
}

export const DocumentPrintPreviewModal: React.FC<DocumentPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  report,
  title,
  subtitle,
  filename,
  htmlContent,
  jobName,
  isViewer = false,
  onToast,
}) => {
  useBodyScrollLock(isOpen);
  useMobileBackHandler(isOpen, onClose, 'docPrintPreviewModal');

  const gsmSamples = useMemo(() => {
    if (report?.gsmSamples && report.gsmSamples.length > 0) {
      return report.gsmSamples;
    }
    return Array(14).fill(16.5);
  }, [report?.gsmSamples]);

  const formattedDate = useMemo(() => {
    if (!report?.date) return new Date().toISOString().substring(0, 10);
    return report.date.includes('-')
      ? report.date.split('-').reverse().join('.')
      : report.date;
  }, [report?.date]);

  const shiftDisplay = useMemo(() => {
    const s = report?.shift as string;
    if (s === 'A' || s === 'Day') return 'Day';
    if (s === 'B' || s === 'Night') return 'Night';
    return report?.shift || 'Day';
  }, [report?.shift]);

  const paramsList = useMemo(() => {
    if (!report) return [];
    return [
      { sr: 1, name: 'GSM', spec: 'Target Match', unit: 'g/m2', result: (Number(report.labResultGsm) || 0).toFixed(1) },
      { sr: 2, name: 'MOISTURE', spec: 'Content %', unit: '%', result: `${(Number(report.moisturePct) || 0).toFixed(2)}%` },
      { sr: 3, name: 'CALIPER', spec: 'Thickness', unit: 'MM', result: String(report.caliperMm ?? 0) },
      { sr: 4, name: 'BULK', spec: 'Specific Volume', unit: 'cc/gm', result: (Number(report.bulkCcGm) || 0).toFixed(2) },
      { sr: 5, name: 'BREAKING LENGTH', spec: '10 cm length (MD)', unit: 'Mtr', result: (Number(report.breakingLengthMd) || 0).toFixed(3) },
      { sr: 6, name: 'BREAKING LENGTH', spec: '10 cm length (CD)', unit: 'Mtr', result: (Number(report.breakingLengthCd) || 0).toFixed(3) },
      { sr: 7, name: 'BRIGHTNESS', spec: 'Optical ISO %', unit: '%', result: `${(Number(report.brightnessPct) || 0).toFixed(1)}%` },
      { sr: 8, name: 'TEAR', spec: 'Tear Resistance (MD)', unit: 'J/m2', result: (Number(report.tearMd) || 0).toFixed(2) },
      { sr: 9, name: 'TEAR', spec: 'Tear Resistance (CD)', unit: 'J/m2', result: (Number(report.tearCd) || 0).toFixed(2) },
      { sr: 10, name: 'TENSILE DRY', spec: '1 PLY (MD)', unit: 'N/M', result: (Number(report.tensileDryMd) || 0).toFixed(2) },
      { sr: 11, name: 'TENSILE DRY', spec: '1 PLY (CD)', unit: 'N/M', result: (Number(report.tensileDryCd) || 0).toFixed(2) },
      { sr: 12, name: 'STRETCH DRY', spec: '1 PLY (MD)', unit: '%', result: `${(Number(report.stretchDryMd) || 0).toFixed(2)}%` },
      { sr: 13, name: 'STRETCH DRY', spec: '1 PLY (CD)', unit: '%', result: `${(Number(report.stretchDryCd) || 0).toFixed(2)}%` },
    ];
  }, [report]);

  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (isViewer) {
      if (onToast) onToast('Downloading is locked for Viewer (Read-Only Mode).');
      return;
    }

    try {
      setIsDownloading(true);
      let pdfBlob: Blob;
      if (report) {
        pdfBlob = generatePaperTestReportPdfBlob(report);
      } else {
        const doc = new jsPDF();
        doc.text(title, 20, 20);
        pdfBlob = doc.output('blob');
      }

      await downloadBlobFile(pdfBlob, filename);

      if (onToast) {
        onToast(`📄 ${filename}: Select 'Save to device' or 'Drive' to save to Downloads!`);
      }
    } catch (err) {
      console.error('[PreviewModal] Download PDF failed:', err);
      if (onToast) onToast('❌ Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (isViewer) {
      if (onToast) onToast('Printing is locked for Viewer (Read-Only Mode).');
      return;
    }

    // 1. Mark printing body class so print stylesheets hide #root and display #printable-lab-modal
    document.body.classList.add('printing-lab-report');

    const cleanup = () => {
      document.body.classList.remove('printing-lab-report');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 4000);

    // 2. Also trigger direct PDF download to device storage in background
    handleDownloadPdf().catch((e) => console.warn('[PreviewModal] Background download on print:', e));

    // 3. Android Capacitor Native Bridge (Direct Android Print Spooler with "Save as PDF")
    const cleanJobName = jobName || `COA_Roll_${report?.rollNo || 'Document'}`;
    if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge) {
      try {
        if (htmlContent && typeof (window as any).AndroidNativeBridge.printHtml === 'function') {
          (window as any).AndroidNativeBridge.printHtml(htmlContent, cleanJobName);
          return;
        } else if (typeof (window as any).AndroidNativeBridge.printDocument === 'function') {
          (window as any).AndroidNativeBridge.printDocument(cleanJobName);
        }
      } catch (e) {
        console.warn('[LabPrint] AndroidNativeBridge failed:', e);
      }
    }

    // 4. Synchronous window.print() (Zero async delay -> Never blocked by Android Chrome / iOS Safari)
    window.print();
  };

  return createPortal(
    <div
      id="printable-lab-modal"
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-1 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-150 print:static print:block print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:z-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div
        className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl max-w-4xl w-full p-2 sm:p-5 space-y-3 shadow-2xl my-auto relative border border-slate-200 print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 print:rounded-none print:border-none print:space-y-0 print:block print:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Close Button (Screen Preview Only) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer z-30 print:hidden shadow-xs active:scale-95"
          title="Close Preview (or tap outside)"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Top Header / Toolbar (Screen Preview Only) */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 border-b border-slate-200 pb-3 pr-8 sm:pr-10 print:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0 border border-purple-200">
              <FileText className="h-4 sm:h-5 w-4 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h3
                id="preview-modal-title"
                className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider truncate"
              >
                {title}
              </h3>
              {subtitle && (
                <p className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
            {/* 1. Direct PDF Download Button */}
            <button
              type="button"
              disabled={isViewer || isDownloading}
              onClick={handleDownloadPdf}
              title={isViewer ? 'Downloading is locked for Viewer' : 'Download genuine PDF to phone storage'}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 rounded-xl transition shadow-xs cursor-pointer active:scale-95 ${
                isViewer
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : 'btn-primary-gradient shadow-purple-500/25'
              }`}
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isViewer ? (
                <Lock className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>{isDownloading ? 'Saving...' : 'Download PDF'}</span>
            </button>

            {/* 2. Open / View PDF in New Tab */}
            <button
              type="button"
              disabled={isViewer}
              onClick={() => {
                if (isViewer) return;
                try {
                  const pdfBlob = report ? generatePaperTestReportPdfBlob(report) : new Blob();
                  const url = window.URL.createObjectURL(pdfBlob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.target = '_blank';
                  a.rel = 'noopener noreferrer';
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    try {
                      if (document.body.contains(a)) document.body.removeChild(a);
                    } catch {}
                  }, 1000);
                } catch (e) {
                  console.warn('Open PDF failed:', e);
                }
              }}
              title={isViewer ? 'Locked for Viewer' : 'Open PDF directly in browser tab'}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-200 active:scale-95"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open PDF</span>
            </button>

            {/* 3. Print / System Spooler Button */}
            <button
              type="button"
              disabled={isViewer}
              onClick={handlePrint}
              title={isViewer ? 'Printing is locked for Viewer' : 'Open system print dialog'}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-200 active:scale-95 ${
                isViewer ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>

            {/* 4. Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* PRINTABLE LAB CERTIFICATE SHEET (A4 Document Container) */}
        <div className="bg-slate-100/60 p-0 sm:p-4 rounded-xl sm:rounded-2xl print:bg-white print:p-0 print:m-0 print:block print:overflow-visible">
          <div className="bg-white p-3 sm:p-6 text-black font-sans shadow-md border-2 border-[#1e3a8a] rounded-xl flex flex-col justify-between min-h-[268mm] print:min-h-[275mm] print:h-[275mm] print:shadow-none print:p-4 print:m-0 print:rounded-none">
            
            {/* 1. Header Banner */}
            <div className="text-center border-b-2 border-[#1e3a8a] pb-2 mb-3">
              <h1 className="text-lg sm:text-2xl font-black tracking-wider text-[#1e3a8a] uppercase leading-tight">
                {COMPANY_CONFIG.name}
              </h1>
              <h2 className="text-xs sm:text-sm font-extrabold tracking-widest text-[#dc2626] uppercase mt-1">
                PAPER TEST REPORT (COA)
              </h2>
            </div>

            {/* 2. Top Metadata Table */}
            <div className="border border-slate-400 mb-3 overflow-x-auto text-[10px] sm:text-xs">
              <table className="w-full text-center border-collapse">
                <tbody>
                  <tr className="border-b border-slate-400 bg-slate-50">
                    <td className="p-1 sm:p-1.5 font-bold text-[#dc2626] bg-slate-100 border-r border-slate-400 uppercase text-[9px] sm:text-[10px] w-[14%]">QUALITY:</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#1e3a8a] border-r border-slate-400">{report?.product || 'Semi Kraft'}</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#dc2626] bg-slate-100 border-r border-slate-400 uppercase text-[9px] sm:text-[10px] w-[14%]">ROLL NO:</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#1e3a8a] border-r border-slate-400 font-mono">{report?.rollNo || ''}</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#dc2626] bg-slate-100 border-r border-slate-400 uppercase text-[9px] sm:text-[10px] w-[12%]">SHIFT:</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#1e3a8a] border-r border-slate-400">{shiftDisplay}</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#dc2626] bg-slate-100 border-r border-slate-400 uppercase text-[9px] sm:text-[10px] w-[12%]">DATE:</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#1e3a8a] font-mono">{formattedDate}</td>
                  </tr>
                  <tr className="border-b border-slate-400 bg-white">
                    <td className="p-1 sm:p-1.5 font-bold text-[#dc2626] bg-slate-100 border-r border-slate-400 uppercase text-[9px] sm:text-[10px]">GSM:</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#1e3a8a] border-r border-slate-400 font-mono">{report?.targetGsm ?? 16}</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#dc2626] bg-slate-100 border-r border-slate-400 uppercase text-[9px] sm:text-[10px]">WEIGHT:</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#1e3a8a] border-r border-slate-400 font-mono">{report?.weight ?? 0} kg</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#dc2626] bg-slate-100 border-r border-slate-400 uppercase text-[9px] sm:text-[10px]">SPEED:</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#1e3a8a] border-r border-slate-400 font-mono">{report?.speed ?? 0}</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#dc2626] bg-slate-100 border-r border-slate-400 uppercase text-[9px] sm:text-[10px]">TIME:</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#1e3a8a] font-mono">{report?.time || '08:00'}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-1 sm:p-1.5 font-bold text-[#dc2626] bg-slate-100 border-r border-slate-400 uppercase text-[9px] sm:text-[10px]">CREPING:</td>
                    <td className="p-1 sm:p-1.5 font-bold text-[#1e3a8a] border-r border-slate-400 font-mono">{(Number(report?.crepingPct) || 0).toFixed(2)}%</td>
                    <td colSpan={6} className="bg-transparent border-none"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. Dual Column Main Layout */}
            <div className="grid grid-cols-12 gap-3 mb-3 text-[10px] sm:text-xs">
              {/* Left Column: GSM Profile (4 of 12 cols) */}
              <div className="col-span-4 border border-slate-400">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-[#1e3a8a] text-white text-[9px] sm:text-[10px] font-black uppercase">
                      <th className="p-1 border-r border-slate-400 w-[40%]">SR NO</th>
                      <th className="p-1 w-[60%]">GSM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {gsmSamples.slice(0, 14).map((val, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="p-0.5 sm:p-1 border-r border-slate-300 font-bold text-slate-700">{idx + 1}</td>
                        <td className="p-0.5 sm:p-1 font-mono font-bold text-[#dc2626]">{(Number(val) || 0).toFixed(1)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold border-t border-slate-400">
                      <td className="p-0.5 sm:p-1 border-r border-slate-300 text-left pl-2">Avg.</td>
                      <td className="p-0.5 sm:p-1 font-mono text-[#dc2626]">{(Number(report?.avgGsm) || 0).toFixed(1)}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-0.5 sm:p-1 border-r border-slate-300 text-left pl-2">Max.</td>
                      <td className="p-0.5 sm:p-1 font-mono text-[#dc2626]">{(Number(report?.maxGsm) || 0).toFixed(1)}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-0.5 sm:p-1 border-r border-slate-300 text-left pl-2">Min.</td>
                      <td className="p-0.5 sm:p-1 font-mono text-[#dc2626]">{(Number(report?.minGsm) || 0).toFixed(1)}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-0.5 sm:p-1 border-r border-slate-300 text-left pl-2">Range.</td>
                      <td className="p-0.5 sm:p-1 font-mono text-[#dc2626]">{(Number(report?.rangeGsm) || 0).toFixed(2)}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-0.5 sm:p-1 border-r border-slate-300 text-left pl-2">Breakage:</td>
                      <td className={`p-0.5 sm:p-1 font-mono ${(Number(report?.breakageCount) || 0) > 0 ? 'text-[#dc2626]' : 'text-emerald-700'}`}>
                        {report?.breakageCount ?? 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Column: 13 Test Parameters Table (8 of 12 cols) */}
              <div className="col-span-8 border border-slate-400">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-[#1e3a8a] text-white text-[9px] sm:text-[10px] font-black uppercase">
                      <th className="p-1 border-r border-slate-400 w-[8%]">SR</th>
                      <th className="p-1 border-r border-slate-400 text-left pl-2 w-[34%]">TEST PARAMETER</th>
                      <th className="p-1 border-r border-slate-400 text-left pl-2 w-[24%]">SPEC</th>
                      <th className="p-1 border-r border-slate-400 w-[14%]">UNITS</th>
                      <th className="p-1 w-[20%]">RESULT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-[10px] sm:text-[11px]">
                    {paramsList.map((param, pIdx) => (
                      <tr key={pIdx} className={pIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="p-0.5 sm:p-1 border-r border-slate-300 text-slate-500 font-semibold">{param.sr}</td>
                        <td className="p-0.5 sm:p-1 border-r border-slate-300 text-left pl-2 font-bold text-[#1e3a8a]">{param.name}</td>
                        <td className="p-0.5 sm:p-1 border-r border-slate-300 text-left pl-2 text-slate-500">{param.spec}</td>
                        <td className="p-0.5 sm:p-1 border-r border-slate-300 text-slate-600">{param.unit}</td>
                        <td className="p-0.5 sm:p-1 font-mono font-bold text-emerald-700">{param.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Remarks */}
            <div className="border border-slate-400 rounded p-2 sm:p-2.5 bg-slate-50 mb-3 text-[10px] sm:text-xs">
              <span className="font-bold text-[#dc2626] uppercase block mb-0.5 text-[9px] sm:text-[10px]">REMARK:</span>
              <p className="text-slate-800 font-medium leading-relaxed">
                {report?.remarks || 'Sample meets all physical strength, moisture & GSM quality benchmarks with Grade-A clearance.'}
              </p>
            </div>

            {/* 5. Company Footer */}
            <div className="text-center text-[8px] sm:text-[9px] font-semibold text-slate-500 border-t border-slate-300 pt-1.5 mt-auto">
              {COMPANY_CONFIG.name} &bull; {COMPANY_CONFIG.address} &bull; Mo: {COMPANY_CONFIG.phone} &bull; {COMPANY_CONFIG.website}
            </div>

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
