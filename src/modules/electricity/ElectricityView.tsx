import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getElectricityLogs, saveElectricityLog, getRolls } from '../../data/index';
import type { ElectricityLog } from '../../data/types';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { DataFilterBar } from '../../components/DataFilterBar';
import {
  Lightbulb,
  Plus,
  Search,
  List,
  CheckCircle2,
  AlertCircle,
  Zap,
  Calendar,
  ChevronDown,
  ChevronUp,
  Lock,
  Factory,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';
import { useDataSync } from '../../hooks/useDataSync';

export const ElectricityView: React.FC = () => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();
  const { timeframe, selectedDate } = useDateFilter();

  const syncTick = useDataSync(['electricity_logs', 'electricity', 'power_grid_operations', 'machine_rolls']);
  const [logs, setLogs] = useState<ElectricityLog[]>(() => getElectricityLogs());
  const [rolls, setRolls] = useState(() => getRolls());
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    setLogs(getElectricityLogs());
    setRolls(getRolls());
  }, [syncTick]);
  const [elecDateFrom, setElecDateFrom] = useState('');
  const [elecDateTo, setElecDateTo] = useState('');

  const timeframeLogs = useMemo(() => {
    return logs.filter(l => isDateInTimeframe(l.date, selectedDate, timeframe));
  }, [logs, selectedDate, timeframe]);

  const timeframeRolls = useMemo(() => {
    return rolls.filter(r => isDateInTimeframe(r.date, selectedDate, timeframe));
  }, [rolls, selectedDate, timeframe]);

  const totalKwh = useMemo(() => {
    return timeframeLogs.reduce((sum, l) => sum + (l.units || 0), 0);
  }, [timeframeLogs]);

  const totalTons = useMemo(() => {
    const kg = timeframeRolls.reduce((sum, r) => sum + (r.weight || 0), 0);
    return kg / 1000;
  }, [timeframeRolls]);

  const specificPower = useMemo(() => {
    return totalTons > 0 ? (totalKwh / totalTons).toFixed(1) : '0';
  }, [totalKwh, totalTons]);

  const timeframeLabel = useMemo(() => {
    if (timeframe === 'day') return `For Day (${selectedDate})`;
    if (timeframe === 'week') return 'Weekly Energy Window';
    if (timeframe === 'month') return `Month (${selectedDate.substring(0, 7)})`;
    return 'All-Time Readings';
  }, [timeframe, selectedDate]);

  const filteredLogs = useMemo(() => {
    let list = logs;
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(
        l =>
          l.date.toLowerCase().includes(q) ||
          l.operator.toLowerCase().includes(q) ||
          String(l.units).includes(q)
      );
    }
    if (elecDateFrom) list = list.filter(l => l.date >= elecDateFrom);
    if (elecDateTo) list = list.filter(l => l.date <= elecDateTo);
    return list;
  }, [logs, searchTerm, elecDateFrom, elecDateTo]);

  // Form States
  const [dateStr, setDateStr] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [unitsStr, setUnitsStr] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    if (isViewer) {
      setFormError('Viewer Mode: Logging electricity consumption is locked. You have read-only access.');
      return;
    }

    const units = parseFloat(unitsStr);
    if (isNaN(units) || units <= 0) {
      setFormError('Units consumed must be a positive number');
      return;
    }

    const finalDate = dateStr || new Date().toISOString().substring(0, 10);

    const newLog: ElectricityLog = {
      id: `elec-${finalDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
      date: finalDate,
      units,
      operator: user?.displayName || 'System',
    };

    saveElectricityLog(newLog, user?.displayName || 'System');
    setLogs(getElectricityLogs());
    setFormSuccess('Electricity consumption logged successfully!');
    setUnitsStr('');
  };

  // Helper to compute production tons for a given date
  const getProductionTonsForDate = (date: string) => {
    const totalKg = rolls
      .filter(r => r.date === date)
      .reduce((sum, r) => sum + r.weight, 0);
    return totalKg / 1000;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 border border-amber-200 dark:border-amber-900/60">
              <Zap className="h-6 w-6" />
            </div>
            <span>Electricity &amp; Power Telemetry</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Track grid power units (kWh), power factor, and specific consumption per metric ton.
          </p>
        </div>
      </div>

      {/* 1. LOG DAILY UNITS CONSUMED FORM (Top Card - Full Width) */}
      <div className="neumorphic-card rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-sm shadow-amber-500/30">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Log Daily Units Consumed (kWh)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Track grid power readings and specific power consumption per ton
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reading Date */}
            <div className="space-y-1 relative">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-amber-500" />
                Reading Date
              </label>
              <button
                type="button"
                onClick={() => setOpenDatePicker(prev => !prev)}
                className="w-full flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <span>{dateStr || 'dd-mm-yyyy'}</span>
                <Calendar className="h-4 w-4 text-amber-500" />
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

            {/* Daily Units Consumed (kWh) */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Daily Units Consumed (kWh)
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={unitsStr}
                  onChange={e => setUnitsStr(e.target.value)}
                  className="block w-full py-2.5 pl-3.5 pr-14 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white transition"
                  placeholder="e.g. 1500"
                />
                <span className="absolute right-3.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                  kWh
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isViewer}
              title={isViewer ? 'Viewer Mode: Logging electricity usage is locked (Read-Only)' : 'Log Electricity Usage'}
              className={`w-full sm:w-auto px-6 py-3 font-black text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-2 ${
                isViewer
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-600 to-orange-600 hover:from-amber-600 hover:via-yellow-700 hover:to-orange-700 text-white shadow-md shadow-amber-500/25 cursor-pointer'
              }`}
            >
              {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Plus className="h-4 w-4" />}
              <span>{isViewer ? 'Log Electricity Usage (Locked)' : 'Log Electricity Usage'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. RECENT ELECTRICITY LOGS (Bottom Card - Full Width) */}
      <div className="neumorphic-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading">
              Recent Electricity Logs
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
              placeholder="Search logs by date, operator..."
              className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
          <DataFilterBar
            dateFrom={elecDateFrom}
            dateTo={elecDateTo}
            onDateFromChange={setElecDateFrom}
            onDateToChange={setElecDateTo}
            onClearAll={() => {
              setElecDateFrom('');
              setElecDateTo('');
            }}
          />
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
            <Lightbulb className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No power consumption logs match your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200 dark:border-slate-700/80">
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">UNITS CONSUMED</th>
                    <th className="py-3 px-4">PAPER PRODUCTION</th>
                    <th className="py-3 px-4">POWER / TON EFFICIENCY</th>
                    <th className="py-3 px-4 text-right">LOGGED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                  {filteredLogs
                    .slice()
                    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id))
                    .slice(0, visibleCount)
                    .map(log => {
                      const prodTons = getProductionTonsForDate(log.date);
                      const unitsPerTon = prodTons > 0 ? log.units / prodTons : null;

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {log.date}
                          </td>
                          <td className="py-3 px-4 font-mono font-extrabold text-amber-600 dark:text-amber-400">
                            {log.units.toLocaleString()} kWh
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 font-bold">
                            {prodTons.toFixed(2)} tons
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-black inline-flex items-center gap-1 border bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 font-mono">
                              <Zap className="h-3 w-3" />
                              {unitsPerTon ? `${unitsPerTon.toFixed(2)} kWh/ton` : 'N/A (0 prod)'}
                            </span>
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
                  const prodTons = getProductionTonsForDate(log.date);
                  const unitsPerTon = prodTons > 0 ? log.units / prodTons : null;

                  return (
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
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Units Consumed</span>
                          <span className="font-mono font-black text-amber-600 dark:text-amber-400">{log.units.toLocaleString()} kWh</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Production</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{prodTons.toFixed(2)} tons</span>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500">Power / Ton:</span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black border bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 font-mono">
                          {unitsPerTon ? `${unitsPerTon.toFixed(2)} kWh/ton` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
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

export default ElectricityView;
