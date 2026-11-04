import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { FinishStockView } from '../finish-stock/FinishStockView';
import { PrintLabelModal } from '../../components/PrintLabelModal';
import { AlertTriangle } from 'lucide-react';

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
      </div>

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
