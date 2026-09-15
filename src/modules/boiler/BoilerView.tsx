import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getBoilerLogs, saveBoilerLog } from '../../data/index';
import type { BoilerLog } from '../../data/types';
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
} from 'lucide-react';
import { DataFilterBar } from '../../components/DataFilterBar';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';
import { useDataSync } from '../../hooks/useDataSync';

export const BoilerView: React.FC = () => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();
  const { timeframe, selectedDate } = useDateFilter();

  const syncTick = useDataSync(['boiler_logs', 'boiler', 'boiler_operations']);
  const [logs, setLogs] = useState<BoilerLog[]>(() => getBoilerLogs());

  useEffect(() => {
    setLogs(getBoilerLogs());
  }, [syncTick]);
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
        return (
          l.date.toLowerCase().includes(q) ||
          l.operator.toLowerCase().includes(q) ||
          norm.includes(q) ||
          `${norm} shift`.includes(q) ||
          String(l.woodUsed).includes(q) ||
          String(l.waterUsed).includes(q) ||
          String(l.pressure).includes(q)
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
      setFormError('Please enter valid numeric values for all fields');
      return;
    }

    if (wood < 0 || water < 0 || pressure < 0) {
      setFormError('Values cannot be negative');
      return;
    }

    const newLog: BoilerLog = {
      id: `BLR-${entryDate.replace(/-/g, '')}-${shift}-${Date.now().toString().slice(-4)}`,
      date: entryDate || todayStr,
      woodUsed: wood,
      waterUsed: water,
      pressure,
      operator: user?.displayName || 'System',
      shift,
    };

    saveBoilerLog(newLog, user?.displayName || 'System');
    setLogs(getBoilerLogs());
    setFormSuccess(`Boiler ${shift} Shift data logged successfully and stock deducted!`);

    // Reset Form fields
    setWoodStr('');
    setWaterStr('');
    setPressureStr('');
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
                  className={`h-full rounded-lg font-black text-xs transition-all duration-150 flex items-center justify-center cursor-pointer ${
                    shift === 'Day'
                      ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Day Shift
                </button>
                <button
                  type="button"
                  onClick={() => setShift('Night')}
                  className={`h-full rounded-lg font-black text-xs transition-all duration-150 flex items-center justify-center cursor-pointer ${
                    shift === 'Night'
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
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
