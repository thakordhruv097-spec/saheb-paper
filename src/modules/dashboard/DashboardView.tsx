import React, { useMemo, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getReels,
  getRolls,
  getLogs,
  getPackingSlips,
  getPendingOrders,
  getParties,
  getLabReports,
} from '../../data/index';
import {
  Factory,
  Warehouse,
  Truck,
  Package,
  Tag,
  Shield,
  ArrowUpRight,
  RotateCw,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  FileText,
  QrCode,
  Zap,
} from 'lucide-react';
import { useDateFilter } from '../../context/DateFilterContext';
import { useDataSync } from '../../hooks/useDataSync';
import { syncAllTables } from '../../lib/supabaseSync';

// ─── CLEAN DASHBOARD ────────────────────────────────────────────────────

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { timeframe, selectedDate, systemToday } = useDateFilter();
  const dataSync = useDataSync();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [dataSync]);

  // ── DATA ──
  const reels = useMemo(() => getReels(), [refreshKey]);
  const rolls = useMemo(() => getRolls(), [refreshKey]);
  const packingSlips = useMemo(() => getPackingSlips(), [refreshKey]);
  const pendingOrders = useMemo(() => getPendingOrders(), [refreshKey]);
  const parties = useMemo(() => getParties().filter(p => p.active !== false), [refreshKey]);
  const logs = useMemo(() => getLogs(), [refreshKey]);

  // ── DATE FILTER ──
  const isDateInFilter = (itemDate: string): boolean => {
    if (!itemDate) return false;
    const target = itemDate.substring(0, 10);
    if (timeframe === 'all') return true;
    if (timeframe === 'day') return target === selectedDate;
    if (timeframe === 'month') return target.startsWith(selectedDate.substring(0, 7));
    if (timeframe === 'week') {
      const parts = selectedDate.split('-').map(Number);
      const [y, m, d] = parts;
      const startDt = new Date(y, m - 1, d - 6);
      const startStr = `${startDt.getFullYear()}-${String(startDt.getMonth() + 1).padStart(2, '0')}-${String(startDt.getDate()).padStart(2, '0')}`;
      return target >= startStr && target <= selectedDate;
    }
    return true;
  };

  // ── KPI CALCULATIONS (4 Core Cards) ──
  const kpis = useMemo(() => {
    const filteredReels = reels.filter(r => isDateInFilter(r.productionDate?.substring(0, 10) || ''));
    const filteredRolls = rolls.filter(r => isDateInFilter(r.date));

    const rollKg = filteredRolls.reduce((s, r) => s + r.weight, 0);
    const reelKg = filteredReels.reduce((s, r) => s + r.weight, 0);
    const outputKg = rollKg > 0 ? rollKg : reelKg;
    const outputCount = filteredRolls.length > 0 ? filteredRolls.length : filteredReels.length;

    const allReelKg = reels.reduce((s, r) => s + r.weight, 0);
    const allRollKg = rolls.reduce((s, r) => s + r.weight, 0);
    const fallbackKg = allRollKg > 0 ? allRollKg : allReelKg;
    const fallbackCount = rolls.length > 0 ? rolls.length : reels.length;

    const displayKg = outputKg > 0 ? outputKg : fallbackKg;
    const displayCount = outputKg > 0 ? outputCount : fallbackCount;
    const isFallback = outputKg === 0 && fallbackKg > 0;

    const inStock = reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B');
    const stockKg = inStock.reduce((s, r) => s + (Number(r.weight) || 0), 0);
    const stockCount = inStock.length;

    const dispatched = reels.filter(r => {
      if (r.status !== 'DISPATCHED') return false;
      const d = r.dispatchDetails?.dispatchDate || r.productionDate?.substring(0, 10);
      return isDateInFilter(d || '');
    });
    const dispatchedKg = dispatched.reduce((s, r) => s + r.weight, 0);
    const allDispatched = reels.filter(r => r.status === 'DISPATCHED');
    const allDispatchedKg = allDispatched.reduce((s, r) => s + r.weight, 0);
    const displayDispKg = dispatchedKg > 0 ? dispatchedKg : allDispatchedKg;
    const displayDispCount = dispatchedKg > 0 ? dispatched.length : allDispatched.length;
    const isDispFallback = dispatchedKg === 0 && allDispatchedKg > 0;

    const filteredSlips = packingSlips.filter(s => isDateInFilter(s.date || s.dispatchDate || ''));
    const challanCount = filteredSlips.length > 0 ? filteredSlips.length : packingSlips.length;
    const challanReels = filteredSlips.length > 0
      ? filteredSlips.reduce((s, sl) => s + (sl.reelNos?.length || 0), 0)
      : packingSlips.reduce((s, sl) => s + (sl.reelNos?.length || 0), 0);
    const isChallanFallback = filteredSlips.length === 0 && packingSlips.length > 0;

    return {
      outputKg: displayKg, outputCount: displayCount, isFallback,
      stockKg, stockCount,
      dispatchedKg: displayDispKg, dispatchedCount: displayDispCount, isDispFallback,
      challanCount, challanReels, isChallanFallback,
    };
  }, [reels, rolls, packingSlips, timeframe, selectedDate, refreshKey]);

  // ── LIVE ACTIVITY STREAM ──
  const recentActivity = useMemo(() => {
    const items: Array<{
      id: string;
      time: string;
      title: string;
      detail: string;
      icon: React.ElementType;
      iconColor: string;
    }> = [];

    const seenLogKeys = new Set<string>();
    logs.slice(0, 30).forEach(l => {
      const act = (l.action || '').toLowerCase();
      const mod = (l.module || '').toLowerCase();
      const isLogin = act.includes('login');
      const isLogout = act.includes('logout');
      const isProfile = act.includes('profile') || act.includes('role') || act.includes('password') || act.includes('pin');
      const isAuth = isLogin || isLogout || mod === 'auth';

      const cleanDetail = (l.details || l.action)
        .replace(/\s*on\s*\[.*?\]/gi, '')
        .replace(/\s*\[Windows PC\]/gi, '')
        .replace(/\s*\[Android App\]/gi, '')
        .replace(/\s*\[.*?\]/g, '')
        .trim();

      const dedupKey = `${l.action}-${l.user || ''}-${(l.timestamp || '').substring(0, 16)}`;
      if (seenLogKeys.has(dedupKey)) return;
      seenLogKeys.add(dedupKey);

      let logTitle = `${l.module} - ${l.action}`;
      if (isLogin) {
        logTitle = 'User Login';
      } else if (isLogout) {
        logTitle = 'User Logout';
      } else if (isProfile) {
        logTitle = 'Profile Update';
      }

      items.push({
        id: l.id,
        time: l.timestamp,
        title: logTitle,
        detail: cleanDetail || (l.user ? `User: ${l.user}` : 'Activity recorded'),
        icon: isAuth ? Shield : FileText,
        iconColor: isAuth
          ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
          : 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
      });
    });

    reels.slice(0, 20).forEach(r => {
      items.push({
        id: `reel-${r.reelNo}`,
        time: `${r.productionDate || '2026-01-01'}T12:00:00Z`,
        title: `Reel #${r.reelNo.slice(-8)}`,
        detail: `${r.product || 'Finished Reel'} • ${r.weight} kg • ${r.gsm} GSM • ${r.size} cm`,
        icon: Package,
        iconColor: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400',
      });
    });

    packingSlips.slice(0, 10).forEach(s => {
      const party = parties.find(p => p.id === s.partyId);
      items.push({
        id: s.id,
        time: `${s.date}T16:00:00Z`,
        title: `Dispatch Challan #${s.slipNo}`,
        detail: `${party?.name || 'Customer Party'} • ${s.reelNos?.length || 0} reels`,
        icon: Truck,
        iconColor: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
      });
    });

    items.sort((a, b) => b.time.localeCompare(a.time));
    return items.slice(0, 10);
  }, [logs, reels, packingSlips, parties, refreshKey]);

  // ── REFRESH TRIGGER ──
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
      await syncAllTables(true);
      window.dispatchEvent(new CustomEvent('saheb_data_updated', { detail: { tables: ['all'], table: 'all' } }));
      window.dispatchEvent(new Event('storage'));
      setRefreshKey(prev => prev + 1);
    } catch (_) {
      setRefreshKey(prev => prev + 1);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // ── MILL HEALTH STATS ──
  const readyStockCount = useMemo(() => reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B').length, [reels]);
  const qcPendingCount = useMemo(() => reels.filter(r => r.status === 'QC_PENDING').length, [reels]);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── DIRECT ACTION TRIGGERS ──
  const quickActions = [
    isMobile
      ? {
          id: 'scan-qr',
          label: 'Scan Reel QR',
          desc: 'Instant camera barcode & dispatch verification',
          path: '/dispatch-receipt/qr-scanner',
          icon: QrCode,
          iconBg: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400',
        }
      : {
          id: 'stock-audit',
          label: 'Stock Categorization',
          desc: 'Grade finished reels & stock classification',
          path: '/stock-categorization',
          icon: Package,
          iconBg: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400',
        },
    {
      id: 'print-tag',
      label: 'Print Thermal Tag',
      desc: '100×150 mm barcode labels & batch stickers',
      path: '/label-studio',
      icon: Tag,
      iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'new-challan',
      label: 'New Delivery Challan',
      desc: 'Create packing slip, select party & gate pass',
      path: '/dispatch-receipt/draft-packing-slip',
      icon: Truck,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'cut-reel',
      label: 'Cut New Reel Batch',
      desc: 'Slit parent jumbo roll to finished customer sizes',
      path: '/rewinding-reel-conversion',
      icon: RotateCw,
      iconBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    },
  ];

  // ── TIME LABEL ──
  const timeLabel = timeframe === 'day'
    ? (selectedDate === systemToday ? 'Today' : selectedDate.split('-').reverse().join('/'))
    : timeframe === 'week' ? 'This Week'
    : timeframe === 'month' ? 'This Month'
    : 'All Time';

  // ── RENDER ──
  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Mill Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {timeLabel} | Saheb Paper Mill ERP
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="neumorphic-card p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#6C4FE0] transition-all cursor-pointer disabled:opacity-50"
          title="Sync & Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── 4 KPI CARDS (Neumorphic) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* 1. Output */}
        <div className="neumorphic-card neumorphic-card-hover rounded-2xl p-4 sm:p-5 transition cursor-pointer group">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition">
            <span>
              {timeLabel === 'Today' ? "Today's Output" : `Output (${timeLabel})`}
            </span>
            <Factory className="h-4 w-4 text-[#6C4FE0] dark:text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left mt-1">
            {kpis.outputKg.toLocaleString()} kg
          </div>
          <div className="text-[11px] text-[#6C4FE0] dark:text-blue-400 font-semibold mt-1 flex items-center gap-0.5 truncate">
            <ArrowUpRight className="h-3 w-3 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span>{kpis.outputCount} {kpis.isFallback ? 'Total Reels' : 'Produced'}</span>
          </div>
        </div>

        {/* 2. Active Stock */}
        <div className="neumorphic-card neumorphic-card-hover rounded-2xl p-4 sm:p-5 transition cursor-pointer group">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition">
            <span>Active Stock</span>
            <Warehouse className="h-4 w-4 text-[#6C4FE0] dark:text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left mt-1">
            {kpis.stockKg.toLocaleString()} kg
          </div>
          <div className="text-[11px] text-[#6C4FE0] dark:text-blue-400 font-semibold mt-1 flex items-center gap-0.5 truncate">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>Grade A & B Ready</span>
          </div>
        </div>

        {/* 3. Dispatched */}
        <div className="neumorphic-card neumorphic-card-hover rounded-2xl p-4 sm:p-5 transition cursor-pointer group">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition">
            <span>
              {timeLabel === 'Today' ? 'Dispatched Today' : `Dispatched (${timeLabel})`}
            </span>
            <Truck className="h-4 w-4 text-[#6C4FE0] dark:text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left mt-1">
            {kpis.dispatchedKg.toLocaleString()} kg
          </div>
          <div className="text-[11px] text-[#6C4FE0] dark:text-blue-400 font-semibold mt-1 flex items-center gap-0.5 truncate">
            <ArrowUpRight className="h-3 w-3 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span>{kpis.dispatchedCount} Reels Shipped{kpis.isDispFallback ? ' (Total)' : ''}</span>
          </div>
        </div>

        {/* 4. Total Challans */}
        <div className="neumorphic-card neumorphic-card-hover rounded-2xl p-4 sm:p-5 transition cursor-pointer group">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition">
            <span>
              {timeLabel === 'Today' ? "Today's Challans" : `Challans (${timeLabel})`}
            </span>
            <FileText className="h-4 w-4 text-[#6C4FE0] dark:text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left mt-1">
            {kpis.challanCount}
          </div>
          <div className="text-[11px] text-[#6C4FE0] dark:text-blue-400 font-semibold mt-1 flex items-center gap-0.5 truncate">
            <ArrowUpRight className="h-3 w-3 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span>{kpis.challanReels} Reels in Challans{kpis.isChallanFallback ? ' (Total)' : ''}</span>
          </div>
        </div>
      </div>

      {/* ── LIVE ACTIVITY & DIRECT ACTION TRIGGERS (Side-by-side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* LEFT: Live Activity Stream (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-surface-dark rounded-3xl p-5 sm:p-6 space-y-4"
          style={{ boxShadow: '6px 6px 14px rgba(163,163,196,0.15), -4px -4px 12px rgba(255,255,255,0.7)' }}
        >
          <div className="flex items-center gap-2.5 border-b pb-3 dark:border-slate-700">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-[#6C4FE0] dark:text-purple-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Live Activity & Audit Stream
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Real-time operator change history & operational telemetry
              </p>
            </div>
          </div>

          <div
            className="space-y-2.5 overflow-y-auto pr-1 dashboard-custom-scrollbar"
            style={{ maxHeight: '350px' }}
          >
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No recent activity</div>
            ) : (
              recentActivity.map(item => {
                const ItemIcon = item.icon;
                return (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 transition-colors group">
                    <div className="pt-0.5 shrink-0">
                      <div className={`h-8 w-8 rounded-xl ${item.iconColor} flex items-center justify-center`}>
                        <ItemIcon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-bold text-slate-800 dark:text-white truncate">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-snug">
                        {item.detail}
                      </p>
                    </div>
                    <div className="shrink-0 text-[10.5px] text-slate-400 font-medium tabular-nums pt-0.5">
                      {item.time.substring(0, 10)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Direct Action Triggers & Mill Health Hub (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center px-1">
            <h2 className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[#6C4FE0]" />
              Quick Action Triggers
            </h2>
          </div>

          {/* Live Mill Health Stats Strip */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Ready Stock</div>
              <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">{readyStockCount} Reels</div>
            </div>
            <div className="border-x border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase">QC Status</div>
              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {qcPendingCount === 0 ? '0 QC Issues' : `${qcPendingCount} Pending`}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total Slips</div>
              <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">{kpis.challanCount} Challans</div>
            </div>
          </div>

          {/* 4 Direct Action Trigger Cards */}
          <div className="space-y-2.5">
            {quickActions.map(action => (
              <button
                key={action.id}
                onClick={() => navigate(action.path)}
                className="neumorphic-card neumorphic-card-hover w-full rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 text-left cursor-pointer group transition-all"
              >
                <div className={`p-2.5 rounded-xl ${action.iconBg} group-hover:scale-110 transition-transform shrink-0`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-extrabold text-slate-800 dark:text-white leading-tight truncate">
                    {action.label}
                  </h3>
                  <p className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {action.desc}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-[#6C4FE0] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
