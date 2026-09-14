import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth, getFirstAccessibleRoute } from '../auth/AuthContext';
import { getUsers, updateUserModules } from '../../data/index';
import type { User, ModuleDefinition } from '../../data/types';
import { sortUsersByHierarchy } from '../../data/types';
export { getFirstAccessibleRoute };
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  Plus,
  Check,
  UserCheck,
  Zap,
  Lock,
  Eye,
} from 'lucide-react';

const ERP_MODULES: ModuleDefinition[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'raw_material_stock', label: 'Raw Material' },
  { key: 'pulp_mill_operations', label: 'Pulp Mill' },
  { key: 'machine_production', label: 'Plant Manager' },
  { key: 'rewinding_reel_conversion', label: 'Rewinder' },
  { key: 'boiler', label: 'Boiler' },
  { key: 'etp', label: 'ETP' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'orders', label: 'Pending Orders' },
  { key: 'finished_stock_dispatch', label: 'Finish Stock' },
  { key: 'dispatch', label: 'Dispatch' },
  { key: 'spareparts_management', label: 'Store (Spares)' },
  { key: 'label_studio', label: 'Label Studio' },
  { key: 'monthly_yearly_reporting', label: 'Reports & Analytics' },
];

const isModuleActive = (user: User, moduleKey: string): boolean => {
  const activeModules = user.customModules && Array.isArray(user.customModules)
    ? user.customModules
    : (user.role === 'Admin' ? ERP_MODULES.map(m => m.key) : []);

  if (moduleKey === 'etp') {
    return activeModules.includes('etp') || activeModules.includes('etp_chemicals');
  }
  return activeModules.includes(moduleKey);
};

