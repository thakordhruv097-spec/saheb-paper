import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getStoreItems, saveStoreItem, deleteStoreItem } from '../../data/index';
import type { StoreItem } from '../../data/types';
import { Settings, Plus, Warehouse, Disc, Search, ListFilter, Lock, Loader2, MoreVertical, Eye, Pencil, Trash2, X } from 'lucide-react';
import { useDataSync } from '../../hooks/useDataSync';
import { useMobileBackHandler } from '../../hooks/useMobileBackHandler';
import { MobileToast, type ToastMessage } from '../../components/MobileToast';

export const StoreView: React.FC = () => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();

  const syncTick = useDataSync(['store_items', 'spares_store', 'spareparts_management']);
  const [items, setItems] = useState<StoreItem[]>(() => getStoreItems());

  useEffect(() => {
    setItems(getStoreItems());
  }, [syncTick]);
  const [activeTab, setActiveTab] = useState<'bearings' | 'vbelts'>('bearings');

  // Mobile Toast & Submitting States
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // 1. Add Bearing States
  const [bearingNo, setBearingNo] = useState('');
  const [bearingPcs, setBearingPcs] = useState('');
  const [bearingUsage, setBearingUsage] = useState('');

  // 2. Add V-Belt States
  const [beltSize, setBeltSize] = useState('');
  const [beltPcs, setBeltPcs] = useState('');
  const [beltTarget, setBeltTarget] = useState('');
  const [beltMinStock, setBeltMinStock] = useState('5');
  const [beltRemarks, setBeltRemarks] = useState('');

  // Row Action Menu & Modal States
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const [viewingItem, setViewingItem] = useState<StoreItem | null>(null);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useMobileBackHandler(!!viewingItem, () => setViewingItem(null), 'storeViewItem');
  useMobileBackHandler(!!editingItem, () => setEditingItem(null), 'storeEditItem');

  const handleOpenMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (openMenuFor === id) {
      setOpenMenuFor(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 150;

      if (spaceBelow < menuHeight && rect.top > menuHeight) {
        setMenuPos({
          bottom: window.innerHeight - rect.top + 4,
          right: window.innerWidth - rect.right,
        });
      } else {
        setMenuPos({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        });
      }
      setOpenMenuFor(id);
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuFor(null);
      }
    }
    if (openMenuFor) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuFor]);

  const handleAddBearing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isViewer) {
      setToast({
        type: 'error',
        title: 'Action Locked',
        message: 'Viewer Mode: Adding store items is locked (Read-Only).',
      });
      return;
    }

    if (!bearingNo || !bearingPcs || !bearingUsage) {
      setToast({
        type: 'warning',
        title: 'Incomplete Entry',
        message: 'Please provide bearing number, pieces, and target machine area.',
      });
      return;
    }

    const pcs = parseInt(bearingPcs);
    if (isNaN(pcs) || pcs < 0) {
      setToast({
        type: 'warning',
        title: 'Invalid Quantity',
        message: 'Pieces must be a valid positive number.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const newItem: StoreItem = {
        id: `st-${Date.now()}`,
        type: 'BEARING',
        name: bearingNo.trim(),
        pcs,
        usageArea: bearingUsage.trim(),
        minStock: 4,
      };

      saveStoreItem(newItem, user?.displayName || 'System');
      setItems(getStoreItems());
      setHighlightedItemId(newItem.id);
      setTimeout(() => setHighlightedItemId(null), 4500);

      setToast({
        type: 'success',
        title: 'Bearing Added Successfully',
        message: `Bearing ${bearingNo} (${pcs} pcs) added to plant spares ledger.`,
        duration: 3500,
      });

      setBearingNo('');
      setBearingPcs('');
      setBearingUsage('');
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Failed to Add Bearing',
        message: err.message || 'Error saving bearing to ledger.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddVBelt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isViewer) {
      setToast({
        type: 'error',
        title: 'Action Locked',
        message: 'Viewer Mode: Adding store items is locked (Read-Only).',
      });
      return;
    }

    if (!beltSize.trim() || !beltPcs.trim()) {
      setToast({
        type: 'warning',
        title: 'Incomplete Entry',
        message: 'V-Belt size code and quantity are required.',
      });
      return;
    }

    const pcs = parseInt(beltPcs);
    if (isNaN(pcs) || pcs < 0) {
      setToast({
        type: 'warning',
        title: 'Invalid Quantity',
        message: 'Pieces must be a valid positive number.',
      });
      return;
    }

    const minStock = parseInt(beltMinStock);

    try {
      setIsSubmitting(true);
      const newItem: StoreItem = {
        id: `st-${Date.now()}`,
        type: 'V_BELT',
        name: beltSize.trim(),
        pcs,
        targetMachine: beltTarget.trim() || 'General Plant Machine',
        minStock: !isNaN(minStock) && minStock >= 0 ? minStock : 5,
        remarks: beltRemarks.trim() || '-',
      };

      saveStoreItem(newItem, user?.displayName || 'System');
      setItems(getStoreItems());
      setHighlightedItemId(newItem.id);
      setTimeout(() => setHighlightedItemId(null), 4500);

      setToast({
        type: 'success',
        title: 'V-Belt Added Successfully',
        message: `V-Belt ${beltSize} (${pcs} pcs) added to plant spares ledger.`,
        duration: 3500,
      });

      setBeltSize('');
      setBeltPcs('');
      setBeltTarget('');
      setBeltMinStock('5');
      setBeltRemarks('');
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Failed to Add V-Belt',
        message: err.message || 'Error saving V-belt to ledger.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = (item: StoreItem) => {
    if (isViewer) {
      setToast({
        type: 'error',
        title: 'Action Locked',
        message: 'Viewer Mode: Deleting store items is locked (Read-Only).',
      });
      return;
    }

    const typeLabel = item.type === 'BEARING' ? 'Bearing' : 'V-Belt';
    if (!window.confirm(`Are you sure you want to delete ${typeLabel} "${item.name}"?`)) {
      return;
    }

    try {
      deleteStoreItem(item.id, user?.displayName || 'System');
      setItems(getStoreItems());
      setToast({
        type: 'success',
        title: 'Item Deleted',
        message: `${typeLabel} ${item.name} removed from spares inventory.`,
        duration: 3500,
      });
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Error deleting item from inventory.',
      });
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      setToast({
        type: 'error',
        title: 'Action Locked',
        message: 'Viewer Mode: Editing store items is locked (Read-Only).',
      });
      return;
    }
    if (!editingItem) return;

    if (!editingItem.name.trim()) {
      setToast({
        type: 'warning',
        title: 'Missing Required Field',
        message: 'Item name / code cannot be empty.',
      });
      return;
    }

    if (editingItem.pcs < 0 || isNaN(editingItem.pcs)) {
      setToast({
        type: 'warning',
        title: 'Invalid Quantity',
        message: 'Stock pieces must be 0 or a positive number.',
      });
      return;
    }

    try {
      saveStoreItem(editingItem, user?.displayName || 'System');
      setItems(getStoreItems());
      setHighlightedItemId(editingItem.id);
      setTimeout(() => setHighlightedItemId(null), 4500);
      setToast({
        type: 'success',
        title: 'Item Updated',
        message: `${editingItem.name} details saved successfully.`,
        duration: 3500,
      });
      setEditingItem(null);
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Error updating item in ledger.',
      });
    }
  };

  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  const filteredBearings = useMemo(() => {
    const list = items.filter(i => i.type === 'BEARING');
    if (!storeSearchQuery.trim()) return list;
    const q = storeSearchQuery.toLowerCase().trim();
    return list.filter(item => 
      item.name.toLowerCase().includes(q) ||
      (item.usageArea && item.usageArea.toLowerCase().includes(q)) ||
      (item.remarks && item.remarks.toLowerCase().includes(q))
    );
  }, [items, storeSearchQuery]);

  const filteredBelts = useMemo(() => {
    const list = items.filter(i => i.type === 'V_BELT');
    if (!storeSearchQuery.trim()) return list;
    const q = storeSearchQuery.toLowerCase().trim();
    return list.filter(item => 
      item.name.toLowerCase().includes(q) ||
      (item.targetMachine && item.targetMachine.toLowerCase().includes(q)) ||
      (item.remarks && item.remarks.toLowerCase().includes(q)) ||
      (item.usageArea && item.usageArea.toLowerCase().includes(q))
    );
  }, [items, storeSearchQuery]);

  const bearingsList = useMemo(() => items.filter(i => i.type === 'BEARING'), [items]);
  const vbeltsList = useMemo(() => items.filter(i => i.type === 'V_BELT'), [items]);
  const totalBearingsStock = useMemo(() => bearingsList.reduce((acc, b) => acc + b.pcs, 0), [bearingsList]);
  const totalVbeltsStock = useMemo(() => vbeltsList.reduce((acc, v) => acc + v.pcs, 0), [vbeltsList]);
  const lowStockSparesCount = useMemo(() => items.filter(i => i.pcs <= (i.minStock || 5)).length, [items]);

  // Reusable 3-dots action dropdown menu component
  const renderActionMenu = (item: StoreItem) => {
    const isMenuOpen = openMenuFor === item.id;
    return (
      <div className={`inline-block text-left ${isMenuOpen ? 'relative z-50' : 'relative'}`}>
        <button
          onClick={(e) => handleOpenMenu(e, item.id)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg p-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Item Actions"
          aria-label="Item Actions"
        >
          <MoreVertical size={16} />
        </button>
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-[0.5px] z-40"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuFor(null);
              }}
            />
            <div
              ref={menuRef}
              style={{
                position: 'fixed',
                top: menuPos?.top !== undefined ? `${menuPos.top}px` : undefined,
                bottom: menuPos?.bottom !== undefined ? `${menuPos.bottom}px` : undefined,
                right: menuPos?.right !== undefined ? `${menuPos.right}px` : undefined,
              }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-1.5 w-44 z-[9999] text-left font-sans animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setViewingItem(item); setOpenMenuFor(null); }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
              >
                <Eye size={14} className="text-slate-500 shrink-0" />
                <span>View Details</span>
              </button>
              <button
                onClick={() => { setEditingItem({ ...item }); setOpenMenuFor(null); }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
              >
                <Pencil size={14} className="text-slate-500 shrink-0" />
                <span>Edit Item</span>
              </button>
              <button
                onClick={() => { handleDeleteItem(item); setOpenMenuFor(null); }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition cursor-pointer border-t border-slate-100 dark:border-slate-700/50"
              >
                <Trash2 size={14} className="text-red-500 shrink-0" />
                <span>Delete Item</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* 1. CLEAN MINIMAL HEADER CARD */}
      <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
              <Warehouse className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                  Store Spares &amp; Inventory Control
                </h1>
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold">
                  Store Ledger
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Maintain stock ledger levels for engineering spares (Bearings and V-Belts).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP METRIC SCORECARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <Warehouse className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Spares Stock</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{(totalBearingsStock + totalVbeltsStock).toLocaleString()} <span className="text-xs text-slate-400 font-normal">units</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
            <Disc className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Spares</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{lowStockSparesCount} <span className="text-xs text-slate-400 font-normal">items</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registry Types</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">2 <span className="text-xs text-slate-400 font-normal">categories</span></p>
          </div>
        </div>
      </div>

      {/* 3. SUBTAB PILLS */}
      <div className="flex bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 max-w-max gap-1">
        <button
          onClick={() => { setActiveTab('bearings'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'bearings'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Disc className="h-4 w-4" />
          <span>Bearings Spares Registry</span>
        </button>
        <button
          onClick={() => { setActiveTab('vbelts'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'vbelts'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>V-Belts Spares Registry</span>
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left List Pane (2/3 width) */}
        <div className="lg:col-span-2 neumorphic-card p-6 space-y-4">
          
          {/* Live Search Box */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 flex items-center gap-3">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={storeSearchQuery}
              onChange={e => setStoreSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab === 'bearings' ? 'bearings by number or usage area' : 'V-Belts by size, machine, or remarks'}...`}
              className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
            />
            <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
              <ListFilter className="h-4 w-4" />
            </div>
          </div>

          {/* Bearings List */}
          {activeTab === 'bearings' && (
            <div className="space-y-4">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                      <th className="py-3 px-3">Bearing Number</th>
                      <th className="py-3 px-3">Pcs In Stock</th>
                      <th className="py-3 px-3">Target Machine Area</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                    {filteredBearings.map(item => {
                      const isHighlighted = highlightedItemId === item.id;
                      return (
                        <tr
                          key={item.id}
                          className={`transition duration-150 ${
                            isHighlighted
                              ? 'bg-purple-50/90 dark:bg-purple-950/40 ring-2 ring-primary/40'
                              : 'hover:bg-blue-50/50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {isHighlighted && (
                              <span className="px-1.5 py-0.2 rounded bg-primary text-white text-[8px] font-bold uppercase animate-pulse">
                                ✓ New
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">{item.pcs} pcs</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{item.usageArea || '-'}</td>
                          <td className="py-3 px-3 text-right">
                            {renderActionMenu(item)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Cards */}
              <div className="block md:hidden space-y-3">
                {filteredBearings.map(item => {
                  const isHighlighted = highlightedItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl space-y-2 text-xs text-left transition ${
                        isHighlighted
                          ? 'bg-purple-50/90 dark:bg-purple-950/40 border-2 border-primary ring-2 ring-primary/30 shadow-md shadow-purple-500/10'
                          : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black font-mono text-slate-900 dark:text-white">{item.name}</span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.2 rounded bg-primary text-white text-[8px] font-bold uppercase animate-pulse">
                              ✓ New
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[10px] font-black text-primary dark:text-blue-400">
                            {item.pcs} pcs
                          </span>
                          {renderActionMenu(item)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="font-black text-slate-400 block uppercase tracking-wider text-[9px]">Bearing Number</span>
                          <span className="font-bold text-slate-900 dark:text-white font-mono">{item.name}</span>
                        </div>
                        <div>
                          <span className="font-black text-slate-400 block uppercase tracking-wider text-[9px]">Quantity</span>
                          <span className="font-bold text-slate-900 dark:text-white">{item.pcs} pcs</span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-black text-slate-400 block uppercase tracking-wider text-[9px]">Target Machine Area</span>
                          <span className="font-bold text-slate-800 dark:text-white">{item.usageArea || '-'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* V-Belts List */}
          {activeTab === 'vbelts' && (
            <div className="space-y-4">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                      <th className="py-3 px-3">V-Belt Size</th>
                      <th className="py-3 px-3">Pcs In Stock</th>
                      <th className="py-3 px-3">Target Machine / Location</th>
                      <th className="py-3 px-3">Min Target Stock</th>
                      <th className="py-3 px-3">Remarks</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                    {filteredBelts.map(item => {
                      const isHighlighted = highlightedItemId === item.id;
                      return (
                        <tr
                          key={item.id}
                          className={`transition duration-150 ${
                            isHighlighted
                              ? 'bg-purple-50/90 dark:bg-purple-950/40 ring-2 ring-primary/40'
                              : 'hover:bg-blue-50/50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {isHighlighted && (
                              <span className="px-1.5 py-0.2 rounded bg-primary text-white text-[8px] font-bold uppercase animate-pulse">
                                ✓ New
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                              item.pcs <= (item.minStock || 5)
                                ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {item.pcs} pcs
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                            {item.targetMachine || item.usageArea || 'General Plant'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono">
                            {item.minStock || 5} pcs
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px] italic">
                            {item.remarks || '-'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {renderActionMenu(item)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Cards */}
              <div className="block md:hidden space-y-3">
                {filteredBelts.map(item => {
                  const isHighlighted = highlightedItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl space-y-2 text-xs text-left transition ${
                        isHighlighted
                          ? 'bg-purple-50/90 dark:bg-purple-950/40 border-2 border-primary ring-2 ring-primary/30 shadow-md shadow-purple-500/10'
                          : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black font-mono text-slate-900 dark:text-white">{item.name}</span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.2 rounded bg-primary text-white text-[8px] font-bold uppercase animate-pulse">
                              ✓ New
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            item.pcs <= (item.minStock || 5)
                              ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-primary dark:text-blue-400'
                          }`}>
                            {item.pcs} pcs
                          </span>
                          {renderActionMenu(item)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="font-black text-slate-400 block uppercase tracking-wider text-[9px]">Belt Size</span>
                          <span className="font-bold text-slate-900 dark:text-white font-mono">{item.name}</span>
                        </div>
                        <div>
                          <span className="font-black text-slate-400 block uppercase tracking-wider text-[9px]">Min Target Stock</span>
                          <span className="font-bold text-slate-900 dark:text-white">{item.minStock || 5} pcs</span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-black text-slate-400 block uppercase tracking-wider text-[9px]">Target Machine / Location</span>
                          <span className="font-bold text-slate-800 dark:text-white">{item.targetMachine || item.usageArea || 'General Plant'}</span>
                        </div>
                        {item.remarks && (
                          <div className="col-span-2">
                            <span className="font-black text-slate-400 block uppercase tracking-wider text-[9px]">Remarks</span>
                            <span className="text-slate-600 dark:text-slate-300 italic">{item.remarks}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Form Panel (1/3 width) */}
        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm space-y-4">
          
          {/* Add Bearing Form */}
          {activeTab === 'bearings' && (
            <form onSubmit={handleAddBearing} className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Register New Bearing
              </h3>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Bearing Serial Number</label>
                <input
                  type="text"
                  value={bearingNo}
                  onChange={e => setBearingNo(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                  placeholder="e.g. 6205"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Pieces In Stock</label>
                <input
                  type="number"
                  min="0"
                  value={bearingPcs}
                  onChange={e => setBearingPcs(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  placeholder="e.g. 10"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Usage / Machine Area</label>
                <input
                  type="text"
                  value={bearingUsage}
                  onChange={e => setBearingUsage(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  placeholder="e.g. Pulp Mill Agitator"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isViewer || isSubmitting}
                title={isViewer ? 'Viewer Mode: Saving spares is locked (Read-Only)' : 'Save Bearing Spares'}
                className={`w-full py-3 text-xs uppercase tracking-wider rounded-2xl font-black transition flex items-center justify-center gap-2 ${
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
                    ? 'Saving Bearing Spares...'
                    : isViewer
                    ? 'Save Bearing Spares (Locked)'
                    : 'Save Bearing Spares'}
                </span>
              </button>
            </form>
          )}

          {/* Add V-Belt Form */}
          {activeTab === 'vbelts' && (
            <form onSubmit={handleAddVBelt} className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Register New V-Belt
              </h3>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">V-Belt Size Code</label>
                <input
                  type="text"
                  value={beltSize}
                  onChange={e => setBeltSize(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                  placeholder="e.g. C-96, B-72, A-48"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Pieces In Stock</label>
                <input
                  type="number"
                  min="0"
                  value={beltPcs}
                  onChange={e => setBeltPcs(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  placeholder="e.g. 5"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Target Machine / Location</label>
                <input
                  type="text"
                  value={beltTarget}
                  onChange={e => setBeltTarget(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  placeholder="e.g. Vacuum Pump Drive, Rewinder"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Min Stock Target</label>
                <input
                  type="number"
                  min="1"
                  value={beltMinStock}
                  onChange={e => setBeltMinStock(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  placeholder="e.g. 5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Remarks / Specifications</label>
                <input
                  type="text"
                  value={beltRemarks}
                  onChange={e => setBeltRemarks(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  placeholder="e.g. Fenner Raw Edge Cogged, Supplier Ref"
                />
              </div>

              <button
                type="submit"
                disabled={isViewer || isSubmitting}
                title={isViewer ? 'Viewer Mode: Saving spares is locked (Read-Only)' : 'Save V-Belt Spares'}
                className={`w-full py-3 text-xs uppercase tracking-wider rounded-2xl font-black transition flex items-center justify-center gap-2 ${
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
                    ? 'Saving V-Belt Spares...'
                    : isViewer
                    ? 'Save V-Belt Spares (Locked)'
                    : 'Save V-Belt Spares'}
                </span>
              </button>
            </form>
          )}

        </div>

      </div>

      {/* View Details Modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200/80 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3.5 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400">
                  {viewingItem.type === 'BEARING' ? <Disc className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {viewingItem.type === 'BEARING' ? 'Bearing Details' : 'V-Belt Details'}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {viewingItem.type === 'BEARING' ? 'Bearing Spares Item' : 'V-Belt Spares Item'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/70 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                    {viewingItem.type === 'BEARING' ? 'Bearing Number' : 'V-Belt Size'}
                  </span>
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white">{viewingItem.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                    In Stock Quantity
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                    viewingItem.pcs <= (viewingItem.minStock || 5)
                      ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-primary dark:text-blue-400'
                  }`}>
                    {viewingItem.pcs} pcs
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                    {viewingItem.type === 'BEARING' ? 'Target Machine Area' : 'Target Machine / Location'}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewingItem.targetMachine || viewingItem.usageArea || 'General Plant'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                    Min Target Stock Level
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {viewingItem.minStock || (viewingItem.type === 'BEARING' ? 4 : 5)} pcs
                  </span>
                </div>
                {viewingItem.remarks && (
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                      Remarks / Specs
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 italic">
                      {viewingItem.remarks}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t dark:border-slate-700">
              <button
                onClick={() => {
                  const item = viewingItem;
                  setViewingItem(null);
                  setEditingItem({ ...item });
                }}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Pencil size={14} />
                <span>Edit Item</span>
              </button>
              <button
                onClick={() => setViewingItem(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200/80 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3.5 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Edit {editingItem.type === 'BEARING' ? 'Bearing Spares' : 'V-Belt Spares'}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    ID: {editingItem.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {editingItem.type === 'BEARING' ? 'Bearing Serial Number' : 'V-Belt Size Code'}
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Pieces In Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.pcs}
                    onChange={e => setEditingItem({ ...editingItem, pcs: parseInt(e.target.value) || 0 })}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white border border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Min Stock Target
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.minStock || 0}
                    onChange={e => setEditingItem({ ...editingItem, minStock: parseInt(e.target.value) || 0 })}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {editingItem.type === 'BEARING' ? 'Usage / Machine Area' : 'Target Machine / Location'}
                </label>
                <input
                  type="text"
                  value={editingItem.type === 'BEARING' ? (editingItem.usageArea || '') : (editingItem.targetMachine || editingItem.usageArea || '')}
                  onChange={e => {
                    if (editingItem.type === 'BEARING') {
                      setEditingItem({ ...editingItem, usageArea: e.target.value });
                    } else {
                      setEditingItem({ ...editingItem, targetMachine: e.target.value, usageArea: e.target.value });
                    }
                  }}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white border border-slate-200 dark:border-slate-700"
                />
              </div>

              {editingItem.type === 'V_BELT' && (
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Remarks / Specifications
                  </label>
                  <input
                    type="text"
                    value={editingItem.remarks || ''}
                    onChange={e => setEditingItem({ ...editingItem, remarks: e.target.value })}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white border border-slate-200 dark:border-slate-700"
                    placeholder="e.g. Fenner Raw Edge Cogged"
                  />
                </div>
              )}

              <div className="flex gap-2.5 pt-3 border-t dark:border-slate-700">
                <button
                  type="submit"
                  disabled={isViewer}
                  title={isViewer ? 'Viewer Mode: Saving spares is locked (Read-Only)' : 'Save Changes'}
                  className={`flex-1 py-3 text-xs uppercase tracking-wider rounded-2xl font-black transition flex items-center justify-center gap-2 ${
                    isViewer
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                      : 'btn-primary-gradient cursor-pointer active:scale-95'
                  }`}
                >
                  {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : null}
                  <span>{isViewer ? 'Save Changes (Locked)' : 'Save Changes'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Floating Toast */}
      <MobileToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
export default StoreView;
