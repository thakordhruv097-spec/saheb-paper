import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getFirstAccessibleRoute } from '../auth/AuthContext';
import { getUsers, saveUser, deactivateUser, addLog, deleteUser } from '../../data/index';
import { isPinHashed } from '../../lib/security';
import type { User, UserRole } from '../../data/types';
import {
  Users,
  Plus,
  Shield,
  ShieldAlert,
  Search,
  UserCheck,
  UserX,
  X,
  Pencil,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  Save,
  Check,
  User as UserIcon,
  AtSign,
  Phone,
  Lock,
  Building2,
  FlaskConical,
  ShoppingCart,
  Truck,
  Package,
  Cog,
  Info,
  UserPlus,
  LogOut,
  Crown,
} from 'lucide-react';

interface MasterRoleItem {
  key: UserRole;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MASTER_ROLES: MasterRoleItem[] = [
  { key: 'Admin', label: 'Admin Owner', desc: 'Full Master System Control', icon: Shield },
  { key: 'PlantManager', label: 'Lab Quality Control', desc: 'Paper Quality & Lab Testing', icon: FlaskConical },
  { key: 'LabOperator', label: 'Pulper (Pulp Mill)', desc: 'Pulper & Pulp Mill Operations', icon: Building2 },
  { key: 'Viewer', label: 'Viewer', desc: 'Read-Only System Observer', icon: Eye },
  { key: 'Shopper', label: 'Shopper (Purchase)', desc: 'Waste Paper & Chemical Purchase', icon: ShoppingCart },
  { key: 'Dispatcher', label: 'Dispatcher', desc: 'Reel Stock & Delivery Order', icon: Truck },
  { key: 'StoreManager', label: 'Store / Spares', desc: 'Spare Parts & Inventory', icon: Package },
  { key: 'MachineOperator', label: 'Machinery', desc: 'Paper Machine & Roll Production', icon: Cog },
];

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  PlantManager: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  LabOperator: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  Shopper: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  Dispatcher: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  StoreManager: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  MachineOperator: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  Machinery: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
};

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Admin Owner',
  PlantManager: 'Lab Quality Control',
  LabOperator: 'Pulper (Pulp Mill)',
  Viewer: 'Viewer',
  Shopper: 'Shopper (Purchase)',
  Dispatcher: 'Dispatcher',
  StoreManager: 'Store / Spares',
  MachineOperator: 'Machinery',
  Machinery: 'Machinery',
};