export const RoleManagementView: React.FC = () => {
  const { user: currentUser, simulateWorkerLogin, exitSimulation, isSimulating, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>(() => sortUsersByHierarchy(getUsers()));
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    const handleSync = () => {
      setUsers(sortUsersByHierarchy(getUsers()));
    };
    window.addEventListener('saheb_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('saheb_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const filtered = users.filter(u => {
      const matchSearch =
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.empId && u.empId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.designation && u.designation.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
    return sortUsersByHierarchy(filtered);
  }, [users, searchTerm]);

  if (currentUser?.role !== 'Admin') {
    if (isSimulating) {
      return <Navigate to={getFirstAccessibleRoute(currentUser)} replace />;
    }

    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-800 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-base font-black text-slate-900 dark:text-white">Access Restricted</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
          Role & Module Permission management is restricted to Super Admin only.
        </p>
      </div>
    );
  }

  const handleToggleModule = (targetUser: User, moduleKey: string) => {
    if (targetUser.role === 'Admin' || targetUser.username.toLowerCase() === 'admin') {
      triggerToast("Super Admin permissions cannot be modified. All modules are permanently active & locked.");
      return;
    }

    const currentModules = targetUser.customModules && Array.isArray(targetUser.customModules)
      ? [...targetUser.customModules]
      : ERP_MODULES.map(m => m.key);

    const active = isModuleActive(targetUser, moduleKey);
    let updatedModules: string[];

    if (active) {
      if (moduleKey === 'etp') {
        updatedModules = currentModules.filter(m => m !== 'etp' && m !== 'etp_chemicals');
      } else {
        updatedModules = currentModules.filter(m => m !== moduleKey);
      }
    } else {
      updatedModules = [...currentModules, moduleKey];
    }

    // Strictly restrict updatedModules to the 13 canonical ERP modules
    updatedModules = updatedModules.filter(m => ERP_MODULES.some(mod => mod.key === m));

    // Optimistically update in-place with guaranteed permanent order
    setUsers(prev => {
      const updated = prev.map(u =>
        u.username.toLowerCase().trim() === targetUser.username.toLowerCase().trim()
          ? { ...u, customModules: updatedModules }
          : u
      );
      return sortUsersByHierarchy(updated);
    });

    // Save to storage & cloud
    updateUserModules(targetUser.username, updatedModules, currentUser?.displayName || 'Admin');
    
    // If updating current active user session, update state
    if (currentUser?.username.toLowerCase() === targetUser.username.toLowerCase()) {
      updateUserProfile({ customModules: updatedModules });
    }
    
    const modLabel = ERP_MODULES.find(m => m.key === moduleKey)?.label || moduleKey;
    const action = active ? 'disabled for' : 'granted to';
    triggerToast(`"${modLabel}" role ${action} ${targetUser.displayName}`);
  };

  const handleSimulateLogin = async (targetUser: User) => {
    if (currentUser?.username.toLowerCase() === targetUser.username.toLowerCase()) {
      if (isSimulating) {
        await exitSimulation();
        triggerToast(`Exited simulation. Restored Admin session.`);
        navigate('/admin-panel-audit?tab=roles', { state: { tab: 'roles' } });
      } else {
        triggerToast(`Currently active as ${targetUser.displayName}`);
      }
      return;
    }

    const targetRoute = getFirstAccessibleRoute(targetUser);
    navigate(targetRoute, { replace: true });
    const success = await simulateWorkerLogin(targetUser.username);
    if (success) {
      triggerToast(`Simulating active worker session: ${targetUser.displayName} (${targetUser.designation || targetUser.role})`);
    }
  };

  return (
    <div className="space-y-4 font-sans pb-12 w-full text-left">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-blue-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. NEOMORPHIC HEADER CARD */}
      <div className="bg-white dark:bg-[#131d38] rounded-[24px] p-5 sm:p-6 text-slate-900 dark:text-white shadow-[5px_5px_16px_rgba(170,185,220,0.18),-5px_-5px_16px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_14px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[16px] bg-[#EEF4FF] dark:bg-blue-950/60 shadow-[inset_1.5px_1.5px_3px_rgba(180,195,230,0.2),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-center text-[#2563EB] dark:text-blue-400 shrink-0">
              <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Role Management &amp; Permissions Matrix
                </h1>
                <span className="px-3 py-0.5 rounded-[10px] bg-[#EEF4FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 text-[11px] font-bold shadow-[2px_2px_5px_rgba(180,195,230,0.2),-2px_-2px_5px_rgba(255,255,255,0.9)] dark:shadow-none">
                  Security
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Granularly assign ERP modules to worker profiles and simulate worker sessions to test permissions.
              </p>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search worker profile or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F4F7FC] dark:bg-slate-900 border-none rounded-[16px] text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-[inset_1.5px_1.5px_3px_rgba(180,195,230,0.25),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.9)] dark:shadow-none"
            />
          </div>
        </div>
      </div>

      {/* USER PROFILE CARDS LIST */}
      <div className="space-y-4">
        {filteredUsers.map(u => {
          const isCurrent = currentUser?.username.toLowerCase() === u.username.toLowerCase();
          const activeCount = ERP_MODULES.filter(m => isModuleActive(u, m.key)).length;
          const isPulper = u.username.toLowerCase().includes('pulper') || u.role === 'LabOperator';
          const empId = isPulper
            ? 'EMP-002'
            : (u.empId || (
                u.role === 'Admin' ? 'EMP-001' :
                u.username.toLowerCase().includes('manager') || u.role === 'PlantManager' ? 'EMP-003' :
                u.role === 'Dispatcher' ? 'EMP-004' :
                u.username.toLowerCase().includes('shop') || u.role === 'Shopper' ? 'EMP-005' :
                u.role === 'Viewer' ? 'EMP-006' : 'EMP-000'
              ));
          const designation = u.designation || (u.role === 'Admin' ? 'Admin / Owner' : `${u.displayName} (${u.role})`);

          return (
            <div
              key={u.username}
              className="bg-white dark:bg-[#131d38] rounded-[24px] p-5 sm:p-6 shadow-[5px_5px_16px_rgba(170,185,220,0.18),-5px_-5px_16px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_14px_rgba(0,0,0,0.35)] space-y-4 transition-all"
            >
              {/* CARD HEADER */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3.5">
                  {/* User Initial Circle */}
                  <div className="w-11 h-11 rounded-[16px] bg-[#EEF4FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 font-black text-lg flex items-center justify-center shrink-0 shadow-[2px_2px_5px_rgba(180,195,230,0.25),-2px_-2px_5px_rgba(255,255,255,0.95)] dark:shadow-none">
                    {u.displayName.substring(0, 1).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{u.displayName}</h3>
                      <span className="px-2.5 py-0.5 rounded-[10px] bg-[#F4F7FC] dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase shadow-[1px_1px_3px_rgba(180,195,230,0.15)]">
                        {empId}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60">
                        Active
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#2563EB] dark:text-blue-400 mt-0.5">{designation}</p>
                  </div>
                </div>

                {/* RIGHT ACTIONS: COUNTER & SIMULATE BUTTON */}
                <div className="flex items-center gap-3 self-start md:self-auto">
                  {u.role === 'Admin' || u.username.toLowerCase() === 'admin' ? (
                    <div className="px-3.5 py-1.5 rounded-[14px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-wide border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-1.5 shadow-[inset_1px_1px_2px_rgba(180,195,230,0.2)]">
                      <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{ERP_MODULES.length} / {ERP_MODULES.length} Modules (Permanent Super Admin - Locked)</span>
                    </div>
                  ) : u.role === 'Viewer' || u.username.toLowerCase() === 'viewer' ? (
                    <div className="px-3.5 py-1.5 rounded-[14px] bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide border border-blue-200/80 dark:border-blue-800/60 flex items-center gap-1.5 shadow-[inset_1px_1px_2px_rgba(180,195,230,0.2)]">
                      <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{ERP_MODULES.length} / {ERP_MODULES.length} Modules (Read-Only Viewer Access)</span>
                    </div>
                  ) : (
                    <div className="px-3.5 py-1.5 rounded-[14px] bg-[#F4F7FC] dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold tracking-wide shadow-[inset_1px_1px_2px_rgba(180,195,230,0.2)]">
                      {activeCount} / {ERP_MODULES.length} Modules Active
                    </div>
                  )}

                  <button
                    onClick={() => handleSimulateLogin(u)}
                    className={`px-4 py-2 rounded-[14px] text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                      isCurrent && isSimulating
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-[2px_2px_8px_rgba(245,158,11,0.35)]'
                        : isCurrent
                        ? 'bg-[#F4F7FC] dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default'
                        : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-[2px_2px_8px_rgba(37,99,235,0.35)]'
                    }`}
                  >
                    {isCurrent && isSimulating ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5 text-white" />
                        <span>Exit Simulation</span>
                      </>
                    ) : isCurrent ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5 text-[#2563EB] dark:text-blue-400" />
                        <span>Current Admin</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5 text-amber-300" />
                        <span>Simulate Worker Login</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* TOGGLE SUBHEADER */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">
                <span>Module Permissions for {u.displayName}:</span>
                {(u.role === 'Admin' || u.username.toLowerCase() === 'admin') && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[11px] font-bold border border-amber-200 dark:border-amber-800/50">
                    <Lock className="h-3 w-3" />
                    Roles &amp; Permissions Locked (All {ERP_MODULES.length} Modules Permanent)
                  </span>
                )}
                {(u.role === 'Viewer' || u.username.toLowerCase() === 'viewer') && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-[11px] font-bold border border-blue-200 dark:border-blue-800/50">
                    <Eye className="h-3 w-3" />
                    Read-Only Watcher (All {ERP_MODULES.length} Modules Accessible)
                  </span>
                )}
              </div>

              {/* ERP MODULE CHIPS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {ERP_MODULES.map(mod => {
                  const isActive = isModuleActive(u, mod.key);
                  const isUserAdmin = u.role === 'Admin' || u.username.toLowerCase() === 'admin';

                  return (
                    <button
                      key={mod.key}
                      onClick={() => {
                        if (isUserAdmin) {
                          triggerToast("Super Admin permissions cannot be modified. All modules are permanently locked active.");
                          return;
                        }
                        handleToggleModule(u, mod.key);
                      }}
                      disabled={isUserAdmin}
                      title={isUserAdmin ? "Super Admin permissions are permanently active and locked." : undefined}
                      className={`px-3 py-2 rounded-[14px] text-xs font-bold transition-all flex items-center gap-2 select-none active:scale-95 truncate ${
                        isUserAdmin
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 cursor-not-allowed opacity-95 shadow-xs'
                          : isActive
                          ? 'bg-[#E8F0FE] text-[#1D4ED8] dark:bg-blue-950/60 dark:text-blue-300 shadow-[2px_2px_5px_rgba(180,195,230,0.25),-2px_-2px_5px_rgba(255,255,255,0.95)] dark:shadow-none cursor-pointer'
                          : 'bg-[#F4F7FC] hover:bg-[#EDF2F9] dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-[2px_2px_5px_rgba(170,185,220,0.15),-2px_-2px_5px_rgba(255,255,255,0.9)] dark:shadow-none cursor-pointer'
                      }`}
                    >
                      {isUserAdmin ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Lock className="h-2.5 w-2.5 stroke-[2.5]" />
                        </div>
                      ) : isActive ? (
                        <div className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <Plus className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                      )}
                      <span className="truncate">{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs font-bold bg-white dark:bg-[#131d38] rounded-[24px] shadow-[5px_5px_16px_rgba(170,185,220,0.18),-5px_-5px_16px_rgba(255,255,255,0.9)]">
            No worker profiles matching search term.
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagementView;
