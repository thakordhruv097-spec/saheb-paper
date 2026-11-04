import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getReels } from '../../data/index';
import type { Reel } from '../../data/types';
import {
  X,
  Zap,
  CheckCircle2,
  Trash2,
  Plus,
  Camera,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface LiveReelScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReelsToChallan: (reels: Reel[]) => void;
  alreadyLoadedReelNos?: string[];
}

export const LiveReelScannerModal: React.FC<LiveReelScannerModalProps> = ({
  isOpen,
  onClose,
  onAddReelsToChallan,
  alreadyLoadedReelNos = [],
}) => {
  const [scannedReels, setScannedReels] = useState<Reel[]>([]);
  const [torchActive, setTorchActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTimeRef = useRef<{ [code: string]: number }>({});

  // Web Audio Beep Sound (880Hz / 1046Hz Affirmative Tone)
  const playBeep = (freq = 880, duration = 0.12) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Safe camera stop
  const safeStopScanner = async (scanner: Html5Qrcode | null) => {
    if (!scanner) return;
    try {
      const state = scanner.getState();
      if (state === 2 || state === 3) {
        await scanner.stop();
      }
    } catch (_) {}
    try {
      scanner.clear();
    } catch (_) {}
  };

  // Torch / Flashlight Toggle
  const applyTorch = async (enable: boolean) => {
    let success = false;
    if (html5QrCodeRef.current) {
      try {
        const caps = (html5QrCodeRef.current as any).getRunningTrackCameraCapabilities?.();
        if (caps?.torchFeature) {
          const tf = caps.torchFeature();
          if (tf && typeof tf.apply === 'function') {
            await tf.apply(enable);
            success = true;
          }
        }
      } catch (_) {}

      if (!success) {
        try {
          await (html5QrCodeRef.current as any).applyVideoConstraints({
            advanced: [{ torch: enable }],
          });
          success = true;
        } catch (_) {}
      }
    }
    setTorchActive(enable);
    showToast(enable ? 'Flashlight ON' : 'Flashlight OFF');
  };

  // Process Scanned Code
  const processDecodedCode = (rawText: string) => {
    let targetCode = rawText.trim();

    // Check for JSON-encoded QR data
    if (targetCode.startsWith('{') && targetCode.endsWith('}')) {
      try {
        const parsed = JSON.parse(targetCode);
        if (parsed.reelNo) targetCode = String(parsed.reelNo);
      } catch (_) {}
    }

    // Clean URL query parameters if encoded as a link
    if (targetCode.includes('reel=')) {
      targetCode = targetCode.split('reel=')[1].split('&')[0];
    } else if (targetCode.includes('/reel/')) {
      targetCode = targetCode.split('/reel/')[1].split('?')[0];
    }
    targetCode = targetCode.replace(/[^a-zA-Z0-9_-]/g, '').trim().toUpperCase();

    if (!targetCode) return;

    // Debounce exact code within 1.8 seconds to avoid rapid multi-triggers
    const now = Date.now();
    const lastScan = lastScannedTimeRef.current[targetCode] || 0;
    if (now - lastScan < 1800) {
      return;
    }
    lastScannedTimeRef.current[targetCode] = now;

    // 1. Check if already loaded in challan
    if (alreadyLoadedReelNos.includes(targetCode)) {
      playBeep(440, 0.2); // Low buzz tone
      showToast(`Reel #${targetCode} is already loaded in this challan`);
      return;
    }

    // 2. Check if already in scanned queue
    if (scannedReels.some(r => r.reelNo.toUpperCase() === targetCode)) {
      showToast(`Reel #${targetCode} is already in the scanned list`);
      return;
    }

    // 3. Match against inventory reels
    const allWarehouseReels = getReels();
    const foundReel = allWarehouseReels.find(
      r => r.reelNo.trim().toUpperCase() === targetCode
    );

    if (foundReel) {
      playBeep(1046, 0.15); // High crisp affirmative chime
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }
      setScannedReels(prev => [foundReel, ...prev]);
      showToast(`Reel #${targetCode} scanned (${foundReel.weight || 0} KG)`);
    } else {
      // Create a virtual reel entry from label code if reel not found in local mock
      const virtualReel: Reel = {
        reelNo: targetCode,
        parentRollNo: 'R-AUTO',
        product: 'Napkin Tissue',
        gsm: 15,
        size: 26,
        ply: 1,
        weight: 35,
        dia: 95,
        joint: 0,
        status: 'IN_STOCK',
        qcGrade: 'A',
        productionDate: new Date().toISOString(),
      };
      playBeep(880, 0.15);
      setScannedReels(prev => [virtualReel, ...prev]);
      showToast(`Reel #${targetCode} added`);
    }
  };

  // Camera Lifecycle
  useEffect(() => {
    if (!isOpen) {
      if (html5QrCodeRef.current) {
        safeStopScanner(html5QrCodeRef.current);
        html5QrCodeRef.current = null;
      }
      setIsCameraActive(false);
      setTorchActive(false);
      return;
    }

    let isMounted = true;
    let localScanner: Html5Qrcode | null = null;

    const startCamera = async () => {
      try {
        setCameraError('');
        const container = document.getElementById('live-dispatch-scanner-viewfinder');
        if (!container || !isMounted) return;

        if (html5QrCodeRef.current) {
          await safeStopScanner(html5QrCodeRef.current);
          html5QrCodeRef.current = null;
        }

        localScanner = new Html5Qrcode('live-dispatch-scanner-viewfinder');
        html5QrCodeRef.current = localScanner;

        await localScanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 230, height: 230 },
            aspectRatio: 1.0,
            videoConstraints: {
              facingMode: 'environment',
            },
          },
          (decodedText) => {
            if (!isMounted) return;
            processDecodedCode(decodedText);
          },
          () => {}
        );

        if (isMounted) {
          setIsCameraActive(true);
        } else {
          await safeStopScanner(localScanner);
        }
      } catch (err: any) {
        if (isMounted) {
          setIsCameraActive(false);
          const msg = String(err?.message || err || '');
          setCameraError(
            msg.toLowerCase().includes('permission')
              ? 'Camera permission denied. Please allow camera in browser settings.'
              : 'Camera not available. You can use the simulator button below.'
          );
        }
        await safeStopScanner(localScanner);
      }
    };

    const timer = setTimeout(startCamera, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (localScanner) {
        safeStopScanner(localScanner);
      }
      if (html5QrCodeRef.current) {
        safeStopScanner(html5QrCodeRef.current);
        html5QrCodeRef.current = null;
      }
    };
  }, [isOpen]);

  // Remove individual reel from queue
  const handleRemoveReel = (reelNo: string) => {
    setScannedReels(prev => prev.filter(r => r.reelNo !== reelNo));
    playBeep(440, 0.08);
  };

  // Simulate scanning a reel from warehouse pool (for instant localhost testing)
  const handleSimulateScan = () => {
    const allReels = getReels();
    const available = allReels.filter(
      r =>
        !alreadyLoadedReelNos.includes(r.reelNo) &&
        !scannedReels.some(s => s.reelNo === r.reelNo)
    );

    const targetReel: Reel =
      available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : {
            reelNo: `260904${Math.floor(100 + Math.random() * 899)}`,
            parentRollNo: 'R-AUTO',
            product: 'Napkin Tissue',
            gsm: 15,
            size: 26,
            ply: 1,
            weight: Math.floor(25 + Math.random() * 30),
            dia: 95,
            joint: 0,
            status: 'IN_STOCK',
            qcGrade: 'A',
            productionDate: new Date().toISOString(),
          };

    processDecodedCode(targetReel.reelNo);
  };

  // Commit scanned reels to Challan
  const handleCommit = () => {
    if (scannedReels.length === 0) return;
    playBeep(1200, 0.2);
    onAddReelsToChallan(scannedReels);
    setScannedReels([]);
    onClose();
  };

  if (!isOpen) return null;

  const totalScannedWeight = scannedReels.reduce((sum, r) => sum + (r.weight || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex-1 flex flex-col w-full max-w-lg mx-auto bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-2xl overflow-hidden sm:my-auto sm:h-[92vh] sm:rounded-3xl border border-slate-200 dark:border-slate-800">

        {/* 1. Header Bar matching Image 2 */}
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50"></span>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
              Live Reel QR Scanner
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Flashlight button */}
            <button
              type="button"
              onClick={() => applyTorch(!torchActive)}
              className={`p-2 rounded-xl transition cursor-pointer border ${
                torchActive
                  ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-md shadow-amber-400/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Toggle Flashlight"
            >
              <Zap className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Close Scanner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {toastMsg && (
          <div className="absolute top-16 left-4 right-4 z-50 text-center pointer-events-none">
            <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl border border-slate-700 dark:border-slate-300 animate-in fade-in slide-in-from-top-2 duration-150">
              {toastMsg}
            </span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3.5">

          {/* 2. Camera Viewfinder Card */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg shrink-0 aspect-[4/3] sm:aspect-[16/10] max-h-[250px] flex items-center justify-center">
            
            {/* Camera Video Mount Point */}
            <div
              id="live-dispatch-scanner-viewfinder"
              className="w-full h-full object-cover"
            />

            {/* Viewfinder Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-48 h-40 border-2 border-[#6C4FE0]/80 rounded-2xl flex items-center justify-center shadow-lg shadow-[#6C4FE0]/25">
                
                {/* Laser scan line */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-sm shadow-purple-400 animate-pulse"></div>

                {/* 4 Corner brackets */}
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-3 border-l-3 border-white rounded-tl-xl shadow-xs"></div>
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-3 border-r-3 border-white rounded-tr-xl shadow-xs"></div>
                <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-3 border-l-3 border-white rounded-bl-xl shadow-xs"></div>
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-3 border-r-3 border-white rounded-br-xl shadow-xs"></div>

                {/* Subtle Helper Label */}
                <div className="text-center opacity-70">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-purple-300 uppercase">
                    Align Reel QR
                  </span>
                </div>
              </div>
            </div>

            {/* Error or Permission Notice */}
            {cameraError && (
              <div className="absolute inset-x-3 bottom-12 p-2.5 rounded-xl bg-rose-950/90 text-rose-200 border border-rose-800/80 text-xs font-semibold text-center backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 inline mr-1 text-rose-400" />
                {cameraError}
              </div>
            )}

            {/* Simulate Scan Button for testing on localhost */}
            <button
              type="button"
              onClick={handleSimulateScan}
              className="absolute bottom-2.5 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 hover:bg-white text-primary dark:text-purple-300 font-extrabold text-[11px] uppercase tracking-wider border border-primary/30 shadow-md backdrop-blur-sm cursor-pointer transition active:scale-95 flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Simulate Camera QR Scan</span>
            </button>
          </div>

          {/* 3. Recently Scanned Reels Section */}
          <div className="flex-1 flex flex-col space-y-2 min-h-[160px]">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-primary dark:text-purple-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200 tracking-tight">
                  Recently Scanned Reels
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black font-mono bg-purple-100 text-primary dark:bg-purple-900/60 dark:text-purple-300">
                  {scannedReels.length}
                </span>
              </div>

              {scannedReels.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Ready to Transfer</span>
                </span>
              )}
            </div>

            {/* Scanned Items List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-0.5 max-h-[220px]">
              {scannedReels.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    Point camera at reel QR codes.
                  </p>
                  <p className="text-[11px] text-primary dark:text-purple-400 mt-1 font-semibold">
                    Each scanned reel will appear here automatically.
                  </p>
                </div>
              ) : (
                scannedReels.map((reel) => (
                  <div
                    key={reel.reelNo}
                    className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs hover:border-primary/40 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          #{reel.reelNo}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                          {reel.product} • {reel.gsm}GSM • {reel.size}mm
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black font-mono bg-purple-50 text-primary dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/70">
                        {reel.weight || 0} KG
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveReel(reel.reelNo)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer transition"
                        title="Remove Scanned Reel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

        {/* 4. Bottom Sticky Action Area matching Image 2 */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs sm:text-sm font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Scanned Total</span>
            <span className="font-mono font-black text-primary dark:text-purple-300">
              {scannedReels.length} Reels • {totalScannedWeight.toLocaleString()} KG
            </span>
          </div>

          <button
            type="button"
            onClick={handleCommit}
            disabled={scannedReels.length === 0}
            className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
              scannedReels.length > 0
                ? 'bg-primary hover:bg-[#5B3DC9] text-white shadow-md shadow-primary/25 active:scale-[0.98]'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              Add {scannedReels.length} Reel{scannedReels.length === 1 ? '' : 's'} to Challan ({totalScannedWeight.toLocaleString()} KG)
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
