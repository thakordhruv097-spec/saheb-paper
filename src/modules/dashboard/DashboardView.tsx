import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  getRawMaterials,
  getRolls,
  getReels,
  getLogs,
  getParties,
  getBoilerLogs,
  getEtpLogs,
  getStoreItems,
  getFormulas,
  getPackingSlips,
  getPendingOrders,
  getLabReports,
} from '../../data/index';
import type { User, UserRole } from '../../data/types';
import {
  Factory,
  Package,
  Truck,
  BarChart2,
  Settings,
  Users,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Download,
  ClipboardList,
  Flame,
  Droplet,
  Wrench,
  Warehouse,
  Plus,
  RotateCw,
  Cog,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Inbox,
  FileText,
  Layers,
  MoreVertical,
  ShoppingCart,
  X,
  Search,
  FlaskConical,
  Eye,
  Shield,
  Building2,
} from 'lucide-react';

import { useDateFilter, getDateRangeForTimeframe } from '../../context/DateFilterContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useDataSync } from '../../hooks/useDataSync';
import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';

export type DashboardRole =
  | 'admin'
  | 'pulp'
  | 'machine'
  | 'rewinder'
  | 'lab'
  | 'boiler'
  | 'etp'
  | 'dispatch'
  | 'store'
  | 'viewer';

