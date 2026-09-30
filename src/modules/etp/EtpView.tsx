import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getEtpLogs, saveEtpLog, getRawMaterials, updateRawMaterialStock } from '../../data/index';
import type { EtpLog, RawMaterialItem } from '../../data/types';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { DataFilterBar } from '../../components/DataFilterBar';
import {
  Droplet,
  Plus,
  List,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Lock,
  Clock,
  Sparkles,
  Activity,
  Beaker,
  X,
  ArrowDownRight,
} from 'lucide-react';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';
import { useDataSync } from '../../hooks/useDataSync';

export const EtpView: React.FC = () => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();
  const { timeframe, selectedDate } = useDateFilter();

  const syncTick = useDataSync(['etp_logs', 'etp', 'etp_operations', 'raw_materials', 'raw_material_stock']);
  const [logs, setLogs] = useState<EtpLog[]>(() => getEtpLogs());
  const [rawMaterialsList, setRawMaterialsList] = useState<RawMaterialItem[]>(() => getRawMaterials());

  useEffect(() => {
    setLogs(getEtpLogs());
    setRawMaterialsList(getRawMaterials());
  }, [syncTick]);

  const etpChemicals = useMemo<RawMaterialItem[]>(() => {
    return rawMaterialsList.filter(
      m => m.active !== false && (m.usedInModule === 'ETP' || m.usedInModule === 'UTILITIES_ETP')
    );
  }, [rawMaterialsList]);

  // Dynamic chemical dosages for registered ETP chemicals
  const [chemicalDosages, setChemicalDosages] = useState<Record<string, string>>({});

  // Quick dosing modal state
  const [quickDosingChem, setQuickDosingChem] = useState<RawMaterialItem | null>(null);
  const [quickDosingQty, setQuickDosingQty] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [etpDateFrom, setEtpDateFrom] = useState('');
  const [etpDateTo, setEtpDateTo] = useState('');

  const timeframeLogs = useMemo(() => {
    return logs.filter(l => isDateInTimeframe(l.date, selectedDate, timeframe));
  }, [logs, selectedDate, timeframe]);

  const totalFlockLiq = useMemo(() => {
    return Number(timeframeLogs.reduce((sum, l) => sum + (l.flockLiq || 0), 0).toFixed(1));
  }, [timeframeLogs]);

  const totalFlockMaster = useMemo(() => {
    return Number(timeframeLogs.reduce((sum, l) => sum + (l.flockMaster || 0), 0).toFixed(1));
  }, [timeframeLogs]);

  const avgDailyLiq = useMemo(() => {
    if (timeframeLogs.length === 0) return 0;
    return Number((totalFlockLiq / timeframeLogs.length).toFixed(1));
  }, [totalFlockLiq, timeframeLogs.length]);

  const timeframeLabel = useMemo(() => {
    if (timeframe === 'day') return `For Day (${selectedDate})`;
    if (timeframe === 'week') return 'Weekly Treatment Window';
    if (timeframe === 'month') return `Month (${selectedDate.substring(0, 7)})`;
    return 'All-Time Logs';
  }, [timeframe, selectedDate]);

  const filteredLogs = useMemo(() => {
    let list = logs;
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(l => {
        const chemMatch = l.chemicalsUsed
          ? Object.keys(l.chemicalsUsed).some(k => k.toLowerCase().includes(q))
          : false;
        return (
          l.date.toLowerCase().includes(q) ||
          l.operator.toLowerCase().includes(q) ||
          String(l.flockLiq).includes(q) ||
          String(l.flockMaster).includes(q) ||
          chemMatch
        );
      });
    }
    if (etpDateFrom) list = list.filter(l => l.date >= etpDateFrom);
    if (etpDateTo) list = list.filter(l => l.date <= etpDateTo);
    return list;
  }, [logs, searchTerm, etpDateFrom, etpDateTo]);

  // Form States
  const [dateStr, setDateStr] = useState(() => {
    return new Date().toISOString().substring(0, 10);
  });
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [flockLiqStr, setFlockLiqStr] = useState('');
  const [flockMasterStr, setFlockMasterStr] = useState('');
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
      setFormError(
        `Cannot dose ${qty} ${quickDosingChem.unit || 'kg'}. Available stock is only ${quickDosingChem.stock} ${quickDosingChem.unit || 'kg'}.`
      );
      return;
    }
    updateRawMaterialStock(quickDosingChem.id, -qty, user?.displayName || 'ETP Operator');
    setRawMaterialsList(getRawMaterials());
    setFormSuccess(
      `Successfully logged ${qty} ${quickDosingChem.unit || 'kg'} dosing for ${quickDosingChem.name}. Stock updated!`
    );
    setQuickDosingChem(null);
    setQuickDosingQty('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    if (isViewer) {
      setFormError('Viewer Mode: Logging ETP consumption is locked. You have read-only access.');
      return;
    }

    const flockLiq = parseFloat(flockLiqStr);
    const flockMaster = parseFloat(flockMasterStr);

    if (isNaN(flockLiq) || isNaN(flockMaster)) {
      setFormError('Please enter valid numbers for both chemical parameters');
      return;
    }

    if (flockLiq < 0 || flockMaster < 0) {
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

    const newLog: EtpLog = {
      id: `etp-${dateStr.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
      date: dateStr,
      flockLiq,
      flockMaster,
      operator: user?.displayName || 'System',
      chemicalsUsed: Object.keys(chemsUsed).length > 0 ? chemsUsed : undefined,
    };

    saveEtpLog(newLog, user?.displayName || 'System');
    setLogs(getEtpLogs());
    setRawMaterialsList(getRawMaterials());
    setFormSuccess(
      `ETP chemical usage logged successfully!${
        chemSummary.length > 0 ? ` (Additional Chemicals Dosed: ${chemSummary.join(', ')})` : ''
      }`
    );
    setFlockLiqStr('');
    setFlockMasterStr('');
    setChemicalDosages({});
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header Bar with ETP Chemicals Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-900/60">
              <Droplet className="h-6 w-6" />
            </div>
            <span>ETP &amp; Water Treatment</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Effluent water clarification, chemical dosing (Flock 100 &amp; Master), and discharge compliance.
          </p>
        </div>

        {/* ETP Chemicals Count Widget */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200/80 dark:border-teal-800/60 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-xs">
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/30">
              <Beaker className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider block">
                ETP Chemicals
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                  {etpChemicals.length}
                </span>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">configured</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ETP CHEMICALS & WATER TREATMENT STOCK */}
      <div className="neumorphic-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-900/60">
              <Beaker className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                  ETP Treatment Chemicals &amp; Stock
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {etpChemicals.length} Chemicals
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Live inventory of chemicals assigned to ETP operations (from Admin Masters &gt; Raw Materials)
              </p>
            </div>
          </div>
        </div>

        {etpChemicals.length === 0 ? (
          <div className="p-5 text-center text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs">
            <Beaker className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
            <p className="font-bold text-slate-600 dark:text-slate-300">No chemicals currently assigned to ETP.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Go to <strong className="text-slate-700 dark:text-slate-200">Admin Masters &gt; Raw Materials</strong>, add or edit a chemical and select <strong className="text-emerald-600 dark:text-emerald-400">Used In: ETP</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {etpChemicals.map(chem => {
              const isLow = chem.stock <= (chem.minStock || 0);
              return (
                <div
                  key={chem.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 ${
                    isLow
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:border-teal-300 dark:hover:border-teal-800'
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
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
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
                      ETP Treatment
                    </span>
                    <button
                      type="button"
                      disabled={isViewer || chem.stock <= 0}
                      onClick={() => setQuickDosingChem(chem)}
                      className="px-3 py-1.5 rounded-xl font-black text-[11px] bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-teal-700 dark:text-teal-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                    >
                      <ArrowDownRight className="h-3.5 w-3.5 text-teal-500" />
                      <span>Quick Dose</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1. LOG DAILY CHEMICAL USAGE FORM (Top Card - Full Width) */}
      <div className="neumorphic-card rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#6C4FE0] to-[#7C3AED] text-white shadow-sm shadow-[#6C4FE0]/30">
              <Droplet className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Log Daily Chemical Usage
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Record Flock 100 liquid, Flock Master solid, and additional ETP chemical dosing
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Log Date */}
            <div className="space-y-1 relative">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                Log Date
              </label>
              <button
                type="button"
                onClick={() => setOpenDatePicker(prev => !prev)}
                className="w-full flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <span>{dateStr || 'dd-mm-yyyy'}</span>
                <Calendar className="h-4 w-4 text-blue-500" />
              </button>
              {openDatePicker && (
                <CustomDatePickerModal
                  selectedDate={dateStr}
                  onSelectDate={(newDate) => {
                    setDateStr(newDate);
                    setOpenDatePicker(false);
                  }}
                  onClose={() => setOpenDatePicker(false)}
                />
              )}
            </div>

            {/* Flock 100 Liq */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Droplet className="h-3.5 w-3.5 text-blue-500" />
                Flock 100 Liq (Liters)
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.1"
                  value={flockLiqStr}
                  onChange={e => setFlockLiqStr(e.target.value)}
                  className="block w-full py-2.5 pl-3.5 pr-12 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition"
                  placeholder="e.g. 14.5"
                />
                <span className="absolute right-3.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                  L
                </span>
              </div>
            </div>

            {/* Flock Master Solid */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Droplet className="h-3.5 w-3.5 text-teal-500" />
                Flock Master Solid (kg)
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.1"
                  value={flockMasterStr}
                  onChange={e => setFlockMasterStr(e.target.value)}
                  className="block w-full py-2.5 pl-3.5 pr-14 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white transition"
                  placeholder="e.g. 7.0"
                />
                <span className="absolute right-3.5 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                  kg
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic ETP Chemical Dosing for this Entry */}
          {etpChemicals.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Beaker className="h-3.5 w-3.5 text-teal-500" />
                  <span>Additional ETP Chemical Dosing (Optional)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Auto-deducts from Raw Material stock upon submission
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {etpChemicals.map(chem => (
                  <div
                    key={chem.id}
                    className="space-y-1 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]" title={chem.name}>
                        {chem.name}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Avail: <strong className="font-mono text-teal-600 dark:text-teal-400">{chem.stock} {chem.unit || 'kg'}</strong>
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
                        className="block w-full py-1.5 px-2.5 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              title={isViewer ? 'Viewer Mode: Logging ETP consumption is locked (Read-Only)' : 'Log ETP Consumption'}
              className={`w-full sm:w-auto px-6 py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl font-black transition ${
                isViewer
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                  : 'btn-primary-gradient cursor-pointer'
              }`}
            >
              {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Plus className="h-4 w-4" />}
              <span>{isViewer ? 'Log ETP Consumption (Locked)' : 'Log ETP Consumption'}</span>
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
                <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                  <Beaker className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                    Quick Chemical Dosing
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Log standalone dosing directly to ETP
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

            <div className="bg-teal-50/50 dark:bg-teal-950/30 p-3.5 rounded-2xl border border-teal-100 dark:border-teal-900/40 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Selected Chemical:</span>
                <span className="font-black text-slate-900 dark:text-white">{quickDosingChem.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Current Stock:</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
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
                    className="block w-full py-2.5 px-3 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-md shadow-teal-500/25 transition cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowDownRight className="h-4 w-4" />
                  <span>Dose &amp; Deduct Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. RECENT ETP LOGS (Bottom Card - Full Width) */}
      <div className="neumorphic-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-teal-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading">
              Recent ETP Logs
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Total: <strong className="text-slate-900 dark:text-white">{filteredLogs.length}</strong> Logs
          </span>
        </div>

        {/* Search Input + Date Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <Search className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search logs by date, operator, chemicals..."
              className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
          <DataFilterBar
            dateFrom={etpDateFrom}
            dateTo={etpDateTo}
            onDateFromChange={setEtpDateFrom}
            onDateToChange={setEtpDateTo}
            onClearAll={() => {
              setEtpDateFrom('');
              setEtpDateTo('');
            }}
          />
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
            <Droplet className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No ETP chemical logs match your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200 dark:border-slate-700/80">
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">FLOCK 100 LIQUID</th>
                    <th className="py-3 px-4">FLOCK MASTER SOLID</th>
                    <th className="py-3 px-4">CHEMICALS DOSED</th>
                    <th className="py-3 px-4 text-right">LOGGED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                  {filteredLogs
                    .slice()
                    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id))
                    .slice(0, visibleCount)
                    .map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {log.date}
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold text-blue-600 dark:text-blue-400">
                          {log.flockLiq} L
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold text-teal-600 dark:text-teal-400">
                          {log.flockMaster} kg
                        </td>
                        <td className="py-3 px-4">
                          {log.chemicalsUsed && Object.keys(log.chemicalsUsed).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(log.chemicalsUsed).map(([cName, qty]) => (
                                <span
                                  key={cName}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-black bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 inline-flex items-center gap-1"
                                >
                                  <Beaker className="h-3 w-3 text-teal-500" />
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
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="block md:hidden space-y-2.5">
              {filteredLogs
                .slice()
                .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id))
                .slice(0, visibleCount)
                .map(log => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 text-xs text-left"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-700 pb-2">
                      <span className="font-bold font-mono text-slate-900 dark:text-white">{log.date}</span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        By: <strong className="text-slate-700 dark:text-slate-300">{log.operator}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Flock 100 Liq</span>
                        <span className="font-mono font-black text-blue-600 dark:text-blue-400">{log.flockLiq} L</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Flock Master</span>
                        <span className="font-mono font-black text-teal-600 dark:text-teal-400">{log.flockMaster} kg</span>
                      </div>
                    </div>

                    {log.chemicalsUsed && Object.keys(log.chemicalsUsed).length > 0 && (
                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold mb-1">Chemicals Dosed</span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(log.chemicalsUsed).map(([cName, qty]) => (
                            <span
                              key={cName}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 inline-flex items-center gap-1"
                            >
                              <Beaker className="h-3 w-3 text-teal-500" />
                              <span>{cName}: {qty} kg</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* View More Controls */}
            {filteredLogs.length > 10 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  Showing <strong className="text-slate-900 dark:text-white font-mono">{Math.min(visibleCount, filteredLogs.length)}</strong> of <strong className="text-slate-900 dark:text-white font-mono">{filteredLogs.length}</strong> logs
                </span>
                <div className="flex items-center gap-2">
                  {visibleCount < filteredLogs.length ? (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(prev => prev + 10)}
                      className="btn-primary-gradient px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View More Logs ({filteredLogs.length - visibleCount} remaining)</span>
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

export default EtpView;
