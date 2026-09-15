import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getRolls, saveRoll, getProducts, getFormulaForDate, getFormulaInfoForDate } from '../../data/index';
import type { MachineRoll } from '../../data/types';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { DataFilterBar } from '../../components/DataFilterBar';
import { CustomSearchableSelect } from '../../components/CustomSearchableSelect';
import { Cog, Plus, Info, Search, Calendar, Clock, AlertTriangle, X, Lock, Scale } from 'lucide-react';

import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';
 
export const MachineView: React.FC = () => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();
  const navigate = useNavigate();
  const { timeframe, selectedDate } = useDateFilter();

  const [rolls, setRolls] = useState<MachineRoll[]>(() => getRolls());
  const products = getProducts();

  // Success / Error States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Search State
  const [searchRoll, setSearchRoll] = useState('');
  const [machDateFrom, setMachDateFrom] = useState('');
  const [machDateTo, setMachDateTo] = useState('');
  const [machShiftFilter, setMachShiftFilter] = useState('all');
  const [machProductFilter, setMachProductFilter] = useState('all');

  // Filtered Rolls Memo (displays recent logged rolls, with local search & DataFilterBar)
  const filteredRolls = useMemo(() => {
    let list = rolls;
    if (searchRoll.trim()) {
      const term = searchRoll.toLowerCase();
      list = list.filter(r => 
        r.rollNo.toLowerCase().includes(term) ||
        r.product.toLowerCase().includes(term) ||
        String(r.gsm).includes(term) ||
        String(r.width).includes(term)
      );
    }
    if (machDateFrom) list = list.filter(r => r.date >= machDateFrom);
    if (machDateTo) list = list.filter(r => r.date <= machDateTo);
    if (machShiftFilter && machShiftFilter !== 'all') list = list.filter(r => r.shift === machShiftFilter);
    if (machProductFilter && machProductFilter !== 'all') list = list.filter(r => r.product === machProductFilter);
    return list;
  }, [rolls, searchRoll, machDateFrom, machDateTo, machShiftFilter, machProductFilter]);

  // Form States - load from localStorage if present
  const [dateStr, setDateStr] = useState(() => {
    return localStorage.getItem('draft_roll_date') || (() => {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    })();
  });
  const [openDatePicker, setOpenDatePicker] = useState(false);

  // Check if today's date is using previous day's formula
  const formulaInfo = useMemo(() => getFormulaInfoForDate(dateStr), [dateStr]);

  const [rollNo, setRollNo] = useState(() => localStorage.getItem('draft_roll_no') || '');
  const [selectedProductId, setSelectedProductId] = useState(() => localStorage.getItem('draft_roll_product_id') || '');
  const [weightStr, setWeightStr] = useState(() => localStorage.getItem('draft_roll_weight') || '');
  const [gsmStr, setGsmStr] = useState(() => localStorage.getItem('draft_roll_gsm') || '');
  const [widthStr, setWidthStr] = useState(() => localStorage.getItem('draft_roll_width') || '30');
  const [jointStr, setJointStr] = useState(() => localStorage.getItem('draft_roll_joint') || '0');
  const [diaStr, setDiaStr] = useState(() => localStorage.getItem('draft_roll_dia') || '1150');
  const [shift, setShift] = useState<'A' | 'B'>(() => (localStorage.getItem('draft_roll_shift') as 'A' | 'B') || 'A');
  const [startTime, setStartTime] = useState(() => localStorage.getItem('draft_roll_start_time') || '08:00');
  const [offTime, setOffTime] = useState(() => localStorage.getItem('draft_roll_off_time') || '16:00');
  const [downtimeReason, setDowntimeReason] = useState(() => localStorage.getItem('draft_roll_downtime') || '');

  // Multiple Downtime Incidents List
  const [downtimeList, setDowntimeList] = useState<{ id: string; reason: string; minutes: number }[]>(() => {
    try {
      const saved = localStorage.getItem('draft_roll_downtimes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newDowntimeReason, setNewDowntimeReason] = useState('');
  const [newDowntimeMinutes, setNewDowntimeMinutes] = useState('');

  const totalDowntimeMinutes = useMemo(() => {
    return downtimeList.reduce((acc, item) => acc + item.minutes, 0);
  }, [downtimeList]);

  const handleAddDowntimeItem = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!newDowntimeReason.trim()) return;
    const mins = parseInt(newDowntimeMinutes, 10) || 0;
    if (mins <= 0) return;

    const item = {
      id: `dt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reason: newDowntimeReason.trim(),
      minutes: mins,
    };

    const updated = [...downtimeList, item];
    setDowntimeList(updated);
    localStorage.setItem('draft_roll_downtimes', JSON.stringify(updated));
    setNewDowntimeReason('');
    setNewDowntimeMinutes('');
  };

  const handleRemoveDowntimeItem = (id: string) => {
    const updated = downtimeList.filter(item => item.id !== id);
    setDowntimeList(updated);
    localStorage.setItem('draft_roll_downtimes', JSON.stringify(updated));
  };
  
  // Persist values to localStorage
  React.useEffect(() => {
    localStorage.setItem('draft_roll_date', dateStr);
    localStorage.setItem('draft_roll_no', rollNo);
    localStorage.setItem('draft_roll_product_id', selectedProductId);
    localStorage.setItem('draft_roll_weight', weightStr);
    localStorage.setItem('draft_roll_gsm', gsmStr);
    localStorage.setItem('draft_roll_width', widthStr);
    localStorage.setItem('draft_roll_joint', jointStr);
    localStorage.setItem('draft_roll_dia', diaStr);
    localStorage.setItem('draft_roll_shift', shift);
    localStorage.setItem('draft_roll_start_time', startTime);
    localStorage.setItem('draft_roll_off_time', offTime);
    localStorage.setItem('draft_roll_downtime', downtimeReason);
  }, [dateStr, rollNo, selectedProductId, weightStr, gsmStr, widthStr, jointStr, diaStr, shift, startTime, offTime, downtimeReason]);

  const clearDraft = () => {
    localStorage.removeItem('draft_roll_date');
    localStorage.removeItem('draft_roll_no');
    localStorage.removeItem('draft_roll_product_id');
    localStorage.removeItem('draft_roll_weight');
    localStorage.removeItem('draft_roll_gsm');
    localStorage.removeItem('draft_roll_width');
    localStorage.removeItem('draft_roll_joint');
    localStorage.removeItem('draft_roll_dia');
    localStorage.removeItem('draft_roll_shift');
    localStorage.removeItem('draft_roll_start_time');
    localStorage.removeItem('draft_roll_off_time');
    localStorage.removeItem('draft_roll_downtime');
    localStorage.removeItem('draft_roll_downtimes');
    setDowntimeList([]);
    setNewDowntimeReason('');
    setNewDowntimeMinutes('');
  };

  // Helper for working time calculation in minutes
  const calculateWorkingMinutes = (start: string, off: string): number => {
    if (!start || !off) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [oH, oM] = off.split(':').map(Number);
    if (isNaN(sH) || isNaN(sM) || isNaN(oH) || isNaN(oM)) return 0;
    let startMin = sH * 60 + sM;
    let offMin = oH * 60 + oM;
    if (offMin < startMin) {
      offMin += 24 * 60; // Overnight
    }
    return Math.max(0, offMin - startMin);
  };

  // Filter products for machine production (all Grade A products)
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.grade === 'A');
  }, [products]);

  // Auto-generate roll number based on date and count (e.g. R-YYYYMMDD-0001, R-YYYYMMDD-0002)
  const autoRollNo = useMemo(() => {
    const cleanDate = (dateStr || '').replace(/-/g, '');
    const prefix = `R-${cleanDate}-`;
    let maxSeq = 0;

    rolls.forEach(r => {
      if (r && r.rollNo) {
        const rUpper = r.rollNo.toUpperCase();
        const pUpper = prefix.toUpperCase();
        if (rUpper.startsWith(pUpper)) {
          const suffix = rUpper.slice(pUpper.length);
          const num = parseInt(suffix, 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        } else if (r.date === dateStr) {
          const match = r.rollNo.match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxSeq) {
              maxSeq = num;
            }
          }
        }
      }
    });

    const nextIndex = maxSeq + 1;
    const padIndex = String(nextIndex).padStart(4, '0');
    return `R-${cleanDate}-${padIndex}`;
  }, [dateStr, rolls]);

  // Set default GSM & Size when product is selected
  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setGsmStr(String(prod.gsm));
      setWidthStr(String(prod.size || 30));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (isViewer) {
      setErrorMsg('Viewer Mode: Production roll logging is locked. You have read-only access.');
      return;
    }

    const targetRollNo = rollNo.trim() || autoRollNo;
    const prod = products.find(p => p.id === selectedProductId);
    const weight = parseFloat(weightStr);
    const gsm = parseFloat(gsmStr);
    const width = parseFloat(widthStr);

    if (!selectedProductId || isNaN(weight) || isNaN(gsm) || isNaN(width)) {
      setErrorMsg('Please enter a valid product, weight, GSM, and width.');
      return;
    }

    if (weight <= 0 || gsm <= 0 || width <= 0) {
      setErrorMsg('Weight, GSM, and Width must be positive numbers.');
      return;
    }

    // Verify if roll number is already used
    if (rolls.some(r => r.rollNo.toUpperCase() === targetRollNo.toUpperCase())) {
      setErrorMsg(`Roll number #${targetRollNo} has already been logged.`);
      return;
    }

    // Get pulp mill recipe formula for target date
    const formula = getFormulaForDate(dateStr);
    if (!formula) {
      setErrorMsg('No active Pulp Mill recipe found for this date. Please log a recipe in Pulp Mill before recording machine production.');
      return;
    }

    const grossMin = calculateWorkingMinutes(startTime, offTime);
    const netWorkingMin = Math.max(0, grossMin - totalDowntimeMinutes);

    const compiledDowntime = downtimeList.length > 0
      ? downtimeList.map(d => `${d.reason} (${d.minutes}m)`).join(', ') + (downtimeReason.trim() ? ` | Note: ${downtimeReason.trim()}` : '')
      : downtimeReason.trim();

    const rollObj: MachineRoll = {
      rollNo: targetRollNo,
      product: prod ? prod.name : 'Unknown Product',
      weight,
      gsm,
      width,
      dia: parseFloat(diaStr) || 1150,
      joint: parseInt(jointStr) || 0,
      shift,
      startTime,
      offTime,
      workingMinutes: netWorkingMin,
      downtimeReason: compiledDowntime,
      date: dateStr,
      formulaId: formula.id,
    };

    try {
      saveRoll(rollObj, user?.displayName || 'System');
      setRolls(getRolls());
      setSuccessMsg(t('machine.save_success'));
      // Reset Form & clear draft
      setRollNo('');
      setWeightStr('');
      setGsmStr('');
      setWidthStr('30');
      setJointStr('0');
      setDowntimeReason('');
      clearDraft();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error logging roll');
    }
  };

  // Timeframe filtered rolls for KPI metrics
  const timeframeRolls = useMemo(() => {
    return rolls.filter(r => isDateInTimeframe(r.date, selectedDate, timeframe));
  }, [rolls, selectedDate, timeframe]);

  // Dynamic KPI Metrics for selected timeframe
  const totalProductionKg = useMemo(() => timeframeRolls.reduce((acc, r) => acc + r.weight, 0), [timeframeRolls]);
  const avgRollWeight = useMemo(() => timeframeRolls.length > 0 ? Math.round(totalProductionKg / timeframeRolls.length) : 0, [timeframeRolls, totalProductionKg]);
  const totalRollsCount = timeframeRolls.length;
  const timeframeSubtitle = useMemo(() => {
    if (timeframe === 'day') return `For Day (${selectedDate.split('-').reverse().join('/')})`;
    if (timeframe === 'week') return 'Weekly Production Window';
    if (timeframe === 'month') return `Month (${selectedDate.substring(0, 7)})`;
    return 'All-Time Total Output';
  }, [timeframe, selectedDate]);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
      <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs relative z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
              <Cog className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                  {t('machine.title')}
                </h1>
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold font-mono">
                  {timeframe === 'day' ? selectedDate : `${timeframe.toUpperCase()}: ${selectedDate}`}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Log production parent rolls, monitor machine shifts, and manage jumbo roll output.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner KPI Cards for Machine Production */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="neumorphic-card p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shrink-0">
            <Cog className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {timeframe === 'day' ? 'Output (Day)' : timeframe === 'week' ? 'Output (Week)' : timeframe === 'month' ? 'Output (Month)' : 'Total Output'}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalProductionKg >= 1000 ? `${(totalProductionKg / 1000).toFixed(2)} MT` : `${totalProductionKg} kg`}
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">{timeframeSubtitle}</p>
          </div>
        </div>

        <div className="neumorphic-card p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 shrink-0">
            <Calendar className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jumbo Rolls</p>
            <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{totalRollsCount} Rolls</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{timeframeSubtitle}</p>
          </div>
        </div>

        <div className="neumorphic-card p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
            <Scale className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Roll Weight</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{avgRollWeight.toLocaleString()} kg</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Per Parent Roll</p>
          </div>
        </div>

        <div className="neumorphic-card p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 shrink-0">
            <Clock className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Production Runs</p>
            <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {timeframeRolls.filter(r => r.shift === 'A').length}D / {timeframeRolls.filter(r => r.shift === 'B').length}N
            </p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Day / Night Shifts</p>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Roll Entry Form (2/3 width) */}
        <div className="lg:col-span-2 neumorphic-card p-6">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-5 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            {t('machine.log_roll')}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formulaInfo.isPreviousDay && (
              <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 text-xs rounded-2xl border border-blue-200 dark:border-blue-800/60 font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 shrink-0">
                    <Info className="h-4 w-4" />
                  </div>
                  <span>Notice: No Pulp Mill formula saved for {dateStr}. Using previous day's formula ({formulaInfo.formulaDate}) for raw material auto-deduction.</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/pulp-mill-operations')}
                  className="px-3.5 py-1.5 bg-[#6C4FE0] hover:bg-[#5B3DC9] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition shrink-0 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                >
                  <span>Set Today's Formula</span>
                  <span>→</span>
                </button>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 font-bold">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-2xl border border-red-200 dark:border-red-800 font-bold">
                {errorMsg}
              </div>
            )}

            {/* General Log Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="relative">
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Production Date
                </label>
                <button
                  type="button"
                  onClick={() => setOpenDatePicker(prev => !prev)}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 bg-white dark:bg-slate-800 rounded-2xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <span>{dateStr || 'dd-mm-yyyy'}</span>
                  <Calendar className="h-4 w-4 text-primary dark:text-blue-400" />
                </button>
                {openDatePicker && (
                  <CustomDatePickerModal
                    selectedDate={dateStr}
                    onSelectDate={(newDate) => {
                      setDateStr(newDate);
                      setOpenDatePicker(false);
                      setRollNo('');
                    }}
                    onClose={() => setOpenDatePicker(false)}
                  />
                )}
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Shift
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-white dark:bg-slate-800 rounded-2xl h-[42px] items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShift('A');
                      setStartTime('08:00');
                      setOffTime('16:00');
                    }}
                    className={`h-full rounded-xl text-xs transition-all duration-150 flex items-center justify-center cursor-pointer ${
                      shift === 'A'
                        ? 'bg-primary text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold'
                    }`}
                  >
                    Day Shift
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShift('B');
                      setStartTime('20:00');
                      setOffTime('04:00');
                    }}
                    className={`h-full rounded-xl text-xs transition-all duration-150 flex items-center justify-center cursor-pointer ${
                      shift === 'B'
                        ? 'bg-primary text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold'
                    }`}
                  >
                    Night Shift
                  </button>
                </div>
              </div>
            </div>

            {/* Formula Status Banner */}
            {!formulaInfo.formula ? (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="font-semibold">No Pulp Mill recipe logged for this date. Please log a formula first.</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/pulp-mill-operations')}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold shrink-0 transition"
                >
                  Go to Pulp Mill
                </button>
              </div>
            ) : formulaInfo.isPreviousDay ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl flex items-center gap-2 text-xs text-blue-800 dark:text-blue-200">
                <Info className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Active Recipe: Using Pulp Mill formula from <strong className="font-bold">{formulaInfo.formulaDate}</strong></span>
              </div>
            ) : null}

            {/* 1. Roll Data Section */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Roll Data Parameters
              </h4>
              {/* Row 1: Roll Number & Product Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 h-4 leading-none">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={e => setRollNo(e.target.value)}
                    className="w-full py-3 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-xs"
                    placeholder={autoRollNo}
                  />
                </div>
                <div>
                  <CustomSearchableSelect
                    label="PRODUCT TYPE"
                    placeholder="-- Select Product --"
                    value={selectedProductId}
                    onChange={(val) => {
                      setSelectedProductId(val);
                      handleProductSelect(val);
                    }}
                    options={filteredProducts.map(p => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Physical Parameters (Weight, GSM, Size, Dia, Joint) with aligned baseline */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-1">
                <div className="col-span-2">
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 h-4 leading-none truncate">
                    Weight (KG) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={weightStr}
                    onChange={e => setWeightStr(e.target.value)}
                    className="w-full py-3 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-xs"
                    placeholder="Weight in kg"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 h-4 leading-none text-center truncate">
                    GSM
                  </label>
                  <input
                    type="number"
                    value={gsmStr}
                    onChange={e => setGsmStr(e.target.value)}
                    className="w-full py-3 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-xs text-center"
                    placeholder="17"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 h-4 leading-none text-center whitespace-nowrap truncate" title="Roll Size (cm)">
                    Size (cm)
                  </label>
                  <input
                    type="number"
                    value={widthStr}
                    onChange={e => setWidthStr(e.target.value)}
                    className="w-full py-3 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-xs text-center"
                    placeholder="30"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 h-4 leading-none text-center whitespace-nowrap truncate" title="Dia (mm)">
                    Dia (mm)
                  </label>
                  <input
                    type="number"
                    value={diaStr}
                    onChange={e => setDiaStr(e.target.value)}
                    className="w-full py-3 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-xs text-center"
                    placeholder="1150"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 h-4 leading-none text-center truncate">
                    Joint
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={jointStr}
                    onChange={e => setJointStr(e.target.value)}
                    className="w-full py-3 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-xs text-center"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* 2. Time & Downtime Section */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Time Tracking & Downtime Incidents
                </h4>
                {totalDowntimeMinutes > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    {downtimeList.length} incident{downtimeList.length > 1 ? 's' : ''} ({totalDowntimeMinutes}m lost)
                  </span>
                )}
              </div>

              {/* Start & Off Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Off Time
                  </label>
                  <input
                    type="time"
                    value={offTime}
                    onChange={e => setOffTime(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  />
                </div>
              </div>

              {/* Working Time & Downtime Live Calculation Banner */}
              {(() => {
                const grossMins = calculateWorkingMinutes(startTime, offTime);
                const netMins = Math.max(0, grossMins - totalDowntimeMinutes);
                const grossHrs = Math.floor(grossMins / 60);
                const grossRem = grossMins % 60;
                const netHrs = Math.floor(netMins / 60);
                const netRem = netMins % 60;
                return (
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-bold">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Clock className="h-4 w-4 text-primary dark:text-blue-400 shrink-0" />
                        <span>Gross Run:</span>
                        <span className="font-mono text-slate-900 dark:text-white">{grossMins}m ({grossHrs}h {String(grossRem).padStart(2, '0')}m)</span>
                      </div>
                      {totalDowntimeMinutes > 0 && (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>Downtime:</span>
                          <span className="font-mono font-bold">-{totalDowntimeMinutes}m</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-emerald-700 dark:text-emerald-400">Net Working Time:</span>
                      <span className="text-primary dark:text-blue-400 font-mono font-black text-sm">
                        {netMins} mins <span className="text-xs font-normal text-slate-500">({netHrs}h {String(netRem).padStart(2, '0')}m)</span>
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic Downtime Incidents Logger with + Button */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Log Downtime Incident
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Add breakdown / delay with +</span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {['Paper Break', 'Wire Change', 'Felt Cleaning', 'Blade Change', 'Steam Low', 'Power Failure', 'Mechanical Maintenance'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewDowntimeReason(preset)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                        newDowntimeReason === preset
                          ? 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950/70 dark:border-amber-700 dark:text-amber-200'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Incident Inputs Row with + Button */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newDowntimeReason}
                    onChange={e => setNewDowntimeReason(e.target.value)}
                    placeholder="Reason (e.g. Wire change, Paper break)"
                    className="flex-1 py-2.5 px-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDowntimeItem();
                      }
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <div className="relative w-28">
                      <input
                        type="number"
                        min="1"
                        value={newDowntimeMinutes}
                        onChange={e => setNewDowntimeMinutes(e.target.value)}
                        placeholder="Minutes"
                        className="w-full py-2.5 px-3 pr-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400 text-right font-mono"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDowntimeItem();
                          }
                        }}
                      />
                      <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-slate-400 pointer-events-none">min</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDowntimeItem}
                      disabled={!newDowntimeReason.trim() || !newDowntimeMinutes || parseInt(newDowntimeMinutes, 10) <= 0}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Recorded Incidents List ("niche + hota rahe") */}
                {downtimeList.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <span>Logged Incidents ({downtimeList.length})</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono">Total: {totalDowntimeMinutes} mins lost</span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {downtimeList.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 px-3 rounded-xl bg-white dark:bg-slate-800/80 border border-amber-200/50 dark:border-amber-900/30 text-xs font-bold animate-in fade-in"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-slate-800 dark:text-slate-100 truncate">{item.reason}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-bold">
                              {item.minutes} mins
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDowntimeItem(item.id)}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition cursor-pointer"
                              title="Delete incident"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* General Downtime / Shift Notes (Optional) */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  General Production Notes / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={downtimeReason}
                  onChange={e => setDowntimeReason(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  placeholder="Any other observations, wire conditions, or shift handover notes..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isViewer}
              title={isViewer ? 'Viewer Mode: Production logging is locked (Read-Only)' : 'Submit Machine Production Log'}
              className={`w-full py-3.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl font-black transition ${
                isViewer
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                  : 'btn-primary-gradient cursor-pointer'
              }`}
            >
              {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : null}
              <span>{isViewer ? 'Submit Machine Production Log (Locked)' : 'Submit Machine Production Log'}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Recent Logged Rolls (1/3 width) */}
        <div className="neumorphic-card p-6">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Cog className="h-4 w-4 text-primary" />
            Recent Logged Rolls
          </h3>

          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchRoll}
                onChange={e => setSearchRoll(e.target.value)}
                placeholder="Search roll no, product..."
                className="w-full py-2 px-3 pl-8 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white placeholder-slate-400"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <DataFilterBar
              dateFrom={machDateFrom}
              dateTo={machDateTo}
              onDateFromChange={setMachDateFrom}
              onDateToChange={setMachDateTo}
              filterFields={[
                { id: 'shift', label: 'Shift', options: [{label: 'Day Shift', value: 'A'}, {label: 'Night Shift', value: 'B'}] },
                { id: 'product', label: 'Product', options: [...new Set(rolls.map(r => r.product))].map(p => ({label: p, value: p})) },
              ]}
              activeFilters={{ shift: machShiftFilter, product: machProductFilter }}
              onFilterChange={(fieldId, value) => {
                if (fieldId === 'shift') setMachShiftFilter(value);
                if (fieldId === 'product') setMachProductFilter(value);
              }}
              onClearAll={() => { setMachDateFrom(''); setMachDateTo(''); setMachShiftFilter('all'); setMachProductFilter('all'); }}
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredRolls.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center font-medium">No production rolls found.</p>
            ) : (
              [...filteredRolls].reverse().slice(0, 15).map(r => {
                const isDay = (r.shift as string) === 'A' || (r.shift as string) === 'Day';
                const isNight = (r.shift as string) === 'B' || (r.shift as string) === 'Night';
                const shiftDisplay = isDay ? 'Day' : isNight ? 'Night' : r.shift;
                return (
                  <div key={r.rollNo} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-black font-mono text-xs text-primary dark:text-blue-400">{r.rollNo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isDay 
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' 
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      }`}>
                        {shiftDisplay}
                      </span>
                    </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Product</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate block">{r.product}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Weight</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">{r.weight} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">GSM</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{r.gsm}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Roll Size</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{r.width} cm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Dia</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block font-mono">{r.dia || 1150} mm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Working Time</span>
                      <span className="font-bold text-primary dark:text-blue-400 block font-mono">
                        {r.workingMinutes ?? calculateWorkingMinutes(r.startTime, r.offTime)} mins
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Joints</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block font-mono">{r.joint ?? 0}</span>
                    </div>
                  </div>
                  {r.downtimeReason && (
                    <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 flex items-start gap-1 font-medium bg-amber-50/10 p-1.5 rounded-xl border border-amber-200/40">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      <span>Downtime: {r.downtimeReason}</span>
                    </div>
                  )}
                </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
export default MachineView;
