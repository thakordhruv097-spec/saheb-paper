import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getStoreItems, saveStoreItem, deleteStoreItem, getStoreActivityLogs, logSparesMovement } from '../../data/index';
import type { StoreItem, StoreActivityLog } from '../../data/types';
import {
  Settings,
  Plus,
  Warehouse,
  Disc,
  Search,
  ListFilter,
  Lock,
  Loader2,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  X,
  History,
  ArrowDownRight,
  ArrowUpRight,
  UserCheck,
  MapPin,
  ClipboardList,
  CheckCircle2,
} from 'lucide-react';
import { useDataSync } from '../../hooks/useDataSync';
import { useMobileBackHandler } from '../../hooks/useMobileBackHandler';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { MobileToast, type ToastMessage } from '../../components/MobileToast';

export const StoreView: React.FC = () => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();

  const syncTick = useDataSync(['store_items', 'spares_store', 'spareparts_management']);
  const [items, setItems] = useState<StoreItem[]>(() => getStoreItems());
  const [logs, setLogs] = useState<StoreActivityLog[]>(() => getStoreActivityLogs());

  useEffect(() => {
    setItems(getStoreItems());
    setLogs(getStoreActivityLogs());
  }, [syncTick]);
  const [activeTab, setActiveTab] = useState<'bearings' | 'vbelts' | 'logs'>('bearings');

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

  // 3. Movement Log & Filter States
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterAction, setLogFilterAction] = useState<string>('ALL');
  const [logFilterType, setLogFilterType] = useState<string>('ALL');

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logSelectedItemId, setLogSelectedItemId] = useState<string>('');
  const [logAction, setLogAction] = useState<'STOCK_OUT' | 'STOCK_IN'>('STOCK_OUT');
  const [logQuantity, setLogQuantity] = useState<string>('');
  const [logMachineLocation, setLogMachineLocation] = useState<string>('Paper Machine');
  const [logOperatorName, setLogOperatorName] = useState<string>(user?.displayName || '');
  const [logReason, setLogReason] = useState<string>('Routine Maintenance / Replacement');
  const [logReferenceNo, setLogReferenceNo] = useState<string>('');

  // Row Action Menu & Modal States
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const [viewingItem, setViewingItem] = useState<StoreItem | null>(null);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useBodyScrollLock(!!viewingItem || !!editingItem || isLogModalOpen);
  useMobileBackHandler(!!viewingItem, () => setViewingItem(null), 'storeViewItem');
  useMobileBackHandler(!!editingItem, () => setEditingItem(null), 'storeEditItem');
  useMobileBackHandler(isLogModalOpen, () => setIsLogModalOpen(false), 'storeLogModal');

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
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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

  const handleOpenLogModal = (item?: StoreItem) => {
    if (isViewer) {
      setToast({
        type: 'error',
        title: 'Action Locked',
        message: 'Viewer Mode: Logging spares movement is locked (Read-Only).',
      });
      return;
    }
    if (item) {
      setLogSelectedItemId(item.id);
      setLogMachineLocation(item.type === 'BEARING' ? item.usageArea || 'Paper Machine' : item.targetMachine || 'General Machine');
    } else if (items.length > 0) {
      setLogSelectedItemId(items[0].id);
      setLogMachineLocation(items[0].type === 'BEARING' ? items[0].usageArea || 'Paper Machine' : items[0].targetMachine || 'General Machine');
    }
    setLogQuantity('');
    setLogOperatorName(user?.displayName || '');
    setLogReason(logAction === 'STOCK_OUT' ? 'Routine Maintenance / Replacement' : 'New Stock Purchase Receipt');
    setLogReferenceNo('');
    setIsLogModalOpen(true);
  };

  const handleSubmitMovementLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    if (!logSelectedItemId) {
      setToast({ type: 'warning', title: 'Select Spare Item', message: 'Please select an item from the registry.' });
      return;
    }

    const qty = parseInt(logQuantity);
    if (isNaN(qty) || qty <= 0) {
      setToast({ type: 'warning', title: 'Invalid Quantity', message: 'Quantity must be a positive number (minimum 1).' });
      return;
    }

    const res = logSparesMovement({
      itemId: logSelectedItemId,
      action: logAction,
      quantity: qty,
      machineLocation: logMachineLocation.trim(),
      operatorName: logOperatorName.trim() || user?.displayName || 'Store Operator',
      reason: logReason.trim(),
      referenceNo: logReferenceNo.trim(),
      user: user?.displayName || 'Store Operator',
    });

    if (!res.success) {
      setToast({
        type: 'error',
        title: 'Stock Update Failed',
        message: res.error || 'Failed to record movement.',
      });
      return;
    }

    setItems(getStoreItems());
    setLogs(getStoreActivityLogs());
    setIsLogModalOpen(false);
    setToast({
      type: 'success',
      title: logAction === 'STOCK_OUT' ? 'Spares Issued Out' : 'Spares Restocked',
      message: `Successfully recorded ${qty} pcs movement. Store stock updated.`,
      duration: 3500,
    });
  };

  const filteredLogs = useMemo(() => {
    let list = [...logs];
    if (logFilterAction !== 'ALL') {
      list = list.filter(l => l.action === logFilterAction);
    }
    if (logFilterType !== 'ALL') {
      list = list.filter(l => l.itemType === logFilterType);
    }
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase().trim();
      list = list.filter(l =>
        (l.itemName || '').toLowerCase().includes(q) ||
        (l.machineLocation || '').toLowerCase().includes(q) ||
        (l.operatorName || '').toLowerCase().includes(q) ||
        (l.reason || '').toLowerCase().includes(q) ||
        (l.referenceNo || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q) ||
        (l.date || '').includes(q)
      );
    }
    return list;
  }, [logs, logFilterAction, logFilterType, logSearchQuery]);

  const totalIssuedCount = useMemo(() => logs.filter(l => l.action === 'STOCK_OUT').reduce((acc, l) => acc + Math.abs(l.quantityChanged || 0), 0), [logs]);
  const totalReceivedCount = useMemo(() => logs.filter(l => l.action === 'STOCK_IN').reduce((acc, l) => acc + Math.abs(l.quantityChanged || 0), 0), [logs]);

  // Reusable 3-dots action dropdown menu component
  const renderActionMenu = (item: StoreItem) => {
    const isMenuOpen = openMenuFor === item.id;
    return (
      <div className={`inline-block text-left ${isMenuOpen ? 'relative z-50' : 'relative'}`}>
        <button
          type="button"
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
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenMenuFor(null);
              }}
              onClick={(e) => {
                e.preventDefault();
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
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setViewingItem(item);
                  setOpenMenuFor(null);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setViewingItem(item);
                  setOpenMenuFor(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
              >
                <Eye size={15} className="text-slate-500 shrink-0" />
                <span>View Details</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenLogModal(item);
                  setOpenMenuFor(null);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenLogModal(item);
                  setOpenMenuFor(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
              >
                <ClipboardList size={15} className="text-slate-500 shrink-0" />
                <span>Log Movement</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingItem({ ...item });
                  setOpenMenuFor(null);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingItem({ ...item });
                  setOpenMenuFor(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
              >
                <Pencil size={15} className="text-slate-500 shrink-0" />
                <span>Edit Item</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteItem(item);
                  setOpenMenuFor(null);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteItem(item);
                  setOpenMenuFor(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition cursor-pointer border-t border-slate-100 dark:border-slate-700/50"
              >
                <Trash2 size={15} className="text-red-500 shrink-0" />
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
      {/* TOP METRIC SCORECARDS */}
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
      <div className="flex bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 max-w-max gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => { setActiveTab('bearings'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'bearings'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Disc className="h-4 w-4" />
          <span>Bearings Spares Registry</span>
          <span className="text-[10px] opacity-75 font-mono ml-0.5">({bearingsList.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('vbelts'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'vbelts'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>V-Belts Spares Registry</span>
          <span className="text-[10px] opacity-75 font-mono ml-0.5">({vbeltsList.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('logs'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Spares Activity &amp; Movement Logs</span>
          <span className="text-[10px] opacity-75 font-mono ml-0.5">({logs.length})</span>
        </button>
      </div>

      {activeTab === 'logs' ? (
        /* LOGS TAB VIEW */
        <div className="space-y-6">
          {/* Top Quick Stats for Logs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm flex items-center gap-4 border border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
                <History className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Activity Logs</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{logs.length} <span className="text-xs text-slate-400 font-normal">entries</span></p>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm flex items-center gap-4 border border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                <ArrowDownRight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spares Issued (Out)</p>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{totalIssuedCount} <span className="text-xs text-slate-400 font-normal">pcs used</span></p>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm flex items-center gap-4 border border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spares Received (In)</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{totalReceivedCount} <span className="text-xs text-slate-400 font-normal">pcs restocked</span></p>
              </div>
            </div>
          </div>

          {/* Log Controls Card */}
          <div className="neumorphic-card p-5 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Live Search */}
              <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-2xl p-2.5 flex items-center gap-2.5 border border-slate-200/80 dark:border-slate-800">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={e => setLogSearchQuery(e.target.value)}
                  placeholder="Search by spare name, machine, technician, reason, or bill no..."
                  className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
                />
                {logSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLogSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Action Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={logFilterAction}
                  onChange={e => setLogFilterAction(e.target.value)}
                  className="py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Actions</option>
                  <option value="STOCK_OUT">Stock Out (Issued)</option>
                  <option value="STOCK_IN">Stock In (Received)</option>
                  <option value="ADD">New Item Registered</option>
                  <option value="EDIT">Details / Stock Updated</option>
                  <option value="DELETE">Deleted</option>
                </select>

                <select
                  value={logFilterType}
                  onChange={e => setLogFilterType(e.target.value)}
                  className="py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Types</option>
                  <option value="BEARING">Bearings</option>
                  <option value="V_BELT">V-Belts</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleOpenLogModal()}
                  disabled={isViewer}
                  title={isViewer ? 'Viewer Mode: Locked' : 'Log Spares Movement'}
                  className={`py-2.5 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-2 shrink-0 ${
                    isViewer
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                      : 'btn-primary-gradient text-white shadow-xs cursor-pointer active:scale-95'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Log Movement</span>
                </button>
              </div>
            </div>

            {/* Logs Table (Desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                    <th className="py-3 px-3">Date &amp; Time</th>
                    <th className="py-3 px-3">Spare Item</th>
                    <th className="py-3 px-3">Action / Qty</th>
                    <th className="py-3 px-3">Stock Change</th>
                    <th className="py-3 px-3">Machine / Location</th>
                    <th className="py-3 px-3">Technician / Operator</th>
                    <th className="py-3 px-3">Purpose / Breakdown Reason</th>
                    <th className="py-3 px-3">Ref / Slip No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-sm">No activity logs recorded yet</p>
                        <p className="text-xs mt-0.5 text-slate-400">Inventory changes and movement logs will appear here.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const isOut = log.action === 'STOCK_OUT';
                      const isIn = log.action === 'STOCK_IN';
                      const isAdd = log.action === 'ADD';
                      const isEdit = log.action === 'EDIT' || log.action === 'ADJUST';
                      const isDel = log.action === 'DELETE';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-white">{log.date}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.time}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-black text-slate-900 dark:text-white font-mono">{log.itemName}</div>
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase mt-0.5 ${
                              log.itemType === 'BEARING'
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
                            }`}>
                              {log.itemType === 'BEARING' ? 'Bearing' : 'V-Belt'}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {isOut && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 font-black text-xs">
                                <ArrowDownRight className="h-3 w-3" />
                                Issued ({log.quantityChanged || 0} pcs)
                              </span>
                            )}
                            {isIn && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 font-black text-xs">
                                <ArrowUpRight className="h-3 w-3" />
                                Restocked (+{log.quantityChanged || 0} pcs)
                              </span>
                            )}
                            {isAdd && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 font-black text-xs">
                                <Plus className="h-3 w-3" />
                                Registered ({log.newPcs || 0} pcs)
                              </span>
                            )}
                            {isEdit && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 font-black text-xs">
                                <Pencil className="h-3 w-3" />
                                Updated
                              </span>
                            )}
                            {isDel && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 font-black text-xs">
                                <Trash2 className="h-3 w-3" />
                                Deleted
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                            {log.previousPcs !== undefined && log.newPcs !== undefined ? (
                              <span>{log.previousPcs} → <strong className="text-slate-900 dark:text-white font-black">{log.newPcs} pcs</strong></span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-3 text-slate-800 dark:text-slate-200">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{log.machineLocation || '-'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-800 dark:text-slate-200">
                            <span className="inline-flex items-center gap-1">
                              <UserCheck className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{log.operatorName || '-'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={log.reason || log.details}>
                            {log.reason || log.details}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                            {log.referenceNo || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Logs Mobile Stacked Cards */}
            <div className="block md:hidden space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <History className="h-7 w-7 mx-auto mb-2 opacity-40" />
                  <p className="font-bold text-xs">No activity logs recorded yet</p>
                </div>
              ) : (
                filteredLogs.map(log => {
                  const isOut = log.action === 'STOCK_OUT';
                  const isIn = log.action === 'STOCK_IN';
                  return (
                    <div key={log.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-left">
                      <div className="flex justify-between items-start border-b pb-2 dark:border-slate-800">
                        <div>
                          <div className="font-black font-mono text-slate-900 dark:text-white text-sm">{log.itemName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{log.date} at {log.time}</div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                          isOut ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' :
                          isIn ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                        }`}>
                          {log.action === 'STOCK_OUT' ? `Issued (${log.quantityChanged} pcs)` :
                           log.action === 'STOCK_IN' ? `Restocked (+${log.quantityChanged} pcs)` :
                           log.action}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Location / Machine</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{log.machineLocation || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Technician</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{log.operatorName || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Stock Change</span>
                          <span className="font-bold text-slate-900 dark:text-white font-mono">{log.previousPcs} → {log.newPcs} pcs</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Ref / Slip No</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">{log.referenceNo || '-'}</span>
                        </div>
                        {log.reason && (
                          <div className="col-span-2 pt-1 border-t dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Purpose / Reason</span>
                            <span>{log.reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Content Grid */
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
      )}

      {/* View Details Modal */}
      {viewingItem && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overscroll-contain"
          onClick={() => setViewingItem(null)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200/80 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overscroll-contain"
          onClick={() => setEditingItem(null)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200/80 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* 4. LOG SPARES MOVEMENT / USAGE MODAL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 text-left font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Log Spares Movement / Usage
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Record spare part issue to machine or restock inward
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitMovementLog} className="space-y-4 text-xs font-semibold">
              {/* Movement Type Toggle: Stock Out (Issue) vs Stock In (Restock) */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  1. Movement Type
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setLogAction('STOCK_OUT');
                      setLogReason('Routine Maintenance / Replacement');
                    }}
                    className={`py-2 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      logAction === 'STOCK_OUT'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ArrowDownRight className="h-4 w-4" />
                    <span>Issue to Machine (Out)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLogAction('STOCK_IN');
                      setLogReason('New Stock Purchase Receipt');
                    }}
                    className={`py-2 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      logAction === 'STOCK_IN'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Restock Inward (In)</span>
                  </button>
                </div>
              </div>

              {/* Spare Item Selection */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  2. Select Spare Item
                </label>
                <select
                  value={logSelectedItemId}
                  onChange={e => {
                    setLogSelectedItemId(e.target.value);
                    const it = items.find(i => i.id === e.target.value);
                    if (it) {
                      setLogMachineLocation(it.type === 'BEARING' ? it.usageArea || 'Paper Machine' : it.targetMachine || 'General Machine');
                    }
                  }}
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  required
                >
                  <option value="" disabled>Select Item from store...</option>
                  <optgroup label="Bearings">
                    {bearingsList.map(b => (
                      <option key={b.id} value={b.id}>
                        Bearing: {b.name} (In Stock: {b.pcs} pcs) - {b.usageArea || 'General'}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="V-Belts">
                    {vbeltsList.map(v => (
                      <option key={v.id} value={v.id}>
                        V-Belt: {v.name} (In Stock: {v.pcs} pcs) - {v.targetMachine || 'General'}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Quantity (pcs) */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  3. Quantity (Pieces)
                </label>
                <input
                  type="number"
                  min="1"
                  value={logQuantity}
                  onChange={e => setLogQuantity(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Machine / Location */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  4. Machine / Location Area
                </label>
                <input
                  type="text"
                  value={logMachineLocation}
                  onChange={e => setLogMachineLocation(e.target.value)}
                  placeholder="e.g. Paper Machine Wire Section / Rewinder / Boiler"
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Paper Machine', 'Rewinder', 'Boiler', 'Pulp Mill', 'ETP', 'General Maintenance'].map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLogMachineLocation(loc)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border cursor-pointer font-bold transition ${
                        logMachineLocation === loc
                          ? 'bg-primary text-white border-primary'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Technician / Operator Name */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  5. Technician / Operator Name
                </label>
                <input
                  type="text"
                  value={logOperatorName}
                  onChange={e => setLogOperatorName(e.target.value)}
                  placeholder="e.g. Ramesh Bhai (Fitter) / Hardik"
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Work Purpose / Breakdown Reason */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  6. Work Purpose / Breakdown Reason
                </label>
                <input
                  type="text"
                  value={logReason}
                  onChange={e => setLogReason(e.target.value)}
                  placeholder="e.g. Routine Overhaul, Heating Issue, Breakdown Replacement"
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Requisition / Gate Pass / Bill No */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  7. Requisition / Gate Pass / Slip No (Optional)
                </label>
                <input
                  type="text"
                  value={logReferenceNo}
                  onChange={e => setLogReferenceNo(e.target.value)}
                  placeholder="e.g. REQ-2026-081, GP-4402"
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-3 border-t dark:border-slate-700">
                <button
                  type="submit"
                  disabled={isViewer}
                  className={`flex-1 py-3 text-xs uppercase tracking-wider rounded-2xl font-black transition flex items-center justify-center gap-2 ${
                    isViewer
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : logAction === 'STOCK_OUT'
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white cursor-pointer active:scale-95 shadow-md shadow-rose-500/20'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white cursor-pointer active:scale-95 shadow-md shadow-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {logAction === 'STOCK_OUT' ? 'Confirm Spares Issue (Deduct Stock)' : 'Confirm Spares Receipt (Add Stock)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
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
