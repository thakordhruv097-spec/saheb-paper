import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  X,
  QrCode,
  Tag,
  Package,
  Layers,
  Copy,
  Sparkles,
  Check,
  RotateCcw,
  FileText,
  Building,
  Lock,
} from 'lucide-react';
import { useAuth } from '../modules/auth/AuthContext';
import { getReels, getProducts } from '../data/index';
import type { Reel } from '../data/types';
import { COMPANY_CONFIG } from '../config/company';
import { CustomSearchableSelect } from './CustomSearchableSelect';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface PrintLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReel?: Reel | null;
  initialCode?: string;
  initialType?: 'REEL' | 'STOCK' | 'LOT' | 'CUSTOM';
}

export const PrintLabelModal: React.FC<PrintLabelModalProps> = ({
  isOpen,
  onClose,
  initialReel,
  initialCode,
  initialType = 'REEL',
}) => {
  const { isViewer } = useAuth();
  useBodyScrollLock(isOpen);
  const stockReels = React.useMemo(() => {
    const all = getReels();
    const seen = new Set<string>();
    const unique = all.filter(r => {
      if (!r.reelNo || seen.has(r.reelNo)) return false;
      seen.add(r.reelNo);
      return true;
    });
    // Most recent reel is 1st (newest date / highest reel sequence)
    return unique.sort((a, b) => {
      if (a.productionDate && b.productionDate && a.productionDate !== b.productionDate) {
        return b.productionDate.localeCompare(a.productionDate);
      }
      return b.reelNo.localeCompare(a.reelNo, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, []);
  const productsList = getProducts();

  // Mode selection: REEL | STOCK | LOT | CUSTOM
  const [labelType, setLabelType] = useState<'REEL' | 'STOCK' | 'LOT' | 'CUSTOM'>(initialType);

  const buildInitialData = (reel?: Reel | null, code?: string) => {
    if (reel) {
      return {
        title: COMPANY_CONFIG.name,
        subtitle: 'Plant: Chandisar, Palanpur',
        code: reel.reelNo,
        qrValue: reel.reelNo,
        product: reel.product || 'Tissue Paper Reel',
        gsm: String(reel.gsm || '16.0'),
        size: String(reel.size || '30.0'),
        ply: `${reel.ply || 2} Ply`,
        joint: `${reel.joint ?? 0} Joints`,
        weight: String(reel.weight || '1,200'),
        dia: `${reel.dia || 1150} mm`,
        core: '76 mm (3")',
        grade: `Grade ${reel.qcGrade || 'A'} - PASSED`,
        date: reel.productionDate || new Date().toISOString().substring(0, 10),
        shift: 'Shift A',
        machine: 'Rewinder #2',
        operator: 'Operator Desk',
        notes: 'Handle with care · Keep dry · 100% Recyclable',
        customKey1: 'Batch No',
        customVal1: 'BATCH-2026-AUG',
        customKey2: 'Bay Location',
        customVal2: 'Bay A-04',
      };
    }
    const targetCode = code || 'RL-1049';
    return {
      title: COMPANY_CONFIG.name,
      subtitle: 'Plant: Chandisar, Palanpur',
      code: targetCode,
      qrValue: targetCode,
      product: 'Napkin Tissue (Virgin Pulp)',
      gsm: '16.0',
      size: '30.0',
      ply: '2 Ply',
      joint: '0 Joints',
      weight: '1,310',
      dia: '1150 mm',
      core: '76 mm (3")',
      grade: 'Grade A - PASSED',
      date: new Date().toISOString().substring(0, 10),
      shift: 'Shift A',
      machine: 'Rewinder #2',
      operator: 'Gate #1 Dispatch Desk',
      notes: 'Standard Tissue Reel · Wrap Sealed',
      customKey1: 'Batch No',
      customVal1: 'BATCH-2026-AUG',
      customKey2: 'Bay Location',
      customVal2: 'Bay A-04',
    };
  };

  // Label Form Data
  const [formData, setFormData] = useState(() => buildInitialData(initialReel, initialCode));

  // Sync state whenever modal opens or props change
  React.useEffect(() => {
    if (isOpen) {
      setLabelType(initialType);
      setFormData(buildInitialData(initialReel, initialCode));
    }
  }, [isOpen, initialReel, initialCode, initialType]);

  const [copies, setCopies] = useState<number>(1);
  const [labelSize, setLabelSize] = useState<'4x6' | '3x2' | 'compact'>('4x6');
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleSelectReel = (reelNo: string) => {
    const found = stockReels.find(r => r.reelNo === reelNo);
    if (found) {
      setFormData({
        ...formData,
        code: found.reelNo,
        qrValue: found.reelNo,
        product: found.product,
        gsm: String(found.gsm),
        size: String(found.size),
        ply: `${found.ply || 2} Ply`,
        joint: `${found.joint ?? 0} Joints`,
        weight: String(found.weight),
        dia: `${found.dia || 1150} mm`,
        grade: `Grade ${found.qcGrade || 'A'} - PASSED`,
        date: found.productionDate || new Date().toISOString().substring(0, 10),
      });
    }
  };

  const handlePrint = () => {
    if (isViewer) return;
    document.body.classList.add('printing-reel-label');

    if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.printDocument) {
      try {
        (window as any).AndroidNativeBridge.printDocument(`Label_${formData.code || 'Reel'}`);
      } catch (e) {
        console.warn('[PrintLabel] AndroidNativeBridge failed:', e);
      }
    }

    const cleanup = () => {
      document.body.classList.remove('printing-reel-label');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 2000);
    }, 120);
  };

  return createPortal(
    <div
      id="printable-reel-label-modal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain font-sans print:static print:block print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:z-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Universal QR &amp; Label Studio
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Print Reels, Stock Bays, Lots, or Any Custom QR &amp; Text Sticker
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Template Selector Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl gap-1 overflow-x-auto text-xs font-bold print:hidden">
          <button
            type="button"
            onClick={() => {
              setLabelType('REEL');
              setFormData(prev => ({
                ...prev,
                code: 'RL-1049',
                qrValue: 'RL-1049',
                product: 'Napkin Tissue (Virgin)',
                notes: 'Standard Tissue Reel · Wrap Sealed',
              }));
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              labelType === 'REEL'
                ? 'bg-[#6C4FE0] text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Paper Reel Label</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLabelType('STOCK');
              setFormData(prev => ({
                ...prev,
                code: 'BAY-A01-NAPKIN',
                qrValue: 'BAY-A01-NAPKIN-16GSM',
                product: 'Napkin Tissue 16 GSM (Bay Stock)',
                weight: '31,200 KG',
                grade: 'Bay A1 to A4 · 24 Reels',
                notes: 'Warehouse Finished Stock Bay Tag',
              }));
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              labelType === 'STOCK'
                ? 'bg-[#6C4FE0] text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Warehouse Bay / Stock Tag</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLabelType('LOT');
              setFormData(prev => ({
                ...prev,
                code: 'LOT-2026-88',
                qrValue: 'LOT-2026-88',
                product: 'Kraft / Waste Paper Grade A',
                weight: '18,500 KG',
                grade: 'Vendor: Navkar Paper Mills',
                notes: 'Moisture Tested: 7.2% · Accepted',
              }));
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              labelType === 'LOT'
                ? 'bg-[#6C4FE0] text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Raw Material Lot</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLabelType('CUSTOM');
              setFormData(prev => ({
                ...prev,
                code: 'CUSTOM-QR-001',
                qrValue: 'https://sahebpaper.com/verify?id=001',
                product: 'Custom Paper Mill Asset / Gate Pass',
                notes: 'Custom Text & Barcode Sticker',
              }));
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              labelType === 'CUSTOM'
                ? 'bg-[#6C4FE0] text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Custom / Free-form Sticker</span>
          </button>
        </div>

        {/* 2-Column Layout: Left Controls + Right Live Print Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT: Customization Inputs (7 Cols) */}
          <div className="lg:col-span-7 space-y-3.5 max-h-[480px] overflow-y-auto pr-1 print:hidden">
            
            {/* Quick Reel Selector if in Reel Mode */}
            {labelType === 'REEL' && stockReels.length > 0 && (
              <div>
                <CustomSearchableSelect
                  label="LOAD EXISTING REEL FROM STOCK"
                  placeholder="-- Choose Stock Reel --"
                  value={formData.code}
                  onChange={(val) => handleSelectReel(val)}
                  options={stockReels.map(r => ({
                    value: r.reelNo,
                    label: r.reelNo,
                    sublabel: `${r.product} • ${r.weight} kg`,
                    badge: `Grade ${r.qcGrade || 'A'}`,
                    badgeColor: r.qcGrade === 'B' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                  }))}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Reel / Barcode No
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value, qrValue: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold font-mono dark:text-white uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  QR Code Embed Value
                </label>
                <input
                  type="text"
                  value={formData.qrValue}
                  onChange={e => setFormData({ ...formData, qrValue: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold font-mono dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Product Title / Description
              </label>
              <input
                type="text"
                value={formData.product}
                onChange={e => setFormData({ ...formData, product: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">GSM</label>
                <input
                  type="text"
                  value={formData.gsm}
                  onChange={e => setFormData({ ...formData, gsm: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Size / Width</label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={e => setFormData({ ...formData, size: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Net Weight (KG)</label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={e => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white font-mono text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Ply Count</label>
                <input
                  type="text"
                  value={formData.ply}
                  onChange={e => setFormData({ ...formData, ply: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Joints</label>
                <input
                  type="text"
                  value={formData.joint || '0 Joints'}
                  onChange={e => setFormData({ ...formData, joint: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Reel Diameter</label>
                <input
                  type="text"
                  value={formData.dia || '1150 mm'}
                  onChange={e => setFormData({ ...formData, dia: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">QC Clearance Status</label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Production Date / Time</label>
                <input
                  type="text"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Notes / Instructions</label>
              <input
                type="text"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
              />
            </div>

            {/* Print Options Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Label Size:</span>
                <select
                  value={labelSize}
                  onChange={e => setLabelSize(e.target.value as any)}
                  className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
                >
                  <option value="4x6">4" x 6" (Thermal Sticker 100x150mm)</option>
                  <option value="3x2">3" x 2" (Standard Tag)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Copies:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 4].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCopies(c)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        copies === c
                          ? 'bg-[#6C4FE0] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {c}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Live Physical Sticker Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1 print:hidden">
              <span>Live Sticker Preview</span>
              <span className="text-[10px] text-blue-500 font-bold">({labelSize === '4x6' ? '4x6 inch Thermal' : '3x2 inch'})</span>
            </div>

            {/* THE PRINTABLE LABEL CONTAINER */}
            <div
              ref={printAreaRef}
              id="printable-reel-label"
              className="w-full bg-white text-slate-950 border-2 border-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xl text-left select-none print:m-0 print:p-4 print:border-2 print:border-black print:shadow-none print:rounded-none"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                maxWidth: '400px',
              }}
            >
              {/* Top Header: Company Brand & Quality Badge */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-2 mb-2.5">
                <div>
                  <div className="text-xs font-black tracking-tight text-slate-950 uppercase leading-tight font-heading">
                    {formData.title}
                  </div>
                  <div className="text-[8px] font-bold text-slate-600 mt-0.5 uppercase tracking-wider">
                    {formData.subtitle || 'Manufacturers of High Quality Tissue Paper'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950 text-white text-[8px] font-black uppercase tracking-wider">
                    <Check className="h-2.5 w-2.5 text-emerald-400" />
                    <span>{formData.grade || 'QC PASSED'}</span>
                  </span>
                  <div className="text-[7.5px] font-extrabold text-slate-500 mt-0.5">ISO 9001:2015</div>
                </div>
              </div>

              {/* QR Code & Reel Code Section */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-300 rounded-xl p-2.5 mb-2.5">
                <div className="p-1 bg-white border border-slate-900 rounded-lg shrink-0 shadow-2xs flex items-center justify-center">
                  <QRCodeSVG
                    value={formData.qrValue || formData.code}
                    size={84}
                    level="M"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    REEL IDENTIFIER / QR CODE
                  </div>
                  <div className="text-base font-black font-mono tracking-tight text-slate-950 truncate">
                    {formData.code}
                  </div>
                  <div className="text-[11px] font-black text-blue-800 line-clamp-1">
                    {formData.product}
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500 pt-0.5">
                    <span>{formData.machine || 'Rewinder #2'}</span>
                    <span>&bull;</span>
                    <span>{formData.shift || 'Shift A'}</span>
                  </div>
                </div>
              </div>

              {/* 6-Box Technical Specs Matrix */}
              <div className="grid grid-cols-3 gap-1.5 mb-2.5 text-center text-[10px]">
                <div className="p-1.5 bg-slate-100/90 border border-slate-200 rounded-lg">
                  <span className="text-[7.5px] font-black text-slate-500 block uppercase tracking-wider">GSM</span>
                  <span className="font-black text-slate-950 font-mono text-[11px]">{formData.gsm}</span>
                </div>
                <div className="p-1.5 bg-slate-100/90 border border-slate-200 rounded-lg">
                  <span className="text-[7.5px] font-black text-slate-500 block uppercase tracking-wider">SIZE</span>
                  <span className="font-black text-slate-950 font-mono text-[11px]">{formData.size}</span>
                </div>
                <div className="p-1.5 bg-slate-100/90 border border-slate-200 rounded-lg">
                  <span className="text-[7.5px] font-black text-slate-500 block uppercase tracking-wider">PLY</span>
                  <span className="font-black text-slate-950 font-mono text-[11px]">{formData.ply}</span>
                </div>
                <div className="p-1.5 bg-slate-100/90 border border-slate-200 rounded-lg">
                  <span className="text-[7.5px] font-black text-slate-500 block uppercase tracking-wider">DIAMETER</span>
                  <span className="font-black text-slate-950 font-mono text-[11px]">{formData.dia || '1150 mm'}</span>
                </div>
                <div className="p-1.5 bg-slate-100/90 border border-slate-200 rounded-lg">
                  <span className="text-[7.5px] font-black text-slate-500 block uppercase tracking-wider">CORE</span>
                  <span className="font-black text-slate-950 font-mono text-[11px]">{formData.core || '76 mm'}</span>
                </div>
                <div className="p-1.5 bg-slate-100/90 border border-slate-200 rounded-lg">
                  <span className="text-[7.5px] font-black text-slate-500 block uppercase tracking-wider">JOINTS</span>
                  <span className="font-black text-slate-950 font-mono text-[11px]">{formData.joint || '0 (Seamless)'}</span>
                </div>
              </div>

              {/* High Contrast Hero Weight Banner */}
              <div className="bg-slate-950 text-white px-3 py-2 rounded-xl flex items-center justify-between mb-2">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                    CERTIFIED NET WEIGHT
                  </span>
                  <span className="text-[9px] font-bold text-slate-300">
                    Gross / Tare Verified
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono tracking-tight text-emerald-400">
                    {formData.weight} <span className="text-xs font-normal text-white">KG</span>
                  </span>
                </div>
              </div>

              {/* Manufacturing & Packaging Info */}
              <div className="flex items-center justify-between text-[8px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 mb-2">
                <span>Mfg: <strong className="text-slate-900 font-mono">{formData.date}</strong></span>
                <span>Operator: <strong className="text-slate-900">{formData.operator || 'Plant Staff'}</strong></span>
                <span className="text-emerald-700">Wrapped &amp; Sealed</span>
              </div>

              {/* Notes / Directives */}
              <div className="text-[7.5px] font-extrabold text-slate-500 text-center uppercase tracking-wider py-0.5 border-t border-slate-200">
                <span>{formData.notes || 'Handle With Care · Keep Dry · 100% Recyclable Paper'}</span>
              </div>

              {/* Footer Company Identity */}
              <div className="border-t-2 border-slate-900 mt-1 pt-1 text-center text-[7px] leading-tight text-slate-600">
                <div className="font-extrabold text-slate-950 uppercase">{COMPANY_CONFIG.name}</div>
                <div>{COMPANY_CONFIG.address}</div>
                <div className="font-bold text-slate-700">Ph: {COMPANY_CONFIG.phone} &bull; {COMPANY_CONFIG.email} &bull; {COMPANY_CONFIG.website}</div>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="w-full mt-4 space-y-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isViewer}
                title={isViewer ? "Printing labels is locked for Viewer (Read-Only Mode)" : `Print ${copies}x Label Now`}
                className={`w-full font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isViewer
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-[#008163] hover:bg-[#006e54] text-white shadow-[#008163]/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                }`}
              >
                {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Printer className="h-4 w-4" />}
                <span>{isViewer ? 'Print Label (Locked for Viewer)' : `Print ${copies}x Label Now`}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-2.5 px-4 rounded-2xl text-xs uppercase tracking-wider hover:bg-slate-200 transition cursor-pointer text-center"
              >
                Close Studio
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};

export default PrintLabelModal;
