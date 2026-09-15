import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getReels, getProducts, seedSampleReels } from '../../data/index';
import type { ProductItem, Reel } from '../../data/types';
import {
  QrCode,
  Layers,
  Printer,
  ChevronDown,
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
} from 'lucide-react';
import { ReelPrintLabel } from '../../components/ReelPrintLabel';
import { useAuth } from '../auth/AuthContext';

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
  qrValue?: string;
}

const createEmptyLabel = (product?: ProductItem | null): LabelItemData => {
  return {
    id: `lbl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productTitle: product ? product.name : '',
    customDescription: '',
    barcodeNo: '',
    qrCodeEmbedValue: '',
    gsm: product && product.gsm ? String(product.gsm) : '',
    sizeWidth: product && product.size ? String(product.size) : '',
    netWeightKg: '',
    rollNo: '',
    shade: 'Standard',
    ply: product && product.ply ? `${product.ply} Ply` : '2 Ply',
    joint: '0 (Seamless)',
    dia: '1150 mm',
    core: '76 mm (3")',
    qcStatus: product && product.grade ? `Grade ${product.grade} - PASSED` : 'Grade A - PASSED',
    prodDateTime: new Date().toISOString().substring(0, 10),
    notesInstructions: '',
    copies: 1,
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

  // Products from single authoritative master database
  const catalogProducts = useMemo<ProductItem[]>(() => {
    return getProducts();
  }, [dataVersion]);

  // Batch Labels Queue (Initialized with active master product, zero fake reel data)
  const [labels, setLabels] = useState<LabelItemData[]>(() => {
    const prods = getProducts();
    return [createEmptyLabel(prods[0] || null)];
  });
  const [activeLabelIndex, setActiveLabelIndex] = useState<number>(0);

  // Print Mode State
  const [printTarget, setPrintTarget] = useState<'current' | 'all'>('current');

  // Product Selection Dropdown State
  const [isProductPickerOpen, setIsProductPickerOpen] = useState<boolean>(false);
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const productPickerRef = useRef<HTMLDivElement>(null);

  // Reel Selection Dropdown State
  const [isReelPickerOpen, setIsReelPickerOpen] = useState<boolean>(false);
  const [reelSearchQuery, setReelSearchQuery] = useState<string>('');
  const reelPickerRef = useRef<HTMLDivElement>(null);

  // Manual Reel Entry Mode Toggle
  const [isManualReelEntry, setIsManualReelEntry] = useState<boolean>(false);

  // Active Label reference
  const currentLabel = labels[activeLabelIndex] || labels[0] || createEmptyLabel(null);

  // Helper to update active label
  const updateCurrentLabel = (patch: Partial<LabelItemData>) => {
    setLabels(prev =>
      prev.map((item, idx) => (idx === activeLabelIndex ? { ...item, ...patch } : item))
    );
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productPickerRef.current && !productPickerRef.current.contains(event.target as Node)) {
        setIsProductPickerOpen(false);
      }
      if (reelPickerRef.current && !reelPickerRef.current.contains(event.target as Node)) {
        setIsReelPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    const q = productSearchQuery.trim().toLowerCase();
    if (!q) return catalogProducts;
    return catalogProducts.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.gsm && String(p.gsm).toLowerCase().includes(q)) ||
        (p.ply && String(p.ply).toLowerCase().includes(q))
    );
  }, [catalogProducts, productSearchQuery]);

  // Read live in-stock reels strictly from authoritative getReels()
  const allStoredReels = useMemo<StoredReelItem[]>(() => {
    try {
      let liveReels: Reel[] = getReels();
      if (!liveReels || liveReels.length === 0) {
        liveReels = seedSampleReels();
      }
      // Only include valid in-stock / available reels (not dispatched/rejected)
      const availableReels = liveReels.filter(r =>
        r &&
        r.reelNo &&
        (r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B' || !r.status || r.status === 'QC_PASSED')
      );
      return availableReels.map(r => ({
        reelNo: r.reelNo,
        productName: r.product || '',
        gsm: r.gsm ? String(r.gsm) : '',
        width: r.size ? String(r.size) : '',
        netWeightKg: r.weight ? r.weight.toLocaleString('en-IN') : '',
        rollNo: r.parentRollNo ? r.parentRollNo.replace(/\D/g, '') || r.parentRollNo : '',
        shade: r.shade || 'Standard',
        ply: r.ply ? `${r.ply} Ply` : '2 Ply',
        joint: r.joint !== undefined ? `${r.joint} Joints` : '0 (Seamless)',
        dia: r.dia ? `${r.dia} mm` : '1150 mm',
        core: r.core ? `${r.core} mm` : '76 mm (3")',
        qcStatus: r.qcGrade ? `Grade ${r.qcGrade} - PASSED` : 'Grade A - PASSED',
        prodDateTime: r.productionDate ? r.productionDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
        notesInstructions: r.notes || '',
        qrValue: r.reelNo,
      }));
    } catch (e) {
      console.error('Error fetching reels:', e);
      return [];
    }
  }, [dataVersion]);

  // Reels specifically available for the currently selected Product with flexible keyword matching and fallback
  const availableReelsForProduct = useMemo(() => {
    const pName = (currentLabel.productTitle || '').trim().toLowerCase();
    if (!pName) return allStoredReels;

    // 1. Check exact / partial substring / word overlap match
    const matched = allStoredReels.filter(r => {
      const rProd = (r.productName || '').toLowerCase().trim();
      if (!rProd) return true;
      if (rProd === pName || rProd.includes(pName) || pName.includes(rProd)) return true;
      const pWords = pName.split(/[\s(),-]+/).filter(w => w.length > 2);
      const rWords = rProd.split(/[\s(),-]+/).filter(w => w.length > 2);
      return pWords.some(pw => rWords.some(rw => rw.includes(pw) || pw.includes(rw)));
    });

    // 2. If matching reels exist for this product, return them; otherwise return all available reels so user is never blocked
    return matched.length > 0 ? matched : allStoredReels;
  }, [allStoredReels, currentLabel.productTitle]);

  // Filtered reels based on search query
  const filteredReels = useMemo(() => {
    const q = reelSearchQuery.trim().toLowerCase();
    if (!q) return availableReelsForProduct;
    return availableReelsForProduct.filter(
      r =>
        r.reelNo.toLowerCase().includes(q) ||
        r.rollNo.toLowerCase().includes(q) ||
        r.gsm.toLowerCase().includes(q) ||
        r.netWeightKg.toLowerCase().includes(q) ||
        r.qcStatus.toLowerCase().includes(q)
    );
  }, [availableReelsForProduct, reelSearchQuery]);

  // Handle Product Selection: Selects Product & Clears stale reel-specific fields immediately
  const handleSelectProduct = (product: ProductItem) => {
    updateCurrentLabel({
      productTitle: product.name,
      barcodeNo: '',
      qrCodeEmbedValue: '',
      netWeightKg: '',
      rollNo: '',
      notesInstructions: '',
      gsm: product.gsm ? String(product.gsm) : currentLabel.gsm,
      sizeWidth: product.size ? String(product.size) : currentLabel.sizeWidth,
      ply: product.ply ? `${product.ply} Ply` : currentLabel.ply,
      qcStatus: product.grade ? `Grade ${product.grade} - PASSED` : currentLabel.qcStatus,
    });
    setIsProductPickerOpen(false);
    setProductSearchQuery('');
  };

  // Handle Reel Selection: Auto-populates all 12+ real reel-specific parameters
  const handleSelectReel = (reel: StoredReelItem) => {
    updateCurrentLabel({
      productTitle: reel.productName || currentLabel.productTitle,
      barcodeNo: reel.reelNo,
      qrCodeEmbedValue: reel.qrValue || reel.reelNo,
      gsm: reel.gsm || currentLabel.gsm,
      sizeWidth: reel.width || currentLabel.sizeWidth,
      netWeightKg: reel.netWeightKg,
      rollNo: reel.rollNo,
      shade: reel.shade || currentLabel.shade,
      ply: reel.ply || currentLabel.ply,
      joint: reel.joint || currentLabel.joint,
      dia: reel.dia || currentLabel.dia,
      core: reel.core || currentLabel.core,
      qcStatus: reel.qcStatus || currentLabel.qcStatus,
      prodDateTime: reel.prodDateTime || currentLabel.prodDateTime,
      notesInstructions: reel.notesInstructions,
    });
    setIsReelPickerOpen(false);
    setReelSearchQuery('');
  };

  // Duplicate Reel in Print Queue Check
  const duplicateInQueue = useMemo(() => {
    if (!currentLabel.barcodeNo) return null;
    const matchIdx = labels.findIndex(
      (l, idx) => idx !== activeLabelIndex && l.barcodeNo.trim() === currentLabel.barcodeNo.trim()
    );
    if (matchIdx !== -1) {
      return {
        labelNumber: matchIdx + 1,
        reelNo: currentLabel.barcodeNo,
      };
    }
    return null;
  }, [labels, activeLabelIndex, currentLabel.barcodeNo]);

  // Add Label to Batch (Clean start with active product, zero fake reel data)
  const handleAddLabel = () => {
    const selectedProd = catalogProducts.find(p => p.name === currentLabel.productTitle) || catalogProducts[0];
    const newLabel = createEmptyLabel(selectedProd || null);
    setLabels(prev => [...prev, newLabel]);
    setActiveLabelIndex(labels.length);
  };

  // Duplicate Current Label
  const handleDuplicateLabel = () => {
    const cur = currentLabel;
    const duplicated: LabelItemData = {
      ...cur,
      id: `lbl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      copies: 1,
    };
    setLabels(prev => [...prev, duplicated]);
    setActiveLabelIndex(labels.length);
  };

  // Remove Label from Batch
  const handleRemoveLabel = (indexToRemove: number) => {
    if (labels.length <= 1) return;
    setLabels(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (activeLabelIndex >= indexToRemove && activeLabelIndex > 0) {
      setActiveLabelIndex(activeLabelIndex - 1);
    }
  };

  // Print Handlers with strict live validation
  const handlePrintCurrent = () => {
    if (isViewer) return;
    if (!currentLabel.barcodeNo) {
      alert('Please select an available reel from warehouse inventory before printing.');
      return;
    }
    setPrintTarget('current');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const handlePrintAll = () => {
    if (isViewer) return;
    const unselected = labels.some(l => !l.barcodeNo);
    if (unselected) {
      alert('Some labels in the queue do not have a reel selected. Please select a reel for each label before printing.');
      return;
    }
    setPrintTarget('all');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const activeQrCodeValue = currentLabel.qrCodeEmbedValue || currentLabel.barcodeNo || '';

  // Compute total stickers to print in batch
  const totalBatchStickers = useMemo(() => {
    return labels.reduce((acc, item) => acc + (item.copies || 1), 0);
  }, [labels]);

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-24 text-slate-900 dark:text-slate-100 w-full max-w-7xl mx-auto font-sans">
      {/* 1. Header Card */}
      <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
              <QrCode className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                  Paper Reel Label Studio
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Product → Reel Auto-Fill
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Select Product and Reel to auto-populate stored specifications, QR code, and print 4x6 thermal stickers.
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-right">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Queue Total</div>
              <div className="text-xs font-black text-slate-900 dark:text-white font-mono">
                {labels.length} Label{labels.length > 1 ? 's' : ''} · {totalBatchStickers} Print{totalBatchStickers > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Batch Labels Queue Strip */}
      <div className="bg-white dark:bg-[#1a3535] border border-slate-200/90 dark:border-[#2c4a4a] rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-[#2c4a4a]">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#6C4FE0] dark:text-purple-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Print Queue ({labels.length} {labels.length === 1 ? 'Label' : 'Labels'})
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              · Editing Label #{activeLabelIndex + 1}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDuplicateLabel}
              title="Duplicate Current Label"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Duplicate</span>
            </button>

            {labels.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveLabel(activeLabelIndex)}
                title="Remove Active Label"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddLabel}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-black text-xs bg-[#6C4FE0] hover:bg-[#5a3ec8] text-white shadow-xs transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Add Label</span>
            </button>
          </div>
        </div>

        {/* Labels Tab Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 custom-scrollbar">
          {labels.map((item, idx) => {
            const isActive = idx === activeLabelIndex;
            return (
              <div
                key={item.id}
                onClick={() => setActiveLabelIndex(idx)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#6C4FE0] text-white border-[#6C4FE0] shadow-xs'
                    : 'bg-slate-50 dark:bg-[#0f2828] border-slate-200 dark:border-[#2c4a4a] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-mono text-[11px] opacity-80">#{idx + 1}</span>
                <span className="truncate max-w-[130px] font-semibold">
                  {item.productTitle || `Label ${idx + 1}`}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.barcodeNo || item.rollNo}
                </span>
                {labels.length > 1 && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleRemoveLabel(idx);
                    }}
                    className={`p-0.5 rounded-md transition hover:bg-white/20 ${
                      isActive ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                    }`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Main Studio 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4 bg-white dark:bg-[#1a3535] border border-slate-200/90 dark:border-[#2c4a4a] rounded-3xl p-5 sm:p-6 shadow-sm">
          
          {/* 3A. PRODUCT & REEL SELECTION WORKFLOW (PRIMARY) */}
          <div className="bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-[#2c4a4a] pb-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Database className="h-4 w-4 text-primary dark:text-blue-400" />
                <span>1. Select Product → 2. Select Stored Reel</span>
              </label>
            </div>

            {/* Grid of Step 1 (Product) and Step 2 (Reel) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* STEP 1: PRODUCT PICKER */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Step 1 · Select Product
                </label>
                <div className="relative" ref={productPickerRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductPickerOpen(prev => !prev);
                      setIsReelPickerOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-[#1a3535] border border-slate-200 dark:border-[#2c4a4a] rounded-xl text-xs font-bold text-slate-900 dark:text-white hover:border-primary transition cursor-pointer shadow-2xs text-left"
                  >
                    <div className="truncate pr-1">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Product</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {currentLabel.productTitle || 'Select Product'}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  </button>

                  {/* Product Search Popover */}
                  {isProductPickerOpen && (
                    <div className="absolute z-40 top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#132323] border border-slate-200 dark:border-[#2c4a4a] rounded-2xl shadow-2xl p-3 space-y-2 max-h-80 overflow-hidden flex flex-col">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          value={productSearchQuery}
                          onChange={e => setProductSearchQuery(e.target.value)}
                          placeholder="Search products..."
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#0a1818] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary transition"
                        />
                      </div>

                      <div className="overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {filteredProducts.length === 0 ? (
                          <div className="text-center py-4 text-xs font-bold text-slate-400">
                            No products found
                          </div>
                        ) : (
                          filteredProducts.map((p, idx) => {
                            const isSelected = currentLabel.productTitle === p.name;
                            return (
                              <div
                                key={idx}
                                onClick={() => handleSelectProduct(p)}
                                className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between text-xs ${
                                  isSelected
                                    ? 'bg-primary text-white font-black'
                                    : 'hover:bg-slate-100 dark:hover:bg-[#1a3535] text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className="font-extrabold truncate">{p.name}</div>
                                  <div
                                    className={`text-[10px] font-mono mt-0.5 ${
                                      isSelected ? 'text-white/80' : 'text-slate-400'
                                    }`}
                                  >
                                    {p.gsm || '---'} GSM · {p.ply || 2} Ply · {p.size ? `${p.size} cm` : '---'}
                                  </div>
                                </div>
                                {isSelected && <Check className="h-4 w-4 shrink-0 text-white" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 2: REEL NUMBER PICKER (FILTERED BY PRODUCT) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Step 2 · Select Stored Reel
                  </label>
                  <span
                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                      availableReelsForProduct.length === 0
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {availableReelsForProduct.length} Reel{availableReelsForProduct.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="relative" ref={reelPickerRef}>
                  <button
                    type="button"
                    disabled={availableReelsForProduct.length === 0}
                    onClick={() => {
                      if (availableReelsForProduct.length === 0) return;
                      setIsReelPickerOpen(prev => !prev);
                      setIsProductPickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 bg-white dark:bg-[#1a3535] border border-slate-200 dark:border-[#2c4a4a] rounded-xl text-xs font-bold text-slate-900 dark:text-white transition shadow-2xs text-left ${
                      availableReelsForProduct.length === 0
                        ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40'
                        : 'hover:border-primary cursor-pointer'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Reel Number</div>
                      <div
                        className={`text-xs font-black font-mono truncate ${
                          availableReelsForProduct.length === 0
                            ? 'text-slate-400'
                            : currentLabel.barcodeNo
                            ? 'text-primary dark:text-blue-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {availableReelsForProduct.length === 0
                          ? 'No reels available'
                          : currentLabel.barcodeNo
                          ? `Reel #${currentLabel.barcodeNo}`
                          : 'Select Reel...'}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  </button>

                  {/* Reel Search & Selection Popover */}
                  {isReelPickerOpen && availableReelsForProduct.length > 0 && (
                    <div className="absolute z-40 top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#132323] border border-slate-200 dark:border-[#2c4a4a] rounded-2xl shadow-2xl p-3 space-y-2 max-h-80 overflow-hidden flex flex-col">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          value={reelSearchQuery}
                          onChange={e => setReelSearchQuery(e.target.value)}
                          placeholder="Search Reel No (e.g. 26050057)..."
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#0a1818] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary transition"
                        />
                      </div>

                      <div className="overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                        {filteredReels.length === 0 ? (
                          <div className="text-center py-4 text-xs font-bold text-slate-400">
                            No stored reels found for this search
                          </div>
                        ) : (
                          filteredReels.map((r, idx) => {
                            const isSelected = currentLabel.barcodeNo === r.reelNo;
                            return (
                              <div
                                key={idx}
                                onClick={() => handleSelectReel(r)}
                                className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between text-xs ${
                                  isSelected
                                    ? 'bg-primary text-white font-bold'
                                    : 'hover:bg-slate-100 dark:hover:bg-[#1a3535] text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800'
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black font-mono">{r.reelNo}</span>
                                    <span
                                      className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-extrabold uppercase ${
                                        isSelected
                                          ? 'bg-white/20 text-white'
                                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                      }`}
                                    >
                                      {r.qcStatus.split(' - ')[0] || 'Grade A'}
                                    </span>
                                  </div>
                                  <div
                                    className={`text-[10px] font-mono mt-1 ${
                                      isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                  >
                                    GSM {r.gsm} · {r.netWeightKg} KG · Dia {r.dia} · Roll #{r.rollNo}
                                  </div>
                                </div>
                                {isSelected && <Check className="h-4 w-4 shrink-0 text-white" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Duplicate Queue Warning Badge */}
            {duplicateInQueue && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Notice: Reel #{duplicateInQueue.reelNo} is already in Queue (Label #{duplicateInQueue.labelNumber}). You can print multiple copies below.
                </span>
              </div>
            )}

            {/* Editable Product Title & Additional Custom Description */}
            <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-[#2c4a4a]">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                  PRODUCT TITLE / NAME (EDITABLE)
                </label>
                <input
                  type="text"
                  value={currentLabel.productTitle}
                  onChange={e => updateCurrentLabel({ productTitle: e.target.value })}
                  placeholder="Product Name..."
                  className="w-full p-2.5 bg-white dark:bg-[#1a3535] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                  ADDITIONAL DESCRIPTION / CUSTOM TEXT
                </label>
                <input
                  type="text"
                  value={currentLabel.customDescription}
                  onChange={e => updateCurrentLabel({ customDescription: e.target.value })}
                  placeholder="e.g. Premium 2Ply - Light Tinted, Export Grade..."
                  className="w-full p-2.5 bg-white dark:bg-[#1a3535] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* 3B. REEL NUMBER, QR VALUE & MANUAL FALLBACK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300">
                  REEL / BARCODE NO
                </label>
                <button
                  type="button"
                  onClick={() => setIsManualReelEntry(prev => !prev)}
                  className="text-[10px] font-bold text-primary dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>{isManualReelEntry ? 'Lock to Stored' : 'Custom Entry'}</span>
                </button>
              </div>
              <input
                type="text"
                value={currentLabel.barcodeNo}
                onChange={e => updateCurrentLabel({ barcodeNo: e.target.value, qrCodeEmbedValue: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1.5">
                QR CODE EMBED VALUE
              </label>
              <input
                type="text"
                value={currentLabel.qrCodeEmbedValue}
                onChange={e => updateCurrentLabel({ qrCodeEmbedValue: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>
          </div>

          {/* 3C. GSM, SIZE / WIDTH, NET WEIGHT (KG) */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                GSM
              </label>
              <input
                type="text"
                value={currentLabel.gsm}
                onChange={e => updateCurrentLabel({ gsm: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                SIZE / WIDTH
              </label>
              <input
                type="text"
                value={currentLabel.sizeWidth}
                onChange={e => updateCurrentLabel({ sizeWidth: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                NET WEIGHT (KG)
              </label>
              <input
                type="text"
                value={currentLabel.netWeightKg}
                onChange={e => updateCurrentLabel({ netWeightKg: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>
          </div>

          {/* 3D. ROLL NO, PLY, DIAMETER */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                ROLL NO
              </label>
              <input
                type="text"
                value={currentLabel.rollNo}
                onChange={e => updateCurrentLabel({ rollNo: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                PLY
              </label>
              <input
                type="text"
                value={currentLabel.ply}
                onChange={e => updateCurrentLabel({ ply: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                DIAMETER
              </label>
              <input
                type="text"
                value={currentLabel.dia}
                onChange={e => updateCurrentLabel({ dia: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>
          </div>


          {/* Print Size & Copies Row */}
          <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-[#2c4a4a]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Label Size:
                </label>
                <select
                  value={labelSize}
                  onChange={e => setLabelSize(e.target.value as any)}
                  className="p-1.5 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold cursor-pointer focus:outline-none transition"
                >
                  <option value="4x6">4" x 6" (Thermal Roll 100×150mm)</option>
                  <option value="3x2">3" x 2" (Thermal Roll 75×50mm)</option>
                  <option value="a4">A4 Sheet (Office Printer / Centered)</option>
                  <option value="auto">Auto (Printer Driver Default)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Copies for Label #{activeLabelIndex + 1}:
                </span>
                {[1, 2, 4].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateCurrentLabel({ copies: c })}
                    className={`px-3 py-1 rounded-xl font-bold text-xs transition cursor-pointer ${
                      currentLabel.copies === c
                        ? 'bg-[#6C4FE0] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {c}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Thermal Sticker Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between w-full max-w-[380px]">
            <span>Live Sticker Preview (#{activeLabelIndex + 1})</span>
            <span className="text-[10px] text-blue-500 font-bold">
              {labelSize === '4x6' ? '4x6 inch Thermal' : labelSize === '3x2' ? '3x2 inch' : 'A4 Centered'}
            </span>
          </div>

          <div className="w-full flex flex-col items-center">
            {/* 4x6 Thermal Sticker Preview Canvas */}
            <div
              className={`w-full flex flex-col items-center transition-all ${
                labelSize === '4x6' ? 'justify-end pt-12 pb-2' : 'justify-center py-2'
              }`}
              style={{
                maxWidth: '380px',
                minHeight: labelSize === '4x6' ? '560px' : 'auto',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              }}
            >
              <div id="printable-label-card" className="w-full flex justify-center print:hidden">
                <ReelPrintLabel
                  gsm={currentLabel.gsm}
                  width={currentLabel.sizeWidth}
                  dia={currentLabel.dia}
                  core={currentLabel.core}
                  ply={currentLabel.ply}
                  weight={currentLabel.netWeightKg ? `${currentLabel.netWeightKg} KG` : ''}
                  rollNo={currentLabel.rollNo}
                  quality={currentLabel.productTitle}
                  customDescription={currentLabel.customDescription}
                  shade={currentLabel.shade}
                  jointCount={currentLabel.joint}
                  reelNo={currentLabel.barcodeNo}
                  qrValue={activeQrCodeValue}
                />
              </div>
            </div>
          </div>

          {/* Dual Action Buttons: Print Current & Print All */}
          <div className="w-full mt-4 space-y-2.5" style={{ maxWidth: '380px' }}>
            {/* Primary: Print Current Label */}
            <button
              type="button"
              onClick={handlePrintCurrent}
              disabled={isViewer}
              title={isViewer ? "Sticker printing is locked for Viewer (Read-Only Mode)" : `Print ${currentLabel.copies || 1}x Thermal Sticker Now`}
              className={`w-full font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 ${
                isViewer
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-[#008163] hover:bg-[#006e54] text-white shadow-[#008163]/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
              }`}
            >
              {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Printer className="h-4 w-4" />}
              <span>
                {isViewer ? 'Print Sticker (Locked for Viewer)' : `Print Current (${currentLabel.copies || 1}x Thermal Sticker)`}
              </span>
            </button>

            {/* Secondary: Print All Labels in Batch */}
            <button
              type="button"
              onClick={handlePrintAll}
              disabled={isViewer}
              title={isViewer ? "Batch printing is locked for Viewer (Read-Only Mode)" : `Print All ${totalBatchStickers} Stickers`}
              className={`w-full font-black py-3 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 ${
                isViewer
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-[#6C4FE0] hover:bg-[#5a3ec8] text-white shadow-[#6C4FE0]/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
              }`}
            >
              <Layers className="h-4 w-4 text-white" />
              <span>
                Print All ({labels.length} {labels.length === 1 ? 'Label' : 'Labels'} · {totalBatchStickers} Total)
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Print Portal: Renders onto document.body for native browser printing */}
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
                body > #root {
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
            {(printTarget === 'current' ? [currentLabel] : labels).flatMap((labelItem, labelIdx, arr) => {
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
    </div>
  );
};

export default LabelStudioView;

