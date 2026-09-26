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
      {/* RENDER VIEWS */}
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
