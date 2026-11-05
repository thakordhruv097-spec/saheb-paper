import React, { useState, useMemo } from 'react';
import type { Reel, PackingSlip, Party, Vehicle } from '../../data/types';
import { useAuth } from '../auth/AuthContext';
import {
  Search,
  Truck,
  FileText,
  Printer,
  Eye,
  PackageCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Layers,
  Copy,
  Check,
  X,
  RotateCcw,
  Award,
  SlidersHorizontal,
} from 'lucide-react';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';

interface DispatchedReelsVaultProps {
  reels: Reel[];
  slips: PackingSlip[];
  parties: Party[];
  vehicles: Vehicle[];
  onViewChallan: (slip: PackingSlip) => void;
  onPrintChallan?: (slip: PackingSlip) => void;
}

export interface DispatchedReelRecord {
  reel: Reel;
  slip?: PackingSlip;
  challanNo: string;
  partyName: string;
  vehicleNo: string;
  dispatchDate: string;
  dispatchTime: string;
}

export const DispatchedReelsVault: React.FC<DispatchedReelsVaultProps> = ({
  reels,
  slips,
  parties,
  vehicles,
  onViewChallan,
}) => {
  const { isViewer } = useAuth();
  const { timeframe, selectedDate } = useDateFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Map and index all confirmed packing slips
  const confirmedSlips = useMemo(() => {
    return slips.filter(s => s.status === 'CONFIRMED' || s.status === 'DISPATCHED');
  }, [slips]);

  // Aggregate all dispatched reels with their corresponding challan details
  const dispatchedRecords: DispatchedReelRecord[] = useMemo(() => {
    const list: DispatchedReelRecord[] = [];
    const seenReelNos = new Set<string>();

    // 1. First, process reels that have status === 'DISPATCHED' or a challanNo
    reels.forEach(r => {
      if (r.status === 'DISPATCHED' || r.challanNo || r.dispatchDetails?.packingSlipNo) {
        seenReelNos.add(r.reelNo);
        // Find matching slip
        const matchedSlip = slips.find(
          s => (r.challanNo && (s.slipNo === r.challanNo || `PS-${s.slipNo}` === r.challanNo || s.slipNo === `PS-${r.challanNo}`)) ||
               (r.dispatchDetails?.packingSlipNo && (s.slipNo === r.dispatchDetails.packingSlipNo || `PS-${s.slipNo}` === r.dispatchDetails.packingSlipNo || s.slipNo === `PS-${r.dispatchDetails.packingSlipNo}`)) ||
               s.reelNos.includes(r.reelNo)
        );
        const partyObj = matchedSlip
          ? parties.find(p => p.id === matchedSlip.partyId)
          : (r.dispatchDetails?.partyName ? parties.find(p => p.name.toLowerCase() === r.dispatchDetails?.partyName.toLowerCase()) : undefined);
        const vehicleObj = matchedSlip
          ? vehicles.find(v => v.id === matchedSlip.vehicleId || v.vehicleNo === matchedSlip.vehicleId)
          : (r.dispatchDetails?.vehicleNo ? vehicles.find(v => v.vehicleNo.toLowerCase() === r.dispatchDetails?.vehicleNo.toLowerCase()) : undefined);

        let challanDisplay = matchedSlip?.slipNo ||
          r.dispatchDetails?.packingSlipNo ||
          r.challanNo ||
          'DISPATCHED';
        if (/^\d+$/.test(challanDisplay.trim())) {
          challanDisplay = `PS-${challanDisplay.trim()}`;
        }
        if (challanDisplay.toUpperCase().startsWith('CHALLAN-')) {
          const after = challanDisplay.substring('CHALLAN-'.length);
          const match = after.match(/-(\d+)$/);
          challanDisplay = match ? `PS-${match[1].replace(/^0+/, '') || match[1]}` : `PS-${after}`;
        }

        list.push({
          reel: r,
          slip: matchedSlip,
          challanNo: challanDisplay,
          partyName: partyObj?.name || r.dispatchDetails?.partyName || (matchedSlip?.partyId ? 'Direct Customer' : 'Dispatched Customer'),
          vehicleNo: vehicleObj ? vehicleObj.vehicleNo : (r.dispatchDetails?.vehicleNo || matchedSlip?.vehicleId || 'N/A'),
          dispatchDate: matchedSlip?.dispatchDate || matchedSlip?.date || r.dispatchDetails?.dispatchDate || (r.productionDate ? r.productionDate.substring(0, 10) : '2026-08-22'),
          dispatchTime: matchedSlip?.dispatchTime || '16:00',
        });
      }
    });

    // 2. Also check any confirmed slips that might have reels in reelNos not caught yet
    confirmedSlips.forEach(slip => {
      const partyObj = parties.find(p => p.id === slip.partyId);
      const vehicleObj = vehicles.find(v => v.id === slip.vehicleId || v.vehicleNo === slip.vehicleId);

      slip.reelNos.forEach(rNo => {
        if (!seenReelNos.has(rNo)) {
          seenReelNos.add(rNo);
          const foundReel: Reel = reels.find(r => r.reelNo === rNo) || {
            reelNo: rNo,
            parentRollNo: 'N/A',
            product: 'Napkin Tissue',
            gsm: 18,
            size: 30,
            ply: 2,
            weight: 300,
            dia: 1000,
            joint: 0,
            status: 'DISPATCHED',
            qcGrade: 'A',
            productionDate: '2026-08-22 10:00',
          };

          list.push({
            reel: foundReel,
            slip,
            challanNo: slip.slipNo,
            partyName: partyObj?.name || 'Direct Customer',
            vehicleNo: vehicleObj ? vehicleObj.vehicleNo : (slip.vehicleId || 'N/A'),
            dispatchDate: slip.dispatchDate || slip.date || '2026-08-22',
            dispatchTime: slip.dispatchTime || '16:00',
          });
        }
      });
    });

    // Sort: newest dispatch date / highest reel number first
    return list.sort((a, b) => {
      if (a.dispatchDate !== b.dispatchDate) {
        return b.dispatchDate.localeCompare(a.dispatchDate);
      }
      return b.reel.reelNo.localeCompare(a.reel.reelNo, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [reels, slips, confirmedSlips, parties, vehicles]);

  // Unique products for filter
  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    dispatchedRecords.forEach(rec => {
      if (rec.reel.product) set.add(rec.reel.product);
    });
    return Array.from(set).sort();
  }, [dispatchedRecords]);

  // Filtered by Timeframe for KPI context
  const timeframeRecords = useMemo(() => {
    return dispatchedRecords.filter(rec => isDateInTimeframe(rec.dispatchDate, selectedDate, timeframe));
  }, [dispatchedRecords, selectedDate, timeframe]);

  const timeframeLabel = useMemo(() => {
    if (timeframe === 'day') return `For Day (${selectedDate})`;
    if (timeframe === 'week') return 'Weekly Dispatch Window';
    if (timeframe === 'month') return `Month (${selectedDate.substring(0, 7)})`;
    return 'All-Time Dispatches';
  }, [timeframe, selectedDate]);

  // Filtered records (defaults to all dispatched reels in vault, consistent with registered challans list)
  const filteredRecords = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return dispatchedRecords.filter(rec => {
      if (productFilter !== 'ALL' && rec.reel.product !== productFilter) return false;
      if (gradeFilter !== 'ALL' && (rec.reel.qcGrade || 'A').toUpperCase() !== gradeFilter) return false;

      if (q) {
        const matchReelNo = rec.reel.reelNo.toLowerCase().includes(q);
        const matchProd = (rec.reel.product || '').toLowerCase().includes(q);
        const matchChallan = rec.challanNo.toLowerCase().includes(q);
        const matchParty = rec.partyName.toLowerCase().includes(q);
        const matchVehicle = rec.vehicleNo.toLowerCase().includes(q);
        const matchDate = (rec.dispatchDate || '').toLowerCase().includes(q);
        const matchGsm = String(rec.reel.gsm).includes(q);
        const matchWeight = String(rec.reel.weight).includes(q);

        if (!matchReelNo && !matchProd && !matchChallan && !matchParty && !matchVehicle && !matchDate && !matchGsm && !matchWeight) {
          return false;
        }
      }
      return true;
    });
  }, [dispatchedRecords, searchTerm, productFilter, gradeFilter]);

  // Total Dispatched Metrics
  const totalDispatchedKg = useMemo(() => {
    return filteredRecords.reduce((sum, rec) => sum + (rec.reel.weight || 0), 0);
  }, [filteredRecords]);

  const uniqueChallansCount = useMemo(() => {
    return new Set(filteredRecords.map(r => r.challanNo)).size;
  }, [filteredRecords]);

  const getProductCount = (prod: string) => {
    return dispatchedRecords.filter(r => r.reel.product === prod).length;
  };

  const gradeACount = useMemo(() => {
    return dispatchedRecords.filter(r => (r.reel.qcGrade || 'A').toUpperCase() === 'A').length;
  }, [dispatchedRecords]);

  const gradeBCount = useMemo(() => {
    return dispatchedRecords.filter(r => (r.reel.qcGrade || 'A').toUpperCase() === 'B').length;
  }, [dispatchedRecords]);

  const gradeARate = useMemo(() => {
    if (dispatchedRecords.length === 0) return '100.0';
    return ((gradeACount / dispatchedRecords.length) * 100).toFixed(1);
  }, [gradeACount, dispatchedRecords.length]);

  const hasActiveFilters = Boolean(searchTerm.trim() || productFilter !== 'ALL' || gradeFilter !== 'ALL');

  const handleResetFilters = () => {
    setSearchTerm('');
    setProductFilter('ALL');
    setGradeFilter('ALL');
  };

  const handleCopyReel = (rNo: string) => {
    navigator.clipboard.writeText(rNo);
    setCopiedId(rNo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Dispatched Reels */}
        <div className="neumorphic-card rounded-2xl p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Dispatched Reels</span>
            <PackageCheck className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {timeframe === 'all' ? dispatchedRecords.length : timeframeRecords.length}
          </p>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
            {timeframe === 'all' ? 'All-Time Dispatches' : `${timeframeLabel} (${dispatchedRecords.length} Total)`}
          </span>
        </div>

        {/* Card 2: Dispatched Weight */}
        <div className="neumorphic-card rounded-2xl p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Dispatched Weight</span>
            <Layers className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {totalDispatchedKg.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-bold">kg</span>
          </p>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
            {(totalDispatchedKg / 1000).toFixed(2)} MT Net Tonnage
          </span>
        </div>

        {/* Card 3: Linked Challans */}
        <div className="neumorphic-card rounded-2xl p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Linked Challans</span>
            <Truck className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
            {uniqueChallansCount}
          </p>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
            Confirmed Delivery Gate Passes
          </span>
        </div>

        {/* Card 4: Grade A Quality */}
        <div className="neumorphic-card rounded-2xl p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Grade A Quality</span>
            <Award className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1">
            {gradeARate}%
          </p>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
            {gradeACount} Grade A / {gradeBCount} Grade B
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="neumorphic-card rounded-3xl p-3.5 sm:p-6 shadow-sm space-y-4">
        
        {/* Search & Filter Toolbar */}
        <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          
          {/* Row 1: Search Input + Counter + Filter Pop-up Trigger + Reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex items-center gap-2.5 flex-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 shadow-2xs">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search dispatched reel no, product, challan no, customer, vehicle..."
                className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
              <div className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold font-mono">
                {filteredRecords.length} / {dispatchedRecords.length} Reels
              </div>

              {/* Pop-up Filter Button */}
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border shadow-2xs shrink-0 ${
                  productFilter !== 'ALL' || gradeFilter !== 'ALL'
                    ? 'bg-[#5E3BE8] text-white border-[#5E3BE8] shadow-md shadow-[#5E3BE8]/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title="Filter by Product or QC Grade"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters</span>
                {(productFilter !== 'ALL' || gradeFilter !== 'ALL') && (
                  <span className="w-4 h-4 rounded-full bg-white text-[#5E3BE8] text-[10px] font-black flex items-center justify-center ml-0.5">
                    {(productFilter !== 'ALL' ? 1 : 0) + (gradeFilter !== 'ALL' ? 1 : 0)}
                  </span>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300 font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 border border-red-200 dark:border-red-800/60 shrink-0 shadow-2xs"
                  title="Reset all search and filters"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Chips (Shown compactly only when filters are active) */}
          {(productFilter !== 'ALL' || gradeFilter !== 'ALL') && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Active:
              </span>
              {productFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-[#5E3BE8] dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold">
                  <span>Product: {productFilter}</span>
                  <button
                    type="button"
                    onClick={() => setProductFilter('ALL')}
                    className="hover:text-red-500 cursor-pointer p-0.5"
                    title="Remove product filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {gradeFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                  <span>Grade: {gradeFilter}</span>
                  <button
                    type="button"
                    onClick={() => setGradeFilter('ALL')}
                    className="hover:text-red-500 cursor-pointer p-0.5"
                    title="Remove grade filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer ml-1"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Filter Pop-up Modal */}
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white dark:bg-[#11192e] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-[#5E3BE8]" />
                  <span>Filter Dispatched Reels</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                
                {/* Product Filter Section */}
                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider block mb-2.5">
                    Filter by Product
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                    <button
                      type="button"
                      onClick={() => setProductFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        productFilter === 'ALL'
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      All Products ({dispatchedRecords.length})
                    </button>
                    {uniqueProducts.map(p => {
                      const count = getProductCount(p);
                      const isSelected = productFilter === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setProductFilter(p)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#5E3BE8] text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span>{p}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                              isSelected
                                ? 'bg-white/25 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* QC Grade Filter Section */}
                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider block mb-2.5">
                    Filter by QC Grade
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setGradeFilter('ALL')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                        gradeFilter === 'ALL'
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      All ({dispatchedRecords.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setGradeFilter('A')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                        gradeFilter === 'A'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      Grade A ({gradeACount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setGradeFilter('B')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                        gradeFilter === 'B'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      Grade B ({gradeBCount})
                    </button>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#5E3BE8] hover:bg-[#4E27E0] text-white text-xs font-bold shadow-md shadow-[#5E3BE8]/20 transition cursor-pointer"
                >
                  Apply Filters ({filteredRecords.length})
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Mobile View: Zero-Horizontal-Scroll Responsive Reel Cards */}
        <div className="block md:hidden space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              <PackageCheck className="h-8 w-8 mx-auto mb-2 text-slate-500 opacity-50" />
              <span>No dispatched reels match the current search or filters.</span>
            </div>
          ) : (
            filteredRecords.map((rec, idx) => (
              <div
                key={`${rec.reel.reelNo}_${rec.challanNo}_${idx}`}
                className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 space-y-2.5 transition shadow-2xs"
              >
                {/* Top: Reel ID + QC Grade + Weight + Challan */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {rec.reel.reelNo}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyReel(rec.reel.reelNo)}
                      title="Copy Reel ID"
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                    >
                      {copiedId === rec.reel.reelNo ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        (rec.reel.qcGrade || 'A').toUpperCase() === 'B'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      Grade {rec.reel.qcGrade || 'A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                      {rec.reel.weight} kg
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">
                      <Truck className="h-2.5 w-2.5 text-slate-400" />
                      <span>{rec.challanNo}</span>
                    </span>
                  </div>
                </div>

                {/* Middle: Product Specs */}
                <div className="bg-white dark:bg-slate-800/80 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800">
                  <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                    {rec.reel.product}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {rec.reel.gsm} GSM • {rec.reel.size} mm • {rec.reel.ply || 2} Ply
                  </div>
                </div>

                {/* Bottom: Party, Vehicle, Date & Action */}
                <div className="flex items-center justify-between gap-2 pt-0.5 text-[10.5px] text-slate-600 dark:text-slate-400">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1 truncate font-semibold text-slate-800 dark:text-slate-200" title={rec.partyName}>
                      <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{rec.partyName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[9.5px] text-slate-500">
                      <span>{rec.vehicleNo}</span>
                      <span>•</span>
                      <span>{rec.dispatchDate}</span>
                    </div>
                  </div>

                  {rec.slip ? (
                    <button
                      type="button"
                      onClick={() => onViewChallan(rec.slip!)}
                      className="shrink-0 px-2.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-[10px] uppercase tracking-wider shadow-xs transition cursor-pointer inline-flex items-center gap-1 active:scale-95"
                      title={isViewer ? 'View Delivery Challan' : 'View & Print Challan PDF'}
                    >
                      {isViewer ? <Eye className="h-3 w-3" /> : <Printer className="h-3 w-3" />}
                      <span>{isViewer ? 'View' : 'PDF'}</span>
                    </button>
                  ) : (
                    <span className="text-[9px] text-slate-400 italic">Direct</span>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        {/* Desktop View: Clean Spacious Ledger Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-bold tracking-wider bg-slate-50/70 dark:bg-slate-900/40">
                <th className="py-3.5 px-4 font-semibold">Reel No</th>
                <th className="py-3.5 px-4 font-semibold">Product &amp; Specs</th>
                <th className="py-3.5 px-4 font-semibold font-mono">Weight</th>
                <th className="py-3.5 px-4 font-semibold">Challan</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Vehicle</th>
                <th className="py-3.5 px-4 font-semibold">Date</th>
                <th className="py-3.5 px-4 font-semibold text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400 font-medium">
                    <PackageCheck className="h-8 w-8 mx-auto mb-2 text-slate-500 opacity-50" />
                    <span>No dispatched reels match the current search or filters.</span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  return (
                    <tr key={`${rec.reel.reelNo}_${rec.challanNo}_${idx}`} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* Reel No */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                            {rec.reel.reelNo}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyReel(rec.reel.reelNo)}
                            title="Copy Reel ID"
                            className="p-1 text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-200 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            {copiedId === rec.reel.reelNo ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Product Specs */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-tight">
                            {rec.reel.product}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            {rec.reel.gsm} GSM &bull; {rec.reel.size} mm &bull; {rec.reel.ply || 2} Ply
                          </span>
                        </div>
                      </td>

                      {/* Weight */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {Number(rec.reel.weight).toLocaleString()} kg
                      </td>

                      {/* Challan No */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold text-[11px]">
                          {rec.challanNo}
                        </span>
                      </td>

                      {/* Customer / Party */}
                      <td className="py-3.5 px-4 max-w-[180px] truncate" title={rec.partyName}>
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-xs truncate block">
                          {rec.partyName}
                        </span>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {rec.vehicleNo}
                      </td>

                      {/* Dispatch Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {rec.dispatchDate}
                      </td>

                      {/* Actions: PDF Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {rec.slip ? (
                          <button
                            type="button"
                            onClick={() => onViewChallan(rec.slip!)}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-[#5E3BE8] text-[#5E3BE8] hover:text-white dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-[#5E3BE8] dark:hover:text-white border border-purple-200/80 dark:border-purple-800/80 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95 shadow-2xs"
                            title={isViewer ? "View Delivery Challan" : "View & Print Challan PDF"}
                          >
                            <FileText className="h-3 w-3" />
                            <span>PDF</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            Direct
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
