import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { FinishStockView } from '../finish-stock/FinishStockView';
import { DispatchView } from './DispatchView';
import { QRScannerView } from '../rewinder/QRScannerView';
import { PrintLabelModal } from '../../components/PrintLabelModal';
import { Package, Truck, QrCode, AlertTriangle } from 'lucide-react';
import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';

export const FinishedStockDispatchView: React.FC = () => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();

  const isUserAdmin = user?.role === 'Admin' || (user?.roles && user.roles.includes('Admin'));

  const canAccessFinishStock = true;
  const canAccessDispatch = true;
  const canAccessScanner = true;

  const [activeTab, setActiveTab] = useState<'stock_category' | 'dispatch_mgmt' | 'qr_scanner'>(() => {
    return 'stock_category';
  });

  const [showPrintLabelModal, setShowPrintLabelModal] = useState(false);
  const [selectedReelForPrint, setSelectedReelForPrint] = useState<any>(null);
  const [selectedCodeForPrint, setSelectedCodeForPrint] = useState<string>('');

  const handleOpenPrintStudio = (reel?: any, code?: string) => {
    if (isViewer) return;
    setSelectedReelForPrint(reel || null);
    setSelectedCodeForPrint(code || (reel ? reel.reelNo : ''));
    setShowPrintLabelModal(true);
  };

  if (!canAccessFinishStock && !canAccessDispatch) {
    return (
      <div className="p-8 text-center bg-white dark:bg-surface-dark rounded-2xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 font-bold text-sm flex items-center justify-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <span>Access Denied: You do not have permission to view Finish Stock or Dispatch modules.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans pb-16 w-full text-left relative">

      {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
      <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs relative z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
              <Package className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white truncate">
                  Stock Categorization
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Grade A / B stock categorization &amp; warehouse vault.
              </p>
            </div>
          </div>

          {/* Action Buttons: Scanner Quick Button (Mobile Only) */}
          {canAccessScanner && (
            <div className="flex md:hidden items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('qr_scanner')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${activeTab === 'qr_scanner'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                title="Open QR Reel Dispatch Scanner"
              >
                <QrCode className="h-4 w-4" />
                <span>Scan</span>
              </button>
            </div>
          )}
        </div>
      </div>



      {/* 3. RENDER VIEWS */}
      <div className="pt-1">
        {activeTab === 'stock_category' && canAccessFinishStock && <FinishStockView hideHeader={true} />}
        {activeTab === 'qr_scanner' && canAccessScanner && <QRScannerView onOpenPrintStudio={handleOpenPrintStudio} />}
      </div>

      {/* 4. FLOATING QUICK SCAN BUTTON (Visible only on mobile screens when not on scanner tab) */}
      {canAccessScanner && activeTab !== 'qr_scanner' && (
        <button
          onClick={() => setActiveTab('qr_scanner')}
          className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-[#6C4FE0] to-[#7C3AED] hover:from-[#5B3DC9] hover:to-[#6C4FE0] text-white font-extrabold px-5 py-3 rounded-full shadow-2xl shadow-[#6C4FE0]/50 flex md:hidden items-center gap-2.5 text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer border border-purple-400/30 backdrop-blur-sm"
          title="Quick QR Reel Scanner"
        >
          <QrCode className="h-4.5 w-4.5 text-purple-200" />
          <span>Scan Reel</span>
        </button>
      )}

      {/* 5. UNIVERSAL PRINT LABEL MODAL */}
      <PrintLabelModal
        isOpen={showPrintLabelModal}
        onClose={() => setShowPrintLabelModal(false)}
        initialReel={selectedReelForPrint}
        initialCode={selectedCodeForPrint}
      />

    </div>
  );
};

export default FinishedStockDispatchView;
