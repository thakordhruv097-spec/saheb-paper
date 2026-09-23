import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getLabReports, saveLabReport, deleteLabReport, getRolls } from '../../data/index';
import type { PaperTestReport } from '../../data/types';
import { printPaperTestReport, downloadLabReportHtml } from '../../utils/labPdfGenerator';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { DataFilterBar } from '../../components/DataFilterBar';
import { COMPANY_CONFIG } from '../../config/company';
import {
  Beaker,
  Plus,
  Pencil,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Activity,
  Sliders,
  Scale,
  X,
  Lock,
  Loader2,
} from 'lucide-react';
import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';
import { MobileToast, type ToastMessage } from '../../components/MobileToast';

export const LabView: React.FC = () => {
  const { user, isViewer } = useAuth();
  const { t } = useTranslation();
  const { timeframe, selectedDate } = useDateFilter();

  const [reports, setReports] = useState<PaperTestReport[]>(() => getLabReports());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [selectedReportForView, setSelectedReportForView] = useState<PaperTestReport | null>(null);

  useBodyScrollLock(isModalOpen || !!selectedReportForView);

  const [isDownloading, setIsDownloading] = useState(false);

  // Real-time listener: instant UI update whenever Supabase syncs new lab reports
  useEffect(() => {
    const handleDataUpdate = (e?: any) => {
      const tables: string[] = e?.detail?.tables || (e?.detail?.table ? [e.detail.table] : []);
      const isAll = tables.length === 0 || tables.includes('all');
      if (isAll || tables.some(t => t.includes('lab') || t.includes('report') || t.includes('test'))) {
        setReports(getLabReports());
      }
    };

    const handleViewReportEvent = (e: any) => {
      if (e?.detail) {
        setSelectedReportForView(e.detail);
      }
    };

    window.addEventListener('saheb_data_updated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);
    window.addEventListener('saheb_view_lab_report', handleViewReportEvent);
    return () => {
      window.removeEventListener('saheb_data_updated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
      window.removeEventListener('saheb_view_lab_report', handleViewReportEvent);
    };
  }, []);

  const handlePrintCertificate = () => {
    if (isViewer) return;
    document.body.classList.add('printing-lab-report');
    const cleanup = () => {
      document.body.classList.remove('printing-lab-report');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 2000);
    }, 120);
  };

  const handleDownloadCertificateHtml = async (report: PaperTestReport) => {
    try {
      setIsDownloading(true);
      await downloadLabReportHtml(report);
      setToast({
        type: 'success',
        title: 'HTML Downloaded',
        message: `COA Certificate for Roll #${report.rollNo} saved.`,
        duration: 3000,
      });
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Download Failed',
        message: err?.message || 'Could not download certificate HTML.',
        duration: 4000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Filter states for lab reports history
  const [labDateFrom, setLabDateFrom] = useState('');
  const [labDateTo, setLabDateTo] = useState('');
  const [labShiftFilter, setLabShiftFilter] = useState('all');

  // Mobile Toast & Submitting State
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightedReportId, setHighlightedReportId] = useState<string | null>(null);

  // Success / Error Feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State initialized matching Sahab Paper Limited Paper Test Report
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [openDatePicker, setOpenDatePicker] = useState(false);

  const [product, setProduct] = useState('NAPKIN');
  const [rollNo, setRollNo] = useState('11');
  const [shift, setShift] = useState<'A' | 'B'>('A');
  const [time, setTime] = useState('07:50');
  const [targetGsm, setTargetGsm] = useState<number>(16);
  const [weight, setWeight] = useState<number>(500);
  const [speed, setSpeed] = useState<number>(130);
  const [crepingPct, setCrepingPct] = useState<number>(18.00);

  // 14 GSM sample readings across roll width
  const [gsmSamples, setGsmSamples] = useState<number[]>([
    16.1, 16.6, 16.5, 16.7, 16.9, 17.1, 16.5, 16.6, 16.4, 16.4, 16.6, 16.3, 16.1, 16.1
  ]);

  const [breakageCount, setBreakageCount] = useState<number>(0);

  // 13 Lab Test Parameters
  const [labResultGsm, setLabResultGsm] = useState<number>(16.5);
  const [moisturePct, setMoisturePct] = useState<number>(5.60);
  const [caliperMm, setCaliperMm] = useState<number>(80);
  const [bulkCcGm, setBulkCcGm] = useState<number>(4.85);
  const [breakingLengthMd, setBreakingLengthMd] = useState<number>(1.867);
  const [breakingLengthCd, setBreakingLengthCd] = useState<number>(0.701);
  const [brightnessPct, setBrightnessPct] = useState<number>(81.4);
  const [tearMd, setTearMd] = useState<number>(8.00);
  const [tearCd, setTearCd] = useState<number>(1.80);
  const [tensileDryMd, setTensileDryMd] = useState<number>(302.20);
  const [tensileDryCd, setTensileDryCd] = useState<number>(113.47);
  const [stretchDryMd, setStretchDryMd] = useState<number>(2.70);
  const [stretchDryCd, setStretchDryCd] = useState<number>(1.60);

  const [qcStatus, setQcStatus] = useState<'GRADE_A' | 'GRADE_B' | 'REJECTED'>('GRADE_A');
  const [remarks, setRemarks] = useState('Sample meets all physical strength, moisture & GSM quality benchmarks.');

  // Real-time calculation of 14 GSM Sample Stats
  const gsmStats = useMemo(() => {
    const validNums = gsmSamples.map(v => Number(v) || 0).filter(v => v > 0);
    if (validNums.length === 0) return { avg: 0, max: 0, min: 0, range: 0 };

    const sum = validNums.reduce((acc, v) => acc + v, 0);
    const avg = parseFloat((sum / validNums.length).toFixed(1));
    const max = parseFloat(Math.max(...validNums).toFixed(1));
    const min = parseFloat(Math.min(...validNums).toFixed(1));
    const range = parseFloat((max - min).toFixed(2));

    return { avg, max, min, range };
  }, [gsmSamples]);

  // Auto-calculate Bulk (Formula: Caliper ÷ GSM) and Tensile Dry MD / CD (Formula: (BLm × GSM × 9.81) ÷ 1000)
  useEffect(() => {
    const effectiveGsm = labResultGsm > 0 ? labResultGsm : (targetGsm > 0 ? targetGsm : (gsmStats.avg > 0 ? gsmStats.avg : 0));
    
    if (caliperMm > 0 && effectiveGsm > 0) {
      const calculatedBulk = parseFloat((caliperMm / effectiveGsm).toFixed(2));
      setBulkCcGm(calculatedBulk);
    }

    if (breakingLengthMd > 0 && effectiveGsm > 0) {
      const blMeters = breakingLengthMd < 50 ? breakingLengthMd * 1000 : breakingLengthMd;
      const calculatedTensileMd = parseFloat(((blMeters * effectiveGsm * 9.81) / 1000).toFixed(2));
      setTensileDryMd(calculatedTensileMd);
    }

    if (breakingLengthCd > 0 && effectiveGsm > 0) {
      const blMeters = breakingLengthCd < 50 ? breakingLengthCd * 1000 : breakingLengthCd;
      const calculatedTensileCd = parseFloat(((blMeters * effectiveGsm * 9.81) / 1000).toFixed(2));
      setTensileDryCd(calculatedTensileCd);
    }
  }, [caliperMm, breakingLengthMd, breakingLengthCd, labResultGsm, targetGsm, gsmStats.avg]);

  const handleGsmSampleChange = (index: number, val: string) => {
    const num = parseFloat(val) || 0;
    setGsmSamples(prev => {
      const updated = [...prev];
      updated[index] = num;
      return updated;
    });
  };

  const handleFillRollPreset = (presetRoll: string) => {
    if (presetRoll === 'R-20260822-0001') {
      setProduct('NAPKIN TISSUE');
      setRollNo('R-20260822-0001');
      setShift('A');
      setDateStr('2026-08-22');
      setTime('08:15');
      setTargetGsm(18);
      setWeight(4850);
      setSpeed(135);
      setCrepingPct(18.50);
      setGsmSamples([17.9, 18.1, 18.0, 18.2, 17.8, 18.1, 18.0, 18.3, 17.9, 18.0, 18.1, 18.0, 17.9, 18.1]);
      setLabResultGsm(18.0);
      setMoisturePct(5.50);
      setCaliperMm(85);
      setBulkCcGm(4.90);
      setBreakingLengthMd(1.910);
      setBreakingLengthCd(0.725);
      setBrightnessPct(85.5);
      setTearMd(8.50);
      setTearCd(1.95);
      setTensileDryMd(310.00);
      setTensileDryCd(118.50);
      setStretchDryMd(2.80);
      setStretchDryCd(1.70);
      setQcStatus('GRADE_A');
      setRemarks('Sample tested on 2026-08-22. Exceeds tensile strength, moisture balance, brightness (85.5%) & 18 GSM quality standards with Grade-A clearance.');
    } else if (presetRoll === 'R-20260812-0001') {
      setProduct('NAPKIN TISSUE');
      setRollNo('R-20260812-0001');
      setShift('A');
      setDateStr('2026-08-12');
      setTime('07:30');
      setTargetGsm(16);
      setWeight(4500);
      setSpeed(135);
      setCrepingPct(18.00);
      setGsmSamples([15.9, 16.1, 16.0, 16.2, 15.8, 16.1, 16.0, 16.3, 15.9, 16.0, 16.1, 16.0, 15.9, 16.1]);
      setLabResultGsm(16.0);
      setMoisturePct(5.40);
      setCaliperMm(82);
      setBulkCcGm(4.85);
      setBreakingLengthMd(1.880);
      setBreakingLengthCd(0.710);
      setBrightnessPct(82.5);
      setTearMd(8.20);
      setTearCd(1.85);
      setTensileDryMd(305.50);
      setTensileDryCd(115.20);
      setStretchDryMd(2.75);
      setStretchDryCd(1.65);
      setQcStatus('GRADE_A');
      setRemarks('Sample passed all physical strength, moisture & 16 GSM quality benchmarks with Grade-A clearance.');
    } else if (presetRoll === '11') {
      setProduct('NAPKIN');
      setRollNo('11');
      setShift('A');
      setDateStr('2026-08-03');
      setTime('07:50');
      setTargetGsm(16);
      setWeight(500);
      setSpeed(130);
      setCrepingPct(18.00);
      setGsmSamples([16.1, 16.6, 16.5, 16.7, 16.9, 17.1, 16.5, 16.6, 16.4, 16.4, 16.6, 16.3, 16.1, 16.1]);
      setLabResultGsm(16.5);
      setMoisturePct(5.60);
      setCaliperMm(80);
      setBulkCcGm(4.85);
      setBreakingLengthMd(1.867);
      setBreakingLengthCd(0.701);
      setBrightnessPct(81.4);
      setTearMd(8.00);
      setTearCd(1.80);
      setTensileDryMd(302.20);
      setTensileDryCd(113.47);
      setStretchDryMd(2.70);
      setStretchDryCd(1.60);
      setQcStatus('GRADE_A');
      setRemarks('Sample meets all physical strength, moisture & GSM quality benchmarks.');
    }
  };

  const handleOpenNewModal = () => {
    setEditingReportId(null);
    setSuccessMsg('');
    setErrorMsg('');
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDateStr(`${yyyy}-${mm}-${dd}`);
    setProduct('NAPKIN');
    setRollNo('11');
    setShift('A');
    setTime('07:50');
    setTargetGsm(16);
    setWeight(500);
    setSpeed(130);
    setCrepingPct(18.00);
    setGsmSamples([16.1, 16.6, 16.5, 16.7, 16.9, 17.1, 16.5, 16.6, 16.4, 16.4, 16.6, 16.3, 16.1, 16.1]);
    setBreakageCount(0);
    setLabResultGsm(16.5);
    setMoisturePct(5.60);
    setCaliperMm(80);
    setBulkCcGm(4.85);
    setBreakingLengthMd(1.867);
    setBreakingLengthCd(0.701);
    setBrightnessPct(81.4);
    setTearMd(8.00);
    setTearCd(1.80);
    setTensileDryMd(302.20);
    setTensileDryCd(113.47);
    setStretchDryMd(2.70);
    setStretchDryCd(1.60);
    setQcStatus('GRADE_A');
    setRemarks('Sample meets all physical strength, moisture & GSM quality benchmarks.');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (report: PaperTestReport) => {
    setEditingReportId(report.id);
    setSuccessMsg('');
    setErrorMsg('');
    setDateStr(report.date || '');
    setProduct(report.product || 'NAPKIN');
    setRollNo(report.rollNo || '');
    setShift(report.shift || 'A');
    setTime(report.time || '07:50');
    setTargetGsm(report.targetGsm || 16);
    setWeight(report.weight || 0);
    setSpeed(report.speed || 0);
    setCrepingPct(report.crepingPct ?? 18.00);
    setGsmSamples(
      report.gsmSamples && report.gsmSamples.length === 14
        ? [...report.gsmSamples]
        : [16.1, 16.6, 16.5, 16.7, 16.9, 17.1, 16.5, 16.6, 16.4, 16.4, 16.6, 16.3, 16.1, 16.1]
    );
    setBreakageCount(report.breakageCount ?? 0);
    setLabResultGsm(report.labResultGsm ?? 16.5);
    setMoisturePct(report.moisturePct ?? 5.60);
    setCaliperMm(report.caliperMm ?? 80);
    setBulkCcGm(report.bulkCcGm ?? 4.85);
    setBreakingLengthMd(report.breakingLengthMd ?? 1.867);
    setBreakingLengthCd(report.breakingLengthCd ?? 0.701);
    setBrightnessPct(report.brightnessPct ?? 81.4);
    setTearMd(report.tearMd ?? 8.00);
    setTearCd(report.tearCd ?? 1.80);
    setTensileDryMd(report.tensileDryMd ?? 302.20);
    setTensileDryCd(report.tensileDryCd ?? 113.47);
    setStretchDryMd(report.stretchDryMd ?? 2.70);
    setStretchDryCd(report.stretchDryCd ?? 1.60);
    setQcStatus(report.qcStatus || 'GRADE_A');
    setRemarks(report.remarks || '');
    setIsModalOpen(true);
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isViewer) {
      setToast({
        type: 'error',
        title: 'Action Locked',
        message: 'Viewer Mode: Saving lab test reports is locked (Read-Only).',
      });
      return;
    }

    if (!rollNo.trim()) {
      setToast({
        type: 'warning',
        title: 'Roll Number Required',
        message: 'Please enter a valid Roll Number for this lab report.',
      });
      return;
    }

    const reportId = editingReportId || `PTR-${dateStr.replace(/-/g, '')}-${rollNo.trim()}`;

    const reportObj: PaperTestReport = {
      id: reportId,
      product: product.toUpperCase().trim(),
      rollNo: rollNo.trim(),
      shift,
      date: dateStr,
      time,
      targetGsm,
      weight,
      speed,
      crepingPct,
      gsmSamples,
      avgGsm: gsmStats.avg,
      maxGsm: gsmStats.max,
      minGsm: gsmStats.min,
      rangeGsm: gsmStats.range,
      breakageCount,
      labResultGsm: labResultGsm || gsmStats.avg,
      moisturePct,
      caliperMm,
      bulkCcGm,
      breakingLengthMd,
      breakingLengthCd,
      brightnessPct,
      tearMd,
      tearCd,
      tensileDryMd,
      tensileDryCd,
      stretchDryMd,
      stretchDryCd,
      qcStatus,
      remarks,
      inspector: user?.displayName || 'lab_operator',
      timestamp: new Date().toISOString().substring(0, 16).replace('T', ' '),
    };

    try {
      setIsSubmitting(true);
      saveLabReport(reportObj, user?.displayName || 'System');
      setReports(getLabReports());
      setIsModalOpen(false);
      setHighlightedReportId(reportId);
      setTimeout(() => setHighlightedReportId(null), 4500);

      setToast({
        type: 'success',
        title: editingReportId ? 'Test Report Updated' : 'Test Report Saved',
        message: editingReportId
          ? `Paper Test Report #${reportId} updated successfully.`
          : `Paper Test Report for Roll #${rollNo} logged with QC Status: ${qcStatus.replace('_', ' ')}.`,
        duration: 3500,
      });
      setEditingReportId(null);
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Failed to Save Report',
        message: err.message || 'An error occurred while saving the lab report.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isViewer) {
      setToast({
        type: 'error',
        title: 'Action Locked',
        message: 'Viewer Mode: Deleting lab records is locked.',
      });
      return;
    }
    if (window.confirm('Are you sure you want to delete this lab report record?')) {
      deleteLabReport(id, user?.displayName || 'System');
      setReports(getLabReports());
      setToast({
        type: 'info',
        title: 'Report Deleted',
        message: `Paper Test Report #${id} has been removed.`,
        duration: 3000,
      });
    }
  };

  // Timeframe filtered reports for top KPI cards
  const timeframeReports = useMemo(() => {
    return reports.filter(r => isDateInTimeframe(r.date, selectedDate, timeframe));
  }, [reports, selectedDate, timeframe]);

  const filteredReports = useMemo(() => {
    let list = reports;
    // Default to global timeframe when manual date filter is not active
    if (!labDateFrom && !labDateTo) {
      list = list.filter(r => isDateInTimeframe(r.date, selectedDate, timeframe));
    }
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(r => {
        return (
          r.rollNo.toLowerCase().includes(q) ||
          r.product.toLowerCase().includes(q) ||
          r.date.includes(q) ||
          r.inspector.toLowerCase().includes(q)
        );
      });
    }
    if (labDateFrom) list = list.filter(r => r.date >= labDateFrom);
    if (labDateTo) list = list.filter(r => r.date <= labDateTo);
    if (labShiftFilter && labShiftFilter !== 'all') list = list.filter(r => r.shift === labShiftFilter);
    return list;
  }, [reports, searchTerm, labDateFrom, labDateTo, labShiftFilter, selectedDate, timeframe]);

  // Overall KPI Metrics for selected timeframe
  const totalReportsCount = timeframeReports.length;
  const avgTestedGsm = useMemo(() => {
    if (timeframeReports.length === 0) return '0.0';
    const sum = timeframeReports.reduce((acc, r) => acc + (r.avgGsm || 0), 0);
    return (sum / timeframeReports.length).toFixed(1);
  }, [timeframeReports]);

  const avgTestedMoisture = useMemo(() => {
    if (timeframeReports.length === 0) return '0.00';
    const sum = timeframeReports.reduce((acc, r) => acc + (r.moisturePct || 0), 0);
    return (sum / timeframeReports.length).toFixed(2);
  }, [timeframeReports]);

  const avgTestedBrightness = useMemo(() => {
    if (timeframeReports.length === 0) return '0.0';
    const sum = timeframeReports.reduce((acc, r) => acc + (r.brightnessPct || 0), 0);
    return (sum / timeframeReports.length).toFixed(1);
  }, [timeframeReports]);

  const timeframeSubtitle = useMemo(() => {
    if (timeframe === 'day') return `For Day (${selectedDate.split('-').reverse().join('/')})`;
    if (timeframe === 'week') return 'Weekly Sample Window';
    if (timeframe === 'month') return `Month (${selectedDate.substring(0, 7)})`;
    return 'All-Time Sample Ledger';
  }, [timeframe, selectedDate]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
      <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-900/50 text-purple-600 dark:text-purple-400 shadow-2xs shrink-0">
              <Beaker className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                  Quality Control Laboratory
                </h1>
                <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80 text-xs font-bold font-mono">
                  {timeframe === 'day' ? selectedDate : `${timeframe.toUpperCase()}: ${selectedDate}`}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Log paper test reports, 14-sample GSM profiles, tensile/tear strength & generate official COA certificates.
              </p>
            </div>
          </div>

          {(user?.role === 'Admin' || user?.role === 'PlantManager' || user?.role === 'LabOperator' || isViewer) && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleOpenNewModal}
                className={`px-4 py-2.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl font-black transition ${
                  isViewer
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer'
                    : 'btn-primary-gradient cursor-pointer active:scale-95'
                }`}
              >
                {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Plus className="h-4 w-4" />}
                <span>{isViewer ? 'New Report Form (Read-Only)' : 'Create New Report'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Top Banner KPI Cards (Hidden on mobile for clean focused log view) */}
      <div className="hidden sm:grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-5 w-full">
        <div className="neumorphic-card p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {timeframe === 'day' ? 'Reports (Day)' : timeframe === 'week' ? 'Reports (Week)' : timeframe === 'month' ? 'Reports (Month)' : 'Total Reports'}
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
            {totalReportsCount} Reports
          </p>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">{timeframeSubtitle}</p>
        </div>

        <div className="neumorphic-card p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Tested GSM</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
            {avgTestedGsm} g/m²
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{timeframeSubtitle}</p>
        </div>

        <div className="neumorphic-card p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Moisture %</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
            {avgTestedMoisture}%
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Target range: 4% – 8%</p>
        </div>

        <div className="neumorphic-card p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Brightness</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
            {avgTestedBrightness}%
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Target ISO: &gt; 80%</p>
        </div>
      </div>

      {/* Main Ledger Table of Historical Lab Reports */}
      <div className="neumorphic-card p-4 sm:p-6 space-y-4 sm:space-y-5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Paper Test Reports History Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Physical quality testing records & Certificate of Analysis (COA)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-2 flex items-center gap-2 w-full md:w-56">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search roll, product..."
                className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
              />
            </div>
            <DataFilterBar
              dateFrom={labDateFrom}
              dateTo={labDateTo}
              onDateFromChange={setLabDateFrom}
              onDateToChange={setLabDateTo}
              filterFields={[
                { id: 'shift', label: 'Shift', options: [{label: 'Day Shift', value: 'A'}, {label: 'Night Shift', value: 'B'}] },
              ]}
              activeFilters={{ shift: labShiftFilter }}
              onFilterChange={(fieldId, value) => {
                if (fieldId === 'shift') setLabShiftFilter(value);
              }}
              onClearAll={() => { setLabDateFrom(''); setLabDateTo(''); setLabShiftFilter('all'); }}
            />
          </div>
        </div>

        {/* Mobile Reports Cards List (Mobile Only) */}
        <div className="md:hidden space-y-3">
          {filteredReports.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              No lab test reports match your search query.
            </div>
          ) : (
            filteredReports.map(report => {
              const displayId = report.id.length > 22 ? report.id.replace(/-R-\d+/, '') : report.id;
              const displayRollNo = report.rollNo.startsWith('#') ? report.rollNo : `#${report.rollNo}`;
              const isDay = (report.shift as string) === 'A' || (report.shift as string) === 'Day';
              const isNight = (report.shift as string) === 'B' || (report.shift as string) === 'Night';
              const shiftDisplay = isDay ? 'Day' : isNight ? 'Night' : report.shift;
              const isHighlighted = highlightedReportId === report.id;

              return (
                <div
                  key={report.id}
                  className={`p-3.5 rounded-2xl space-y-2.5 shadow-2xs text-left transition ${
                    isHighlighted
                      ? 'bg-purple-50/90 dark:bg-purple-950/40 border-2 border-primary ring-2 ring-primary/30 animate-pulse'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Top Bar: Report ID, Roll No Badge, Shift & Grade */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400 truncate block" title={report.id}>
                          {displayId}
                        </span>
                        {isHighlighted && (
                          <span className="px-1.5 py-0.2 rounded bg-primary text-white text-[9px] font-bold uppercase animate-pulse">
                            ✓ New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {displayRollNo}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border leading-none ${
                          isDay
                            ? 'bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        }`}>
                          {shiftDisplay}
                        </span>
                      </div>
                    </div>

                    {report.qcStatus && (
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 border ${
                        report.qcStatus === 'GRADE_A'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : report.qcStatus === 'GRADE_B'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                      }`}>
                        {report.qcStatus.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Details Grid: Product, Date/Time, GSM, Moisture */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Product</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate block">{report.product}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Date / Time</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300 block">
                        {report.date.split('-').reverse().join('.')} {report.time}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Target / Avg GSM</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 block">
                        <span className="text-slate-400">{report.targetGsm}</span> / <strong className="text-slate-900 dark:text-white font-bold">{report.avgGsm} g/m²</strong>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Moisture</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {report.moisturePct.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        if (isViewer) return;
                        handleOpenEditModal(report);
                      }}
                      disabled={isViewer}
                      className={`px-2.5 py-1.5 rounded-xl font-black transition text-xs inline-flex items-center gap-1 shadow-xs leading-none ${
                        isViewer
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                          : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer active:scale-95'
                      }`}
                      title={isViewer ? "Editing is locked for Viewer (Read-Only Mode)" : "Edit Paper Test Report"}
                    >
                      {isViewer ? <Lock className="h-3.5 w-3.5 shrink-0 text-amber-500" /> : <Pencil className="h-3.5 w-3.5 shrink-0" />}
                      <span>{isViewer ? 'Locked' : 'Edit'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedReportForView(report);
                      }}
                      className="px-2.5 py-1.5 rounded-xl font-black transition text-xs inline-flex items-center gap-1 shadow-xs leading-none bg-purple-600 hover:bg-purple-700 text-white cursor-pointer active:scale-95"
                      title="View & Print Certificate of Analysis (COA)"
                    >
                      <Printer className="h-3.5 w-3.5 shrink-0" />
                      <span>View / Print</span>
                    </button>

                    <button
                      onClick={() => {
                        handleDownloadCertificateHtml(report);
                      }}
                      disabled={isDownloading}
                      className="px-2 py-1.5 rounded-xl font-black transition text-xs inline-flex items-center gap-1 shadow-xs leading-none bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95"
                      title="Download Standalone HTML Certificate"
                    >
                      <Download className="h-3.5 w-3.5 shrink-0" />
                      <span>HTML</span>
                    </button>

                    {user?.role === 'Admin' && (
                      <button
                        onClick={e => handleDeleteReport(report.id, e)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer shrink-0"
                        title="Delete Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Ledger Table (Desktop Only) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[9px] sm:text-[10px] font-black tracking-wider bg-slate-50/50 dark:bg-slate-900/60">
                <th className="py-2.5 px-2 sm:px-3">Report ID</th>
                <th className="py-2.5 px-2 sm:px-3 font-mono">Roll No</th>
                <th className="py-2.5 px-2 sm:px-3">Date / Time</th>
                <th className="py-2.5 px-2 sm:px-3">Product</th>
                <th className="py-2.5 px-2 sm:px-3">Shift</th>
                <th className="py-2.5 px-2 sm:px-3 font-mono">Target / Avg GSM</th>
                <th className="py-2.5 px-2 sm:px-3 font-mono">Moisture</th>
                <th className="py-2.5 px-2 sm:px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-[11px]">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-medium">
                    No lab test reports match your search query.
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => {
                  // Format long IDs cleanly
                  const displayId = report.id.length > 22 ? report.id.replace(/-R-\d+/, '') : report.id;
                  const displayRollNo = report.rollNo.startsWith('#') ? report.rollNo : `#${report.rollNo}`;
                  const isDay = (report.shift as string) === 'A' || (report.shift as string) === 'Day';
                  const isNight = (report.shift as string) === 'B' || (report.shift as string) === 'Night';
                  const shiftDisplay = isDay ? 'Day' : isNight ? 'Night' : report.shift;
                  const isHighlighted = highlightedReportId === report.id;

                  return (
                    <tr
                      key={report.id}
                      className={`transition ${
                        isHighlighted
                          ? 'bg-purple-50/90 dark:bg-purple-950/40 ring-2 ring-primary/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-2 sm:px-3 font-mono font-bold text-purple-600 dark:text-purple-400 text-[11px] truncate max-w-[140px]" title={report.id}>
                        <div
                          className="flex items-center gap-1 cursor-pointer hover:underline"
                          onClick={() => setSelectedReportForView(report)}
                          title="Click to View Certificate"
                        >
                          <span>{displayId}</span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.2 rounded bg-primary text-white text-[8px] font-bold uppercase">
                              ✓ New
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 font-mono font-black text-slate-900 dark:text-white text-[11px]">
                        <span
                          className="cursor-pointer hover:text-purple-600"
                          onClick={() => setSelectedReportForView(report)}
                          title="Click to View Certificate"
                        >
                          {displayRollNo}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                        {report.date.split('-').reverse().join('.')} {report.time}
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 font-bold text-slate-900 dark:text-white text-[11px] truncate max-w-[110px]" title={report.product}>
                        {report.product}
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border leading-none ${
                          isDay
                            ? 'bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        }`}>
                          {shiftDisplay}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 font-mono text-[11px]">
                        <span className="text-slate-400">{report.targetGsm}</span>/<strong className="text-slate-900 dark:text-white">{report.avgGsm}g/m²</strong>
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {report.moisturePct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Edit Report Button */}
                          <button
                            onClick={() => {
                              if (isViewer) return;
                              handleOpenEditModal(report);
                            }}
                            disabled={isViewer}
                            className={`px-2.5 py-1 rounded-xl font-black transition text-[10px] inline-flex items-center gap-1 shadow-xs leading-none whitespace-nowrap ${
                              isViewer
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                                : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer active:scale-95'
                            }`}
                            title={isViewer ? "Editing is locked for Viewer (Read-Only Mode)" : "Edit Paper Test Report"}
                          >
                            {isViewer ? <Lock className="h-3 w-3 shrink-0 text-amber-500" /> : <Pencil className="h-3 w-3 shrink-0" />}
                            <span>{isViewer ? 'Locked' : 'Edit'}</span>
                          </button>

                          {/* View & Print Certificate Button */}
                          <button
                            onClick={() => {
                              setSelectedReportForView(report);
                            }}
                            className="px-2.5 py-1 rounded-xl font-black transition text-[10px] inline-flex items-center gap-1 shadow-xs leading-none whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white cursor-pointer active:scale-95"
                            title="View & Print Certificate of Analysis (COA)"
                          >
                            <Printer className="h-3 w-3 shrink-0" />
                            <span>View / Print</span>
                          </button>

                          {/* Download HTML Button */}
                          <button
                            onClick={() => {
                              handleDownloadCertificateHtml(report);
                            }}
                            disabled={isDownloading}
                            className="px-2 py-1 rounded-xl font-black transition text-[10px] inline-flex items-center gap-1 shadow-xs leading-none whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95"
                            title="Download Certificate HTML"
                          >
                            <Download className="h-3 w-3 shrink-0" />
                            <span>HTML</span>
                          </button>

                          {user?.role === 'Admin' && (
                            <button
                              onClick={e => handleDeleteReport(report.id, e)}
                              className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer shrink-0"
                              title="Delete Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Paper Test Report Creation / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
              setEditingReportId(null);
            }
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Fixed Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Beaker className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                    {editingReportId ? 'Edit Paper Test Report' : 'Paper Test Report Entry'}
                  </h3>
                  {editingReportId && (
                    <p className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold mt-0.5">
                      Editing Record: {editingReportId}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingReportId(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-800 font-bold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSaveReport} className="space-y-6">
              
              {/* Section 1: Header Metadata Parameters */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-[#008163] dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5" /> 1. Header Roll Parameters
                  </h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Autofill:</span>
                    <button
                      type="button"
                      onClick={() => handleFillRollPreset('R-20260822-0001')}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 text-[10px] font-black hover:scale-105 active:scale-95 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Autofill certified lab test for Roll #R-20260822-0001"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Roll #R-20260822-0001 (18 GSM)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillRollPreset('R-20260812-0001')}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:scale-105 active:scale-95 transition cursor-pointer"
                    >
                      <span>Roll #R-20260812-0001</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillRollPreset('11')}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:scale-105 active:scale-95 transition cursor-pointer"
                    >
                      <span>Roll #11</span>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Quality / Product</label>
                    <input
                      type="text"
                      value={product}
                      onChange={e => setProduct(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white"
                      placeholder="e.g. NAPKIN"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Roll No</label>
                    <input
                      type="text"
                      value={rollNo}
                      onChange={e => setRollNo(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                      placeholder="e.g. 11"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Shift</label>
                    <select
                      value={shift}
                      onChange={e => setShift(e.target.value as any)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white"
                    >
                      <option value="A">Day Shift</option>
                      <option value="B">Night Shift</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Date</label>
                    <input
                      type="date"
                      value={dateStr}
                      onChange={e => setDateStr(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Target GSM</label>
                    <input
                      type="number"
                      step="0.1"
                      value={targetGsm}
                      onChange={e => setTargetGsm(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Roll Weight (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Speed (m/min)</label>
                    <input
                      type="number"
                      value={speed}
                      onChange={e => setSpeed(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Creping %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={crepingPct}
                      onChange={e => setCrepingPct(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: 14 GSM Sample Profile & Realtime Auto-Stats */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5" /> 2. 14 GSM Profile Samples & Auto-Computed Stats
                  </h4>
                  
                  {/* Realtime Stats Pills */}
                  <div className="flex items-center gap-2 font-mono text-xs font-bold flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400">
                      Avg: {gsmStats.avg}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400">
                      Max: {gsmStats.max}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                      Min: {gsmStats.min}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400">
                      Range: {gsmStats.range}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {gsmSamples.map((sampleVal, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <span className="block text-[9px] font-extrabold text-slate-400 text-center">SR {idx + 1}</span>
                      <input
                        type="number"
                        step="0.1"
                        value={sampleVal !== undefined ? sampleVal : ''}
                        onChange={e => handleGsmSampleChange(idx, e.target.value)}
                        className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-center dark:text-white text-purple-600 dark:text-purple-400 focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-500">Web Breakage Count:</span>
                  <input
                    type="number"
                    min="0"
                    value={breakageCount}
                    onChange={e => setBreakageCount(parseInt(e.target.value, 10) || 0)}
                    className="w-20 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-center dark:text-white"
                  />
                </div>
              </div>

              {/* Section 3: 13 Physical & Mechanical Lab Test Parameters */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
                <h4 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Activity className="h-3.5 w-3.5" /> 3. Physical & Mechanical Lab Test Parameters (13 Parameters)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">1. GSM Result (g/m²)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={labResultGsm}
                      onChange={e => setLabResultGsm(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">2. Moisture (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={moisturePct}
                      onChange={e => setMoisturePct(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">3. Caliper Thickness (MM)</label>
                    <input
                      type="number"
                      value={caliperMm}
                      onChange={e => setCaliperMm(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        4. Bulk (cc/gm)
                      </label>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                        Auto: Caliper ÷ GSM
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={bulkCcGm}
                      onChange={e => setBulkCcGm(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                    <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">
                      Formula: {caliperMm} ÷ {labResultGsm || targetGsm || 1} = {bulkCcGm} cc/gm
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">5. Breaking Length MD (Mtr)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={breakingLengthMd}
                      onChange={e => setBreakingLengthMd(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">6. Breaking Length CD (Mtr)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={breakingLengthCd}
                      onChange={e => setBreakingLengthCd(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">7. Brightness (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={brightnessPct}
                      onChange={e => setBrightnessPct(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-red-600 dark:text-red-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">8. Tear MD (J/m²)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tearMd}
                      onChange={e => setTearMd(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">9. Tear CD (J/m²)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tearCd}
                      onChange={e => setTearCd(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        10. Tensile Dry MD (N/M)
                      </label>
                      <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/60">
                        Auto: (BLm × GSM × 9.81) ÷ 1000
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={tensileDryMd}
                      onChange={e => setTensileDryMd(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                    <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">
                      Formula: ({breakingLengthMd < 50 ? (breakingLengthMd * 1000).toFixed(0) : breakingLengthMd}m × {labResultGsm || targetGsm || 1} × 9.81) ÷ 1000 = {tensileDryMd} N/M
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        11. Tensile Dry CD (N/M)
                      </label>
                      <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/60">
                        Auto: (BLm × GSM × 9.81) ÷ 1000
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={tensileDryCd}
                      onChange={e => setTensileDryCd(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                    <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">
                      Formula: ({breakingLengthCd < 50 ? (breakingLengthCd * 1000).toFixed(0) : breakingLengthCd}m × {labResultGsm || targetGsm || 1} × 9.81) ÷ 1000 = {tensileDryCd} N/M
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">12. Stretch Dry MD (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={stretchDryMd}
                      onChange={e => setStretchDryMd(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">13. Stretch Dry CD (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={stretchDryCd}
                      onChange={e => setStretchDryCd(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Chemist Remarks & Notes */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> 4. Chemist Remarks & Quality Notes
                </h4>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Remarks / Chemist Notes</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white text-xs"
                    placeholder="e.g. Sample meets all physical strength, moisture & GSM quality benchmarks."
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingReportId(null);
                  }}
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isViewer || isSubmitting}
                  title={
                    isViewer
                      ? 'Viewer Mode: Saving lab test reports is locked (Read-Only)'
                      : editingReportId
                      ? 'Save Changes to Paper Test Report'
                      : 'Save & Issue Paper Test Report'
                  }
                  className={`px-6 py-3 text-xs uppercase tracking-wider font-black flex items-center justify-center gap-2 rounded-2xl transition ${
                    isViewer
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                      : isSubmitting
                      ? 'bg-primary/70 text-white cursor-wait opacity-80'
                      : 'btn-primary-gradient cursor-pointer active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isViewer ? (
                    <Lock className="h-4 w-4 text-amber-500" />
                  ) : null}
                  <span>
                    {isSubmitting
                      ? 'Saving Test Report...'
                      : isViewer
                      ? editingReportId
                        ? 'Save Changes (Locked)'
                        : 'Save & Issue Paper Test Report (Locked)'
                      : editingReportId
                      ? 'Save Changes'
                      : 'Save & Issue Paper Test Report'}
                  </span>
                </button>
              </div>

            </form>
            </div>
          </div>
        </div>
      )}

      {/* Paper Test Certificate (COA) Preview & Print Portal Modal */}
      {selectedReportForView && createPortal(
        <div
          id="printable-lab-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain font-sans print:static print:block print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:z-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedReportForView(null);
          }}
        >
          <div
            className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-3xl max-w-4xl w-full p-3 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 my-auto text-left print:border-none print:p-0 print:shadow-none print:max-w-none print:w-full print:my-0 print:rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Action Header (Hidden in Print) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    Paper Test Certificate (COA)
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-bold">
                      Roll #{selectedReportForView.rollNo}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Official Mill Quality & Physical Strength Certificate of Analysis
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Print / Save as PDF */}
                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  disabled={isViewer}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                    isViewer
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer active:scale-95'
                  }`}
                  title="Print or Save as PDF"
                >
                  {isViewer ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : <Printer className="h-3.5 w-3.5" />}
                  <span>Print / Save as PDF</span>
                </button>

                {/* Download HTML */}
                <button
                  type="button"
                  onClick={() => handleDownloadCertificateHtml(selectedReportForView)}
                  disabled={isDownloading}
                  className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer active:scale-95 transition"
                  title="Download Standalone HTML Certificate"
                >
                  {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span>Download HTML</span>
                </button>

                {/* Edit */}
                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => {
                      const r = selectedReportForView;
                      setSelectedReportForView(null);
                      handleOpenEditModal(r);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer transition flex items-center gap-1.5"
                    title="Edit Report"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                )}

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setSelectedReportForView(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400 cursor-pointer transition"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* The Printable Certificate Container */}
            <div
              id="printable-lab-report-content"
              className="w-full max-w-[790px] mx-auto bg-white text-slate-900 border-2 border-[#1e3a8a] rounded-md p-3 sm:p-3.5 shadow-sm print:border-2 print:border-[#1e3a8a] print:p-2 print:shadow-none print:max-w-none print:w-full print:m-0"
              style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
            >
              {/* Certificate Header */}
              <div className="text-center border-b-2 border-[#1e3a8a] pb-1.5 mb-2">
                <h1 className="text-lg sm:text-xl font-black text-[#1e3a8a] uppercase tracking-wider leading-tight">
                  {COMPANY_CONFIG.name}
                </h1>
                <h2 className="text-xs sm:text-[13px] font-black text-[#dc2626] uppercase tracking-widest mt-0.5">
                  PAPER TEST REPORT (COA)
                </h2>
              </div>

              {/* Metadata Top Table */}
              <table className="w-full border-collapse table-fixed text-[9.5px] mb-2 bg-[#f8fafc]">
                <tbody>
                  <tr>
                    <td className="border border-slate-500 p-1 font-black text-[#dc2626] bg-slate-100 uppercase text-[9px] w-[13.5%] text-center">
                      QUALITY:
                    </td>
                    <td className="border border-slate-500 p-1 font-bold text-[#1e3a8a] text-[10px] w-[11.5%] text-center">
                      {selectedReportForView.product}
                    </td>
                    <td className="border border-slate-500 p-1 font-black text-[#dc2626] bg-slate-100 uppercase text-[9px] w-[13.5%] text-center">
                      ROLL NO:
                    </td>
                    <td className="border border-slate-500 p-1 font-bold text-[#1e3a8a] text-[10px] w-[11.5%] text-center font-mono">
                      {selectedReportForView.rollNo}
                    </td>
                    <td className="border border-slate-500 p-1 font-black text-[#dc2626] bg-slate-100 uppercase text-[9px] w-[13.5%] text-center">
                      SHIFT:
                    </td>
                    <td className="border border-slate-500 p-1 font-bold text-[#1e3a8a] text-[10px] w-[11.5%] text-center uppercase">
                      {(selectedReportForView.shift as string) === 'A' || (selectedReportForView.shift as string) === 'Day' ? 'Day' : (selectedReportForView.shift as string) === 'B' || (selectedReportForView.shift as string) === 'Night' ? 'Night' : selectedReportForView.shift}
                    </td>
                    <td className="border border-slate-500 p-1 font-black text-[#dc2626] bg-slate-100 uppercase text-[9px] w-[13.5%] text-center">
                      DATE:
                    </td>
                    <td className="border border-slate-500 p-1 font-bold text-[#1e3a8a] text-[10px] w-[11.5%] text-center font-mono">
                      {selectedReportForView.date.split('-').reverse().join('.')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-500 p-1 font-black text-[#dc2626] bg-slate-100 uppercase text-[9px] text-center">
                      GSM:
                    </td>
                    <td className="border border-slate-500 p-1 font-bold text-[#1e3a8a] text-[10px] text-center font-mono">
                      {selectedReportForView.targetGsm}
                    </td>
                    <td className="border border-slate-500 p-1 font-black text-[#dc2626] bg-slate-100 uppercase text-[9px] text-center">
                      WEIGHT:
                    </td>
                    <td className="border border-slate-500 p-1 font-bold text-[#1e3a8a] text-[10px] text-center font-mono">
                      {selectedReportForView.weight} kg
                    </td>
                    <td className="border border-slate-500 p-1 font-black text-[#dc2626] bg-slate-100 uppercase text-[9px] text-center">
                      SPEED:
                    </td>
                    <td className="border border-slate-500 p-1 font-bold text-[#1e3a8a] text-[10px] text-center font-mono">
                      {selectedReportForView.speed}
                    </td>
                    <td className="border border-slate-500 p-1 font-black text-[#dc2626] bg-slate-100 uppercase text-[9px] text-center">
                      TIME:
                    </td>
                    <td className="border border-slate-500 p-1 font-bold text-[#1e3a8a] text-[10px] text-center font-mono">
                      {selectedReportForView.time}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-500 p-1 font-black text-[#dc2626] bg-slate-100 uppercase text-[9px] text-center">
                      CREPING:
                    </td>
                    <td className="border border-slate-500 p-1 font-bold text-[#1e3a8a] text-[10px] text-center font-mono">
                      {selectedReportForView.crepingPct.toFixed(2)}%
                    </td>
                    <td colSpan={6} className="border-none bg-transparent"></td>
                  </tr>
                </tbody>
              </table>

              {/* Dual-Column Main Section */}
              <div className="flex gap-1.5 items-start w-full">
                
                {/* Left Column: GSM Profile (26%) */}
                <div className="w-[26%] shrink-0">
                  <table className="w-full border-collapse table-fixed text-[9px]">
                    <thead>
                      <tr className="bg-[#1e3a8a] text-white font-black text-[9px] uppercase tracking-wider">
                        <th className="border border-[#1e3a8a] p-1 text-center w-[42%]">SR NO</th>
                        <th className="border border-[#1e3a8a] p-1 text-center w-[58%]">GSM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedReportForView.gsmSamples && selectedReportForView.gsmSamples.length > 0 ? selectedReportForView.gsmSamples : Array(14).fill(16.5)).slice(0, 14).map((val, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-500 p-0.5 text-center font-bold text-slate-700 text-[9px]">{idx + 1}</td>
                          <td className="border border-slate-500 p-0.5 text-center font-bold text-[#dc2626] text-[10px] font-mono">{(Number(val) || 0).toFixed(1)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100">
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-extrabold text-slate-900 text-[8.5px]">Avg.</td>
                        <td className="border border-slate-500 p-0.5 text-center font-extrabold text-[#dc2626] text-[9.5px] font-mono">{selectedReportForView.avgGsm.toFixed(1)}</td>
                      </tr>
                      <tr className="bg-slate-100">
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-extrabold text-slate-900 text-[8.5px]">Max.</td>
                        <td className="border border-slate-500 p-0.5 text-center font-extrabold text-[#dc2626] text-[9.5px] font-mono">{selectedReportForView.maxGsm.toFixed(1)}</td>
                      </tr>
                      <tr className="bg-slate-100">
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-extrabold text-slate-900 text-[8.5px]">Min.</td>
                        <td className="border border-slate-500 p-0.5 text-center font-extrabold text-[#dc2626] text-[9.5px] font-mono">{selectedReportForView.minGsm.toFixed(1)}</td>
                      </tr>
                      <tr className="bg-slate-100">
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-extrabold text-slate-900 text-[8.5px]">Range.</td>
                        <td className="border border-slate-500 p-0.5 text-center font-extrabold text-[#dc2626] text-[9.5px] font-mono">{selectedReportForView.rangeGsm.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-slate-100">
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-extrabold text-slate-900 text-[8.5px]">Breakage:</td>
                        <td className={`border border-slate-500 p-0.5 text-center font-black text-[9.5px] font-mono ${selectedReportForView.breakageCount > 0 ? 'text-[#dc2626]' : 'text-[#059669]'}`}>{selectedReportForView.breakageCount}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right Column: 13 Test Parameters (74%) */}
                <div className="w-[74%] shrink-0">
                  <table className="w-full border-collapse table-fixed text-[9px]">
                    <thead>
                      <tr className="bg-[#1e3a8a] text-white font-black text-[9px] uppercase tracking-wider">
                        <th className="border border-[#1e3a8a] p-1 text-center w-[8%]">SR NO</th>
                        <th className="border border-[#1e3a8a] p-1 text-center w-[32%]">TEST PARAMETER</th>
                        <th className="border border-[#1e3a8a] p-1 text-center w-[27%]">SPEC / ORIENTATION</th>
                        <th className="border border-[#1e3a8a] p-1 text-center w-[13%]">UNITS</th>
                        <th className="border border-[#1e3a8a] p-1 text-center w-[20%]">RESULT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-500 p-0.5 text-center">1</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-black text-[#1e3a8a]">GSM</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 text-slate-600 font-semibold text-[8px]">Target Match</td>
                        <td className="border border-slate-500 p-0.5 text-center text-slate-700 font-semibold text-[8.5px]">g/m2</td>
                        <td className="border border-slate-500 p-0.5 text-center font-black text-[#059669] text-[10px] font-mono">{selectedReportForView.labResultGsm.toFixed(1)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-500 p-0.5 text-center">2</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-black text-[#1e3a8a]">MOISTURE</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 text-slate-600 font-semibold text-[8px]">Content %</td>
                        <td className="border border-slate-500 p-0.5 text-center text-slate-700 font-semibold text-[8.5px]">%</td>
                        <td className="border border-slate-500 p-0.5 text-center font-black text-[#059669] text-[10px] font-mono">{selectedReportForView.moisturePct.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-500 p-0.5 text-center">3</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-black text-[#1e3a8a]">CALIPER</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 text-slate-600 font-semibold text-[8px]">Thickness</td>
                        <td className="border border-slate-500 p-0.5 text-center text-slate-700 font-semibold text-[8.5px]">MM</td>
                        <td className="border border-slate-500 p-0.5 text-center font-black text-[#059669] text-[10px] font-mono">{selectedReportForView.caliperMm}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-500 p-0.5 text-center">4</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-black text-[#1e3a8a]">BULK</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 text-slate-600 font-semibold text-[8px]">Specific Volume</td>
                        <td className="border border-slate-500 p-0.5 text-center text-slate-700 font-semibold text-[8.5px]">cc/gm</td>
                        <td className="border border-slate-500 p-0.5 text-center font-black text-[#059669] text-[10px] font-mono">{selectedReportForView.bulkCcGm.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-500 p-0.5 text-center">5</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-black text-[#1e3a8a]">BREAKING LENGTH</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 text-slate-600 font-semibold text-[8px]">10 cm length (MD)</td>
                        <td className="border border-slate-500 p-0.5 text-center text-slate-700 font-semibold text-[8.5px]">Mtr</td>
                        <td className="border border-slate-500 p-0.5 text-center font-black text-[#059669] text-[10px] font-mono">{selectedReportForView.breakingLengthMd.toFixed(3)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-500 p-0.5 text-center">6</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-black text-[#1e3a8a]">BREAKING LENGTH</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 text-slate-600 font-semibold text-[8px]">10 cm length (CD)</td>
                        <td className="border border-slate-500 p-0.5 text-center text-slate-700 font-semibold text-[8.5px]">Mtr</td>
                        <td className="border border-slate-500 p-0.5 text-center font-black text-[#059669] text-[10px] font-mono">{selectedReportForView.breakingLengthCd.toFixed(3)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-500 p-0.5 text-center">7</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-black text-[#1e3a8a]">BRIGHTNESS</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 text-slate-600 font-semibold text-[8px]">Optical ISO %</td>
                        <td className="border border-slate-500 p-0.5 text-center text-slate-700 font-semibold text-[8.5px]">%</td>
                        <td className="border border-slate-500 p-0.5 text-center font-black text-[#dc2626] text-[10px] font-mono">{selectedReportForView.brightnessPct.toFixed(1)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-500 p-0.5 text-center">8</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-black text-[#1e3a8a]">TEAR</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 text-slate-600 font-semibold text-[8px]">Tear Resistance (MD)</td>
                        <td className="border border-slate-500 p-0.5 text-center text-slate-700 font-semibold text-[8.5px]">J/m2</td>
                        <td className="border border-slate-500 p-0.5 text-center font-black text-[#059669] text-[10px] font-mono">{selectedReportForView.tearMd.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-500 p-0.5 text-center">9</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-black text-[#1e3a8a]">TEAR</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 text-slate-600 font-semibold text-[8px]">Tear Resistance (CD)</td>
                        <td className="border border-slate-500 p-0.5 text-center text-slate-700 font-semibold text-[8.5px]">J/m2</td>
                        <td className="border border-slate-500 p-0.5 text-center font-black text-[#059669] text-[10px] font-mono">{selectedReportForView.tearCd.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-500 p-0.5 text-center">10</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-black text-[#1e3a8a]">TENSILE DRY</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 text-slate-600 font-semibold text-[8px]">1 PLY (MD)</td>
                        <td className="border border-slate-500 p-0.5 text-center text-slate-700 font-semibold text-[8.5px]">N/M</td>
                        <td className="border border-slate-500 p-0.5 text-center font-black text-[#059669] text-[10px] font-mono">{selectedReportForView.tensileDryMd.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-500 p-0.5 text-center">11</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-black text-[#1e3a8a]">TENSILE DRY</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 text-slate-600 font-semibold text-[8px]">1 PLY (CD)</td>
                        <td className="border border-slate-500 p-0.5 text-center text-slate-700 font-semibold text-[8.5px]">N/M</td>
                        <td className="border border-slate-500 p-0.5 text-center font-black text-[#059669] text-[10px] font-mono">{selectedReportForView.tensileDryCd.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-500 p-0.5 text-center">12</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-black text-[#1e3a8a]">STERACH DRY</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 text-slate-600 font-semibold text-[8px]">1 PLY (MD)</td>
                        <td className="border border-slate-500 p-0.5 text-center text-slate-700 font-semibold text-[8.5px]">%</td>
                        <td className="border border-slate-500 p-0.5 text-center font-black text-[#059669] text-[10px] font-mono">{selectedReportForView.stretchDryMd.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-500 p-0.5 text-center">13</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 font-black text-[#1e3a8a]">STERACH DRY</td>
                        <td className="border border-slate-500 p-0.5 text-left pl-1 text-slate-600 font-semibold text-[8px]">1 PLY (CD)</td>
                        <td className="border border-slate-500 p-0.5 text-center text-slate-700 font-semibold text-[8.5px]">%</td>
                        <td className="border border-slate-500 p-0.5 text-center font-black text-[#059669] text-[10px] font-mono">{selectedReportForView.stretchDryCd.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Remarks Box */}
              <div className="mt-1.5 border border-slate-500 rounded p-1.5 bg-[#f8fafc]">
                <div className="font-extrabold text-[#dc2626] text-[9px] uppercase tracking-wider mb-0.5">Remark:</div>
                <div className="text-[9px] font-semibold text-slate-800 min-h-[18px] leading-tight">
                  {selectedReportForView.remarks || 'Sample meets all physical strength, moisture & GSM quality benchmarks.'}
                </div>
              </div>

              {/* Company Identity Footer */}
              <div className="text-center text-[8px] font-semibold text-slate-500 mt-1.5 border-t border-slate-300 pt-1">
                {COMPANY_CONFIG.name} &bull; ${COMPANY_CONFIG.address} &bull; Mo: {COMPANY_CONFIG.phone} &bull; {COMPANY_CONFIG.website}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Floating Toast */}
      <MobileToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
