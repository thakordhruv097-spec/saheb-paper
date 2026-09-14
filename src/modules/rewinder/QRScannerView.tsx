import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getReels,
  getRolls,
  getPackingSlips,
  getLabReports,
  getRawMaterialLots,
  getBoilerLogs,
  getParties,
  getVehicles,
  savePackingSlip,
  saveReel,
} from '../../data/index';
import type {
  Reel,
  MachineRoll,
  PackingSlip,
  PaperTestReport,
  RawMaterialLot,
  BoilerLog,
  PartyItem,
  VehicleItem,
} from '../../data/types';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  X,
  Search,
  Pencil,
  Truck,
  Check,
  CheckCircle2,
  Zap,
  Volume2,
  VolumeX,
  Tag,
  AlertCircle,
  AlertTriangle,
  Warehouse,
  Layers,
  FlaskConical,
  Scissors,
  Flame,
} from 'lucide-react';

interface QRScannerViewProps {
  onOpenPrintStudio?: (reel?: Reel, code?: string) => void;
}

export const QRScannerViewInner: React.FC<QRScannerViewProps> = ({ onOpenPrintStudio }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [scanResult, setScanResult] = useState<{
    code: string;
    type: 'REEL' | 'LOT' | 'ROLL' | 'DISPATCH' | 'LAB' | 'BOILER';
    reel?: Reel;
    lot?: RawMaterialLot;
    roll?: MachineRoll;
    slip?: PackingSlip;
    lab?: PaperTestReport;
    boiler?: BoilerLog;
  } | null>(null);

  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [torchActive, setTorchActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Active Html5Qrcode instance reference
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Screen Viewport Check - Camera scanning is enabled exclusively for mobile & tablet screens
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Manual Reel Entry Input State
  const [manualCodeInput, setManualCodeInput] = useState('');
  const reelsList = getReels();

  // Inline Edit Reel Spec State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    reelNo: '',
    product: '',
    gsm: 18,
    size: 30,
    weight: 1500,
  });

  // Direct Quick Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [parties] = useState<PartyItem[]>(() => getParties());
  const [vehicles] = useState<VehicleItem[]>(() => getVehicles());
  const [dispatchParty, setDispatchParty] = useState(parties[0]?.id || '');
  const [dispatchVehicle, setDispatchVehicle] = useState(vehicles[0]?.vehicleNo || '');
  const [dispatchError, setDispatchError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Tactical Web Audio Beep Generator
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio Context error', e);
    }
  };

  // Real-time synchronization listener
  const [, setSyncVersion] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setSyncVersion(v => v + 1);
    window.addEventListener('saheb_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('saheb_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const processScannedCode = (code: string) => {
    let targetCode = code.trim().toUpperCase();
    setScanError('');
    playBeep();

    // Check if QR code is old Full JSON format
    if (code.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(code);
        if (parsed.reelNo) {
          targetCode = String(parsed.reelNo).trim().toUpperCase();
        } else if (parsed.lotNo) {
          targetCode = String(parsed.lotNo).trim().toUpperCase();
        } else if (parsed.rollNo) {
          targetCode = String(parsed.rollNo).trim().toUpperCase();
        } else if (parsed.slipNo) {
          targetCode = String(parsed.slipNo).trim().toUpperCase();
        }
      } catch (e) {
        console.warn('Scanned text is not valid JSON, using raw value');
      }
    }

    // 1. Raw Material Inward Batch (LOT-... or RM-...)
    if (targetCode.startsWith('LOT-') || targetCode.startsWith('RM-')) {
      const lotsList = getRawMaterialLots();
      const foundLot = lotsList.find(l => l.lotNo.trim().toUpperCase() === targetCode);
      if (foundLot) {
        setScanResult({ code: targetCode, type: 'LOT', lot: foundLot });
      } else {
        setScanResult({ code: targetCode, type: 'LOT' });
      }
    }
    // 2. Machine Jumbo Roll (R-... or ROLL-...)
    else if (targetCode.startsWith('R-') || targetCode.startsWith('ROLL-')) {
      const rollsList = getRolls();
      const foundRoll = rollsList.find(r => r.rollNo.trim().toUpperCase() === targetCode);
      if (foundRoll) {
        setScanResult({ code: targetCode, type: 'ROLL', roll: foundRoll });
      } else {
        const reelsList = getReels();
        const foundReel = reelsList.find(r => r.reelNo.trim().toUpperCase() === targetCode);
        if (foundReel) {
          setScanResult({ code: targetCode, type: 'REEL', reel: foundReel });
          setEditForm({
            reelNo: foundReel.reelNo,
            product: foundReel.product,
            gsm: foundReel.gsm,
            size: foundReel.size,
            weight: foundReel.weight,
          });
        } else {
          setScanResult({ code: targetCode, type: 'ROLL' });
        }
      }
    }
    // 3. Dispatch Receipt / Packing Slip (CHALLAN-... or SLIP-... or PS-...)
    else if (targetCode.startsWith('CHALLAN-') || targetCode.startsWith('SLIP-') || targetCode.startsWith('PS-')) {
      const slipsList = getPackingSlips();
      const foundSlip = slipsList.find(s => s.slipNo.trim().toUpperCase() === targetCode || s.id.toUpperCase() === targetCode);
      if (foundSlip) {
        setScanResult({ code: targetCode, type: 'DISPATCH', slip: foundSlip });
      } else {
        setScanResult({ code: targetCode, type: 'DISPATCH' });
      }
    }
    // 4. Lab Quality Control Report (PTR-...)
    else if (targetCode.startsWith('PTR-')) {
      const labList = getLabReports();
      const foundReport = labList.find(r => r.id.trim().toUpperCase() === targetCode);
      if (foundReport) {
        setScanResult({ code: targetCode, type: 'LAB', lab: foundReport });
      } else {
        setScanResult({ code: targetCode, type: 'LAB' });
      }
    }
    // 5. Boiler Operations Log (BLR-...)
    else if (targetCode.startsWith('BLR-')) {
      const boilerLogs = getBoilerLogs();
      const foundLog = boilerLogs.find(b => b.id.trim().toUpperCase() === targetCode);
      if (foundLog) {
        setScanResult({ code: targetCode, type: 'BOILER', boiler: foundLog });
      } else {
        setScanResult({ code: targetCode, type: 'BOILER' });
      }
    }
    // 6. Finished Reels / Numeric Barcodes / General Code Search
    else {
      const freshReels = getReels();
      const foundReel = freshReels.find(r => r.reelNo.trim().toUpperCase() === targetCode);
      if (foundReel) {
        setScanResult({ code: targetCode, type: 'REEL', reel: foundReel });
        setEditForm({
          reelNo: foundReel.reelNo,
          product: foundReel.product,
          gsm: foundReel.gsm,
          size: foundReel.size,
          weight: foundReel.weight,
        });
      } else {
        // Cross-entity fallback lookup
        const foundLot = getRawMaterialLots().find(l => l.lotNo.trim().toUpperCase() === targetCode);
        if (foundLot) {
          setScanResult({ code: targetCode, type: 'LOT', lot: foundLot });
        } else {
          const foundRoll = getRolls().find(r => r.rollNo.trim().toUpperCase() === targetCode);
          if (foundRoll) {
            setScanResult({ code: targetCode, type: 'ROLL', roll: foundRoll });
          } else {
            const foundSlip = getPackingSlips().find(s => s.slipNo.trim().toUpperCase() === targetCode);
            if (foundSlip) {
              setScanResult({ code: targetCode, type: 'DISPATCH', slip: foundSlip });
            } else {
              setScanResult({ code: targetCode, type: 'REEL' });
            }
          }
        }
      }
    }
  };

  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [, setCamerasList] = useState<Array<{ id: string; label: string }>>([]);
  const [, setSelectedCameraId] = useState<string>('');

  // Synchronously stop camera media tracks so camera light turns off immediately
  const stopMediaTracks = () => {
    try {
      const videoEl = document.querySelector('#pure-camera-viewfinder video') as HTMLVideoElement | null;
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (_) {}
        });
        videoEl.srcObject = null;
      }
    } catch (_) {}
  };

  // Helper to retrieve the active video MediaStreamTrack
  const getActiveVideoTrack = (): MediaStreamTrack | null => {
    try {
      const videoEl = document.querySelector('#pure-camera-viewfinder video') as HTMLVideoElement | null;
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        const tracks = stream.getVideoTracks();
        if (tracks && tracks.length > 0) return tracks[0];
      }
    } catch (_) {}
    return null;
  };

  // Safe scanner teardown that handles synchronous throws and race conditions
  const safeStopScanner = async (scanner: Html5Qrcode | null) => {
    stopMediaTracks();
    if (!scanner) return;
    try {
      // Html5QrcodeScannerState: 2 is SCANNING, 3 is PAUSED
      const state = scanner.getState();
      if (state === 2 || state === 3) {
        await scanner.stop();
      }
    } catch (_) {
      // Ignore synchronous state error ("Cannot stop, scanner is not running or paused")
    }

    try {
      scanner.clear();
    } catch (_) {}
  };

  // Setup live camera scanner with bulletproof lifecycle management
  useEffect(() => {
    let isMounted = true;
    let localScanner: Html5Qrcode | null = null;

    const startScanner = async () => {
      if (!isMounted) return;
      // Scanner is only for mobile screens - do not initialize webcam on PC / Desktop
      if (!isMobileScreen) return;
      if (!isScanning || Boolean(scanResult)) return;

      const container = document.getElementById('pure-camera-viewfinder');
      if (!container) return;

      try {
        setCameraError('');
        if (html5QrCodeRef.current) {
          await safeStopScanner(html5QrCodeRef.current);
          html5QrCodeRef.current = null;
        }

        if (!isMounted) return;

        localScanner = new Html5Qrcode('pure-camera-viewfinder');
        html5QrCodeRef.current = localScanner;

        // Auto-detect and prioritize Back / Rear Camera
        let cameraConfig: any = { facingMode: cameraFacingMode };
        try {
          const devices = await Html5Qrcode.getCameras();
          if (!isMounted) {
            await safeStopScanner(localScanner);
            return;
          }
          if (devices && devices.length > 0) {
            setCamerasList(devices);
            if (cameraFacingMode === 'environment') {
              const backCam = devices.find(d =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('environment') ||
                d.label.toLowerCase().includes('0')
              );
              if (backCam) {
                cameraConfig = backCam.id;
                setSelectedCameraId(backCam.id);
              } else if (devices.length > 1) {
                cameraConfig = devices[devices.length - 1].id;
                setSelectedCameraId(devices[devices.length - 1].id);
              } else {
                cameraConfig = devices[0].id;
                setSelectedCameraId(devices[0].id);
              }
            } else {
              const frontCam = devices.find(d =>
                d.label.toLowerCase().includes('front') ||
                d.label.toLowerCase().includes('user') ||
                d.label.toLowerCase().includes('1')
              );
              cameraConfig = frontCam ? frontCam.id : devices[0].id;
              setSelectedCameraId(cameraConfig);
            }
          }
        } catch (camErr) {
          cameraConfig = { facingMode: cameraFacingMode };
        }

        if (!isMounted) {
          await safeStopScanner(localScanner);
          return;
        }

        await localScanner.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isMounted) return;
            processScannedCode(decodedText);
            setIsScanning(false);
            setIsCameraActive(false);
            safeStopScanner(localScanner);
          },
          () => {
            // Scanning frame tick...
          }
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
              ? 'Camera permission required. Please allow camera access in browser settings.'
              : 'Could not start back camera. Tap Start Camera to retry.'
          );
        }
        await safeStopScanner(localScanner);
      }
    };

    const timer = setTimeout(startScanner, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopMediaTracks();
      const current = html5QrCodeRef.current || localScanner;
      html5QrCodeRef.current = null;
      if (current) {
        safeStopScanner(current);
      }
    };
  }, [isScanning, Boolean(scanResult), cameraFacingMode, isMobileScreen]);

  const handleToggleTorch = async () => {
    const nextTorch = !torchActive;
    let applied = false;

    // 1. Try directly via MediaStreamTrack on active video element
    try {
      const track = getActiveVideoTrack();
      if (track) {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        if ('torch' in capabilities || capabilities.torch !== undefined) {
          await track.applyConstraints({
            advanced: [{ torch: nextTorch } as any],
          });
          applied = true;
        } else {
          // Attempt constraint directly for browsers that support it without exposing capabilities
          try {
            await track.applyConstraints({
              advanced: [{ torch: nextTorch } as any],
            });
            applied = true;
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('Track torch constraint error', e);
    }

    // 2. Fallback via Html5Qrcode instance
    if (!applied && html5QrCodeRef.current) {
      try {
        await (html5QrCodeRef.current as any).applyVideoConstraints({
          advanced: [{ torch: nextTorch }],
        });
        applied = true;
      } catch (e) {
        console.warn('Html5Qrcode torch constraint error', e);
      }
    }

    if (applied) {
      setTorchActive(nextTorch);
      setToastMsg(nextTorch ? 'Torch / Flashlight Turned ON' : 'Torch / Flashlight Turned OFF');
    } else {
      if (cameraFacingMode === 'user') {
        setToastMsg('Torch is only available on Rear (Back) Camera');
      } else {
        setTorchActive(nextTorch);
        setToastMsg(nextTorch ? 'Torch ON' : 'Torch OFF');
      }
    }
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleToggleCameraFacing = () => {
    if (torchActive) {
      try {
        const track = getActiveVideoTrack();
        if (track) {
          track.applyConstraints({ advanced: [{ torch: false } as any] }).catch(() => {});
        }
      } catch (_) {}
      setTorchActive(false);
    }
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    setToastMsg(nextFacing === 'environment' ? 'Switched to Rear (Back) Camera' : 'Switched to Front Camera');
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleResetScanner = () => {
    if (torchActive) {
      try {
        const track = getActiveVideoTrack();
        if (track) {
          track.applyConstraints({ advanced: [{ torch: false } as any] }).catch(() => {});
        }
      } catch (_) {}
    }
    setTorchActive(false);
    safeStopScanner(html5QrCodeRef.current);
    setScanResult(null);
    setScanError('');
    setIsScanning(true);
    setIsEditing(false);
    setManualCodeInput('');
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) {
      setScanError('Please enter a valid Reel No or Barcode.');
      return;
    }
    processScannedCode(manualCodeInput);
    setIsScanning(false);
  };

  const handleSaveEditReel = () => {
    if (!scanResult?.reel) return;
    const currentReels = getReels();
    const index = currentReels.findIndex(r => r.reelNo === scanResult.reel?.reelNo);
    if (index > -1) {
      const updatedReel: Reel = {
        ...currentReels[index],
        reelNo: editForm.reelNo.trim(),
        product: editForm.product.trim(),
        gsm: Number(editForm.gsm),
        size: Number(editForm.size),
        weight: Number(editForm.weight),
      };
      saveReel(updatedReel, 'Operator');
      setScanResult({ code: updatedReel.reelNo, type: 'REEL', reel: updatedReel });
      setIsEditing(false);
      setToastMsg(`Reel #${updatedReel.reelNo} details updated successfully!`);
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  const handleQuickDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult?.reel) return;
    if (!dispatchParty || !dispatchVehicle) {
      setDispatchError('Please select both Customer Party and Dispatch Vehicle.');
      return;
    }

    const partyObj = parties.find(p => p.id === dispatchParty);
    try {
      savePackingSlip(
        {
          id: `ps-${Date.now()}`,
          slipNo: `PS-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString().substring(0, 10),
          partyId: dispatchParty,
          vehicleId: dispatchVehicle,
          reelNos: [scanResult.reel.reelNo],
          driverSignature: '',
          receiverSignature: '',
          status: 'DISPATCHED',
        },
        'Operator'
      );

      playBeep();
      setShowDispatchModal(false);
      setToastMsg(`Reel ${scanResult.reel.reelNo} dispatched to ${partyObj?.name || 'Customer'}! Stock decremented.`);
      setTimeout(() => setToastMsg(''), 4000);
      handleResetScanner();
    } catch (err: any) {
      setDispatchError(err.message || 'Failed to dispatch reel.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center font-sans p-2 sm:p-4 relative select-none text-left">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2 text-[11px] sm:text-xs font-bold animate-in fade-in slide-in-from-top-2 pointer-events-none max-w-[90vw] whitespace-nowrap">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. DUAL MODE: CAMERA SCANNER & MANUAL TYPE SEARCH */}
      {/* Container is kept mounted in the DOM to avoid destroying Html5Qrcode video/canvas mid-teardown */}
      <div className={`w-full ${scanResult ? 'hidden' : 'block'}`}>
        <div className="w-full neumorphic-card rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
                <Camera className="h-4 sm:h-5 w-4 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider block truncate">
                  Multi-Module QR &amp; Barcode Scanner
                </span>
                <span className="text-[10px] text-slate-500 font-semibold truncate block">Reels &bull; Jumbo Rolls &bull; Dispatch</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              Scanner Ready
            </span>
          </div>

          {/* Mobile Camera Viewfinder OR Desktop Notice */}
          {!isMobileScreen ? (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] dark:bg-purple-950/60 text-[#6C4FE0] dark:text-purple-300 mx-auto flex items-center justify-center shadow-xs">
                <Camera className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Mobile QR Scanner Mode
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Live camera scanning is designed for mobile devices on the mill floor. On PC / Desktop, please use the <strong>Manual Entry / Barcode Gun</strong> search or stock picker below.
                </p>
              </div>
            </div>
          ) : (
            /* Camera Viewfinder with Modern Laser Frame Overlay */
            <div className="relative overflow-hidden rounded-2xl bg-[#090D16] shadow-2xl border border-slate-800 min-h-[260px] sm:min-h-[300px] flex items-center justify-center">
              
              {/* HTML5 QR Code Mount - Permanently mounted */}
              <div id="pure-camera-viewfinder" className="w-full h-full min-h-[260px] z-10 flex items-center justify-center [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:rounded-2xl" />

              {/* Error or Permission Retry Banner */}
              {cameraError && !isCameraActive && (
                <div className="absolute inset-0 z-25 flex flex-col items-center justify-center p-4 bg-slate-950/85 text-center space-y-3">
                  <Camera className="h-10 w-10 text-[#7C3AED] animate-bounce" />
                  <p className="text-xs font-semibold text-slate-300 max-w-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraError('');
                      setIsScanning(false);
                      setTimeout(() => setIsScanning(true), 150);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-[#6C4FE0] to-[#7C3AED] text-white text-xs font-bold rounded-xl shadow-lg hover:opacity-95 transition cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Start Camera / Allow Access</span>
                  </button>
                </div>
              )}

              {/* Target Laser Box Overlay */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl">
                    {/* 4 Corner Markers */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br-xl" />

                    {/* Animated Laser Sweep Line */}
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_12px_#38BDF8] animate-pulse" style={{ top: '50%' }} />
                  </div>
                </div>
              )}

              {/* Viewfinder Bottom Controls Bar - Equal Size & Invariant Shape */}
              <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center gap-1.5 sm:gap-2 z-30 pointer-events-auto">
                <button
                  type="button"
                  onClick={handleToggleCameraFacing}
                  className="flex-1 min-w-0 h-9 sm:h-10 px-1 sm:px-2 rounded-full text-[10px] sm:text-xs font-bold backdrop-blur-md border border-white/30 flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer bg-white/20 text-white hover:bg-white/30 shadow-md active:scale-95"
                  title="Switch between Rear (Back) and Front Camera"
                >
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate whitespace-nowrap">{cameraFacingMode === 'environment' ? 'Back Cam' : 'Front Cam'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`flex-1 min-w-0 h-9 sm:h-10 px-1 sm:px-2 rounded-full text-[10px] sm:text-xs font-bold backdrop-blur-md border flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer active:scale-95 shadow-md ${
                    torchActive
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-amber-500/20'
                      : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                  }`}
                  title="Turn Camera Torch / Flashlight ON or OFF"
                >
                  <Zap className={`h-3.5 w-3.5 shrink-0 ${torchActive ? 'fill-current' : ''}`} />
                  <span className="truncate whitespace-nowrap">Torch {torchActive ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    if (!soundEnabled) playBeep();
                  }}
                  className={`flex-1 min-w-0 h-9 sm:h-10 px-1 sm:px-2 rounded-full text-[10px] sm:text-xs font-bold backdrop-blur-md border flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer active:scale-95 shadow-md ${
                    soundEnabled
                      ? 'bg-sky-400 text-slate-950 border-sky-300 font-extrabold shadow-sky-500/20'
                      : 'bg-white/20 text-white/80 border-white/30 hover:bg-white/30'
                  }`}
                  title="Toggle Audio Beep on scan"
                >
                  {soundEnabled ? (
                    <Volume2 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate whitespace-nowrap">Beep {soundEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          )}

          {/* MANUAL TYPE / BARCODE GUN SEARCH SECTION */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase text-[11px] tracking-wider">
                Manual Entry / Barcode Gun
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Fast Search</span>
            </div>

            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualCodeInput}
                onChange={e => setManualCodeInput(e.target.value)}
                placeholder="Type or scan barcode (e.g. LOT-..., 2605..., R-..., CHALLAN-...)..."
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase placeholder:normal-case font-mono"
              />
              <button
                type="submit"
                className="btn-primary-gradient px-5 py-3 text-xs uppercase tracking-wider shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </button>
            </form>

            {/* Quick Stock Selector */}
            {reelsList.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Stock Quick Pick:</div>
                <select
                  onChange={e => {
                    if (e.target.value) {
                      processScannedCode(e.target.value);
                      setIsScanning(false);
                    }
                  }}
                  defaultValue=""
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Or Select Reel directly from Stock --</option>
                  {reelsList.slice(-20).reverse().map(r => (
                    <option key={r.reelNo} value={r.reelNo}>
                      {r.reelNo} &bull; {r.product} &bull; {r.weight}kg ({r.status})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {scanError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-2xl border border-red-200 font-bold">
              {scanError}
            </div>
          )}

        </div>
      </div>

      {/* 2. SCAN RESULT CARD WITH MULTI-MODULE DETAILS, INLINE EDIT, & DIRECT ACTIONS */}
      {scanResult && (() => {
        const isFound = Boolean(scanResult.reel || scanResult.lot || scanResult.roll || scanResult.slip || scanResult.lab || scanResult.boiler);

        const getModuleTitle = () => {
          if (scanResult.reel) return 'Reel Verified in Stock';
          if (scanResult.lot) return 'Raw Material Lot Verified';
          if (scanResult.roll) return 'Machine Jumbo Roll Verified';
          if (scanResult.slip) return 'Dispatch Challan Verified';
          if (scanResult.lab) return 'Lab QC Report Verified';
          if (scanResult.boiler) return 'Boiler Shift Log Verified';
          return 'QR Code Scanned';
        };

        const getModuleSubtitle = () => {
          if (scanResult.reel) return 'Ready for Loading Sheet & Dispatch';
          if (scanResult.lot) return 'Active Inward Batch in Warehouse';
          if (scanResult.roll) return 'Paper Machine Production Output';
          if (scanResult.slip) return `Challan Status: ${scanResult.slip.status}`;
          if (scanResult.lab) return `QC Result: Grade ${scanResult.lab.qcStatus}`;
          if (scanResult.boiler) return 'Utilities Operational Shift';
          return 'Not Registered in Active Stock';
        };

        const getModuleTypeLabel = () => {
          switch (scanResult.type) {
            case 'LOT': return 'RAW MATERIAL BATCH';
            case 'ROLL': return 'MACHINE JUMBO ROLL';
            case 'DISPATCH': return 'DISPATCH CHALLAN';
            case 'LAB': return 'LAB QUALITY REPORT';
            case 'BOILER': return 'BOILER OPERATION LOG';
            default: return 'REEL / BARCODE IDENTIFIER';
          }
        };

        return (
          <div className="w-full bg-white dark:bg-surface-dark border-2 border-blue-500 dark:border-blue-500 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            
            {/* Header / Status Banner */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  isFound
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                }`}>
                  {isFound ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider block">
                    {getModuleTitle()}
                  </span>
                  <span className={`text-[10px] font-bold ${
                    isFound ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {getModuleSubtitle()}
                  </span>
                </div>
              </div>
              <button onClick={handleResetScanner} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Identifier & Key Metric Badge */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  {getModuleTypeLabel()}
                </span>
                <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">{scanResult.code}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  {scanResult.reel ? 'NET WEIGHT' :
                   scanResult.lot ? 'BATCH WEIGHT' :
                   scanResult.roll ? 'JUMBO WEIGHT' :
                   scanResult.slip ? 'TOTAL REELS' :
                   scanResult.lab ? 'TESTED GSM' :
                   scanResult.boiler ? 'WOOD USED' : 'STOCK STATUS'}
                </span>
                {scanResult.reel ? (
                  <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {scanResult.reel.weight.toLocaleString()} KG
                  </span>
                ) : scanResult.lot ? (
                  <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {Number(scanResult.lot.weight).toLocaleString()} KG
                  </span>
                ) : scanResult.roll ? (
                  <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {scanResult.roll.weight.toLocaleString()} KG
                  </span>
                ) : scanResult.slip ? (
                  <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {scanResult.slip.reelNos?.length || 0} REELS
                  </span>
                ) : scanResult.lab ? (
                  <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {scanResult.lab.labResultGsm} g/m²
                  </span>
                ) : scanResult.boiler ? (
                  <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {scanResult.boiler.woodUsed.toLocaleString()} KG
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-black uppercase inline-block">
                    Not in Stock
                  </span>
                )}
              </div>
            </div>

            {/* MODULE-SPECIFIC CONTENT PANELS */}
            {/* 1. REEL PANEL */}
            {scanResult.reel && (
              isEditing ? (
                <div className="space-y-3 p-4 bg-blue-50/50 dark:bg-slate-900/80 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-blue-100 dark:border-slate-800">
                    <span className="font-black text-blue-600 dark:text-blue-400 uppercase text-[10px]">Edit Reel Specs Manually</span>
                    <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reel No</label>
                      <input
                        type="text"
                        value={editForm.reelNo}
                        onChange={e => setEditForm({ ...editForm, reelNo: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Product</label>
                      <input
                        type="text"
                        value={editForm.product}
                        onChange={e => setEditForm({ ...editForm, product: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={editForm.weight}
                        onChange={e => setEditForm({ ...editForm, weight: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">GSM &amp; Size</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={editForm.gsm}
                          onChange={e => setEditForm({ ...editForm, gsm: parseFloat(e.target.value) || 0 })}
                          className="w-1/2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                          placeholder="GSM"
                        />
                        <input
                          type="number"
                          value={editForm.size}
                          onChange={e => setEditForm({ ...editForm, size: parseFloat(e.target.value) || 0 })}
                          className="w-1/2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                          placeholder="Size"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveEditReel}
                    className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>Save Updated Specs</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Product Quality</span>
                    <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.reel.product}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">GSM &amp; Deckle</span>
                    <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.reel.gsm} GSM &bull; {scanResult.reel.size} cm</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Production Date</span>
                    <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.reel.productionDate || 'Today'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">QC Clearance</span>
                    <span className={`font-black mt-0.5 block ${scanResult.reel.status === 'DISPATCHED' ? 'text-purple-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {scanResult.reel.status === 'DISPATCHED' ? 'ALREADY DISPATCHED' : `Grade ${scanResult.reel.qcGrade} Passed`}
                    </span>
                  </div>
                </div>
              )
            )}

            {/* 2. RAW MATERIAL LOT PANEL */}
            {scanResult.lot && (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Raw Material</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.lot.materialName}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Vendor / Supplier</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.lot.vendorName}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Inward Date</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.lot.date}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Logged By</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{scanResult.lot.operator || 'Store In-Charge'}</span>
                </div>
              </div>
            )}

            {/* 3. MACHINE JUMBO ROLL PANEL */}
            {scanResult.roll && (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Product Quality</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.roll.product}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">GSM &amp; Width</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.roll.gsm} GSM &bull; {scanResult.roll.width} cm</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Shift &amp; Working Time</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">Shift {scanResult.roll.shift} &bull; {scanResult.roll.startTime} - {scanResult.roll.offTime}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Production Date</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.roll.date}</span>
                </div>
              </div>
            )}

            {/* 4. DISPATCH RECEIPT PANEL */}
            {scanResult.slip && (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Vehicle No</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.slip.vehicleId}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Customer Party</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                    {parties.find(p => p.id === scanResult.slip?.partyId)?.name || scanResult.slip.partyId}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Challan Date</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.slip.date}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Challan Status</span>
                  <span className={`font-black mt-0.5 block ${scanResult.slip.status === 'DISPATCHED' ? 'text-purple-600 dark:text-purple-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {scanResult.slip.status}
                  </span>
                </div>
              </div>
            )}

            {/* 5. LAB QUALITY REPORT PANEL */}
            {scanResult.lab && (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Roll Tested</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">#{scanResult.lab.rollNo} ({scanResult.lab.product})</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Target vs Actual GSM</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.lab.targetGsm} / {scanResult.lab.labResultGsm} g/m²</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Moisture %</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.lab.moisturePct}%</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">QC Clearance</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">Grade {scanResult.lab.qcStatus} Passed</span>
                </div>
              </div>
            )}

            {/* 6. BOILER OPERATIONS PANEL */}
            {scanResult.boiler && (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Wood Consumption</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.boiler.woodUsed.toLocaleString()} kg</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Water Input</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.boiler.waterUsed.toLocaleString()} L</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Steam Pressure</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.boiler.pressure} psi</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Shift Date</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.boiler.date} ({scanResult.boiler.shift})</span>
                </div>
              </div>
            )}

            {/* 7. NOT REGISTERED IN ACTIVE DATABASE */}
            {!isFound && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-2xl text-xs space-y-1.5 border border-amber-200 dark:border-amber-900/40">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Code &quot;{scanResult.code}&quot; successfully scanned!</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  No active reel, raw material inward lot, jumbo roll, or dispatch receipt currently matches this code in the database.
                </p>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="space-y-2 pt-2">
              {/* Reel Direct Quick Dispatch */}
              {scanResult.reel && scanResult.reel.status !== 'DISPATCHED' && (
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(true)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Truck className="h-4 w-4" />
                  <span>Quick Dispatch This Reel Now (Auto-Minus)</span>
                </button>
              )}

              {/* Reel Print QR Label */}
              {onOpenPrintStudio && scanResult.reel && (
                <button
                  type="button"
                  onClick={() => onOpenPrintStudio(scanResult.reel, scanResult.code)}
                  className="btn-primary-gradient w-full py-3 px-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Tag className="h-4 w-4" />
                  <span>Print Reel Barcode / QR Label</span>
                </button>
              )}

              {/* Raw Material Lot Actions */}
              {scanResult.lot && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => navigate('/raw-material-stock')}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Warehouse className="h-4 w-4" />
                    <span>View in Raw Material Stock</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/pulp-mill-operations')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Layers className="h-4 w-4" />
                    <span>Use in Pulp Mill Batch</span>
                  </button>
                </div>
              )}

              {/* Machine Roll Actions */}
              {scanResult.roll && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => navigate('/rewinding-reel-conversion')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Scissors className="h-4 w-4" />
                    <span>Cut Reels in Rewinder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/lab')}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-3 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-purple-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FlaskConical className="h-4 w-4" />
                    <span>Log Paper Quality Test</span>
                  </button>
                </div>
              )}

              {/* Dispatch Slip Actions */}
              {scanResult.slip && (
                <button
                  type="button"
                  onClick={() => navigate('/dispatch-receipt')}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-3 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-purple-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Truck className="h-4 w-4" />
                  <span>Open Dispatch Challan #{scanResult.slip.slipNo}</span>
                </button>
              )}

              {/* Lab Report Actions */}
              {scanResult.lab && (
                <button
                  type="button"
                  onClick={() => navigate('/lab')}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-3 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-purple-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <FlaskConical className="h-4 w-4" />
                  <span>Open Lab Quality Control Certificate</span>
                </button>
              )}

              {/* Boiler Log Actions */}
              {scanResult.boiler && (
                <button
                  type="button"
                  onClick={() => navigate('/utilities-&-etp/boiler-operations')}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black py-3 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Flame className="h-4 w-4" />
                  <span>Open Boiler Operations Log</span>
                </button>
              )}

              {/* Shared Secondary Buttons (Edit Specs & Traceability) */}
              <div className="flex gap-2">
                {scanResult.reel && !isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit Specs</span>
                  </button>
                )}

                <button
                  onClick={() => navigate(`/traceability?q=${encodeURIComponent(scanResult.code)}`)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Traceability</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Reset / Next Scan Button */}
              <button
                onClick={handleResetScanner}
                className="w-full py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 btn-primary-gradient shadow-lg"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Scan Next QR / Barcode</span>
              </button>
            </div>

          </div>
        );
      })()}

      {/* QUICK DISPATCH MODAL POPUP */}
      {showDispatchModal && scanResult?.reel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Dispatch Reel #{scanResult.reel.reelNo}
              </h3>
              <button onClick={() => setShowDispatchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {dispatchError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-2xl font-bold border border-red-200">
                {dispatchError}
              </div>
            )}

            <form onSubmit={handleQuickDispatch} className="space-y-4 text-xs font-bold">
              <div className="p-3 bg-blue-50/50 dark:bg-slate-900/60 rounded-2xl border border-blue-100 dark:border-slate-800 space-y-1">
                <p><span className="text-slate-400 uppercase text-[10px]">Product:</span> <span className="text-slate-900 dark:text-white font-black">{scanResult.reel.product}</span></p>
                <p><span className="text-slate-400 uppercase text-[10px]">Weight:</span> <span className="text-blue-600 dark:text-blue-400 font-black font-mono">{scanResult.reel.weight} kg</span></p>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Select Party / Customer</label>
                <select
                  value={dispatchParty}
                  onChange={e => setDispatchParty(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold dark:text-white cursor-pointer"
                >
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Dispatch Vehicle No</label>
                <select
                  value={dispatchVehicle}
                  onChange={e => setDispatchVehicle(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold dark:text-white cursor-pointer"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.vehicleNo}>{v.vehicleNo} ({v.driverName})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary-gradient w-full py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Confirm Dispatch (Auto-Minus Stock)</span>
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

// Local Error Boundary to catch any camera hardware or browser exceptions locally
class QRScannerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: String(error?.message || error || 'Scanner error') };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn('QRScannerErrorBoundary captured local error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-2xl mx-auto p-4 text-center select-none font-sans">
          <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-2xl">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl w-fit mx-auto">
              <Camera className="h-8 w-8" />
            </div>
            <h3 className="font-black text-sm text-white uppercase tracking-wider">
              Camera Scanner Ready to Restart
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Camera session was safely reset. Tap below to reconnect the scanner.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, errorMsg: '' })}
              className="btn-primary-gradient px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Restart Camera</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const QRScannerView: React.FC<QRScannerViewProps> = (props) => (
  <QRScannerErrorBoundary>
    <QRScannerViewInner {...props} />
  </QRScannerErrorBoundary>
);

export default QRScannerView;
