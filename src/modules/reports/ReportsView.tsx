import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  getRolls,
  getReels,
  getPackingSlips,
  getRawMaterials,
  getLogs,
  getParties,
  getVehicles,
} from '../../data/index';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { DataFilterBar, type FilterField } from '../../components/DataFilterBar';
import { useDateFilter } from '../../context/DateFilterContext';
import XLSX from 'xlsx-js-style';
import { exportExcelWorkbook } from '../../utils/fileDownloader';
import { createStyledWorksheet, createStyledJsonWorksheet } from '../../utils/excelStyler';
import { COMPANY_CONFIG } from '../../config/company';
import { useAuth } from '../auth/AuthContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  FileSpreadsheet,
  Printer,
  Lock,
  BarChart2,
  Calendar,
  Search,
  TrendingUp,
  Package,
  Truck,
  Factory,
  PieChart as PieChartIcon,
  Layers,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Filter,
  ArrowUpDown,
  UserCheck,
  RefreshCw,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  ReferenceArea,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

type ReportType =
  | 'daily_prod'
  | 'daily_disp'
  | 'stock_grouped'
  | 'avail_reels'
  | 'sold_reels'
  | 'vehicle_wise'
  | 'party_wise'
  | 'raw_material';

export const ReportsView: React.FC = () => {
  const { t } = useTranslation();
  const { isViewer } = useAuth();

  const [selectedReport, setSelectedReport] = useState<ReportType>('stock_grouped');
  const [showStockStatementModal, setShowStockStatementModal] = useState(false);
  const [reportsSearchQuery, setReportsSearchQuery] = useState('');
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportProductFilter, setReportProductFilter] = useState('all');
  const [reportGradeFilter, setReportGradeFilter] = useState('all');
  const [reportGsmFilter, setReportGsmFilter] = useState('all');
  const [reportPartyFilter, setReportPartyFilter] = useState('all');
  const [reportVehicleFilter, setReportVehicleFilter] = useState('all');
  const [reportModuleFilter, setReportModuleFilter] = useState('all');

  // Consume Global Date & Timeframe Filter Context (from Top Navbar Control & Local Reports Toolbar)
  const {
    timeframe,
    setTimeframe,
    selectedDate,
    setSelectedDate,
    handlePrevDate,
    handleNextDate,
    systemToday,
  } = useDateFilter();
  const millReportDatePickerRef = useRef<HTMLDivElement | null>(null);
  const [isMillDatePickerOpen, setIsMillDatePickerOpen] = useState(false);
  const [printWarningToast, setPrintWarningToast] = useState<string | null>(null);
  const getTodayStr = () => new Date().toISOString().substring(0, 10);

  // Raw datasets
  const rolls = getRolls();
  const reels = getReels();
  const slips = getPackingSlips();
  const rawMaterials = getRawMaterials();
  const logs = getLogs();
  const parties = getParties();
  const vehicles = getVehicles();

  const reportsList = [
    { id: 'stock_grouped', name: 'Stock Statement (Grouped)', icon: Layers, color: 'text-indigo-600 dark:text-indigo-400' },
    { id: 'daily_prod', name: 'Daily Production', icon: Factory, color: 'text-blue-600 dark:text-blue-400' },
    { id: 'daily_disp', name: 'Daily Dispatch', icon: Truck, color: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'avail_reels', name: 'Available Inventory (Reels)', icon: Package, color: 'text-cyan-600 dark:text-cyan-400' },
    { id: 'sold_reels', name: 'Dispatched Reels', icon: CheckCircle2, color: 'text-purple-600 dark:text-purple-400' },
    { id: 'party_wise', name: 'Party / Customer Sales', icon: Users, color: 'text-rose-600 dark:text-rose-400' },
    { id: 'raw_material', name: 'Raw Material Ledger', icon: Layers, color: 'text-sky-600 dark:text-sky-400' },
  ];

  // Date range validation helper for active timeframe
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return false;
    const target = dateStr.substring(0, 10);

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

  // --- FILTERED BASE DATASETS ---
  const filteredRolls = useMemo(() => rolls.filter(r => isDateInRange(r.date)), [rolls, timeframe, selectedDate]);
  const filteredReels = useMemo(() => reels.filter(r => isDateInRange(r.productionDate)), [reels, timeframe, selectedDate]);
  const filteredSlips = useMemo(() => slips.filter(s => isDateInRange(s.date)), [slips, timeframe, selectedDate]);
  const filteredLogs = useMemo(() => logs.filter(l => isDateInRange(l.timestamp)), [logs, timeframe, selectedDate]);

  // --- REPORT DATA CALCULATORS ---

  // 1. Daily Production Report Data
  const dailyProdData = useMemo(() => {
    const data: Record<string, { date: string; rollCount: number; reelCount: number; totalWeight: number }> = {};
    filteredRolls.forEach(r => {
      if (!data[r.date]) {
        data[r.date] = { date: r.date, rollCount: 0, reelCount: 0, totalWeight: 0 };
      }
      data[r.date].rollCount += 1;
    });
    filteredReels.forEach(re => {
      const date = re.productionDate.substring(0, 10);
      if (!data[date]) {
        data[date] = { date, rollCount: 0, reelCount: 0, totalWeight: 0 };
      }
      data[date].reelCount += 1;
      data[date].totalWeight += re.weight;
    });
    return Object.values(data).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredRolls, filteredReels]);

  // 2. Daily Dispatch Report Data
  const dailyDispData = useMemo(() => {
    const data: Record<string, { date: string; slipCount: number; reelsDispatched: number; totalWeight: number }> = {};
    filteredSlips.forEach(slip => {
      if (slip.status === 'DISPATCHED') {
        if (!data[slip.date]) {
          data[slip.date] = { date: slip.date, slipCount: 0, reelsDispatched: 0, totalWeight: 0 };
        }
        data[slip.date].slipCount += 1;
        data[slip.date].reelsDispatched += slip.reelNos.length;
        const slipReels = reels.filter(r => slip.reelNos.includes(r.reelNo));
        const w = slipReels.reduce((sum, r) => sum + r.weight, 0);
        data[slip.date].totalWeight += w;
      }
    });
    return Object.values(data).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSlips, reels]);

  useBodyScrollLock(showStockStatementModal);

  // 3. Available Reel Inventory
  const availReelsData = useMemo(() => {
    return reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B');
  }, [reels]);

  // 3b. Grouped Stock Statement Data (Current Stock Statement - Grouped)
  const groupedStockData = useMemo(() => {
    const groups: Record<string, { product: string; gsm: number; size: number; ply: number; reelsCount: number; totalWeight: number }> = {};
    availReelsData.forEach(r => {
      const prod = r.product || 'Napkin Tissue';
      const gsm = Number(r.gsm) || 16;
      const size = Number(r.size) || 30;
      const ply = Number(r.ply) || 1;
      const key = `${prod}|${gsm}|${size}|${ply}`;
      if (!groups[key]) {
        groups[key] = {
          product: prod,
          gsm,
          size,
          ply,
          reelsCount: 0,
          totalWeight: 0,
        };
      }
      groups[key].reelsCount += 1;
      groups[key].totalWeight += Number(r.weight) || 0;
    });

    return Object.values(groups).sort((a, b) => {
      if (a.product !== b.product) return a.product.localeCompare(b.product);
      if (a.gsm !== b.gsm) return a.gsm - b.gsm;
      if (a.size !== b.size) return a.size - b.size;
      return a.ply - b.ply;
    });
  }, [availReelsData]);

  // 4. Sold/Dispatched Reel Report
  const soldReelsData = useMemo(() => {
    return reels.filter(r => r.status === 'DISPATCHED' && isDateInRange(r.dispatchDetails?.dispatchDate || r.productionDate));
  }, [reels, timeframe, selectedDate]);

  // 6. Party-wise Report
  const partyWiseData = useMemo(() => {
    const data: Record<string, { partyName: string; challans: number; reelsCount: number; totalWeight: number }> = {};
    parties.forEach(p => {
      data[p.id] = { partyName: p.name, challans: 0, reelsCount: 0, totalWeight: 0 };
    });

    filteredSlips.forEach(slip => {
      if (slip.status === 'DISPATCHED' && data[slip.partyId]) {
        data[slip.partyId].challans += 1;
        data[slip.partyId].reelsCount += slip.reelNos.length;
        const slipReels = reels.filter(r => slip.reelNos.includes(r.reelNo));
        const w = slipReels.reduce((sum, r) => sum + r.weight, 0);
        data[slip.partyId].totalWeight += w;
      }
    });

    return Object.values(data).filter(item => item.challans > 0);
  }, [parties, filteredSlips, reels]);

  // 7. Raw Material Movement Ledger
  const rawMaterialMovement = useMemo(() => {
    return filteredLogs.filter(log => log.module === 'Raw Material' || log.module === 'Pulp Mill' || log.module === 'Machine');
  }, [filteredLogs]);

  // --- ANALYTICS KPI SCORECARDS ---
  const totalProductionWeightKg = useMemo(() => {
    return dailyProdData.reduce((sum, d) => sum + d.totalWeight, 0);
  }, [dailyProdData]);

  const totalDispatchWeightKg = useMemo(() => {
    return dailyDispData.reduce((sum, d) => sum + d.totalWeight, 0);
  }, [dailyDispData]);

  const totalStockWeightKg = useMemo(() => {
    return availReelsData.reduce((sum, r) => sum + r.weight, 0);
  }, [availReelsData]);

  const dispatchYieldPercent = useMemo(() => {
    if (totalProductionWeightKg === 0) return 100;
    return parseFloat(((totalDispatchWeightKg / totalProductionWeightKg) * 100).toFixed(1));
  }, [totalProductionWeightKg, totalDispatchWeightKg]);

  // --- RECHARTS DIAGRAM DATASETS (Real Mill Production & Dispatch Telemetry) ---
  const trendChartData = useMemo(() => {
    if (timeframe === 'day') {
      const timeSlots = [
        '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
        '19:00', '20:00', '21:00', '22:00', '23:00'
      ];

      const dayRolls = rolls.filter(r => r.date === selectedDate);
      const daySlips = filteredSlips.filter(s => (s.dispatchDate === selectedDate || s.date === selectedDate) && s.status === 'DISPATCHED');

      const map: Record<string, { date: string; prodWeight: number; dispWeight: number; downtimeMin: number; downtimeReason: string }> = {};

      timeSlots.forEach(t => {
        map[t] = { date: t, prodWeight: 0, dispWeight: 0, downtimeMin: 0, downtimeReason: '' };
      });

      // Populate real production rolls per hour
      dayRolls.forEach(r => {
        const timeStr = r.offTime || r.startTime || (r.shift === 'A' ? '10:00' : '18:00');
        const hourPrefix = timeStr.includes(':') ? `${timeStr.split(':')[0].padStart(2, '0')}:00` : '10:00';
        const targetSlot = map[hourPrefix] ? hourPrefix : '12:00';
        map[targetSlot].prodWeight += (Number(r.weight) || 0);

        if (r.downtimeReason && r.downtimeReason.toLowerCase() !== 'none' && r.downtimeReason.trim() !== '') {
          const dtMinutes = (r.workingMinutes && r.workingMinutes < 120) ? Math.max(10, 120 - r.workingMinutes) : 30;
          map[targetSlot].downtimeMin += dtMinutes;
          map[targetSlot].downtimeReason = r.downtimeReason;
        }
      });

      // Populate real dispatch slips per hour
      daySlips.forEach(slip => {
        const timeStr = slip.dispatchTime || '14:00';
        const hourPrefix = timeStr.includes(':') ? `${timeStr.split(':')[0].padStart(2, '0')}:00` : '14:00';
        const targetSlot = map[hourPrefix] ? hourPrefix : '14:00';
        const slipReels = reels.filter(r => slip.reelNos.includes(r.reelNo));
        const totalSlipWeight = slipReels.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
        map[targetSlot].dispWeight += totalSlipWeight;
      });

      return timeSlots.map(t => map[t]);
    }

    if (timeframe === 'week') {
      // Always generate exact 7 consecutive days ending at selectedDate!
      const weekDates: string[] = [];
      const endD = new Date(selectedDate);
      if (isNaN(endD.getTime())) endD.setTime(Date.now());

      for (let i = 6; i >= 0; i--) {
        const d = new Date(endD);
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        weekDates.push(`${yyyy}-${mm}-${dd}`);
      }

      const map: Record<string, { date: string; shortDate: string; prodWeight: number; dispWeight: number; downtimeMin: number; downtimeReason: string }> = {};

      weekDates.forEach((fullDate) => {
        const shortDate = fullDate.substring(5); // MM-DD
        const pEntry = dailyProdData.find(p => p.date === fullDate);
        const dEntry = dailyDispData.find(d => d.date === fullDate);

        const prod = pEntry ? pEntry.totalWeight : 0;
        const disp = dEntry ? dEntry.totalWeight : 0;

        map[fullDate] = {
          date: shortDate,
          shortDate,
          prodWeight: prod,
          dispWeight: disp,
          downtimeMin: 0,
          downtimeReason: '',
        };
      });

      return weekDates.map(fullDate => ({
        date: map[fullDate].shortDate,
        prodWeight: map[fullDate].prodWeight,
        dispWeight: map[fullDate].dispWeight,
        downtimeMin: map[fullDate].downtimeMin,
        downtimeReason: map[fullDate].downtimeReason,
      }));
    }

    // For Month or All timeframe views: Aggregate real daily production and dispatch totals
    const map: Record<string, { date: string; prodWeight: number; dispWeight: number; downtimeMin: number; downtimeReason: string }> = {};

    dailyProdData.forEach(p => {
      const shortDate = p.date.substring(5); // MM-DD
      if (!map[shortDate]) map[shortDate] = { date: shortDate, prodWeight: 0, dispWeight: 0, downtimeMin: 0, downtimeReason: '' };
      map[shortDate].prodWeight += p.totalWeight;
    });

    dailyDispData.forEach(d => {
      const shortDate = d.date.substring(5);
      if (!map[shortDate]) map[shortDate] = { date: shortDate, prodWeight: 0, dispWeight: 0, downtimeMin: 0, downtimeReason: '' };
      map[shortDate].dispWeight += d.totalWeight;
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [timeframe, selectedDate, rolls, reels, slips, filteredReels, filteredSlips, dailyProdData, dailyDispData]);

  const gradeDistributionData = useMemo(() => {
    let gradeA = 0;
    let gradeB = 0;
    let qcPending = 0;
    let dispatched = 0;

    reels.forEach(r => {
      if (r.status === 'QC_PENDING' || r.qcGrade === 'PENDING') qcPending += 1;
      else if (r.status === 'DISPATCHED') dispatched += 1;
      else if (r.qcGrade === 'A' || r.status === 'IN_STOCK') gradeA += 1;
      else gradeB += 1;
    });

    return [
      { name: 'Grade A In-Stock', value: gradeA, color: '#10B981' },
      { name: 'Grade B In-Stock', value: gradeB, color: '#F59E0B' },
      { name: 'QC Pending', value: qcPending, color: '#8B5CF6' },
      { name: 'Dispatched', value: dispatched, color: '#2563EB' },
    ];
  }, [reels]);

  // Custom Date Range validation helper
  const isDateInCustomRange = (dateStr?: string) => {
    if (!dateStr) return true;
    const target = dateStr.substring(0, 10);
    if (reportDateFrom && target < reportDateFrom) return false;
    if (reportDateTo && target > reportDateTo) return false;
    return true;
  };

  // Unique options for dynamic filter dropdowns
  const uniqueProducts = useMemo(() => [...new Set(reels.map(r => r.product).filter(Boolean))], [reels]);
  const uniqueGsms = useMemo(() => [...new Set(reels.map(r => String(r.gsm)).filter(Boolean))].sort((a, b) => Number(a) - Number(b)), [reels]);
  const uniqueParties = useMemo(() => parties.map(p => ({ label: p.name, value: p.name })), [parties]);
  const uniqueVehicles = useMemo(() => vehicles.map(v => ({ label: v.vehicleNo, value: v.vehicleNo })), [vehicles]);

  const activeFilterFields: FilterField[] = useMemo(() => {
    if (selectedReport === 'stock_grouped') {
      return [
        { id: 'product', label: 'Product Name', options: uniqueProducts.map(p => ({ label: p, value: p })) },
        { id: 'gsm', label: 'GSM', options: uniqueGsms.map(g => ({ label: `${g} GSM`, value: g })) },
      ];
    }
    if (selectedReport === 'avail_reels') {
      return [
        { id: 'product', label: 'Product Name', options: uniqueProducts.map(p => ({ label: p, value: p })) },
        { id: 'grade', label: 'QC Grade', options: [{ label: 'Grade A', value: 'A' }, { label: 'Grade B', value: 'B' }] },
        { id: 'gsm', label: 'GSM', options: uniqueGsms.map(g => ({ label: `${g} GSM`, value: g })) },
      ];
    }
    if (selectedReport === 'sold_reels') {
      return [
        { id: 'product', label: 'Product Name', options: uniqueProducts.map(p => ({ label: p, value: p })) },
        { id: 'party', label: 'Customer / Party', options: uniqueParties },
        { id: 'vehicle', label: 'Vehicle Number', options: uniqueVehicles },
      ];
    }
    if (selectedReport === 'party_wise') {
      return [
        { id: 'party', label: 'Customer / Party', options: uniqueParties },
      ];
    }
    if (selectedReport === 'raw_material') {
      return [
        {
          id: 'module',
          label: 'Module Area',
          options: [
            { label: 'Raw Material', value: 'Raw Material' },
            { label: 'Pulp Mill', value: 'Pulp Mill' },
            { label: 'Machine', value: 'Machine' },
          ],
        },
      ];
    }
    return [];
  }, [selectedReport, uniqueProducts, uniqueGsms, uniqueParties, uniqueVehicles]);

  const clearAllReportFilters = () => {
    setReportsSearchQuery('');
    setReportDateFrom('');
    setReportDateTo('');
    setReportProductFilter('all');
    setReportGradeFilter('all');
    setReportGsmFilter('all');
    setReportPartyFilter('all');
    setReportVehicleFilter('all');
    setReportModuleFilter('all');
  };

  // --- SEARCH & FILTERED REPORT VIEWS ---
  const filteredDailyProd = useMemo(() => {
    let list = dailyProdData.filter(d => isDateInCustomRange(d.date));
    const q = reportsSearchQuery.toLowerCase().trim();
    if (q) list = list.filter(d => d.date.includes(q));
    return list;
  }, [dailyProdData, reportsSearchQuery, reportDateFrom, reportDateTo]);

  const filteredDailyDisp = useMemo(() => {
    let list = dailyDispData.filter(d => isDateInCustomRange(d.date));
    const q = reportsSearchQuery.toLowerCase().trim();
    if (q) list = list.filter(d => d.date.includes(q));
    return list;
  }, [dailyDispData, reportsSearchQuery, reportDateFrom, reportDateTo]);

  const filteredGroupedStock = useMemo(() => {
    let list = groupedStockData;
    if (reportProductFilter !== 'all') list = list.filter(g => g.product === reportProductFilter);
    if (reportGsmFilter !== 'all') list = list.filter(g => String(g.gsm) === reportGsmFilter);
    const q = reportsSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        g =>
          g.product.toLowerCase().includes(q) ||
          String(g.gsm).includes(q) ||
          String(g.size).includes(q) ||
          String(g.ply).includes(q)
      );
    }
    return list;
  }, [groupedStockData, reportsSearchQuery, reportProductFilter, reportGsmFilter]);

  const totalGroupedReelsCount = useMemo(() => {
    return filteredGroupedStock.reduce((sum, g) => sum + g.reelsCount, 0);
  }, [filteredGroupedStock]);

  const totalGroupedWeightKg = useMemo(() => {
    return filteredGroupedStock.reduce((sum, g) => sum + g.totalWeight, 0);
  }, [filteredGroupedStock]);

  const filteredAvailReels = useMemo(() => {
    let list = availReelsData.filter(r => isDateInCustomRange(r.productionDate));
    if (reportProductFilter !== 'all') list = list.filter(r => r.product === reportProductFilter);
    if (reportGradeFilter !== 'all') list = list.filter(r => r.qcGrade === reportGradeFilter);
    if (reportGsmFilter !== 'all') list = list.filter(r => String(r.gsm) === reportGsmFilter);
    const q = reportsSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        r =>
          r.reelNo.toLowerCase().includes(q) ||
          r.product.toLowerCase().includes(q) ||
          String(r.gsm).includes(q) ||
          String(r.size).includes(q) ||
          r.qcGrade.toLowerCase().includes(q)
      );
    }
    return list;
  }, [availReelsData, reportsSearchQuery, reportDateFrom, reportDateTo, reportProductFilter, reportGradeFilter, reportGsmFilter]);

  const filteredSoldReels = useMemo(() => {
    let list = soldReelsData.filter(r => isDateInCustomRange(r.dispatchDetails?.dispatchDate || r.productionDate));
    if (reportProductFilter !== 'all') list = list.filter(r => r.product === reportProductFilter);
    if (reportPartyFilter !== 'all') list = list.filter(r => (r.dispatchDetails?.partyName || '').toLowerCase() === reportPartyFilter.toLowerCase());
    if (reportVehicleFilter !== 'all') list = list.filter(r => (r.dispatchDetails?.vehicleNo || '').toLowerCase() === reportVehicleFilter.toLowerCase());
    const q = reportsSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        r =>
          r.reelNo.toLowerCase().includes(q) ||
          r.product.toLowerCase().includes(q) ||
          (r.dispatchDetails?.partyName && r.dispatchDetails.partyName.toLowerCase().includes(q)) ||
          (r.dispatchDetails?.packingSlipNo && r.dispatchDetails.packingSlipNo.toLowerCase().includes(q)) ||
          (r.dispatchDetails?.vehicleNo && r.dispatchDetails.vehicleNo.toLowerCase().includes(q))
      );
    }
    return list;
  }, [soldReelsData, reportsSearchQuery, reportDateFrom, reportDateTo, reportProductFilter, reportPartyFilter, reportVehicleFilter]);

  const filteredPartyWise = useMemo(() => {
    let list = partyWiseData;
    if (reportPartyFilter !== 'all') list = list.filter(p => p.partyName === reportPartyFilter);
    const q = reportsSearchQuery.toLowerCase().trim();
    if (q) list = list.filter(p => p.partyName.toLowerCase().includes(q));
    return list;
  }, [partyWiseData, reportsSearchQuery, reportPartyFilter]);

  const filteredRawMovement = useMemo(() => {
    let list = rawMaterialMovement.filter(l => isDateInCustomRange(l.timestamp));
    if (reportModuleFilter !== 'all') list = list.filter(l => l.module === reportModuleFilter);
    const q = reportsSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        l => l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q) || l.user.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rawMaterialMovement, reportsSearchQuery, reportDateFrom, reportDateTo, reportModuleFilter]);

  // Current active report record count & empty state detection
  const currentReportRecordCount = useMemo(() => {
    switch (selectedReport) {
      case 'stock_grouped':
        return filteredGroupedStock.length;
      case 'daily_prod':
        return filteredDailyProd.length;
      case 'daily_disp':
        return filteredDailyDisp.length;
      case 'avail_reels':
        return filteredAvailReels.length;
      case 'sold_reels':
        return filteredSoldReels.length;
      case 'party_wise':
        return filteredPartyWise.length;
      case 'raw_material':
        return filteredRawMovement.length;
      default:
        return 0;
    }
  }, [
    selectedReport,
    filteredGroupedStock.length,
    filteredDailyProd.length,
    filteredDailyDisp.length,
    filteredAvailReels.length,
    filteredSoldReels.length,
    filteredPartyWise.length,
    filteredRawMovement.length,
  ]);

  const isCurrentReportEmpty = currentReportRecordCount === 0;

  // --- CLEAN, INTUITIVE MULTI-SHEET EXCEL (.XLSX) EXPORT FUNCTION ---
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Base Calculations (Robust fallback to full mill database if date filter is active)
    const totalProdKg = totalProductionWeightKg > 0 ? totalProductionWeightKg : reels.reduce((s, r) => s + (r.weight || 0), 0);
    const dispatchedReelsList = reels.filter(r => r.status === 'DISPATCHED');
    const totalDispKg = totalDispatchWeightKg > 0 ? totalDispatchWeightKg : dispatchedReelsList.reduce((s, r) => s + (r.weight || 0), 0);
    const inStockReelsList = reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B');
    const totalStockKg = inStockReelsList.reduce((s, r) => s + (r.weight || 0), 0);
    const yieldRate = totalProdKg > 0 ? ((totalDispKg / totalProdKg) * 100).toFixed(1) : '100.0';

    const gradeAList = reels.filter(r => (r.qcGrade || 'A') === 'A');
    const gradeBList = reels.filter(r => (r.qcGrade || 'A') === 'B');
    const gradeAKg = gradeAList.reduce((s, r) => s + (r.weight || 0), 0);
    const gradeBKg = gradeBList.reduce((s, r) => s + (r.weight || 0), 0);
    const totalGradeKg = gradeAKg + gradeBKg || 1;

    // 1. SHEET 1: MILL REPORT SUMMARY (Clear sectioned layout)
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const summaryRows: (string | number)[][] = [
      ['PRODUCTION: Total Jumbo Rolls (Paper Machine)', rolls.length, 'Parent rolls cast'],
      ['PRODUCTION: Total Finished Reels (Rewinder Slit)', reels.length, 'Slit reels produced'],
      ['PRODUCTION: Total Production Weight', `${totalProdKg.toLocaleString()} kg`, `${(totalProdKg / 1000).toFixed(2)} MT`],
      ['DISPATCH: Total Reels Dispatched', dispatchedReelsList.length, 'Gate pass confirmed'],
      ['DISPATCH: Total Dispatched Weight', `${totalDispKg.toLocaleString()} kg`, `${(totalDispKg / 1000).toFixed(2)} MT`],
      ['DISPATCH: Total Challans / Gate Passes', slips.length, 'Packing slips issued'],
      ['DISPATCH: Dispatch Yield Rate', `${yieldRate}%`, 'Target: above 95%'],
      ['WAREHOUSE: Reels In Stock (Total)', inStockReelsList.length, 'Ready for dispatch'],
      ['WAREHOUSE: In-Stock Weight', `${totalStockKg.toLocaleString()} kg`, `${(totalStockKg / 1000).toFixed(2)} MT`],
      ['QUALITY: Grade A — Prime Quality', `${gradeAList.length} reels (${gradeAKg.toLocaleString()} kg)`, `${((gradeAKg / totalGradeKg) * 100).toFixed(1)}% share`],
      ['QUALITY: Grade B — Commercial Quality', `${gradeBList.length} reels (${gradeBKg.toLocaleString()} kg)`, `${((gradeBKg / totalGradeKg) * 100).toFixed(1)}% share`],
      ['ACCOUNTS: Active Buyer Accounts', parties.length, 'Verified distributors & dealers'],
      ['LOGISTICS: Total Vehicles Registered', vehicles.length, 'Assigned transport fleet'],
    ];

    const summaryWs = createStyledWorksheet({
      title: 'EXECUTIVE SUMMARY & MILL PERFORMANCE',
      metadata: [
        {
          leftLabel: 'Report Generation Date',
          leftValue: todayStr,
          rightLabel: 'Generation Time',
          rightValue: today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
        {
          leftLabel: 'Operational Unit',
          leftValue: 'Main Paper Mill Unit-1',
          rightLabel: 'System Status',
          rightValue: 'Verified Active',
        },
      ],
      headers: ['Mill Performance Metric / KPI', 'Current Value', 'Operational Remark / Benchmark'],
      rows: summaryRows,
      alignments: ['left', 'center', 'left'],
      colWidths: [44, 26, 36],
      footerNote: 'This is an official system-generated executive summary from Saheb Paper ERP.',
    });
    XLSX.utils.book_append_sheet(workbook, summaryWs, 'Executive_Summary');

    // 2. SHEET 2: PRODUCT-WISE PERFORMANCE TABLE
    const prodMap: Record<string, {
      product: string;
      producedReels: number;
      producedWeight: number;
      inStockReels: number;
      inStockWeight: number;
      dispReels: number;
      dispWeight: number;
    }> = {};

    reels.forEach(r => {
      const pName = r.product || 'Other Spec';
      if (!prodMap[pName]) {
        prodMap[pName] = {
          product: pName,
          producedReels: 0,
          producedWeight: 0,
          inStockReels: 0,
          inStockWeight: 0,
          dispReels: 0,
          dispWeight: 0,
        };
      }
      prodMap[pName].producedReels += 1;
      prodMap[pName].producedWeight += (r.weight || 0);

      if (r.status === 'DISPATCHED') {
        prodMap[pName].dispReels += 1;
        prodMap[pName].dispWeight += (r.weight || 0);
      } else {
        prodMap[pName].inStockReels += 1;
        prodMap[pName].inStockWeight += (r.weight || 0);
      }
    });

    const productExportData = Object.values(prodMap).map(p => ({
      'Product Name': p.product,
      'Total Reels Produced': p.producedReels,
      'Total Produced (kg)': p.producedWeight,
      'Produced Tonnage (MT)': parseFloat((p.producedWeight / 1000).toFixed(2)),
      'In-Stock Reels': p.inStockReels,
      'In-Stock Weight (kg)': p.inStockWeight,
      'In-Stock Tonnage (MT)': parseFloat((p.inStockWeight / 1000).toFixed(2)),
      'Dispatched Reels': p.dispReels,
      'Dispatched Weight (kg)': p.dispWeight,
      'Avg Reel Weight (kg)': p.producedReels > 0 ? Math.round(p.producedWeight / p.producedReels) : 0,
    }));
    const productWs = createStyledJsonWorksheet('PRODUCT-WISE PERFORMANCE AUDIT', productExportData, {
      metadata: [{ leftLabel: 'Category', leftValue: 'Product Specs & Yield', rightLabel: 'Report Date', rightValue: todayStr }],
      colWidths: [26, 20, 20, 22, 16, 20, 22, 18, 22, 20],
      footerNote: 'Saheb Paper Mills — Finished Goods Performance Analytics',
    });
    XLSX.utils.book_append_sheet(workbook, productWs, 'Product_Performance');

    // 3. SHEET 3: QUALITY & QC GRADES BREAKDOWN
    const qualityExportData = [
      {
        'QC Quality Grade': 'Grade A (Prime Quality)',
        'Total Finished Reels': gradeAList.length,
        'Total Weight (kg)': gradeAKg,
        'Tonnage (MT)': parseFloat((gradeAKg / 1000).toFixed(2)),
        'Production Share (%)': `${((gradeAKg / totalGradeKg) * 100).toFixed(1)}%`,
        'Quality Standard / Description': 'High-speed converting grade, uniform formation & high tensile strength',
      },
      {
        'QC Quality Grade': 'Grade B (Commercial / Secondary)',
        'Total Finished Reels': gradeBList.length,
        'Total Weight (kg)': gradeBKg,
        'Tonnage (MT)': parseFloat((gradeBKg / 1000).toFixed(2)),
        'Production Share (%)': `${((gradeBKg / totalGradeKg) * 100).toFixed(1)}%`,
        'Quality Standard / Description': 'Economical grade with minor GSM or edge trim variance',
      },
    ];
    const qualityWs = createStyledJsonWorksheet('QUALITY CONTROL & GRADING AUDIT', qualityExportData, {
      metadata: [{ leftLabel: 'Audit Area', leftValue: 'Reel Quality Inspection', rightLabel: 'Report Date', rightValue: todayStr }],
      colWidths: [30, 20, 18, 16, 20, 55],
      footerNote: 'Official Quality Assurance Report — Saheb Paper ERP',
    });
    XLSX.utils.book_append_sheet(workbook, qualityWs, 'Quality_QC_Report');

    // 4. SHEET 4: DAILY PRODUCTION LOG
    const prodExportData = filteredDailyProd.map(d => ({
      'Production Date': d.date,
      'Jumbo Rolls Made': d.rollCount,
      'Finished Reels Slit': d.reelCount,
      'Total Output Weight (kg)': d.totalWeight,
      'Output Tonnage (MT)': parseFloat((d.totalWeight / 1000).toFixed(3)),
      'Avg Weight / Reel (kg)': d.reelCount > 0 ? Math.round(d.totalWeight / d.reelCount) : 0,
      'Shift Operating Status': 'Shift Complete',
    }));
    const prodWs = createStyledJsonWorksheet('DAILY PRODUCTION LEDGER', prodExportData, {
      metadata: [{ leftLabel: 'Section', leftValue: 'Paper Machine & Rewinder', rightLabel: 'Report Date', rightValue: todayStr }],
      colWidths: [18, 20, 20, 24, 20, 22, 22],
      footerNote: 'Daily Mill Production Logs — Saheb Paper ERP',
    });
    XLSX.utils.book_append_sheet(workbook, prodWs, 'Daily_Production');

    // 5. SHEET 5: DAILY DISPATCH LOG
    const dispExportData = filteredDailyDisp.map(d => ({
      'Dispatch Date': d.date,
      'Challans / Slips Issued': d.slipCount,
      'Reels Dispatched': d.reelsDispatched,
      'Total Dispatched (kg)': d.totalWeight,
      'Dispatched Tonnage (MT)': parseFloat((d.totalWeight / 1000).toFixed(3)),
      'Logistics Status': 'Gate Pass Confirmed',
    }));
    const dispWs = createStyledJsonWorksheet('DAILY DISPATCH & LOGISTICS LEDGER', dispExportData, {
      metadata: [{ leftLabel: 'Section', leftValue: 'Finished Goods Logistics', rightLabel: 'Report Date', rightValue: todayStr }],
      colWidths: [18, 24, 18, 22, 22, 24],
      footerNote: 'Daily Outward Logistics Logs — Saheb Paper ERP',
    });
    XLSX.utils.book_append_sheet(workbook, dispWs, 'Daily_Dispatch');

    // 6. SHEET 6: AVAILABLE WAREHOUSE INVENTORY (REELS)
    const availExportData = filteredAvailReels.map(r => ({
      'Reel Number': r.reelNo,
      'Product Name': r.product || 'Tissue Paper',
      'GSM': r.gsm,
      'Size (cm)': r.size,
      'Ply': r.ply || 1,
      'Net Weight (kg)': r.weight,
      'QC Grade': `Grade ${r.qcGrade || 'A'}`,
      'Warehouse Status': r.status === 'IN_STOCK_B' ? 'Grade B Stock' : 'In Stock Prime',
      'Production Date': (r.productionDate || '').substring(0, 10),
    }));
    const availWs = createStyledJsonWorksheet('AVAILABLE WAREHOUSE STOCK (ITEMIZED)', availExportData, {
      metadata: [{ leftLabel: 'Section', leftValue: 'Godown Finished Inventory', rightLabel: 'Report Date', rightValue: todayStr }],
      colWidths: [18, 24, 12, 14, 10, 16, 16, 18, 16],
      footerNote: 'Real-time Itemized Warehouse Statement — Saheb Paper ERP',
    });
    XLSX.utils.book_append_sheet(workbook, availWs, 'Warehouse_Stock');

    // 6b. SHEET 6b: CURRENT STOCK STATEMENT (GROUPED)
    const groupedExportData = filteredGroupedStock.map(g => ({
      'PRODUCT': g.product,
      'GSM': g.gsm,
      'SIZE': `${g.size} CM`,
      'PLY': `${g.ply} Ply`,
      'REELS': g.reelsCount,
      'WEIGHT (KG)': g.totalWeight,
    }));
    const groupedWs = createStyledJsonWorksheet('CURRENT STOCK STATEMENT (GROUPED BY SPEC)', groupedExportData, {
      metadata: [{ leftLabel: 'Section', leftValue: 'Grouped Finished Stock', rightLabel: 'Report Date', rightValue: todayStr }],
      colWidths: [26, 12, 16, 14, 14, 18],
      footerNote: 'Grouped Inventory Statement — Saheb Paper ERP',
    });
    XLSX.utils.book_append_sheet(workbook, groupedWs, 'Stock_Statement_Grouped');

    // 7. SHEET 7: DISPATCHED REELS HISTORY
    const soldExportData = filteredSoldReels.map(r => ({
      'Reel Number': r.reelNo,
      'Product Name': r.product || 'Tissue Paper',
      'GSM': r.gsm,
      'Size (cm)': r.size,
      'Ply': r.ply || 1,
      'Weight (kg)': r.weight,
      'Customer / Party Name': r.dispatchDetails?.partyName || 'Walk-in Buyer',
      'Challan / Slip No': r.dispatchDetails?.packingSlipNo || 'CHALLAN-001',
      'Vehicle / Truck No': r.dispatchDetails?.vehicleNo || 'GJ01EP1234',
      'Dispatch Date': r.dispatchDetails?.dispatchDate || (r.productionDate || '').substring(0, 10),
    }));
    const soldWs = createStyledJsonWorksheet('DISPATCHED REELS AUDIT TRAIL', soldExportData, {
      metadata: [{ leftLabel: 'Section', leftValue: 'Historical Outward Consignments', rightLabel: 'Report Date', rightValue: todayStr }],
      colWidths: [18, 22, 12, 14, 10, 16, 30, 24, 20, 18],
      footerNote: 'Archived Dispatch Records — Saheb Paper ERP',
    });
    XLSX.utils.book_append_sheet(workbook, soldWs, 'Dispatched_Reels');

    // 8. SHEET 8: CUSTOMER SALES SUMMARY
    const partyExportData = filteredPartyWise.map(p => ({
      'Customer / Party Name': p.partyName,
      'Total Challans Issued': p.challans,
      'Total Reels Purchased': p.reelsCount,
      'Total Weight Sold (kg)': p.totalWeight,
      'Tonnage (MT)': parseFloat((p.totalWeight / 1000).toFixed(3)),
      'Commercial Status': 'Active Buyer Account',
    }));
    const partyWs = createStyledJsonWorksheet('CUSTOMER SALES & COMMERCIAL SUMMARY', partyExportData, {
      metadata: [{ leftLabel: 'Section', leftValue: 'Customer Billing Ledger', rightLabel: 'Report Date', rightValue: todayStr }],
      colWidths: [32, 22, 22, 24, 18, 25],
      footerNote: 'Customer Commercial Accounts Summary — Saheb Paper ERP',
    });
    XLSX.utils.book_append_sheet(workbook, partyWs, 'Customer_Sales');

    // 9. SHEET 9: RAW MATERIAL MOVEMENTS
    const rawExportData = filteredRawMovement.map(l => ({
      'Timestamp': l.timestamp,
      'Module / Area': l.module,
      'Transaction Type': l.action,
      'Activity Details': l.details,
      'Operator / Supervisor': l.user,
    }));
    const rawWs = createStyledJsonWorksheet('RAW MATERIAL AUDIT TRAIL', rawExportData, {
      metadata: [{ leftLabel: 'Section', leftValue: 'Raw Material Consumption & Receipt', rightLabel: 'Report Date', rightValue: todayStr }],
      colWidths: [24, 18, 24, 48, 22],
      footerNote: 'Raw Material Inventory Movement Logs — Saheb Paper ERP',
    });
    XLSX.utils.book_append_sheet(workbook, rawWs, 'Raw_Material_Ledger');

    // Export cleanly
    exportExcelWorkbook(workbook, `Saheb_Paper_Mill_Reports_Analytics_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  const handlePrint = () => {
    if (isViewer) return;
    if (isCurrentReportEmpty) {
      setPrintWarningToast(`⚠️ Report Not Ready: No data found for "${reportsList.find(r => r.id === selectedReport)?.name || 'this report'}" in the selected timeframe / filter criteria.`);
      setTimeout(() => setPrintWarningToast(null), 4500);
      return;
    }
    setShowStockStatementModal(true);
  };

  // --- CLEAN EXECUTIVE A4 PRINTABLE DOCUMENT RENDERER ---
  const renderPrintableReportContent = () => {
    const todayFormatted = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    if (selectedReport === 'stock_grouped') {
      return (
        <div className="bg-white text-black p-4 sm:p-10 font-sans print:p-0 print:m-0">
          {/* 1. Header Company Name & Divider */}
          <div className="border-b-[2.5px] border-[#0B132B] pb-2 mb-4">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-[#0B132B]">
              SAHEB PAPER PVT. LTD.
            </h1>
          </div>

          {/* 2. Document Title & Subtitle */}
          <div className="text-center my-4 space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-[#0B132B] uppercase tracking-[0.25em]">
              Current Stock Statement (Grouped)
            </h2>
            <p className="text-xs font-medium text-slate-700">
              Total: {totalGroupedReelsCount} reels &bull; {totalGroupedWeightKg.toLocaleString()} KG
            </p>
          </div>

          {/* 3. Grouped Stock Statement Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-[#0B132B] text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-4 text-left">PRODUCT</th>
                  <th className="py-2.5 px-4 text-center">GSM</th>
                  <th className="py-2.5 px-4 text-center">SIZE</th>
                  <th className="py-2.5 px-4 text-center">PLY</th>
                  <th className="py-2.5 px-4 text-center">REELS</th>
                  <th className="py-2.5 px-4 text-right">WEIGHT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-900">
                {filteredGroupedStock.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      No finished stock found in warehouse.
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredGroupedStock.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-200">
                        <td className="py-2.5 px-4 text-left font-semibold text-slate-900">{row.product}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{row.gsm}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{row.size} CM</td>
                        <td className="py-2.5 px-4 text-center font-mono">{row.ply} Ply</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">
                          {row.reelsCount}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {row.totalWeight.toLocaleString()} KG
                        </td>
                      </tr>
                    ))}
                    {/* GRAND TOTAL ROW */}
                    <tr className="bg-[#FEE4CB] text-slate-950 font-black border-t-2 border-slate-300">
                      <td colSpan={4} className="py-2.5 px-4 uppercase tracking-wider font-black text-left">
                        GRAND TOTAL
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-black">
                        {totalGroupedReelsCount} Reels
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-black">
                        {totalGroupedWeightKg.toLocaleString()} KG
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* 4. Generation Footer */}
          <div className="mt-12 text-center text-[11px] text-slate-500 font-medium">
            Generated on {todayFormatted}
          </div>
        </div>
      );
    }

    if (selectedReport === 'daily_prod') {
      const totalRolls = filteredDailyProd.reduce((sum, r) => sum + r.rollCount, 0);
      const totalReels = filteredDailyProd.reduce((sum, r) => sum + r.reelCount, 0);
      const totalWeight = filteredDailyProd.reduce((sum, r) => sum + r.totalWeight, 0);
      return (
        <div className="bg-white text-black p-4 sm:p-10 font-sans print:p-0 print:m-0">
          <div className="border-b-[2.5px] border-[#0B132B] pb-2 mb-4">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-[#0B132B]">
              SAHEB PAPER PVT. LTD.
            </h1>
          </div>
          <div className="text-center my-4 space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-[#0B132B] uppercase tracking-[0.25em]">
              Daily Production Statement
            </h2>
            <p className="text-xs font-medium text-slate-700">
              Total: {totalRolls} rolls &bull; {totalReels} reels &bull; {totalWeight.toLocaleString()} KG
            </p>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-[#0B132B] text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-4 text-left">DATE</th>
                  <th className="py-2.5 px-4 text-center">JUMBO ROLLS</th>
                  <th className="py-2.5 px-4 text-center">FINISHED REELS</th>
                  <th className="py-2.5 px-4 text-right">TOTAL WEIGHT</th>
                  <th className="py-2.5 px-4 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-900">
                {filteredDailyProd.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-2.5 px-4 text-left font-semibold text-slate-900">{row.date.split('-').reverse().join('/')}</td>
                    <td className="py-2.5 px-4 text-center font-mono">{row.rollCount} rolls</td>
                    <td className="py-2.5 px-4 text-center font-mono">{row.reelCount} reels</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">{row.totalWeight.toLocaleString()} KG</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-700">Complete</td>
                  </tr>
                ))}
                <tr className="bg-[#FEE4CB] text-slate-950 font-black border-t-2 border-slate-300">
                  <td className="py-2.5 px-4 uppercase tracking-wider font-black text-left">GRAND TOTAL</td>
                  <td className="py-2.5 px-4 text-center font-mono font-black">{totalRolls} Rolls</td>
                  <td className="py-2.5 px-4 text-center font-mono font-black">{totalReels} Reels</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black">{totalWeight.toLocaleString()} KG</td>
                  <td className="py-2.5 px-4 text-center font-mono font-black">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-12 text-center text-[11px] text-slate-500 font-medium">
            Generated on {todayFormatted}
          </div>
        </div>
      );
    }

    if (selectedReport === 'daily_disp') {
      const totalSlips = filteredDailyDisp.reduce((sum, r) => sum + r.slipCount, 0);
      const totalReels = filteredDailyDisp.reduce((sum, r) => sum + r.reelsDispatched, 0);
      const totalWeight = filteredDailyDisp.reduce((sum, r) => sum + r.totalWeight, 0);
      return (
        <div className="bg-white text-black p-4 sm:p-10 font-sans print:p-0 print:m-0">
          <div className="border-b-[2.5px] border-[#0B132B] pb-2 mb-4">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-[#0B132B]">
              SAHEB PAPER PVT. LTD.
            </h1>
          </div>
          <div className="text-center my-4 space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-[#0B132B] uppercase tracking-[0.25em]">
              Daily Dispatch Statement
            </h2>
            <p className="text-xs font-medium text-slate-700">
              Total: {totalSlips} challans &bull; {totalReels} reels &bull; {totalWeight.toLocaleString()} KG
            </p>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-[#0B132B] text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-4 text-left">DISPATCH DATE</th>
                  <th className="py-2.5 px-4 text-center">CHALLANS ISSUED</th>
                  <th className="py-2.5 px-4 text-center">REELS DISPATCHED</th>
                  <th className="py-2.5 px-4 text-right">TOTAL WEIGHT</th>
                  <th className="py-2.5 px-4 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-900">
                {filteredDailyDisp.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-2.5 px-4 text-left font-semibold text-slate-900">{row.date.split('-').reverse().join('/')}</td>
                    <td className="py-2.5 px-4 text-center font-mono">{row.slipCount} slips</td>
                    <td className="py-2.5 px-4 text-center font-mono">{row.reelsDispatched} reels</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">{row.totalWeight.toLocaleString()} KG</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-700">Verified Gate Out</td>
                  </tr>
                ))}
                <tr className="bg-[#FEE4CB] text-slate-950 font-black border-t-2 border-slate-300">
                  <td className="py-2.5 px-4 uppercase tracking-wider font-black text-left">GRAND TOTAL</td>
                  <td className="py-2.5 px-4 text-center font-mono font-black">{totalSlips} Slips</td>
                  <td className="py-2.5 px-4 text-center font-mono font-black">{totalReels} Reels</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black">{totalWeight.toLocaleString()} KG</td>
                  <td className="py-2.5 px-4 text-center font-mono font-black">Gate Out</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-12 text-center text-[11px] text-slate-500 font-medium">
            Generated on {todayFormatted}
          </div>
        </div>
      );
    }

    if (selectedReport === 'avail_reels') {
      const totalWeight = filteredAvailReels.reduce((sum, r) => sum + r.weight, 0);
      return (
        <div className="bg-white text-black p-4 sm:p-10 font-sans print:p-0 print:m-0">
          <div className="border-b-[2.5px] border-[#0B132B] pb-2 mb-4">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-[#0B132B]">
              SAHEB PAPER PVT. LTD.
            </h1>
          </div>
          <div className="text-center my-4 space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-[#0B132B] uppercase tracking-[0.25em]">
              Available Reel Inventory Statement
            </h2>
            <p className="text-xs font-medium text-slate-700">
              Total: {filteredAvailReels.length} reels &bull; {totalWeight.toLocaleString()} KG
            </p>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-[#0B132B] text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-4 text-left">REEL NUMBER</th>
                  <th className="py-2.5 px-4 text-left">PRODUCT</th>
                  <th className="py-2.5 px-4 text-center">GSM / SIZE</th>
                  <th className="py-2.5 px-4 text-center">QC GRADE</th>
                  <th className="py-2.5 px-4 text-right">NET WEIGHT</th>
                  <th className="py-2.5 px-4 text-right">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-900">
                {filteredAvailReels.map((r, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-2.5 px-4 text-left font-mono font-bold">{r.reelNo}</td>
                    <td className="py-2.5 px-4 text-left">{r.product}</td>
                    <td className="py-2.5 px-4 text-center font-mono">{r.gsm} GSM &bull; {r.size} mm</td>
                    <td className="py-2.5 px-4 text-center font-bold">Grade {r.qcGrade}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">{r.weight.toLocaleString()} KG</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">{r.productionDate.substring(0, 10)}</td>
                  </tr>
                ))}
                <tr className="bg-[#FEE4CB] text-slate-950 font-black border-t-2 border-slate-300">
                  <td colSpan={4} className="py-2.5 px-4 uppercase tracking-wider font-black text-left">GRAND TOTAL</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black">{totalWeight.toLocaleString()} KG</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black">{filteredAvailReels.length} Reels</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-12 text-center text-[11px] text-slate-500 font-medium">
            Generated on {todayFormatted}
          </div>
        </div>
      );
    }

    if (selectedReport === 'sold_reels') {
      const totalWeight = filteredSoldReels.reduce((sum, r) => sum + r.weight, 0);
      return (
        <div className="bg-white text-black p-4 sm:p-10 font-sans print:p-0 print:m-0">
          <div className="border-b-[2.5px] border-[#0B132B] pb-2 mb-4">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-[#0B132B]">
              SAHEB PAPER PVT. LTD.
            </h1>
          </div>
          <div className="text-center my-4 space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-[#0B132B] uppercase tracking-[0.25em]">
              Dispatched Reels Statement
            </h2>
            <p className="text-xs font-medium text-slate-700">
              Total: {filteredSoldReels.length} reels &bull; {totalWeight.toLocaleString()} KG
            </p>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-[#0B132B] text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-4 text-left">REEL NO</th>
                  <th className="py-2.5 px-4 text-left">CUSTOMER / PARTY</th>
                  <th className="py-2.5 px-4 text-center">CHALLAN #</th>
                  <th className="py-2.5 px-4 text-center">VEHICLE NO</th>
                  <th className="py-2.5 px-4 text-right">WEIGHT</th>
                  <th className="py-2.5 px-4 text-right">DISPATCH DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-900">
                {filteredSoldReels.map((r, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-2.5 px-4 text-left font-mono font-bold">{r.reelNo}</td>
                    <td className="py-2.5 px-4 text-left font-semibold">{r.dispatchDetails?.partyName || 'Customer Party'}</td>
                    <td className="py-2.5 px-4 text-center font-mono">{r.dispatchDetails?.packingSlipNo || 'N/A'}</td>
                    <td className="py-2.5 px-4 text-center font-mono">{r.dispatchDetails?.vehicleNo || 'N/A'}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">{r.weight.toLocaleString()} KG</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">{r.dispatchDetails?.dispatchDate || r.productionDate.substring(0, 10)}</td>
                  </tr>
                ))}
                <tr className="bg-[#FEE4CB] text-slate-950 font-black border-t-2 border-slate-300">
                  <td colSpan={4} className="py-2.5 px-4 uppercase tracking-wider font-black text-left">GRAND TOTAL</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black">{totalWeight.toLocaleString()} KG</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black">{filteredSoldReels.length} Reels</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-12 text-center text-[11px] text-slate-500 font-medium">
            Generated on {todayFormatted}
          </div>
        </div>
      );
    }

    if (selectedReport === 'party_wise') {
      const totalChallans = filteredPartyWise.reduce((sum, p) => sum + p.challans, 0);
      const totalReels = filteredPartyWise.reduce((sum, p) => sum + p.reelsCount, 0);
      const totalWeight = filteredPartyWise.reduce((sum, p) => sum + p.totalWeight, 0);
      return (
        <div className="bg-white text-black p-4 sm:p-10 font-sans print:p-0 print:m-0">
          <div className="border-b-[2.5px] border-[#0B132B] pb-2 mb-4">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-[#0B132B]">
              SAHEB PAPER PVT. LTD.
            </h1>
          </div>
          <div className="text-center my-4 space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-[#0B132B] uppercase tracking-[0.25em]">
              Customer / Party Sales Statement
            </h2>
            <p className="text-xs font-medium text-slate-700">
              Total: {filteredPartyWise.length} parties &bull; {totalReels} reels &bull; {totalWeight.toLocaleString()} KG
            </p>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-[#0B132B] text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-4 text-left">CUSTOMER PARTY NAME</th>
                  <th className="py-2.5 px-4 text-center">ORDERS / CHALLANS</th>
                  <th className="py-2.5 px-4 text-center">REELS PURCHASED</th>
                  <th className="py-2.5 px-4 text-right">CUMULATIVE WEIGHT (KG)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-900">
                {filteredPartyWise.map((p, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-2.5 px-4 text-left font-bold text-slate-900">{p.partyName}</td>
                    <td className="py-2.5 px-4 text-center font-mono">{p.challans} challans</td>
                    <td className="py-2.5 px-4 text-center font-mono">{p.reelsCount} reels</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">{p.totalWeight.toLocaleString()} KG</td>
                  </tr>
                ))}
                <tr className="bg-[#FEE4CB] text-slate-950 font-black border-t-2 border-slate-300">
                  <td className="py-2.5 px-4 uppercase tracking-wider font-black text-left">GRAND TOTAL</td>
                  <td className="py-2.5 px-4 text-center font-mono font-black">{totalChallans} Challans</td>
                  <td className="py-2.5 px-4 text-center font-mono font-black">{totalReels} Reels</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black">{totalWeight.toLocaleString()} KG</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-12 text-center text-[11px] text-slate-500 font-medium">
            Generated on {todayFormatted}
          </div>
        </div>
      );
    }

    if (selectedReport === 'raw_material') {
      return (
        <div className="bg-white text-black p-4 sm:p-10 font-sans print:p-0 print:m-0">
          <div className="border-b-[2.5px] border-[#0B132B] pb-2 mb-4">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-[#0B132B]">
              SAHEB PAPER PVT. LTD.
            </h1>
          </div>
          <div className="text-center my-4 space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-[#0B132B] uppercase tracking-[0.25em]">
              Raw Material Movement Ledger
            </h2>
            <p className="text-xs font-medium text-slate-700">
              Total: {filteredRawMovement.length} transactions logged
            </p>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-[#0B132B] text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-4 text-left">TIMESTAMP</th>
                  <th className="py-2.5 px-4 text-left">MODULE</th>
                  <th className="py-2.5 px-4 text-left">ACTION</th>
                  <th className="py-2.5 px-4 text-left">OPERATIONAL DETAILS</th>
                  <th className="py-2.5 px-4 text-right">USER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-900">
                {filteredRawMovement.map((l, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-2.5 px-4 text-left font-mono text-slate-600">{l.timestamp}</td>
                    <td className="py-2.5 px-4 text-left font-bold">{l.module}</td>
                    <td className="py-2.5 px-4 text-left font-semibold">{l.action}</td>
                    <td className="py-2.5 px-4 text-left">{l.details}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{l.user}</td>
                  </tr>
                ))}
                <tr className="bg-[#FEE4CB] text-slate-950 font-black border-t-2 border-slate-300">
                  <td colSpan={4} className="py-2.5 px-4 uppercase tracking-wider font-black text-left">TOTAL LOGGED TRANSACTIONS</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black">{filteredRawMovement.length} Operations</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-12 text-center text-[11px] text-slate-500 font-medium">
            Generated on {todayFormatted}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* 1. On-Screen Interactive Dashboard (Hidden when browser print / PDF export is active) */}
      <div className="space-y-6 print:hidden">

      {/* 1. CLEAN MINIMAL HEADER CARD WITH EMBEDDED CALENDAR & TIMEFRAME */}
      <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
              <BarChart2 className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                  Mill Reports &amp; Analytics Dashboard
                </h1>
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold">
                  Business Intelligence
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Comprehensive date-filtered production throughput, dispatch yield ledgers, and compliance audit exports.
              </p>
            </div>
          </div>

          {/* Right Side Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isViewer}
              title={
                isViewer
                  ? 'Printing is locked for Viewer (Read-Only Mode)'
                  : isCurrentReportEmpty
                  ? '⚠️ Report Not Ready: 0 records found'
                  : 'Print PDF'
              }
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition ${
                isViewer
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                  : isCurrentReportEmpty
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer'
                  : 'bg-primary hover:bg-primary-dark text-white cursor-pointer'
              }`}
            >
              {isViewer ? (
                <Lock className="h-4 w-4 text-amber-500" />
              ) : isCurrentReportEmpty ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              <span>
                {isViewer
                  ? 'Print PDF (Locked)'
                  : isCurrentReportEmpty
                  ? 'Report Not Ready (0 Records)'
                  : 'Print PDF'}
              </span>
            </button>
          </div>
        </div>

        {/* Embedded Interactive Calendar & Timeframe Pill Control (Day, Week, Month, All + Date Stepper) */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Timeframe selector: Day, Week, Month, All */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            {(['day', 'week', 'month', 'all'] as const).map(tf => {
              const isActive = timeframe === tf;
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  {tf === 'day' ? 'Day' : tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'All'}
                </button>
              );
            })}
          </div>

          {/* Date Navigator & Interactive Calendar Picker */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevDate}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
              title="Previous Date/Period"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="relative" ref={millReportDatePickerRef}>
              <button
                type="button"
                onClick={() => setIsMillDatePickerOpen(prev => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl text-xs font-bold text-slate-800 dark:text-white shadow-2xs transition cursor-pointer"
                title="Click to open calendar date picker"
              >
                <Calendar className="h-3.5 w-3.5 text-primary dark:text-blue-400" />
                <span className="font-mono font-black">
                  {timeframe === 'all'
                    ? 'All Time Records'
                    : timeframe === 'month'
                    ? `Month: ${selectedDate.substring(0, 7)}`
                    : timeframe === 'week'
                    ? `Week Ending: ${selectedDate}`
                    : selectedDate}
                </span>
              </button>

              {isMillDatePickerOpen && (
                <CustomDatePickerModal
                  selectedDate={selectedDate}
                  onSelectDate={(newDate) => {
                    setSelectedDate(newDate);
                    setIsMillDatePickerOpen(false);
                  }}
                  onClose={() => setIsMillDatePickerOpen(false)}
                  align="right"
                  triggerRef={millReportDatePickerRef}
                />
              )}
            </div>

            <button
              type="button"
              onClick={handleNextDate}
              disabled={selectedDate >= systemToday}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next Date/Period"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Executive KPI Scorecards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Production Tonnage */}
        <div className="neumorphic-card rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Factory className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Production Tonnage
            </span>
            <span className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold">
              Output
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalProductionWeightKg.toLocaleString()} <span className="text-xs font-bold text-slate-500 font-sans">kg</span>
            </div>
            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3.5 w-3.5" /> Optimal
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
            Filtered production output for selected window
          </p>
        </div>

        {/* Card 2: Dispatch Tonnage */}
        <div className="neumorphic-card rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Dispatched Tonnage
            </span>
            <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              Sales
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalDispatchWeightKg.toLocaleString()} <span className="text-xs font-bold text-slate-500 font-sans">kg</span>
            </div>
            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              {dispatchYieldPercent}% yield
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
            Dispatched orders fulfilling customer demands
          </p>
        </div>

        {/* Card 3: Active Stock Inventory */}
        <div className="neumorphic-card rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Available Stock
            </span>
            <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              Inventory
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalStockWeightKg.toLocaleString()} <span className="text-xs font-bold text-slate-500 font-sans">kg</span>
            </div>
            <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {availReelsData.length} reels
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
            Finished stock ready for immediate dispatch
          </p>
        </div>

        {/* Card 4: Quality & Compliance */}
        <div className="neumorphic-card rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Quality Grade A
            </span>
            <span className="p-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-xs font-bold">
              Compliance
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {gradeDistributionData[0].value} <span className="text-xs font-bold text-slate-500 font-sans">reels</span>
            </div>
            <div className="text-xs font-black text-purple-600 dark:text-purple-400">
              Grade A Certified
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
            High tensile strength & GSM compliance rate
          </p>
        </div>
      </div>

      {/* 4. Interactive Visual Telemetry Charts (Dual Area & Donut Grid) */}
      {/* 4. Interactive Visual Telemetry Charts (Full-Width Main Chart with Pie Chart Below) */}
      <div className="space-y-6">

        {/* Chart 1: Production vs Dispatch Tonnage Composed Chart (FULL WIDTH) */}
        <div className="w-full neumorphic-card rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Production Output vs. Dispatch Volume Telemetry
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {timeframe === 'day' ? 'Full Shift Timeline Breakdown with Machine Stoppage Tracking' : 'Daily Tonnage Comparison (kg)'}
              </p>
            </div>


          </div>

          <div className="h-72 w-full pt-2 focus:outline-none focus-visible:outline-none select-none" tabIndex={-1}>
            <ResponsiveContainer width="100%" height="100%" className="focus:outline-none focus-visible:outline-none">
              <ComposedChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDisp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientDowntime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#991B1B" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748B' }} interval={timeframe === 'day' ? 1 : 0} stroke="none" />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748B' }} stroke="none" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 120]} hide={true} />
                <Tooltip
                  offset={15}
                  isAnimationActive={true}
                  animationDuration={180}
                  animationEasing="cubic-bezier(0.16, 1, 0.3, 1)"
                  cursor={{ stroke: '#3B82F6', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const hasDowntime = payload[0]?.payload?.downtimeMin > 0;
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-xs space-y-2 pointer-events-none transition-all duration-180 ease-out select-none min-w-[220px] transform-gpu animate-in fade-in-50 zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5 font-mono font-black text-slate-200">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                            Timeline: {label}
                          </span>
                        </div>
                        <div className="space-y-1.5 pt-0.5">
                          {payload.map((entry: any, index: number) => {
                            if (entry.dataKey === 'downtimeMin' && entry.value === 0) return null;
                            return (
                              <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: entry.color }} />
                                  <span className="font-bold text-slate-300">{entry.name}:</span>
                                </div>
                                <span className="font-mono font-black text-white">
                                  {entry.value ? entry.value.toLocaleString() : 0} {entry.dataKey === 'downtimeMin' ? 'mins' : 'kg'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {hasDowntime && (
                          <div className="pt-2 border-t border-red-500/30 text-[11px] font-bold text-red-400 flex flex-col gap-1 bg-red-500/10 p-2 rounded-xl border">
                            <div className="flex items-center gap-1.5 text-red-300">
                              <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                              <span className="uppercase tracking-wider font-black text-[10px]">Machine Stoppage Event</span>
                            </div>
                            <div className="flex items-center justify-between font-mono text-white">
                              <span>Reason:</span>
                              <span className="text-red-300 font-bold">{payload[0].payload.downtimeReason}</span>
                            </div>
                            <div className="flex items-center justify-between font-mono text-white">
                              <span>Duration:</span>
                              <span className="text-red-400 font-black">{payload[0].payload.downtimeMin} mins lost</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Area
                  yAxisId="left"
                  connectNulls={false}
                  type="monotone"
                  dataKey="prodWeight"
                  name="Production Output (kg)"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorProd)"
                  dot={(props: any) => {
                    const { cx, cy, payload, index } = props;
                    if (!cx || !cy) return null;
                    if (payload && payload.downtimeMin > 0) {
                      return (
                        <g key={`downtime-dot-${index}`}>
                          <circle cx={cx} cy={cy} r={10} fill="#EF4444" fillOpacity={0.35} />
                          <circle cx={cx} cy={cy} r={6} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2.5} />
                        </g>
                      );
                    }
                    return <circle key={`prod-dot-${index}`} cx={cx} cy={cy} r={3} fill="#2563EB" stroke="#2563EB" strokeWidth={1.5} />;
                  }}
                  activeDot={{ r: 6 }}
                />
                <Area yAxisId="left" connectNulls={false} type="monotone" dataKey="dispWeight" name="Dispatched Volume (kg)" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDisp)" dot={{ r: 3, strokeWidth: 1.5 }} activeDot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Sleek Machine Stoppage & Maintenance Log Card Below Chart */}
          {timeframe === 'day' && trendChartData.some(d => d.downtimeMin > 0) && (() => {
            const downtimeItem = trendChartData.find(d => d.downtimeMin > 0);
            const dtMins = downtimeItem?.downtimeMin || 0;
            const dtReason = downtimeItem?.downtimeReason || 'Machine Maintenance';
            const dtTime = downtimeItem?.date || selectedDate;
            const estimatedImpactKg = Math.round((dtMins / 60) * 850);
            return (
              <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/15 text-red-500 shrink-0">
                    <AlertCircle className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Machine Stoppage Event Logged
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black tracking-wide">
                        {dtMins} MINS DOWNTIME
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                      Stoppage Reason: <span className="font-bold text-red-500 dark:text-red-400">{dtReason}</span> at {dtTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-black text-red-600 dark:text-red-400 bg-white dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-red-500/20 shadow-xs shrink-0">
                  <span>Output Impact: -{estimatedImpactKg} kg</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Chart 2: Inventory & Grade Distribution Donut Chart (REDESIGNED ULTRA-PREMIUM) */}
        <div className="neumorphic-card rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Stock Allocation & Quality Grade Breakdown
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Real-time paper reel inventory distribution across quality grades & dispatch status
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              Live Stock Sync
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Donut Ring Column with Center Stat Badge */}
            <div className="lg:col-span-5 relative h-64 w-full flex items-center justify-center focus:outline-none focus-visible:outline-none select-none" tabIndex={-1}>
              <ResponsiveContainer width="100%" height="100%" className="focus:outline-none focus-visible:outline-none">
                <PieChart>
                  <Pie
                    data={gradeDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {gradeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="focus:outline-none focus-visible:outline-none cursor-pointer transition-all duration-200 hover:opacity-85" />
                    ))}
                  </Pie>
                  <Tooltip
                    offset={15}
                    isAnimationActive={true}
                    animationDuration={180}
                    animationEasing="cubic-bezier(0.16, 1, 0.3, 1)"
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const entry = payload[0];
                      const total = gradeDistributionData.reduce((acc, curr) => acc + curr.value, 0);
                      const pct = total > 0 ? ((Number(entry.value) / total) * 100).toFixed(1) : '0';
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl text-xs space-y-1.5 pointer-events-none transition-all duration-180 ease-out select-none min-w-[170px] transform-gpu">
                          <div className="flex items-center gap-2 border-b border-slate-700/60 pb-1 font-bold text-slate-200">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.payload.color }} />
                            <span>{entry.name}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 font-mono">
                            <span className="text-slate-400 font-medium">Reels Count:</span>
                            <span className="font-black text-white">{Number(entry.value).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 font-mono">
                            <span className="text-slate-400 font-medium">Stock Share:</span>
                            <span className="font-black text-emerald-400">{pct}%</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Hole Overlay Badge */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-2xl font-mono font-black text-slate-900 dark:text-white tracking-tight">
                  {gradeDistributionData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Total Reels
                </span>
              </div>
            </div>

            {/* Detailed Grade Breakdown Cards Column */}
            <div className="lg:col-span-7 space-y-3">
              {gradeDistributionData.map((item, idx) => {
                const total = gradeDistributionData.reduce((acc, curr) => acc + curr.value, 0);
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div key={`grade-item-${idx}`} className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono font-black">
                        <span className="text-slate-900 dark:text-white">{item.value.toLocaleString()} Reels</span>
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">({pct.toFixed(1)}%)</span>
                      </div>
                    </div>
                    {/* Visual Percentage Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* 5. Main Report Tabs Switcher */}
      <div className="neumorphic-card rounded-3xl p-6 shadow-sm space-y-5">

        {/* Horizontal Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100 dark:border-slate-800">
          {reportsList.map(rep => {
            const Icon = rep.icon;
            const isSelected = selectedReport === rep.id;
            return (
              <button
                key={rep.id}
                type="button"
                onClick={() => setSelectedReport(rep.id as ReportType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer shrink-0 border ${isSelected
                    ? 'bg-primary text-white shadow-xs border-transparent'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800'
                  }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : rep.color}`} />
                <span>{rep.name}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Dynamic Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Left: Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={reportsSearchQuery}
              onChange={e => setReportsSearchQuery(e.target.value)}
              placeholder={`Search in ${reportsList.find(r => r.id === selectedReport)?.name || 'report'}...`}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
            />
            {reportsSearchQuery && (
              <button
                type="button"
                onClick={() => setReportsSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right: DataFilterBar & Reset Button & Count Badge */}
          <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
            <DataFilterBar
              dateFrom={reportDateFrom}
              dateTo={reportDateTo}
              onDateFromChange={setReportDateFrom}
              onDateToChange={setReportDateTo}
              filterFields={activeFilterFields}
              activeFilters={{
                product: reportProductFilter,
                grade: reportGradeFilter,
                gsm: reportGsmFilter,
                party: reportPartyFilter,
                vehicle: reportVehicleFilter,
                module: reportModuleFilter,
              }}
              onFilterChange={(fieldId, value) => {
                if (fieldId === 'product') setReportProductFilter(value);
                if (fieldId === 'grade') setReportGradeFilter(value);
                if (fieldId === 'gsm') setReportGsmFilter(value);
                if (fieldId === 'party') setReportPartyFilter(value);
                if (fieldId === 'vehicle') setReportVehicleFilter(value);
                if (fieldId === 'module') setReportModuleFilter(value);
              }}
              onClearAll={clearAllReportFilters}
            />

            {(reportDateFrom || reportDateTo || reportProductFilter !== 'all' || reportGradeFilter !== 'all' || reportGsmFilter !== 'all' || reportPartyFilter !== 'all' || reportVehicleFilter !== 'all' || reportModuleFilter !== 'all' || reportsSearchQuery) && (
              <button
                type="button"
                onClick={clearAllReportFilters}
                className="px-3 py-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-2xl text-xs font-black uppercase tracking-wider transition hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}

            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black font-mono border border-slate-200 dark:border-slate-700 shrink-0">
              {(() => {
                let count = 0;
                if (selectedReport === 'daily_prod') count = filteredDailyProd.length;
                else if (selectedReport === 'daily_disp') count = filteredDailyDisp.length;
                else if (selectedReport === 'stock_grouped') count = filteredGroupedStock.length;
                else if (selectedReport === 'avail_reels') count = filteredAvailReels.length;
                else if (selectedReport === 'sold_reels') count = filteredSoldReels.length;
                else if (selectedReport === 'party_wise') count = filteredPartyWise.length;
                else if (selectedReport === 'raw_material') count = filteredRawMovement.length;
                return `${count} ${count === 1 ? 'Record' : 'Records'}`;
              })()}
            </div>
          </div>
        </div>

        {/* 6. Active Report Data Tables */}
        <div className="overflow-x-auto">

          {/* 1. Daily Production Report Table */}
          {selectedReport === 'daily_prod' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Jumbo Rolls Produced</th>
                  <th className="py-3 px-4 text-center">Finished Reels Slit</th>
                  <th className="py-3 px-4 text-right">Total Net Weight (kg)</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
                {filteredDailyProd.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      No production records found for this date range.
                    </td>
                  </tr>
                ) : (
                  filteredDailyProd.map(row => (
                    <tr key={row.date} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition">
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white">
                        {row.date.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 font-mono font-black">
                          {row.rollCount} rolls
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">{row.reelCount} reels</td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                        {row.totalWeight.toLocaleString()} kg
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Complete
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 2. Daily Dispatch Report Table */}
          {selectedReport === 'daily_disp' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Dispatch Date</th>
                  <th className="py-3 px-4 text-center">Packing Slips Issued</th>
                  <th className="py-3 px-4 text-center">Reels Dispatched</th>
                  <th className="py-3 px-4 text-right">Total Weight Dispatched (kg)</th>
                  <th className="py-3 px-4 text-right">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
                {filteredDailyDisp.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      No dispatch records found for this date range.
                    </td>
                  </tr>
                ) : (
                  filteredDailyDisp.map(row => (
                    <tr key={row.date} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition">
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white">
                        {row.date.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">{row.slipCount} slips</td>
                      <td className="py-3.5 px-4 text-center font-mono">{row.reelsDispatched} reels</td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {row.totalWeight.toLocaleString()} kg
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Verified & Gate Out
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 3. Stock Statement (Grouped) Report Table */}
          {selectedReport === 'stock_grouped' && (
            <div className="space-y-4">
              {/* Header bar with summary metric and print PDF button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Current Stock Statement (Grouped)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    Total: <span className="font-mono font-bold text-primary dark:text-blue-400">{totalGroupedReelsCount} reels</span> &bull; <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{totalGroupedWeightKg.toLocaleString()} KG</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (totalGroupedReelsCount === 0) {
                      setPrintWarningToast('⚠️ Report Not Ready: Current stock statement has 0 reels in stock.');
                      setTimeout(() => setPrintWarningToast(null), 4500);
                      return;
                    }
                    setShowStockStatementModal(true);
                  }}
                  title={totalGroupedReelsCount === 0 ? "Report Not Ready: 0 reels in stock" : "Print Stock Statement (PDF)"}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition self-start sm:self-auto cursor-pointer ${
                    totalGroupedReelsCount === 0
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                      : 'bg-primary hover:bg-primary-dark text-white'
                  }`}
                >
                  {totalGroupedReelsCount === 0 ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  <span>
                    {totalGroupedReelsCount === 0
                      ? 'Report Not Ready (0 Reels)'
                      : 'Print Stock Statement (PDF)'}
                  </span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse font-sans">
                  <thead className="bg-[#0B132B] text-white uppercase text-[10px] font-black tracking-wider">
                    <tr>
                      <th className="py-3 px-4">PRODUCT</th>
                      <th className="py-3 px-4 text-center">GSM</th>
                      <th className="py-3 px-4 text-center">SIZE</th>
                      <th className="py-3 px-4 text-center">PLY</th>
                      <th className="py-3 px-4 text-center">REELS</th>
                      <th className="py-3 px-4 text-right">WEIGHT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
                    {filteredGroupedStock.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          No finished stock found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {filteredGroupedStock.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition">
                            <td className="py-3.5 px-4 text-slate-900 dark:text-white font-black">{row.product}</td>
                            <td className="py-3.5 px-4 text-center font-mono">{row.gsm}</td>
                            <td className="py-3.5 px-4 text-center font-mono">{row.size} CM</td>
                            <td className="py-3.5 px-4 text-center font-mono">{row.ply} Ply</td>
                            <td className="py-3.5 px-4 text-center font-mono font-black text-primary dark:text-blue-400">
                              {row.reelsCount}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                              {row.totalWeight.toLocaleString()} KG
                            </td>
                          </tr>
                        ))}
                        {/* GRAND TOTAL ROW */}
                        <tr className="bg-[#FEE4CB] dark:bg-amber-950/40 text-slate-950 dark:text-amber-200 font-black border-t-2 border-slate-300 dark:border-slate-700">
                          <td colSpan={4} className="py-3.5 px-4 uppercase tracking-wider font-black text-xs">
                            GRAND TOTAL
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-black text-sm">
                            {totalGroupedReelsCount} Reels
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-sm">
                            {totalGroupedWeightKg.toLocaleString()} KG
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Available Reel Inventory Table */}
          {selectedReport === 'avail_reels' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Reel Number</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 text-center">GSM / Size (mm)</th>
                  <th className="py-3 px-4 text-right">Net Weight (kg)</th>
                  <th className="py-3 px-4 text-center">QC Grade</th>
                  <th className="py-3 px-4 text-right">Production Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
                {filteredAvailReels.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      No reels currently in available stock.
                    </td>
                  </tr>
                ) : (
                  filteredAvailReels.map(r => (
                    <tr key={r.reelNo} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition">
                      <td className="py-3.5 px-4 font-mono font-black text-primary dark:text-blue-400">
                        {r.reelNo}
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 dark:text-white">{r.product}</td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {r.gsm} GSM &bull; {r.size} mm
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                        {r.weight.toLocaleString()} kg
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${r.qcGrade === 'A'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}>
                          Grade {r.qcGrade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        {r.productionDate.substring(0, 10)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 4. Dispatched Reels Table */}
          {selectedReport === 'sold_reels' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Reel Number</th>
                  <th className="py-3 px-4">Party / Customer Name</th>
                  <th className="py-3 px-4 text-center">Challan / Slip #</th>
                  <th className="py-3 px-4 text-center">Vehicle Number</th>
                  <th className="py-3 px-4 text-right">Net Weight (kg)</th>
                  <th className="py-3 px-4 text-right">Dispatch Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
                {filteredSoldReels.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      No dispatched reel records found.
                    </td>
                  </tr>
                ) : (
                  filteredSoldReels.map(r => (
                    <tr key={r.reelNo} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition">
                      <td className="py-3.5 px-4 font-mono font-black text-purple-600 dark:text-purple-400">
                        {r.reelNo}
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 dark:text-white font-black">
                        {r.dispatchDetails?.partyName || 'Customer Party'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                        {r.dispatchDetails?.packingSlipNo || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {r.dispatchDetails?.vehicleNo || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                        {r.weight.toLocaleString()} kg
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        {r.dispatchDetails?.dispatchDate || r.productionDate.substring(0, 10)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 6. Party / Customer Sales Table */}
          {selectedReport === 'party_wise' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer Party Name</th>
                  <th className="py-3 px-4 text-center">Total Orders / Slips</th>
                  <th className="py-3 px-4 text-center">Reels Purchased</th>
                  <th className="py-3 px-4 text-right">Cumulative Weight Sold (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
                {filteredPartyWise.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      No customer sales records found.
                    </td>
                  </tr>
                ) : (
                  filteredPartyWise.map(p => (
                    <tr key={p.partyName} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition">
                      <td className="py-3.5 px-4 text-slate-900 dark:text-white font-black">{p.partyName}</td>
                      <td className="py-3.5 px-4 text-center font-mono">{p.challans} challans</td>
                      <td className="py-3.5 px-4 text-center font-mono">{p.reelsCount} reels</td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {p.totalWeight.toLocaleString()} kg
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 7. Raw Material Movement Table */}
          {selectedReport === 'raw_material' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Operational Details</th>
                  <th className="py-3 px-4 text-right">Operator / User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
                {filteredRawMovement.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      No raw material movement logs recorded.
                    </td>
                  </tr>
                ) : (
                  filteredRawMovement.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400">{l.timestamp}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-black">
                          {l.module}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 dark:text-white font-black">{l.action}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">{l.details}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-primary dark:text-blue-400 font-bold">{l.user}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

        </div>
      </div>

      {/* End of on-screen interactive dashboard container */}
      </div>

      {/* 2. Official PDF Print Output (Rendered exclusively when printing outside the modal) */}
      <div id="printable-mill-report" className="hidden print:block w-full bg-white text-black p-0 m-0 font-sans">
        {renderPrintableReportContent()}
      </div>

      {/* 3. Official PDF Print Preview Modal */}
      {showStockStatementModal &&
        createPortal(
          <div
            id="printable-stock-statement-modal"
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto print:static print:block print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:z-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowStockStatementModal(false);
            }}
          >
            <div
              className="bg-white text-slate-950 rounded-2xl sm:rounded-3xl max-w-4xl w-full p-4 sm:p-8 space-y-4 shadow-2xl my-auto relative print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 print:rounded-none print:space-y-0 print:block print:overflow-visible"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Action Toolbar (Screen View Only) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 print:hidden">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      {reportsList.find(r => r.id === selectedReport)?.name || 'Mill Report Statement'} &bull; Print Preview
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      Official A4 PDF Format &bull; Ready to Print / Download
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isCurrentReportEmpty}
                    onClick={() => {
                      if (isCurrentReportEmpty) return;
                      window.print();
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer ${
                      isCurrentReportEmpty
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-[#0B132B] hover:bg-slate-800 text-white'
                    }`}
                  >
                    <Printer className="h-4 w-4" />
                    <span>{isCurrentReportEmpty ? 'Print Disabled (0 Records)' : 'Print / Save PDF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStockStatementModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Warning banner inside modal if 0 records */}
              {isCurrentReportEmpty && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs font-bold print:hidden">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-black uppercase tracking-wider">Report Not Ready for Printing</p>
                    <p className="text-[11px] font-medium text-amber-700 mt-0.5">
                      No matching records or finished stock found for the selected timeframe. Please adjust your calendar date range or filter criteria to print.
                    </p>
                  </div>
                </div>
              )}

              {/* Render Document Content */}
              {renderPrintableReportContent()}
            </div>
          </div>,
          document.body
        )}

      {/* Floating Warning Toast Notification */}
      {printWarningToast && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-md bg-amber-500 text-white px-4 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <AlertTriangle className="h-5 w-5 text-amber-100 shrink-0" />
          <span className="leading-snug">{printWarningToast}</span>
          <button
            type="button"
            onClick={() => setPrintWarningToast(null)}
            className="p-1 hover:bg-amber-600 rounded-lg transition cursor-pointer shrink-0 ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
};
