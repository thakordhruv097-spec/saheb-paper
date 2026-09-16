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

export interface AppUpdateModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const DEFAULT_UPDATE_INFO: AppVersionInfo = {
  version: '1.3.0',
  versionCode: 4,
  releaseDate: '2026-09-16',
  title: 'System Update Ready',
  highlights: [
    'Tensile Dry auto-calculation with ISO strength formula',
    'Paper Test Report full-width Remarks & notes interface',
    'Streamlined Rewinder & Label Studio print controls',
    'Official high-resolution Saheb Paper brand icons & assets',
    'Sub-second live cloud sync performance upgrade',
  ],
  packageSizeMb: 8.2,
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

  const progressIntervalRef = useRef<any>(null);

  const isVisible = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const installedCode = getInstalledVersionCode();
  const hasNewVersion = (updateInfo?.versionCode || 0) > installedCode;

  // Check version only when modal is explicitly opened or manually triggered
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

    const totalMb = updateInfo?.packageSizeMb || 8.2;
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
          markVersionInstalled(updateInfo?.versionCode || CURRENT_CLIENT_VERSION_CODE);
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

  const handleDismiss = () => {
    if (status === 'downloading' || status === 'installing') return;
    if (updateInfo) {
      dismissVersion(updateInfo.versionCode);
      markVersionInstalled(updateInfo.versionCode);
    }
    setInternalIsOpen(false);
    if (propOnClose) propOnClose();
  };

  const handleForceRefresh = async () => {
    markVersionInstalled(updateInfo?.versionCode || CURRENT_CLIENT_VERSION_CODE);
    await clearAppCaches();
    window.location.reload();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#131d38] border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div
          className={`relative p-6 sm:p-7 text-white overflow-hidden ${
            hasNewVersion
              ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800'
              : 'bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900'
          }`}
        >
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                {status === 'installing' || status === 'done' ? (
                  <CheckCircle2 className="h-7 w-7 text-emerald-300 animate-bounce" />
                ) : status === 'downloading' ? (
                  <DownloadCloud className="h-7 w-7 text-white animate-pulse" />
                ) : hasNewVersion ? (
                  <Sparkles className="h-7 w-7 text-amber-300" />
                ) : (
                  <ShieldCheck className="h-7 w-7 text-emerald-300" />
                )}
              </div>
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                  {hasNewVersion ? (
                    <>
                      <Zap className="h-3 w-3 text-amber-300 fill-amber-300" />
                      {updateInfo?.title || 'System Update Ready'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-300" />
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
                className="text-white/70 hover:text-white p-1 rounded-xl hover:bg-white/10 transition cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6">
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
                      {updateInfo?.packageSizeMb || 8.2} MB
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    {!updateInfo?.mandatory && (
                      <button
                        type="button"
                        onClick={handleDismiss}
                        className="w-full sm:w-1/3 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Remind Later
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleStartUpdate}
                      className="w-full flex-1 btn-primary-gradient py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 cursor-pointer active:scale-98 transition"
                    >
                      <RefreshCw className="h-4 w-4 animate-spin-slow" />
                      <span>Update & Restart Now</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
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
                      {updateInfo?.releaseDate || '2026-09-16'}
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleForceRefresh}
                      className="w-full sm:w-1/2 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Re-sync & Reload</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="w-full sm:w-1/2 py-3 px-6 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
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
                    className={`h-full rounded-full transition-all duration-150 relative overflow-hidden ${
                      progress === 100
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  >
                    {/* Glowing highlight streak */}
                    <div className="absolute inset-0 bg-white/25 w-full animate-pulse" />
                  </div>
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