export const UserManagementView: React.FC = () => {
  const { user: currentUser, isSimulating } = useAuth();

  const [users, setUsers] = useState<User[]>(() => getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    pin: '',
    roles: ['PlantManager'] as UserRole[],
    email: '',
    phone: '',
  });

  const [formError, setFormError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const togglePinVisibility = (username: string) => {
    setVisiblePins(prev => ({ ...prev, [username]: !prev[username] }));
  };

  const toggleFormRole = (roleKey: UserRole) => {
    setFormData(prev => {
      const exists = prev.roles.includes(roleKey);
      if (exists) {
        if (prev.roles.length === 1) return prev; 
        return { ...prev, roles: prev.roles.filter(r => r !== roleKey) };
      } else {
        return { ...prev, roles: [...prev.roles, roleKey] };
      }
    });
  };

  const handleOpenAddModal = () => {
    setFormData({
      username: '',
      displayName: '',
      pin: '',
      roles: ['PlantManager'],
      email: '',
      phone: '',
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    const existingRoles = u.roles && u.roles.length > 0 ? u.roles : [u.role];
    setFormData({
      username: u.username,
      displayName: u.displayName,
      pin: '',
      roles: existingRoles,
      email: u.email || '',
      phone: u.phone || '',
    });
    setFormError('');
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.username.trim() || !formData.displayName.trim() || !formData.pin.trim()) {
      setFormError('Display Name, Username, and 4-Digit PIN are required');
      return;
    }

    if (formData.roles.length === 0) {
      setFormError('Please select at least 1 role for this user account');
      return;
    }

    if (formData.pin.length !== 4 || isNaN(Number(formData.pin))) {
      setFormError('PIN must be exactly 4 numeric digits');
      return;
    }

    const cleanUsername = formData.username.trim().toLowerCase().replace(/\s+/g, '_');
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      setFormError(`Username "@${cleanUsername}" already exists!`);
      return;
    }

    const defaultModulesForRoles = new Set<string>();
    formData.roles.forEach(r => {
      if (r === 'Admin') {
        ['dashboard', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion', 'boiler', 'etp', 'electricity', 'orders', 'finished_stock_dispatch', 'dispatch', 'spareparts_management', 'label_studio', 'monthly_yearly_reporting'].forEach(m => defaultModulesForRoles.add(m));
      } else if (r === 'Dispatcher') {
        ['orders', 'finished_stock_dispatch', 'dispatch'].forEach(m => defaultModulesForRoles.add(m));
      } else if (r === 'PlantManager') {
        ['dashboard', 'lab', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion', 'boiler', 'etp', 'electricity', 'dispatch', 'finished_stock_dispatch'].forEach(m => defaultModulesForRoles.add(m));
      } else if (r === 'LabOperator') {
        ['raw_material_stock', 'pulp_mill_operations', 'boiler', 'etp', 'lab'].forEach(m => defaultModulesForRoles.add(m));
      } else if (r === 'MachineOperator' || (r as string) === 'Machinery') {
        ['machine_production', 'rewinding_reel_conversion', 'raw_material_stock'].forEach(m => defaultModulesForRoles.add(m));
      } else if (r === 'Shopper') {
        ['spareparts_management'].forEach(m => defaultModulesForRoles.add(m));
      } else if (r === 'StoreManager') {
        ['spareparts_management'].forEach(m => defaultModulesForRoles.add(m));
      } else if (r === 'Viewer') {
        ['dashboard', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion', 'boiler', 'etp', 'electricity', 'orders', 'finished_stock_dispatch', 'dispatch', 'spareparts_management', 'label_studio', 'monthly_yearly_reporting'].forEach(m => defaultModulesForRoles.add(m));
      }
    });

    const newUser: User = {
      username: cleanUsername,
      displayName: formData.displayName.trim(),
      role: formData.roles[0],
      roles: formData.roles,
      pin: formData.pin.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      active: true,
      isNewUser: true,
      customModules: Array.from(defaultModulesForRoles),
    };

    saveUser(newUser);
    setUsers(getUsers());
    setShowAddModal(false);
    triggerToast(`User "${newUser.displayName}" created successfully!`);
    addLog('Admin', 'User Created', `Created account @${newUser.username} with roles: ${newUser.roles?.join(', ')}`, currentUser?.displayName || 'Admin');
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError('');

    if (!formData.displayName.trim()) {
      setFormError('Display Name is required');
      return;
    }

    if (formData.roles.length === 0) {
      setFormError('Please select at least 1 role for this user account');
      return;
    }

    const pinTrimmed = formData.pin.trim();
    if (pinTrimmed && (pinTrimmed.length !== 4 || isNaN(Number(pinTrimmed)))) {
      setFormError('PIN must be exactly 4 numeric digits');
      return;
    }

    const editModulesForRoles = new Set<string>(editingUser.customModules || []);
    formData.roles.forEach(r => {
      if (r === 'Dispatcher') {
        ['orders', 'finished_stock_dispatch', 'dispatch'].forEach(m => editModulesForRoles.add(m));
      } else if (r === 'PlantManager') {
        ['lab', 'dispatch', 'finished_stock_dispatch'].forEach(m => editModulesForRoles.add(m));
      } else if (r === 'MachineOperator' || (r as string) === 'Machinery') {
        ['machine_production', 'rewinding_reel_conversion'].forEach(m => editModulesForRoles.add(m));
      } else if (r === 'StoreManager') {
        ['spareparts_management'].forEach(m => editModulesForRoles.add(m));
      }
    });

    const isMasterAdmin = editingUser.username === 'admin';
    const updated: User = {
      ...editingUser,
      displayName: formData.displayName.trim(),
      role: isMasterAdmin ? 'Admin' : formData.roles[0],
      roles: isMasterAdmin ? ['Admin'] : formData.roles,
      pin: pinTrimmed ? pinTrimmed : editingUser.pin,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      customModules: isMasterAdmin ? editingUser.customModules : Array.from(editModulesForRoles),
    };

    saveUser(updated);
    setUsers(getUsers());
    setEditingUser(null);
    triggerToast(`User "${updated.displayName}" updated successfully!`);
    addLog('Admin', 'User Updated', `Updated account @${updated.username} with roles: ${updated.roles?.join(', ')}`, currentUser?.displayName || 'Admin');
  };

  const handleToggleActive = (u: User) => {
    if (u.username === currentUser?.username) {
      alert('You cannot deactivate your own Admin account!');
      return;
    }
    deactivateUser(u.username, currentUser?.displayName || 'Admin');
    setUsers(getUsers());
    const newStatus = u.active === false ? 'Activated' : 'Deactivated';
    triggerToast(`User "${u.displayName}" account ${newStatus}!`);
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    if (deletingUser.username === currentUser?.username) {
      alert('You cannot delete your own Admin account!');
      setDeletingUser(null);
      return;
    }
    deleteUser(deletingUser.username);
    setUsers(getUsers());
    triggerToast(`User "${deletingUser.displayName}" removed permanently`);
    setDeletingUser(null);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase());
      const uRoles = u.roles || [u.role];
      const matchRole = filterRole === 'ALL' || uRoles.includes(filterRole as UserRole);
      return matchSearch && matchRole;
    });
  }, [users, searchTerm, filterRole]);

  if (currentUser?.role !== 'Admin' && currentUser?.username.toLowerCase() !== 'admin') {
    if (isSimulating) {
      return <Navigate to={getFirstAccessibleRoute(currentUser)} replace />;
    }
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-800 space-y-3 max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-base font-black text-slate-900 dark:text-white">Access Restricted</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
          User Management is strictly restricted to Super Admin only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans pb-12 text-left">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="bg-white dark:bg-[#131d38] rounded-[24px] p-5 sm:p-6 shadow-[5px_5px_16px_rgba(170,185,220,0.18),-5px_-5px_16px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_14px_rgba(0,0,0,0.35)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[16px] bg-[#EEF2FF] dark:bg-indigo-950/60 shadow-[inset_1.5px_1.5px_3px_rgba(180,195,230,0.2),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-center text-[#6366F1] dark:text-indigo-400 shrink-0">
            <Users className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                User Accounts &amp; Multi-Role Access
              </h2>
              <span className="px-2.5 py-0.5 rounded-[10px] bg-[#EEF2FF] text-[#6366F1] dark:bg-indigo-950/60 dark:text-indigo-400 text-xs font-bold shadow-[1px_1px_3px_rgba(180,195,230,0.2)]">
                {users.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage employee accounts, assign 1 or multiple roles per person, and configure 4-digit security PINs
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 rounded-[16px] bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-xs shadow-[2px_2px_8px_rgba(99,102,241,0.35)] transition cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Add New User</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#131d38] rounded-[20px] p-3 sm:p-4 shadow-[4px_4px_12px_rgba(170,185,220,0.15),-4px_-4px_12px_rgba(255,255,255,0.9)] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#F4F7FC] dark:bg-slate-900 border-none rounded-[14px] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-[inset_1.5px_1.5px_3px_rgba(180,195,230,0.2)] dark:shadow-none"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
          <span>Showing <strong className="text-slate-800 dark:text-white">{filteredUsers.length}</strong> of {users.length} accounts</span>
        </div>
      </div>

      <div className="hidden md:block bg-white dark:bg-[#131d38] rounded-[24px] overflow-hidden shadow-[5px_5px_16px_rgba(170,185,220,0.18),-5px_-5px_16px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_14px_rgba(0,0,0,0.35)]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8FAFD] dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
              <th className="py-4 px-6">User Details</th>
              <th className="py-4 px-6 text-center">Assigned Roles (Multi-Role)</th>
              <th className="py-4 px-6">Mobile &amp; Email</th>
              <th className="py-4 px-6">4-Digit PIN</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredUsers.map(u => {
              const assignedRoles = u.roles && u.roles.length > 0 ? u.roles : [u.role];
              return (
                <tr key={u.username} className={`hover:bg-[#F8FAFD]/70 dark:hover:bg-slate-800/40 transition ${u.active === false ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-[14px] bg-[#EEF2FF] dark:bg-indigo-950/60 flex items-center justify-center text-[#6366F1] font-black text-xs shrink-0 shadow-[1px_1px_3px_rgba(180,195,230,0.2)]">
                        {u.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{u.displayName}</div>
                        <div className="font-mono text-slate-400 text-[11px]">@{u.username}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-center">
                    <div className="flex flex-wrap gap-1.5 justify-center items-center">
                      {assignedRoles.map(rKey => (
                        <span key={rKey} className={`inline-flex items-center justify-center px-3 py-1 rounded-[10px] text-[11px] font-bold border ${ROLE_COLORS[rKey] || 'bg-slate-100 text-slate-700'}`}>
                          {ROLE_LABELS[rKey] || rKey}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-4 px-6 font-mono text-slate-600 dark:text-slate-300">
                    <div>{u.phone || 'No Mobile'}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{u.email || 'No Email'}</div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>{visiblePins[u.username] ? (isPinHashed(u.pin) ? 'SHA-256 (Protected)' : (u.pin || '1234')) : '••••'}</span>
                      <button
                        onClick={() => togglePinVisibility(u.username)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                        title={visiblePins[u.username] ? 'Hide PIN' : 'Show PIN'}
                      >
                        {visiblePins[u.username] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                        u.active !== false
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
                      }`}
                    >
                      {u.active !== false ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                      <span>{u.active !== false ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="p-2 rounded-[10px] bg-[#F4F7FC] dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#6366F1] transition cursor-pointer shadow-xs"
                        title="Edit Account"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {u.username !== 'admin' && (
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-2 rounded-[10px] bg-[#F4F7FC] dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 transition cursor-pointer shadow-xs"
                          title="Delete Account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredUsers.map(u => {
          const assignedRoles = u.roles && u.roles.length > 0 ? u.roles : [u.role];
          return (
            <div
              key={u.username}
              className="bg-white dark:bg-[#131d38] rounded-[20px] p-4 shadow-[4px_4px_12px_rgba(170,185,220,0.15),-4px_-4px_12px_rgba(255,255,255,0.9)] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-[12px] bg-[#EEF2FF] text-[#6366F1] font-black text-xs flex items-center justify-center">
                    {u.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{u.displayName}</div>
                    <div className="font-mono text-slate-400 text-xs">@{u.username}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(u)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {u.username !== 'admin' && (
                    <button
                      onClick={() => setDeletingUser(u)}
                      className="p-1.5 rounded-lg bg-slate-100 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {assignedRoles.map(rKey => (
                  <span key={rKey} className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${ROLE_COLORS[rKey] || 'bg-slate-100'}`}>
                    {ROLE_LABELS[rKey] || rKey}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#F8FAFD] dark:bg-[#131d38] rounded-[28px] max-w-[540px] w-full p-6 sm:p-7 shadow-[10px_10px_30px_rgba(163,175,205,0.3),-10px_-10px_30px_rgba(255,255,255,0.95)] border border-white/60 dark:border-slate-800 space-y-5 animate-in zoom-in-95 text-left">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[16px] bg-white dark:bg-slate-900 shadow-[3px_3px_8px_rgba(170,185,220,0.22),-3px_-3px_8px_rgba(255,255,255,0.95)] flex items-center justify-center text-[#6366F1] dark:text-indigo-400 shrink-0">
                  <Plus className="h-6 w-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Create New User Account
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Add a new user and assign roles to provide system access.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 shadow-[2px_2px_6px_rgba(170,185,220,0.2),-2px_-2px_6px_rgba(255,255,255,0.9)] flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="h-4.5 w-4.5 stroke-[2.2]" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-[14px] border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-[18px] bg-white dark:bg-slate-900 p-3 shadow-[3px_3px_10px_rgba(170,185,220,0.18),-3px_-3px_10px_rgba(255,255,255,0.9)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[12px] bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#6366F1] dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <UserIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">
                      Full Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.displayName}
                      onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 bg-transparent border-none focus:outline-none p-0 mt-0.5"
                    />
                  </div>
                </div>

                <div className="rounded-[18px] bg-white dark:bg-slate-900 p-3 shadow-[3px_3px_10px_rgba(170,185,220,0.18),-3px_-3px_10px_rgba(255,255,255,0.9)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[12px] bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#6366F1] dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    <AtSign className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">
                      Username (Login ID)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g. ramesh_k"
                      className="w-full text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 bg-transparent border-none focus:outline-none p-0 mt-0.5 font-mono"
                    />
                  </div>
                </div>

                <div className="rounded-[18px] bg-white dark:bg-slate-900 p-3 shadow-[3px_3px_10px_rgba(170,185,220,0.18),-3px_-3px_10px_rgba(255,255,255,0.9)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[12px] bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#6366F1] dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">
                      Mobile Number (10 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="e.g. 9876543210"
                      className="w-full text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 bg-transparent border-none focus:outline-none p-0 mt-0.5 font-mono"
                    />
                  </div>
                </div>

                <div className="rounded-[18px] bg-white dark:bg-slate-900 p-3 shadow-[3px_3px_10px_rgba(170,185,220,0.18),-3px_-3px_10px_rgba(255,255,255,0.9)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[12px] bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#6366F1] dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">
                      4-Digit Security PIN
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={formData.pin}
                      onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      placeholder="e.g. 1234"
                      className="w-full text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 bg-transparent border-none focus:outline-none p-0 mt-0.5 font-mono tracking-wider"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">Assign Roles</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Select one or multiple roles</span>
                  </div>
                  <span className="text-xs font-bold text-[#6366F1] dark:text-indigo-400">
                    {MASTER_ROLES.length} Roles Available
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {MASTER_ROLES.map(r => {
                    const isSelected = formData.roles.includes(r.key);
                    const RoleIcon = r.icon;

                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => toggleFormRole(r.key)}
                        className={`p-3 rounded-[16px] text-left cursor-pointer transition-all flex items-center justify-between gap-2 select-none active:scale-95 ${
                          isSelected
                            ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#6366F1]/50 shadow-[2px_2px_8px_rgba(99,102,241,0.2),-2px_-2px_8px_rgba(255,255,255,0.9)] dark:bg-indigo-950/60 dark:text-indigo-300 font-bold'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-[2px_2px_6px_rgba(170,185,220,0.15),-2px_-2px_6px_rgba(255,255,255,0.9)] hover:bg-[#F4F7FC] font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <RoleIcon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#6366F1] dark:text-indigo-400' : 'text-slate-400'}`} />
                          <span className="text-xs truncate">{r.label}</span>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#6366F1] text-white flex items-center justify-center shrink-0">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[16px] bg-[#EEF2FF] dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-300 p-3 flex items-center gap-2.5 text-xs font-medium border border-[#E0E7FF] dark:border-indigo-900/60">
                <Info className="h-4 w-4 shrink-0 stroke-[2.2]" />
                <span>
                  You can edit roles and permissions anytime from the <strong className="font-bold">User Accounts</strong> section.
                </span>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-[16px] text-xs font-bold shadow-[0_4px_14px_rgba(99,102,241,0.35)] cursor-pointer transition flex items-center justify-center gap-2 active:scale-98"
                >
                  <UserPlus className="h-4 w-4 stroke-[2.2]" />
                  <span>Create User Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full py-3.5 px-4 bg-white dark:bg-slate-900 text-red-500 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-[16px] text-xs font-bold shadow-[2px_2px_8px_rgba(170,185,220,0.18),-2px_-2px_8px_rgba(255,255,255,0.95)] cursor-pointer transition flex items-center justify-center gap-2 active:scale-98"
                >
                  <LogOut className="h-4 w-4 stroke-[2.2]" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#F8FAFD] dark:bg-[#131d38] rounded-[28px] max-w-[540px] w-full p-6 sm:p-7 shadow-[10px_10px_30px_rgba(163,175,205,0.3),-10px_-10px_30px_rgba(255,255,255,0.95)] border border-white/60 dark:border-slate-800 space-y-5 animate-in zoom-in-95 text-left">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[16px] bg-white dark:bg-slate-900 shadow-[3px_3px_8px_rgba(170,185,220,0.22),-3px_-3px_8px_rgba(255,255,255,0.95)] flex items-center justify-center text-[#6366F1] dark:text-indigo-400 shrink-0">
                  <Pencil className="h-5 w-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Edit Account Details
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">User: @{editingUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 shadow-[2px_2px_6px_rgba(170,185,220,0.2),-2px_-2px_6px_rgba(255,255,255,0.9)] flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 text-xs font-bold rounded-[14px] border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-[18px] bg-white dark:bg-slate-900 p-3 shadow-[3px_3px_10px_rgba(170,185,220,0.18),-3px_-3px_10px_rgba(255,255,255,0.9)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[12px] bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center shrink-0">
                    <UserIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-bold text-slate-500 block leading-tight">Full Display Name</label>
                    <input
                      type="text"
                      required
                      value={formData.displayName}
                      onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full text-xs font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none p-0 mt-0.5"
                    />
                  </div>
                </div>

                <div className="rounded-[18px] bg-white dark:bg-slate-900 p-3 shadow-[3px_3px_10px_rgba(170,185,220,0.18),-3px_-3px_10px_rgba(255,255,255,0.9)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[12px] bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center shrink-0">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-bold text-slate-500 block leading-tight">Mobile Number (10 Digits)</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="w-full text-xs font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none p-0 mt-0.5 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[18px] bg-white dark:bg-slate-900 p-3 shadow-[3px_3px_10px_rgba(170,185,220,0.18),-3px_-3px_10px_rgba(255,255,255,0.9)] flex items-center gap-3">
                <div className="w-9 h-9 rounded-[12px] bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center shrink-0">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] font-bold text-slate-500 block leading-tight">4-Digit Security PIN <span className="text-[9px] text-slate-400 font-normal">(Leave blank to keep current)</span></label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formData.pin}
                    placeholder="•••• (Unchanged)"
                    onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    className="w-full text-xs font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none p-0 mt-0.5 font-mono tracking-wider"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">Assigned Roles</span>
                {editingUser.username === 'admin' ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-[16px] text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Crown className="h-4 w-4 inline-block text-amber-600 dark:text-amber-400" /> Fixed System Administrator Account</span>
                    <Shield className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {MASTER_ROLES.map(r => {
                      const isSelected = formData.roles.includes(r.key);
                      const RoleIcon = r.icon;
                      return (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => toggleFormRole(r.key)}
                          className={`p-3 rounded-[16px] text-left cursor-pointer transition-all flex items-center justify-between gap-2 select-none active:scale-95 ${
                            isSelected
                              ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#6366F1]/50 shadow-[2px_2px_8px_rgba(99,102,241,0.2),-2px_-2px_8px_rgba(255,255,255,0.9)] dark:bg-indigo-950/60 dark:text-indigo-300 font-bold'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-[2px_2px_6px_rgba(170,185,220,0.15),-2px_-2px_6px_rgba(255,255,255,0.9)] hover:bg-[#F4F7FC] font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <RoleIcon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#6366F1]' : 'text-slate-400'}`} />
                            <span className="text-xs truncate">{r.label}</span>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-[#6366F1] text-white flex items-center justify-center shrink-0">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-[16px] text-xs font-bold shadow-[0_4px_14px_rgba(99,102,241,0.35)] cursor-pointer transition flex items-center justify-center gap-2 active:scale-98"
                >
                  <Save className="h-4 w-4 stroke-[2.2]" />
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="w-full py-3.5 px-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-[16px] text-xs font-bold shadow-[2px_2px_8px_rgba(170,185,220,0.18),-2px_-2px_8px_rgba(255,255,255,0.95)] cursor-pointer transition flex items-center justify-center gap-2"
                >
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#131d38] rounded-[24px] max-w-sm w-full p-6 shadow-[10px_10px_30px_rgba(163,175,205,0.3)] space-y-4 border border-white/60 text-center">
            <div className="w-12 h-12 rounded-[16px] bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-xs">
              <UserX className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete User Account?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{deletingUser.displayName}</strong> (@{deletingUser.username})? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-[14px] text-xs font-bold shadow-sm cursor-pointer transition active:scale-95"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-3 px-4 bg-[#F4F7FC] hover:bg-[#EDF2F9] rounded-[14px] text-xs font-bold text-slate-600 cursor-pointer transition active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementView;
