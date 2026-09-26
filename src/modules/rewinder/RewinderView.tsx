import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getRolls, getReels, getProducts, saveSingleReel, saveReelsFromRoll, markRollAsConsumed } from '../../data/index';
import type { MachineRoll, Reel } from '../../data/types';
import { CustomSearchableSelect } from '../../components/CustomSearchableSelect';
import { QRCodeSVG } from 'qrcode.react';
import {
  RotateCw,
  Play,
  Plus,
  Trash2,
  Printer,
  CheckCircle,
  Scissors,
  RefreshCw,
  PackageCheck,
  Filter,
  X,
  AlertCircle,
  Search,
  SlidersHorizontal,
  Layers,
  RotateCcw,
  AlertTriangle,
  Check,
  Lock,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { COMPANY_CONFIG } from '../../config/company';
import { MobileToast, type ToastMessage } from '../../components/MobileToast';

import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useMobileBackHandler } from '../../hooks/useMobileBackHandler';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';

export const RewinderView: React.FC = () => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();
  const { timeframe, selectedDate } = useDateFilter();

  const [rolls, setRolls] = useState<MachineRoll[]>(() => getRolls());
  const [reels, setReels] = useState<Reel[]>(() => getReels());
  const masterProducts = useMemo(() => getProducts(), []);

  // Listen for storage / data update events to keep rolls and reels in sync
  useEffect(() => {
    const handleSync = () => {
      setRolls(getRolls());
      setReels(getReels());
    };
    window.addEventListener('saheb_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('saheb_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Set of parent roll numbers already consumed/rewound into reels
  const usedRollNos = useMemo(() => {
    const set = new Set<string>();
    reels.forEach(r => {
      if (r.parentRollNo) {
        const parts = r.parentRollNo.split('/').map(p => p.trim().toLowerCase());
        parts.forEach(p => {
          if (p) set.add(p);
        });
      }
    });
    return set;
  }, [reels]);

  // Only rolls that have not yet been consumed or rewound
  const availableRolls = useMemo(() => {
    return rolls.filter(r => {
      if (!r || !r.rollNo) return false;
      const cleanNo = r.rollNo.trim().toLowerCase();
      if ((r as any).status === 'CONSUMED' || (r as any).status === 'REWOUND' || (r as any).isRewound === true) {
        return false;
      }
      if (usedRollNos.has(cleanNo)) {
        return false;
      }
      return true;
    });
  }, [rolls, usedRollNos]);

  // Filter State
  const [selectedProductFilter, setSelectedProductFilter] = useState('all');

  // Helper functions for Reel No auto-increment (Paper Mill YYMMNNNN Format e.g. 26090001)
  const getInitialReelNo = (existingReels: Reel[], offset = 0): string => {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${yy}${mm}`;

    let maxSeq = 0;
    if (existingReels && existingReels.length > 0) {
      existingReels.forEach(r => {
        if (r && r.reelNo) {
          const clean = r.reelNo.trim();
          if (clean.startsWith(prefix) && clean.length === 8) {
            const seq = parseInt(clean.slice(4), 10);
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          } else if (/^\d{8}$/.test(clean)) {
            const seq = parseInt(clean.slice(4), 10);
            if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
          }
        }
      });
    }
    const nextSeq = maxSeq + 1 + offset;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  };

  const parseAndIncrementReelNo = (lastNo: string): string => {
    if (!lastNo || !lastNo.trim()) return getInitialReelNo(getReels());
    const clean = lastNo.trim();
    if (/^\d{8}$/.test(clean)) {
      const prefix = clean.slice(0, 4);
      const seq = parseInt(clean.slice(4), 10);
      return `${prefix}${String(seq + 1).padStart(4, '0')}`;
    }
    const match = clean.match(/^(.*?)(\d+)$/);
    if (match) {
      const p = match[1];
      const n = parseInt(match[2], 10) + 1;
      return `${p}${String(n).padStart(match[2].length, '0')}`;
    }
    return getInitialReelNo(getReels());
  };

  // Add Reel Modal Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [reelForm, setReelForm] = useState({
    reelNo: getInitialReelNo(getReels(), 0),
    runningRollNo: '',
    runningRollNo2: '',
    runningRollNo3: '',
    runningSize: '',
    productName: masterProducts[0]?.name || 'Napkin Tissue',
    gsm: '',
    size: '30',
    ply: '1',
    dia: '',
    joint: '0',
    weightKg: '',
    brokeKg: '0',
  });

  const rollOptions1 = useMemo(() => {
    return availableRolls.map(roll => ({
      value: roll.rollNo,
      label: roll.rollNo,
      sublabel: `${roll.product} • ${roll.gsm} GSM • Width: ${roll.width}mm • Shift ${roll.shift}`,
      badge: `${roll.weight} kg`,
    }));
  }, [availableRolls]);

  const rollOptionsForPly2Roll1 = useMemo(() => {
    return availableRolls
      .filter(r => r.rollNo.trim().toLowerCase() !== (reelForm.runningRollNo2 || '').trim().toLowerCase())
      .map(roll => ({
        value: roll.rollNo,
        label: roll.rollNo,
        sublabel: `${roll.product} • ${roll.gsm} GSM • Width: ${roll.width}mm • Shift ${roll.shift}`,
        badge: `${roll.weight} kg`,
      }));
  }, [availableRolls, reelForm.runningRollNo2]);

  const rollOptionsForPly2Roll2 = useMemo(() => {
    return availableRolls
      .filter(r => r.rollNo.trim().toLowerCase() !== (reelForm.runningRollNo || '').trim().toLowerCase())
      .map(roll => ({
        value: roll.rollNo,
        label: roll.rollNo,
        sublabel: `${roll.product} • ${roll.gsm} GSM • Width: ${roll.width}mm • Shift ${roll.shift}`,
        badge: `${roll.weight} kg`,
      }));
  }, [availableRolls, reelForm.runningRollNo]);

  const [reelsCutCount, setReelsCutCount] = useState<number>(1);
  const [cutReels, setCutReels] = useState<Array<{ id: string; reelNo: string; product?: string; size: string; weightKg: string; joint: string }>>([]);

  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightedReelNos, setHighlightedReelNos] = useState<Set<string>>(new Set());

  // QR Modal State
  const [recentlyGenerated, setRecentlyGenerated] = useState<Reel[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [printFormat, setPrintFormat] = useState<'tsc_4x3' | 'tsc_3x2' | 'tsc_2x2' | 'a4_grid'>('tsc_4x3');

  useMobileBackHandler(isAddModalOpen, () => setIsAddModalOpen(false), 'rewinderAddModal');
  useMobileBackHandler(showQRModal, () => setShowQRModal(false), 'rewinderQRModal');

  // Computed Timeframe Reels & Metrics
  const timeframeReels = useMemo(() => {
    return reels.filter(r => isDateInTimeframe(r.productionDate, selectedDate, timeframe));
  }, [reels, selectedDate, timeframe]);

  const totalReelWeightKg = useMemo(() => timeframeReels.reduce((sum, r) => sum + Number(r.weight || 0), 0), [timeframeReels]);
  const totalBrokeKg = useMemo(() => timeframeReels.reduce((sum, r) => sum + (Number(r.joint || 0) * 15 + 20), 0), [timeframeReels]);
  const netFinishStockKg = useMemo(() => Math.max(0, totalReelWeightKg - totalBrokeKg), [totalReelWeightKg, totalBrokeKg]);

  const netYieldRate = useMemo(() => {
    if (totalReelWeightKg === 0) return '100.0%';
    const totalInput = totalReelWeightKg + totalBrokeKg;
    if (totalInput === 0) return '100.0%';
    return `${((totalReelWeightKg / totalInput) * 100).toFixed(1)}%`;
  }, [totalReelWeightKg, totalBrokeKg]);

  const timeframeSubtitle = useMemo(() => {
    if (timeframe === 'day') return `Day (${selectedDate.split('-').reverse().join('/')})`;
    if (timeframe === 'week') return 'Weekly Production';
    if (timeframe === 'month') return `Month (${selectedDate.substring(0, 7)})`;
    return 'All-Time Total';
  }, [timeframe, selectedDate]);

  // Cascading Filter States
  const [showCascadingModal, setShowCascadingModal] = useState(false);
  const [filterProduct, setFilterProduct] = useState<string>('ALL');
  const [filterGsm, setFilterGsm] = useState<string>('ALL');
  const [filterSize, setFilterSize] = useState<string>('ALL');
  const [filterPly, setFilterPly] = useState<string>('ALL');

  // Lock background scroll when any modal is open
  useBodyScrollLock(isAddModalOpen || showQRModal || showCascadingModal);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const productOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    reels.forEach(r => {
      if (r.product) {
        counts[r.product] = (counts[r.product] || 0) + 1;
      }
    });

    const activeProds = Object.keys(counts).sort();
    return [
      { value: 'all', label: `All Paper Types (${reels.length})` },
      ...activeProds.map(p => ({
        value: p,
        label: `${p} (${counts[p]})`,
      })),
    ];
  }, [reels]);

  // Step 1: Available Products
  const availableProducts = useMemo(() => {
    return Array.from(new Set(reels.map(r => r.product))).sort();
  }, [reels]);

  // Step 2: Available GSMs (Cascaded by selected Product)
  const availableGsms = useMemo(() => {
    let list = reels;
    if (filterProduct !== 'ALL') {
      list = list.filter(r => r.product === filterProduct);
    }
    return Array.from(new Set(list.map(r => r.gsm))).sort((a, b) => a - b);
  }, [reels, filterProduct]);

  // Step 3: Available Sizes (Cascaded by selected Product + GSM)
  const availableSizes = useMemo(() => {
    let list = reels;
    if (filterProduct !== 'ALL') {
      list = list.filter(r => r.product === filterProduct);
    }
    if (filterGsm !== 'ALL') {
      list = list.filter(r => r.gsm === Number(filterGsm));
    }
    return Array.from(new Set(list.map(r => r.size))).sort((a, b) => a - b);
  }, [reels, filterProduct, filterGsm]);

  // Step 4: Available Ply Values (Cascaded by selected Product + GSM + Size)
  const availablePlys = useMemo(() => {
    let list = reels;
    if (filterProduct !== 'ALL') {
      list = list.filter(r => r.product === filterProduct);
    }
    if (filterGsm !== 'ALL') {
      list = list.filter(r => r.gsm === Number(filterGsm));
    }
    if (filterSize !== 'ALL') {
      list = list.filter(r => r.size === Number(filterSize));
    }
    return Array.from(new Set(list.map(r => r.ply))).sort((a, b) => a - b);
  }, [reels, filterProduct, filterGsm, filterSize]);

  // Handlers for Cascading Selection
  const handleProductChange = (prod: string) => {
    setFilterProduct(prod);
    setFilterGsm('ALL');
    setFilterSize('ALL');
    setFilterPly('ALL');
    if (prod !== 'ALL') setSelectedProductFilter(prod);
    else setSelectedProductFilter('all');
  };

  const handleGsmChange = (gsmVal: string) => {
    setFilterGsm(gsmVal);
    setFilterSize('ALL');
    setFilterPly('ALL');
  };

  const handleSizeChange = (sizeVal: string) => {
    setFilterSize(sizeVal);
    setFilterPly('ALL');
  };

  const handlePlyChange = (plyVal: string) => {
    setFilterPly(plyVal);
  };

  const filteredReels = useMemo(() => {
    return reels.filter(r => {
      // 1. Cascading Filters
      if (filterProduct !== 'ALL' && r.product !== filterProduct) return false;
      if (filterGsm !== 'ALL' && r.gsm !== Number(filterGsm)) return false;
      if (filterSize !== 'ALL' && r.size !== Number(filterSize)) return false;
      if (filterPly !== 'ALL' && r.ply !== Number(filterPly)) return false;

      // 2. Paper Type Filter
      if (selectedProductFilter !== 'all' && r.product !== selectedProductFilter) return false;

      // 3. QC Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'QC_PENDING' && r.status !== 'QC_PENDING') return false;
        if (statusFilter === 'GRADE_A' && r.qcGrade !== 'A') return false;
        if (statusFilter === 'GRADE_B' && r.qcGrade !== 'B') return false;
      }

      // 4. Date Filter (Local control: all dates by default, or specific window)
      if (dateFilter === 'today') {
        const todayStr = selectedDate || new Date().toISOString().substring(0, 10);
        if (!r.productionDate?.startsWith(todayStr)) return false;
      } else if (dateFilter === '7days') {
        const target = r.productionDate?.substring(0, 10);
        if (!target) return false;
        const baseDate = selectedDate || new Date().toISOString().substring(0, 10);
        const parts = baseDate.split('-').map(Number);
        const [y, m, d] = parts;
        const startDt = new Date(y, m - 1, d - 6);
        const startStr = `${startDt.getFullYear()}-${String(startDt.getMonth() + 1).padStart(2, '0')}-${String(startDt.getDate()).padStart(2, '0')}`;
        if (target < startStr || target > baseDate) return false;
      } else if (dateFilter === 'month') {
        const monthPrefix = (selectedDate || new Date().toISOString().substring(0, 10)).substring(0, 7);
        if (!r.productionDate?.startsWith(monthPrefix)) return false;
      }

      // 5. Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNo = r.reelNo.toLowerCase().includes(q);
        const matchRoll = r.parentRollNo.toLowerCase().includes(q);
        const matchProduct = r.product.toLowerCase().includes(q);
        const matchGsm = String(r.gsm).includes(q);
        const matchSize = String(r.size).includes(q);
        if (!matchNo && !matchRoll && !matchProduct && !matchGsm && !matchSize) {
          return false;
        }
      }
      return true;
    });
  }, [reels, filterProduct, filterGsm, filterSize, filterPly, selectedProductFilter, statusFilter, dateFilter, searchTerm, selectedDate]);

  // Group filtered reels strictly into single running roll groups (by parentRollNo)
  const groupedBatches = useMemo(() => {
    const groups: {
      batchId: string;
      parentRollNo: string;
      product: string;
      productionDate: string;
      reels: Reel[];
      totalWeight: number;
      totalBroke: number;
      netWeight: number;
    }[] = [];

    [...filteredReels].reverse().forEach(reel => {
      const rollKey = reel.parentRollNo || 'UNKNOWN';
      let group = groups.find(g => g.parentRollNo === rollKey);
      const brokeVal = Number(reel.joint || 0) * 15 + 20;
      const netKg = Math.max(0, reel.weight - brokeVal);

      if (!group) {
        group = {
          batchId: rollKey,
          parentRollNo: rollKey,
          product: reel.product,
          productionDate: reel.productionDate,
          reels: [],
          totalWeight: 0,
          totalBroke: 0,
          netWeight: 0,
        };
        groups.push(group);
      }
      group.reels.push(reel);
      group.totalWeight += reel.weight;
      group.totalBroke += brokeVal;
      group.netWeight += netKg;
      if (reel.productionDate && (!group.productionDate || reel.productionDate > group.productionDate)) {
        group.productionDate = reel.productionDate;
      }
    });

    return groups;
  }, [filteredReels]);

  const activeCascadingFilterCount = useMemo(() => {
    let c = 0;
    if (filterProduct !== 'ALL') c++;
    if (filterGsm !== 'ALL') c++;
    if (filterSize !== 'ALL') c++;
    if (filterPly !== 'ALL') c++;
    return c;
  }, [filterProduct, filterGsm, filterSize, filterPly]);

  const hasActiveFilters = selectedProductFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || searchTerm.trim() !== '' || activeCascadingFilterCount > 0;

  const handleClearFilters = () => {
    setFilterProduct('ALL');
    setFilterGsm('ALL');
    setFilterSize('ALL');
    setFilterPly('ALL');
    setSelectedProductFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setSearchTerm('');
  };

  const formatKgOrTon = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(2)} Tons`;
    }
    return `${kg.toLocaleString()} kg`;
  };

  const formatRunningSize = (width: number | string | undefined): string => {
    if (!width) return '';
    const num = parseFloat(String(width));
    if (isNaN(num)) return '';
    if (num > 999) return String(Math.round(num / 10)); // Convert mm to cm (e.g. 2300 -> 230)
    return String(num);
  };

  const handleOpenAddModal = () => {
    setModalError('');
    const latestReels = getReels();
    const latestRolls = getRolls();
    setReels(latestReels);
    setRolls(latestRolls);
    const nextNo = getInitialReelNo(latestReels, 0);

    // Compute used roll numbers
    const usedNos = new Set<string>();
    latestReels.forEach(r => {
      if (r.parentRollNo) {
        const parts = r.parentRollNo.split('/').map(p => p.trim().toLowerCase());
        parts.forEach(p => { if (p) usedNos.add(p); });
      }
    });

    // Fresh available rolls
    const freshAvailableRolls = latestRolls.filter(r => {
      if (!r || !r.rollNo) return false;
      const cleanNo = r.rollNo.trim().toLowerCase();
      if ((r as any).status === 'CONSUMED' || (r as any).status === 'REWOUND' || (r as any).isRewound === true) return false;
      if (usedNos.has(cleanNo)) return false;
      return true;
    });

    // Reset Reels Cut to 1 reel by default
    setReelsCutCount(1);
    const initialItems = [{
      id: `cut-0-${Date.now()}`,
      reelNo: nextNo,
      size: '30',
      weightKg: '',
      joint: '',
    }];
    setCutReels(initialItems);

    setReelForm({
      reelNo: nextNo,
      runningRollNo: '',
      runningRollNo2: '',
      runningRollNo3: '',
      productName: masterProducts[0]?.name || 'Napkin Tissue',
      gsm: '',
      runningSize: '',
      weightKg: '',
      size: '30',
      ply: '1',
      dia: '',
      joint: '',
      brokeKg: '0',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveSingleReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setModalError('');

    if (isViewer) {
      setToast({
        type: 'error',
        title: 'Action Locked',
        message: 'Viewer Mode: Saving reel conversion is locked. You have read-only access.',
      });
      return;
    }

    if (availableRolls.length === 0) {
      setModalError('No available machine rolls in stock. Please produce rolls in Machine Production first.');
      setToast({
        type: 'warning',
        title: 'No Available Rolls',
        message: 'No available machine rolls in stock to cut.',
      });
      return;
    }

    if (!reelForm.runningRollNo.trim()) {
      setModalError('Please select a Running Roll No');
      setToast({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select a running roll to cut into reels.',
      });
      return;
    }

    const plyVal = parseInt(reelForm.ply) || 1;
    if (plyVal === 2) {
      if (!reelForm.runningRollNo2.trim()) {
        setModalError('Please select Running Roll No 2');
        return;
      }
      if (reelForm.runningRollNo.trim().toLowerCase() === reelForm.runningRollNo2.trim().toLowerCase()) {
        setModalError('Running Roll 1 and Running Roll 2 cannot be the same roll!');
        setToast({
          type: 'warning',
          title: 'Duplicate Rolls',
          message: 'Running Roll 1 and Running Roll 2 cannot be the same roll.',
        });
        return;
      }
    }
    let parentRollStr = reelForm.runningRollNo.trim();
    if (plyVal === 2 && reelForm.runningRollNo2.trim()) {
      parentRollStr = `${reelForm.runningRollNo.trim()} / ${reelForm.runningRollNo2.trim()}`;
    }

    if (!cutReels || cutReels.length === 0) {
      setModalError('Please configure at least 1 cut reel.');
      return;
    }

    const totalRollWeight = parseFloat(reelForm.weightKg) || 0;
    const gsmVal = parseFloat(reelForm.gsm) || 16;
    const diaVal = parseFloat(reelForm.dia) || 900;

    let sumCutWeight = 0;
    const savedRecords: Reel[] = [];

    for (let i = 0; i < cutReels.length; i++) {
      const item = cutReels[i];
      if (!item.reelNo.trim()) {
        setModalError(`Please enter a valid Reel No for cut reel #${i + 1}.`);
        return;
      }
      const weightKg = parseFloat(item.weightKg) || 0;
      sumCutWeight += weightKg;
      const sizeNum = parseFloat(item.size) || parseFloat(reelForm.size) || 30;

      const record: Reel = {
        reelNo: item.reelNo.trim(),
        parentRollNo: parentRollStr,
        product: item.product?.trim() || reelForm.productName,
        gsm: gsmVal,
        size: sizeNum,
        ply: plyVal,
        weight: weightKg,
        dia: diaVal,
        joint: parseInt(item.joint) || 0,
        status: 'QC_PENDING',
        qcGrade: 'PENDING',
        productionDate: `${new Date().toISOString().substring(0, 10)} ${new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5)}`,
      };
      savedRecords.push(record);
    }

    const brokeKg = Math.max(0, totalRollWeight - sumCutWeight);

    try {
      setIsSubmitting(true);
      savedRecords.forEach((rec, idx) => {
        saveSingleReel(rec, idx === savedRecords.length - 1 ? brokeKg : 0, user?.displayName || 'System');
      });

      // Mark running roll(s) as consumed in storage so they immediately disappear
      markRollAsConsumed(reelForm.runningRollNo);
      if (plyVal === 2 && reelForm.runningRollNo2) {
        markRollAsConsumed(reelForm.runningRollNo2);
      }

      const updatedReels = getReels();
      const updatedRolls = getRolls();
      setReels(updatedReels);
      setRolls(updatedRolls);

      setIsAddModalOpen(false);
      const newNos = new Set(savedRecords.map(r => r.reelNo));
      setHighlightedReelNos(newNos);
      setTimeout(() => setHighlightedReelNos(new Set()), 5000);

      setToast({
        type: 'success',
        title: 'Reels Cut Successfully',
        message: `${savedRecords.length} finished reel(s) logged & Roll ${parentRollStr} consumed in real-time.`,
        duration: 3500,
      });
    } catch (err: any) {
      setModalError(err.message || 'Error saving cut reel entries.');
      setToast({
        type: 'error',
        title: 'Failed to Log Cut Reels',
        message: err.message || 'An error occurred while saving cut reels.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintAllToday = () => {
    if (isViewer) return;
    const todayStr = new Date().toISOString().substring(0, 10);
    const todaysReels = reels.filter(r => r.productionDate.startsWith(todayStr));
    if (todaysReels.length === 0) {
      alert('No reels have been produced today yet.');
      return;
    }
    setRecentlyGenerated(todaysReels);
    setShowQRModal(true);
  };

  const handlePrint = () => {
    if (isViewer) return;
    let bodyClass = '';
    let pageSize = '';

    if (printFormat === 'tsc_4x3') {
      bodyClass = 'print-thermal-labels';
      pageSize = '4in 3in';
    } else if (printFormat === 'tsc_3x2') {
      bodyClass = 'print-thermal-labels';
      pageSize = '3in 2in';
    } else if (printFormat === 'tsc_2x2') {
      bodyClass = 'print-thermal-labels';
      pageSize = '2in 2in';
    } else {
      bodyClass = 'print-a4-labels';
      pageSize = 'A4 portrait';
    }

    document.body.classList.add(bodyClass);
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-label-print-style';
    styleEl.innerHTML = `@page { size: ${pageSize}; margin: 0; }`;
    document.head.appendChild(styleEl);

    if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.printDocument) {
      try {
        const reelName = recentlyGenerated.length === 1 ? recentlyGenerated[0].reelNo : `Batch_${recentlyGenerated.length}`;
        (window as any).AndroidNativeBridge.printDocument(`Reel_Label_${reelName}`);
      } catch (e) {
        console.warn('[RewinderPrint] AndroidNativeBridge failed:', e);
      }
    }

    window.print();

    const cleanup = () => {
      document.body.classList.remove(bodyClass);
      const el = document.getElementById('dynamic-label-print-style');
      if (el) el.remove();
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 2000);
  };

  return (
    <div className="space-y-6 font-sans pb-12 text-left">
      {/* TOP BANNER STAT CARDS (4 Hero Scorecards - Hidden on mobile for clean focused log view) */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="neumorphic-card p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
            <RotateCw className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {timeframe === 'day' ? 'Reel Output (Day)' : timeframe === 'week' ? 'Reel Output (Week)' : timeframe === 'month' ? 'Reel Output (Month)' : 'Total Reel Output'}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{formatKgOrTon(totalReelWeightKg)}</p>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">{timeframeReels.length} Reels • {timeframeSubtitle}</p>
          </div>
        </div>

        <div className="neumorphic-card p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/60 shrink-0">
            <RefreshCw className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Broke Generated</p>
            <p className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 mt-0.5">{formatKgOrTon(totalBrokeKg)}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Auto Loop-Back (Rule 6)</p>
          </div>
        </div>

        <div className="neumorphic-card p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
            <PackageCheck className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Stock Added</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{formatKgOrTon(netFinishStockKg)}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Net of Broke</p>
          </div>
        </div>

        <div className="neumorphic-card p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 shrink-0">
            <Scissors className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Yield Rate</p>
            <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{netYieldRate}</p>
            <p className="text-[11px] text-purple-500 font-semibold mt-0.5">Yield Efficiency</p>
          </div>
        </div>
      </div>

      {/* 2. MAIN REELS TABLE CARD */}
      <div className="neumorphic-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Rewinder Reel Production Log</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Date: {new Date().toLocaleDateString('en-GB')} &bull; Broke automatically increases Raw Material Stock (Rule 6)
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="btn-primary-gradient px-5 py-2.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 text-white" />
              <span>Add Reel Entry</span>
            </button>
          </div>
        </div>



        {/* Search & Filter Controls */}
        <div className="space-y-3 bg-slate-50/80 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Reel No, Running Roll, GSM, Size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Active Cascading Filter Badge / Trigger */}
              <button
                type="button"
                onClick={() => setShowCascadingModal(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  activeCascadingFilterCount > 0
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-primary dark:text-blue-400 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary dark:text-blue-400" />
                <span>Cascading Filter</span>
                {activeCascadingFilterCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-primary text-white text-[10px] font-black">
                    {activeCascadingFilterCount}
                  </span>
                )}
              </button>

              <div className="w-44">
                <CustomSearchableSelect
                  size="sm"
                  value={selectedProductFilter}
                  onChange={setSelectedProductFilter}
                  options={productOptions}
                  placeholder="Paper Type"
                />
              </div>

              <div className="w-36">
                <CustomSearchableSelect
                  size="sm"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'all', label: 'All QC Status' },
                    { value: 'QC_PENDING', label: 'QC Pending' },
                    { value: 'GRADE_A', label: 'Grade A Passed' },
                    { value: 'GRADE_B', label: 'Grade B' },
                  ]}
                  placeholder="Status"
                  hideSearch
                />
              </div>

              <div className="w-32">
                <CustomSearchableSelect
                  size="sm"
                  value={dateFilter}
                  onChange={setDateFilter}
                  options={[
                    { value: 'all', label: 'All Dates' },
                    { value: 'today', label: 'Today Only' },
                    { value: '7days', label: 'Last 7 Days' },
                    { value: 'month', label: 'This Month' },
                  ]}
                  placeholder="Date Window"
                  hideSearch
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                  title="Clear all filters"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* REELS LIST / TABLE CONTAINER */}
        {groupedBatches.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <RotateCw className="h-10 w-10 mx-auto opacity-30 mb-3" />
            <p className="font-bold text-sm">No rewound reels found matching the current filters.</p>
            <p className="text-xs mt-1">Click &quot;+ Add Reel Entry&quot; above to log reels from available machine rolls.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedBatches.map(batch => (
              <div
                key={batch.batchId}
                className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs"
              >
                {/* Batch Header Bar */}
                <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-850 border-b border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 font-mono font-black text-xs border border-blue-200/60 dark:border-blue-800/60">
                      Roll #{batch.parentRollNo}
                    </span>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {batch.product}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                      &bull; {batch.reels.length} {batch.reels.length === 1 ? 'Reel Cut' : 'Reels Cut'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono font-bold">
                    <span className="text-slate-500 dark:text-slate-400">
                      Gross: <strong>{batch.totalWeight.toLocaleString()} kg</strong>
                    </span>
                    <span className="text-red-500">
                      Broke: <strong>+{batch.totalBroke.toLocaleString()} kg</strong>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Net Stock: <strong>{batch.netWeight.toLocaleString()} kg</strong>
                    </span>
                  </div>
                </div>

                {/* Desktop Reels Table for this Batch */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-500 dark:text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <th className="py-3 px-4">REEL NO</th>
                        <th className="py-3 px-4">RUNNING ROLL</th>
                        <th className="py-3 px-4">PRODUCT</th>
                        <th className="py-3 px-4">GSM / SIZE / PLY</th>
                        <th className="py-3 px-4">JOINT</th>
                        <th className="py-3 px-4 text-right">REEL WEIGHT</th>
                        <th className="py-3 px-4 text-right text-red-500">BROKE (KG)</th>
                        <th className="py-3 px-4 text-right font-black">NET STOCK WEIGHT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                      {batch.reels.map(reel => {
                        const brokeVal = Number(reel.joint || 0) * 15 + 20;
                        const netKg = Math.max(0, reel.weight - brokeVal);
                        const isHighlighted = highlightedReelNos.has(reel.reelNo);
                        return (
                          <tr
                            key={reel.reelNo}
                            className={`transition duration-150 ${
                              isHighlighted
                                ? 'bg-purple-50/90 dark:bg-purple-950/40 ring-2 ring-primary/40'
                                : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-black text-primary dark:text-blue-400 font-mono text-xs flex items-center gap-1.5">
                              <span>{reel.reelNo}</span>
                              {isHighlighted && (
                                <span className="px-1.5 py-0.2 rounded bg-primary text-white text-[9px] font-bold uppercase animate-pulse">
                                  ✓ New
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{reel.parentRollNo}</td>
                            <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">{reel.product}</td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-bold">
                              {reel.gsm} GSM | {reel.size} cm | {reel.ply} Ply
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-bold">
                              {reel.joint} Joint
                            </td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                              {reel.weight.toLocaleString()} kg
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-red-500">
                              +{brokeVal} kg
                            </td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                              {netKg.toLocaleString()} kg
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Stacked Cards for this Batch */}
                <div className="block md:hidden p-3 space-y-2.5">
                  {batch.reels.map(reel => {
                    const brokeVal = Number(reel.joint || 0) * 15 + 20;
                    const netKg = Math.max(0, reel.weight - brokeVal);
                    const isHighlighted = highlightedReelNos.has(reel.reelNo);
                    return (
                      <div
                        key={reel.reelNo}
                        className={`p-3.5 rounded-2xl border transition space-y-2 text-xs ${
                          isHighlighted
                            ? 'bg-purple-50/90 dark:bg-purple-950/40 border-primary ring-2 ring-primary/30 shadow-md shadow-purple-500/10'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-primary dark:text-blue-400">{reel.reelNo}</span>
                            {isHighlighted && (
                              <span className="px-1.5 py-0.2 rounded bg-primary text-white text-[9px] font-bold uppercase animate-pulse">
                                ✓ New
                              </span>
                            )}
                          </div>
                          <span className="font-bold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px]">
                            Net: {netKg.toLocaleString()} kg
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase font-bold">Roll / Specs</span>
                            <span className="font-bold text-slate-900 dark:text-white">{reel.parentRollNo} &bull; {reel.gsm}GSM &bull; {reel.size}cm</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase font-bold">Reel / Broke</span>
                            <span className="font-extrabold text-slate-900 dark:text-white">{reel.weight.toLocaleString()} kg <span className="text-red-500">(+{brokeVal}kg)</span></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD REEL ENTRY FULL-SCREEN MOBILE VIEW / DESKTOP MODAL */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 sm:bg-slate-900/60 sm:backdrop-blur-sm flex flex-col sm:flex-row sm:items-center sm:justify-center sm:p-4 overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div
            className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl bg-slate-50 dark:bg-slate-900 sm:neumorphic-card rounded-none sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:block space-y-4 shadow-none sm:shadow-2xl text-slate-900 dark:text-white overflow-y-auto custom-scrollbar animate-in fade-in sm:zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Back Button on Mobile, Modal Title on Both */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3 gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="sm:hidden flex items-center gap-1.5 text-primary dark:text-blue-400 font-bold text-xs p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
                  <span>Back</span>
                </button>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center flex-wrap gap-1.5 leading-snug">
                  <span>Log Rewinder Reel &amp; Broke</span>
                  <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-primary dark:text-blue-400 border border-blue-500/20 shrink-0">
                    Rule 6
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="hidden sm:flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleReel} className="space-y-4 flex-1 pb-6 sm:pb-0">
              {modalError && (
                <div className="px-3 py-2 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{modalError}</span>
                </div>
              )}

              {availableRolls.length === 0 && (
                <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>No available machine rolls found. Rolls added in Machine Production will appear here.</span>
                </div>
              )}

              {/* Row 1: Ply (1st), Running Roll No (2nd - dynamic 1 or 2 boxes), Reels Cut (3rd - 1 to 20 Max) */}
              <div className="space-y-3">
                <div className={`grid grid-cols-1 ${reelForm.ply === '1' ? 'sm:grid-cols-3' : 'sm:grid-cols-4'} gap-3 items-start`}>
                  {/* 1st: Ply */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ply
                    </label>
                    <CustomSearchableSelect
                      value={reelForm.ply}
                      onChange={newPly => {
                        let newWeight = reelForm.weightKg;
                        let newRoll2 = reelForm.runningRollNo2;
                        if (newPly === '2') {
                          const r1 = availableRolls.find(r => r.rollNo === reelForm.runningRollNo);
                          const r2 = availableRolls.find(r => r.rollNo === reelForm.runningRollNo2);
                          newRoll2 = r2 ? r2.rollNo : '';
                          const combWeight = (r1?.weight || 0) + (r2?.weight || 0);
                          if (combWeight > 0) newWeight = String(combWeight);
                        } else if (newPly === '1') {
                          const r1 = availableRolls.find(r => r.rollNo === reelForm.runningRollNo);
                          if (r1) newWeight = String(r1.weight);
                        }
                        const maxAllowedCut = newPly === '1' ? 17 : 20;
                        if (reelsCutCount > maxAllowedCut) {
                          setReelsCutCount(maxAllowedCut);
                          const existing = getReels();
                          let startNo = cutReels[0]?.reelNo?.trim() || reelForm.reelNo || getInitialReelNo(existing, 0);
                          let curNo = startNo;
                          const defaultSize = (reelForm.runningSize || reelForm.size || '30').replace(/\s*cm/i, '');
                          const items = [];
                          for (let i = 0; i < maxAllowedCut; i++) {
                            const prev = cutReels[i];
                            const prevSize = prev?.size ? String(prev.size).replace(/\s*cm/i, '') : '';
                            items.push({
                              id: prev?.id || `cut-${i}-${Date.now()}`,
                              reelNo: curNo,
                              product: prev?.product || reelForm.productName,
                              size: prevSize || defaultSize,
                              weightKg: prev?.weightKg || '',
                              joint: prev?.joint || '',
                            });
                            curNo = parseAndIncrementReelNo(curNo);
                          }
                          setCutReels(items);
                        }
                        setReelForm({ ...reelForm, ply: newPly, runningRollNo2: newRoll2, weightKg: newWeight });
                      }}
                      options={[
                        { value: '1', label: '1 Ply' },
                        { value: '2', label: '2 Ply' },
                      ]}
                      hideSearch
                    />
                  </div>

                  {/* 2nd: Running Roll No (Dynamic 1 or 2 boxes with CustomSearchableSelect) */}
                  {reelForm.ply === '1' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Running Roll No
                      </label>
                      <CustomSearchableSelect
                        value={reelForm.runningRollNo}
                        onChange={val => {
                          const matched = availableRolls.find(
                            r => r.rollNo.trim().toLowerCase() === val.trim().toLowerCase()
                          );
                          if (matched) {
                            setReelForm(prev => ({
                              ...prev,
                              runningRollNo: matched.rollNo,
                              productName: matched.product,
                              gsm: String(matched.gsm || ''),
                              dia: String(matched.dia || ''),
                              runningSize: formatRunningSize(matched.width),
                              weightKg: String(matched.weight),
                            }));
                          } else {
                            setReelForm(prev => ({ ...prev, runningRollNo: val }));
                          }
                        }}
                        options={rollOptions1}
                        placeholder={rollOptions1.length === 0 ? 'No rolls available' : 'Select Roll No...'}
                        hideSearch={rollOptions1.length <= 5}
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Running Roll No 1
                        </label>
                        <CustomSearchableSelect
                          value={reelForm.runningRollNo}
                          onChange={val => {
                            const matched = availableRolls.find(
                              r => r.rollNo.trim().toLowerCase() === val.trim().toLowerCase()
                            );
                            if (matched) {
                              const matched2 = availableRolls.find(r => r.rollNo === reelForm.runningRollNo2);
                              const combWeight = (matched.weight || 0) + (matched2?.weight || 0);
                              setReelForm(prev => ({
                                ...prev,
                                runningRollNo: matched.rollNo,
                                productName: matched.product,
                                gsm: String(matched.gsm || ''),
                                dia: String(matched.dia || ''),
                                runningSize: formatRunningSize(matched.width),
                                weightKg: combWeight > 0 ? String(combWeight) : String(matched.weight),
                              }));
                            } else {
                              setReelForm(prev => ({ ...prev, runningRollNo: val }));
                            }
                          }}
                          options={rollOptionsForPly2Roll1}
                          placeholder={rollOptionsForPly2Roll1.length === 0 ? 'No rolls' : 'Select Roll #1...'}
                          hideSearch={rollOptionsForPly2Roll1.length <= 5}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Running Roll No 2
                        </label>
                        <CustomSearchableSelect
                          value={reelForm.runningRollNo2}
                          onChange={val => {
                            if (val && val.trim().toLowerCase() === reelForm.runningRollNo.trim().toLowerCase()) {
                              setModalError(`Roll ${val} is already selected in Roll #1!`);
                              setReelForm(prev => ({ ...prev, runningRollNo2: '' }));
                              return;
                            }
                            setModalError('');
                            const matched2 = availableRolls.find(
                              r => r.rollNo.trim().toLowerCase() === val.trim().toLowerCase()
                            );
                            if (matched2) {
                              const matched1 = availableRolls.find(r => r.rollNo === reelForm.runningRollNo);
                              const combWeight = (matched1?.weight || 0) + (matched2.weight || 0);
                              setReelForm(prev => ({
                                ...prev,
                                runningRollNo2: matched2.rollNo,
                                weightKg: combWeight > 0 ? String(combWeight) : prev.weightKg,
                              }));
                            } else {
                              setReelForm(prev => ({ ...prev, runningRollNo2: val }));
                            }
                          }}
                          options={rollOptionsForPly2Roll2}
                          placeholder={rollOptionsForPly2Roll2.length === 0 ? 'No rolls' : 'Select Roll #2...'}
                          hideSearch={rollOptionsForPly2Roll2.length <= 5}
                        />
                      </div>
                    </>
                  )}

                  {/* 3rd: Reels Cut (1 to 17 Max for 1 Ply, 1 to 20 Max for 2 Ply) */}
                  {(() => {
                    const maxAllowedCut = reelForm.ply === '1' ? 17 : 20;
                    return (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Reels Cut (1 to {maxAllowedCut} Max)
                        </label>
                        <CustomSearchableSelect
                          value={String(reelsCutCount)}
                          onChange={val => {
                            const count = Math.min(maxAllowedCut, Math.max(1, Number(val)));
                            setReelsCutCount(count);

                            // Auto regenerate cut reels list with guaranteed unique sequential numbers starting from 1st reel
                            const existing = getReels();
                            let startNo = cutReels[0]?.reelNo?.trim() || reelForm.reelNo || getInitialReelNo(existing, 0);
                            let curNo = startNo;
                            const defaultSize = (reelForm.runningSize || reelForm.size || '30').replace(/\s*cm/i, '');
                            const items = [];
                            for (let i = 0; i < count; i++) {
                              const prev = cutReels[i];
                              const prevSize = prev?.size ? String(prev.size).replace(/\s*cm/i, '') : '';
                              items.push({
                                id: prev?.id || `cut-${i}-${Date.now()}`,
                                reelNo: curNo,
                                product: prev?.product || reelForm.productName,
                                size: prevSize || defaultSize,
                                weightKg: prev?.weightKg || '',
                                joint: prev?.joint || '',
                              });
                              curNo = parseAndIncrementReelNo(curNo);
                            }
                            setCutReels(items);
                          }}
                          options={Array.from({ length: maxAllowedCut }, (_, i) => i + 1).map(n => ({
                            value: String(n),
                            label: `${n} ${n === 1 ? 'Reel' : 'Reels'}`,
                          }))}
                          hideSearch
                        />
                      </div>
                    );
                  })()}
                </div>

                {/* Row 2: Running Size, Product, Total Weight */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Running Size (cm)
                    </label>
                    <input
                      type="text"
                      value={reelForm.runningSize}
                      onChange={e => {
                        const val = e.target.value;
                        setReelForm(prev => ({ ...prev, runningSize: val, size: val }));
                        setCutReels(prev => prev.map(item => ({ ...item, size: val })));
                      }}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder="e.g. 28"
                    />
                  </div>
                  <div>
                    <CustomSearchableSelect
                      label="PRODUCT"
                      placeholder="-- Select Product --"
                      value={reelForm.productName}
                      onChange={(val) => {
                        setReelForm(prev => ({ ...prev, productName: val }));
                        setCutReels(prev => prev.map(item => ({ ...item, product: val })));
                      }}
                      options={masterProducts.map(p => ({
                        value: p.name,
                        label: p.name,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Total Weight (kg)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="5000"
                      value={reelForm.weightKg}
                      onChange={e => setReelForm({ ...reelForm, weightKg: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Total Summary Meter Banner */}
              {(() => {
                const sumCutWeight = cutReels.reduce((sum, r) => sum + (parseFloat(r.weightKg) || 0), 0);
                const totalRollWeight = parseFloat(reelForm.weightKg) || 0;
                return (
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-slate-600 dark:text-slate-400">
                      Sum of Cut Reels:{' '}
                      <span className={sumCutWeight > 0 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-700 dark:text-slate-300'}>
                        {sumCutWeight.toLocaleString()} kg
                      </span>{' '}
                      / Total Roll: {totalRollWeight.toLocaleString()} kg
                    </span>
                    {totalRollWeight > 0 && (
                      <span className="text-[11px] text-primary dark:text-blue-400 font-sans font-bold">
                        Broke: {Math.max(0, totalRollWeight - sumCutWeight).toLocaleString()} kg
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* CONFIGURE CUT REELS CARD (WITH INDIVIDUAL PRODUCT & SIZE INPUTS) */}
              <div className="border border-blue-200/80 dark:border-blue-900/40 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-blue-200 dark:border-blue-900/50 pb-2">
                  <h4 className="text-xs font-black uppercase text-primary dark:text-blue-400 tracking-wider">
                    CONFIGURE CUT REELS [{reelsCutCount} REELS CUT]
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Set individual Product, Size, Weight &amp; Joints for each reel
                  </p>
                </div>

                <div className="space-y-2.5 overflow-visible sm:max-h-[260px] sm:overflow-y-auto pr-1 custom-scrollbar">
                  {cutReels.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-5 gap-2 sm:gap-2.5 items-center shadow-xs relative"
                    >
                      {/* 1. Reel No / Name */}
                      <div className="flex items-center gap-2 sm:col-span-1">
                        <span className="text-xs font-black text-primary dark:text-blue-400 font-mono shrink-0 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={item.reelNo}
                          placeholder="Reel No"
                          onChange={e => {
                            const val = e.target.value;
                            setCutReels(prev => {
                              const updated = [...prev];
                              updated[idx] = { ...updated[idx], reelNo: val };

                              // Cascade increment to all following reels
                              let runningNo = val;
                              for (let i = idx + 1; i < updated.length; i++) {
                                if (runningNo && runningNo.trim()) {
                                  runningNo = parseAndIncrementReelNo(runningNo);
                                  updated[i] = { ...updated[i], reelNo: runningNo };
                                }
                              }
                              return updated;
                            });

                            if (idx === 0) {
                              setReelForm(prev => ({ ...prev, reelNo: val }));
                            }
                          }}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      {/* 2. Product Name (Full width on mobile, 1 column on PC) */}
                      <div className="w-full sm:col-span-1">
                        <CustomSearchableSelect
                          size="sm"
                          value={item.product || reelForm.productName}
                          onChange={val => {
                            setCutReels(prev => prev.map((r, i) => i === idx ? { ...r, product: val } : r));
                          }}
                          options={masterProducts.map(p => ({
                            value: p.name,
                            label: p.name,
                            badge: `Grade ${p.grade}`
                          }))}
                        />
                      </div>

                      {/* 3, 4, 5. Size, Weight, Joints (Clean 3-column row on mobile, 3 columns on PC) */}
                      <div className="grid grid-cols-3 gap-2 sm:contents">
                        {/* Size */}
                        <div>
                          <input
                            type="text"
                            placeholder="Size cm"
                            value={item.size}
                            onChange={e => {
                              const val = e.target.value;
                              setCutReels(prev => prev.map((r, i) => i === idx ? { ...r, size: val } : r));
                            }}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none text-center font-mono placeholder:text-slate-400"
                          />
                        </div>

                        {/* Weight (kg) */}
                        <div>
                          <input
                            type="number"
                            required
                            placeholder="Weight kg"
                            value={item.weightKg}
                            onChange={e => {
                              const val = e.target.value;
                              setCutReels(prev => prev.map((r, i) => i === idx ? { ...r, weightKg: val } : r));
                            }}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none text-center placeholder:text-slate-400"
                          />
                        </div>

                        {/* Joints */}
                        <div>
                          <input
                            type="number"
                            placeholder="Joints"
                            value={item.joint}
                            onChange={e => {
                              const val = e.target.value;
                              setCutReels(prev => prev.map((r, i) => i === idx ? { ...r, joint: val } : r));
                            }}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none text-center placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isViewer || isSubmitting}
                  title={isViewer ? 'Viewer Mode: Reel entry saving is locked (Read-Only)' : 'Save Reel Entry'}
                  className={`px-6 py-2.5 text-xs uppercase tracking-wider rounded-xl font-black transition flex items-center justify-center gap-1.5 ${
                    isViewer
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                      : isSubmitting
                      ? 'bg-primary/70 text-white cursor-wait opacity-80'
                      : 'btn-primary-gradient cursor-pointer active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isViewer ? (
                    <Lock className="h-4 w-4 text-amber-500" />
                  ) : null}
                  <span>
                    {isSubmitting
                      ? 'Logging Cut Reels...'
                      : isViewer
                      ? 'Save Reel Entry (Locked)'
                      : 'Save Reel Entry'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Labels printable Modal */}
      {showQRModal && recentlyGenerated.length > 0 &&
        createPortal(
          <div
            id="printable-qr-modal"
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain print:static print:block print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:z-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowQRModal(false);
            }}
          >
            <div
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto print:p-0 print:shadow-none print:max-h-full print:border-none print:w-full print:max-w-none"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex justify-between items-center border-b pb-3 dark:border-slate-700 print:hidden">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Print QR Traceability Labels
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-700 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Label Format:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPrintFormat('tsc_4x3')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${printFormat === 'tsc_4x3' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border'
                    }`}
                >
                  TSC 4x3&quot;
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('tsc_3x2')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${printFormat === 'tsc_3x2' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border'
                    }`}
                >
                  TSC 3x2&quot;
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('a4_grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${printFormat === 'a4_grid' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border'
                    }`}
                >
                  A4 Grid
                </button>
              </div>
            </div>

            <div className="space-y-4 py-2" id="printable-qr-labels">
              {recentlyGenerated.map(reel => (
                <div
                  key={reel.reelNo}
                  className="qr-label-card bg-white text-slate-950 border-2 border-slate-900 rounded-2xl p-4 shadow-md text-left select-none print:m-0 print:p-3 print:border-2 print:border-black print:shadow-none print:rounded-none"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-1.5 mb-2">
                    <div>
                      <div className="text-xs font-black tracking-tight text-slate-950 uppercase leading-tight font-heading">
                        {COMPANY_CONFIG.name}
                      </div>
                      <div className="text-[7.5px] font-bold text-slate-600 uppercase tracking-wider">
                        Plant: Chandisar, Palanpur
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950 text-white text-[7.5px] font-black uppercase tracking-wider">
                        <Check className="h-2 w-2 text-emerald-400" />
                        <span>QC PASSED</span>
                      </span>
                      <div className="text-[7px] font-extrabold text-slate-500 mt-0.5">ISO 9001:2015</div>
                    </div>
                  </div>

                  {/* QR & Reel Identity */}
                  <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-300 rounded-xl p-2 mb-2">
                    <div className="p-1 bg-white border border-slate-900 rounded-lg shrink-0 flex items-center justify-center">
                      <QRCodeSVG
                        value={reel.reelNo}
                        size={68}
                        level="M"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">
                        REEL IDENTIFIER / QR CODE
                      </div>
                      <div className="text-sm font-black font-mono tracking-tight text-slate-950 truncate">
                        {reel.reelNo}
                      </div>
                      <div className="text-[10px] font-black text-blue-800 line-clamp-1">
                        {reel.product}
                      </div>
                      <div className="text-[7.5px] font-bold text-slate-500">
                        Roll #{reel.parentRollNo} &bull; Rewinder #2 &bull; Shift A
                      </div>
                    </div>
                  </div>

                  {/* 6-Box Technical Specs Matrix */}
                  <div className="grid grid-cols-3 gap-1 mb-2 text-center text-[9px]">
                    <div className="p-1 bg-slate-100 border border-slate-200 rounded-lg">
                      <span className="text-[7px] font-black text-slate-500 block uppercase">GSM</span>
                      <span className="font-black text-slate-950 font-mono text-[10px]">{reel.gsm}</span>
                    </div>
                    <div className="p-1 bg-slate-100 border border-slate-200 rounded-lg">
                      <span className="text-[7px] font-black text-slate-500 block uppercase">SIZE</span>
                      <span className="font-black text-slate-950 font-mono text-[10px]">{reel.size} cm</span>
                    </div>
                    <div className="p-1 bg-slate-100 border border-slate-200 rounded-lg">
                      <span className="text-[7px] font-black text-slate-500 block uppercase">PLY</span>
                      <span className="font-black text-slate-950 font-mono text-[10px]">{reel.ply || 2} Ply</span>
                    </div>
                    <div className="p-1 bg-slate-100 border border-slate-200 rounded-lg">
                      <span className="text-[7px] font-black text-slate-500 block uppercase">DIAMETER</span>
                      <span className="font-black text-slate-950 font-mono text-[10px]">{reel.dia || 1150} mm</span>
                    </div>
                    <div className="p-1 bg-slate-100 border border-slate-200 rounded-lg">
                      <span className="text-[7px] font-black text-slate-500 block uppercase">CORE</span>
                      <span className="font-black text-slate-950 font-mono text-[10px]">76 mm (3")</span>
                    </div>
                    <div className="p-1 bg-slate-100 border border-slate-200 rounded-lg">
                      <span className="text-[7px] font-black text-slate-500 block uppercase">JOINTS</span>
                      <span className="font-black text-slate-950 font-mono text-[10px]">{reel.joint ?? 0} Joints</span>
                    </div>
                  </div>

                  {/* Certified Net Weight Hero Banner */}
                  <div className="bg-slate-950 text-white px-2.5 py-1.5 rounded-xl flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block">
                        CERTIFIED NET WEIGHT
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black font-mono tracking-tight text-emerald-400">
                        {reel.weight} <span className="text-[10px] font-normal text-white">KG</span>
                      </span>
                    </div>
                  </div>

                  {/* Footer metadata */}
                  <div className="flex items-center justify-between text-[7px] font-bold text-slate-500 border-t border-slate-200 pt-1">
                    <span>Mfg: {reel.productionDate || new Date().toISOString().substring(0, 10)}</span>
                    <span>100% Recyclable Paper</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t dark:border-slate-700 flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setShowQRModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                disabled={isViewer}
                title={isViewer ? "Printing is locked for Viewer (Read-Only Mode)" : "Print Labels"}
                className={`px-5 py-2 rounded-xl font-extrabold text-xs shadow-md flex items-center gap-2 ${
                  isViewer
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-primary hover:bg-primary-dark text-white cursor-pointer'
                }`}
              >
                {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Printer className="h-4 w-4" />}
                <span>{isViewer ? 'Print Labels (Locked)' : 'Print Labels'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* INVENTORY CASCADING FILTER MODAL (Matching Screenshot) */}
      {showCascadingModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCascadingModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-[#181D35] text-slate-900 dark:text-white border border-slate-200 dark:border-[#262D4A] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-700/60 pb-3">
              <div>
                <h3 className="text-base font-black tracking-wider flex items-center gap-2 text-white">
                  <SlidersHorizontal className="h-5 w-5 text-blue-400" />
                  INVENTORY CASCADING FILTER
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Select Product &rarr; GSM &rarr; Size &rarr; Ply to view matching inventory
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCascadingModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Hero Live Filter Results Card */}
            <div className="bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl p-4 border border-blue-200/80 dark:border-blue-900/50 shadow-xs text-slate-900 dark:text-white space-y-1">
              <span className="text-[10px] font-black tracking-widest text-primary dark:text-blue-400 uppercase flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> LIVE FILTER RESULTS
              </span>
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{filteredReels.length} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Reels</span></span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {filteredReels.reduce((acc, r) => acc + r.weight, 0).toLocaleString()} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kg ({(filteredReels.reduce((acc, r) => acc + r.weight, 0) / 1000).toFixed(2)} MT)</span>
                </span>
              </div>
            </div>

            {/* 4 Step Cascading Dropdowns */}
            <div className="space-y-4 text-xs font-bold">

              {/* STEP 1: PRODUCT */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>1. SELECT PRODUCT</span>
                  <span className="text-[10px] text-blue-500 font-medium">Step 1</span>
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
                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>2. SELECT GSM</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {filterProduct !== 'ALL' ? `Cascaded for ${filterProduct}` : 'SELECT PRODUCT FIRST'}
                  </span>
                </label>
                <CustomSearchableSelect
                  value={filterGsm}
                  onChange={handleGsmChange}
                  options={[
                    { value: 'ALL', label: `All GSMs (${availableGsms.length} available)` },
                    ...availableGsms.map(g => ({ value: String(g), label: `${g} GSM` })),
                  ]}
                  placeholder="Select GSM..."
                />
              </div>

              {/* STEP 3: SIZE */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>3. SELECT SIZE (CM)</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {filterGsm !== 'ALL' ? `Cascaded for ${filterGsm} GSM` : 'ALL SIZES'}
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
                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>4. SELECT PLY</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {filterSize !== 'ALL' ? `Cascaded for Size ${filterSize} cm` : 'ALL PLY'}
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

            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-3 border border-red-300 dark:border-red-500/40 rounded-2xl text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <RotateCcw className="h-4 w-4" /> Clear All
              </button>

              <button
                type="button"
                onClick={() => setShowCascadingModal(false)}
                className="btn-primary-gradient flex-1 py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>APPLY &amp; VIEW ({filteredReels.length} REELS)</span>
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Mobile Floating Toast */}
      <MobileToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default RewinderView;
