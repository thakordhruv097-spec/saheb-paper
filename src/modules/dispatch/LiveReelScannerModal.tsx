import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { getReels, saveReel } from '../../data/index';
import type { Reel } from '../../data/types';
import {
  X,
  Zap,
  CheckCircle2,
  Plus,
  AlertCircle,
  Truck,
  Pencil,
  RefreshCw,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface LiveReelScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReelsToChallan: (reels: Reel[]) => void;
  alreadyLoadedReelNos?: string[];
  onRemoveReelFromChallan?: (reelNo: string) => void;
}

export const LiveReelScannerModal: React.FC<LiveReelScannerModalProps> = ({
  isOpen,
  onClose,
  onAddReelsToChallan,
  alreadyLoadedReelNos = [],
  onRemoveReelFromChallan,
}) => {
  const [scannedReels, setScannedReels] = useState<Reel[]>([]);
  const [torchActive, setTorchActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Manual entry inside camera modal for reels with damaged QR
  const [scannerManualInput, setScannerManualInput] = useState('');

  // Verification Confirmation Popup State (Matching User's Pic)
  const [verifyingReel, setVerifyingReel] = useState<Reel | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [editSpecsForm, setEditSpecsForm] = useState<{
    reelNo: string;
    product: string;
    gsm: number;
    size: number;
    weight: number;
  }>({
    reelNo: '',
    product: '',
    gsm: 15,
    size: 26,
    weight: 0,
  });

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTimeRef = useRef<{ [code: string]: number }>({});
  
  // High-performance refs to synchronously block duplicates and pause decoding
  const scannedReelNosSetRef = useRef<Set<string>>(new Set());
  const alreadyLoadedReelNosRef = useRef<string[]>([]);
  const verifyingReelRef = useRef<Reel | null>(null);

  // Synchronize blocked reel numbers synchronously
  useEffect(() => {
    alreadyLoadedReelNosRef.current = alreadyLoadedReelNos.map(s => s.trim().toUpperCase());
    const blockedSet = new Set<string>();
    alreadyLoadedReelNos.forEach(no => blockedSet.add(no.trim().toUpperCase()));
    scannedReels.forEach(r => blockedSet.add(r.reelNo.trim().toUpperCase()));
    scannedReelNosSetRef.current = blockedSet;
  }, [alreadyLoadedReelNos, scannedReels]);

  // Keep verifyingReelRef in sync
  useEffect(() => {
    verifyingReelRef.current = verifyingReel;
  }, [verifyingReel]);

  // Synchronize already loaded reels on open so scanner list matches challan draft
  useEffect(() => {
    if (isOpen) {
      const allWarehouseReels = getReels();
      const loadedSet = new Set(alreadyLoadedReelNos.map(s => s.trim().toUpperCase()));
      const initialReels = allWarehouseReels.filter(r =>
        loadedSet.has(r.reelNo.trim().toUpperCase())
      );
      setScannedReels(initialReels);
    }
  }, [isOpen]);

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

  // Core processing function for both QR scan & manual input
  const handleAddCodeToVerification = (rawText: string) => {
    let targetCode = rawText.trim();

    // Check for JSON-encoded QR data
    if (targetCode.startsWith('{') && targetCode.endsWith('}')) {
      try {
        const parsed = JSON.parse(targetCode);
        if (parsed.reelNo) targetCode = String(parsed.reelNo);
        else if (parsed.reel_no) targetCode = String(parsed.reel_no);
        else if (parsed.code) targetCode = String(parsed.code);
        else if (parsed.id) targetCode = String(parsed.id);
      } catch (_) {}
    }

    // Clean URL query parameters if encoded as a link
    if (targetCode.includes('reel=')) {
      targetCode = targetCode.split('reel=')[1].split('&')[0];
    } else if (targetCode.includes('/reel/')) {
      targetCode = targetCode.split('/reel/')[1].split('?')[0];
    }
    targetCode = targetCode.replace(/^#/, '').replace(/[^a-zA-Z0-9_-]/g, '').trim().toUpperCase();

    if (!targetCode) return;

    // 1. DUPLICATE CHECK: In current session scanned queue or already in challan
    if (
      scannedReelNosSetRef.current.has(targetCode) ||
      alreadyLoadedReelNosRef.current.includes(targetCode)
    ) {
      playBeep(330, 0.25); // Warning buzz tone
      showToast(`Error: Reel #${targetCode} is already scanned or in this challan!`);
      return;
    }

    // 2. INVENTORY CHECK: Reel MUST be produced and exist in rewinder inventory
    const allWarehouseReels = getReels();
    const foundReel = allWarehouseReels.find(
      r => r.reelNo.trim().toUpperCase() === targetCode
    );

    if (!foundReel) {
      playBeep(330, 0.28); // Low error buzz
      showToast(`Error: Reel #${targetCode} does not exist in rewinder stock!`);
      return;
    }

    // 3. DISPATCH CHECK: Reel must not already be dispatched
    if (foundReel.status === 'DISPATCHED' || foundReel.challanNo) {
      playBeep(330, 0.28); // Low error buzz
      showToast(`Error: Reel #${targetCode} is already dispatched in Challan #${foundReel.challanNo || 'N/A'}!`);
      return;
    }

    // 4. Add to active queue immediately
    scannedReelNosSetRef.current.add(targetCode);
    setScannedReels(prev => [foundReel, ...prev.filter(r => r.reelNo.trim().toUpperCase() !== targetCode)]);

    // Persist immediately into challan draft & localStorage so work is NEVER lost on exit/crash
    onAddReelsToChallan([foundReel]);

    // 5. Sound + Haptics + Floating Toast (Fast continuous scanning without popup interruption)
    playBeep(1046, 0.15); // Affirmative chime
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 30, 40]);
    }
    showToast(`Scanned #${foundReel.reelNo} (${foundReel.weight || 0} KG)`);
  };

  // Decode from live camera (Ultra-fast responsive cooldown)
  const processDecodedCode = (rawText: string) => {
    if (verifyingReelRef.current) return;
    if (!rawText || !rawText.trim()) return;

    let targetCode = rawText.trim().replace(/^#/, '').replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
    if (!targetCode) return;

    const now = Date.now();
    const lastScan = lastScannedTimeRef.current[targetCode] || 0;
    if (now - lastScan < 700) return;
    lastScannedTimeRef.current[targetCode] = now;

    handleAddCodeToVerification(rawText);
  };

  // Handle manual entry inside camera scanner (if QR code is damaged)
  const handleManualAddInScanner = () => {
    const code = scannerManualInput.trim().toUpperCase();
    if (!code) return;
    handleAddCodeToVerification(code);
    setScannerManualInput('');
  };

  // Camera Lifecycle - Fast mount without artificial delay
  useEffect(() => {
    if (!isOpen) {
      if (html5QrCodeRef.current) {
        safeStopScanner(html5QrCodeRef.current);
        html5QrCodeRef.current = null;
      }
      setIsCameraActive(false);
      setTorchActive(false);
      setVerifyingReel(null);
      setIsEditingSpecs(false);
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

        // Hardware-accelerated native BarcodeDetector API for instant sub-40ms scanning
        localScanner = new Html5Qrcode('live-dispatch-scanner-viewfinder', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
          ],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          verbose: false,
        });
        html5QrCodeRef.current = localScanner;

        await localScanner.start(
          { facingMode: 'environment' },
          {
            fps: 30,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const boxSize = Math.max(200, Math.min(Math.floor(minEdge * 0.85), 320));
              return { width: boxSize, height: boxSize };
            },
            videoConstraints: {
              facingMode: { ideal: 'environment' },
              advanced: [{ focusMode: 'continuous' }] as any,
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
            } as any,
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
              : 'Unable to start camera. Please verify device permissions.'
          );
        }
        await safeStopScanner(localScanner);
      }
    };

    const timer = setTimeout(startCamera, 30);

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
    const normalized = reelNo.trim().toUpperCase();
    setScannedReels(prev => prev.filter(r => r.reelNo.trim().toUpperCase() !== normalized));
    scannedReelNosSetRef.current.delete(normalized);
    if (onRemoveReelFromChallan) {
      onRemoveReelFromChallan(reelNo);
    }
    playBeep(440, 0.08);
  };

  // Save specs updated inside confirmation popup
  const handleSaveEditedSpecs = () => {
    if (!verifyingReel) return;

    const finalizedReel: Reel = {
      ...verifyingReel,
      reelNo: editSpecsForm.reelNo.trim() || verifyingReel.reelNo,
      product: editSpecsForm.product.trim() || verifyingReel.product,
      gsm: Number(editSpecsForm.gsm) || verifyingReel.gsm,
      size: Number(editSpecsForm.size) || verifyingReel.size,
      weight: Number(editSpecsForm.weight) || verifyingReel.weight,
    };

    try {
      saveReel(finalizedReel, 'Operator', verifyingReel.reelNo);
    } catch (_) {}

    setScannedReels(prev =>
      prev.map(r => (r.reelNo === verifyingReel.reelNo ? finalizedReel : r))
    );
    setVerifyingReel(finalizedReel);
    setIsEditingSpecs(false);
    playBeep(1046, 0.15);
    showToast(`Reel #${finalizedReel.reelNo} specs updated!`);
  };

  // Safe Close Modal: Transfer all scanned reels to challan so they are NEVER LOST when backing out!
  const handleSafeClose = () => {
    if (scannedReels.length > 0) {
      onAddReelsToChallan(scannedReels);
    }
    setVerifyingReel(null);
    onClose();
  };

  // Commit scanned reels to Challan & close
  const handleCommit = () => {
    if (scannedReels.length === 0) return;
    playBeep(1200, 0.2);
    onAddReelsToChallan(scannedReels);
    setVerifyingReel(null);
    onClose();
  };

  // Open specs confirmation popup for the scanned batch when finished scanning
  const handleOpenReviewConfirm = () => {
    if (scannedReels.length === 0) return;
    const target = scannedReels[0];
    setReviewIndex(0);
    setEditSpecsForm({
      reelNo: target.reelNo,
      product: target.product,
      gsm: target.gsm || 15,
      size: target.size || 26,
      weight: target.weight || 0,
    });
    setIsEditingSpecs(false);
    setVerifyingReel(target);
  };

  const handleSelectReviewReel = (index: number) => {
    if (index < 0 || index >= scannedReels.length) return;
    const target = scannedReels[index];
    setReviewIndex(index);
    setEditSpecsForm({
      reelNo: target.reelNo,
      product: target.product,
      gsm: target.gsm || 15,
      size: target.size || 26,
      weight: target.weight || 0,
    });
    setIsEditingSpecs(false);
    setVerifyingReel(target);
  };

  if (!isOpen) return null;

  const totalScannedWeight = scannedReels.reduce((sum, r) => sum + (r.weight || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200 h-[100dvh]">
      {/* Scoped CSS to enforce single clean scan box and sweeping laser animation */}
      <style>{`
        #live-dispatch-scanner-viewfinder {
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
          overflow: hidden !important;
          border: none !important;
        }
        #live-dispatch-scanner-viewfinder video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1.5rem !important;
          border: none !important;
        }
        #live-dispatch-scanner-viewfinder #qr-shaded-region,
        #live-dispatch-scanner-viewfinder svg {
          display: none !important;
        }
        #live-dispatch-scanner-viewfinder div[style*="border"] {
          border: none !important;
        }
        @keyframes scanLaserMove {
          0% {
            top: 6%;
            opacity: 0.85;
          }
          50% {
            top: 90%;
            opacity: 1;
          }
          100% {
            top: 6%;
            opacity: 0.85;
          }
        }
        @keyframes scanBeamGlow {
          0% {
            top: 4%;
            height: 18%;
            opacity: 0.25;
          }
          50% {
            top: 70%;
            height: 24%;
            opacity: 0.55;
          }
          100% {
            top: 4%;
            height: 18%;
            opacity: 0.25;
          }
        }
        .scanner-laser-line {
          position: absolute;
          left: 8px;
          right: 8px;
          height: 2.5px;
          background: linear-gradient(90deg, transparent 0%, #C4B5FD 20%, #6C4FE0 50%, #C4B5FD 80%, transparent 100%);
          box-shadow: 0 0 10px 2px rgba(108, 79, 224, 0.8), 0 0 3px 1px #DDD6FE;
          border-radius: 9999px;
          animation: scanLaserMove 2.2s ease-in-out infinite;
          pointer-events: none;
          z-index: 20;
        }
        .scanner-beam-trail {
          position: absolute;
          left: 8px;
          right: 8px;
          background: linear-gradient(180deg, rgba(108, 79, 224, 0.3) 0%, transparent 100%);
          border-radius: 8px;
          animation: scanBeamGlow 2.2s ease-in-out infinite;
          pointer-events: none;
          z-index: 15;
        }
      `}</style>

      <div className="flex-1 flex flex-col w-full max-w-lg mx-auto bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-2xl overflow-hidden sm:my-auto sm:flex-initial sm:h-auto sm:max-h-[88vh] sm:rounded-3xl border border-slate-200 dark:border-slate-800">

        {/* 1. Header Bar */}
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

            {/* Safe Close button (Transfers scanned reels so nothing is lost!) */}
            <button
              type="button"
              onClick={handleSafeClose}
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
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-xl border animate-in fade-in slide-in-from-top-2 duration-150 ${
              toastMsg.toLowerCase().includes('error') || toastMsg.toLowerCase().includes('already')
                ? 'bg-rose-950/95 text-rose-200 border-rose-800 backdrop-blur-md'
                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-700 dark:border-slate-300'
            }`}>
              {toastMsg.toLowerCase().includes('error') && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
              <span>{toastMsg}</span>
            </span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-3 space-y-2.5">

          {/* 2. Camera Viewfinder Card with Single Clean Scanning Box & Dynamic Sweep Animation */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg shrink-0 aspect-[4/3] sm:aspect-[16/10] max-h-[200px] flex items-center justify-center">
            
            {/* Camera Video Mount Point */}
            <div
              id="live-dispatch-scanner-viewfinder"
              className="w-full h-full object-cover"
            />

            {/* Fast Initializing State Indicator */}
            {!isCameraActive && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white z-10 pointer-events-none">
                <div className="w-9 h-9 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-2"></div>
                <span className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                  Starting camera...
                </span>
              </div>
            )}

            {/* Viewfinder Target Reticle Overlay - Single Clean Guide Box */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
              <div className="relative w-52 h-44 border-2 border-[#6C4FE0]/80 rounded-2xl flex items-center justify-center shadow-lg shadow-[#6C4FE0]/25">
                
                {/* Laser scan line & glowing beam animation */}
                <div className="scanner-beam-trail" />
                <div className="scanner-laser-line" />

                {/* 4 Clean Corner Brackets */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-white rounded-tl-lg shadow-xs"></div>
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-white rounded-tr-lg shadow-xs"></div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-white rounded-bl-lg shadow-xs"></div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-white rounded-br-lg shadow-xs"></div>
              </div>
            </div>

            {/* Error or Permission Notice */}
            {cameraError && (
              <div className="absolute inset-x-3 bottom-4 p-2.5 rounded-xl bg-rose-950/90 text-rose-200 border border-rose-800/80 text-xs font-semibold text-center backdrop-blur-sm z-30">
                <AlertCircle className="w-4 h-4 inline mr-1 text-rose-400" />
                {cameraError}
              </div>
            )}
          </div>

          {/* 2b. Manual Entry Inside Camera View (For reels with torn/unreadable QR) */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-mono font-black text-xs">#</span>
              <input
                type="text"
                value={scannerManualInput}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={e => setScannerManualInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleManualAddInScanner();
                  }
                }}
                placeholder="Type Reel No if QR damaged..."
                className="w-full py-2 pl-7 pr-3 text-xs font-mono font-bold rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={handleManualAddInScanner}
              className="px-3.5 py-2 rounded-xl bg-primary hover:bg-[#5B3DC9] text-white font-extrabold text-xs transition cursor-pointer shrink-0"
            >
              + Add
            </button>
          </div>

          {/* 3. Recently Scanned Reels Section */}
          <div className="flex-1 min-h-0 flex flex-col space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200 tracking-tight">
                  Recently Scanned Reels
                </h4>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {scannedReels.length}
                </span>
              </div>

              {scannedReels.length > 0 && (
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs">
                  <Check className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  <span>Added to Challan</span>
                </span>
              )}
            </div>

            {/* Scanned Items List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5 sm:max-h-[300px]">
              {scannedReels.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    Point camera at reel QR codes or type reel number above.
                  </p>
                  <p className="text-[11px] text-primary dark:text-purple-400 mt-1 font-semibold">
                    Each reel will beep and appear here immediately.
                  </p>
                </div>
              ) : (
                scannedReels.map((reel, idx) => (
                  <div
                    key={reel.reelNo}
                    onClick={() => {
                      const foundIdx = scannedReels.findIndex(r => r.reelNo === reel.reelNo);
                      setReviewIndex(foundIdx >= 0 ? foundIdx : 0);
                      setEditSpecsForm({
                        reelNo: reel.reelNo,
                        product: reel.product,
                        gsm: reel.gsm || 15,
                        size: reel.size || 26,
                        weight: reel.weight || 0,
                      });
                      setIsEditingSpecs(false);
                      setVerifyingReel(reel);
                    }}
                    className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2.5 shadow-2xs hover:border-primary/50 transition cursor-pointer group"
                    title="Tap to review/edit specs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="min-w-[24px] px-1 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-primary dark:group-hover:text-purple-300 transition-colors">
                          #{reel.reelNo}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                          {reel.product} • {reel.gsm}GSM • {reel.size}mm
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-black font-mono bg-purple-50 text-primary dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/70">
                        {reel.weight || 0} KG
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveReel(reel.reelNo);
                        }}
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

        {/* 4. Bottom Sticky Action Area */}
        <div className="p-3 sm:p-3.5 pb-2.5 sm:pb-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-2">
          <div className="flex items-center justify-between px-1 text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Scanned Total</span>
            <span className="font-mono font-black text-primary dark:text-purple-300">
              {scannedReels.length} Reels • {totalScannedWeight.toLocaleString()} KG
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenReviewConfirm}
            disabled={scannedReels.length === 0}
            className={`w-full py-2.5 sm:py-3 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
              scannedReels.length > 0
                ? 'bg-primary hover:bg-[#5B3DC9] text-white shadow-md shadow-primary/25 active:scale-[0.98]'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Confirm &amp; Review {scannedReels.length} Reel{scannedReels.length === 1 ? '' : 's'} ({totalScannedWeight.toLocaleString()} KG)
            </span>
          </button>
        </div>

      </div>

      {/* 5. VERIFICATION CONFIRMATION POPUP MODAL (Appears on scan / manual entry matching image media_1793788911457_9b77aaaa.png) */}
      {verifyingReel && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-white">
            
            {/* Header: Verified In Stock */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-primary border border-purple-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-tight">
                    REEL VERIFIED IN STOCK
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {scannedReels.length > 1
                      ? `Reel ${reviewIndex + 1} of ${scannedReels.length} (${totalScannedWeight.toLocaleString()} KG Total)`
                      : `Reel #${verifyingReel.reelNo} • Ready for Challan`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {scannedReels.length > 1 && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={reviewIndex === 0}
                      onClick={() => handleSelectReviewReel(reviewIndex - 1)}
                      className={`p-1 rounded-lg ${reviewIndex === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer'}`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      {reviewIndex + 1}/{scannedReels.length}
                    </span>
                    <button
                      type="button"
                      disabled={reviewIndex === scannedReels.length - 1}
                      onClick={() => handleSelectReviewReel(reviewIndex + 1)}
                      className={`p-1 rounded-lg ${reviewIndex === scannedReels.length - 1 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer'}`}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setVerifyingReel(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Identifier & Net Weight Card */}
            <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
                  REEL / BARCODE IDENTIFIER
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-primary dark:text-sky-400">
                  {editSpecsForm.reelNo || verifyingReel.reelNo}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
                  NET WEIGHT
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                  {editSpecsForm.weight || verifyingReel.weight || 0} KG
                </span>
              </div>
            </div>

            {/* Specs Grid or Inline Edit Form */}
            {isEditingSpecs ? (
              <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-950/90 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-black text-primary dark:text-sky-400 uppercase text-[10px] tracking-wider">
                    Edit Reel Specs
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingSpecs(false)}
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Product Quality
                    </label>
                    <input
                      type="text"
                      value={editSpecsForm.product}
                      onChange={e => setEditSpecsForm({ ...editSpecsForm, product: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Net Weight (KG)
                    </label>
                    <input
                      type="number"
                      value={editSpecsForm.weight}
                      onChange={e => setEditSpecsForm({ ...editSpecsForm, weight: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      GSM &amp; Decal (mm)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        placeholder="GSM"
                        value={editSpecsForm.gsm}
                        onChange={e => setEditSpecsForm({ ...editSpecsForm, gsm: parseFloat(e.target.value) || 0 })}
                        className="w-1/2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-primary"
                      />
                      <input
                        type="number"
                        placeholder="Decal"
                        value={editSpecsForm.size}
                        onChange={e => setEditSpecsForm({ ...editSpecsForm, size: parseFloat(e.target.value) || 0 })}
                        className="w-1/2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveEditedSpecs}
                  className="w-full py-2 bg-primary hover:bg-[#5B3DC9] text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Specs Update</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* 1. Product Quality */}
                <div className="p-3 bg-slate-50/80 dark:bg-slate-950/70 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">
                    PRODUCT QUALITY
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block truncate">
                    {editSpecsForm.product || verifyingReel.product}
                  </span>
                </div>

                {/* 2. GSM & Decal */}
                <div className="p-3 bg-slate-50/80 dark:bg-slate-950/70 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">
                    GSM &amp; DECAL
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block truncate">
                    {editSpecsForm.gsm || verifyingReel.gsm} GSM • {editSpecsForm.size || verifyingReel.size} mm
                  </span>
                </div>

                {/* 3. Production Date */}
                <div className="p-3 bg-slate-50/80 dark:bg-slate-950/70 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">
                    PRODUCTION DATE
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block truncate">
                    {verifyingReel.productionDate
                      ? verifyingReel.productionDate.substring(0, 16).replace('T', ' ')
                      : 'Today'}
                  </span>
                </div>

                {/* 4. QC Clearance */}
                <div className="p-3 bg-slate-50/80 dark:bg-slate-950/70 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">
                    QC CLEARANCE
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block truncate">
                    Grade {verifyingReel.qcGrade || 'A'} Passed
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons matching User's Picture */}
            <div className="space-y-2 pt-1">
              
              {/* Primary Green Action: Confirm & Add to Challan */}
              <button
                type="button"
                onClick={handleCommit}
                className="w-full bg-primary hover:bg-[#5B3DC9] text-white font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-primary/25 transition cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Truck className="h-4 w-4" />
                <span>CONFIRM &amp; ADD TO CHALLAN</span>
              </button>

              {/* Edit Specs Button */}
              {!isEditingSpecs && (
                <button
                  type="button"
                  onClick={() => setIsEditingSpecs(true)}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>EDIT SPECS</span>
                </button>
              )}

              {/* Bottom Purple Button: Scan More Reels */}
              <button
                type="button"
                onClick={() => setVerifyingReel(null)}
                className="w-full py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-primary border border-purple-200/80 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 dark:text-purple-300 dark:border-purple-800/60"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>SCAN MORE REELS</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
