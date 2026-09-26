import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { BoilerView } from './BoilerView';
import { EtpView } from '../etp/EtpView';
import { ElectricityView } from '../electricity/ElectricityView';
import { Flame, Droplet, Lightbulb, AlertTriangle } from 'lucide-react';

interface UtilitiesEtpViewProps {
  initialTab?: 'boiler' | 'etp_chemicals' | 'electricity';
}

export const UtilitiesEtpView: React.FC<UtilitiesEtpViewProps> = ({ initialTab }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isUserAdmin = user?.role === 'Admin' || (user?.roles && user.roles.includes('Admin'));

  const userModules = user?.customModules && Array.isArray(user.customModules) ? user.customModules : [];
  // For backwards compatibility: if account only has legacy utilities_etp without specific sub-modules, grant all 3
  const hasLegacyAll = userModules.includes('utilities_etp') && !userModules.includes('boiler') && !userModules.includes('etp') && !userModules.includes('electricity');

  const canAccessBoiler = isUserAdmin || hasLegacyAll || (
    user?.customModules && Array.isArray(user.customModules)
      ? user.customModules.includes('boiler')
      : true
  );
  const canAccessEtp = isUserAdmin || hasLegacyAll || (
    user?.customModules && Array.isArray(user.customModules)
      ? (user.customModules.includes('etp') || user.customModules.includes('etp_chemicals'))
      : true
  );
  const canAccessElectricity = isUserAdmin || hasLegacyAll || (
    user?.customModules && Array.isArray(user.customModules)
      ? user.customModules.includes('electricity')
      : true
  );

  // Read tab from path, initialTab prop, or ?tab= query param
  const getTabFromUrl = (): 'boiler' | 'etp_chemicals' | 'electricity' => {
    // 1. If explicit initialTab is passed from route, use it
    if (initialTab) {
      if (initialTab === 'boiler' && canAccessBoiler) return 'boiler';
      if (initialTab === 'etp_chemicals' && canAccessEtp) return 'etp_chemicals';
      if (initialTab === 'electricity' && canAccessElectricity) return 'electricity';
    }

    const path = location.pathname.toLowerCase();

    // 2. Check specific end-route segments (do NOT match generic "etp" inside "utilities-&-etp")
    if (path.includes('boiler-operations') || path.endsWith('/boiler')) {
      if (canAccessBoiler) return 'boiler';
    }
    if (path.includes('etp-water') || path.includes('etp-chemicals') || path.endsWith('/etp')) {
      if (canAccessEtp) return 'etp_chemicals';
    }
    if (path.includes('electricity') || path.includes('power-grid')) {
      if (canAccessElectricity) return 'electricity';
    }

    // 3. Check query param ?tab=
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'boiler' && canAccessBoiler) return 'boiler';
    if ((tab === 'etp' || tab === 'etp_chemicals') && canAccessEtp) return 'etp_chemicals';
    if (tab === 'electricity' && canAccessElectricity) return 'electricity';

    // 4. Default fallback based on permissions
    if (canAccessBoiler) return 'boiler';
    if (canAccessEtp) return 'etp_chemicals';
    if (canAccessElectricity) return 'electricity';
    return 'boiler';
  };

  const [activeTab, setActiveTab] = useState<'boiler' | 'etp_chemicals' | 'electricity'>(getTabFromUrl);

  // Sync tab when URL pathname or search query param changes
  useEffect(() => {
    const targetTab = getTabFromUrl();
    setActiveTab(targetTab);

    // If current URL points to a sub-section the user doesn't have permission for, gracefully redirect to their permitted section
    const path = location.pathname.toLowerCase();
    if ((path.includes('boiler-operations') || path.endsWith('/boiler')) && !canAccessBoiler) {
      if (canAccessEtp) navigate('/utilities-&-etp/etp-water-&-chemicals', { replace: true });
      else if (canAccessElectricity) navigate('/utilities-&-etp/electricity-&-power-grid', { replace: true });
    } else if ((path.includes('etp-water') || path.includes('etp-chemicals') || path.endsWith('/etp')) && !canAccessEtp) {
      if (canAccessBoiler) navigate('/utilities-&-etp/boiler-operations', { replace: true });
      else if (canAccessElectricity) navigate('/utilities-&-etp/electricity-&-power-grid', { replace: true });
    } else if ((path.includes('electricity') || path.includes('power-grid')) && !canAccessElectricity) {
      if (canAccessBoiler) navigate('/utilities-&-etp/boiler-operations', { replace: true });
      else if (canAccessEtp) navigate('/utilities-&-etp/etp-water-&-chemicals', { replace: true });
    }
  }, [location.pathname, location.search, initialTab, canAccessBoiler, canAccessEtp, canAccessElectricity]);

  const handleTabChange = (tab: 'boiler' | 'etp_chemicals' | 'electricity') => {
    setActiveTab(tab);
    if (tab === 'boiler') {
      navigate('/utilities-&-etp/boiler-operations');
    } else if (tab === 'etp_chemicals') {
      navigate('/utilities-&-etp/etp-water-&-chemicals');
    } else if (tab === 'electricity') {
      navigate('/utilities-&-etp/electricity-&-power-grid');
    }
  };

  if (!canAccessBoiler && !canAccessEtp && !canAccessElectricity) {
    return (
      <div className="p-8 text-center bg-white dark:bg-surface-dark rounded-2xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 font-bold text-sm flex items-center justify-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <span>Access Denied: You do not have permission to view Boiler, ETP, or Electricity modules.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher Headers - Only show tabs user has permission for */}
      <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex flex-wrap sm:flex-nowrap gap-1.5 border border-slate-200 dark:border-slate-700/80 shadow-inner print:hidden">
        {canAccessBoiler && (
          <button
            onClick={() => handleTabChange('boiler')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              activeTab === 'boiler'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <Flame className="h-4 w-4" />
            <span>Boiler Operations</span>
          </button>
        )}

        {canAccessEtp && (
          <button
            onClick={() => handleTabChange('etp_chemicals')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              activeTab === 'etp_chemicals'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <Droplet className="h-4 w-4" />
            <span>ETP Water &amp; Chemicals</span>
          </button>
        )}

        {canAccessElectricity && (
          <button
            onClick={() => handleTabChange('electricity')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              activeTab === 'electricity'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:bg-slate-700/50'
            }`}
          >
            <Lightbulb className="h-4 w-4" />
            <span>Electricity &amp; Power Grid</span>
          </button>
        )}
      </div>

      {/* RENDER VIEWS */}
      <div className="pt-2">
        {activeTab === 'boiler' && canAccessBoiler && <BoilerView />}
        {activeTab === 'etp_chemicals' && canAccessEtp && <EtpView />}
        {activeTab === 'electricity' && canAccessElectricity && <ElectricityView />}
      </div>

    </div>
  );
};

export default UtilitiesEtpView;
