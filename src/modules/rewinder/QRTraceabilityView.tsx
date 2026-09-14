import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getReels, getRolls, getFormulaForDate, getRawMaterialLots, getBoilerLogs } from '../../data/index';
import type { Reel, MachineRoll, PulpFormula, RawMaterialLot, BoilerLog } from '../../data/types';
import { QrCode, Search, AlertCircle, FileText, CheckCircle, Truck, Database, Flame, Warehouse } from 'lucide-react';

export const QRTraceabilityView: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeReel, setActiveReel] = useState<Reel | null>(null);
  const [parentRoll, setParentRoll] = useState<MachineRoll | null>(null);
  const [appliedFormula, setAppliedFormula] = useState<PulpFormula | null>(null);
  const [activeLot, setActiveLot] = useState<RawMaterialLot | null>(null);
  const [activeBoilerLog, setActiveBoilerLog] = useState<BoilerLog | null>(null);
  const [searchError, setSearchError] = useState('');

  // Auto-search if q param is present in URL
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchTerm(q);
      handleSearch(q);
    }
  }, [searchParams]);

  // List of all reels for quick selection
  const allReels = getReels();

  const filteredRecentReels = React.useMemo(() => {
    if (!searchTerm.trim()) return allReels;
    const q = searchTerm.toLowerCase().trim();
    return allReels.filter(r => r.reelNo.toLowerCase().includes(q));
  }, [allReels, searchTerm]);

  const handleSearch = (code: string) => {
    setSearchError('');
    setActiveReel(null);
    setParentRoll(null);
    setAppliedFormula(null);
    setActiveLot(null);
    setActiveBoilerLog(null);

    const targetCode = code.trim().toUpperCase();

    if (targetCode.startsWith('LOT-')) {
      const lotsList = getRawMaterialLots();
      const foundLot = lotsList.find(l => l.lotNo.trim().toUpperCase() === targetCode);
      if (foundLot) {
        setActiveLot(foundLot);
      } else {
        setSearchError(`Raw Material Lot QR code "${code}" not found in database.`);
      }
    } else if (targetCode.startsWith('BLR-')) {
      const boilerLogs = getBoilerLogs();
      const foundLog = boilerLogs.find(b => b.id.trim().toUpperCase() === targetCode);
      if (foundLog) {
        setActiveBoilerLog(foundLog);
      } else {
        setSearchError(`Boiler log QR code "${code}" not found in database.`);
      }
    } else {
      // Default to Reel search
      const reelsList = getReels();
      const foundReel = reelsList.find(r => r.reelNo.trim().toUpperCase() === targetCode);

      if (foundReel) {
        setActiveReel(foundReel);

        // Look up parent roll
        const rollsList = getRolls();
        const parent = rollsList.find(roll => roll.rollNo === foundReel.parentRollNo);
        if (parent) {
          setParentRoll(parent);

          // Look up formula active on roll's production date
          const formula = getFormulaForDate(parent.date);
          if (formula) {
            setAppliedFormula(formula);
          }
        }
      } else {
        setSearchError('QR code not found in Saheb Paper database.');
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      handleSearch(searchTerm.trim());
    }
  };

  return (
    <div className="space-y-6 font-sans">

      {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
      <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
              <QrCode className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                  QR Traceability &amp; Audit Ledger
                </h1>
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold">
                  Reel History
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Lookup physical reel codes, raw material lot origins, and full machine production logs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="neumorphic-card rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Traceable Reels</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{allReels.length} <span className="text-xs text-slate-400 font-normal">reels logged</span></p>
          </div>
        </div>

        <div className="neumorphic-card rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <Warehouse className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Inventory Reels</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{allReels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B').length} <span className="text-xs text-slate-400 font-normal">in warehouse</span></p>
          </div>
        </div>

        <div className="neumorphic-card rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">QC Checked Batches</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{allReels.filter(r => r.qcGrade !== 'PENDING').length} <span className="text-xs text-slate-400 font-normal">graded</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left Side: Search Input & Recent Traceable Reels */}
        <div className="space-y-4">
          <div className="neumorphic-card rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Traceability Code Search
            </h3>

            {/* Manual input lookup */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 py-3 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono placeholder-slate-400"
                placeholder="Enter Code e.g. SAHEB-R-..."
              />
              <button
                type="submit"
                className="btn-primary-gradient px-4 py-3 flex items-center justify-center cursor-pointer"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            {searchError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-2xl border border-red-200 dark:border-red-800 font-bold flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Quick Helper Reels */}
          <div className="neumorphic-card rounded-3xl p-6 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              Recent Traceable Reels
            </h4>
            {filteredRecentReels.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No reels found matching query.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredRecentReels.map(r => (
                  <button
                    key={r.reelNo}
                    onClick={() => {
                      setSearchTerm(r.reelNo);
                      handleSearch(r.reelNo);
                    }}
                    className={`px-3 py-1.5 text-[11px] rounded-xl border font-mono transition font-bold flex items-center gap-1.5 cursor-pointer ${
                      activeReel?.reelNo === r.reelNo
                        ? 'bg-primary text-white border-transparent shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>{r.reelNo.slice(-9)}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] uppercase ${
                      r.status === 'QC_PENDING' ? 'bg-purple-200 text-purple-800' :
                      r.status === 'IN_STOCK_B' ? 'bg-blue-200 text-blue-800' :
                      'bg-emerald-200 text-emerald-800'
                    }`}>
                      {r.status.replace('QC_', '')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Traceability Summary Dashboard (2/3 width) */}
        <div className="lg:col-span-2">
          {activeLot ? (
            /* Render Raw Material Lot Details */
            <div className="neumorphic-card rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Raw Material Lot</span>
                  <h3 className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">{activeLot.lotNo}</h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200">
                  Inwarded
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Material Name</p>
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Warehouse className="h-4 w-4 text-primary" />
                    {activeLot.materialName}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Weight (Qty)</p>
                  <p className="font-bold text-slate-900 dark:text-white font-mono">{activeLot.weight.toLocaleString()} kg</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Supplier / Vendor</p>
                  <p className="font-bold text-slate-900 dark:text-white">{activeLot.vendorName}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Log Date & User</p>
                  <p className="font-bold text-slate-900 dark:text-white">{activeLot.date} ({activeLot.operator})</p>
                </div>
              </div>
            </div>
          ) : activeBoilerLog ? (
            /* Render Boiler Log Details */
            <div className="neumorphic-card rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Boiler Operation Log</span>
                  <h3 className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">{activeBoilerLog.id}</h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  Shift {activeBoilerLog.shift}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Wood Used</p>
                  <p className="font-bold text-slate-900 dark:text-white font-mono">{activeBoilerLog.woodUsed} kg</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Water Used</p>
                  <p className="font-bold text-slate-900 dark:text-white font-mono">{activeBoilerLog.waterUsed} L</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Pressure</p>
                  <p className="font-bold text-slate-900 dark:text-white font-mono">{activeBoilerLog.pressure} psi</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <p className="flex justify-between"><span className="text-slate-400">Production Date:</span> <span className="font-bold text-slate-900 dark:text-white">{activeBoilerLog.date}</span></p>
                <p className="flex justify-between mt-1"><span className="text-slate-400">Logged Operator:</span> <span className="font-bold text-slate-900 dark:text-white">{activeBoilerLog.operator}</span></p>
              </div>
            </div>
          ) : !activeReel ? (
            <div className="neumorphic-card rounded-3xl p-12 text-center text-xs text-slate-500 shadow-sm flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-primary dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                <QrCode className="h-10 w-10 animate-pulse" />
              </div>
              <p className="max-w-md font-semibold text-slate-600 dark:text-slate-400">Search a Reel No or click any Recent Traceable Reel on the left to inspect detailed production lineage.</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Main Info Card */}
              <div className="neumorphic-card rounded-3xl p-6 shadow-sm space-y-4">

                {/* Reel Header */}
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Finished Reel</span>
                    <h3 className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">{activeReel.reelNo}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    activeReel.status === 'QC_PENDING' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200' :
                    activeReel.status === 'IN_STOCK' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200' :
                    activeReel.status === 'IN_STOCK_B' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {activeReel.status}
                  </span>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Product</p>
                    <p className="font-bold text-slate-900 dark:text-white">{activeReel.product}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Weight</p>
                    <p className="font-bold text-slate-900 dark:text-white">{activeReel.weight} kg</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">GSM / Size</p>
                    <p className="font-bold text-slate-900 dark:text-white">{activeReel.gsm} GSM • {activeReel.size} cm</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">QC Grade</p>
                    <p className={`font-black ${activeReel.qcGrade === 'A' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      Grade {activeReel.qcGrade}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lineage Breakdown Tabs / Cards */}
              {parentRoll && (
                <div className="neumorphic-card rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <Database className="h-4 w-4 text-indigo-500" />
                    Parent Machine Roll Origin
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Roll No</p>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">{parentRoll.rollNo}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Production Date</p>
                      <p className="font-bold text-slate-900 dark:text-white">{parentRoll.date}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Shift & Product</p>
                      <p className="font-bold text-slate-900 dark:text-white">Shift {parentRoll.shift} ({parentRoll.product})</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pulp Formula & Material Ingredients */}
              {appliedFormula && (
                <div className="neumorphic-card rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Applied Pulp Formula Ingredients
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(appliedFormula.wasteMix || {}).map(([name, pct]) => (
                      <div key={name} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{name}</span>
                        <span className="font-mono font-bold text-primary dark:text-blue-400">{pct}%</span>
                      </div>
                    ))}
                    {Object.entries(appliedFormula.chemicals || {}).map(([name, dose]) => (
                      <div key={name} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{name} (Chemical)</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{dose} kg/ton</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
export default QRTraceabilityView;
