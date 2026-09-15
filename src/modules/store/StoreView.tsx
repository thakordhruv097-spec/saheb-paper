import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getStoreItems, saveStoreItem, adjustStoreItemStock } from '../../data/index';
import type { StoreItem } from '../../data/types';
import { Settings, Plus, Minus, Warehouse, Disc, Search, ListFilter, Lock } from 'lucide-react';
import { useDataSync } from '../../hooks/useDataSync';

export const StoreView: React.FC = () => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();

  const syncTick = useDataSync(['store_items', 'spares_store', 'spareparts_management']);
  const [items, setItems] = useState<StoreItem[]>(() => getStoreItems());

  useEffect(() => {
    setItems(getStoreItems());
  }, [syncTick]);
  const [activeTab, setActiveTab] = useState<'bearings' | 'vbelts'>('bearings');

  // Form Success / Error States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  // Stock adjustment modal states
  const [adjustingItem, setAdjustingItem] = useState<StoreItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');

  const handleAddBearing = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (isViewer) {
      setErrorMsg('Viewer Mode: Adding store items is locked. You have read-only access.');
      return;
    }

    if (!bearingNo || !bearingPcs || !bearingUsage) {
      setErrorMsg('All bearing fields are required');
      return;
    }

    const pcs = parseInt(bearingPcs);
    if (isNaN(pcs) || pcs < 0) {
      setErrorMsg('Pcs must be a positive number');
      return;
    }

    const newItem: StoreItem = {
      id: `st-${Date.now()}`,
      type: 'BEARING',
      name: bearingNo,
      pcs,
      usageArea: bearingUsage,
      minStock: 4,
    };

    saveStoreItem(newItem, user?.displayName || 'System');
    setItems(getStoreItems());
    setSuccessMsg('Bearing added successfully to store ledger!');
    setBearingNo('');
    setBearingPcs('');
    setBearingUsage('');
  };

  const handleAddVBelt = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (isViewer) {
      setErrorMsg('Viewer Mode: Adding store items is locked. You have read-only access.');
      return;
    }

    if (!beltSize.trim() || !beltPcs.trim()) {
      setErrorMsg('V-Belt size code and pieces are required');
      return;
    }

    const pcs = parseInt(beltPcs);
    if (isNaN(pcs) || pcs < 0) {
      setErrorMsg('Pcs must be a positive number');
      return;
    }

    const minStock = parseInt(beltMinStock);

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
    setSuccessMsg('V-Belt added successfully to store ledger!');
    setBeltSize('');
    setBeltPcs('');
    setBeltTarget('');
    setBeltMinStock('5');
    setBeltRemarks('');
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      setErrorMsg('Viewer Mode: Adjusting stock is locked.');
      return;
    }
    if (!adjustingItem) return;
    const qty = parseInt(adjustAmount);
    if (isNaN(qty) || qty === 0) {
      setErrorMsg('Enter valid non-zero adjustment quantity');
      return;
    }

    const updated = adjustStoreItemStock(adjustingItem.id, qty, user?.displayName || 'System');
    if (updated) {
      setItems(getStoreItems());
      setSuccessMsg(`Stock updated successfully for ${adjustingItem.name}`);
      setAdjustingItem(null);
      setAdjustAmount('');
    } else {
      setErrorMsg('Failed to adjust stock. Check available quantity.');
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

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
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
          onClick={() => { setActiveTab('bearings'); setSuccessMsg(''); setErrorMsg(''); }}
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
          onClick={() => { setActiveTab('vbelts'); setSuccessMsg(''); setErrorMsg(''); }}
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

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 font-bold">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-2xl border border-red-200 dark:border-red-800 font-bold">
          {errorMsg}
        </div>
      )}

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
                    {filteredBearings.map(item => (
                      <tr key={item.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white font-mono">{item.name}</td>
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">{item.pcs} pcs</td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{item.usageArea}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setAdjustingItem(item)}
                            className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Cards */}
              <div className="block md:hidden space-y-3">
                {filteredBearings.map(item => (
                  <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs text-left">
                    <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
                      <span className="font-black font-mono text-slate-900 dark:text-white">{item.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[10px] font-black text-primary dark:text-blue-400">
                        {item.pcs} pcs
                      </span>
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
                        <span className="font-bold text-slate-800 dark:text-white">{item.usageArea}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() => setAdjustingItem(item)}
                        className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-xs transition"
                      >
                        Adjust Stock
                      </button>
                    </div>
                  </div>
                ))}
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
                    {filteredBelts.map(item => (
                      <tr key={item.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white font-mono">{item.name}</td>
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
                          <button
                            onClick={() => setAdjustingItem(item)}
                            className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Cards */}
              <div className="block md:hidden space-y-3">
                {filteredBelts.map(item => (
                  <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs text-left">
                    <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
                      <span className="font-black font-mono text-slate-900 dark:text-white">{item.name}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        item.pcs <= (item.minStock || 5)
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-primary dark:text-blue-400'
                      }`}>
                        {item.pcs} pcs
                      </span>
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
                    <div className="pt-2 border-t dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() => setAdjustingItem(item)}
                        className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-xs transition"
                      >
                        Adjust Stock
                      </button>
                    </div>
                  </div>
                ))}
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
                disabled={isViewer}
                title={isViewer ? 'Viewer Mode: Saving spares is locked (Read-Only)' : 'Save Bearing Spares'}
                className={`w-full py-3 text-xs uppercase tracking-wider rounded-2xl font-black transition flex items-center justify-center gap-2 ${
                  isViewer
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                    : 'btn-primary-gradient cursor-pointer'
                }`}
              >
                {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : null}
                <span>{isViewer ? 'Save Bearing Spares (Locked)' : 'Save Bearing Spares'}</span>
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
                disabled={isViewer}
                title={isViewer ? 'Viewer Mode: Saving spares is locked (Read-Only)' : 'Save V-Belt Spares'}
                className={`w-full py-3 text-xs uppercase tracking-wider rounded-2xl font-black transition flex items-center justify-center gap-2 ${
                  isViewer
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                    : 'btn-primary-gradient cursor-pointer'
                }`}
              >
                {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : null}
                <span>{isViewer ? 'Save V-Belt Spares (Locked)' : 'Save V-Belt Spares'}</span>
              </button>
            </form>
          )}

        </div>

      </div>

      {/* Adjust Quantity Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Adjust Spares Quantity
              </h3>
              <button onClick={() => setAdjustingItem(null)} className="text-slate-400 hover:text-slate-600">Close</button>
            </div>
            
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 text-xs rounded-md border border-slate-200 dark:border-slate-800 space-y-1">
                <p><strong>Item:</strong> {adjustingItem.name} ({adjustingItem.type})</p>
                <p><strong>Current Stock:</strong> {adjustingItem.pcs} pcs</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-light-secondary dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Adjustment quantity (+ for inward, - for use)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  className="block w-full py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs focus:outline-none dark:text-white"
                  placeholder="e.g. -2 or 5"
                />
              </div>

              <button
                type="submit"
                disabled={isViewer}
                title={isViewer ? 'Viewer Mode: Stock adjustments are locked (Read-Only)' : 'Log Adjustment'}
                className={`w-full font-semibold py-2 rounded-md text-xs transition shadow flex items-center justify-center gap-1.5 ${
                  isViewer
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                    : 'bg-primary hover:bg-blue-800 text-white cursor-pointer'
                }`}
              >
                {isViewer ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : null}
                <span>{isViewer ? 'Log Adjustment (Locked)' : 'Log Adjustment'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default StoreView;
