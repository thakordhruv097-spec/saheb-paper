import React from 'react';
import { X, Monitor, Smartphone, Download, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

interface DownloadAppsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppsModal: React.FC<DownloadAppsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const WINDOWS_DOWNLOAD_URL =
    'https://github.com/thakordhruv097-spec/saheb-paper/releases/latest/download/SahebPaper-Windows.exe';
  const ANDROID_DOWNLOAD_URL =
    'https://github.com/thakordhruv097-spec/saheb-paper/releases/latest/download/SahebPaper-Android.apk';
  const RELEASES_PAGE_URL =
    'https://github.com/thakordhruv097-spec/saheb-paper/releases';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#5E3BE8]/15 via-[#5E3BE8]/5 to-transparent rounded-bl-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#F0EEFF] text-[#5E3BE8] flex items-center justify-center shadow-xs">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-[#5E3BE8] uppercase">
              Official Apps
            </span>
            <h3 className="text-lg font-black text-[#1E1B4B] leading-tight">
              Download Saheb Paper ERP
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Install the native application on your device for high performance, hardware camera barcode scanning, and instant real-time sync.
        </p>

        {/* Options */}
        <div className="space-y-3">
          {/* Windows Option */}
          <div className="p-4 rounded-2xl border border-slate-200 hover:border-[#5E3BE8] bg-slate-50/60 hover:bg-[#FAF9FF] transition group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">Windows Desktop App</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                      .EXE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Portable build • No installation required • Windows 10/11
                  </p>
                </div>
              </div>
            </div>
            <a
              href={WINDOWS_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-[#5E3BE8] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download for Windows (.exe)</span>
            </a>
          </div>

          {/* Android Option */}
          <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30 transition group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">Android Mobile App</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                      .APK
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mobile &amp; Barcode Scanner Tablet • Android 8.0+
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href={ANDROID_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download APK</span>
              </a>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>
                Tip: In mobile Chrome, tap <strong>(⋮) Menu &gt; Install App</strong> for 1-tap instant install.
              </span>
            </div>
          </div>
        </div>

        {/* Footer info & link */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified GitHub Release</span>
          </div>
          <a
            href={RELEASES_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5E3BE8] hover:underline font-bold flex items-center gap-1"
          >
            <span>All Releases</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
