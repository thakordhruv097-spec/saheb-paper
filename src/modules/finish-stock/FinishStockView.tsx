import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getReels, updateReelQC } from '../../data/index';
import type { Reel } from '../../data/types';
import {
  Package,
  Clipboard,
  CheckSquare,
  ListFilter,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Check,
  Eye,
  Beaker,
  Lock,
} from 'lucide-react';
import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useDataSync } from '../../hooks/useDataSync';
import { CustomSearchableSelect } from '../../components/CustomSearchableSelect';

interface FinishStockViewProps {
  hideHeader?: boolean;
}

export const FinishStockView: React.FC<FinishStockViewProps> = ({ hideHeader = false }) => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();

  const [reels, setReels] = useState<Reel[]>(() => getReels());
  const syncTick = useDataSync(['reels', 'packing_slips']);

  useEffect(() => {
    setReels(getReels());
  }, [syncTick]);

  const [activeTab, setActiveTab] = useState<'all' | 'in_stock' | 'pending_qc' | 'dispatched'>('all');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Filter States
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterProduct, setFilterProduct] = useState<string>('ALL');
  const [filterGsm, setFilterGsm] = useState<string>('ALL');
  const [filterSize, setFilterSize] = useState<string>('ALL');
  const [filterPly, setFilterPly] = useState<string>('ALL');
  const [filterJoint, setFilterJoint] = useState<string>('ALL');

  // QC Form & Inspection Details States
  const [inspectingReel, setInspectingReel] = useState<Reel | null>(null);
  const [qcGrade, setQcGrade] = useState<'A' | 'B'>('A');
  const [gsmResult, setGsmResult] = useState('');
  const [brightness, setBrightness] = useState('');
  const [softness, setSoftness] = useState('7');
  const [inspector, setInspector] = useState(user?.displayName || '');
  const [qcError, setQcError] = useState('');

  // Lock background layout & body scroll whenever modal is open
  useBodyScrollLock(!!inspectingReel || showFilterModal);

  // Softness input ref for strict click-to-scroll wheel listener
  const softnessInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = softnessInputRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // ONLY change value if user clicked in / focused on the input!
      if (document.activeElement === el) {
        e.preventDefault();
        setSoftness(prev => {
          const current = parseInt(prev, 10) || 1;
          const delta = e.deltaY < 0 ? 1 : -1;
          const next = Math.min(10, Math.max(1, current + delta));
          return String(next);
        });
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [inspectingReel]);

  // Safe Reels list with robust property fallbacks to prevent any null/undefined runtime errors
  const safeReels = useMemo(() => {
    return (reels || []).map(r => ({
      ...r,
      reelNo: r?.reelNo || 'R-0000',
      parentRollNo: r?.parentRollNo || 'M-001',
      product: r?.product || 'Napkin Tissue',
      gsm: Number(r?.gsm) || 16,
      size: Number(r?.size) || 30,
      ply: Number(r?.ply) || 1,
      weight: Number(r?.weight) || 0,
      joint: Number(r?.joint) || 0,
      status: r?.status || 'IN_STOCK',
      productionDate: r?.productionDate || '2026-08-16 00:00',
    }));
  }, [reels]);

  // 1. Base Reels for Active Tab (Status filter: In-Warehouse Stock, Ready Stock, Pending QC, Dispatched)
  const tabReels = useMemo(() => {
    return safeReels.filter(r => {
      if (activeTab === 'all') return r.status !== 'DISPATCHED' && r.status !== 'DELIVERED';
      if (activeTab === 'in_stock') return r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B';
      if (activeTab === 'pending_qc') return r.status === 'QC_PENDING';
      if (activeTab === 'dispatched') return r.status === 'DISPATCHED' || r.status === 'DELIVERED';
      return r.status !== 'DISPATCHED' && r.status !== 'DELIVERED';
    });
  }, [safeReels, activeTab]);

  // 2. Dynamic Available Options
  const availableProducts = useMemo(() => {
    return Array.from(new Set(tabReels.map(r => r.product))).sort();
  }, [tabReels]);

  const availableGsms = useMemo(() => {
    return Array.from(new Set(tabReels.map(r => r.gsm))).sort((a, b) => a - b);
  }, [tabReels]);

  const availableSizes = useMemo(() => {
    return Array.from(new Set(tabReels.map(r => r.size))).sort((a, b) => a - b);
  }, [tabReels]);

  const availablePlys = useMemo(() => {
    return Array.from(new Set(tabReels.map(r => r.ply))).sort((a, b) => a - b);
  }, [tabReels]);

  const availableJoints = useMemo(() => {
    const set = new Set(tabReels.map(r => r.joint));
    set.add(0);
    set.add(1);
    set.add(2);
    return Array.from(set).sort((a, b) => a - b);
  }, [tabReels]);

  // Faceted match count helpers for smooth interactive chips
  const getProductMatchCount = (prod: string) => {
    return tabReels.filter(r =>
      (filterGsm === 'ALL' || r.gsm === Number(filterGsm)) &&
      (filterSize === 'ALL' || r.size === Number(filterSize)) &&
      (filterPly === 'ALL' || r.ply === Number(filterPly)) &&
      (filterJoint === 'ALL' || r.joint === Number(filterJoint)) &&
      r.product === prod
    ).length;
  };

  const getGsmMatchCount = (gsmVal: number) => {
    return tabReels.filter(r =>
      (filterProduct === 'ALL' || r.product === filterProduct) &&
      (filterSize === 'ALL' || r.size === Number(filterSize)) &&
      (filterPly === 'ALL' || r.ply === Number(filterPly)) &&
      (filterJoint === 'ALL' || r.joint === Number(filterJoint)) &&
      r.gsm === gsmVal
    ).length;
  };

  const getSizeMatchCount = (sizeVal: number) => {
    return tabReels.filter(r =>
      (filterProduct === 'ALL' || r.product === filterProduct) &&
      (filterGsm === 'ALL' || r.gsm === Number(filterGsm)) &&
      (filterPly === 'ALL' || r.ply === Number(filterPly)) &&
      (filterJoint === 'ALL' || r.joint === Number(filterJoint)) &&
      r.size === sizeVal
    ).length;
  };

  const getPlyMatchCount = (plyVal: number) => {
    return tabReels.filter(r =>
      (filterProduct === 'ALL' || r.product === filterProduct) &&
      (filterGsm === 'ALL' || r.gsm === Number(filterGsm)) &&
      (filterSize === 'ALL' || r.size === Number(filterSize)) &&
      (filterJoint === 'ALL' || r.joint === Number(filterJoint)) &&
      r.ply === plyVal
    ).length;
  };

  const getJointMatchCount = (jointVal: number) => {
    return tabReels.filter(r =>
      (filterProduct === 'ALL' || r.product === filterProduct) &&
      (filterGsm === 'ALL' || r.gsm === Number(filterGsm)) &&
      (filterSize === 'ALL' || r.size === Number(filterSize)) &&
      (filterPly === 'ALL' || r.ply === Number(filterPly)) &&
      r.joint === jointVal
    ).length;
  };

  // Handlers for Smooth Selection (clicking active toggles back to ALL without wiping other filters)
  const handleProductChange = (prod: string) => {
    setFilterProduct(prev => (prev === prod ? 'ALL' : prod));
  };

  const handleGsmChange = (gsmVal: string) => {
    setFilterGsm(prev => (prev === gsmVal ? 'ALL' : gsmVal));
  };

  const handleSizeChange = (sizeVal: string) => {
    setFilterSize(prev => (prev === sizeVal ? 'ALL' : sizeVal));
  };

  const handlePlyChange = (plyVal: string) => {
    setFilterPly(prev => (prev === plyVal ? 'ALL' : plyVal));
  };

  const handleJointChange = (jointVal: string) => {
    setFilterJoint(prev => (prev === jointVal ? 'ALL' : jointVal));
  };

  const handleClearAllFilters = () => {
    setFilterProduct('ALL');
    setFilterGsm('ALL');
    setFilterSize('ALL');
    setFilterPly('ALL');
    setFilterJoint('ALL');
    setActiveTab('all');
    setStockSearchQuery('');
  };

  const totalInStockKg = useMemo(() => safeReels.filter(r => r.status !== 'DISPATCHED' && r.status !== 'DELIVERED').reduce((acc, r) => acc + (r.weight || 0), 0), [safeReels]);
  const totalInStockCount = useMemo(() => safeReels.filter(r => r.status !== 'DISPATCHED' && r.status !== 'DELIVERED').length, [safeReels]);
  const readyStockCount = useMemo(() => safeReels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B').length, [safeReels]);
  const pendingQcCount = useMemo(() => safeReels.filter(r => r.status === 'QC_PENDING').length, [safeReels]);
  const dispatchedCount = useMemo(() => safeReels.filter(r => r.status === 'DISPATCHED' || r.status === 'DELIVERED').length, [safeReels]);

  // 1-Click Bulk QC Approval
  const handleBulkApproveAll = () => {
    if (isViewer) return;
    const pending = reels.filter(r => r.status === 'QC_PENDING' || !r.qcGrade || r.qcGrade === 'PENDING');
    if (pending.length === 0) return;
    pending.forEach(r => {
      updateReelQC(
        r.reelNo,
        'A',
        r.gsm || 18,
        85,
        8,
        user?.displayName || 'QC Inspector'
      );
    });
    setReels(getReels());
    setActiveTab('all');
    handleClearAllFilters();
  };

  // 3. Filtered Matching Reels List
  const matchingFilteredList = useMemo(() => {
    let list = [...tabReels];

    // Progressive / Faceted filters
    if (filterProduct !== 'ALL') list = list.filter(r => r.product === filterProduct);
    if (filterGsm !== 'ALL') list = list.filter(r => r.gsm === Number(filterGsm));
    if (filterSize !== 'ALL') list = list.filter(r => r.size === Number(filterSize));
    if (filterPly !== 'ALL') list = list.filter(r => r.ply === Number(filterPly));
    if (filterJoint !== 'ALL') list = list.filter(r => r.joint === Number(filterJoint));

    // Free-text Search
    if (stockSearchQuery.trim()) {
      const q = stockSearchQuery.toLowerCase().trim();
      list = list.filter(r =>
        r.product.toLowerCase().includes(q) ||
        String(r.gsm).includes(q) ||
        String(r.size).includes(q) ||
        String(r.ply).includes(q) ||
        String(r.joint).includes(q) ||
        `${r.joint} joint`.includes(q) ||
        `${r.joint} joints`.includes(q) ||
        r.reelNo.toLowerCase().includes(q)
      );
    }

    // Sort descending by reel number
    list.sort((a, b) => b.reelNo.localeCompare(a.reelNo));
    return list;
  }, [tabReels, filterProduct, filterGsm, filterSize, filterPly, filterJoint, stockSearchQuery]);

  // Total matching statistics
  const matchingTotalWeightKg = useMemo(() => {
    return matchingFilteredList.reduce((acc, r) => acc + r.weight, 0);
  }, [matchingFilteredList]);

  const matchingTotalWeightMT = (matchingTotalWeightKg / 1000).toFixed(2);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filterProduct !== 'ALL') c++;
    if (filterGsm !== 'ALL') c++;
    if (filterSize !== 'ALL') c++;
    if (filterPly !== 'ALL') c++;
    if (filterJoint !== 'ALL') c++;
    if (activeTab !== 'all') c++;
    if (stockSearchQuery.trim()) c++;
    return c;
  }, [filterProduct, filterGsm, filterSize, filterPly, filterJoint, activeTab, stockSearchQuery]);

  // 4. Grouped Stock View (Product -> GSM -> Size -> Ply)
  const groupedStock = useMemo(() => {
    const groups: Record<string, {
      product: string;
      gsm: number;
      size: number;
      ply: number;
      reels: Reel[];
      totalWeight: number;
    }> = {};

    matchingFilteredList.forEach(r => {
      const key = `${r.product}-${r.gsm}-${r.size}-${r.ply}`;
      if (!groups[key]) {
        groups[key] = {
          product: r.product,
          gsm: r.gsm,
          size: r.size,
          ply: r.ply,
          reels: [],
          totalWeight: 0,
        };
      }
      groups[key].reels.push(r);
      groups[key].totalWeight += r.weight;
    });

    return Object.values(groups);
  }, [matchingFilteredList]);

  const handleInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQcError('');

    if (isViewer) {
      setQcError('Viewer Mode: Data modification is locked (Read-Only)');
      return;
    }

    if (!inspectingReel) return;

    const gsmNum = parseFloat(gsmResult);
    const brightNum = parseFloat(brightness);
    const softNum = parseInt(softness);

    if (isNaN(gsmNum) || isNaN(brightNum) || isNaN(softNum)) {
      setQcError('Please enter valid numeric QC specifications');
      return;
    }

    if (gsmNum <= 0 || brightNum < 0 || brightNum > 100 || softNum < 1 || softNum > 10) {
      setQcError('Ensure GSM > 0, Brightness between 0-100, Softness between 1-10');
      return;
    }

    const success = updateReelQC(
      inspectingReel.reelNo,
      qcGrade,
      gsmNum,
      brightNum,
      softNum,
      inspector || 'QC Inspector'
    );

    if (success) {
      setReels(getReels());
      setInspectingReel(null);
      setGsmResult('');
      setBrightness('');
      setSoftness('7');
    } else {
      setQcError('QC submission failed');
    }
  };

  const hasQcWriteAccess = user?.role === 'Admin' || user?.role === 'RewinderOperator';

  return (
    <div className="space-y-6 font-sans pb-12 text-left">
      
      {/* 1. CLEAN MINIMAL HEADER CARD */}
      {!hideHeader && (
        <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
                <Package className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                    {t('finish_stock.title')}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Browse finished reels inventory with fast multi-attribute filtering (Product, GSM, Size, Ply, Joints, Status).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilterModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs transition cursor-pointer flex items-center gap-2 border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <SlidersHorizontal className="h-4 w-4 text-primary dark:text-blue-400" />
                <span>Cascading Filter</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-black">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. TOP METRIC SCORECARDS (INTERACTIVE QUICK STATUS FILTERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'in_stock' ? 'all' : 'in_stock')}
          className={`neumorphic-card p-5 flex items-center gap-4 text-left transition cursor-pointer ${
            activeTab === 'in_stock'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40'
              : 'hover:border-emerald-300'
          }`}
        >
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Warehouse Stock</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalInStockKg.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kg ({(totalInStockKg / 1000).toFixed(2)} MT)</span>
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`neumorphic-card p-5 flex items-center gap-4 text-left transition cursor-pointer ${
            activeTab === 'all'
              ? 'ring-2 ring-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
              : 'hover:border-blue-300'
          }`}
        >
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-primary dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Reels in Stock</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalInStockCount} <span className="text-xs text-slate-400 font-normal">reels</span>
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'pending_qc' ? 'all' : 'pending_qc')}
          className={`neumorphic-card p-5 flex items-center gap-4 text-left transition cursor-pointer ${
            activeTab === 'pending_qc'
              ? 'ring-2 ring-purple-500 bg-purple-50/70 dark:bg-purple-950/40'
              : 'hover:border-purple-300'
          }`}
        >
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 relative">
            <Clipboard className="h-6 w-6" />
            {pendingQcCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-500 animate-ping" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending QC Inspection</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {pendingQcCount} <span className="text-xs text-slate-400 font-normal">reels</span>
            </p>
          </div>
        </button>
      </div>

      {/* 2.5 QUICK QC APPROVAL BANNER (IF ANY REELS PENDING) */}
      {pendingQcCount > 0 && (
        <div className="p-4 sm:p-5 bg-white dark:bg-[#131d38] border border-blue-200/80 dark:border-blue-900/60 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50 shrink-0">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Quality Inspection &amp; Stock Verification</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-[10px] font-black">
                  {pendingQcCount} Reels Pending
                </span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                Reels slit in Rewinder need QC inspection before they can be loaded onto customer delivery challans.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleBulkApproveAll}
              disabled={isViewer}
              title={isViewer ? 'Viewer Mode: 1-Click QC approval is locked (Read-Only)' : '1-Click Approve All'}
              className={`w-full sm:w-auto px-5 py-2.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl font-black transition ${
                isViewer
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                  : 'btn-primary-gradient cursor-pointer'
              }`}
            >
              {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <CheckSquare className="h-4 w-4" />}
              <span>{isViewer ? '1-Click Approve All (Locked)' : '1-Click Approve All'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. CLEAN & STREAMLINED FILTER TOOLBAR */}
      <div className="bg-white dark:bg-[#131d38] border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs space-y-3">
        
        {/* Top Row: Search Input + Status Tabs + Reset Button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="flex items-center gap-2 flex-1 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={stockSearchQuery}
              onChange={e => setStockSearchQuery(e.target.value)}
              placeholder="Search product, GSM, size, ply, joints, or reel no..."
              className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
            />
            {stockSearchQuery && (
              <button
                type="button"
                onClick={() => setStockSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              In Warehouse <span className="text-[10px] opacity-75 font-mono ml-0.5">({totalInStockCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('in_stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'in_stock'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400'
              }`}
            >
              Ready Stock <span className="text-[10px] opacity-75 font-mono ml-0.5">({readyStockCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pending_qc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'pending_qc'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400'
              }`}
            >
              Pending QC <span className="text-[10px] opacity-75 font-mono ml-0.5">({pendingQcCount})</span>
            </button>

            {dispatchedCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('dispatched')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'dispatched'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400'
                }`}
              >
                Dispatched <span className="text-[10px] opacity-75 font-mono ml-0.5">({dispatchedCount})</span>
              </button>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 border border-red-200 dark:border-red-800/60 shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid: Product, GSM, Size, Ply, Joints */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Product Dropdown */}
          <div className="relative">
            <select
              value={filterProduct}
              onChange={e => setFilterProduct(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold border transition appearance-none cursor-pointer pr-7 ${
                filterProduct !== 'ALL'
                  ? 'bg-primary/10 dark:bg-primary/20 border-primary text-primary dark:text-blue-300 font-extrabold'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <option value="ALL">All Products ({tabReels.length})</option>
              {availableProducts.map(prod => (
                <option key={prod} value={prod}>
                  {prod} ({getProductMatchCount(prod)})
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* GSM Dropdown */}
          <div className="relative">
            <select
              value={filterGsm}
              onChange={e => setFilterGsm(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold border transition appearance-none cursor-pointer pr-7 ${
                filterGsm !== 'ALL'
                  ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300 font-extrabold'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <option value="ALL">All GSM</option>
              {availableGsms.map(gsm => (
                <option key={gsm} value={String(gsm)}>
                  {gsm} GSM ({getGsmMatchCount(gsm)})
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Size Dropdown */}
          <div className="relative">
            <select
              value={filterSize}
              onChange={e => setFilterSize(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold border transition appearance-none cursor-pointer pr-7 ${
                filterSize !== 'ALL'
                  ? 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300 font-extrabold'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <option value="ALL">All Sizes</option>
              {availableSizes.map(size => (
                <option key={size} value={String(size)}>
                  {size} cm ({getSizeMatchCount(size)})
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Ply Dropdown */}
          <div className="relative">
            <select
              value={filterPly}
              onChange={e => setFilterPly(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold border transition appearance-none cursor-pointer pr-7 ${
                filterPly !== 'ALL'
                  ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-extrabold'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <option value="ALL">All Ply</option>
              {availablePlys.map(ply => (
                <option key={ply} value={String(ply)}>
                  {ply} Ply ({getPlyMatchCount(ply)})
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Joints Dropdown */}
          <div className="relative col-span-2 sm:col-span-1">
            <select
              value={filterJoint}
              onChange={e => setFilterJoint(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold border transition appearance-none cursor-pointer pr-7 ${
                filterJoint !== 'ALL'
                  ? 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-extrabold'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <option value="ALL">All Joints</option>
              {availableJoints.map(jointVal => (
                <option key={jointVal} value={String(jointVal)}>
                  {jointVal === 0 ? '0 Joints (Seamless)' : jointVal === 1 ? '1 Joint' : `${jointVal} Joints`} ({getJointMatchCount(jointVal)})
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Grouped Stock View */}
      {groupedStock.length === 0 ? (
        <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 sm:p-12 text-center text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm flex flex-col items-center justify-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          
          {activeTab === 'in_stock' && pendingQcCount > 0 && totalInStockCount === 0 ? (
            <div className="space-y-2 max-w-md">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                All {pendingQcCount} Reels are currently in "Pending QC Inspection"
              </h4>
              <p className="text-xs text-slate-500">
                They need to be inspected before they appear in ready stock. Click below to inspect them or 1-Click Approve all reels.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pending_qc')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer transition"
                >
                  View Pending Inspection ({pendingQcCount})
                </button>
                <button
                  type="button"
                  onClick={handleBulkApproveAll}
                  className="px-4 py-2 bg-[#008163] hover:bg-[#006e54] text-white rounded-xl text-xs font-black shadow-sm cursor-pointer transition flex items-center gap-1.5"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>1-Click Approve All</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                No reels matching your filter selection currently in inventory.
              </p>
              {(activeFilterCount > 0 || activeTab !== 'all' || stockSearchQuery.trim()) && (
                <button
                  onClick={handleClearAllFilters}
                  className="mt-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black shadow-sm cursor-pointer transition"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedStock.map((group, index) => (
            <div key={index} className="neumorphic-card overflow-hidden">
              {/* Group Header */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {group.product} (GSM {group.gsm} | {group.size} cm | {group.ply} Ply)
                  </h4>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                  <div>Quantity: <span className="text-primary dark:text-blue-400 font-black">{group.reels.length}</span></div>
                  <div>Total Weight: <span className="text-emerald-600 dark:text-emerald-400 font-black">{group.totalWeight} kg</span></div>
                </div>
              </div>

              {/* Group Reels List - Desktop View */}
              {(() => {
                const groupKey = `${group.product}-${group.gsm}-${group.size}-${group.ply}-${index}`;
                const isExpanded = !!expandedGroups[groupKey];
                const displayedReels = isExpanded ? group.reels : group.reels.slice(0, 5);

                return (
                  <div className="hidden md:block p-4 space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                            <th className="py-3 px-3">Reel Number</th>
                            <th className="py-3 px-3">Weight</th>
                            <th className="py-3 px-3">Joints</th>
                            <th className="py-3 px-3">Produced Date</th>
                            <th className="py-3 px-3 text-right">Actions / Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                          {displayedReels.map(reel => (
                            <tr key={reel.reelNo} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition">
                              <td className="py-3 px-3 font-black font-mono text-primary dark:text-blue-400">{reel.reelNo}</td>
                              <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">{reel.weight} kg</td>
                              <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-bold">{reel.joint}</td>
                              <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                                {reel.productionDate}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {reel.status === 'QC_PENDING' ? (
                                  hasQcWriteAccess || isViewer ? (
                                    <button
                                      onClick={() => {
                                        setInspectingReel(reel);
                                        setGsmResult(String(reel.gsm));
                                        setQcGrade('A');
                                      }}
                                      className="px-3.5 py-1.5 bg-[#008163] hover:bg-[#006e54] text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm cursor-pointer"
                                    >
                                      {isViewer ? 'QC View' : 'QC Test'}
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-purple-600 dark:text-purple-300 font-black uppercase bg-purple-100 dark:bg-purple-950/40 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                                      Pending QC
                                    </span>
                                  )
                                ) : (
                                  <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold">
                                    <span className="px-2.5 py-1 rounded-full font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                      In Stock
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {group.reels.length > 5 && (
                      <div className="pt-2 flex justify-center border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setExpandedGroups(prev => ({
                            ...prev,
                            [groupKey]: !isExpanded
                          }))}
                          className="px-4 py-2 text-xs font-black text-primary dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800/60 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4" /> Show Less ({group.reels.length} total)
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" /> View All {group.reels.length} Reels
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Group Reels List - Mobile Stacked Cards View */}
              <div className="block md:hidden p-4 space-y-3">
                {(() => {
                  const groupKey = `${group.product}-${group.gsm}-${group.size}-${group.ply}-${index}`;
                  const isExpanded = !!expandedGroups[groupKey];
                  const displayedReels = isExpanded ? group.reels : group.reels.slice(0, 3);
                  return (
                    <>
                      {displayedReels.map(reel => (
                        <div key={reel.reelNo} className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-xs text-left">
                          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
                            <span className="font-mono font-black text-primary dark:text-blue-400 text-xs">{reel.reelNo}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              reel.status === 'QC_PENDING' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' :
                              'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            }`}>
                              {reel.status === 'QC_PENDING' ? 'Pending QC' : 'In Stock'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                            <div>
                              <span className="font-bold text-slate-400 uppercase text-[9px] block">Weight</span>
                              <span className="font-black text-slate-900 dark:text-white">{reel.weight} kg</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase text-[9px] block">Joints</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{reel.joint}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase text-[9px] block">Produced</span>
                              <span className="font-mono text-slate-500">{reel.productionDate}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center">
                            {reel.status === 'QC_PENDING' ? (
                              hasQcWriteAccess || isViewer ? (
                                <button
                                  onClick={() => {
                                    setInspectingReel(reel);
                                    setGsmResult(String(reel.gsm));
                                    setQcGrade('A');
                                  }}
                                  className="px-3.5 py-1.5 bg-[#008163] hover:bg-[#006e54] text-white rounded-xl text-[10px] font-black uppercase shadow-xs cursor-pointer"
                                >
                                  {isViewer ? 'QC View' : 'QC Test'}
                                </button>
                              ) : (
                                <span className="text-[10px] text-purple-600 dark:text-purple-300 font-black uppercase bg-purple-100 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full">
                                  Pending QC
                                </span>
                              )
                            ) : (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                <span className="px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                  In Stock
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {group.reels.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setExpandedGroups(prev => ({
                            ...prev,
                            [groupKey]: !isExpanded
                          }))}
                          className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-primary dark:text-blue-400 font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs mt-2"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5" />
                              <span>Show Less</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" />
                              <span>View More ({group.reels.length - 3} remaining)</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== CASCADING FILTER POPUP MODAL ===== */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3.5 dark:border-slate-700">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary dark:text-blue-400" />
                  Inventory Cascading Filter
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select Product → GSM → Size → Ply → Joints to view matching inventory
                </p>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* LIVE MATCHING STATS BANNER */}
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-slate-900 dark:text-white shadow-2xs space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-primary dark:text-blue-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Live Filter Results
              </div>
              <div className="text-xl font-black font-mono">
                {matchingFilteredList.length} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Reels</span>
                <span className="mx-2 opacity-40">|</span>
                {matchingTotalWeightKg.toLocaleString()} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">kg ({matchingTotalWeightMT} MT)</span>
              </div>
            </div>

            {/* CASCADING DROPDOWN INPUTS */}
            <div className="space-y-4">
              
              {/* STEP 1: PRODUCT */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>1. Select Product</span>
                  {filterProduct !== 'ALL' && (
                    <span className="text-[10px] text-primary font-bold">Selected</span>
                  )}
                </label>
                <CustomSearchableSelect
                  value={filterProduct}
                  onChange={handleProductChange}
                  options={[
                    { value: 'ALL', label: `All Products (${availableProducts.length})` },
                    ...availableProducts.map(p => ({ value: p, label: p })),
                  ]}
                  placeholder="Select Product..."
                />
              </div>

              {/* STEP 2: GSM */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>2. Select GSM</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {filterProduct !== 'ALL' ? `Cascaded for ${filterProduct}` : 'All GSMs'}
                  </span>
                </label>
                <CustomSearchableSelect
                  value={filterGsm}
                  onChange={handleGsmChange}
                  options={[
                    { value: 'ALL', label: `All GSMs (${availableGsms.length} available)` },
                    ...availableGsms.map(g => ({ value: String(g), label: `GSM ${g}` })),
                  ]}
                  placeholder="Select GSM..."
                />
              </div>

              {/* STEP 3: SIZE */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>3. Select Size (cm)</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {filterGsm !== 'ALL' ? `Cascaded for GSM ${filterGsm}` : 'All Sizes'}
                  </span>
                </label>
                <CustomSearchableSelect
                  value={filterSize}
                  onChange={handleSizeChange}
                  options={[
                    { value: 'ALL', label: `All Sizes (${availableSizes.length} available)` },
                    ...availableSizes.map(s => ({ value: String(s), label: `${s} cm` })),
                  ]}
                  placeholder="Select Size..."
                />
              </div>

              {/* STEP 4: PLY */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>4. Select Ply</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {filterSize !== 'ALL' ? `Cascaded for Size ${filterSize} cm` : 'All Ply'}
                  </span>
                </label>
                <CustomSearchableSelect
                  value={filterPly}
                  onChange={handlePlyChange}
                  options={[
                    { value: 'ALL', label: `All Ply (${availablePlys.length} available)` },
                    ...availablePlys.map(p => ({ value: String(p), label: `${p} Ply` })),
                  ]}
                  placeholder="Select Ply..."
                  hideSearch
                />
              </div>

              {/* STEP 5: JOINTS */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>5. Select Joints</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    0, 1, or 2 joints
                  </span>
                </label>
                <CustomSearchableSelect
                  value={filterJoint}
                  onChange={handleJointChange}
                  options={[
                    { value: 'ALL', label: 'All Joints' },
                    { value: '0', label: '0 Joints (Seamless)' },
                    { value: '1', label: '1 Joint' },
                    { value: '2', label: '2 Joints' },
                  ]}
                  placeholder="Select Joints..."
                  hideSearch
                />
              </div>

            </div>

            {/* MODAL FOOTER ACTIONS */}
            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-4 py-3 rounded-2xl text-xs font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <RotateCcw className="h-4 w-4" /> Clear All
              </button>

              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Apply &amp; View ({matchingFilteredList.length} Reels)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QC Test Inspection Modal */}
      {inspectingReel && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overscroll-contain"
          onWheel={(e) => {
            // Prevent wheel event from bubbling to background
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <div className="bg-white dark:bg-surface-dark rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left" onClick={(e) => e.stopPropagation()}>
            
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {t('finish_stock.qc_inspect')}
              </h3>
              <button
                onClick={() => setInspectingReel(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleInspectSubmit} className="space-y-4">
              {qcError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-2xl border border-red-200 font-bold">
                  {qcError}
                </div>
              )}

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <p><span className="font-bold text-slate-400 uppercase text-[10px]">Reel No:</span> <span className="font-black font-mono text-primary dark:text-blue-400">{inspectingReel.reelNo}</span></p>
                <p><span className="font-bold text-slate-400 uppercase text-[10px]">Product:</span> <span className="font-bold text-slate-900 dark:text-white">{inspectingReel.product}</span></p>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Inspection Grade Decision
                </label>
                <CustomSearchableSelect
                  value={qcGrade}
                  onChange={val => setQcGrade(val as 'A' | 'B')}
                  options={[
                    { value: 'A', label: 'QC PASS - Grade A (Standard Stock)', badge: 'PASS', badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
                    { value: 'B', label: 'QC FAIL - Grade B (B-Grade Stock)', badge: 'FAIL', badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20' },
                  ]}
                  hideSearch
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Tested GSM
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={gsmResult}
                    onChange={e => setGsmResult(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    placeholder="18"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('finish_stock.brightness')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={brightness}
                    onChange={e => setBrightness(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    placeholder="85"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Softness (1-10)
                  </label>
                  <input
                    ref={softnessInputRef}
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={softness}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        setSoftness('');
                        return;
                      }
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) {
                        if (num > 10) setSoftness('10');
                        else if (num < 1) setSoftness('1');
                        else setSoftness(String(num));
                      }
                    }}
                    onBlur={() => {
                      const num = parseInt(String(softness), 10);
                      if (isNaN(num) || num < 1) setSoftness('1');
                      else if (num > 10) setSoftness('10');
                    }}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    placeholder="7"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Inspector Name
                  </label>
                  <input
                    type="text"
                    value={inspector}
                    onChange={e => setInspector(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isViewer}
                title={isViewer ? 'Viewer Mode: Submitting QC inspection is locked (Read-Only)' : 'Submit Quality Inspection Log'}
                className={`w-full py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl font-black transition ${
                  isViewer
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                    : 'btn-primary-gradient cursor-pointer'
                }`}
              >
                {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Check className="h-4 w-4" />}
                <span>{isViewer ? 'Submit Quality Inspection Log (Locked)' : 'Submit Quality Inspection Log'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinishStockView;
