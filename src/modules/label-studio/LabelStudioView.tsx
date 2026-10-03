import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getReels, getProducts } from '../../data/index';
import type { ProductItem, Reel } from '../../data/types';
import {
  QrCode,
  Layers,
  Printer,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  FileText,
  AlertTriangle,
  Database,
  Edit3,
  Lock,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Info,
  SlidersHorizontal,
  Package,
  Calendar,
  Scale,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { ReelPrintLabel, formatDiaInCm } from '../../components/ReelPrintLabel';
import { useAuth } from '../auth/AuthContext';
import { MobileToast, type ToastMessage } from '../../components/MobileToast';

export interface LabelItemData {
  id: string;
  productTitle: string;
  customDescription: string;
  barcodeNo: string;
  qrCodeEmbedValue: string;
  gsm: string;
  sizeWidth: string;
  netWeightKg: string;
  rollNo: string;
  shade: string;
  ply: string;
  joint: string;
  dia: string;
  core: string;
  qcStatus: string;
  prodDateTime: string;
  notesInstructions: string;
  copies: number;
}

export interface StoredReelItem {
  reelNo: string;
  productName: string;
  gsm: string;
  width: string;
  netWeightKg: string;
  rollNo: string;
  shade: string;
  ply: string;
  joint: string;
  dia: string;
  core: string;
  qcStatus: string;
  prodDateTime: string;
  notesInstructions: string;
  status: string;
  qrValue?: string;
}

// Convert a database Reel or item into standard LabelItemData
const reelToLabelItem = (reel: StoredReelItem, copies = 1, overrides?: Partial<LabelItemData>): LabelItemData => {
  const rSize = Number(reel.width);
  const mmWidth = rSize ? (rSize <= 100 ? String(rSize * 100) : String(rSize)) : '3000';
  return {
    id: `lbl-${reel.reelNo}-${Date.now()}`,
    productTitle: overrides?.productTitle ?? (reel.productName || 'Tissue Paper Reel'),
    customDescription: overrides?.customDescription ?? reel.notesInstructions ?? '',
    barcodeNo: overrides?.barcodeNo ?? reel.reelNo,
    qrCodeEmbedValue: overrides?.qrCodeEmbedValue ?? reel.qrValue ?? reel.reelNo,
    gsm: overrides?.gsm ?? (reel.gsm ? String(reel.gsm) : '16'),
    sizeWidth: overrides?.sizeWidth ?? mmWidth,
    netWeightKg: overrides?.netWeightKg ?? reel.netWeightKg ?? '',
    rollNo: overrides?.rollNo ?? reel.rollNo ?? '',
    shade: overrides?.shade ?? reel.shade ?? 'Standard',
    ply: overrides?.ply ?? reel.ply ?? '2 Ply',
    joint: overrides?.joint ?? reel.joint ?? '0 (Seamless)',
    dia: overrides?.dia ?? formatDiaInCm(reel.dia || 1150),
    core: overrides?.core ?? reel.core ?? '76 mm (3")',
    qcStatus: overrides?.qcStatus ?? reel.qcStatus ?? 'Grade A - PASSED',
    prodDateTime: overrides?.prodDateTime ?? reel.prodDateTime ?? new Date().toISOString().substring(0, 10),
    notesInstructions: overrides?.notesInstructions ?? reel.notesInstructions ?? '',
    copies: copies || 1,
  };
};

export const LabelStudioView: React.FC = () => {
  const { isViewer } = useAuth();

  // Label Size for Thermal Roll
  const [labelSize, setLabelSize] = useState<'4x6' | '3x2' | 'a4' | 'auto'>('4x6');

  // Real-time synchronization version
  const [dataVersion, setDataVersion] = useState<number>(0);

  useEffect(() => {
    const handleDataUpdate = () => {
      setDataVersion(v => v + 1);
    };
    window.addEventListener('storage', handleDataUpdate);
    window.addEventListener('saheb_data_updated', handleDataUpdate);
    return () => {
      window.removeEventListener('storage', handleDataUpdate);
      window.removeEventListener('saheb_data_updated', handleDataUpdate);
    };
  }, []);

  // Products from authoritative master database
  const catalogProducts = useMemo<ProductItem[]>(() => {
    return getProducts().filter(p => p.active !== false);
  }, [dataVersion]);

  // Read all live reels from authoritative getReels()
  const allStoredReels = useMemo<StoredReelItem[]>(() => {
    try {
      const liveReels: Reel[] = getReels();
      if (!liveReels || liveReels.length === 0) {
        return [];
      }
      return liveReels
        .filter(r => r && r.reelNo)
        .map(r => {
          const rSize = Number(r.size);
          const mmWidth = rSize ? (rSize <= 100 ? String(rSize * 100) : String(rSize)) : '3000';
          return {
            reelNo: r.reelNo,
            productName: r.product || 'Tissue Paper Reel',
            gsm: r.gsm ? String(r.gsm) : '16',
            width: mmWidth,
            netWeightKg: r.weight ? r.weight.toLocaleString('en-IN') : '',
            rollNo: r.parentRollNo ? r.parentRollNo.replace(/\D/g, '') || r.parentRollNo : '',
            shade: r.shade || 'Standard',
            ply: r.ply ? `${r.ply} Ply` : '2 Ply',
            joint: r.joint !== undefined ? `${r.joint} Joints` : '0 (Seamless)',
            dia: formatDiaInCm(r.dia || 1150),
            core: r.core ? `${r.core} mm` : '76 mm (3")',
            qcStatus: r.qcGrade ? `Grade ${r.qcGrade} - PASSED` : 'Grade A - PASSED',
            prodDateTime: r.productionDate ? r.productionDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
            notesInstructions: r.notes || '',
            status: r.status || 'IN_STOCK',
            qrValue: r.reelNo,
          };
        });
    } catch (e) {
      console.error('Error fetching reels in LabelStudioView:', e);
      return [];
    }
  }, [dataVersion]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock'>('in_stock');

  // Filtered Reels based on user criteria
  const filteredReels = useMemo(() => {
    let list = allStoredReels;

    // Filter by stock status if in_stock is selected (and there are in-stock reels)
    if (statusFilter === 'in_stock') {
      const inStock = list.filter(
        r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B' || r.status === 'QC_PASSED'
      );
      if (inStock.length > 0) {
        list = inStock;
      }
    }

    // Filter by Product
    if (selectedProductFilter !== 'all') {
      const pLower = selectedProductFilter.toLowerCase();
      list = list.filter(r => (r.productName || '').toLowerCase().includes(pLower));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        r =>
          r.reelNo.toLowerCase().includes(q) ||
          (r.productName && r.productName.toLowerCase().includes(q)) ||
          (r.gsm && r.gsm.includes(q)) ||
          (r.width && r.width.includes(q)) ||
          (r.netWeightKg && r.netWeightKg.includes(q)) ||
          (r.rollNo && r.rollNo.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allStoredReels, statusFilter, selectedProductFilter, searchQuery]);

  // Multi-Selection State (Set of selected reel numbers)
  const [selectedReelNos, setSelectedReelNos] = useState<string[]>(() => {
    // Default select first available reel if present
    if (allStoredReels.length > 0) {
      return [allStoredReels[0].reelNo];
    }
    return [];
  });

  // Copies per Reel (reelNo -> count)
  const [copiesMap, setCopiesMap] = useState<Record<string, number>>({});

  // Expanded Reel for viewing detailed breakdown
  const [expandedReelNo, setExpandedReelNo] = useState<string | null>(null);

  // Active Reel being previewed on the Right Side
  const [previewReelNo, setPreviewReelNo] = useState<string>(() => {
    return allStoredReels[0]?.reelNo || '';
  });

  // Toast State
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Print Mode State
  const [printTarget, setPrintTarget] = useState<'current' | 'all'>('all');

  // Manual Reel Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    reelNo: '',
    productName: 'Napkin Tissue',
    gsm: '16.0',
    width: '3000',
    netWeightKg: '1,200',
    ply: '2 Ply',
    rollNo: '',
    dia: '1150 mm',
    core: '76 mm (3")',
    shade: 'Standard',
    joint: '0 (Seamless)',
    qcStatus: 'Grade A - PASSED',
    notes: '',
  });

  // Sync preview reel when selection changes
  useEffect(() => {
    if (selectedReelNos.length > 0) {
      if (!selectedReelNos.includes(previewReelNo)) {
        setPreviewReelNo(selectedReelNos[0]);
      }
    } else if (allStoredReels.length > 0 && !previewReelNo) {
      setPreviewReelNo(allStoredReels[0].reelNo);
    }
  }, [selectedReelNos, allStoredReels, previewReelNo]);

  // Toggle selection for a single reel
  const handleToggleSelect = (reelNo: string) => {
    setSelectedReelNos(prev => {
      if (prev.includes(reelNo)) {
        return prev.filter(id => id !== reelNo);
      } else {
        return [...prev, reelNo];
      }
    });
    setPreviewReelNo(reelNo);
  };

  // Select all visible filtered reels
  const handleSelectAllFiltered = () => {
    const allFilteredNos = filteredReels.map(r => r.reelNo);
    setSelectedReelNos(prev => Array.from(new Set([...prev, ...allFilteredNos])));
  };

  // Deselect all
  const handleClearSelection = () => {
    setSelectedReelNos([]);
  };

  // Global Copies update
  const handleSetGlobalCopies = (copies: number) => {
    const valid = Math.max(1, Math.min(20, copies));
    const next: Record<string, number> = {};
    selectedReelNos.forEach(id => {
      next[id] = valid;
    });
    setCopiesMap(prev => ({ ...prev, ...next }));
  };

  // Update copies for a specific reel
  const handleSetReelCopies = (reelNo: string, count: number) => {
    const valid = Math.max(1, Math.min(50, count));
    setCopiesMap(prev => ({ ...prev, [reelNo]: valid }));
  };

  // Currently Previewed Reel object
  const activePreviewReel = useMemo<StoredReelItem>(() => {
    const found = allStoredReels.find(r => r.reelNo === previewReelNo);
    if (found) return found;
    if (filteredReels.length > 0) return filteredReels[0];
    if (allStoredReels.length > 0) return allStoredReels[0];
    return {
      reelNo: previewReelNo || 'SAMPLE-001',
      productName: 'Napkin Tissue',
      gsm: '16.0',
      width: '3000',
      netWeightKg: '1,250',
      rollNo: 'R-01',
      shade: 'Standard',
      ply: '2 Ply',
      joint: '0 (Seamless)',
      dia: '1150 mm',
      core: '76 mm (3")',
      qcStatus: 'Grade A - PASSED',
      prodDateTime: new Date().toISOString().substring(0, 10),
      notesInstructions: '',
      status: 'IN_STOCK',
      qrValue: previewReelNo || 'SAMPLE-001',
    };
  }, [allStoredReels, filteredReels, previewReelNo]);

  // Index of active preview reel within selected reels
  const previewSelectedIndex = useMemo(() => {
    return selectedReelNos.indexOf(previewReelNo);
  }, [selectedReelNos, previewReelNo]);

  // Navigate through selected preview reels
  const handlePrevPreview = () => {
    if (selectedReelNos.length === 0) return;
    const curIdx = previewSelectedIndex === -1 ? 0 : previewSelectedIndex;
    const prevIdx = (curIdx - 1 + selectedReelNos.length) % selectedReelNos.length;
    setPreviewReelNo(selectedReelNos[prevIdx]);
  };

  const handleNextPreview = () => {
    if (selectedReelNos.length === 0) return;
    const curIdx = previewSelectedIndex === -1 ? 0 : previewSelectedIndex;
    const nextIdx = (curIdx + 1) % selectedReelNos.length;
    setPreviewReelNo(selectedReelNos[nextIdx]);
  };

  // Compute total stickers count
  const totalStickersToPrint = useMemo(() => {
    if (selectedReelNos.length === 0) return 0;
    return selectedReelNos.reduce((sum, id) => sum + (copiesMap[id] || 1), 0);
  }, [selectedReelNos, copiesMap]);

  // Array of labels to feed into the print portal
  const labelsForPrinting = useMemo<LabelItemData[]>(() => {
    if (printTarget === 'current') {
      const copies = copiesMap[activePreviewReel.reelNo] || 1;
      return [reelToLabelItem(activePreviewReel, copies)];
    }

    // Print all selected reels
    return selectedReelNos
      .map(reelNo => {
        const item = allStoredReels.find(r => r.reelNo === reelNo);
        if (!item) return null;
        const copies = copiesMap[reelNo] || 1;
        return reelToLabelItem(item, copies);
      })
      .filter(Boolean) as LabelItemData[];
  }, [printTarget, selectedReelNos, allStoredReels, copiesMap, activePreviewReel]);

  // Print Handlers
  const handlePrintSelected = () => {
    if (isViewer) return;
    if (selectedReelNos.length === 0) {
      alert('Kripya print karne ke liye kam se kam 1 reel select karein.');
      return;
    }
    setPrintTarget('all');
    document.body.classList.add('printing-label-studio');

    setToast({
      type: 'success',
      title: 'Batch Labels Ready',
      message: `🖨️ ${selectedReelNos.length} Reel Labels (${totalStickersToPrint} Total Stickers) sent to print!`,
      duration: 4000,
    });

    if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.printDocument) {
      try {
        (window as any).AndroidNativeBridge.printDocument(`Labels_Batch_${selectedReelNos.length}`);
      } catch (e) {
        console.warn('[LabelStudioPrint] AndroidNativeBridge failed:', e);
      }
    }

    const cleanup = () => {
      document.body.classList.remove('printing-label-studio');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 2500);
    }, 150);
  };

  const handlePrintCurrentOnly = () => {
    if (isViewer) return;
    setPrintTarget('current');
    document.body.classList.add('printing-label-studio');

    setToast({
      type: 'success',
      title: 'Label Ready',
      message: `🖨️ Label_${activePreviewReel.reelNo}.pdf sent to print!`,
      duration: 3500,
    });

    if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.printDocument) {
      try {
        (window as any).AndroidNativeBridge.printDocument(`Label_${activePreviewReel.reelNo}`);
      } catch (e) {
        console.warn('[LabelStudioPrint] AndroidNativeBridge failed:', e);
      }
    }

    const cleanup = () => {
      document.body.classList.remove('printing-label-studio');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 2500);
    }, 150);
  };

  // Add manual custom reel
  const handleAddManualReel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.reelNo.trim()) {
      alert('Please enter a valid Reel / Barcode Number');
      return;
    }
    const newReel: StoredReelItem = {
      reelNo: manualForm.reelNo.trim(),
      productName: manualForm.productName,
      gsm: manualForm.gsm,
      width: manualForm.width,
      netWeightKg: manualForm.netWeightKg,
      rollNo: manualForm.rollNo,
      shade: manualForm.shade,
      ply: manualForm.ply,
      joint: manualForm.joint,
      dia: manualForm.dia,
      core: manualForm.core,
      qcStatus: manualForm.qcStatus,
      prodDateTime: new Date().toISOString().substring(0, 10),
      notesInstructions: manualForm.notes,
      status: 'IN_STOCK',
      qrValue: manualForm.reelNo.trim(),
    };

    allStoredReels.unshift(newReel);
    setSelectedReelNos(prev => [newReel.reelNo, ...prev]);
    setPreviewReelNo(newReel.reelNo);
    setIsManualModalOpen(false);
    setToast({
      type: 'success',
      title: 'Reel Added',
      message: `Manual Reel ${newReel.reelNo} added & selected for printing!`,
      duration: 3000,
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-24 text-slate-900 dark:text-slate-100 w-full max-w-7xl mx-auto font-sans">
      
      {/* 1. TOP HEADER STRIP */}
      <div className="bg-white dark:bg-[#1a3535] border border-slate-200/90 dark:border-[#2c4a4a] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#6C4FE0]/10 text-[#6C4FE0] dark:bg-purple-900/30 dark:text-purple-400">
            <Printer className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span>Label Studio &amp; Batch Barcode Printing</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                Multi-Reel Print Ready
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Select multiple warehouse reels simultaneously and print industrial barcode labels with 1 click.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Plus className="h-4 w-4 text-[#6C4FE0]" />
            <span>+ Custom / Manual Reel</span>
          </button>

          {/* Selection Counter Pill */}
          <div className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[#6C4FE0] dark:text-purple-400" />
            <span className="text-xs font-black text-[#6C4FE0] dark:text-purple-300 font-mono">
              {selectedReelNos.length} Selected
            </span>
            <span className="text-[11px] text-slate-400">({totalStickersToPrint} Prints)</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN STUDIO LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN: MULTI-REEL SELECTION & DETAILS (7 COLS) ── */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* FILTER & BULK CONTROLS CARD */}
          <div className="bg-white dark:bg-[#1a3535] border border-slate-200/90 dark:border-[#2c4a4a] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
            {/* Search Input & Stock Toggle */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by Reel No, Roll No, Product, GSM, Weight..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-[#6C4FE0] focus:outline-none transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] rounded-2xl shrink-0 w-full sm:w-auto justify-center">
                <button
                  type="button"
                  onClick={() => setStatusFilter('in_stock')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    statusFilter === 'in_stock'
                      ? 'bg-white dark:bg-[#1a3535] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  In Stock Only
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-[#1a3535] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  All Reels
                </button>
              </div>
            </div>

            {/* Product Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedProductFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedProductFilter === 'all'
                    ? 'bg-[#6C4FE0] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-[#0f2828] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                All Products ({allStoredReels.length})
              </button>
              {catalogProducts.map(p => {
                const count = allStoredReels.filter(r => (r.productName || '').toLowerCase().includes(p.name.toLowerCase())).length;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProductFilter(p.name)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      selectedProductFilter === p.name
                        ? 'bg-[#6C4FE0] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#0f2828] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Bulk Selection Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#2c4a4a]/70 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckSquare className="h-3.5 w-3.5 text-[#6C4FE0]" />
                  <span>Select All ({filteredReels.length})</span>
                </button>
                {selectedReelNos.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 transition cursor-pointer"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {/* Set Global Copies */}
              {selectedReelNos.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0f2828] px-3 py-1 rounded-xl border border-slate-200 dark:border-[#2c4a4a]">
                  <span className="text-[10px] font-bold uppercase text-slate-400">All Copies:</span>
                  {[1, 2, 3].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleSetGlobalCopies(n)}
                      className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                    >
                      {n}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* REELS LIST CARDS */}
          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredReels.length === 0 ? (
              <div className="bg-white dark:bg-[#1a3535] border border-slate-200/90 dark:border-[#2c4a4a] rounded-3xl p-8 text-center space-y-3">
                <Package className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-black text-slate-700 dark:text-slate-200">
                  No Reels Found
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No inventory reels match your current search or product filter. You can add a manual reel or change the filter.
                </p>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#6C4FE0] text-white hover:bg-[#5a3ec8] transition cursor-pointer"
                >
                  + Add Custom / Manual Reel
                </button>
              </div>
            ) : (
              filteredReels.map(reel => {
                const isSelected = selectedReelNos.includes(reel.reelNo);
                const isPreviewing = previewReelNo === reel.reelNo;
                const isExpanded = expandedReelNo === reel.reelNo;
                const copies = copiesMap[reel.reelNo] || 1;

                return (
                  <div
                    key={reel.reelNo}
                    className={`rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-purple-50/40 dark:bg-purple-950/20 border-[#6C4FE0]/60 ring-1 ring-[#6C4FE0]/30 shadow-xs'
                        : 'bg-white dark:bg-[#1a3535] border-slate-200/90 dark:border-[#2c4a4a] hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {/* Main Reel Card Header / Primary Row */}
                    <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                      {/* Checkbox & Reel Identity */}
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(reel.reelNo)}
                          className="shrink-0 cursor-pointer focus:outline-none"
                          title={isSelected ? "Deselect Reel" : "Select Reel for Printing"}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-[#6C4FE0] fill-[#6C4FE0]/10" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-black text-slate-950 dark:text-white tracking-wide">
                              {reel.reelNo}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#0f2828] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2c4a4a] truncate max-w-[140px]">
                              {reel.productName}
                            </span>
                            {isPreviewing && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                In Preview
                              </span>
                            )}
                          </div>

                          {/* Quick Specs Badges */}
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium flex-wrap">
                            <span>GSM: <strong className="text-slate-800 dark:text-slate-200 font-mono">{reel.gsm}</strong></span>
                            <span>·</span>
                            <span>Decal: <strong className="text-slate-800 dark:text-slate-200 font-mono">{reel.width} mm</strong></span>
                            <span>·</span>
                            <span>Weight: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{reel.netWeightKg} KG</strong></span>
                            <span>·</span>
                            <span>{reel.ply}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Controls: Copies & Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Copies Stepper */}
                        {isSelected && (
                          <div className="flex items-center bg-white dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] rounded-xl px-1.5 py-1">
                            <button
                              type="button"
                              onClick={() => handleSetReelCopies(reel.reelNo, copies - 1)}
                              className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-mono font-black text-xs text-slate-900 dark:text-white">
                              {copies}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSetReelCopies(reel.reelNo, copies + 1)}
                              className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        )}

                        {/* Preview Trigger */}
                        <button
                          type="button"
                          onClick={() => setPreviewReelNo(reel.reelNo)}
                          className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isPreviewing
                              ? 'bg-blue-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-[#0f2828] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                          title="Preview Sticker on Right"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* View Details Toggle */}
                        <button
                          type="button"
                          onClick={() => setExpandedReelNo(isExpanded ? null : reel.reelNo)}
                          className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                            isExpanded
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                              : 'bg-slate-100 dark:bg-[#0f2828] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                          title="View Full Reel Specifications"
                        >
                          <Info className="h-4 w-4" />
                          <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* EXPANDABLE DETAILS ACCORDION */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-200/70 dark:border-[#2c4a4a]/70 bg-slate-50/60 dark:bg-[#0f2828]/50 rounded-b-2xl space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Complete Reel Parameters &amp; Audit Specs:
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                          <div className="p-2.5 bg-white dark:bg-[#1a3535] rounded-xl border border-slate-200/80 dark:border-[#2c4a4a]">
                            <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Parent Roll</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{reel.rollNo || '---'}</span>
                          </div>
                          <div className="p-2.5 bg-white dark:bg-[#1a3535] rounded-xl border border-slate-200/80 dark:border-[#2c4a4a]">
                            <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Diameter</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{reel.dia}</span>
                          </div>
                          <div className="p-2.5 bg-white dark:bg-[#1a3535] rounded-xl border border-slate-200/80 dark:border-[#2c4a4a]">
                            <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Core Size</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{reel.core}</span>
                          </div>
                          <div className="p-2.5 bg-white dark:bg-[#1a3535] rounded-xl border border-slate-200/80 dark:border-[#2c4a4a]">
                            <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Joints</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{reel.joint}</span>
                          </div>
                          <div className="p-2.5 bg-white dark:bg-[#1a3535] rounded-xl border border-slate-200/80 dark:border-[#2c4a4a]">
                            <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">QC Grade</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{reel.qcStatus}</span>
                          </div>
                          <div className="p-2.5 bg-white dark:bg-[#1a3535] rounded-xl border border-slate-200/80 dark:border-[#2c4a4a]">
                            <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Paper Shade</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{reel.shade}</span>
                          </div>
                          <div className="p-2.5 bg-white dark:bg-[#1a3535] rounded-xl border border-slate-200/80 dark:border-[#2c4a4a]">
                            <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Production Date</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{reel.prodDateTime}</span>
                          </div>
                          <div className="p-2.5 bg-white dark:bg-[#1a3535] rounded-xl border border-slate-200/80 dark:border-[#2c4a4a]">
                            <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Status</span>
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{reel.status}</span>
                          </div>
                        </div>

                        {reel.notesInstructions && (
                          <div className="p-2.5 bg-white dark:bg-[#1a3535] rounded-xl border border-slate-200/80 dark:border-[#2c4a4a] text-xs">
                            <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Notes / Instructions:</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{reel.notesInstructions}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: LIVE THERMAL STICKER PREVIEW & PRINT (5 COLS) ── */}
        <div className="lg:col-span-5 flex flex-col items-center sticky top-4 space-y-4">
          
          {/* Preview Navigation & Paper Size Header */}
          <div className="w-full max-w-[380px] bg-white dark:bg-[#1a3535] border border-slate-200/90 dark:border-[#2c4a4a] rounded-2xl p-3 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5 text-blue-500" />
                <span>Live Sticker Preview</span>
              </span>
              <span className="text-[10px] text-blue-500 font-mono font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/60">
                {labelSize === '4x6' ? '4×6" Thermal Roll' : labelSize === '3x2' ? '3×2" Roll' : 'A4 Sheet'}
              </span>
            </div>

            {/* Pager if multiple reels are selected */}
            {selectedReelNos.length > 1 && (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#0f2828] p-1.5 rounded-xl border border-slate-200 dark:border-[#2c4a4a] text-xs">
                <button
                  type="button"
                  onClick={handlePrevPreview}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Previous Sticker"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-[11px] text-center">
                  Sticker {previewSelectedIndex + 1} of {selectedReelNos.length}
                  <span className="text-slate-400 block text-[9px] truncate max-w-[180px]">
                    Reel: {activePreviewReel.reelNo}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNextPreview}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Next Sticker"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Label Size Dropdown */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-[#2c4a4a]/70">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Roll Format:
              </label>
              <select
                value={labelSize}
                onChange={e => setLabelSize(e.target.value as any)}
                className="p-1.5 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold cursor-pointer focus:outline-none transition"
              >
                <option value="4x6">4" x 6" (100×150mm TSC Roll)</option>
                <option value="3x2">3" x 2" (75×50mm Roll)</option>
                <option value="a4">A4 Sheet (Office Printer)</option>
              </select>
            </div>
          </div>

          {/* 4x6 Physical Thermal Sticker Preview Canvas */}
          <div className="w-full flex flex-col items-center">
            <div
              className={`w-full flex flex-col items-center transition-all ${
                labelSize === '4x6' ? 'justify-end pt-8 pb-2' : 'justify-center py-2'
              }`}
              style={{
                maxWidth: '380px',
                minHeight: labelSize === '4x6' ? '540px' : 'auto',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              }}
            >
              <div id="printable-label-card" className="w-full flex justify-center print:hidden">
                <ReelPrintLabel
                  gsm={activePreviewReel.gsm}
                  width={activePreviewReel.width}
                  dia={activePreviewReel.dia}
                  core={activePreviewReel.core}
                  ply={activePreviewReel.ply}
                  weight={activePreviewReel.netWeightKg ? `${activePreviewReel.netWeightKg} KG` : ''}
                  rollNo={activePreviewReel.rollNo}
                  quality={activePreviewReel.productName}
                  customDescription={activePreviewReel.notesInstructions}
                  shade={activePreviewReel.shade}
                  jointCount={activePreviewReel.joint}
                  reelNo={activePreviewReel.reelNo}
                  qrValue={activePreviewReel.qrValue || activePreviewReel.reelNo}
                />
              </div>
            </div>
          </div>

          {/* PRINT ACTION BUTTONS */}
          <div className="w-full max-w-[380px] space-y-2.5">
            {/* Primary Action: Print All Selected Reels */}
            <button
              type="button"
              onClick={handlePrintSelected}
              disabled={isViewer || selectedReelNos.length === 0}
              className={`w-full font-black py-4 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isViewer || selectedReelNos.length === 0
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isViewer ? <Lock className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
              <span>
                {selectedReelNos.length === 0
                  ? 'Select Reels to Print'
                  : `PRINT ALL SELECTED (${selectedReelNos.length} REELS · ${totalStickersToPrint} STICKERS)`}
              </span>
            </button>

            {/* Secondary Action: Print Current Previewed Sticker Only */}
            <button
              type="button"
              onClick={handlePrintCurrentOnly}
              disabled={isViewer}
              className={`w-full font-black py-2.5 px-4 rounded-2xl text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isViewer
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                  : 'bg-white dark:bg-[#1a3535] hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-[#2c4a4a] text-slate-700 dark:text-slate-200'
              }`}
            >
              <FileText className="h-4 w-4 text-blue-500" />
              <span>Print Current Sticker Only (1x · {activePreviewReel.reelNo})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MODAL FOR ADDING CUSTOM / MANUAL REEL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1a3535] rounded-3xl border border-slate-200 dark:border-[#2c4a4a] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-[#2c4a4a] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#6C4FE0]">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                    Add Custom Reel to Print
                  </h3>
                  <p className="text-xs text-slate-400">
                    Quickly add an uncatalogued or test reel barcode to your print batch.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualReel} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Reel / Barcode No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.reelNo}
                    onChange={e => setManualForm({ ...manualForm, reelNo: e.target.value })}
                    placeholder="e.g. 26100099"
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] rounded-xl text-xs font-mono font-bold dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={manualForm.productName}
                    onChange={e => setManualForm({ ...manualForm, productName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] rounded-xl text-xs font-bold dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    GSM
                  </label>
                  <input
                    type="text"
                    value={manualForm.gsm}
                    onChange={e => setManualForm({ ...manualForm, gsm: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] rounded-xl text-xs font-mono font-bold dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Decal (mm)
                  </label>
                  <input
                    type="text"
                    value={manualForm.width}
                    onChange={e => setManualForm({ ...manualForm, width: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] rounded-xl text-xs font-mono font-bold dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Weight (KG)
                  </label>
                  <input
                    type="text"
                    value={manualForm.netWeightKg}
                    onChange={e => setManualForm({ ...manualForm, netWeightKg: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Parent Roll No
                  </label>
                  <input
                    type="text"
                    value={manualForm.rollNo}
                    onChange={e => setManualForm({ ...manualForm, rollNo: e.target.value })}
                    placeholder="e.g. 26100001"
                    className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] rounded-xl text-xs font-mono dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Diameter
                  </label>
                  <input
                    type="text"
                    value={manualForm.dia}
                    onChange={e => setManualForm({ ...manualForm, dia: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] rounded-xl text-xs font-mono dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#2c4a4a]">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase bg-[#6C4FE0] hover:bg-[#5a3ec8] text-white shadow-xs cursor-pointer"
                >
                  Add &amp; Select for Print
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DEDICATED PRINT PORTAL: Renders sequentially onto document.body for native browser printing */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div id="printable-label-studio-output" className="hidden print:block">
            <style>{`
              @media print {
                @page {
                  size: ${
                    labelSize === '4x6'
                      ? '100mm 150mm'
                      : labelSize === '3x2'
                      ? '76mm 51mm'
                      : labelSize === 'a4'
                      ? 'A4 portrait'
                      : 'auto'
                  };
                  margin: 0mm !important;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  color: #000000 !important;
                  height: auto !important;
                  min-height: auto !important;
                  overflow: visible !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body.printing-label-studio > #root {
                  display: none !important;
                }
                #printable-label-studio-output {
                  display: block !important;
                  visibility: visible !important;
                  width: 100% !important;
                  margin: 0 auto !important;
                  padding: 0 !important;
                  transform: none !important;
                  zoom: 1 !important;
                }
                .print-label-page {
                  width: 100% !important;
                  max-width: ${labelSize === '3x2' ? '76mm' : labelSize === '4x6' ? '100mm' : '185mm'} !important;
                  height: ${labelSize === '4x6' ? '148mm' : labelSize === '3x2' ? '50mm' : 'auto'} !important;
                  min-height: ${labelSize === '4x6' ? '148mm' : labelSize === '3x2' ? '50mm' : 'auto'} !important;
                  max-height: ${labelSize === '4x6' ? '148mm' : labelSize === '3x2' ? '50mm' : 'none'} !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: ${labelSize === '4x6' ? 'flex-end' : 'center'} !important;
                  align-items: center !important;
                  margin: 0 auto !important;
                  padding: ${labelSize === '4x6' ? '0 0 3mm 0' : '2mm 0'} !important;
                  box-sizing: border-box !important;
                  page-break-after: always !important;
                  break-after: page !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  overflow: hidden !important;
                  transform: none !important;
                  zoom: 1 !important;
                }
                .print-label-page:last-child {
                  page-break-after: auto !important;
                  break-after: auto !important;
                }
                .print-label-page .reel-thermal-label {
                  margin-top: ${labelSize === '4x6' ? 'auto !important' : '0 !important'};
                  margin-bottom: 0 !important;
                }
                .print-label-page * {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  box-shadow: none !important;
                  text-shadow: none !important;
                  filter: none !important;
                }
              }
            `}</style>
            {labelsForPrinting.flatMap((labelItem, labelIdx, arr) => {
              const count = labelItem.copies || 1;
              return Array.from({ length: count }).map((_, copyIdx) => {
                const isVeryLastPage = labelIdx === arr.length - 1 && copyIdx === count - 1;
                return (
                  <div
                    key={`${labelItem.id}-${copyIdx}`}
                    className="print-label-page"
                    style={{
                      pageBreakAfter: isVeryLastPage ? 'auto' : 'always',
                      breakAfter: isVeryLastPage ? 'auto' : 'page',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: labelSize === '4x6' ? 'flex-end' : 'center',
                      alignItems: 'center',
                      height: labelSize === '4x6' ? '148mm' : labelSize === '3x2' ? '50mm' : 'auto',
                      minHeight: labelSize === '4x6' ? '148mm' : labelSize === '3x2' ? '50mm' : 'auto',
                      maxHeight: labelSize === '4x6' ? '148mm' : labelSize === '3x2' ? '50mm' : 'none',
                      padding: labelSize === '4x6' ? '0 0 3mm 0' : '2mm 0',
                      margin: '0 auto',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <ReelPrintLabel
                      gsm={labelItem.gsm}
                      width={labelItem.sizeWidth}
                      dia={labelItem.dia}
                      core={labelItem.core}
                      ply={labelItem.ply}
                      weight={labelItem.netWeightKg ? `${labelItem.netWeightKg} KG` : ''}
                      rollNo={labelItem.rollNo}
                      quality={labelItem.productTitle}
                      customDescription={labelItem.customDescription}
                      shade={labelItem.shade}
                      jointCount={labelItem.joint}
                      reelNo={labelItem.barcodeNo}
                      qrValue={labelItem.qrCodeEmbedValue || labelItem.barcodeNo}
                    />
                  </div>
                );
              });
            })}
          </div>,
          document.body
        )}

      {/* Floating Toast Notification */}
      <MobileToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default LabelStudioView;
