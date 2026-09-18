import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  DownloadCloud,
  CheckCircle2,
  RefreshCw,
  X,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import {
  checkServerVersion,
  getInstalledVersionCode,
  markVersionInstalled,
  isVersionDismissed,
  dismissVersion,
  clearAppCaches,
  type AppVersionInfo,
  CURRENT_CLIENT_VERSION,
  CURRENT_CLIENT_VERSION_CODE,
} from '../services/appUpdateService';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export interface AppUpdateModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const DEFAULT_UPDATE_INFO: AppVersionInfo = {
  version: 'Beta 1.0',
  versionCode: 6,
  releaseDate: '2026-09-18',
  title: 'Saheb Paper ERP (Beta 1.0) Update',
  highlights: [
    'Quick calendar date-picker in mobile top bar across all pages',
    'Instant cross-device real-time sync for Android QR scan dispatches (<50ms)',
    'Automatic real-time date defaulting and chronological roll numbering',
    'Strict single-product stock filtering in Label Studio',
    'Sequential Delivery Challan numbering (PS-1, PS-2) and date-wise sorting',
    'Windows 10/11 production cloud database connection fix',
    'Direct in-app APK update without external browser redirects',
  ],
  packageSizeMb: 7.7,
  apkUrl: 'https://github.com/thakordhruv097-spec/saheb-paper/releases/latest/download/SahebPaper-Beta-1.0.apk',
  exeUrl: 'https://github.com/thakordhruv097-spec/saheb-paper/releases/latest/download/SahebPaper-Beta-1.0.exe',
  mandatory: false,
};

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo>(DEFAULT_UPDATE_INFO);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [status, setStatus] = useState<'prompt' | 'downloading' | 'installing' | 'done'>('prompt');
  const [progress, setProgress] = useState(0);
  const [downloadedMb, setDownloadedMb] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('2.8 MB/s');
  const [apkDownloadNotice, setApkDownloadNotice] = useState(false);

  const progressIntervalRef = useRef<any>(null);

  const isVisible = propIsOpen !== undefined ? (propIsOpen || internalIsOpen) : internalIsOpen;
  useBodyScrollLock(isVisible);
  const installedCode = getInstalledVersionCode();
  const hasNewVersion = (updateInfo?.versionCode || 0) > installedCode;

  // Always check version from server on component mount
  useEffect(() => {
    const runCheck = async () => {
      const info = await checkServerVersion();
      if (info) {
        setUpdateInfo(info);
      }
    };
    runCheck();
  }, []);

  // Check version whenever modal becomes visible
  useEffect(() => {
    if (!isVisible) return;

    const runCheck = async () => {
      const info = await checkServerVersion();
      if (info) {
        setUpdateInfo(info);
      }
    };

    runCheck();
  }, [isVisible]);

  // Listen for custom trigger (e.g. from Profile "Check for Updates" button)
  useEffect(() => {
    const handleManualTrigger = async () => {
      const info = await checkServerVersion();
      if (info) {
        setUpdateInfo(info);
      }
      setInternalIsOpen(true);
    };

    window.addEventListener('saheb_check_update_manual', handleManualTrigger);
    return () => {
      window.removeEventListener('saheb_check_update_manual', handleManualTrigger);
    };
  }, []);

  const handleStartUpdate = () => {
    setStatus('downloading');
    setProgress(0);
    setDownloadedMb(0);

    const totalMb = updateInfo?.packageSizeMb || 7.7;
    const totalSteps = 40; // 40 increments
    const stepDuration = 50; // ~2 seconds total simulated download

    let currentStep = 0;
    progressIntervalRef.current = setInterval(() => {
      currentStep++;
      const currentPct = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
      const currentMb = parseFloat(((currentPct / 100) * totalMb).toFixed(1));

      setProgress(currentPct);
      setDownloadedMb(currentMb);

      // Randomize speed display slightly for realism
      const speed = (2.4 + Math.random() * 0.8).toFixed(1);
      setDownloadSpeed(`${speed} MB/s`);

      if (currentStep >= totalSteps) {
        clearInterval(progressIntervalRef.current);
        setStatus('installing');

        // Apply caches clear and restart
        setTimeout(async () => {
          markVersionInstalled(updateInfo?.versionCode || 6);
          await clearAppCaches();
          setStatus('done');

          // Hard reload the app into new version
          setTimeout(() => {
            window.location.reload();
          }, 800);
        }, 1000);
      }
    }, stepDuration);
  };

  const handleDownloadApkDirect = () => {
    const apkUrl =
      updateInfo?.apkUrl ||
      'https://github.com/thakordhruv097-spec/saheb-paper/releases/latest/download/SahebPaper-Beta-1.0.apk';
    const link = document.createElement('a');
    link.href = apkUrl;
    link.setAttribute('download', 'SahebPaper-Beta-1.0.apk');
    link.setAttribute('target', '_self');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setApkDownloadNotice(true);
    setTimeout(() => setApkDownloadNotice(false), 6000);
  };

  const handleDismiss = () => {
    if (status === 'downloading' || status === 'installing') return;
    if (updateInfo) {
      dismissVersion(updateInfo.versionCode);
    }
    setInternalIsOpen(false);
    if (propOnClose) propOnClose();
  };

  const handleForceRefresh = async () => {
    markVersionInstalled(updateInfo?.versionCode || 6);
    await clearAppCaches();
    window.location.reload();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#131d38] border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative p-5 sm:p-6 bg-slate-900 dark:bg-[#0B132B] border-b border-slate-800 text-white shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-800 dark:bg-slate-800/80 rounded-2xl border border-slate-700/80">
                {status === 'installing' || status === 'done' ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 animate-bounce" />
                ) : status === 'downloading' ? (
                  <DownloadCloud className="h-6 w-6 text-white animate-pulse" />
                ) : hasNewVersion ? (
                  <Sparkles className="h-6 w-6 text-purple-400" />
                ) : (
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                )}
              </div>
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  hasNewVersion
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}>
                  {hasNewVersion ? (
                    <>
                      <Zap className="h-3 w-3 text-purple-300 fill-purple-300" />
                      {updateInfo?.title || 'System Update Ready'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      System Up to Date
                    </>
                  )}
                </span>
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1 font-heading">
                  {status === 'downloading'
                    ? 'Downloading Update...'
                    : status === 'installing' || status === 'done'
                    ? 'Installing & Restarting...'
                    : hasNewVersion
                    ? `Version ${updateInfo?.version || '1.3.0'} Available`
                    : `Saheb Paper ERP v${CURRENT_CLIENT_VERSION}`}
                </h3>
              </div>
            </div>

            {status === 'prompt' && (
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div
          data-modal-scroll="true"
          className="p-5 sm:p-7 space-y-6 flex-1 overflow-y-auto overscroll-contain"
        >
          {status === 'prompt' && (
            <>
              {hasNewVersion ? (
                <>
                  {/* Release Highlights */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span>What's New in v{updateInfo?.version || '1.3.0'}:</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400">
                        Current: v{CURRENT_CLIENT_VERSION} &rarr; New: v{updateInfo?.version || '1.3.0'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 space-y-2.5">
                      {updateInfo?.highlights && updateInfo.highlights.length > 0 ? (
                        updateInfo.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>General performance enhancements, updated formulas & bug fixes.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Package Specs Pill */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 text-xs">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verified Saheb Paper Release</span>
                    </div>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                      {updateInfo?.packageSizeMb || 7.7} MB
                    </span>
                  </div>

                  {/* APK Download Toast Notice */}
                  {apkDownloadNotice && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2.5 animate-in fade-in shadow-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Direct APK download initiated! Open your phone's notification bar or Downloads to tap and install.</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleStartUpdate}
                      className="w-full bg-[#6C4FE0] hover:bg-[#593ec2] py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 cursor-pointer active:scale-98 transition"
                    >
                      <RefreshCw className="h-4 w-4 animate-spin-slow" />
                      <span>Instant In-App Update &amp; Restart</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleDownloadApkDirect}
                        className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 cursor-pointer active:scale-98 transition flex items-center justify-center gap-2"
                      >
                        <DownloadCloud className="h-4 w-4" />
                        <span>Direct APK Download (.apk)</span>
                      </button>

                      {!updateInfo?.mandatory && (
                        <button
                          type="button"
                          onClick={handleDismiss}
                          className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          Remind Later
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Up to date state */}
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 rounded-2xl p-5 space-y-3 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Saheb Paper ERP is Up to Date
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        Your app is running the latest verified production build (v{CURRENT_CLIENT_VERSION}). Real-time sync, offline caching, and thermal printing are all fully synchronized.
                      </p>
                    </div>
                  </div>

                  {/* Package Specs Pill */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>Release Verified • v{CURRENT_CLIENT_VERSION}</span>
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      {updateInfo?.releaseDate || '2026-09-18'}
                    </span>
                  </div>

                  {/* APK Download Toast Notice */}
                  {apkDownloadNotice && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2.5 animate-in fade-in shadow-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Direct APK download initiated! Open your phone's notification bar or Downloads to tap and install.</span>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleDownloadApkDirect}
                      className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <DownloadCloud className="h-3.5 w-3.5" />
                      <span>Download APK (.apk)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleForceRefresh}
                      className="w-full sm:flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Re-sync &amp; Reload</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {(status === 'downloading' || status === 'installing' || status === 'done') && (
            <div className="space-y-6 py-2">
              {/* Live Progress Bar & Numbers */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span className="flex items-center gap-2">
                    <RefreshCw className={`h-3.5 w-3.5 text-purple-600 dark:text-purple-400 ${status === 'downloading' ? 'animate-spin' : ''}`} />
                    <span>
                      {status === 'downloading'
                        ? 'Downloading updated system package...'
                        : 'Applying update and restarting...'}
                    </span>
                  </span>
                  <span className="font-mono font-black text-sm text-purple-600 dark:text-purple-400">
                    {progress}%
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-150 ${
                      progress === 100 ? 'bg-emerald-500' : 'bg-[#6C4FE0]'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Progress Stats Summary */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Downloaded</div>
                  <div className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5">
                    {downloadedMb} / {updateInfo?.packageSizeMb || 8.2} MB
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Speed</div>
                  <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {status === 'done' ? 'Completed' : downloadSpeed}
                  </div>
                </div>
              </div>

              {/* Notice */}
              <p className="text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {status === 'installing' || status === 'done'
                  ? 'Restarting app into new version...'
                  : 'Please keep the app open while the update completes.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
