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
} from 'lucide-react';

interface DowntimeLog {
  id: string;
  durationMinutes: number;
  reason: string;
  timestamp: string;
}

import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';

export const PulpMillView: React.FC = () => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();
  const { timeframe, selectedDate } = useDateFilter();
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [formulas, setFormulas] = useState<PulpFormula[]>(() => getFormulas());
  const [searchTerm, setSearchTerm] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // Date selection state
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const dateBtnRef = useRef<HTMLButtonElement | null>(null);

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
    setSuccessMsg('Downtime entry deleted.');
    setTimeout(() => setSuccessMsg(''), 3000);
    setActiveDtMenuId(null);
  };

  const handleEditDowntime = (dt: DowntimeLog) => {
    setDowntimeMinutes(String(dt.durationMinutes));
    setDowntimeReason(dt.reason);
    const updated = downtimeLogs.filter(item => item.id !== dt.id);
    setDowntimeLogs(updated);
    localStorage.setItem('saheb_pulp_downtimes', JSON.stringify(updated));
    setSuccessMsg(`Editing downtime: ${dt.durationMinutes} mins (${dt.reason})`);
    setTimeout(() => setSuccessMsg(''), 3000);
    setActiveDtMenuId(null);
  };

  const handleLoadFormulaToEngine = (formula: PulpFormula) => {
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
    if (wasteList.length > 0) {
      return wasteList.map((w: RawMaterialItem) => w.name);
    }
    return ['Indian Tissue Waste', 'Imported Tissue Waste', 'SMK', 'Cupstock', 'Pulp Sheet', 'Broke'];
  }, []);

  const availablePulpChemicals = useMemo<string[]>(() => {
    return ['DSR', 'WSR', 'OBA', 'Hydrogen Peroxide', 'Hypo', 'Bleaching Powder', 'Caustic', 'Washing Powder'];
  }, []);

  // Waste Mix items
  const [wasteMix, setWasteMix] = useState<Record<string, number | string>>({});

  // Chemical items
  const [chemicals, setChemicals] = useState<Record<string, number | string>>({});

  // Load formula if already exists for dateStr or initialize to clean 0
  useEffect(() => {
    const existing = formulas.find(f => f.date === dateStr);
    if (existing) {
      if (existing.wasteMix) {
        const fullMix: Record<string, number | string> = {};
        availableWastePapers.forEach(name => {
          fullMix[name] = existing.wasteMix[name] !== undefined ? existing.wasteMix[name] : 0;
        });
        setWasteMix(fullMix);
      }
      if (existing.chemicals) {
        const fullChems: Record<string, number | string> = {};
        availablePulpChemicals.forEach(name => {
          fullChems[name] = existing.chemicals[name] !== undefined ? existing.chemicals[name] : 0;
        });
        setChemicals(fullChems);
      }
    } else {
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
  }, [dateStr, formulas, availableWastePapers, availablePulpChemicals]);

  const handleWasteChange = (name: string, val: string | number) => {
    if (val === '') {
      setWasteMix(prev => ({
        ...prev,
        [name]: '',
      }));
      return;
    }
    const num = parseFloat(String(val));
    setWasteMix(prev => ({
      ...prev,
      [name]: isNaN(num) ? '' : num,
    }));
  };

  const handleChemicalChange = (name: string, val: string | number) => {
    if (val === '') {
      setChemicals(prev => ({
        ...prev,
        [name]: '',
      }));
      return;
    }
    const num = parseFloat(String(val));
    setChemicals(prev => ({
      ...prev,
      [name]: isNaN(num) ? '' : num,
    }));
  };

  const totalWastePct = useMemo(() => {
    return Object.values(wasteMix).reduce<number>((sum, v) => sum + (Number(v) || 0), 0);
  }, [wasteMix]);

  const isFormula100 = Math.abs(totalWastePct - 100) < 0.001;

  const handleSubmitFormula = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (isViewer) {
      setErrorMsg('Viewer Mode: Saving formulas & chemical rates is locked. You have read-only monitoring access.');
      return;
    }

    if (!dateStr) {
      setErrorMsg('Date is required');
      return;
    }

    if (!isFormula100) {
      setErrorMsg(`Waste paper formula share must equal exactly 100% (Current sum: ${totalWastePct}%)`);
      return;
    }

    const formulaObj: PulpFormula = {
      id: `form-${dateStr}`,
      date: dateStr,
      wasteMix: Object.fromEntries(
        Object.entries(wasteMix).map(([k, v]) => [k, Number(v) || 0])
      ),
      chemicals: Object.fromEntries(
        Object.entries(chemicals).map(([k, v]) => [k, Number(v) || 0])
      ),
    };

    saveFormula(formulaObj, user?.displayName || 'System');
    setFormulas(getFormulas());
    setSuccessMsg(`Pulp Mill Formula & Chemical Rates for ${dateStr} saved successfully!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddDowntime = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      setErrorMsg('Viewer Mode: Recording downtime is locked.');
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
    setSuccessMsg(`Downtime entry (${newLog.durationMinutes} mins) recorded.`);
    setTimeout(() => setSuccessMsg(''), 3000);
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

  return (
    <div className="space-y-6">
      {/* 1. CLEAN MINIMAL HEADER CARD */}
      <div className="neumorphic-card p-5 text-slate-900 dark:text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] dark:bg-purple-950/60 text-[#6C4FE0] dark:text-purple-400 flex items-center justify-center shadow-xs shrink-0">
              <Factory className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                  Pulp Mill Daily Setup & Formula Rules
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Date: <strong className="text-slate-900 dark:text-white font-sans">{dateStr.split('-').reverse().join('/')}</strong> &bull; Governs automatic raw material deduction on Machine Production.
              </p>
            </div>
          </div>

          {/* Date Switcher Pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              ref={dateBtnRef}
              type="button"
              onClick={() => setOpenDatePicker(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition shadow-[3px_3px_8px_rgba(163,163,196,0.18),-3px_-3px_8px_rgba(255,255,255,0.95)] dark:shadow-none"
            >
              <Calendar className="h-4 w-4 text-[#6C4FE0] dark:text-purple-400" />
              <span>Date: {dateStr.split('-').reverse().join('/')}</span>
            </button>
          </div>
        </div>
      </div>

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
              {Object.keys(wasteMix).map(name => (
                <div 
                  key={name} 
                  className="flex items-center justify-between p-2.5 px-4 rounded-2xl bg-white dark:bg-slate-900/60 shadow-[3px_3px_10px_rgba(163,163,196,0.12),-3px_-3px_10px_rgba(255,255,255,0.95)] dark:shadow-none"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{name}</span>
                  <div className="flex items-center gap-2">
                    {/* Sunken Neomorphic Capsule Input Matching 2nd Picture */}
                    <div 
                      onClick={e => {
                        const input = e.currentTarget.querySelector('input');
                        if (input) input.focus();
                      }}
                      className="relative flex items-center bg-[#F3F2FA] dark:bg-slate-950 rounded-full px-4 py-1.5 shadow-[inset_2px_2px_5px_rgba(163,163,196,0.22),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] dark:shadow-none w-28 justify-end cursor-text"
                    >
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={wasteMix[name] !== undefined ? wasteMix[name] : 0}
                        onChange={e => handleWasteChange(name, e.target.value)}
                        onFocus={e => {
                          const currentVal = wasteMix[name];
                          if (currentVal === 0 || currentVal === '0' || Number(currentVal) === 0 || e.target.value === '0') {
                            handleWasteChange(name, '');
                          } else {
                            e.target.select();
                          }
                        }}
                        onClick={e => {
                          const currentVal = wasteMix[name];
                          if (currentVal === 0 || currentVal === '0' || Number(currentVal) === 0 || (e.target as HTMLInputElement).value === '0') {
                            handleWasteChange(name, '');
                          } else {
                            (e.target as HTMLInputElement).select();
                          }
                        }}
                        onBlur={e => {
                          if (e.target.value === '' || e.target.value === undefined) {
                            handleWasteChange(name, 0);
                          }
                        }}
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
                    <div 
                      onClick={e => {
                        const input = e.currentTarget.querySelector('input');
                        if (input) input.focus();
                      }}
                      className="relative flex items-center bg-[#F3F2FA] dark:bg-slate-950 rounded-full px-3 py-1.5 shadow-[inset_2px_2px_5px_rgba(163,163,196,0.22),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] dark:shadow-none w-20 justify-end cursor-text"
                    >
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={chemicals[chemName] !== undefined ? chemicals[chemName] : 0}
                        onChange={e => handleChemicalChange(chemName, e.target.value)}
                        onFocus={e => {
                          const currentVal = chemicals[chemName];
                          if (currentVal === 0 || currentVal === '0' || Number(currentVal) === 0 || e.target.value === '0') {
                            handleChemicalChange(chemName, '');
                          } else {
                            e.target.select();
                          }
                        }}
                        onClick={e => {
                          const currentVal = chemicals[chemName];
                          if (currentVal === 0 || currentVal === '0' || Number(currentVal) === 0 || (e.target as HTMLInputElement).value === '0') {
                            handleChemicalChange(chemName, '');
                          } else {
                            (e.target as HTMLInputElement).select();
                          }
                        }}
                        onBlur={e => {
                          if (e.target.value === '' || e.target.value === undefined) {
                            handleChemicalChange(chemName, 0);
                          }
                        }}
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
              disabled={isViewer}
              title={isViewer ? 'Viewer Mode: Saving formulas & chemical rates is locked (Read-Only)' : 'Save Formula & Chemical Rates'}
              className={`px-6 py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl font-black transition ${
                isViewer
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                  : 'btn-primary-gradient cursor-pointer'
              }`}
            >
              {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Save className="h-4 w-4" />}
              <span>{isViewer ? 'Save Formula & Chemical Rates (Locked)' : 'Save Formula & Chemical Rates'}</span>
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
              const wasteEntries = Object.entries(f.wasteMix || {}).filter(([_, val]) => Number(val) > 0);
              const chemEntries = Object.entries(f.chemicals || {}).filter(([_, val]) => Number(val) > 0);
              const isSameAsPrev = sameAsPrevSet.has(f.id);

              return (
                <div
                  key={f.id}
                  className="p-4 sm:p-5 bg-white dark:bg-slate-900/60 rounded-2xl space-y-4 shadow-[3px_3px_12px_rgba(163,163,196,0.12),-3px_-3px_12px_rgba(255,255,255,0.95)] dark:shadow-none transition"
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

      {/* Date Picker Modal */}
      {openDatePicker && (
        <CustomDatePickerModal
          selectedDate={dateStr}
          onSelectDate={(newDate) => {
            setDateStr(newDate);
            setOpenDatePicker(false);
          }}
          onClose={() => setOpenDatePicker(false)}
          triggerRef={dateBtnRef}
        />
      )}
    </div>
  );
};
