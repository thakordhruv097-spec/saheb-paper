import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getEtpLogs, saveEtpLog } from '../../data/index';
import type { EtpLog } from '../../data/types';
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
} from 'lucide-react';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';

export const EtpView: React.FC = () => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();
  const { timeframe, selectedDate } = useDateFilter();

  const [logs, setLogs] = useState<EtpLog[]>(() => getEtpLogs());
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
      list = list.filter(
        l =>
          l.date.toLowerCase().includes(q) ||
          l.operator.toLowerCase().includes(q) ||
          String(l.flockLiq).includes(q) ||
          String(l.flockMaster).includes(q)
      );
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

    const newLog: EtpLog = {
      id: `etp-${dateStr.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
      date: dateStr,
      flockLiq,
      flockMaster,
      operator: user?.displayName || 'System',
    };

    saveEtpLog(newLog, user?.displayName || 'System');
    setLogs(getEtpLogs());
    setFormSuccess('ETP chemical usage logged successfully!');
    setFlockLiqStr('');
    setFlockMasterStr('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header Bar */}
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
                Record Flock 100 liquid and Flock Master solid consumption
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
              placeholder="Search logs by date or operator..."
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