export function getEffectiveDashboardRole(user: User | null): DashboardRole {
  if (!user) return 'admin';
  const uname = (user.username || '').toLowerCase().trim();
  const dname = (user.displayName || '').toLowerCase().trim();
  const desname = (user.designation || '').toLowerCase().trim();
  const role = user.role;
  const roles = user.roles || [];
  const allRoles = [role, ...roles].filter(Boolean) as UserRole[];
  const modules = user.customModules || [];

  // 1. Explicit Admin / Management
  if (allRoles.some(r => r === 'Admin' || r === 'Management') || uname === 'admin') {
    return 'admin';
  }

  // 2. Viewer
  if (allRoles.some(r => r === 'Viewer') || uname === 'viewer') {
    return 'viewer';
  }

  // 3. Boiler Operator
  if (
    allRoles.some(r => r === 'BoilerOperator') ||
    uname.includes('boiler') ||
    dname.includes('boiler') ||
    desname.includes('boiler')
  ) {
    return 'boiler';
  }

  // 4. ETP Operator
  if (
    allRoles.some(r => r === 'EtpOperator') ||
    uname.includes('etp') ||
    dname.includes('etp') ||
    desname.includes('etp')
  ) {
    return 'etp';
  }

  // 5. Pulp Mill / Pulper Operator
  if (
    allRoles.some(r => r === 'PulpOperator') ||
    (allRoles.some(r => r === 'LabOperator') && (uname === 'pulper' || dname.includes('pulp') || desname.includes('pulp'))) ||
    uname === 'pulper' ||
    dname.includes('pulper') ||
    dname.includes('pulp mill')
  ) {
    return 'pulp';
  }

  // 6. Lab Quality Control / Testing / Plant Manager
  if (
    allRoles.some(r => r === 'PlantManager' || r === 'LabOperator') ||
    uname === 'plant_manager' ||
    uname === 'qc' ||
    uname.includes('lab') ||
    dname.includes('lab') ||
    dname.includes('quality') ||
    dname.includes('qc') ||
    desname.includes('lab') ||
    desname.includes('quality')
  ) {
    return 'lab';
  }

  // 7. Rewinder Operator
  if (
    allRoles.some(r => r === 'RewinderOperator') ||
    uname.includes('rewind') ||
    dname.includes('rewind') ||
    desname.includes('rewind')
  ) {
    return 'rewinder';
  }

  // 8. Machine Operator / Machinery
  if (
    allRoles.some(r => r === 'MachineOperator' || r === ('Machinery' as any)) ||
    uname.includes('mach') ||
    dname.includes('mach') ||
    desname.includes('mach')
  ) {
    return 'machine';
  }

  // 9. Dispatcher / Warehouse Staff
  if (
    allRoles.some(r => r === 'Dispatcher' || r === 'WarehouseStaff') ||
    uname === 'dispatcher' ||
    dname.includes('dispatch') ||
    dname.includes('warehouse') ||
    desname.includes('dispatch')
  ) {
    return 'dispatch';
  }

  // 10. Store Manager / Shopper / Procurement
  if (
    allRoles.some(r => r === 'StoreManager' || r === 'Shopper') ||
    uname === 'shop' ||
    dname.includes('shop') ||
    dname.includes('store') ||
    dname.includes('procurement') ||
    desname.includes('shop') ||
    desname.includes('store')
  ) {
    return 'store';
  }

  // Fallback: If customModules are configured without 'dashboard' (or single department)
  if (modules.length > 0) {
    if (modules.includes('pulp_mill_operations') && !modules.includes('machine_production')) return 'pulp';
    if (modules.includes('machine_production')) return 'machine';
    if (modules.includes('rewinding_reel_conversion')) return 'rewinder';
    if (modules.includes('lab')) return 'lab';
    if (modules.includes('boiler')) return 'boiler';
    if (modules.includes('etp')) return 'etp';
    if (modules.includes('dispatch') || modules.includes('finished_stock_dispatch') || modules.includes('orders')) return 'dispatch';
    if (modules.includes('spareparts_management')) return 'store';
  }

  return 'admin';
}

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { timeframe, setTimeframe, selectedDate, dateTick, systemToday } = useDateFilter();

  const dataSync = useDataSync();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  useBodyScrollLock(isActivityModalOpen);



  // Re-sync data when dateTick or cloud/local data updates
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [dateTick, dataSync]);

  const effectiveRole = useMemo(() => getEffectiveDashboardRole(user), [user]);
  const [adminDeptView, setAdminDeptView] = useState<'all' | 'pulp' | 'machine' | 'rewinder' | 'lab' | 'boiler' | 'etp' | 'dispatch' | 'store'>('all');
  const activeDashboard = effectiveRole === 'admin'
    ? (adminDeptView === 'all' ? 'admin' : adminDeptView)
    : effectiveRole;

  // Re-sync all data when refreshKey increments
  const materials = useMemo(() => getRawMaterials(), [refreshKey]);
  const rolls = useMemo(() => getRolls(), [refreshKey]);
  const reels = useMemo(() => getReels(), [refreshKey]);
  const parties = useMemo(() => getParties(), [refreshKey]);
  const boilerLogs = useMemo(() => getBoilerLogs(), [refreshKey]);
  const etpLogs = useMemo(() => getEtpLogs(), [refreshKey]);
  const formulas = useMemo(() => getFormulas(), [refreshKey]);
  const packingSlips = useMemo(() => getPackingSlips(), [refreshKey]);
  const labReports = useMemo(() => getLabReports(), [refreshKey]);

  // Date Filter helper for dynamic metric filtering
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

  const [activityCategory, setActivityCategory] = useState<'all' | 'boiler' | 'production' | 'dispatch' | 'system'>('all');

  // Comprehensive Unified Operational Activity Stream
  const unifiedActivityStream = useMemo(() => {
    const items: Array<{
      id: string;
      timestamp: string;
      date: string;
      operator: string;
      category: 'boiler' | 'production' | 'dispatch' | 'system';
      title: string;
      details: string;
      badgeText: string;
      badgeStyle: string;
    }> = [];

    // 1. Audit Logs (Logins, logouts, profile updates)
    const rawLogs = getLogs();
    rawLogs.forEach(l => {
      const dateStr = l.timestamp.substring(0, 10);
      const isAuth = l.action.toLowerCase().includes('login') || l.action.toLowerCase().includes('logout');
      const isProfile = l.module.toLowerCase().includes('auth') || l.action.toLowerCase().includes('profile');
      
      items.push({
        id: l.id,
        timestamp: l.timestamp,
        date: dateStr,
        operator: l.user || 'System',
        category: 'system',
        title: isProfile ? 'Profile & Account Update' : isAuth ? 'User Authentication' : `${l.module} ${l.action}`,
        details: l.details || l.action,
        badgeText: isProfile ? 'PROFILE' : isAuth ? 'AUTH' : 'SYSTEM',
        badgeStyle: isProfile ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
      });
    });

    // 2. Boiler Shift Logs
    boilerLogs.forEach(b => {
      items.push({
        id: `boiler-${b.id}`,
        timestamp: `${b.date}T${b.shift === 'A' ? '08:00:00' : b.shift === 'B' ? '16:00:00' : '00:00:00'}Z`,
        date: b.date,
        operator: b.operator || 'Boiler Incharge',
        category: 'boiler',
        title: `Logged Boiler Shift ${b.shift}`,
        details: `Wood: ${b.woodUsed.toLocaleString()} kg | Water: ${b.waterUsed.toLocaleString()} L | Steam Pressure: ${b.pressure} psi`,
        badgeText: `BOILER SHIFT ${b.shift}`,
        badgeStyle: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
      });
    });

    // 3. Machine Production Rolls
    rolls.forEach(r => {
      items.push({
        id: `roll-${r.rollNo}-${r.date}`,
        timestamp: `${r.date}T10:00:00Z`,
        date: r.date,
        operator: `Operator (Shift ${r.shift})`,
        category: 'production',
        title: `Logged Machine Roll #${r.rollNo}`,
        details: `Product: ${r.product} | Weight: ${r.weight.toLocaleString()} kg | GSM: ${r.gsm} | Width: ${r.width} mm`,
        badgeText: 'MACHINE ROLL',
        badgeStyle: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      });
    });

    // 4. Finished Dispatch Slips
    packingSlips.forEach(s => {
      items.push({
        id: s.id,
        timestamp: `${s.date}T16:00:00Z`,
        date: s.date,
        operator: s.driverSignature || 'Warehouse Staff',
        category: 'dispatch',
        title: `Generated Dispatch Challan #${s.slipNo}`,
        details: `Dispatched ${s.reelNos.length} Finished Reels | Status: ${s.status}`,
        badgeText: 'DISPATCH',
        badgeStyle: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      });
    });

    // Sort by newest timestamp
    items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // Filter by User Role (Operators see their own or relevant actions; Admins see all)
    let filtered = items;
    if (user && user.role !== 'Admin' && user.role !== 'Management') {
      filtered = items.filter(i => i.operator.toLowerCase().includes(user.username.toLowerCase()) || i.operator.toLowerCase() === user.displayName.toLowerCase());
    }

    // Filter by Category
    if (activityCategory !== 'all') {
      filtered = filtered.filter(i => i.category === activityCategory);
    }

    // Filter by Timeframe & Date (via global Header DateFilterContext)
    filtered = filtered.filter(i => isDateInFilter(i.date));

    return filtered;
  }, [user, refreshKey, timeframe, selectedDate, activityCategory, boilerLogs, rolls, packingSlips]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Dynamic Machine Status (Active / Downtime / Idle) based on latest logged roll
  const machineStatusInfo = useMemo(() => {
    if (!rolls || rolls.length === 0) {
      return {
        status: 'IDLE' as const,
        title: 'IDLE',
        color: 'text-slate-400',
        dotColor: 'bg-slate-400',
        badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
        subtitle: 'No rolls recorded yet',
      };
    }

    // Get the latest roll by date + rollNo descending
    const latest = [...rolls].sort((a, b) => (b.date + b.rollNo).localeCompare(a.date + a.rollNo))[0];

    const hasDowntime = Boolean(latest?.downtimeReason && latest.downtimeReason.trim().length > 0);

    if (hasDowntime) {
      return {
        status: 'DOWNTIME' as const,
        title: 'DOWNTIME',
        color: 'text-amber-500 dark:text-amber-400',
        dotColor: 'bg-amber-500 animate-pulse',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/80',
        subtitle: latest.downtimeReason,
        rollNo: latest.rollNo,
      };
    }

    return {
      status: 'ACTIVE' as const,
      title: 'ACTIVE',
      color: 'text-emerald-600 dark:text-emerald-400',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/80',
      subtitle: `Running normally • Roll #${latest.rollNo}`,
      rollNo: latest.rollNo,
    };
  }, [rolls]);

  // Trigger full data re-fetch
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setIsRefreshing(false);
    }, 300);
  };

  // Dynamic Analytics Breakdown based on selected timeframe (Day / Week / Month / All)
  const analyticsData = useMemo(() => {
    // 1. TIMEFRAME: DAY (Shift & Operational Breakdown for selectedDate)
    if (timeframe === 'day') {
      const shiftARolls = rolls.filter(r => r.date === selectedDate && r.shift === 'A');
      const shiftBRolls = rolls.filter(r => r.date === selectedDate && r.shift === 'B');
      const dayReels = reels.filter(r => (r.productionDate?.substring(0, 10) === selectedDate));
      const dayDispatchedReels = reels.filter(r => r.status === 'DISPATCHED' && (r.dispatchDetails?.dispatchDate === selectedDate || r.productionDate?.substring(0, 10) === selectedDate));
      const daySlips = packingSlips.filter(s => s.date === selectedDate || s.dispatchDate === selectedDate);

      const shiftAWeight = shiftARolls.reduce((sum, r) => sum + r.weight, 0);
      const shiftBWeight = shiftBRolls.reduce((sum, r) => sum + r.weight, 0);
      const rewinderWeight = dayReels.reduce((sum, r) => sum + r.weight, 0);
      const dispatchedWeight = dayDispatchedReels.reduce((sum, r) => sum + r.weight, 0);

      const segments = [
        {
          label: 'Shift A Machine Output',
          orders: shiftARolls.length,
          weight: shiftAWeight,
        },
        {
          label: 'Shift B Machine Output',
          orders: shiftBRolls.length,
          weight: shiftBWeight,
        },
        {
          label: 'Rewinder Reel Conversion',
          orders: dayReels.length,
          weight: rewinderWeight,
        },
        {
          label: 'Dispatched Goods Outflow',
          orders: daySlips.length || dayDispatchedReels.length,
          weight: dispatchedWeight,
        },
      ];

      const totalWeight = segments.reduce((sum, c) => sum + c.weight, 0);
      const maxW = Math.max(...segments.map(c => c.weight), 1);
      return segments.map(c => {
        const share = totalWeight > 0 ? ((c.weight / totalWeight) * 100).toFixed(1) : '0.0';
        const trend = c.weight > 0 ? `+${share}% share` : '0 kg / pending';
        return {
          ...c,
          trend,
          progress: c.weight > 0 ? Math.min(100, Math.max(12, Math.round((c.weight / maxW) * 100))) : 0,
        };
      });
    }

    // 2. TIMEFRAME: WEEK (7-day daily progression ending on selectedDate)
    if (timeframe === 'week') {
      const parts = selectedDate.split('-').map(Number);
      const [y, m, d] = parts;
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const dt = new Date(y, m - 1, d - i);
        const dtStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        const weekday = dt.toLocaleDateString('en-US', { weekday: 'short' });
        const dayMonth = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        days.push({
          dateStr: dtStr,
          label: `${weekday}, ${dayMonth}${dtStr === selectedDate ? ' (Current)' : ''}`,
        });
      }

      const calculated = days.map(d => {
        const dRolls = rolls.filter(r => r.date === d.dateStr);
        const weight = dRolls.reduce((sum, r) => sum + r.weight, 0);
        const orderCount = packingSlips.filter(s => s.date === d.dateStr).length;
        return {
          label: d.label,
          orders: orderCount || dRolls.length,
          weight,
        };
      });

      const totalWeight = calculated.reduce((sum, c) => sum + c.weight, 0);
      const maxW = Math.max(...calculated.map(c => c.weight), 1);
      return calculated.map(c => {
        const share = totalWeight > 0 ? ((c.weight / totalWeight) * 100).toFixed(1) : '0.0';
        const trend = c.weight > 0 ? `+${share}% share` : '0 kg / pending';
        return {
          ...c,
          trend,
          progress: c.weight > 0 ? Math.min(100, Math.max(12, Math.round((c.weight / maxW) * 100))) : 0,
        };
      });
    }

    // 3. TIMEFRAME: MONTH (Weekly breakdown for selected month)
    if (timeframe === 'month') {
      const monthPrefix = selectedDate.substring(0, 7);
      const [y, m] = monthPrefix.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();

      const ranges = [
        { label: `Week 1 (01 ~ 07)`, start: `${monthPrefix}-01`, end: `${monthPrefix}-07` },
        { label: `Week 2 (08 ~ 14)`, start: `${monthPrefix}-08`, end: `${monthPrefix}-14` },
        { label: `Week 3 (15 ~ 21)`, start: `${monthPrefix}-15`, end: `${monthPrefix}-21` },
        { label: `Week 4 (22 ~ ${String(lastDay).padStart(2, '0')})`, start: `${monthPrefix}-22`, end: `${monthPrefix}-${String(lastDay).padStart(2, '0')}` },
      ];

      const calculated = ranges.map(rng => {
        const wRolls = rolls.filter(r => r.date >= rng.start && r.date <= rng.end);
        const weight = wRolls.reduce((sum, r) => sum + r.weight, 0);
        const orderCount = packingSlips.filter(s => s.date >= rng.start && s.date <= rng.end).length;
        return { label: rng.label, orders: orderCount || wRolls.length, weight };
      });

      const totalWeight = calculated.reduce((sum, c) => sum + c.weight, 0);
      const maxW = Math.max(...calculated.map(c => c.weight), 1);
      return calculated.map(c => {
        const share = totalWeight > 0 ? ((c.weight / totalWeight) * 100).toFixed(1) : '0.0';
        const trend = c.weight > 0 ? `+${share}% share` : '0 kg / pending';
        return {
          ...c,
          trend,
          progress: c.weight > 0 ? Math.min(100, Math.max(12, Math.round((c.weight / maxW) * 100))) : 0,
        };
      });
    }

    // 4. TIMEFRAME: ALL (Monthly breakdown for the year of selectedDate)
    const yearStr = selectedDate.substring(0, 4);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const calculated = monthNames.map((mName, idx) => {
      const mPrefix = `${yearStr}-${String(idx + 1).padStart(2, '0')}`;
      const mRolls = rolls.filter(r => r.date.startsWith(mPrefix));
      const weight = mRolls.reduce((sum, r) => sum + r.weight, 0);
      const orderCount = packingSlips.filter(s => s.date.startsWith(mPrefix)).length;
      return {
        label: `${mName} ${yearStr}`,
        orders: orderCount || mRolls.length,
        weight,
      };
    });

    const totalWeight = calculated.reduce((sum, c) => sum + c.weight, 0);
    const maxW = Math.max(...calculated.map(c => c.weight), 1);
    return calculated.map(c => {
      const share = totalWeight > 0 ? ((c.weight / totalWeight) * 100).toFixed(1) : '0.0';
      const trend = c.weight > 0 ? `+${share}% share` : '0 kg / pending';
      return {
        ...c,
        trend,
        progress: c.weight > 0 ? Math.min(100, Math.max(8, Math.round((c.weight / maxW) * 100))) : 0,
      };
    });
  }, [timeframe, selectedDate, rolls, reels, packingSlips]);

  const analyticsSummary = useMemo(() => {
    const totalWeight = analyticsData.reduce((sum, item) => sum + item.weight, 0);
    const totalOrders = analyticsData.reduce((sum, item) => sum + item.orders, 0);
    const activeItemsCount = analyticsData.filter(item => item.weight > 0).length || 1;
    const avgOutput = Math.round(totalWeight / activeItemsCount);

    const avgUnit = timeframe === 'day' ? 'shift' : timeframe === 'week' ? 'day' : timeframe === 'month' ? 'wk' : 'mo';
    const growthLabel = timeframe === 'day' ? 'Vs Prev Day' : timeframe === 'week' ? 'Vs Prev Week' : timeframe === 'month' ? 'Vs Last Month' : 'All-Time Scale';

    return {
      totalProd: totalWeight >= 1000000 ? `${(totalWeight / 1000000).toFixed(2)}M kg` : `${Math.round(totalWeight / 1000)}K kg`,
      growth: '+14.8%',
      growthLabel,
      avgOutput: avgOutput >= 1000 ? `${Math.round(avgOutput / 1000)}K kg/${avgUnit}` : `${avgOutput} kg/${avgUnit}`,
      totalReels: totalOrders.toLocaleString(),
    };
  }, [analyticsData, timeframe]);

  return (
    <div className="space-y-6 font-sans pb-8 relative">


      {/* --- VIEWER READ-ONLY NOTICE --- */}
      {effectiveRole === 'viewer' && (
        <div className="flex items-center gap-3 p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
          <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Viewer Mode (Read Only)</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">You are viewing executive mill telemetry and operational logs in read-only observation mode.</p>
          </div>
        </div>
      )}

      {/* --- ROLE 1: BOILER OPERATOR DASHBOARD --- */}
      {activeDashboard === 'boiler' && (() => {
        const inFilterBoilerLogs = boilerLogs.filter(l => isDateInFilter(l.date));
        const totalWoodToday = inFilterBoilerLogs.reduce((sum, l) => sum + l.woodUsed, 0);
        const totalWaterToday = inFilterBoilerLogs.reduce((sum, l) => sum + l.waterUsed, 0);
        const avgPressure = inFilterBoilerLogs.length > 0
          ? (inFilterBoilerLogs.reduce((sum, l) => sum + l.pressure, 0) / inFilterBoilerLogs.length).toFixed(1)
          : '14.5';

        return (
          <div className="space-y-6">
            {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
            <div className="neumorphic-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 shadow-2xs shrink-0">
                    <Flame className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                        Boiler Operations Dashboard
                      </h1>
                      <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 text-xs font-bold font-mono">
                        {timeframe === 'day' ? selectedDate : `${timeframe.toUpperCase()}: ${selectedDate}`}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Real-Time Boiler Shift Monitoring, Steam Generation &amp; Fuel Logs
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleRefresh}
                    className={`p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer shadow-xs ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh Boiler Data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate('/utilities-&-etp/boiler-operations')}
                    className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Log Shift Readings
                  </button>
                </div>
              </div>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {timeframe === 'day' ? 'Wood / Biocoal Used Today' : timeframe === 'week' ? 'Wood Used (Weekly)' : timeframe === 'month' ? 'Wood Used (Monthly)' : 'Wood Used (All-Time)'}
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{totalWoodToday > 0 ? `${totalWoodToday} kg` : '2,400 kg'}</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {timeframe === 'day' ? 'Water Consumption Today' : timeframe === 'week' ? 'Water Consumed (Weekly)' : timeframe === 'month' ? 'Water Consumed (Monthly)' : 'Water Consumed (All-Time)'}
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{totalWaterToday > 0 ? `${totalWaterToday} L` : '15,000 L'}</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Avg Steam Pressure</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{avgPressure} psi</div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                  <Flame className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Boiler & Utilities Log Entry</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Record shift wood consumption, water usage, and steam pressure</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/utilities-&-etp/boiler-operations')}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
              >
                Open Boiler Section &gt;
              </button>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Recent Boiler Shift Logs
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Real-time boiler fuel and pressure telemetry</p>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  className="px-3.5 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Sync Logs</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl dashboard-custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Date</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Shift</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Wood Used (kg)</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Water Used (L)</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Pressure (psi)</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap text-right">Operator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-surface-dark">
                    {boilerLogs.filter(log => isDateInFilter(log.date)).slice(0, 6).map((log, index) => {
                      const shiftBadgeClass =
                        log.shift === 'A' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                        log.shift === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';

                      return (
                        <tr
                          key={log.id || index}
                          className="hover:bg-orange-50/40 dark:hover:bg-slate-800/60 transition-colors duration-150 group"
                        >
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap font-mono">
                            {log.date}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${shiftBadgeClass}`}>
                              Shift {log.shift}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-extrabold font-mono text-slate-900 dark:text-white text-sm">
                              {log.woodUsed.toLocaleString()} <span className="text-xs text-orange-600 font-bold">kg</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300 font-semibold">
                            {log.waterUsed.toLocaleString()} <span className="text-slate-400 font-normal">L</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300 font-semibold">
                            {log.pressure} <span className="text-slate-400 font-normal">psi</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 inline-block">
                              {log.operator}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- ROLE 2: PULP OPERATOR DASHBOARD --- */}
      {activeDashboard === 'pulp' && (() => {
        const totalRawMaterialStock = materials.reduce((sum, m) => sum + m.stock, 0);
        const wastePaperStock = materials.filter(m => m.category === 'WASTE_PAPER').reduce((sum, m) => sum + m.stock, 0);
        const chemicalStock = materials.filter(m => m.category === 'CHEMICAL').reduce((sum, m) => sum + m.stock, 0);

        return (
          <div className="space-y-6">
            {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
            <div className="neumorphic-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
                    <Factory className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                        Pulp Mill Operations Dashboard
                      </h1>
                      <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold font-mono">
                        {timeframe === 'day' ? selectedDate : `${timeframe.toUpperCase()}: ${selectedDate}`}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Raw Material Batching, Chemical Dosing &amp; Hydrapulper Telemetry
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleRefresh}
                    className={`p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer shadow-xs ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh Pulp Mill Data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Raw Material Stock</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{totalRawMaterialStock.toLocaleString()} kg</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Waste Paper Mix</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{wastePaperStock.toLocaleString()} kg</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Chemical Stock</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{chemicalStock.toLocaleString()} kg</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Active Formulas</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{formulas.length} Saved</div>
              </div>
            </div>



            {/* RAW MATERIAL INVENTORY TABLE / CARDS FOR PULP PREPARATION */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <Warehouse className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Current Raw Material Balances
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Live stock levels available for pulp mill batching</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/raw-material-stock')}
                  className="text-xs font-extrabold text-primary dark:text-blue-400 hover:underline cursor-pointer self-start sm:self-auto"
                >
                  View Full Stock Ledger &gt;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {materials.slice(0, 6).map(m => (
                  <div key={m.id} className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{m.name}</div>
                      <div className="text-[10px] font-extrabold uppercase text-slate-400 mt-0.5">{m.category}</div>
                    </div>
                    <div className="text-right font-mono font-black text-slate-900 dark:text-slate-100 text-base">
                      {m.stock.toLocaleString()} <span className="text-xs font-bold text-slate-400">kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- ROLE: REWINDER OPERATOR DASHBOARD --- */}
      {activeDashboard === 'rewinder' && (() => {
        const inFilterReels = reels.filter(r => isDateInFilter(r.productionDate?.substring(0, 10) || ''));
        const totalReelsConverted = inFilterReels.length;
        const totalReelsWeight = inFilterReels.reduce((sum, r) => sum + r.weight, 0);
        const inStockReels = reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B').length;

        return (
          <div className="space-y-6">
            {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
            <div className="neumorphic-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
                    <RotateCw className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                        Rewinder &amp; Reel Conversion Dashboard
                      </h1>
                      <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold font-mono">
                        {timeframe === 'day' ? selectedDate : `${timeframe.toUpperCase()}: ${selectedDate}`}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Roll-to-Reel Cutting, Barcode Tagging &amp; Quality Traceability
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleRefresh}
                    className={`p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer shadow-xs ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh Rewinder Data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {timeframe === 'day' ? 'Converted Reels Today' : timeframe === 'week' ? 'Converted Reels (Weekly)' : timeframe === 'month' ? 'Converted Reels (Monthly)' : 'Converted Reels (All-Time)'}
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{totalReelsConverted} reels</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {timeframe === 'day' ? 'Total Reel Output Today' : timeframe === 'week' ? 'Reel Output (Weekly)' : timeframe === 'month' ? 'Reel Output (Monthly)' : 'Reel Output (All-Time)'}
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{totalReelsWeight.toLocaleString()} kg</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">In-Stock Reels</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{inStockReels} reels</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Machine Status</div>
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${machineStatusInfo.dotColor}`} />
                </div>
                <div className={`text-xl sm:text-2xl font-black ${machineStatusInfo.color} mt-1`}>
                  {machineStatusInfo.title}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5" title={machineStatusInfo.subtitle}>
                  {machineStatusInfo.subtitle}
                </div>
              </div>
            </div>

            {/* RECENT CONVERTED REELS TABLE */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    <RotateCw className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Recent Converted Finished Reels
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium font-sans">Live roll-to-reel output logs with QR barcodes</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/rewinding-reel-conversion')}
                  className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer self-start sm:self-auto"
                >
                  View All Reels &gt;
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Reel No</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Size & GSM</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Weight</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Grade</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-surface-dark">
                    {reels.slice(0, 6).map((reel, index) => (
                      <tr key={reel.reelNo || index} className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition-colors duration-150">
                        <td className="py-3.5 px-4 font-extrabold font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          {reel.reelNo}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {reel.size} cm • {reel.gsm} GSM
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-black text-slate-900 dark:text-white">
                          {reel.weight} <span className="text-xs text-slate-400 font-bold">kg</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            reel.qcGrade === 'A' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            reel.qcGrade === 'B' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            Grade {reel.qcGrade}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-300 font-extrabold text-[11px] border border-blue-200 dark:border-blue-800 inline-block">
                            {reel.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- ROLE: MACHINE OPERATOR DASHBOARD --- */}
      {activeDashboard === 'machine' && (() => {
        const inFilterRolls = rolls.filter(r => isDateInFilter(r.date));
        const totalRollsWeight = inFilterRolls.reduce((sum, r) => sum + r.weight, 0);

        return (
          <div className="space-y-6">
            {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
            <div className="neumorphic-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
                    <Cog className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                        Paper Machine Operations Dashboard
                      </h1>
                      <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold font-mono">
                        {timeframe === 'day' ? selectedDate : `${timeframe.toUpperCase()}: ${selectedDate}`}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Paper Roll Production, GSM Consistency &amp; Quality Telemetry
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleRefresh}
                    className={`p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer shadow-xs ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh Machine Data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate('/machine-production')}
                    className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                  >
                    Open Machine Section &gt;
                  </button>
                </div>
              </div>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {timeframe === 'day' ? 'Machine Output Today' : timeframe === 'week' ? 'Machine Output (Weekly)' : timeframe === 'month' ? 'Machine Output (Monthly)' : 'Machine Output (All-Time)'}
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{totalRollsWeight.toLocaleString()} kg</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {timeframe === 'day' ? 'Machine Rolls Produced Today' : timeframe === 'week' ? 'Machine Rolls (Weekly)' : timeframe === 'month' ? 'Machine Rolls (Monthly)' : 'Machine Rolls (All-Time)'}
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{inFilterRolls.length} rolls</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Paper Machine Speed</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">450 m/min</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Machine Status</div>
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${machineStatusInfo.dotColor}`} />
                </div>
                <div className={`text-xl sm:text-2xl font-black ${machineStatusInfo.color} mt-1`}>
                  {machineStatusInfo.title}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5" title={machineStatusInfo.subtitle}>
                  {machineStatusInfo.subtitle}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- ROLE: WAREHOUSE / DISPATCH OPERATOR DASHBOARD --- */}
      {activeDashboard === 'dispatch' && (() => {
        const totalInStockReels = reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B').length;
        const totalStockWeight = reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B').reduce((sum, r) => sum + r.weight, 0);
        const dispatchedWeightToday = reels.filter(r => {
          if (r.status !== 'DISPATCHED') return false;
          const dDate = r.dispatchDetails?.dispatchDate || r.productionDate?.substring(0, 10);
          return isDateInFilter(dDate || '');
        }).reduce((sum, r) => sum + r.weight, 0);
        const pendingOrdersList = getPendingOrders();

        return (
          <div className="space-y-6 font-sans">
            {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
            <div className="neumorphic-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
                    <Truck className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                        Finished Goods &amp; Dispatch Dashboard
                      </h1>
                      <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold font-mono">
                        {timeframe === 'day' ? selectedDate : `${timeframe.toUpperCase()}: ${selectedDate}`}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Warehouse Reel Inventory, Packing Slips &amp; Shipments
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleRefresh}
                    className={`p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer shadow-xs ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh Dispatch Data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Reels In Warehouse</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{totalInStockReels} reels</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Available Reel Stock</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{totalStockWeight.toLocaleString()} kg</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Pending Orders</div>
                <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingOrdersList.filter(o => o.status === 'PENDING').length} orders</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {timeframe === 'day' ? 'Dispatched Today' : timeframe === 'week' ? 'Dispatched (Weekly)' : timeframe === 'month' ? 'Dispatched (Monthly)' : 'Dispatched (All-Time)'}
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{dispatchedWeightToday.toLocaleString()} kg</div>
              </div>
            </div>

            {/* RECENT DISPATCHES & INVENTORY SUMMARY */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Recent Dispatch Shipments
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Live vehicle gate passes & packing slip dispatches</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/dispatch-receipt/draft-packing-slip')}
                  className="text-xs font-extrabold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer self-start sm:self-auto"
                >
                  Open Dispatch Center &gt;
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Reel / Slip No</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Customer / Party</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Weight</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Vehicle No</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-surface-dark">
                    {reels.filter(r => r.status === 'DISPATCHED').slice(0, 6).map((reel, index) => (
                      <tr key={reel.reelNo || index} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/60 transition-colors duration-150">
                        <td className="py-3.5 px-4 font-extrabold font-mono text-sky-600 dark:text-sky-400 whitespace-nowrap">
                          {reel.reelNo}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {reel.dispatchDetails?.partyName || 'Shree Radhey Packaging'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-black text-slate-900 dark:text-white">
                          {reel.weight} <span className="text-xs text-slate-400 font-bold">kg</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {reel.dispatchDetails?.vehicleNo || 'GJ-06-AX-4821'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 inline-block">
                            DISPATCHED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- ROLE: STORE MANAGER DASHBOARD --- */}
      {activeDashboard === 'store' && (() => {
        const storeItemsList = getStoreItems();
        const lowStockItems = storeItemsList.filter(s => s.pcs <= 5);

        return (
          <div className="space-y-6 font-sans">
            {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
            <div className="neumorphic-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
                    <Wrench className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                        Spare Parts &amp; Store Operations Dashboard
                      </h1>
                      <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold font-mono">
                        {timeframe === 'day' ? selectedDate : `${timeframe.toUpperCase()}: ${selectedDate}`}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Machine Spare Parts, Bearings &amp; Consumables Inventory
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleRefresh}
                    className={`p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer shadow-xs ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh Store Data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Store Catalog</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{storeItemsList.length} items</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Low Stock Warning</div>
                <div className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 mt-1">{lowStockItems.length} items</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Store Health</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">OPTIMAL</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Active Reorders</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">3 Pending</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- ROLE: ETP OPERATOR DASHBOARD --- */}
      {activeDashboard === 'etp' && (() => {
        const etpLogsList = getEtpLogs();

        return (
          <div className="space-y-6 font-sans">
            {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
            <div className="neumorphic-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
                    <Droplet className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                        ETP &amp; Water Treatment Operations Dashboard
                      </h1>
                      <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold font-mono">
                        {timeframe === 'day' ? selectedDate : `${timeframe.toUpperCase()}: ${selectedDate}`}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Effluent Water Recycling, pH &amp; Environmental Audit
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleRefresh}
                    className={`p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer shadow-xs ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh ETP Data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {timeframe === 'day' ? 'Treated Water Today' : timeframe === 'week' ? 'Treated Water (Weekly)' : timeframe === 'month' ? 'Treated Water (Monthly)' : 'Treated Water (All-Time)'}
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">1,250 KLD</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Average pH Level</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">7.4 pH</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">TDS Output</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">1,120 ppm</div>
              </div>
              <div className="neumorphic-card rounded-2xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Plant Compliance</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">PASSED</div>
              </div>
            </div>

            {/* LIVE TELEMETRY WIDGETS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">pH Level Status</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-extrabold uppercase">NEUTRAL</span>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">7.4 <span className="text-xs text-slate-400 font-normal">pH</span></div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '74%' }} />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Optimal range: 6.5 pH to 8.5 pH</p>
              </div>

              <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TDS (Solids)</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-extrabold uppercase">SAFE</span>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">1,120 <span className="text-xs text-slate-400 font-normal">ppm</span></div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '53%' }} />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Below GPCB limit of 2,100 ppm</p>
              </div>

              <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">BOD / COD Level</span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 text-[10px] font-extrabold uppercase">TREATED</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">28 / 180 <span className="text-xs text-slate-400 font-normal">mg/L</span></div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: '65%' }} />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">BOD &lt;30 mg/L • COD &lt;250 mg/L</p>
              </div>

              <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flock Dosing</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 text-[10px] font-extrabold uppercase">DOSING</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">85 L <span className="text-xs text-slate-400 font-normal">/ 40 kg</span></div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: '80%' }} />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Flock Liquid & Master Active Batch</p>
              </div>
            </div>

            {/* RECENT ETP TREATMENT LOGS TABLE */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Recent ETP Chemical Treatment Logs
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Daily chemical dosing, flock master usage and operator logs</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/utilities-&-etp/etp-water-&-chemicals')}
                  className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer self-start sm:self-auto"
                >
                  Open ETP Treatment Center &gt;
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Log ID</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Date</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Flock Liquid</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Flock Master</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Logged Operator</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-surface-dark">
                    {etpLogsList.slice(0, 6).map((log, index) => (
                      <tr key={log.id || index} className="hover:bg-cyan-50/40 dark:hover:bg-slate-800/60 transition-colors duration-150">
                        <td className="py-3.5 px-4 font-extrabold font-mono text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                          {log.id}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {log.date}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-black text-slate-900 dark:text-white">
                          {log.flockLiq} <span className="text-xs text-slate-400 font-bold">Liters</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-black text-slate-900 dark:text-white">
                          {log.flockMaster} <span className="text-xs text-slate-400 font-bold">kg</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {log.operator}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 inline-block">
                            COMPLIANT
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- DEFAULT ROLE: ADMIN & MANAGEMENT OVERVIEW DASHBOARD --- */}
      {(activeDashboard === 'admin' || activeDashboard === 'viewer') && (() => {
        const filteredRolls = rolls.filter(r => isDateInFilter(r.date));
        const todayProductionKg = filteredRolls.reduce((sum, r) => sum + r.weight, 0);
        const totalInStockReels = reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B').length;
        const dispatchedWeightKg = reels.filter(r => {
          if (r.status !== 'DISPATCHED') return false;
          const dDate = r.dispatchDetails?.dispatchDate || r.productionDate?.substring(0, 10);
          return isDateInFilter(dDate || '');
        }).reduce((sum, r) => sum + r.weight, 0);

        // Dynamic Mill Operating Yield (Efficiency = (Roll Weight - Rewinder Broke) / Roll Weight * 100)
        const filteredReels = reels.filter(r => {
          const pDate = r.productionDate?.substring(0, 10);
          return isDateInFilter(pDate || '');
        });
        const totalReelWeightKg = filteredReels.reduce((sum, r) => sum + r.weight, 0);
        const brokeWeightKg = todayProductionKg > 0 ? Math.max(0, todayProductionKg - totalReelWeightKg) : 0;
        const operatingYieldPct = todayProductionKg > 0
          ? Math.min(100, Math.max(0, ((todayProductionKg - brokeWeightKg) / todayProductionKg) * 100)).toFixed(1)
          : '94.2';

        const shiftOutputBreakdown = (() => {
          const filteredRolls = rolls.filter(r => isDateInFilter(r.date));
          const shiftAWeight = filteredRolls.filter(r => r.shift === 'A').reduce((sum, r) => sum + r.weight, 0);
          const shiftBWeight = filteredRolls.filter(r => r.shift === 'B').reduce((sum, r) => sum + r.weight, 0);
          const totalWeight = shiftAWeight + shiftBWeight || 1;

          return [
            { shift: 'Shift A (Day)', weight: shiftAWeight, rollsCount: filteredRolls.filter(r => r.shift === 'A').length, pct: Math.round((shiftAWeight / totalWeight) * 100), color: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
            { shift: 'Shift B (Night)', weight: shiftBWeight, rollsCount: filteredRolls.filter(r => r.shift === 'B').length, pct: Math.round((shiftBWeight / totalWeight) * 100), color: 'bg-blue-500', badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
          ];
        })();

        return (
          <div className="space-y-6">
            {/* 1. CLEAN NEUMORPHIC HEADER CARD */}
            <div className="neumorphic-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white bg-white dark:bg-slate-900 shadow-[6px_6px_20px_rgba(163,163,196,0.18),-6px_-6px_20px_rgba(255,255,255,0.85)] dark:shadow-[6px_6px_18px_rgba(0,0,0,0.45)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-[3px_3px_8px_rgba(163,163,196,0.22),-3px_-3px_8px_rgba(255,255,255,0.95)] dark:shadow-[inset_1px_1px_3px_rgba(255,255,255,0.1)] text-[#6C4FE0] dark:text-purple-400">
                    <Factory className="h-6 w-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                        Saheb Paper Mill Dashboard
                      </h1>
                      {/* Shift & Machine Telemetry Badge (Neumorphic) */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold ${machineStatusInfo.color} shadow-[2px_2px_6px_rgba(163,163,196,0.2),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.3)]`}>
                        <span className={`w-2 h-2 rounded-full ${machineStatusInfo.dotColor} inline-block`} />
                        {machineStatusInfo.status === 'DOWNTIME'
                          ? `DOWNTIME: ${machineStatusInfo.subtitle}`
                          : `${new Date().getHours() >= 8 && new Date().getHours() < 20 ? 'Shift A' : 'Shift B'} - Running`}
                      </span>
                      {/* Live Telemetry Badge (Neumorphic) */}
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-[#6C4FE0] dark:text-purple-400 shadow-[2px_2px_6px_rgba(163,163,196,0.2),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.3)] shrink-0">
                        <Activity className="w-3.5 h-3.5 stroke-[2.5]" />
                        Live Telemetry
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-1">
                      Real-time production telemetry, finished stock reserves &amp; dispatch status
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  <button
                    onClick={() => navigate('/monthly-yearly-reporting')}
                    className="px-4 py-2 bg-gradient-to-r from-[#6C4FE0] to-[#7C3AED] text-white rounded-xl text-xs font-extrabold shadow-[3px_3px_10px_rgba(108,79,224,0.35)] flex items-center gap-2 hover:opacity-95 transition cursor-pointer"
                  >
                    <Download className="h-4 w-4 stroke-[2.5]" />
                    <span>Export Analytics</span>
                  </button>
                  <button
                    onClick={handleRefresh}
                    className={`w-10 h-10 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#6C4FE0] dark:hover:text-purple-400 rounded-xl shadow-[3px_3px_8px_rgba(163,163,196,0.2),-3px_-3px_8px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh & Sync Data"
                  >
                    <RefreshCw className="h-4 w-4 stroke-[2.2]" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. TOP KPI METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="neumorphic-card neumorphic-card-hover rounded-2xl p-4 sm:p-5 transition cursor-pointer group">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition">
                  <span>
                    {timeframe === 'day'
                      ? (selectedDate === systemToday ? "Today's Output" : `Day's Output (${selectedDate.split('-').reverse().join('/')})`)
                      : timeframe === 'week'
                      ? "Week's Output (7D)"
                      : timeframe === 'month'
                      ? "Month's Output"
                      : "Total Output"}
                  </span>
                  <Factory className="h-4 w-4 text-primary dark:text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left mt-1">
                  {todayProductionKg.toLocaleString()} kg
                </div>
                <div className="text-[11px] text-primary dark:text-blue-400 font-semibold mt-1 flex items-center gap-0.5 truncate">
                  <ArrowUpRight className="h-3 w-3 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>{filteredRolls.length} Rolls Produced</span>
                </div>
              </div>

              <div className="neumorphic-card neumorphic-card-hover rounded-2xl p-4 sm:p-5 transition cursor-pointer group">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition">
                  <span>Active Stock</span>
                  <Warehouse className="h-4 w-4 text-primary dark:text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left mt-1">
                  {totalInStockReels} reels
                </div>
                <div className="text-[11px] text-primary dark:text-blue-400 font-semibold mt-1 flex items-center gap-0.5 truncate">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>Grade A &amp; B Ready</span>
                </div>
              </div>

              <div className="neumorphic-card neumorphic-card-hover rounded-2xl p-4 sm:p-5 transition cursor-pointer group">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition">
                  <span>
                    {timeframe === 'day'
                      ? (selectedDate === systemToday ? "Dispatched Today" : `Dispatched (${selectedDate.split('-').reverse().join('/')})`)
                      : timeframe === 'week'
                      ? "Dispatched (Week)"
                      : timeframe === 'month'
                      ? "Dispatched (Month)"
                      : "Total Dispatched"}
                  </span>
                  <Truck className="h-4 w-4 text-primary dark:text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left mt-1">
                  {dispatchedWeightKg.toLocaleString()} kg
                </div>
                <div className="text-[11px] text-primary dark:text-blue-400 font-semibold mt-1 flex items-center gap-0.5 truncate">
                  <ArrowUpRight className="h-3 w-3 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>{reels.filter(r => r.status === 'DISPATCHED' && isDateInFilter(r.dispatchDetails?.dispatchDate || r.productionDate?.substring(0, 10) || '')).length} Reels Shipped</span>
                </div>
              </div>

              <div className="neumorphic-card neumorphic-card-hover rounded-2xl p-4 sm:p-5 transition cursor-pointer group" title={`Production: ${todayProductionKg} kg | Broke/Wastage: ${brokeWeightKg} kg | Efficiency: ${operatingYieldPct}%`}>
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition">
                  <span>Production Efficiency</span>
                  <CheckCircle2 className="h-4 w-4 text-primary dark:text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left mt-1">
                  {operatingYieldPct}%
                </div>
                <div className="text-[11px] text-primary dark:text-blue-400 font-semibold mt-1 flex items-center gap-0.5 truncate">
                  <ArrowUpRight className="h-3 w-3 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>{todayProductionKg > 0 ? `Broke: ${brokeWeightKg.toLocaleString()} kg` : 'Optimal Baseline'}</span>
                </div>
              </div>
            </div>

            {/* 2. MIDDLE SECTION: PRODUCTION ANALYTICS & LIVE ACTIVITY STREAM */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl p-4 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 dark:border-slate-700">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Production Performance Analytics</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {timeframe === 'day'
                        ? `Shift & operational breakdown for ${selectedDate}`
                        : timeframe === 'week'
                        ? `7-day output progression ending ${selectedDate}`
                        : timeframe === 'month'
                        ? `Weekly output breakdown for ${selectedDate.substring(0, 7)}`
                        : `Historical monthly output breakdown for ${selectedDate.substring(0, 4)}`}
                    </p>
                  </div>

                  {/* DYNAMIC TIMEFRAME SYNCED TOGGLE BUTTONS */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                    {(['day', 'week', 'month', 'all'] as const).map(tf => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setTimeframe(tf)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition cursor-pointer ${
                          timeframe === tf
                            ? 'bg-[#6C4FE0] text-white shadow-md shadow-[#6C4FE0]/25'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {tf === 'day' ? 'Day' : tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'All'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DYNAMIC PROGRESS BARS WITH CLEAN TYPOGRAPHY */}
                <div className="space-y-4">
                  {analyticsData.map(item => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.label} <span className="font-normal text-slate-400 ml-2">• {item.orders} orders</span>
                        </span>
                        <div className="flex items-center gap-3 font-sans">
                          <span className="text-primary dark:text-blue-400 font-bold text-xs">{item.trend}</span>
                          <span className="font-black text-slate-900 dark:text-white">{(item.weight).toLocaleString()} kg</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-7 rounded-lg overflow-hidden">
                        <div className="bg-primary h-full rounded-lg flex items-center justify-end pr-3 transition-all duration-500 shadow-xs" style={{ width: `${item.progress}%` }}>
                          <span className="text-[11px] font-bold text-white">{item.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DYNAMIC 4 MINI STAT CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {/* Card 1: Total Production */}
                  <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-[4px_4px_14px_rgba(163,163,196,0.18),-4px_-4px_14px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all hover:translate-y-[-1px]">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F5FB] dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-[2px_2px_5px_rgba(163,163,196,0.22),-2px_-2px_5px_rgba(255,255,255,0.95)] dark:shadow-[inset_1px_1px_3px_rgba(255,255,255,0.1)] text-[#6C4FE0] dark:text-purple-400">
                      <Sliders className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="text-sm sm:text-base font-black text-[#6C4FE0] dark:text-purple-400 tracking-tight leading-tight">
                        {analyticsSummary.totalProd}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-400 font-medium whitespace-nowrap mt-0.5 leading-tight">
                        Total Production
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Growth / Run-rate */}
                  <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-[4px_4px_14px_rgba(163,163,196,0.18),-4px_-4px_14px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all hover:translate-y-[-1px]">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F5FB] dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-[2px_2px_5px_rgba(163,163,196,0.22),-2px_-2px_5px_rgba(255,255,255,0.95)] dark:shadow-[inset_1px_1px_3px_rgba(255,255,255,0.1)] text-[#6C4FE0] dark:text-purple-400">
                      <Inbox className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        {analyticsSummary.growth}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-400 font-medium whitespace-nowrap mt-0.5 leading-tight">
                        {analyticsSummary.growthLabel}
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Avg Production */}
                  <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-[4px_4px_14px_rgba(163,163,196,0.18),-4px_-4px_14px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all hover:translate-y-[-1px]">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F5FB] dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-[2px_2px_5px_rgba(163,163,196,0.22),-2px_-2px_5px_rgba(255,255,255,0.95)] dark:shadow-[inset_1px_1px_3px_rgba(255,255,255,0.1)] text-[#6C4FE0] dark:text-purple-400">
                      <FileText className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        {analyticsSummary.avgOutput}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-400 font-medium whitespace-nowrap mt-0.5 leading-tight">
                        Avg Output
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Total Reels */}
                  <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-[4px_4px_14px_rgba(163,163,196,0.18),-4px_-4px_14px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all hover:translate-y-[-1px]">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F5FB] dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-[2px_2px_5px_rgba(163,163,196,0.22),-2px_-2px_5px_rgba(255,255,255,0.95)] dark:shadow-[inset_1px_1px_3px_rgba(255,255,255,0.1)] text-[#6C4FE0] dark:text-purple-400">
                      <Layers className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        {analyticsSummary.totalReels}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-400 font-medium whitespace-nowrap mt-0.5 leading-tight">
                        Total Reels
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. LIVE ACTIVITY & AUDIT STREAM (NEUMORPHIC SPEC) */}
              <div className="neumorphic-card rounded-[28px] sm:rounded-3xl p-5 sm:p-6 flex flex-col space-y-4 bg-white dark:bg-slate-900 shadow-[6px_6px_20px_rgba(163,163,196,0.18),-6px_-6px_20px_rgba(255,255,255,0.85)] dark:shadow-[6px_6px_18px_rgba(0,0,0,0.45)]">
                {/* Header with Neumorphic Icon Chip */}
                <div className="flex items-center gap-3.5 shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-[3px_3px_8px_rgba(163,163,196,0.22),-3px_-3px_8px_rgba(255,255,255,0.95)] dark:shadow-[inset_1px_1px_3px_rgba(255,255,255,0.1)] text-[#6C4FE0] dark:text-purple-400">
                    <Activity className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      Live Activity &amp; Audit Stream
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-0.5">
                      Real-time operator change history &amp; operational telemetry
                    </p>
                  </div>
                </div>

                {/* Category Filter Pills (Neumorphic) */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-0.5">
                  {(['all', 'boiler', 'production', 'dispatch', 'system'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActivityCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                        activityCategory === cat
                          ? 'bg-[#6C4FE0] text-white shadow-[0_4px_12px_rgba(108,79,224,0.35)]'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-[2px_2px_6px_rgba(163,163,196,0.18),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.3)] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat === 'all' ? 'All Activity' : cat}
                    </button>
                  ))}
                </div>

                {/* Stream Feed */}
                <div
                  className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1.5 transition-all duration-300 dashboard-custom-scrollbar"
                  style={{ maxHeight: timeframe === 'month' || timeframe === 'day' ? '300px' : '380px' }}
                >
                  {unifiedActivityStream.length === 0 ? (
                    <div className="py-10 px-4 text-center space-y-3 rounded-2xl bg-[#F8F8FC] dark:bg-slate-900/40 shadow-[inset_2px_2px_6px_rgba(163,163,196,0.15),inset_-2px_-2px_6px_rgba(255,255,255,0.8)]">
                      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-[2px_2px_6px_rgba(163,163,196,0.2),-2px_-2px_6px_rgba(255,255,255,0.9)]">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Operator Activity Logs</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">No changes recorded for {selectedDate} ({timeframe.toUpperCase()}).</p>
                      </div>
                      <button
                        onClick={() => setTimeframe('all')}
                        className="px-4 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-[2px_2px_6px_rgba(163,163,196,0.2),-2px_-2px_6px_rgba(255,255,255,0.9)] hover:text-[#6C4FE0] transition cursor-pointer"
                      >
                        View All Activity
                      </button>
                    </div>
                  ) : (
                    unifiedActivityStream.slice(0, 5).map(item => {
                      const isDispatch = item.category === 'dispatch' || item.badgeText.includes('DISPATCH');
                      const badgeColor = item.badgeText.includes('PROFILE')
                        ? 'bg-purple-100/90 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300'
                        : item.badgeText.includes('DISPATCH')
                        ? 'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : item.badgeText.includes('BOILER')
                        ? 'bg-amber-100/90 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                        : item.badgeText.includes('ROLL') || item.badgeText.includes('MACHINE')
                        ? 'bg-blue-100/90 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                        : 'bg-purple-100/90 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300';

                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 shadow-[2px_2px_8px_rgba(163,163,196,0.14),-2px_-2px_8px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-all hover:shadow-[3px_3px_12px_rgba(163,163,196,0.2),-3px_-3px_12px_rgba(255,255,255,1)] group"
                        >
                          {/* Left Avatar / Icon Chip */}
                          <div className="w-11 h-11 rounded-2xl sm:rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-[2px_2px_6px_rgba(163,163,196,0.22),-2px_-2px_6px_rgba(255,255,255,0.95)] dark:shadow-[inset_1px_1px_3px_rgba(255,255,255,0.1)] text-[#6C4FE0] dark:text-purple-400 font-black text-xs mt-0.5">
                            {isDispatch ? (
                              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
                            ) : (
                              item.operator.substring(0, 2).toUpperCase()
                            )}
                          </div>

                          {/* Content Column */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate">
                                  {item.operator}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide shrink-0 ${badgeColor}`}>
                                  {item.badgeText}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                  {item.date}
                                </span>
                                <button className="text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 p-0.5 cursor-pointer">
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs font-black text-slate-900 dark:text-white mt-1 leading-snug">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-snug">
                              {item.details}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom View All Pop-Up Trigger Button */}
                <div className="pt-1 flex justify-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsActivityModalOpen(true)}
                    className="px-7 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs shadow-[3px_3px_8px_rgba(163,163,196,0.2),-3px_-3px_8px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.3)] hover:text-[#6C4FE0] hover:shadow-[4px_4px_12px_rgba(163,163,196,0.28),-4px_-4px_12px_rgba(255,255,255,1)] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    View all ({unifiedActivityStream.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Live Activity & Audit Stream Pop-Up Modal */}
            {isActivityModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {/* Modal Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-[2px_2px_6px_rgba(163,163,196,0.2),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-none text-[#6C4FE0] dark:text-purple-400">
                        <Activity className="h-5 w-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                          Live Activity &amp; Audit Stream
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                          All operator change history &amp; operational telemetry
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActivityModalOpen(false)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Modal Filter Controls & Search */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-200/80 dark:border-slate-700">
                      <Search className="h-4 w-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={modalSearchQuery}
                        onChange={e => setModalSearchQuery(e.target.value)}
                        placeholder="Search activity, operator, or details..."
                        className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
                      />
                      {modalSearchQuery && (
                        <button onClick={() => setModalSearchQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold">
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(['all', 'boiler', 'production', 'dispatch', 'system'] as const).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setActivityCategory(cat)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                            activityCategory === cat
                              ? 'bg-[#6C4FE0] text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {cat === 'all' ? 'All Activity' : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modal Stream List Feed */}
                  <div className="p-4 flex-1 overflow-y-auto space-y-3 dashboard-custom-scrollbar max-h-[55vh]">
                    {(() => {
                      let list = unifiedActivityStream;
                      if (modalSearchQuery.trim()) {
                        const q = modalSearchQuery.toLowerCase().trim();
                        list = list.filter(item =>
                          item.operator.toLowerCase().includes(q) ||
                          item.title.toLowerCase().includes(q) ||
                          item.details.toLowerCase().includes(q) ||
                          item.badgeText.toLowerCase().includes(q)
                        );
                      }

                      return list.length === 0 ? (
                        <div className="py-12 text-center text-xs font-bold text-slate-400">
                          No matching activity logs found.
                        </div>
                      ) : (
                        list.map(item => {
                          const isDispatch = item.category === 'dispatch' || item.badgeText.includes('DISPATCH');
                          const badgeColor = item.badgeText.includes('PROFILE')
                            ? 'bg-purple-100/90 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300'
                            : item.badgeText.includes('DISPATCH')
                            ? 'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : item.badgeText.includes('BOILER')
                            ? 'bg-amber-100/90 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                            : item.badgeText.includes('ROLL') || item.badgeText.includes('MACHINE')
                            ? 'bg-blue-100/90 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                            : 'bg-purple-100/90 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300';

                          return (
                            <div
                              key={item.id}
                              className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 shadow-2xs"
                            >
                              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 text-[#6C4FE0] dark:text-purple-400 font-black text-xs">
                                {isDispatch ? <ShoppingCart className="w-4 h-4 stroke-[2.2]" /> : item.operator.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{item.operator}</span>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide shrink-0 ${badgeColor}`}>
                                      {item.badgeText}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-medium text-slate-400 shrink-0">{item.date}</span>
                                </div>
                                <p className="text-xs font-black text-slate-900 dark:text-white mt-1 leading-snug">{item.title}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-snug">{item.details}</p>
                              </div>
                            </div>
                          );
                        })
                      );
                    })()}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Total {unifiedActivityStream.length} activity entries
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsActivityModalOpen(false)}
                      className="px-5 py-2 rounded-xl bg-[#6C4FE0] text-white font-extrabold text-xs shadow-md hover:bg-[#5B3DC9] transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. QUICK ACTIONS & COMPLEMENTARY MILL METRICS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* 1. Shift Output Allocation */}
              <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                      <Factory className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Shift Output Allocation
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {timeframe === 'day'
                          ? `Production split across Shift A & B for ${selectedDate}`
                          : timeframe === 'week'
                          ? `Production split across Shift A & B for 7-day period (${getDateRangeForTimeframe(selectedDate, 'week').startStr} ~ ${selectedDate})`
                          : timeframe === 'month'
                          ? `Production split across Shift A & B for month (${selectedDate.substring(0, 7)})`
                          : `All-time production split across Shift A & B`}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                    {timeframe.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Item 1: Shift A */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Shift A (Day)
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {shiftOutputBreakdown[0]?.rollsCount || 0} rolls produced
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {(shiftOutputBreakdown[0]?.weight || 0).toLocaleString()} kg ({shiftOutputBreakdown[0]?.pct || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${shiftOutputBreakdown[0]?.pct || 0}%` }} />
                    </div>
                  </div>

                  {/* Item 2: Shift B */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          Shift B (Night)
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {shiftOutputBreakdown[1]?.rollsCount || 0} rolls produced
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {(shiftOutputBreakdown[1]?.weight || 0).toLocaleString()} kg ({shiftOutputBreakdown[1]?.pct || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${shiftOutputBreakdown[1]?.pct || 0}%` }} />
                    </div>
                  </div>

                  {/* Item 3: Total Output Summary */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Total Output
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {(shiftOutputBreakdown.reduce((sum, s) => sum + s.rollsCount, 0))} rolls total
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {(shiftOutputBreakdown.reduce((sum, s) => sum + s.weight, 0)).toLocaleString()} kg (100%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Raw Material & Inventory Health */}
              <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <Warehouse className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Raw Material Stock
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">Waste paper & chemical reserves</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                    LIVE STOCK
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Waste Paper Stock */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                          Waste Paper
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {materials.filter(m => m.category === 'WASTE_PAPER')[0]?.name || 'Kraft Waste Mix'}
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {((materials.filter(m => m.category === 'WASTE_PAPER').reduce((a, b) => a + b.stock, 0)) / 1000).toFixed(1)} Tons
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '78%' }} />
                    </div>
                  </div>

                  {/* Chemical Stock */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                          Chemicals
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          Starch & Additives
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {((materials.filter(m => m.category === 'CHEMICAL').reduce((a, b) => a + b.stock, 0)) / 1000).toFixed(1)} Tons
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: '64%' }} />
                    </div>
                  </div>

                  {/* Fuel & Firewood */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                          Boiler Fuel
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          Wood / Biocoal
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {((materials.filter(m => m.category === 'FIREWOOD' || m.category === 'OTHER_RAW_MATERIAL').reduce((a, b) => a + b.stock, 0)) / 1000).toFixed(1)} Tons
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Dispatch & Client Delivery Pipeline */}
              <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Dispatch & Deliveries
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">Party shipments & delivery challans</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                    CHALLANS
                  </span>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const filteredSlips = packingSlips.filter(slip => isDateInFilter(slip.date || slip.dispatchDate || ''));
                    if (filteredSlips.length === 0) {
                      return (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center">
                          <p className="text-xs text-slate-400 font-medium">
                            No dispatch challans found for {timeframe === 'day' ? selectedDate : timeframe}
                          </p>
                        </div>
                      );
                    }
                    return filteredSlips.slice(0, 4).map((slip, idx) => {
                      const slipWeight = slip.reelNos && slip.reelNos.length > 0
                        ? slip.reelNos.reduce((sum, rNo) => {
                            const reel = reels.find(r => r.reelNo === rNo);
                            return sum + (reel?.weight || 0);
                          }, 0)
                        : 0;

                      return (
                        <div key={slip.slipNo || idx} className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 shrink-0">
                                {slip.status || 'DISPATCHED'}
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
                                {parties.find(p => p.id === slip.partyId)?.name || 'PackWell Packaging Ltd'}
                              </span>
                            </div>
                            <span className="font-mono font-black text-slate-900 dark:text-white shrink-0">
                              {slipWeight > 0 ? `${slipWeight.toLocaleString()} kg` : `${slip.reelNos?.length || 0} reels`}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* 5. MILL OPERATIONAL TELEMETRY & QUALITY / UTILITY INFORMATIONAL CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">

              {/* Card 1: Quality Assurance & Lab QC Performance */}
              <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Quality Assurance & QC
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">Lab test compliance & GSM accuracy</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                    98.2% PASS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GSM Accuracy</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">16.1 GSM</div>
                    <div className="text-[10px] text-emerald-500 font-bold">Target 16.0 (±0.2)</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Brightness Index</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">82.4 %</div>
                    <div className="text-[10px] text-emerald-500 font-bold">High Whiteness</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Grade A Reels Ratio</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">98.2% Grade A</span>
                  </div>
                  <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: '98.2%' }} />
                  </div>
                </div>
              </div>

              {/* Card 2: Boiler Steam & Energy Telemetry */}
              <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                        Boiler &amp; Steam Telemetry
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Steam pressure &amp; fuel consumption</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                    STABLE STEAM
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Steam Pressure</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">145 PSI</div>
                    <div className="text-[10px] text-amber-500 font-bold">Temp: 185°C</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fuel Ratio</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">480 kg/Ton</div>
                    <div className="text-[10px] text-emerald-500 font-bold">Optimal Fuel</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Steam Efficiency Budget</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">94.5% Optimal</span>
                  </div>
                  <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: '94.5%' }} />
                  </div>
                </div>
              </div>

              {/* Card 3: ETP Water Recycling & Environmental Health */}
              <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
                      <Droplet className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        ETP & Environmental
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">Water recycling & effluent treatment</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                    ECO COMPLIANT
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Water Recycled</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">92.8 %</div>
                    <div className="text-[10px] text-cyan-500 font-bold">Closed Loop</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Flock Dosage</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">14.5 L/hr</div>
                    <div className="text-[10px] text-emerald-500 font-bold">Standard Dosing</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Water Conservation Target</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">92.8% Recycled</span>
                  </div>
                  <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: '92.8%' }} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default DashboardView;
