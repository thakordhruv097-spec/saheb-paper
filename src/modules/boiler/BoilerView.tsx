import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getBoilerLogs, saveBoilerLog, getRawMaterials, updateRawMaterialStock } from '../../data/index';
import type { BoilerLog, RawMaterialItem } from '../../data/types';
import {
  Flame,
  Droplet,
  List,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Gauge,
  Thermometer,
  CheckCircle2,
  AlertCircle,
  Lock,
  Beaker,
  Plus,
  X,
  ArrowDownRight,
} from 'lucide-react';
import { DataFilterBar } from '../../components/DataFilterBar';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';
import { useDataSync } from '../../hooks/useDataSync';

export const BoilerView: React.FC = () => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();
  const { timeframe, selectedDate } = useDateFilter();

  const syncTick = useDataSync(['boiler_logs', 'boiler', 'boiler_operations', 'raw_materials', 'raw_material_stock']);
  const [logs, setLogs] = useState<BoilerLog[]>(() => getBoilerLogs());
  const [rawMaterialsList, setRawMaterialsList] = useState<RawMaterialItem[]>(() => getRawMaterials());

  useEffect(() => {
    setLogs(getBoilerLogs());
    setRawMaterialsList(getRawMaterials());
  }, [syncTick]);

  const boilerChemicals = useMemo<RawMaterialItem[]>(() => {
    return rawMaterialsList.filter(m => m.category === 'CHEMICAL' && m.active !== false && m.usedInModule === 'BOILER');
  }, [rawMaterialsList]);

  // Chemical dosage inputs for the shift form:
  const [chemicalDosages, setChemicalDosages] = useState<Record<string, string>>({});

  // Quick chemical dosing modal state:
  const [quickDosingChem, setQuickDosingChem] = useState<RawMaterialItem | null>(null);
  const [quickDosingQty, setQuickDosingQty] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [boilerDateFrom, setBoilerDateFrom] = useState('');
  const [boilerDateTo, setBoilerDateTo] = useState('');
  const [boilerShiftFilter, setBoilerShiftFilter] = useState('all');

  // Helper to normalize shift for Day/Night display
  const normalizeShift = (s: string): 'Day' | 'Night' => {
    if (s === 'A' || s === 'Day' || s === 'day' || s === 'Shift A') return 'Day';
    if (s === 'B' || s === 'C' || s === 'Night' || s === 'night' || s === 'Shift B' || s === 'Shift C') return 'Night';
    return 'Day';
  };

  const filteredLogs = useMemo(() => {
    let list = logs;
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(l => {
        const norm = normalizeShift(l.shift).toLowerCase();
        const chemMatch = l.chemicalsUsed
          ? Object.keys(l.chemicalsUsed).some(k => k.toLowerCase().includes(q))
          : false;
        return (
          l.date.toLowerCase().includes(q) ||
          l.operator.toLowerCase().includes(q) ||
          norm.includes(q) ||
          `${norm} shift`.includes(q) ||
          String(l.woodUsed).includes(q) ||
          String(l.waterUsed).includes(q) ||
          String(l.pressure).includes(q) ||
          chemMatch
        );
      });
    }
    if (boilerDateFrom) list = list.filter(l => l.date >= boilerDateFrom);
    if (boilerDateTo) list = list.filter(l => l.date <= boilerDateTo);
    if (boilerShiftFilter && boilerShiftFilter !== 'all') {
      list = list.filter(l => normalizeShift(l.shift) === boilerShiftFilter);
    }
    return list;
  }, [logs, searchTerm, boilerDateFrom, boilerDateTo, boilerShiftFilter]);

  // Operator Entry Form States
  const todayStr = useMemo(() => {
    return new Date().toISOString().substring(0, 10);
  }, []);

  const [entryDate, setEntryDate] = useState(todayStr);
  const [shift, setShift] = useState<'Day' | 'Night'>('Day');
  const [woodStr, setWoodStr] = useState('');
  const [waterStr, setWaterStr] = useState('');
  const [pressureStr, setPressureStr] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const handleQuickDosingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDosingChem) return;
    if (isViewer) {
      setFormError('Viewer Mode: Logging chemical dosing is locked (Read-Only).');
      return;
    }
    const qty = parseFloat(quickDosingQty);
    if (isNaN(qty) || qty <= 0) {
      setFormError('Please enter a valid positive quantity to dose');
      return;
    }
    if (qty > quickDosingChem.stock) {
      setFormError(`Cannot dose ${qty} kg. Available stock is only ${quickDosingChem.stock} kg.`);
      return;
    }
    updateRawMaterialStock(quickDosingChem.id, -qty, user?.displayName || 'Boiler Operator');
    setRawMaterialsList(getRawMaterials());
    setFormSuccess(`Successfully logged ${qty} kg dosing for ${quickDosingChem.name}. Stock updated!`);
    setQuickDosingChem(null);
    setQuickDosingQty('');
  };

  const handleOperatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    if (isViewer) {
      setFormError('Viewer Mode: Logging boiler shift readings is locked. You have read-only access.');
      return;
    }

    const wood = parseFloat(woodStr);
    const water = parseFloat(waterStr);
    const pressure = parseFloat(pressureStr);

    if (isNaN(wood) || isNaN(water) || isNaN(pressure)) {
      setFormError('Please enter valid numeric values for wood, water, and pressure');
      return;
    }

    if (wood < 0 || water < 0 || pressure < 0) {
      setFormError('Values cannot be negative');
      return;
    }

    const chemsUsed: Record<string, number> = {};
    const chemSummary: string[] = [];
    Object.entries(chemicalDosages).forEach(([name, valStr]) => {
      const val = parseFloat(valStr);
      if (!isNaN(val) && val > 0) {
        chemsUsed[name] = val;
        chemSummary.push(`${name}: ${val} kg`);
      }
    });

    const newLog: BoilerLog = {
      id: `BLR-${entryDate.replace(/-/g, '')}-${shift}-${Date.now().toString().slice(-4)}`,
      date: entryDate || todayStr,
      woodUsed: wood,
      waterUsed: water,
      pressure,
      operator: user?.displayName || 'System',
      shift,
      chemicalsUsed: Object.keys(chemsUsed).length > 0 ? chemsUsed : undefined,
    };

    saveBoilerLog(newLog, user?.displayName || 'System');
    setLogs(getBoilerLogs());
    setRawMaterialsList(getRawMaterials());
    setFormSuccess(
      `Boiler ${shift} Shift data logged successfully and stock deducted!${
        chemSummary.length > 0 ? ` (Chemicals Dosed: ${chemSummary.join(', ')})` : ''
      }`
    );

    // Reset Form fields
    setWoodStr('');
    setWaterStr('');
    setPressureStr('');
    setChemicalDosages({});
  };

  const timeframeLogs = useMemo(() => {
    return logs.filter(l => isDateInTimeframe(l.date, selectedDate, timeframe));
  }, [logs, selectedDate, timeframe]);

  const totalWoodConsumed = useMemo(() => {
    return timeframeLogs.reduce((sum, l) => sum + (l.woodUsed || 0), 0);
  }, [timeframeLogs]);

  const totalWaterUsed = useMemo(() => {
    return timeframeLogs.reduce((sum, l) => sum + (l.waterUsed || 0), 0);
  }, [timeframeLogs]);

  const avgPressure = useMemo(() => {
    if (timeframeLogs.length === 0) return 0;
    return Number((timeframeLogs.reduce((sum, l) => sum + (l.pressure || 0), 0) / timeframeLogs.length).toFixed(1));
  }, [timeframeLogs]);

  const timeframeLabel = useMemo(() => {
    if (timeframe === 'day') return `For Day (${selectedDate})`;
    if (timeframe === 'week') return 'Weekly Fuel Window';
    if (timeframe === 'month') return `Month (${selectedDate.substring(0, 7)})`;
    return 'All-Time Logs';
  }, [timeframe, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Title Header Bar with Total Wood Consumption */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-500 border border-orange-200 dark:border-orange-900/60">
              <Flame className="h-6 w-6" />
            </div>
            <span>Boiler</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Track daily firewood fuel, water consumption, and steam pressure logs.
          </p>
        </div>

        {/* Total Wood Consumption Widget */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-200/80 dark:border-orange-800/60 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-xs">
            <div className="p-2 rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/30">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider block">
                {timeframe === 'day' ? "Day's Wood Used" : timeframe === 'week' ? "Week's Wood Used" : timeframe === 'month' ? "Month's Wood Used" : "Total Wood Used"}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                  {totalWoodConsumed.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOILER CHEMICALS & WATER TREATMENT STOCK */}
      <div className="neumorphic-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/60">
              <Beaker className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                  Boiler Chemicals &amp; Water Treatment Stock
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {boilerChemicals.length} Chemicals
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Live inventory of chemicals assigned to Boiler (from Admin Masters &gt; Raw Materials)
              </p>
            </div>
          </div>
        </div>

        {boilerChemicals.length === 0 ? (
          <div className="p-5 text-center text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs">
            <Beaker className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
            <p className="font-bold text-slate-600 dark:text-slate-300">No chemicals currently assigned to Boiler.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Go to <strong className="text-slate-700 dark:text-slate-200">Admin Masters &gt; Raw Materials</strong>, add or edit a chemical and select <strong className="text-rose-600 dark:text-rose-400">Used In: Boiler</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {boilerChemicals.map(chem => {
              const isLow = chem.stock <= (chem.minStock || 0);
              return (
                <div
                  key={chem.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 ${
                    isLow
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="font-black text-sm text-slate-900 dark:text-white truncate" title={chem.name}>
                        {chem.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        Code: {chem.code || 'N/A'}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        isLow
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {isLow ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Live Stock
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                          {chem.stock}
                        </span>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                          {chem.unit || 'kg'}
                        </span>
                      </div>
                    </div>
                    {chem.minStock !== undefined && chem.minStock > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-slate-400 block">Min Safe Level</span>
                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                          {chem.minStock} {chem.unit || 'kg'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-slate-400">
                      Boiler Treatment
                    </span>
                    <button
                      type="button"
                      disabled={isViewer || chem.stock <= 0}
                      onClick={() => setQuickDosingChem(chem)}
                      className="px-3 py-1.5 rounded-xl font-black text-[11px] bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-700 dark:text-purple-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                    >
                      <ArrowDownRight className="h-3.5 w-3.5 text-purple-500" />
                      <span>Quick Dose</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1. OPERATOR SHIFT DATA ENTRY FORM (Directly at top of page) */}
      <div className="neumorphic-card rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/30">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Boiler Shift Data Entry Form
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Log current Day / Night shift firewood, water consumption, and steam metrics
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleOperatorSubmit} className="space-y-4">
          {formSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{formSuccess}</span>
            </div>
          )}
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-2xl border border-red-200 dark:border-red-800 font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Date Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-orange-500" />
                Date
              </label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
                className="block w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              />
            </div>

            {/* Shift Selector (Day / Night Segmented Buttons) */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-orange-500" />
                Shift
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl h-[38px] items-center">
                <button
                  type="button"
                  onClick={() => setShift('Day')}
                  className="h-full rounded-lg font-black text-xs transition-all duration-150 flex items-center justify-center cursor-pointer bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  Day Shift
                </button>
                <button
                  type="button"
                  disabled
                  title="Night Shift is disabled"
                  className="h-full rounded-lg font-bold text-xs flex items-center justify-center cursor-not-allowed opacity-40 text-slate-400 dark:text-slate-500 select-none"
                >
                  Night Shift
                </button>
              </div>
            </div>

            {/* Wood Used */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                Wood/Fuel Used (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  value={woodStr}
                  onChange={e => setWoodStr(e.target.value)}
                  className="block w-full py-2.5 px-3 pr-10 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. 550"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">kg</span>
              </div>
            </div>

            {/* Water Consumed */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Droplet className="h-3.5 w-3.5 text-blue-500" />
                Water Used (L)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  value={waterStr}
                  onChange={e => setWaterStr(e.target.value)}
                  className="block w-full py-2.5 px-3 pr-10 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 750"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">L</span>
              </div>
            </div>

            {/* Steam Pressure */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5 text-slate-500" />
                Boiler Pressure (psi)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  value={pressureStr}
                  onChange={e => setPressureStr(e.target.value)}
                  className="block w-full py-2.5 px-3 pr-10 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. 137"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">psi</span>
              </div>
            </div>
          </div>

          {/* Dynamic Boiler Chemical Dosing for this Shift */}
          {boilerChemicals.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Beaker className="h-3.5 w-3.5 text-purple-500" />
                  <span>Chemical Dosing for this Shift (Optional)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Auto-deducts from Raw Material stock upon submission
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {boilerChemicals.map(chem => (
                  <div
                    key={chem.id}
                    className="space-y-1 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]" title={chem.name}>
                        {chem.name}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Avail: <strong className="font-mono text-purple-600 dark:text-purple-400">{chem.stock} {chem.unit || 'kg'}</strong>
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={chemicalDosages[chem.name] || ''}
                        onChange={e =>
                          setChemicalDosages(prev => ({ ...prev, [chem.name]: e.target.value }))
                        }
                        placeholder="e.g. 5"
                        className="block w-full py-1.5 px-2.5 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        {chem.unit || 'kg'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isViewer}
              title={isViewer ? 'Viewer Mode: Logging boiler shift readings is locked (Read-Only)' : 'Log Shift Readings'}
              className={`w-full sm:w-auto px-6 py-3 font-black rounded-2xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                isViewer
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                  : 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-700 hover:to-amber-700 text-white shadow-md shadow-orange-500/25 cursor-pointer'
              }`}
            >
              {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Flame className="h-4 w-4" />}
              <span>{isViewer ? 'Log Shift Readings (Locked)' : 'Log Shift Readings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* QUICK CHEMICAL DOSING MODAL */}
      {quickDosingChem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Beaker className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                    Quick Chemical Dosing
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Log standalone dosing directly to Boiler
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setQuickDosingChem(null);
                  setQuickDosingQty('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-purple-50/50 dark:bg-purple-950/30 p-3.5 rounded-2xl border border-purple-100 dark:border-purple-900/40 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Selected Chemical:</span>
                <span className="font-black text-slate-900 dark:text-white">{quickDosingChem.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Current Stock:</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  {quickDosingChem.stock} {quickDosingChem.unit || 'kg'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Item Code:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{quickDosingChem.code}</span>
              </div>
            </div>

            <form onSubmit={handleQuickDosingSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Quantity to Dose ({quickDosingChem.unit || 'kg'})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    autoFocus
                    max={quickDosingChem.stock}
                    value={quickDosingQty}
                    onChange={e => setQuickDosingQty(e.target.value)}
                    placeholder="e.g. 10"
                    className="block w-full py-2.5 px-3 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {quickDosingChem.unit || 'kg'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  This will immediately deduct from inventory stock and record in transaction logs.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuickDosingChem(null);
                    setQuickDosingQty('');
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-md shadow-purple-500/25 transition cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowDownRight className="h-4 w-4" />
                  <span>Dose &amp; Deduct Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. BOILER DAILY OPERATION REGISTERS (Directly Below Form) */}
      <div className="neumorphic-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading">
              BOILER DAILY OPERATION REGISTERS
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Total: <strong className="text-slate-900 dark:text-white">{filteredLogs.length}</strong> Registers
          </span>
        </div>

        {/* Search Bar + Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search logs by date, operator, shift..."
              className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <DataFilterBar
            dateFrom={boilerDateFrom}
            dateTo={boilerDateTo}
            onDateFromChange={setBoilerDateFrom}
            onDateToChange={setBoilerDateTo}
            filterFields={[
              {
                id: 'shift',
                label: 'Shift',
                options: [
                  { label: 'Day Shift', value: 'Day' },
                  { label: 'Night Shift', value: 'Night' },
                ],
              },
            ]}
            activeFilters={{ shift: boilerShiftFilter }}
            onFilterChange={(fieldId, value) => {
              if (fieldId === 'shift') setBoilerShiftFilter(value);
            }}
            onClearAll={() => {
              setBoilerDateFrom('');
              setBoilerDateTo('');
              setBoilerShiftFilter('all');
            }}
          />
        </div>

        {/* Logs Table */}
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            No boiler operation registers match your search criteria.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200 dark:border-slate-700/80">
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">SHIFT</th>
                    <th className="py-3 px-4">WOOD USED</th>
                    <th className="py-3 px-4">WATER USED</th>
                    <th className="py-3 px-4">PRESSURE</th>
                    <th className="py-3 px-4">CHEMICALS DOSED</th>
                    <th className="py-3 px-4 text-right">OPERATOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                  {filteredLogs
                    .slice()
                    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id))
                    .slice(0, visibleCount)
                    .map(log => {
                      const shiftName = normalizeShift(log.shift);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {log.date}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black inline-flex items-center gap-1 border ${
                                shiftName === 'Day'
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                              }`}
                            >
                              {shiftName === 'Day' ? 'Day Shift' : 'Night Shift'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-extrabold text-orange-600 dark:text-orange-400">
                            {log.woodUsed.toLocaleString()} kg
                          </td>
                          <td className="py-3 px-4 font-mono font-extrabold text-blue-600 dark:text-blue-400">
                            {log.waterUsed.toLocaleString()} L
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200 font-bold">
                            {log.pressure} psi
                          </td>
                          <td className="py-3 px-4">
                            {log.chemicalsUsed && Object.keys(log.chemicalsUsed).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(log.chemicalsUsed).map(([cName, qty]) => (
                                  <span
                                    key={cName}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 inline-flex items-center gap-1"
                                  >
                                    <Beaker className="h-3 w-3 text-purple-500" />
                                    <span>{cName}: {qty} kg</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700 dark:text-slate-300">
                            {log.operator}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="block md:hidden space-y-2.5">
              {filteredLogs
                .slice()
                .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id))
                .slice(0, visibleCount)
                .map(log => {
                  const shiftName = normalizeShift(log.shift);
                  return (
                    <div
                      key={log.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 text-xs text-left"
                    >
                      <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-700 pb-2">
                        <span className="font-bold font-mono text-slate-900 dark:text-white">{log.date}</span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                            shiftName === 'Day'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                          }`}
                        >
                          {shiftName === 'Day' ? 'Day Shift' : 'Night Shift'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Wood Used</span>
                          <span className="font-mono font-black text-orange-600 dark:text-orange-400">{log.woodUsed} kg</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Water Used</span>
                          <span className="font-mono font-black text-blue-600 dark:text-blue-400">{log.waterUsed} L</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Pressure</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{log.pressure} psi</span>
                        </div>
                      </div>

                      {log.chemicalsUsed && Object.keys(log.chemicalsUsed).length > 0 && (
                        <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold mb-1">Chemicals Dosed</span>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(log.chemicalsUsed).map(([cName, qty]) => (
                              <span
                                key={cName}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1"
                              >
                                <Beaker className="h-3 w-3 text-purple-500" />
                                <span>{cName}: {qty} kg</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center text-[10px] text-slate-400">
                        <span>Operator: <strong className="text-slate-700 dark:text-slate-300">{log.operator}</strong></span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* View More / Show Less Controls */}
            {filteredLogs.length > 10 && (
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  Showing <strong className="text-slate-900 dark:text-white font-mono">{Math.min(visibleCount, filteredLogs.length)}</strong> of <strong className="text-slate-900 dark:text-white font-mono">{filteredLogs.length}</strong> operation registers
                </span>
                <div className="flex items-center gap-2">
                  {visibleCount < filteredLogs.length ? (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(prev => prev + 10)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>View More Registers ({filteredLogs.length - visibleCount} remaining)</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(10)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Show Less</span>
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoilerView;
