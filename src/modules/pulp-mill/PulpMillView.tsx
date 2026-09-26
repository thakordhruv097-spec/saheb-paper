import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getFormulas, saveFormula, deleteFormula, getRawMaterials } from '../../data/index';
import type { PulpFormula, RawMaterialItem } from '../../data/types';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { DataFilterBar } from '../../components/DataFilterBar';
import {
  Factory,
  Plus,
  Scale,
  Search,
  CheckCircle2,
  ListFilter,
  Beaker,
  Calendar,
  Clock,
  Save,
  AlertCircle,
  TrendingUp,
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Package,
  ArrowUpDown,
  MoreVertical,
  Pencil,
  Trash2,
  Lock,
  Loader2,
} from 'lucide-react';
import { MobileToast, type ToastMessage } from '../../components/MobileToast';

interface DowntimeLog {
  id: string;
  durationMinutes: number;
  reason: string;
  timestamp: string;
}

import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';
import { useDataSync } from '../../hooks/useDataSync';

export const PulpMillView: React.FC = () => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();
  const { timeframe, setTimeframe, selectedDate, setSelectedDate } = useDateFilter();
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Keep timeframe strictly in 'day' for Pulp Mill operations
  useEffect(() => {
    if (timeframe !== 'day') {
      setTimeframe('day');
    }
  }, []);

  const syncTick = useDataSync(['pulp_formulas', 'formulas', 'pulp_mill_operations']);
  const [formulas, setFormulas] = useState<PulpFormula[]>(() => getFormulas());

  useEffect(() => {
    setFormulas(getFormulas());
  }, [syncTick]);
  const [searchTerm, setSearchTerm] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // Use selectedDate from global header calendar
  const dateStr = selectedDate;
  const setDateStr = setSelectedDate;

  const isDirtyRef = useRef(false);
  const lastLoadedDateRef = useRef<string>('');

  // Mobile Toast & Submitting state
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightedFormulaId, setHighlightedFormulaId] = useState<string | null>(null);

  // Downtime state
  const [downtimeLogs, setDowntimeLogs] = useState<DowntimeLog[]>(() => {
    const saved = localStorage.getItem('saheb_pulp_downtimes');
    return saved ? JSON.parse(saved) : [];
  });
  const [downtimeMinutes, setDowntimeMinutes] = useState('');
  const [downtimeReason, setDowntimeReason] = useState('');
  const [activeDtMenuId, setActiveDtMenuId] = useState<string | null>(null);
  const [activeFormulaMenuId, setActiveFormulaMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleDocClick = () => {
      setActiveDtMenuId(null);
      setActiveFormulaMenuId(null);
    };
    window.addEventListener('click', handleDocClick);
    return () => window.removeEventListener('click', handleDocClick);
  }, []);

  const handleDeleteDowntime = (id: string) => {
    const updated = downtimeLogs.filter(dt => dt.id !== id);
    setDowntimeLogs(updated);
    localStorage.setItem('saheb_pulp_downtimes', JSON.stringify(updated));
    setToast({
      type: 'info',
      title: 'Downtime Entry Removed',
      message: 'Downtime entry was successfully deleted.',
      duration: 3000,
    });
    setActiveDtMenuId(null);
  };

  const handleEditDowntime = (dt: DowntimeLog) => {
    setDowntimeMinutes(String(dt.durationMinutes));
    setDowntimeReason(dt.reason);
    const updated = downtimeLogs.filter(item => item.id !== dt.id);
    setDowntimeLogs(updated);
    localStorage.setItem('saheb_pulp_downtimes', JSON.stringify(updated));
    setToast({
      type: 'info',
      title: 'Editing Downtime Entry',
      message: `Loaded ${dt.durationMinutes} mins (${dt.reason}) into form.`,
      duration: 3000,
    });
    setActiveDtMenuId(null);
  };

  const handleLoadFormulaToEngine = (formula: PulpFormula) => {
    lastLoadedDateRef.current = formula.date;
    isDirtyRef.current = false;
    setDateStr(formula.date);
    if (formula.wasteMix) {
      const fullMix: Record<string, number | string> = {};
      availableWastePapers.forEach(name => {
        fullMix[name] = formula.wasteMix[name] !== undefined ? formula.wasteMix[name] : 0;
      });
      setWasteMix(fullMix);
    }
    if (formula.chemicals) {
      const fullChems: Record<string, number | string> = {};
      availablePulpChemicals.forEach(name => {
        fullChems[name] = formula.chemicals[name] !== undefined ? formula.chemicals[name] : 0;
      });
      setChemicals(fullChems);
    }
    setSuccessMsg(`Formula for ${formula.date.split('-').reverse().join('/')} loaded into active engine.`);
    setTimeout(() => setSuccessMsg(''), 3500);
    setActiveFormulaMenuId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyFormulaToToday = (formula: PulpFormula) => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    lastLoadedDateRef.current = todayStr;
    isDirtyRef.current = true;
    setDateStr(todayStr);

    if (formula.wasteMix) {
      const fullMix: Record<string, number | string> = {};
      availableWastePapers.forEach(name => {
        fullMix[name] = formula.wasteMix[name] !== undefined ? formula.wasteMix[name] : 0;
      });
      setWasteMix(fullMix);
    }
    if (formula.chemicals) {
      const fullChems: Record<string, number | string> = {};
      availablePulpChemicals.forEach(name => {
        fullChems[name] = formula.chemicals[name] !== undefined ? formula.chemicals[name] : 0;
      });
      setChemicals(fullChems);
    }
    setSuccessMsg(`Recipe from ${formula.date.split('-').reverse().join('/')} copied for Today (${todayStr.split('-').reverse().join('/')}).`);
    setTimeout(() => setSuccessMsg(''), 3500);
    setActiveFormulaMenuId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFormula = (formulaId: string, date: string) => {
    if (isViewer) {
      alert('Viewer Mode: Deleting formulas is locked (Read-Only)');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the pulp formula for ${date.split('-').reverse().join('/')}?`)) {
      deleteFormula(formulaId, user?.displayName || 'System');
      setFormulas(getFormulas());
      if (date === dateStr) {
        isDirtyRef.current = false;
        const emptyMix: Record<string, number | string> = {};
        availableWastePapers.forEach(name => {
          emptyMix[name] = 0;
        });
        setWasteMix(emptyMix);

        const emptyChems: Record<string, number | string> = {};
        availablePulpChemicals.forEach(name => {
          emptyChems[name] = 0;
        });
        setChemicals(emptyChems);
      }
      setSuccessMsg(`Formula for ${date.split('-').reverse().join('/')} deleted.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setActiveFormulaMenuId(null);
    }
  };

  // Feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Dynamic Raw Materials for Pulp Mill
  const availableWastePapers = useMemo<string[]>(() => {
    const allRm: RawMaterialItem[] = getRawMaterials();
    const wasteList = allRm.filter((m: RawMaterialItem) => m.category === 'WASTE_PAPER' && m.active !== false);
    const rawNames = wasteList.length > 0
      ? wasteList.map((w: RawMaterialItem) => w.name)
      : ['Indian Tissue Waste', 'Imported Tissue Waste', 'SMK', 'Cupstock', 'Pulp Sheet', 'Broke'];

    const priorityOrder = ['Indian Tissue Waste', 'Imported Tissue Waste'];

    const sorted = [...rawNames].sort((a, b) => {
      const aIdx = priorityOrder.findIndex(p => p.toLowerCase() === a.toLowerCase().trim());
      const bIdx = priorityOrder.findIndex(p => p.toLowerCase() === b.toLowerCase().trim());

      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });

    // Make sure Indian Tissue Waste and Imported Tissue Waste are explicitly at 1st and 2nd positions
    priorityOrder.forEach((p, idx) => {
      const existingIdx = sorted.findIndex(s => s.toLowerCase() === p.toLowerCase());
      if (existingIdx > -1) {
        const [item] = sorted.splice(existingIdx, 1);
        sorted.splice(idx, 0, item);
      } else {
        sorted.splice(idx, 0, p);
      }
    });

    return Array.from(new Set(sorted));
  }, [syncTick]);

  const availablePulpChemicals = useMemo<string[]>(() => {
    return ['DSR', 'WSR', 'OBA', 'Hydrogen Peroxide', 'Hypo', 'Bleaching Powder', 'Caustic', 'Washing Powder'];
  }, []);

  // Waste Mix items
  const [wasteMix, setWasteMix] = useState<Record<string, number | string>>({});

  // Chemical items
  const [chemicals, setChemicals] = useState<Record<string, number | string>>({});

  // Load formula if already exists for dateStr or initialize cleanly
  useEffect(() => {
    const dateChanged = lastLoadedDateRef.current !== dateStr;
    const existing = formulas.find(f => f.date === dateStr);

    if (dateChanged) {
      lastLoadedDateRef.current = dateStr;
      isDirtyRef.current = false;

      if (existing) {
        const fullMix: Record<string, number | string> = {};
        availableWastePapers.forEach(name => {
          fullMix[name] = existing.wasteMix && existing.wasteMix[name] !== undefined ? existing.wasteMix[name] : '';
        });
        setWasteMix(fullMix);

        const fullChems: Record<string, number | string> = {};
        availablePulpChemicals.forEach(name => {
          fullChems[name] = existing.chemicals && existing.chemicals[name] !== undefined ? existing.chemicals[name] : '';
        });
        setChemicals(fullChems);
      } else {
        setWasteMix({});
        setChemicals({});
      }
    } else if (!isDirtyRef.current && existing) {
      // Background sync updated the saved formula for this date and user hasn't modified it
      const fullMix: Record<string, number | string> = {};
      availableWastePapers.forEach(name => {
        fullMix[name] = existing.wasteMix && existing.wasteMix[name] !== undefined ? existing.wasteMix[name] : '';
      });
      setWasteMix(fullMix);

      const fullChems: Record<string, number | string> = {};
      availablePulpChemicals.forEach(name => {
        fullChems[name] = existing.chemicals && existing.chemicals[name] !== undefined ? existing.chemicals[name] : '';
      });
      setChemicals(fullChems);
    }
  }, [dateStr, formulas, availableWastePapers, availablePulpChemicals]);

  const handleWasteChange = (name: string, val: string | number) => {
    isDirtyRef.current = true;
    setWasteMix(prev => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleChemicalChange = (name: string, val: string | number) => {
    isDirtyRef.current = true;
    setChemicals(prev => ({
      ...prev,
      [name]: val,
    }));
  };

  const totalWastePct = useMemo(() => {
    return Object.values(wasteMix).reduce<number>((sum, v) => sum + (Number(v) || 0), 0);
  }, [wasteMix]);

  const isFormula100 = Math.abs(totalWastePct - 100) < 0.001;

  const handleSubmitFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isViewer) {
      setToast({
        type: 'error',
        title: 'Action Locked',
        message: 'Viewer Mode: Saving formulas & chemical rates is locked. You have read-only access.',
      });
      return;
    }

    if (!dateStr) {
      setToast({
        type: 'warning',
        title: 'Date Required',
        message: 'Please select a valid date for the formula.',
      });
      return;
    }

    if (!isFormula100) {
      setToast({
        type: 'warning',
        title: 'Invalid Formula Ratio',
        message: `Waste paper formula share must equal exactly 100% (Current sum: ${totalWastePct}%).`,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const formulaObj: PulpFormula = {
        id: `form-${dateStr}`,
        date: dateStr,
        wasteMix: Object.fromEntries(
          availableWastePapers.map(name => [name, Number(wasteMix[name]) || 0])
        ),
        chemicals: Object.fromEntries(
          availablePulpChemicals.map(name => [name, Number(chemicals[name]) || 0])
        ),
      };

      saveFormula(formulaObj, user?.displayName || 'System');
      setFormulas(getFormulas());
      isDirtyRef.current = false;
      setHighlightedFormulaId(`form-${dateStr}`);
      setToast({
        type: 'success',
        title: 'Pulp recipe saved successfully',
        message: `Formula & chemical rates for ${dateStr} active for stock deduction.`,
        duration: 3500,
      });
      setTimeout(() => setHighlightedFormulaId(null), 4500);
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Failed to Save Formula',
        message: err.message || 'An error occurred while saving the formula.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDowntime = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      setToast({
        type: 'error',
        title: 'Action Locked',
        message: 'Viewer Mode: Recording downtime is locked.',
      });
      return;
    }
    if (!downtimeMinutes || !downtimeReason.trim()) return;

    const newLog: DowntimeLog = {
      id: `dt-${Date.now()}`,
      durationMinutes: parseInt(downtimeMinutes, 10),
      reason: downtimeReason.trim(),
      timestamp: new Date().toLocaleString('en-IN', { hour12: false }),
    };

    const updated = [newLog, ...downtimeLogs];
    setDowntimeLogs(updated);
    localStorage.setItem('saheb_pulp_downtimes', JSON.stringify(updated));
    setDowntimeMinutes('');
    setDowntimeReason('');
    setToast({
      type: 'success',
      title: 'Downtime Logged Successfully',
      message: `Recorded ${newLog.durationMinutes} minutes downtime (${newLog.reason}).`,
      duration: 3500,
    });
  };

  const [sortAscending, setSortAscending] = useState(false);

  const filteredFormulas = useMemo(() => {
    let list = [...formulas];
    // Global Timeframe Filter (Day, Week, Month, All)
    if (timeframe && selectedDate) {
      list = list.filter(f => isDateInTimeframe(f.date, selectedDate, timeframe));
    }
    // Text search
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(f => {
        const formattedDate = f.date.split('-').reverse().join('-');
        return (
          f.date.toLowerCase().includes(q) ||
          formattedDate.toLowerCase().includes(q)
        );
      });
    }
    // Date range filter
    if (historyDateFrom) {
      list = list.filter(f => f.date >= historyDateFrom);
    }
    if (historyDateTo) {
      list = list.filter(f => f.date <= historyDateTo);
    }

    // Sort by date based on sortAscending
    list.sort((a, b) => {
      if (sortAscending) {
        return a.date.localeCompare(b.date);
      } else {
        return b.date.localeCompare(a.date);
      }
    });

    return list;
  }, [formulas, searchTerm, historyDateFrom, historyDateTo, sortAscending, timeframe, selectedDate]);

  // Detect formulas identical to chronological previous day
  const sameAsPrevSet = useMemo(() => {
    const sorted = [...formulas].sort((a, b) => a.date.localeCompare(b.date));
    const set = new Set<string>();

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const prev = sorted[i - 1];

      const currentWaste = Object.entries(current.wasteMix || {}).filter(([_, v]) => Number(v) > 0);
      const prevWaste = Object.entries(prev.wasteMix || {}).filter(([_, v]) => Number(v) > 0);

      let matches = currentWaste.length === prevWaste.length;
      if (matches) {
        for (const [k, v] of currentWaste) {
          if (prev.wasteMix[k] !== v) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        const currentChem = Object.entries(current.chemicals || {}).filter(([_, v]) => Number(v) > 0);
        const prevChem = Object.entries(prev.chemicals || {}).filter(([_, v]) => Number(v) > 0);
        if (currentChem.length !== prevChem.length) {
          matches = false;
        } else {
          for (const [k, v] of currentChem) {
            if (prev.chemicals[k] !== v) {
              matches = false;
              break;
            }
          }
        }
      }

      if (matches) {
        set.add(current.id);
      }
    }

    return set;
  }, [formulas]);

  const getWasteBadgeStyle = (name: string, index: number) => {
    const n = name.toLowerCase();
    if (n.includes('broke') || n.includes('mill')) {
      return 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/80';
    }
    if (n.includes('craft') || n.includes('corrugat') || n.includes('occ')) {
      return 'bg-blue-100/80 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-300/80 dark:border-blue-700/80';
    }
    if (n.includes('office') || n.includes('white') || n.includes('sheet')) {
      return 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/80';
    }
    const fallbackStyles = [
      'bg-blue-100/80 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-300/80 dark:border-blue-700/80',
      'bg-amber-100/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/80',
      'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/80',
      'bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300/80 dark:border-slate-700',
      'bg-indigo-100/80 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-700/80',
    ];
    return fallbackStyles[index % fallbackStyles.length];
  };

  const timeframeFormulas = useMemo(() => {
    return formulas.filter(f => isDateInTimeframe(f.date, selectedDate, timeframe));
  }, [formulas, selectedDate, timeframe]);

  const totalDowntimeMinutes = useMemo(() => {
    return downtimeLogs.reduce((sum, d) => sum + (d.durationMinutes || 0), 0);
  }, [downtimeLogs]);

  const timeframeLabel = useMemo(() => {
    if (timeframe === 'day') return `For Day (${selectedDate})`;
    if (timeframe === 'week') return 'Weekly Setup Window';
    if (timeframe === 'month') return `Month (${selectedDate.substring(0, 7)})`;
    return 'All-Time Setup';
  }, [timeframe, selectedDate]);

  return (
    <div className="space-y-6">

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs rounded-2xl border border-red-200 dark:border-red-800 font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Dual Cards Grid */}
      <form onSubmit={handleSubmitFormula} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Card 1: Waste Paper Consumption (%) */}
        <div className="neumorphic-card p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Scale className="h-4 w-4 text-[#6C4FE0] dark:text-purple-400" />
                  1. Waste Paper Consumption (%)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Total mix share must sum to exactly 100%
                </p>
              </div>
              
              <div className={`px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                isFormula100
                  ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                {isFormula100 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                <span>Total: {totalWastePct}% {isFormula100 ? '(Valid)' : '(Warning)'}</span>
              </div>
            </div>

            {/* Waste items list with Neomorphic Pill rows and Sunken Inputs */}
            <div className="space-y-3 pt-4">
              {availableWastePapers.map(name => (
                <div 
                  key={name} 
                  className="flex items-center justify-between p-2.5 px-4 rounded-2xl bg-white dark:bg-slate-900/60 shadow-[3px_3px_10px_rgba(163,163,196,0.12),-3px_-3px_10px_rgba(255,255,255,0.95)] dark:shadow-none"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{name}</span>
                  <div className="flex items-center gap-2">
                    {/* Sunken Neomorphic Capsule Input */}
                    <div className="relative flex items-center bg-[#F3F2FA] dark:bg-slate-950 rounded-full px-4 py-1.5 shadow-[inset_2px_2px_5px_rgba(163,163,196,0.22),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] dark:shadow-none w-28 justify-end cursor-text">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="0"
                        value={wasteMix[name] === 0 || wasteMix[name] === '0' ? '' : (wasteMix[name] !== undefined ? wasteMix[name] : '')}
                        onChange={e => handleWasteChange(name, e.target.value)}
                        className="w-full bg-transparent border-none text-xs font-bold font-sans text-right text-slate-900 dark:text-white focus:outline-none p-0"
                        style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#8B87A3] dark:text-slate-400 w-4 text-center">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Chemical Dosage Rates (kg / Ton) */}
        <div className="neumorphic-card p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Beaker className="h-4 w-4 text-[#6C4FE0] dark:text-purple-400" />
                2. Chemical Dosage Rates (kg / Ton of Paper)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Deducted automatically based on machine production weight
              </p>
            </div>

            {/* Chemical items with Sunken Neomorphic inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {availablePulpChemicals.map(chemName => (
                <div 
                  key={chemName} 
                  className="p-2.5 px-4 rounded-2xl bg-white dark:bg-slate-900/60 shadow-[3px_3px_10px_rgba(163,163,196,0.12),-3px_-3px_10px_rgba(255,255,255,0.95)] dark:shadow-none flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate pr-2">{chemName}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="relative flex items-center bg-[#F3F2FA] dark:bg-slate-950 rounded-full px-3 py-1.5 shadow-[inset_2px_2px_5px_rgba(163,163,196,0.22),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] dark:shadow-none w-20 justify-end cursor-text">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0"
                        value={chemicals[chemName] === 0 || chemicals[chemName] === '0' ? '' : (chemicals[chemName] !== undefined ? chemicals[chemName] : '')}
                        onChange={e => handleChemicalChange(chemName, e.target.value)}
                        className="w-full bg-transparent border-none text-xs font-bold font-sans text-right text-slate-900 dark:text-white focus:outline-none p-0"
                        style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#8B87A3] dark:text-slate-400 w-7">kg/T</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isViewer || isSubmitting}
              title={isViewer ? 'Viewer Mode: Saving formulas & chemical rates is locked (Read-Only)' : 'Save Formula & Chemical Rates'}
              className={`px-6 py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl font-black transition ${
                isViewer
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                  : isSubmitting
                  ? 'bg-primary/70 text-white cursor-wait opacity-80'
                  : 'btn-primary-gradient cursor-pointer active:scale-98'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isViewer ? (
                <Lock className="h-4 w-4 text-amber-500" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>
                {isSubmitting
                  ? 'Saving Formula & Chemical Rates...'
                  : isViewer
                  ? 'Save Formula & Chemical Rates (Locked)'
                  : 'Save Formula & Chemical Rates'}
              </span>
            </button>
          </div>
        </div>

      </form>

      {/* Pulp Mill Downtime Logger Section */}
      <div className="neumorphic-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#6C4FE0] dark:text-purple-400" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Pulp Mill Downtime Logger (Date: {dateStr.split('-').reverse().join('/')})
            </h3>
          </div>
        </div>

        <form onSubmit={handleAddDowntime} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="number"
            min="1"
            placeholder="Duration (Minutes)"
            value={downtimeMinutes}
            onChange={e => setDowntimeMinutes(e.target.value)}
            className="px-4 py-2.5 neumorphic-input text-xs font-bold dark:text-white focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Downtime Reason (e.g. Rotor belt inspection / Pump cleaning)"
            value={downtimeReason}
            onChange={e => setDowntimeReason(e.target.value)}
            className="px-4 py-2.5 neumorphic-input text-xs font-bold dark:text-white focus:outline-none sm:col-span-2"
            required
          />
          <button
            type="submit"
            disabled={isViewer}
            title={isViewer ? 'Viewer Mode: Recording downtime is locked (Read-Only)' : 'Record Downtime'}
            className={`px-5 py-2.5 text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-2xl font-black transition ${
              isViewer
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                : 'btn-primary-gradient cursor-pointer'
            }`}
          >
            {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Plus className="h-4 w-4" />}
            <span>{isViewer ? 'Record Downtime (Locked)' : 'Record Downtime'}</span>
          </button>
        </form>

        {/* Saved Downtimes List */}
        <div className="space-y-2.5 pt-2">
          {downtimeLogs.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium italic">No downtime recorded for today.</p>
          ) : (
            downtimeLogs.map(dt => (
              <div 
                key={dt.id} 
                className="p-3 px-4 rounded-2xl bg-white dark:bg-slate-900/60 shadow-[3px_3px_10px_rgba(163,163,196,0.1),-3px_-3px_10px_rgba(255,255,255,0.95)] dark:shadow-none flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 dark:text-slate-100">{dt.reason}</span>
                  <span className="block text-[10px] text-slate-400 font-sans">{dt.timestamp}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold px-3 py-1 rounded-full bg-[#FEE2E2] dark:bg-red-950/40 text-[#DC2626] dark:text-red-400 text-xs">
                    {dt.durationMinutes} Mins
                  </span>
                  <div className="relative">
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDtMenuId(activeDtMenuId === dt.id ? null : dt.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {activeDtMenuId === dt.id && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 py-1 text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => handleEditDowntime(dt)}
                          className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-semibold"
                        >
                          <Pencil className="h-3.5 w-3.5 text-blue-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDowntime(dt.id)}
                          className="w-full px-3 py-2 text-left flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer font-semibold"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Saved Formulas History Table */}
      <div className="neumorphic-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#6C4FE0] dark:text-purple-400" />
              Saved Pulp Formulas History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Historical waste paper mix & chemical dosage records
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-[#F3F2FA] dark:bg-slate-900 rounded-full px-3 py-1.5 flex items-center gap-2 w-full md:w-56 shadow-[inset_1px_1px_3px_rgba(163,163,196,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.9)] dark:shadow-none">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search date..."
                className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
              />
            </div>
            <DataFilterBar
              dateFrom={historyDateFrom}
              dateTo={historyDateTo}
              onDateFromChange={setHistoryDateFrom}
              onDateToChange={setHistoryDateTo}
              onClearAll={() => { setHistoryDateFrom(''); setHistoryDateTo(''); }}
            />
            <button
              type="button"
              onClick={() => setSortAscending(prev => !prev)}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-[2px_2px_6px_rgba(163,163,196,0.15),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-none"
              title={sortAscending ? 'Order: Ascending (Oldest First)' : 'Order: Descending (Newest First)'}
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-[#6C4FE0]" />
              <span>{sortAscending ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>
        </div>

        {/* Card-Based Layout for History Records */}
        {filteredFormulas.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 font-medium bg-[#F3F2FA]/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            No formula records match your search or date filter.
          </div>
        ) : (
          <div className="space-y-3.5">
            {(showAllHistory || searchTerm || historyDateFrom || historyDateTo
              ? filteredFormulas
              : filteredFormulas.slice(0, 3)
            ).map(f => {
              const priorityOrder = ['Indian Tissue Waste', 'Imported Tissue Waste'];
              const wasteEntries = Object.entries(f.wasteMix || {})
                .filter(([_, val]) => Number(val) > 0)
                .sort(([a], [b]) => {
                  const aIdx = priorityOrder.findIndex(p => p.toLowerCase() === a.toLowerCase().trim());
                  const bIdx = priorityOrder.findIndex(p => p.toLowerCase() === b.toLowerCase().trim());
                  if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                  if (aIdx !== -1) return -1;
                  if (bIdx !== -1) return 1;
                  return a.localeCompare(b);
                });
              const chemEntries = Object.entries(f.chemicals || {}).filter(([_, val]) => Number(val) > 0);
              const isSameAsPrev = sameAsPrevSet.has(f.id);

              const isHighlighted = highlightedFormulaId === f.id;

              return (
                <div
                  key={f.id}
                  className={`p-4 sm:p-5 bg-white dark:bg-slate-900/60 rounded-2xl space-y-4 transition ${
                    isHighlighted
                      ? 'bg-purple-50/90 dark:bg-purple-950/40 border-2 border-primary ring-2 ring-primary/30 shadow-lg shadow-purple-500/10 animate-pulse'
                      : 'shadow-[3px_3px_12px_rgba(163,163,196,0.12),-3px_-3px_12px_rgba(255,255,255,0.95)] dark:shadow-none'
                  }`}
                >
                  {/* Card Header: Date & Indicators */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#6C4FE0] dark:text-purple-400" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white font-sans">
                          {f.date.split('-').reverse().join('/')}
                        </span>
                      </div>

                      {isHighlighted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary text-white shadow-xs animate-bounce">
                          ✓ Just Saved
                        </span>
                      )}

                      {isSameAsPrev && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F2FE] text-[#0284C7] dark:bg-sky-950/60 dark:text-sky-300">
                          <Copy className="h-3 w-3" />
                          <span>Same as previous day</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-300 tracking-wide">
                        Active Engine
                      </span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFormulaMenuId(activeFormulaMenuId === f.id ? null : f.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Formula Actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {activeFormulaMenuId === f.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 py-1.5 text-xs animate-in fade-in"
                          >
                            <button
                              type="button"
                              onClick={() => handleLoadFormulaToEngine(f)}
                              className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-bold transition"
                            >
                              <Pencil className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span>Load / Edit Formula</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyFormulaToToday(f)}
                              className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-bold transition"
                            >
                              <Copy className="h-3.5 w-3.5 text-[#6C4FE0] dark:text-purple-400 shrink-0" />
                              <span>Copy for Today</span>
                            </button>

                            {(user?.role === 'Admin' || user?.role === 'PlantManager' || user?.role === 'PulpOperator') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFormula(f.id, f.date)}
                                className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer font-bold transition border-t border-slate-100 dark:border-slate-800 mt-1"
                              >
                                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                                <span>Delete Formula</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body: Separated Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Section 1: Waste Paper Mix */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Waste Paper Mix (100% Total)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {wasteEntries.length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">No waste mix logged</span>
                        ) : (
                          wasteEntries.map(([name, val]) => (
                            <span
                              key={name}
                              className="px-3 py-1 rounded-full text-xs font-bold bg-[#F3F2FA] dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shadow-[1px_1px_3px_rgba(163,163,196,0.15),-1px_-1px_3px_rgba(255,255,255,0.9)] dark:shadow-none"
                            >
                              <span className="text-[#6C4FE0] font-bold">{name}</span>
                              <strong className="font-black text-slate-900 dark:text-white">
                                {val}%
                              </strong>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Section 2: Chemical Dosage Rates */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Beaker className="h-3.5 w-3.5 text-[#6C4FE0] dark:text-purple-400" />
                        Chemical Rates (kg/Ton)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {chemEntries.length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">Standard dosage</span>
                        ) : (
                          chemEntries.map(([name, val]) => (
                            <span
                              key={name}
                              className="px-3 py-1 rounded-full text-xs font-bold bg-[#EDE9FE] dark:bg-purple-950/50 text-[#6C4FE0] dark:text-purple-300 flex items-center gap-1.5"
                            >
                              <span>{name}</span>
                              <strong className="font-black text-[#5B3DC9] dark:text-purple-200">
                                {val} kg/T
                              </strong>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredFormulas.length > 3 && !searchTerm && !historyDateFrom && !historyDateTo && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="px-5 py-2.5 bg-white dark:bg-slate-800 text-[#6C4FE0] dark:text-purple-400 font-black text-xs rounded-full shadow-[2px_2px_6px_rgba(163,163,196,0.15),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-none transition cursor-pointer inline-flex items-center gap-2"
                >
                  <span>{showAllHistory ? 'Show Less History' : `View More History (${filteredFormulas.length - 3} more records)`}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAllHistory ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Floating Toast */}
      <MobileToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
