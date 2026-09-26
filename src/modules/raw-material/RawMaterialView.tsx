import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  getRawMaterials,
  updateRawMaterialStock,
  getVendors,
  getRawMaterialLots,
} from '../../data/index';
import type { RawMaterialCategory, RawMaterialItem, RawMaterialLot } from '../../data/types';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { DataFilterBar } from '../../components/DataFilterBar';
import { CustomSearchableSelect } from '../../components/CustomSearchableSelect';
import type { FilterField } from '../../components/DataFilterBar';
import {
  Warehouse,
  Plus,
  Search,
  ListFilter,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Boxes,
  ArrowUpRight,
  Filter,
  X,
  Calendar,
  ChevronDown,
  Lock,
  Loader2,
} from 'lucide-react';
import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';
import { useDataSync } from '../../hooks/useDataSync';
import { MobileToast, type ToastMessage } from '../../components/MobileToast';

export const RawMaterialView: React.FC = () => {
  const { user, isViewer } = useAuth();
  const { t } = useTranslation();
  const { timeframe, selectedDate } = useDateFilter();

  const syncTick = useDataSync(['raw_materials', 'raw_material_stock', 'raw_material_lots']);
  const [materials, setMaterials] = useState<RawMaterialItem[]>(() => getRawMaterials());
  const [lots, setLots] = useState<RawMaterialLot[]>(() => getRawMaterialLots());

  useEffect(() => {
    setMaterials(getRawMaterials());
    setLots(getRawMaterialLots());
  }, [syncTick]);
  const [rmSearchQuery, setRmSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const vendors = getVendors();

  // Inward Lots filter states
  const [lotSearchQuery, setLotSearchQuery] = useState('');
  const [lotDateFrom, setLotDateFrom] = useState('');
  const [lotDateTo, setLotDateTo] = useState('');
  const [lotVendorFilter, setLotVendorFilter] = useState('all');
  const [lotMaterialFilter, setLotMaterialFilter] = useState('all');

  // Mobile Toast & Submitting State
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightedLotNo, setHighlightedLotNo] = useState<string | null>(null);

  // Inward Form States
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [qtyStr, setQtyStr] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [inwardRemarks, setInwardRemarks] = useState('');
  const [inwardSuccess, setInwardSuccess] = useState('');
  const [inwardError, setInwardError] = useState('');

  // Custom Searchable Picker Dropdown States
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const selectedMaterial = useMemo(() => {
    return materials.find(m => m.id === selectedMaterialId);
  }, [materials, selectedMaterialId]);

  const filteredPickerMaterials = useMemo(() => {
    const q = pickerSearch.toLowerCase().trim();
    if (!q) return materials;
    return materials.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  }, [materials, pickerSearch]);

  // Category filter map
  const categoryFilterMap: Record<string, RawMaterialCategory | 'ALL'> = {
    all: 'ALL',
    waste_paper: 'WASTE_PAPER',
    other_raw_material: 'OTHER_RAW_MATERIAL',
    chemical: 'CHEMICAL',
    firewood: 'FIREWOOD',
  };

  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setInwardError('');
    setInwardSuccess('');

    if (isViewer) {
      setToast({
        type: 'error',
        title: 'Action Locked',
        message: 'Viewer Mode: Inward stock addition is locked (Read-Only).',
      });
      return;
    }

    if (!selectedMaterialId || !qtyStr || !selectedVendorId) {
      setToast({
        type: 'warning',
        title: 'Incomplete Entry',
        message: 'Please select raw material item, supplier vendor, and enter inward quantity.',
      });
      return;
    }

    const qty = parseFloat(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      setToast({
        type: 'warning',
        title: 'Invalid Quantity',
        message: 'Inward quantity must be a positive number.',
      });
      return;
    }

    const material = materials.find(m => m.id === selectedMaterialId);
    const vendor = vendors.find(v => v.id === selectedVendorId);

    if (material && vendor) {
      try {
        setIsSubmitting(true);
        const success = updateRawMaterialStock(material.id, qty, user?.displayName || 'System', vendor.name);
        if (success) {
          const freshLots = getRawMaterialLots();
          setMaterials(getRawMaterials());
          setLots(freshLots);

          const newestLot = freshLots[0]?.lotNo || freshLots[freshLots.length - 1]?.lotNo;
          if (newestLot) {
            setHighlightedLotNo(newestLot);
            setTimeout(() => setHighlightedLotNo(null), 4500);
          }

          setToast({
            type: 'success',
            title: 'Inward Stock Logged Successfully',
            message: `Added ${qty.toLocaleString()} kg of ${material.name} from ${vendor.name}. Stock updated in real-time.`,
            duration: 3500,
          });

          // Reset form
          setSelectedMaterialId('');
          setQtyStr('');
          setSelectedVendorId('');
          setInwardRemarks('');
          setIsMaterialDropdownOpen(false);
          setPickerSearch('');
        } else {
          setToast({
            type: 'error',
            title: 'Stock Update Failed',
            message: 'An error occurred while updating raw material inventory.',
          });
        }
      } catch (err: any) {
        setToast({
          type: 'error',
          title: 'Stock Update Error',
          message: err.message || 'Failed to record inward stock entry.',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(rmSearchQuery.toLowerCase());
      const selectedCatEnum = categoryFilterMap[selectedCategory];
      const matchesCategory = selectedCatEnum === 'ALL' || m.category === selectedCatEnum;
      return matchesSearch && matchesCategory;
    });
  }, [materials, rmSearchQuery, selectedCategory]);

  // Dynamic KPI Metrics
  const totalStockKg = useMemo(() => materials.reduce((acc, m) => acc + m.stock, 0), [materials]);
  const wastePaperStockKg = useMemo(() => materials.filter(m => m.category === 'WASTE_PAPER').reduce((acc, m) => acc + m.stock, 0), [materials]);
  const chemicalStockKg = useMemo(() => materials.filter(m => m.category === 'CHEMICAL').reduce((acc, m) => acc + m.stock, 0), [materials]);
  const firewoodStockKg = useMemo(() => materials.filter(m => m.category === 'FIREWOOD').reduce((acc, m) => acc + m.stock, 0), [materials]);
  const otherStockKg = useMemo(() => materials.filter(m => m.category === 'OTHER_RAW_MATERIAL').reduce((acc, m) => acc + m.stock, 0), [materials]);

  const timeframeLots = useMemo(() => {
    return lots.filter(l => isDateInTimeframe(l.date, selectedDate, timeframe));
  }, [lots, selectedDate, timeframe]);

  const timeframeInwardKg = useMemo(() => {
    return timeframeLots.reduce((sum, l) => sum + (l.weight || 0), 0);
  }, [timeframeLots]);

  const lowStockCount = useMemo(() => {
    return materials.filter(m => m.stock <= m.minThreshold).length;
  }, [materials]);

  const timeframeLabel = useMemo(() => {
    if (timeframe === 'day') return `For Day (${selectedDate})`;
    if (timeframe === 'week') return 'Weekly Inward Window';
    if (timeframe === 'month') return `Month (${selectedDate.substring(0, 7)})`;
    return 'All-Time Inward Receipts';
  }, [timeframe, selectedDate]);

  // Helper for stock status color styling
  const getStockStatus = (stock: number, min: number) => {
    if (stock <= min * 0.5) {
      return {
        label: 'Critical Low',
        colorClass: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800',
        barColor: 'bg-gradient-to-r from-red-500 to-rose-600',
        dotClass: 'bg-red-500 animate-pulse',
      };
    } else if (stock <= min) {
      return {
        label: 'Low Stock',
        colorClass: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700',
        barColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
        dotClass: 'bg-amber-500',
      };
    } else {
      return {
        label: 'In Stock',
        colorClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800',
        barColor: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        dotClass: 'bg-emerald-500',
      };
    }
  };

  return (
    <div className="space-y-6">

      {/* Top Row: Total Raw Stock (Left) + Add Purchase Inward Shipment (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-stretch">
        
        {/* 1. LEFT CARD: TOTAL RAW STOCK */}
        <div className="lg:col-span-4 neumorphic-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Boxes className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Total Raw Stock
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase border border-blue-200 dark:border-blue-800">
                {materials.length} Items
              </span>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                {(totalStockKg / 1000).toLocaleString('en-IN', { maximumFractionDigits: 1 })} <span className="text-lg font-bold text-slate-400">Tons</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {(totalStockKg).toLocaleString()} kg across {materials.length} items
              </p>
            </div>
          </div>

          {/* Category Breakdown Mini Details */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Category Breakdown
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-medium">Waste Paper</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {(wastePaperStockKg / 1000).toFixed(1)} <span className="text-[10px] text-slate-400">T</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-medium">Chemicals</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {(chemicalStockKg / 1000).toFixed(1)} <span className="text-[10px] text-slate-400">T</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-medium">Firewood</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {(firewoodStockKg / 1000).toFixed(1)} <span className="text-[10px] text-slate-400">T</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-medium">Other Stock</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {(otherStockKg / 1000).toFixed(1)} <span className="text-[10px] text-slate-400">T</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. RIGHT CARD: ADD PURCHASE INWARD SHIPMENT (Direct Fast Inline Form) */}
        <div className="lg:col-span-8 neumorphic-card p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Plus className="h-4 w-4" />}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                  Add Purchase Inward Shipment
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Log incoming truck deliveries &amp; auto-update stock records
                </p>
              </div>
            </div>
            {isViewer && (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <Lock className="h-3 w-3" /> Viewer (Read-Only)
              </span>
            )}
          </div>

          {inwardError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-800 font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{inwardError}</span>
            </div>
          )}

          {inwardSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{inwardSuccess}</span>
            </div>
          )}

          <form onSubmit={handleInwardSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* RAW MATERIAL ITEM PICKER */}
              <div className="relative">
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  RAW MATERIAL ITEM
                </label>
                <button
                  type="button"
                  onClick={() => setIsMaterialDropdownOpen(!isMaterialDropdownOpen)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold dark:text-white flex items-center justify-between gap-2 text-left cursor-pointer focus:ring-2 focus:ring-blue-500 transition shadow-2xs"
                >
                  {selectedMaterial ? (
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="font-black text-slate-900 dark:text-white truncate">{selectedMaterial.name}</span>
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                        {selectedMaterial.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-normal">Select Raw Material Item...</span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isMaterialDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMaterialDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#091124] border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-2xl z-50 p-2.5 space-y-2 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={pickerSearch}
                        onChange={e => setPickerSearch(e.target.value)}
                        placeholder="Type to search material..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white focus:outline-none placeholder:text-slate-400"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1">
                      {filteredPickerMaterials.length > 0 ? (
                        filteredPickerMaterials.map(m => {
                          const isSelected = m.id === selectedMaterialId;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedMaterialId(m.id);
                                setIsMaterialDropdownOpen(false);
                                setPickerSearch('');
                              }}
                              className={`w-full p-2 rounded-xl text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                                isSelected
                                  ? 'bg-primary text-white font-bold shadow-xs'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold truncate">{m.name}</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}>
                                  {m.category.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <span className={`text-[11px] font-mono shrink-0 font-bold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                {m.stock >= 1000 ? `${(m.stock / 1000).toFixed(1)} Tons` : `${m.stock} kg`}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No matching items found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SUPPLIER / VENDOR */}
              <CustomSearchableSelect
                label="SUPPLIER / VENDOR *"
                placeholder="Select Supplier Vendor..."
                value={selectedVendorId}
                onChange={setSelectedVendorId}
                options={vendors.map(v => ({
                  value: v.id,
                  label: v.name,
                  sublabel: v.address,
                  badge: 'Vendor',
                  badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                }))}
                required
              />

              {/* INWARD QUANTITY */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  INWARD QUANTITY (KG)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  placeholder="e.g. 5000"
                  value={qtyStr}
                  onChange={e => setQtyStr(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold dark:text-white focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                  required
                />
              </div>

              {/* REMARKS / TRUCK INVOICE */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  REMARKS / TRUCK INVOICE NO.
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inv-4092, Truck GJ-05-BY-1234"
                  value={inwardRemarks}
                  onChange={e => setInwardRemarks(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isViewer || isSubmitting}
                title={isViewer ? 'Viewer Mode: Adding inward shipment is locked (Read-Only)' : 'Confirm Inward'}
                className={`w-full sm:w-auto px-8 py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl font-black transition ${
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
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>
                  {isSubmitting
                    ? 'Confirming Inward Stock...'
                    : isViewer
                    ? 'Confirm Inward (Locked)'
                    : 'Confirm Inward'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Stock Table Container */}
      <div className="neumorphic-card p-6 space-y-5">
        
        {/* Category Filters Chips & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="h-3.5 w-3.5" /> Category:
            </span>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'waste_paper', label: 'Waste Paper' },
              { id: 'chemical', label: 'Chemicals' },
              { id: 'firewood', label: 'Firewood' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-2 flex items-center gap-2 w-full md:w-64">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={rmSearchQuery}
              onChange={e => setRmSearchQuery(e.target.value)}
              placeholder="Search raw material item..."
              className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
            />
          </div>
        </div>

        {/* Stock Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                <th className="py-3 px-3">Material Item</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Available Stock</th>
                <th className="py-3 px-3">Minimum Stock (kg)</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400 font-medium">
                    No raw material items match your category or search.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map(item => {
                  const status = getStockStatus(item.stock, item.minThreshold);
                  const percentage = Math.min(100, Math.round((item.stock / (item.minThreshold * 2)) * 100));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap inline-flex items-center">
                          {item.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {item.stock >= 1000 ? `${(item.stock / 1000).toFixed(2)} Tons (${item.stock} kg)` : `${item.stock} kg`}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {item.minThreshold} kg
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border whitespace-nowrap shadow-2xs ${status.colorClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass || 'bg-current'}`} />
                          <span>{status.label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Inward Lots History Table */}
      <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Recent Purchase Inward Receipts Log
          </h3>
          <div className="flex items-center gap-2">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-2 flex items-center gap-2 w-full md:w-48">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={lotSearchQuery}
                onChange={e => setLotSearchQuery(e.target.value)}
                placeholder="Search lot, item..."
                className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
              />
            </div>
            <DataFilterBar
              dateFrom={lotDateFrom}
              dateTo={lotDateTo}
              onDateFromChange={setLotDateFrom}
              onDateToChange={setLotDateTo}
              filterFields={[
                { id: 'vendor', label: 'Vendor', options: vendors.map(v => ({ label: v.name, value: v.name })) },
                { id: 'material', label: 'Material', options: [...new Set(lots.map(l => l.materialName || ''))].filter(Boolean).map(n => ({ label: n, value: n })) },
              ]}
              activeFilters={{ vendor: lotVendorFilter, material: lotMaterialFilter }}
              onFilterChange={(fieldId, value) => {
                if (fieldId === 'vendor') setLotVendorFilter(value);
                if (fieldId === 'material') setLotMaterialFilter(value);
              }}
              onClearAll={() => { setLotDateFrom(''); setLotDateTo(''); setLotVendorFilter('all'); setLotMaterialFilter('all'); }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                <th className="py-3 px-3">Lot ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Item Name</th>
                <th className="py-3 px-3">Supplier Vendor</th>
                <th className="py-3 px-3 font-mono">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {(() => {
                let filteredLots = lots;
                if (timeframe && selectedDate) {
                  filteredLots = filteredLots.filter(l => isDateInTimeframe(l.date, selectedDate, timeframe));
                }
                const lq = lotSearchQuery.toLowerCase().trim();
                if (lq) filteredLots = filteredLots.filter(l => (l.lotNo || '').toLowerCase().includes(lq) || (l.materialName || '').toLowerCase().includes(lq) || (l.vendorName || '').toLowerCase().includes(lq));
                if (lotDateFrom) filteredLots = filteredLots.filter(l => l.date >= lotDateFrom);
                if (lotDateTo) filteredLots = filteredLots.filter(l => l.date <= lotDateTo);
                if (lotVendorFilter && lotVendorFilter !== 'all') filteredLots = filteredLots.filter(l => l.vendorName === lotVendorFilter);
                if (lotMaterialFilter && lotMaterialFilter !== 'all') filteredLots = filteredLots.filter(l => l.materialName === lotMaterialFilter);

                // Sort Recent > Past (Newest items on top)
                const sortedLots = [...filteredLots].sort((a, b) => {
                  const dateCompare = (b.date || '').localeCompare(a.date || '');
                  if (dateCompare !== 0) return dateCompare;
                  return (b.lotNo || '').localeCompare(a.lotNo || '');
                });

                return sortedLots.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-slate-400 font-medium">
                      No inward receipt lots match your filters.
                    </td>
                  </tr>
                ) : (
                  sortedLots.map(lot => {
                    const item = materials.find(m => m.id === lot.materialId);
                    const isHighlighted = highlightedLotNo === lot.lotNo;
                    return (
                      <tr
                        key={lot.lotNo}
                        className={`transition duration-150 ${
                          isHighlighted
                            ? 'bg-purple-50/90 dark:bg-purple-950/40 ring-2 ring-primary/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-primary dark:text-blue-400 flex items-center gap-1.5">
                          <span>{lot.lotNo}</span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.2 rounded bg-primary text-white text-[9px] font-bold uppercase animate-pulse">
                              ✓ New
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">
                          {lot.date}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {lot.materialName || item?.name || 'Raw Material Item'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {lot.vendorName}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {lot.weight} kg
                        </td>
                      </tr>
                    );
                  })
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Floating Toast */}
      <MobileToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
