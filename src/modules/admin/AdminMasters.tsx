import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth, getFirstAccessibleRoute } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  getProducts,
  saveProduct,
  getRawMaterials,
  saveRawMaterial,
  deleteRawMaterial,
  getParties,
  saveParty,
  getVendors,
  saveVendor,
  getVehicles,
  saveVehicle,
  getLogs,
  exportBackup,
  restoreBackup,
  getUsers,
  saveUser,
  performFactoryReset,
  deleteProduct,
  deleteParty,
  deleteVendor,
  deleteVehicle,
  deleteUser,
} from '../../data/index';
import type {
  ProductItem,
  RawMaterialItem,
  RawMaterialCategory,
  ChemicalModuleLocation,
  PartyItem,
  VendorItem,
  VehicleItem,
  TransactionLog,
  User,
  UserRole,
} from '../../data/types';
import * as XLSX from 'xlsx';
import { exportExcelWorkbook, exportJsonData } from '../../utils/fileDownloader';
import { Settings, Plus, Users, Truck, ShoppingBag, Database, ShieldAlert, FileSpreadsheet, Download, Upload, Search, RotateCw, MoreVertical, Trash2, CheckCircle2, Pencil, Eye, X, ListFilter, Boxes, Building2, Sparkles } from 'lucide-react';
import { RoleManagementView } from '../profile/RoleManagementView';
import { COMPANY_CONFIG } from '../../config/company';
import { APP_VERSION, APP_BUILD_DATE } from '../../config/version';
import { AppUpdateModal } from '../../components/AppUpdateModal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useMobileBackHandler } from '../../hooks/useMobileBackHandler';

export const AdminMasters: React.FC = () => {
  const { t } = useTranslation();
  const { user, isSimulating } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'products' | 'raw_materials' | 'parties' | 'vendors' | 'users' | 'roles' | 'backup' | 'logs'>(() => {
    const params = new URLSearchParams(location.search);
    let queryTab = params.get('tab');
    if (!queryTab && window.location.hash.includes('tab=')) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      queryTab = hashParams.get('tab');
    }
    if (queryTab && ['products', 'raw_materials', 'parties', 'vendors', 'users', 'roles', 'backup', 'logs'].includes(queryTab)) {
      return queryTab as any;
    }
    if (location.state && (location.state as any).tab && (location.state as any).tab !== 'company') {
      return (location.state as any).tab;
    }
    return 'products';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let queryTab = params.get('tab');
    if (!queryTab && window.location.hash.includes('tab=')) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      queryTab = hashParams.get('tab');
    }
    if (queryTab === 'company' || (location.state && (location.state as any).tab === 'company')) {
      navigate('/company-settings', { replace: true });
      return;
    }
    if (queryTab && ['products', 'raw_materials', 'parties', 'vendors', 'users', 'roles', 'backup', 'logs'].includes(queryTab)) {
      setActiveTab(queryTab as any);
      return;
    }
    if (location.state && (location.state as any).tab) {
      setActiveTab((location.state as any).tab);
    }
  }, [location.search, location.state, navigate]);

  // Master Data States
  const [products, setProducts] = useState<ProductItem[]>(() => getProducts());
  const [rawMaterials, setRawMaterials] = useState<RawMaterialItem[]>(() => getRawMaterials());
  const [parties, setParties] = useState<PartyItem[]>(() => getParties());
  const [vendors, setVendors] = useState<VendorItem[]>(() => getVendors());
  const [vehicles, setVehicles] = useState<VehicleItem[]>(() => getVehicles());
  const [logs, setLogs] = useState<TransactionLog[]>(() => getLogs());
  const [usersList, setUsersList] = useState<User[]>(() => getUsers());
  const [mastersSearchQuery, setMastersSearchQuery] = useState('');
  const [isMobileAddModalOpen, setIsMobileAddModalOpen] = useState(false);

  // Factory Reset Modal States
  const [isFactoryResetModalOpen, setIsFactoryResetModalOpen] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const filteredProducts = useMemo(() => {
    let list = products.filter(p => p.active !== false);
    const q = mastersSearchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.grade.toLowerCase().includes(q) ||
      String(p.gsm).includes(q) ||
      String(p.size).includes(q) ||
      String(p.ply).includes(q)
    );
  }, [products, mastersSearchQuery]);

  const [rmCategoryTab, setRmCategoryTab] = useState<'ALL' | RawMaterialCategory>('ALL');

  const filteredRawMaterials = useMemo(() => {
    let list = rawMaterials.filter(rm => rm.active !== false);
    if (rmCategoryTab !== 'ALL') {
      list = list.filter(rm => rm.category === rmCategoryTab);
    }
    const q = mastersSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(rm =>
        rm.name.toLowerCase().includes(q) ||
        rm.category.toLowerCase().includes(q) ||
        String(rm.stock).includes(q) ||
        String(rm.minThreshold).includes(q)
      );
    }
    return list;
  }, [rawMaterials, mastersSearchQuery, rmCategoryTab]);

  const filteredParties = useMemo(() => {
    let list = parties.filter(pt => pt.active !== false);
    const q = mastersSearchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(pt =>
      pt.name.toLowerCase().includes(q) ||
      (pt.contact && pt.contact.toLowerCase().includes(q)) ||
      (pt.address && pt.address.toLowerCase().includes(q))
    );
  }, [parties, mastersSearchQuery]);

  const filteredVendors = useMemo(() => {
    let list = vendors.filter(v => v.active !== false);
    const q = mastersSearchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v.contact && v.contact.toLowerCase().includes(q)) ||
      (v.address && v.address.toLowerCase().includes(q))
    );
  }, [vendors, mastersSearchQuery]);

  const filteredVehicles = useMemo(() => {
    let list = vehicles.filter(vh => vh.active !== false);
    const q = mastersSearchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(vh =>
      vh.vehicleNo.toLowerCase().includes(q) ||
      (vh.driverName && vh.driverName.toLowerCase().includes(q)) ||
      (vh.driverContact && vh.driverContact.toLowerCase().includes(q))
    );
  }, [vehicles, mastersSearchQuery]);

  const filteredUsersList = useMemo(() => {
    const q = mastersSearchQuery.toLowerCase().trim();
    if (!q) return usersList;
    return usersList.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }, [usersList, mastersSearchQuery]);

  const filteredLogs = useMemo(() => {
    const q = mastersSearchQuery.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter(l =>
      l.module.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.user.toLowerCase().includes(q) ||
      new Date(l.timestamp).toLocaleString().toLowerCase().includes(q)
    );
  }, [logs, mastersSearchQuery]);

  // User Form States
  const [usrUsername, setUsrUsername] = useState('');
  const [usrDisplayName, setUsrDisplayName] = useState('');
  const [usrPin, setUsrPin] = useState('');
  const [usrRole, setUsrRole] = useState<UserRole>('PulpOperator');
  const [usrEmail, setUsrEmail] = useState('');
  const [usrPhone, setUsrPhone] = useState('');

  // Row Action Menu, Modals, and Toast States
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: 'product' | 'raw_material' | 'party' | 'vendor' | 'vehicle' | 'user'; data: any } | null>(null);
  const [viewingItem, setViewingItem] = useState<{ type: 'product' | 'raw_material' | 'party' | 'vendor' | 'vehicle' | 'user'; data: any } | null>(null);
  const [toast, setToast] = useState<{ text: string; undoType?: 'product' | 'raw_material' | 'party' | 'vendor' | 'vehicle' | 'user'; undoData?: any } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const handleOpenMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (openMenuFor === id) {
      setOpenMenuFor(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 180;

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

  // Click outside menu listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuFor(null);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Lock body scroll securely when any master modal is open
  useBodyScrollLock(!!editingItem || !!viewingItem || isFactoryResetModalOpen || isMobileAddModalOpen || isUpdateModalOpen);

  // Handle hardware & browser back button to close modals before navigating
  useMobileBackHandler(!!editingItem, () => setEditingItem(null), 'adminMastersEditModal');
  useMobileBackHandler(!!viewingItem, () => setViewingItem(null), 'adminMastersViewModal');
  useMobileBackHandler(isMobileAddModalOpen, () => setIsMobileAddModalOpen(false), 'adminMastersMobileAddModal');
  useMobileBackHandler(isFactoryResetModalOpen, () => setIsFactoryResetModalOpen(false), 'adminMastersResetModal');
  useMobileBackHandler(isUpdateModalOpen, () => setIsUpdateModalOpen(false), 'adminMastersUpdateModal');

  const triggerToast = (text: string, undoType?: 'product' | 'raw_material' | 'party' | 'vendor' | 'vehicle' | 'user', undoData?: any) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ text, undoType, undoData });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleExportMasterItem = (type: string, item: any) => {
    exportJsonData(item, `${type}_${item.id || item.username}.json`);
    triggerToast(`Exported details for "${item.name || item.displayName || item.vehicleNo}"`);
  };

  const handleDeleteMasterItem = (type: 'product' | 'raw_material' | 'party' | 'vendor' | 'vehicle' | 'user', item: any) => {
    if (type === 'user') {
      if (item.username === user?.username) {
        alert("You cannot delete your own account.");
        return;
      }
      deleteUser(item.username);
      setUsersList(getUsers());
      triggerToast(`User "${item.displayName}" removed`, 'user', item);
    } else if (type === 'product') {
      deleteProduct(item.id);
      setProducts(getProducts());
      triggerToast(`Product "${item.name}" deleted`, 'product', item);
    } else if (type === 'raw_material') {
      deleteRawMaterial(item.id);
      setRawMaterials(getRawMaterials());
      triggerToast(`Raw Material "${item.name}" deleted`, 'raw_material', item);
    } else if (type === 'party') {
      deleteParty(item.id);
      setParties(getParties());
      triggerToast(`Party "${item.name}" deleted`, 'party', item);
    } else if (type === 'vendor') {
      deleteVendor(item.id);
      setVendors(getVendors());
      triggerToast(`Vendor "${item.name}" deleted`, 'vendor', item);
    } else if (type === 'vehicle') {
      deleteVehicle(item.id);
      setVehicles(getVehicles());
      triggerToast(`Vehicle "${item.vehicleNo}" deleted`, 'vehicle', item);
    }
  };

  const handleUndoMasterDelete = () => {
    if (!toast || !toast.undoType || !toast.undoData) return;
    const { undoType, undoData } = toast;

    if (undoType === 'user') {
      saveUser(undoData);
      setUsersList(getUsers());
      triggerToast(`Restored user "${undoData.displayName}"`);
    } else if (undoType === 'product') {
      saveProduct(undoData);
      setProducts(getProducts());
      triggerToast(`Restored product "${undoData.name}"`);
    } else if (undoType === 'raw_material') {
      saveRawMaterial(undoData);
      setRawMaterials(getRawMaterials());
      triggerToast(`Restored raw material "${undoData.name}"`);
    } else if (undoType === 'party') {
      saveParty(undoData);
      setParties(getParties());
      triggerToast(`Restored party "${undoData.name}"`);
    } else if (undoType === 'vendor') {
      saveVendor(undoData);
      setVendors(getVendors());
      triggerToast(`Restored vendor "${undoData.name}"`);
    } else if (undoType === 'vehicle') {
      saveVehicle(undoData);
      setVehicles(getVehicles());
      triggerToast(`Restored vehicle "${undoData.vehicleNo}"`);
    }
    setToast(null);
  };

  const handleSaveEditMasterItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const { type, data } = editingItem;

    if (type === 'product') {
      if (!data.name || !data.gsm || !data.size || !data.ply) {
        alert("All fields are required");
        return;
      }
      const prevData = products.find(p => p.id === data.id);
      saveProduct({
        ...data,
        gsm: parseFloat(data.gsm),
        size: parseFloat(data.size),
        ply: parseInt(data.ply)
      });
      setProducts(getProducts());
      triggerToast(`Product "${data.name}" updated`, 'product', prevData);
    } else if (type === 'raw_material') {
      if (!data.name || data.minThreshold === undefined) {
        alert("Material Name and Minimum Stock are required");
        return;
      }
      const prevData = rawMaterials.find(m => m.id === data.id);
      saveRawMaterial({
        ...data,
        stock: parseFloat(data.stock) || 0,
        minThreshold: parseFloat(data.minThreshold) || 0,
        usedInModule: data.usedInModule || 'GENERAL',
      });
      setRawMaterials(getRawMaterials());
      triggerToast(`Raw Material "${data.name}" updated`, 'raw_material', prevData);
    } else if (type === 'party') {
      if (!data.name || !data.contact || !data.address) {
        alert("All fields are required");
        return;
      }
      if (String(data.contact).length !== 10) {
        alert("Contact number must be exactly 10 digits");
        return;
      }
      const prevData = parties.find(p => p.id === data.id);
      saveParty(data);
      setParties(getParties());
      triggerToast(`Party "${data.name}" updated`, 'party', prevData);
    } else if (type === 'vendor') {
      if (!data.name || !data.contact || !data.address) {
        alert("All fields are required");
        return;
      }
      if (String(data.contact).length !== 10) {
        alert("Contact number must be exactly 10 digits");
        return;
      }
      const prevData = vendors.find(v => v.id === data.id);
      saveVendor(data);
      setVendors(getVendors());
      triggerToast(`Vendor "${data.name}" updated`, 'vendor', prevData);
    } else if (type === 'vehicle') {
      if (!data.vehicleNo || !data.driverName || !data.driverContact) {
        alert("All fields are required");
        return;
      }
      if (String(data.driverContact).length !== 10) {
        alert("Driver contact number must be exactly 10 digits");
        return;
      }
      const prevData = vehicles.find(v => v.id === data.id);
      saveVehicle(data);
      setVehicles(getVehicles());
      triggerToast(`Vehicle "${data.vehicleNo}" updated`, 'vehicle', prevData);
    } else if (type === 'user') {
      if (!data.displayName || !data.email || !data.phone) {
        alert("All fields are required");
        return;
      }
      if (String(data.phone).length !== 10) {
        alert("Phone number must be exactly 10 digits");
        return;
      }
      const prevData = usersList.find(u => u.username === data.username);
      saveUser(data);
      setUsersList(getUsers());
      triggerToast(`User "${data.displayName}" updated`, 'user', prevData);
    }

    setEditingItem(null);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!usrUsername || !usrDisplayName || !usrPin || !usrEmail || !usrPhone) {
      setErrorMsg('All user fields are required');
      return;
    }

    if (usrPhone.trim().length !== 10) {
      setErrorMsg('Mobile number must be exactly 10 digits');
      return;
    }

    if (!/^\d{4}$/.test(usrPin)) {
      setErrorMsg('PIN must be exactly 4 numeric digits');
      return;
    }

    const users = getUsers();
    if (users.some(u => u.username.toLowerCase() === usrUsername.toLowerCase())) {
      setErrorMsg(`Username "${usrUsername}" is already taken.`);
      return;
    }

    const newUser: User = {
      username: usrUsername.trim(),
      displayName: usrDisplayName.trim(),
      pin: usrPin.trim(),
      role: usrRole,
      email: usrEmail.trim(),
      phone: usrPhone.trim(),
      active: true,
      isNewUser: true,
    };

    saveUser(newUser);
    setUsersList(getUsers());
    setSuccessMsg(`User "${usrUsername}" created successfully!`);
    setIsMobileAddModalOpen(false);
    setUsrUsername('');
    setUsrDisplayName('');
    setUsrPin('');
    setUsrEmail('');
    setUsrPhone('');
  };

  const handleToggleUserActive = (username: string) => {
    if (!window.confirm(`Are you sure you want to change the active status of user "${username}"?`)) {
      return;
    }
    const users = getUsers();
    const targetUser = users.find(u => u.username === username);
    if (targetUser) {
      targetUser.active = targetUser.active === false ? true : false;
      saveUser(targetUser);
      setUsersList(getUsers());
      setSuccessMsg(`User "${username}" status updated!`);
    }
  };

  const handleResetUserPin = (username: string) => {
    const newPin = prompt(`Enter new 4-digit PIN for ${username}:`);
    if (newPin === null) return;
    if (!/^\d{4}$/.test(newPin)) {
      alert('PIN must be exactly 4 numeric digits');
      return;
    }
    const users = getUsers();
    const targetUser = users.find(u => u.username === username);
    if (targetUser) {
      targetUser.pin = newPin;
      saveUser(targetUser);
      setUsersList(getUsers());
      alert(`PIN for ${username} reset successfully to ${newPin}!`);
    }
  };

  // Form Success / Error States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Backup file state
  const [backupFileText, setBackupFileText] = useState('');
  const [backupFileName, setBackupFileName] = useState('');
  const [backupFileSize, setBackupFileSize] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Product Form States
  const [pName, setPName] = useState('');
  const [pGrade, setPGrade] = useState<'A' | 'B'>('A');
  const [pGsm, setPGsm] = useState('');
  const [pSize, setPSize] = useState('');
  const [pPly, setPPly] = useState('');

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!pName || !pGsm || !pSize || !pPly) {
      setErrorMsg('All product fields are required');
      return;
    }

    const newProd: ProductItem = {
      id: `p-${Date.now()}`,
      name: pName,
      grade: pGrade,
      gsm: parseFloat(pGsm),
      size: parseFloat(pSize),
      ply: parseInt(pPly),
    };

    saveProduct(newProd);
    setProducts(getProducts());
    setSuccessMsg('Product added successfully!');
    setIsMobileAddModalOpen(false);
    setPName('');
    setPGsm('');
    setPSize('');
    setPPly('');
  };

  // 1.5 Raw Material Form States
  const [rmName, setRmName] = useState('');
  const [rmCategory, setRmCategory] = useState<RawMaterialCategory>('WASTE_PAPER');
  const [rmReorderLevel, setRmReorderLevel] = useState('');
  const [rmInitialStock, setRmInitialStock] = useState('0');

  const handleRawMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!rmName.trim() || !rmReorderLevel) {
      setErrorMsg('Material Name and Minimum Stock are required');
      return;
    }

    const newMat: RawMaterialItem = {
      id: `rm-${Date.now()}`,
      name: rmName.trim(),
      category: rmCategory,
      stock: parseFloat(rmInitialStock || '0') || 0,
      minThreshold: parseFloat(rmReorderLevel) || 0,
      active: true,
    };

    saveRawMaterial(newMat);
    setRawMaterials(getRawMaterials());
    setSuccessMsg(`Raw Material "${rmName}" added successfully!`);
    setIsMobileAddModalOpen(false);
    setRmName('');
    setRmReorderLevel('');
    setRmInitialStock('0');
  };

  // 2. Party Form States
  const [ptName, setPtName] = useState('');
  const [ptContact, setPtContact] = useState('');
  const [ptAddress, setPtAddress] = useState('');

  const handlePartySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!ptName || !ptContact || !ptAddress) {
      setErrorMsg('All party fields are required');
      return;
    }

    if (ptContact.trim().length !== 10) {
      setErrorMsg('Contact number must be exactly 10 digits');
      return;
    }

    const newParty: PartyItem = {
      id: `pt-${Date.now()}`,
      name: ptName,
      contact: ptContact,
      address: ptAddress,
    };

    saveParty(newParty);
    setParties(getParties());
    setSuccessMsg('Party customer registered successfully!');
    setIsMobileAddModalOpen(false);
    setPtName('');
    setPtContact('');
    setPtAddress('');
  };

  // 3. Vendor Form States
  const [vdName, setVdName] = useState('');
  const [vdContact, setVdContact] = useState('');
  const [vdAddress, setVdAddress] = useState('');

  const handleVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!vdName || !vdContact || !vdAddress) {
      setErrorMsg('All vendor fields are required');
      return;
    }

    if (vdContact.trim().length !== 10) {
      setErrorMsg('Contact number must be exactly 10 digits');
      return;
    }

    const newVendor: VendorItem = {
      id: `vd-${Date.now()}`,
      name: vdName,
      contact: vdContact,
      address: vdAddress,
    };

    saveVendor(newVendor);
    setVendors(getVendors());
    setSuccessMsg('Vendor supplier registered successfully!');
    setIsMobileAddModalOpen(false);
    setVdName('');
    setVdContact('');
    setVdAddress('');
  };

  // 4. Vehicle Form States
  const [vhNo, setVhNo] = useState('');
  const [vhDriver, setVhDriver] = useState('');
  const [vhContact, setVhContact] = useState('');

  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!vhNo || !vhDriver || !vhContact) {
      setErrorMsg('All vehicle fields are required');
      return;
    }

    if (vhContact.trim().length !== 10) {
      setErrorMsg('Driver contact number must be exactly 10 digits');
      return;
    }

    const newVehicle: VehicleItem = {
      id: `vh-${Date.now()}`,
      vehicleNo: vhNo,
      driverName: vhDriver,
      driverContact: vhContact,
    };

    saveVehicle(newVehicle);
    setVehicles(getVehicles());
    setSuccessMsg('Vehicle dispatch master registered successfully!');
    setVhNo('');
    setVhDriver('');
    setVhContact('');
  };

  // --- BACKUP & RESTORE ACTIONS ---
  const handleExportBackup = () => {
    try {
      const dataStr = exportBackup();
      exportJsonData(dataStr, `saheb_paper_backup_${new Date().toISOString().substring(0, 10)}.json`);
      setSuccessMsg('System database backup file generated and downloaded successfully.');
    } catch (err: any) {
      setErrorMsg('Backup export failed: ' + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setBackupFileText('');
      setBackupFileName('');
      setBackupFileSize('');
      return;
    }

    setBackupFileName(file.name);
    setBackupFileSize((file.size / 1024).toFixed(1) + ' KB');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || text.trim().length === 0) {
          throw new Error('File is empty');
        }
        // Verify JSON parseability
        JSON.parse(text);
        setBackupFileText(text);
        setSuccessMsg(`Backup file "${file.name}" loaded ready to restore.`);
      } catch {
        setBackupFileText('');
        setErrorMsg('Invalid file: Selected file is not a valid JSON database backup.');
      }
    };
    reader.onerror = () => {
      setBackupFileText('');
      setErrorMsg('Failed to read file from storage. Please verify file access permissions.');
    };
    reader.readAsText(file);
  };

  const handleRestoreBackup = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!backupFileText) {
      setErrorMsg('Please select a valid backup JSON file first.');
      return;
    }

    try {
      restoreBackup(backupFileText, user?.displayName || 'Admin');
      setSuccessMsg('Database backup restored successfully! Reloading listings...');

      // Reload states
      setProducts(getProducts());
      setParties(getParties());
      setVendors(getVendors());
      setVehicles(getVehicles());
      setLogs(getLogs());
      setBackupFileText('');
      setBackupFileName('');
      setBackupFileSize('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload page to re-seed and refresh Layout configs
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to restore backup');
    }
  };

  const handleExecuteFactoryReset = () => {
    if (resetConfirmationInput.trim() !== 'RESET') {
      return;
    }
    setIsResetting(true);
    try {
      performFactoryReset();
      setSuccessMsg("Factory Reset executed successfully! All storage wiped clean. Reloading app in 1.5 seconds...");
      setIsFactoryResetModalOpen(false);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err: any) {
      setErrorMsg("Failed to execute Factory Reset: " + err.message);
      setIsResetting(false);
    }
  };

  // --- LOG EXPORT ---
  const handleExportLogsExcel = async () => {
    try {
      const data = logs.map(l => ({
        'Timestamp': new Date(l.timestamp).toLocaleString(),
        'Module': l.module,
        'Action': l.action,
        'Details': l.details,
        'Operator': l.user,
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "System Logs");
      await exportExcelWorkbook(workbook, `Saheb_Paper_System_Logs_${new Date().toISOString().substring(0, 10)}.xlsx`);
      setSuccessMsg('System logs exported to Excel successfully!');
    } catch (err: any) {
      setErrorMsg('Failed to export system logs: ' + err.message);
    }
  };

  // --- EXPORT ALL MASTERS TO COMPREHENSIVE EXCEL WORKBOOK ---
  const handleExportAllMastersExcel = async () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Products Sheet
      const prodData = products.map(p => ({
        'Product ID': p.id,
        'Product Name': p.name,
        'QC Grade': p.grade,
        'GSM': p.gsm,
        'Size (cm)': p.size,
        'Ply': p.ply,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodData), "Products");

      // 2. Raw Materials Sheet
      const rmData = rawMaterials.map(rm => ({
        'Material ID': rm.id,
        'Name': rm.name,
        'Category': rm.category,
        'Current Stock (kg)': rm.stock,
        'Min Threshold (kg)': rm.minThreshold,
        'Status': rm.active !== false ? 'ACTIVE' : 'INACTIVE',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rmData), "Raw Materials");

      // 3. Customer Parties Sheet
      const partyData = parties.map(pt => ({
        'Party ID': pt.id,
        'Customer Name': pt.name,
        'Contact Number': pt.contact,
        'Address': pt.address,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(partyData), "Customers");

      // 4. Supplier Vendors Sheet
      const vendorData = vendors.map(v => ({
        'Vendor ID': v.id,
        'Vendor Name': v.name,
        'Contact Number': v.contact,
        'Address': v.address,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vendorData), "Suppliers");

      // 5. System Users Sheet
      const userData = usersList.map(u => ({
        'Employee ID': u.empId || u.username,
        'Username': u.username,
        'Display Name': u.displayName,
        'System Role': u.role,
        'Email': u.email || '',
        'Phone': u.phone || '',
        'Status': u.active !== false ? 'ACTIVE' : 'INACTIVE',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(userData), "Staff Users");

      await exportExcelWorkbook(wb, `Saheb_Paper_All_Masters_${new Date().toISOString().substring(0, 10)}.xlsx`);
      setSuccessMsg('All 5 Master registries exported successfully into a single Excel workbook!');
    } catch (err: any) {
      setErrorMsg('Failed to export master data: ' + err.message);
    }
  };

  // --- REUSABLE ADD MASTER FORM RENDERER (SHARED BETWEEN DESKTOP RIGHT PANEL & MOBILE MODAL) ---
  const renderAddForm = () => {
    switch (activeTab) {
      case 'users':
        return (
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Create New User
            </h3>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Username (ID)</label>
              <input
                type="text"
                value={usrUsername}
                onChange={e => setUsrUsername(e.target.value)}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                placeholder="e.g. operator_john"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Display Name</label>
              <input
                type="text"
                value={usrDisplayName}
                onChange={e => setUsrDisplayName(e.target.value)}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">4-Digit Security PIN</label>
              <input
                type="text"
                maxLength={4}
                value={usrPin}
                onChange={e => setUsrPin(e.target.value.replace(/\D/g, ''))}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                placeholder="e.g. 1234"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">System Role</label>
              <select
                value={usrRole}
                onChange={e => setUsrRole(e.target.value as UserRole)}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white cursor-pointer"
              >
                <option value="Admin">Admin (Full Control)</option>
                <option value="Management">Management (Reports/Read-Only)</option>
                <option value="PulpOperator">Pulp Operator</option>
                <option value="MachineOperator">Machine Operator</option>
                <option value="RewinderOperator">Rewinder Operator</option>
                <option value="BoilerOperator">Boiler Operator</option>
                <option value="EtpOperator">ETP Operator</option>
                <option value="WarehouseStaff">Warehouse/Dispatch Staff</option>
                <option value="StoreManager">Store Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                value={usrEmail}
                onChange={e => setUsrEmail(e.target.value)}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                placeholder="e.g. user@sahebpaper.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
              <input
                type="text"
                value={usrPhone}
                onChange={e => setUsrPhone(e.target.value)}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                placeholder="e.g. 9876543210"
              />
            </div>

            <button
              type="submit"
              className="btn-primary-gradient w-full py-3 text-xs uppercase tracking-wider cursor-pointer font-bold shadow-md active:scale-95 transition"
            >
              Create User Account
            </button>
          </form>
        );

      case 'products':
        return (
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              {t('masters.add_product')}
            </h3>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Product Name</label>
              <input
                type="text"
                value={pName}
                onChange={e => setPName(e.target.value)}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                placeholder="e.g. Napkin Tissue"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">QC Grade</label>
              <select
                value={pGrade}
                onChange={e => setPGrade(e.target.value as 'A' | 'B')}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white cursor-pointer"
              >
                <option value="A">Grade A (Standard)</option>
                <option value="B">Grade B (B-Grade/Off-spec)</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t('common.gsm')}</label>
                <input
                  type="number"
                  value={pGsm}
                  onChange={e => setPGsm(e.target.value)}
                  className="block w-full py-2.5 px-2 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                  placeholder="18"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t('common.size')}</label>
                <input
                  type="number"
                  value={pSize}
                  onChange={e => setPSize(e.target.value)}
                  className="block w-full py-2.5 px-2 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t('common.ply')}</label>
                <input
                  type="number"
                  value={pPly}
                  onChange={e => setPPly(e.target.value)}
                  className="block w-full py-2.5 px-2 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                  placeholder="2"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary-gradient w-full py-3 text-xs uppercase tracking-wider cursor-pointer font-bold shadow-md active:scale-95 transition"
            >
              Add Master Product
            </button>
          </form>
        );

      case 'raw_materials':
        return (
          <form onSubmit={handleRawMaterialSubmit} className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Add Raw Material Master
            </h3>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Material Name</label>
              <input
                type="text"
                value={rmName}
                onChange={e => setRmName(e.target.value)}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                placeholder="e.g. DSR Chemical, Softwood Pulp"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={rmCategory}
                onChange={e => setRmCategory(e.target.value as RawMaterialCategory)}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white cursor-pointer"
              >
                <option value="WASTE_PAPER">Waste Paper</option>
                <option value="OTHER_RAW_MATERIAL">Other Raw Material</option>
                <option value="CHEMICAL">Chemical</option>
                <option value="FIREWOOD">Firewood</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Minimum Stock (kg)</label>
              <input
                type="number"
                value={rmReorderLevel}
                onChange={e => setRmReorderLevel(e.target.value)}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                placeholder="e.g. 500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Initial Stock (kg)</label>
              <input
                type="number"
                value={rmInitialStock}
                onChange={e => setRmInitialStock(e.target.value)}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                placeholder="0"
              />
            </div>

            <button
              type="submit"
              className="btn-primary-gradient w-full py-3 text-xs uppercase tracking-wider cursor-pointer font-bold shadow-md active:scale-95 transition"
            >
              Add Raw Material Master
            </button>
          </form>
        );

      case 'parties':
        return (
          <form onSubmit={handlePartySubmit} className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              {t('masters.add_party')}
            </h3>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Company Name</label>
              <input
                type="text"
                value={ptName}
                onChange={e => setPtName(e.target.value)}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                placeholder="e.g. Ambika Traders"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Contact Number (10 Digits)</label>
              <input
                type="text"
                maxLength={10}
                value={ptContact}
                onChange={e => setPtContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                placeholder="e.g. 9876543210"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Company Address</label>
              <textarea
                value={ptAddress}
                onChange={e => setPtAddress(e.target.value)}
                rows={3}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                placeholder="e.g. Surat, Gujarat"
              />
            </div>

            <button
              type="submit"
              className="btn-primary-gradient w-full py-3 text-xs uppercase tracking-wider cursor-pointer font-bold shadow-md active:scale-95 transition"
            >
              Add Customer Party
            </button>
          </form>
        );

      case 'vendors':
        return (
          <form onSubmit={handleVendorSubmit} className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              {t('masters.add_vendor')}
            </h3>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Vendor Name</label>
              <input
                type="text"
                value={vdName}
                onChange={e => setVdName(e.target.value)}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                placeholder="e.g. Gujarat Waste"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Contact Number (10 Digits)</label>
              <input
                type="text"
                maxLength={10}
                value={vdContact}
                onChange={e => setVdContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                placeholder="e.g. 9998887770"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Supplier Address</label>
              <textarea
                value={vdAddress}
                onChange={e => setVdAddress(e.target.value)}
                rows={3}
                className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                placeholder="e.g. Baroda, Gujarat"
              />
            </div>

            <button
              type="submit"
              className="btn-primary-gradient w-full py-3 text-xs uppercase tracking-wider cursor-pointer font-bold shadow-md active:scale-95 transition"
            >
              Add Supplier Vendor
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  if (user?.role !== 'Admin' && user?.username.toLowerCase() !== 'admin') {
    if (isSimulating) {
      return <Navigate to={getFirstAccessibleRoute(user)} replace />;
    }
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-800 space-y-3 max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-base font-black text-slate-900 dark:text-white">Access Restricted</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
          Admin Masters is strictly restricted to Super Admin only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-12">

      {/* 1. CLEAN MINIMAL HEADER CARD WITH MASTERS OVERVIEW & EXCEL EXPORT */}
      <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
              <Settings className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                  {t('masters.title')}
                </h1>
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold">
                  System Admin Panel
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Maintain registry listings, system backups, and review audit trails.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportAllMastersExcel}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shrink-0"
            title="Download full master database as multi-sheet Excel file"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export All Masters (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 3. NAVIGATION TABS PILLS */}
      <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-x-auto scrollbar-none gap-1.5 w-full">
        <button
          onClick={() => { setActiveTab('products'); setIsMobileAddModalOpen(false); setSuccessMsg(''); setErrorMsg(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'products' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>{t('masters.products')}</span>
        </button>
        <button
          onClick={() => { setActiveTab('raw_materials'); setIsMobileAddModalOpen(false); setSuccessMsg(''); setErrorMsg(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'raw_materials' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Raw Material</span>
        </button>
        <button
          onClick={() => { setActiveTab('parties'); setIsMobileAddModalOpen(false); setSuccessMsg(''); setErrorMsg(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'parties' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <Users className="h-4 w-4" />
          <span>{t('masters.parties')}</span>
        </button>
        <button
          onClick={() => { setActiveTab('vendors'); setIsMobileAddModalOpen(false); setSuccessMsg(''); setErrorMsg(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'vendors' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <Users className="h-4 w-4" />
          <span>{t('masters.vendors')}</span>
        </button>

        <button
          onClick={() => { setActiveTab('roles'); setIsMobileAddModalOpen(false); setSuccessMsg(''); setErrorMsg(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'roles' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Roles & Permissions</span>
        </button>
        <button
          onClick={() => { setActiveTab('backup'); setIsMobileAddModalOpen(false); setSuccessMsg(''); setErrorMsg(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'backup' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <Database className="h-4 w-4" />
          <span>Backup / Restore</span>
        </button>
        <button
          onClick={() => { setActiveTab('logs'); setIsMobileAddModalOpen(false); setSuccessMsg(''); setErrorMsg(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'logs' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Audit Log History</span>
        </button>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* List Pane (2/3 width for master forms, 3/3 full width for roles/backup/logs) */}
        <div className={activeTab === 'backup' || activeTab === 'logs' || activeTab === 'roles' ? 'lg:col-span-3 space-y-4' : 'lg:col-span-2 space-y-4'}>

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

          <div className="neumorphic-card p-6">

            {/* Mobile-Only Primary Add Action Button */}
            {activeTab !== 'backup' && activeTab !== 'logs' && activeTab !== 'roles' && (
              <div className="block lg:hidden mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessMsg('');
                    setErrorMsg('');
                    setIsMobileAddModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-primary hover:bg-primary-dark text-white text-xs font-black uppercase tracking-wider shadow-md shadow-primary/25 active:scale-[0.98] transition cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  <span>
                    {activeTab === 'products' && 'Add New Product'}
                    {activeTab === 'raw_materials' && 'Add Raw Material'}
                    {activeTab === 'parties' && 'Add Customer Party'}
                    {activeTab === 'vendors' && 'Add Supplier Vendor'}
                    {activeTab === 'users' && 'Create User Account'}
                  </span>
                </button>
              </div>
            )}

            {/* Live Search Box */}
            {activeTab !== 'backup' && activeTab !== 'roles' && (
              <div className="mb-5 bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 flex items-center gap-3 border border-slate-200/70 dark:border-slate-800 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={mastersSearchQuery}
                  onChange={e => setMastersSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab === 'products' ? 'products' : activeTab === 'raw_materials' ? 'raw materials' : activeTab === 'parties' ? 'parties' : activeTab === 'vendors' ? 'vendors' : activeTab === 'users' ? 'users' : activeTab === 'logs' ? 'audit logs' : 'master records'}...`}
                  className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
                />
                <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                  <ListFilter className="h-4 w-4" />
                </div>
              </div>
            )}

            {/* Products Listing */}
            {activeTab === 'products' && (
              <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto min-h-[280px] pb-16">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                        <th className="py-3 px-3">Product Name</th>
                        <th className="py-3 px-3">Grade</th>
                        <th className="py-3 px-3">GSM</th>
                        <th className="py-3 px-3">Size (cm)</th>
                        <th className="py-3 px-3">Ply</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap ${p.grade === 'A' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                              }`}>
                              Grade {p.grade}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-200">{p.gsm}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-200">{p.size}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-200">{p.ply}</td>
                          <td className="py-3 px-3 text-right">
                            <div className={`inline-block text-left ${openMenuFor === p.id ? 'relative z-50' : 'relative'}`}>
                              <button
                                onClick={(e) => handleOpenMenu(e, p.id)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg p-1.5 cursor-pointer relative"
                              >
                                <MoreVertical size={15} />
                              </button>
                              {openMenuFor === p.id && (
                                <>
                                  <div
                                    className="fixed inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-[0.5px] z-40"
                                    onClick={(e) => {
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
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 w-44 z-[9999] text-left font-sans animate-in fade-in zoom-in-95 duration-150"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'product', data: p }); setOpenMenuFor(null); }}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'product', data: p }); setOpenMenuFor(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                    >
                                      <Eye size={13} className="text-slate-500" />
                                      View Details
                                    </button>
                                    <button
                                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'product', data: { ...p } }); setOpenMenuFor(null); }}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'product', data: { ...p } }); setOpenMenuFor(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                    >
                                      <Pencil size={13} className="text-slate-500" />
                                      Edit Details
                                    </button>
                                    <button
                                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('product', p); setOpenMenuFor(null); }}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('product', p); setOpenMenuFor(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                    >
                                      <Download size={13} className="text-slate-500" />
                                      Export Details
                                    </button>
                                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                    <button
                                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('product', p); setOpenMenuFor(null); }}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('product', p); setOpenMenuFor(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition cursor-pointer"
                                    >
                                      <Trash2 size={13} className="text-red-500" />
                                      Delete Product
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="block md:hidden space-y-2.5 pb-16">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-white text-xs">{p.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap shrink-0 ${p.grade === 'A' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'}`}>
                            Grade {p.grade}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>GSM: <strong className="text-slate-800 dark:text-slate-200">{p.gsm}</strong></span>
                          <span>Size: <strong className="text-slate-800 dark:text-slate-200">{p.size} cm</strong></span>
                          <span>Ply: <strong className="text-slate-800 dark:text-slate-200">{p.ply}</strong></span>
                        </div>
                      </div>
                      <div className={`inline-block text-left ${openMenuFor === p.id ? 'relative z-50' : 'relative'}`}>
                        <button
                          onClick={(e) => handleOpenMenu(e, p.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg p-1.5 cursor-pointer relative"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuFor === p.id && (
                          <>
                            <div
                              className="fixed inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-[0.5px] z-40"
                              onClick={(e) => {
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
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 w-44 z-[9999] text-left font-sans animate-in fade-in zoom-in-95 duration-150"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'product', data: p }); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'product', data: p }); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                              >
                                <Eye size={13} className="text-slate-500" />
                                View Details
                              </button>
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'product', data: { ...p } }); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'product', data: { ...p } }); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                              >
                                <Pencil size={13} className="text-slate-500" />
                                Edit Details
                              </button>
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('product', p); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('product', p); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                              >
                                <Download size={13} className="text-slate-500" />
                                Export Details
                              </button>
                              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('product', p); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('product', p); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition cursor-pointer"
                              >
                                <Trash2 size={13} className="text-red-500" />
                                Delete Product
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Raw Material Listing */}
            {activeTab === 'raw_materials' && (
              <>
                {/* Category Sub-Tabs Header Bar */}
                <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100 dark:border-slate-800">
                  {[
                    { id: 'ALL', label: 'All Materials', count: rawMaterials.length },
                    { id: 'WASTE_PAPER', label: 'Waste Paper', count: rawMaterials.filter(m => m.category === 'WASTE_PAPER').length },
                    { id: 'OTHER_RAW_MATERIAL', label: 'Other Raw Material', count: rawMaterials.filter(m => m.category === 'OTHER_RAW_MATERIAL').length },
                    { id: 'CHEMICAL', label: 'Chemical', count: rawMaterials.filter(m => m.category === 'CHEMICAL').length },
                    { id: 'FIREWOOD', label: 'Firewood', count: rawMaterials.filter(m => m.category === 'FIREWOOD').length },
                  ].map(tab => {
                    const isActive = rmCategoryTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setRmCategoryTab(tab.id as any)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                          isActive
                            ? 'bg-gradient-to-r from-[#6C4FE0] to-[#7C3AED] text-white border-transparent shadow-md shadow-[#6C4FE0]/25'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                          isActive ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto min-h-[280px] pb-16">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                        <th className="py-3 px-3">Name</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Current Stock (kg)</th>
                        <th className="py-3 px-3">Minimum Stock (kg)</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {filteredRawMaterials.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-medium">
                            No raw materials match your selected category or search.
                          </td>
                        </tr>
                      ) : (
                        filteredRawMaterials.map(rm => {
                          const catConfig =
                            rm.category === 'WASTE_PAPER'
                              ? { label: 'Waste Paper', color: 'bg-blue-100/90 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300/80 dark:border-blue-700/80' }
                              : rm.category === 'OTHER_RAW_MATERIAL'
                              ? { label: 'Other Raw Material', color: 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/80' }
                              : rm.category === 'CHEMICAL'
                              ? { label: 'Chemical', color: 'bg-purple-100/90 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300/80 dark:border-purple-700/80' }
                              : { label: 'Firewood', color: 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/80' };

                          return (
                            <tr key={rm.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition">
                              <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                                {rm.name}
                              </td>
                              <td className="py-3.5 px-3">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap inline-flex items-center tracking-wide border shadow-2xs ${catConfig.color}`}>
                                  {catConfig.label}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                                {rm.stock >= 1000 ? `${(rm.stock / 1000).toFixed(2)} Tons (${rm.stock} kg)` : `${rm.stock} kg`}
                              </td>
                              <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                                {rm.minThreshold} kg
                              </td>
                              <td className="py-3.5 px-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${rm.active !== false ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                                  {rm.active !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <div className={`inline-block text-left ${openMenuFor === rm.id ? 'relative z-50' : 'relative'}`}>
                                  <button
                                    onClick={(e) => handleOpenMenu(e, rm.id)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg p-1 cursor-pointer relative"
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                  {openMenuFor === rm.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-[0.5px] z-40"
                                        onClick={(e) => {
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
                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 w-44 z-[9999] text-left font-sans animate-in fade-in zoom-in-95 duration-150"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'raw_material', data: rm }); setOpenMenuFor(null); }}
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'raw_material', data: rm }); setOpenMenuFor(null); }}
                                          className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                        >
                                          <Eye size={13} className="text-slate-500" />
                                          View Details
                                        </button>
                                        <button
                                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'raw_material', data: { ...rm } }); setOpenMenuFor(null); }}
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'raw_material', data: { ...rm } }); setOpenMenuFor(null); }}
                                          className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                        >
                                          <Pencil size={13} className="text-slate-500" />
                                          Edit Details
                                        </button>
                                        <button
                                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('raw_material', rm); setOpenMenuFor(null); }}
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('raw_material', rm); setOpenMenuFor(null); }}
                                          className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                        >
                                          <Download size={13} className="text-slate-500" />
                                          Export Details
                                        </button>
                                        <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                        <button
                                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('raw_material', rm); setOpenMenuFor(null); }}
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('raw_material', rm); setOpenMenuFor(null); }}
                                          className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition cursor-pointer"
                                        >
                                          <Trash2 size={13} className="text-red-500" />
                                          Delete Material
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="block md:hidden space-y-2.5 pb-16">
                  {filteredRawMaterials.map(rm => {
                    const catLabel =
                      rm.category === 'WASTE_PAPER' ? 'Waste Paper' :
                      rm.category === 'OTHER_RAW_MATERIAL' ? 'Other Raw Material' :
                      rm.category === 'CHEMICAL' ? 'Chemical' : 'Firewood';

                    return (
                      <div key={rm.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-white text-xs">{rm.name}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {catLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            <span>Stock: <strong className="text-slate-800 dark:text-slate-200">{rm.stock} kg</strong></span>
                            <span>Min Stock: <strong className="text-slate-800 dark:text-slate-200">{rm.minThreshold} kg</strong></span>
                          </div>
                        </div>
                      <div className={`inline-block text-left ${openMenuFor === rm.id ? 'relative z-50' : 'relative'}`}>
                        <button
                          onClick={(e) => handleOpenMenu(e, rm.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg p-1.5 cursor-pointer relative"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuFor === rm.id && (
                          <>
                            <div
                              className="fixed inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-[0.5px] z-40"
                              onClick={(e) => {
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
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 w-44 z-[9999] text-left font-sans animate-in fade-in zoom-in-95 duration-150"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'raw_material', data: rm }); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'raw_material', data: rm }); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                              >
                                <Eye size={13} className="text-slate-500" />
                                View Details
                              </button>
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'raw_material', data: { ...rm } }); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'raw_material', data: { ...rm } }); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                              >
                                <Pencil size={13} className="text-slate-500" />
                                Edit Details
                              </button>
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('raw_material', rm); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('raw_material', rm); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                              >
                                <Download size={13} className="text-slate-500" />
                                Export Details
                              </button>
                              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('raw_material', rm); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('raw_material', rm); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition cursor-pointer"
                              >
                                <Trash2 size={13} className="text-red-500" />
                                Delete Material
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
            )}

            {/* Parties Listing */}
            {activeTab === 'parties' && (
              <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto min-h-[280px] pb-16">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                        <th className="py-3 px-3">Party Name</th>
                        <th className="py-3 px-3">Contact</th>
                        <th className="py-3 px-3">Address</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredParties.map(pt => (
                        <tr key={pt.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white capitalize">{pt.name}</td>
                          <td className="py-3 px-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{pt.contact}</td>
                          <td className="py-3 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">{pt.address}</td>
                          <td className="py-3 px-3 text-right">
                            <div className={`inline-block text-left ${openMenuFor === pt.id ? 'relative z-50' : 'relative'}`}>
                              <button
                                onClick={(e) => handleOpenMenu(e, pt.id)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg p-1.5 cursor-pointer relative"
                              >
                                <MoreVertical size={15} />
                              </button>
                              {openMenuFor === pt.id && (
                                <>
                                  <div
                                    className="fixed inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-[0.5px] z-40"
                                    onClick={(e) => {
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
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 w-44 z-[9999] text-left font-sans animate-in fade-in zoom-in-95 duration-150"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'party', data: pt }); setOpenMenuFor(null); }}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'party', data: pt }); setOpenMenuFor(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                    >
                                      <Eye size={13} className="text-slate-500" />
                                      View Details
                                    </button>
                                    <button
                                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'party', data: { ...pt } }); setOpenMenuFor(null); }}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'party', data: { ...pt } }); setOpenMenuFor(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                    >
                                      <Pencil size={13} className="text-slate-500" />
                                      Edit Details
                                    </button>
                                    <button
                                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('party', pt); setOpenMenuFor(null); }}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('party', pt); setOpenMenuFor(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                    >
                                      <Download size={13} className="text-slate-500" />
                                      Export Details
                                    </button>
                                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                    <button
                                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('party', pt); setOpenMenuFor(null); }}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('party', pt); setOpenMenuFor(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition cursor-pointer"
                                    >
                                      <Trash2 size={13} className="text-red-500" />
                                      Delete Party
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="block md:hidden space-y-2.5 pb-16">
                  {filteredParties.map(pt => (
                    <div key={pt.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white truncate capitalize">{pt.name}</div>
                        <div className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{pt.contact || 'No contact'}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate capitalize">{pt.address || 'No address'}</div>
                      </div>
                      <div className={`inline-block text-left ${openMenuFor === pt.id ? 'relative z-50' : 'relative'}`}>
                        <button
                          onClick={(e) => handleOpenMenu(e, pt.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg p-1.5 cursor-pointer relative"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuFor === pt.id && (
                          <>
                            <div
                              className="fixed inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-[0.5px] z-40"
                              onClick={(e) => {
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
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 w-44 z-[9999] text-left font-sans animate-in fade-in zoom-in-95 duration-150"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'party', data: pt }); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'party', data: pt }); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                              >
                                <Eye size={13} className="text-slate-500" />
                                View Details
                              </button>
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'party', data: { ...pt } }); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'party', data: { ...pt } }); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                              >
                                <Pencil size={13} className="text-slate-500" />
                                Edit Details
                              </button>
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('party', pt); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('party', pt); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                              >
                                <Download size={13} className="text-slate-500" />
                                Export Details
                              </button>
                              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('party', pt); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('party', pt); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition cursor-pointer"
                              >
                                <Trash2 size={13} className="text-red-500" />
                                Delete Party
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Vendors Listing */}
            {activeTab === 'vendors' && (
              <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto min-h-[280px] pb-16">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                        <th className="py-3 px-3">Vendor Name</th>
                        <th className="py-3 px-3">Contact</th>
                        <th className="py-3 px-3">Address</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredVendors.map(vd => (
                        <tr key={vd.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white capitalize">{vd.name}</td>
                          <td className="py-3 px-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{vd.contact}</td>
                          <td className="py-3 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">{vd.address}</td>
                          <td className="py-3 px-3 text-right">
                            <div className={`inline-block text-left ${openMenuFor === vd.id ? 'relative z-50' : 'relative'}`}>
                              <button
                                onClick={(e) => handleOpenMenu(e, vd.id)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg p-1.5 cursor-pointer relative"
                              >
                                <MoreVertical size={15} />
                              </button>
                              {openMenuFor === vd.id && (
                                <>
                                  <div
                                    className="fixed inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-[0.5px] z-40"
                                    onClick={(e) => {
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
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 w-44 z-[9999] text-left font-sans animate-in fade-in zoom-in-95 duration-150"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'vendor', data: vd }); setOpenMenuFor(null); }}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'vendor', data: vd }); setOpenMenuFor(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                    >
                                      <Eye size={13} className="text-slate-500" />
                                      View Details
                                    </button>
                                    <button
                                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'vendor', data: { ...vd } }); setOpenMenuFor(null); }}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'vendor', data: { ...vd } }); setOpenMenuFor(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                    >
                                      <Pencil size={13} className="text-slate-500" />
                                      Edit Details
                                    </button>
                                    <button
                                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('vendor', vd); setOpenMenuFor(null); }}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('vendor', vd); setOpenMenuFor(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                    >
                                      <Download size={13} className="text-slate-500" />
                                      Export Details
                                    </button>
                                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                    <button
                                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('vendor', vd); setOpenMenuFor(null); }}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('vendor', vd); setOpenMenuFor(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition cursor-pointer"
                                    >
                                      <Trash2 size={13} className="text-red-500" />
                                      Delete Vendor
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="block md:hidden space-y-2.5 pb-16">
                  {filteredVendors.map(vd => (
                    <div key={vd.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white truncate capitalize">{vd.name}</div>
                        <div className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{vd.contact || 'No contact'}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate capitalize">{vd.address || 'No address'}</div>
                      </div>
                      <div className={`inline-block text-left ${openMenuFor === vd.id ? 'relative z-50' : 'relative'}`}>
                        <button
                          onClick={(e) => handleOpenMenu(e, vd.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg p-1.5 cursor-pointer relative"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuFor === vd.id && (
                          <>
                            <div
                              className="fixed inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-[0.5px] z-40"
                              onClick={(e) => {
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
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 w-44 z-[9999] text-left font-sans animate-in fade-in zoom-in-95 duration-150"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'vendor', data: vd }); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'vendor', data: vd }); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                              >
                                <Eye size={13} className="text-slate-500" />
                                View Details
                              </button>
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'vendor', data: { ...vd } }); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'vendor', data: { ...vd } }); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                              >
                                <Pencil size={13} className="text-slate-500" />
                                Edit Details
                              </button>
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('vendor', vd); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('vendor', vd); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                              >
                                <Download size={13} className="text-slate-500" />
                                Export Details
                              </button>
                              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                              <button
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('vendor', vd); setOpenMenuFor(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('vendor', vd); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition cursor-pointer"
                              >
                                <Trash2 size={13} className="text-red-500" />
                                Delete Vendor
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Users Listing */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto min-h-[280px] pb-16">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                      <th className="py-3 px-3">Display Name</th>
                      <th className="py-3 px-3">Username</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredUsersList.map(u => (
                      <tr key={u.username} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{u.displayName}</td>
                        <td className="py-3 px-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">@{u.username}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.active !== false
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                            }`}>
                            {u.active !== false ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <div className={`inline-block text-left ${openMenuFor === u.username ? 'relative z-50' : 'relative'}`}>
                            <button
                              onClick={(e) => handleOpenMenu(e, u.username)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg p-1.5 cursor-pointer relative"
                            >
                              <MoreVertical size={15} />
                            </button>
                            {openMenuFor === u.username && (
                              <>
                                <div
                                  className="fixed inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-[0.5px] z-40"
                                  onClick={(e) => {
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
                                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 w-44 z-[9999] text-left font-sans animate-in fade-in zoom-in-95 duration-150"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'user', data: u }); setOpenMenuFor(null); }}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewingItem({ type: 'user', data: u }); setOpenMenuFor(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                  >
                                    <Eye size={13} className="text-slate-500" />
                                    View Profile
                                  </button>
                                  <button
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'user', data: { ...u } }); setOpenMenuFor(null); }}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingItem({ type: 'user', data: { ...u } }); setOpenMenuFor(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                  >
                                    <Pencil size={13} className="text-slate-500" />
                                    Edit Details
                                  </button>
                                  <button
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResetUserPin(u.username); setOpenMenuFor(null); }}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleResetUserPin(u.username); setOpenMenuFor(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                  >
                                    <RotateCw size={13} className="text-slate-500" />
                                    Reset PIN
                                  </button>
                                  <button
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleUserActive(u.username); setOpenMenuFor(null); }}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleUserActive(u.username); setOpenMenuFor(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                  >
                                    <ShieldAlert size={13} className="text-slate-500" />
                                    {u.active !== false ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('user', u); setOpenMenuFor(null); }}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExportMasterItem('user', u); setOpenMenuFor(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition cursor-pointer"
                                  >
                                    <Download size={13} className="text-slate-500" />
                                    Export Details
                                  </button>
                                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                  <button
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('user', u); setOpenMenuFor(null); }}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMasterItem('user', u); setOpenMenuFor(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition cursor-pointer"
                                  >
                                    <Trash2 size={13} className="text-red-500" />
                                    Delete User
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Roles & Permissions Listing -> Embeds Interactive Role Management Matrix */}
            {activeTab === 'roles' && (
              <RoleManagementView />
            )}

            {/* Backup / Restore Controls */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                {/* 0. Official Company Identity Card */}
                <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-900/90 dark:via-blue-950/40 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/60 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-blue-800/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-primary text-white shadow-md shadow-blue-500/20">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                          {COMPANY_CONFIG.name}
                        </h4>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {COMPANY_CONFIG.industrySubtitle}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                      Verified Enterprise
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-white/80 dark:bg-slate-800/70 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Phone / WhatsApp</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">{COMPANY_CONFIG.phone}</span>
                    </div>
                    <div className="p-3 bg-white/80 dark:bg-slate-800/70 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Email Address</span>
                      <span className="font-semibold text-slate-800 dark:text-white">{COMPANY_CONFIG.email}</span>
                    </div>
                    <div className="p-3 bg-white/80 dark:bg-slate-800/70 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Official Website</span>
                      <a href={COMPANY_CONFIG.websiteUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">
                        {COMPANY_CONFIG.website}
                      </a>
                    </div>
                    <div className="p-3 bg-white/80 dark:bg-slate-800/70 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 sm:col-span-2 md:col-span-3">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Physical Plant & Registered Office Address</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{COMPANY_CONFIG.address}</span>
                    </div>
                  </div>
                </div>

                {/* 1. Export Card */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-primary dark:text-blue-400">
                      <Download className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Export Data Backup</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Download full state of localStorage (15 mill modules, transaction ledgers, formulas, and masters) as a single JSON file.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="btn-primary-gradient px-5 py-3 text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Database Backup (JSON)</span>
                  </button>
                </div>

                {/* 2. Restore Card */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Restore Data Backup</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Upload a previously exported backup file to restore all databases.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>WARNING: Restoring will overwrite all current system data.</span>
                  </div>

                  <form onSubmit={handleRestoreBackup} className="space-y-3 pt-1">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/json,.json,text/plain,text/json,*/*"
                        onChange={handleFileChange}
                        className="text-xs block w-full text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-2xl file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary dark:file:bg-primary/20 dark:file:text-primary-light hover:file:bg-primary/20 cursor-pointer"
                      />
                      <button
                        type="submit"
                        disabled={!backupFileText}
                        className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer ${backupFileText
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/25 hover:scale-[1.01]'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          }`}
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload & Restore</span>
                      </button>
                    </div>

                    {backupFileName && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{backupFileName}</span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">({backupFileSize})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setBackupFileText('');
                            setBackupFileName('');
                            setBackupFileSize('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-xs font-bold text-slate-400 hover:text-red-500 transition cursor-pointer p-1"
                          title="Clear selected file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </form>
                </div>

                {/* 3. Live System Version & Releases Card */}
                <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-3xl p-6 sm:p-7 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-[#2563EB] dark:text-blue-300 shrink-0">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            System Version &amp; Release History
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-200/80 dark:bg-blue-900/80 text-[#1D4ED8] dark:text-blue-300 text-[10px] font-mono font-black">
                            v{APP_VERSION}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                          Saheb Paper ERP release build <strong className="font-mono">{APP_BUILD_DATE}</strong>. Production security enhancements, camera barcode scanner permissions, RLS cloud policies, and version audit trail.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsUpdateModalOpen(true)}
                      className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Check Updates &amp; Changelogs</span>
                    </button>
                  </div>
                </div>

                {/* 4. Factory Reset Production Danger Card */}
                <div className="bg-rose-50/70 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-900/60 rounded-3xl p-6 sm:p-7 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 shrink-0">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-rose-800 dark:text-rose-200 uppercase tracking-wider">
                          Factory Reset (Production Launch Wipe)
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 text-[10px] font-black uppercase tracking-wider">
                          Irreversible
                        </span>
                      </div>
                      <p className="text-xs text-rose-900/80 dark:text-rose-300/80 font-medium mt-1 leading-relaxed">
                        Permanently wipes ALL transaction history, daily production rolls, reels, customer orders, dispatch challans, formulas, raw materials, store spares, and non-admin users from local storage. Leaves the app in a genuinely clean, zero-state ready for real plant data entry.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-rose-200/60 dark:border-rose-900/40">
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                      Requires typing &quot;RESET&quot; to confirm
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setResetConfirmationInput('');
                        setIsFactoryResetModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Factory Reset</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Audit Logs Register */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-xs text-slate-900 dark:text-white font-black uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    Full System Transaction Trail ({logs.length} entries)
                  </span>
                  <button
                    onClick={handleExportLogsExcel}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Export Logs to Excel</span>
                  </button>
                </div>

                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto max-h-[550px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                        <th className="py-3 px-3">Timestamp</th>
                        <th className="py-3 px-3">Module</th>
                        <th className="py-3 px-3">Action</th>
                        <th className="py-3 px-3">Details</th>
                        <th className="py-3 px-3 text-right">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                              {log.module}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-slate-900 dark:text-white">{log.action}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-md font-medium text-xs leading-relaxed" title={log.details}>
                            {log.details}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-xs font-bold text-primary dark:text-blue-400 whitespace-nowrap">
                            {log.user}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards (Zero Horizontal Overflow / No Slider) */}
                <div className="block md:hidden space-y-3 pb-8">
                  {filteredLogs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 font-semibold">
                      No logs match your search.
                    </div>
                  ) : (
                    filteredLogs.map(log => (
                      <div
                        key={log.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 space-y-2.5 text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary dark:text-primary-light font-black text-[10px] uppercase tracking-wider border border-primary/20">
                            {log.module}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <span className="font-black text-slate-900 dark:text-white text-xs leading-snug">
                            {log.action}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold shrink-0">
                            @{log.user}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium bg-white/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 leading-relaxed break-words">
                          {log.details}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Action Panel (1/3 width) - Desktop only */}
        {activeTab !== 'backup' && activeTab !== 'logs' && activeTab !== 'roles' && (
          <div className="hidden lg:block neumorphic-card p-6">
            {renderAddForm()}
          </div>
        )}

      </div>

      {/* Mobile Add Master Modal / Slide-up Drawer */}
      {isMobileAddModalOpen && activeTab !== 'backup' && activeTab !== 'logs' && activeTab !== 'roles' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsMobileAddModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-[28px] sm:rounded-3xl max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 z-10">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {activeTab === 'products' && 'Add Master Product'}
                    {activeTab === 'raw_materials' && 'Add Raw Material'}
                    {activeTab === 'parties' && 'Add Customer Party'}
                    {activeTab === 'vendors' && 'Add Supplier Vendor'}
                    {activeTab === 'users' && 'Create User Account'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Fill in details to register record</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 overflow-y-auto max-h-[calc(85vh-70px)] sm:max-h-[calc(80vh-70px)] text-left">
              {renderAddForm()}
            </div>
          </div>
        </div>
      )}

      {/* Edit Details Modal overlay */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setEditingItem(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-[28px] sm:rounded-3xl max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 z-10">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Pencil className="h-4 w-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {editingItem.type === 'product' && 'Edit Master Product'}
                    {editingItem.type === 'raw_material' && 'Edit Raw Material'}
                    {editingItem.type === 'party' && 'Edit Customer Party'}
                    {editingItem.type === 'vendor' && 'Edit Supplier Vendor'}
                    {editingItem.type === 'vehicle' && 'Edit Vehicle Record'}
                    {editingItem.type === 'user' && 'Edit User Account'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Update master item specifications</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 overflow-y-auto max-h-[calc(85vh-70px)] sm:max-h-[calc(80vh-70px)] text-left">
              <form
                id="edit-master-form"
                onSubmit={handleSaveEditMasterItem}
                data-modal-scroll="true"
                className="space-y-4"
              >
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-primary" />
                  {editingItem.type === 'product' && 'Edit Product'}
                  {editingItem.type === 'raw_material' && 'Edit Raw Material Master'}
                  {editingItem.type === 'party' && 'Edit Customer Party'}
                  {editingItem.type === 'vendor' && 'Edit Supplier Vendor'}
                  {editingItem.type === 'vehicle' && 'Edit Vehicle Details'}
                  {editingItem.type === 'user' && 'Edit User Details'}
                </h3>

                {editingItem.type === 'product' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Product Name</label>
                      <input
                        type="text"
                        required
                        value={editingItem.data.name}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                        placeholder="e.g. Napkin Tissue"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">QC Grade</label>
                      <select
                        value={editingItem.data.grade}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, grade: e.target.value as 'A' | 'B' } })}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white cursor-pointer"
                      >
                        <option value="A">Grade A (Standard)</option>
                        <option value="B">Grade B (B-Grade/Off-spec)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t('common.gsm')}</label>
                        <input
                          type="number"
                          required
                          value={editingItem.data.gsm}
                          onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, gsm: e.target.value } })}
                          className="block w-full py-2.5 px-2 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                          placeholder="18"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t('common.size')}</label>
                        <input
                          type="number"
                          required
                          value={editingItem.data.size}
                          onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, size: e.target.value } })}
                          className="block w-full py-2.5 px-2 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                          placeholder="30"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t('common.ply')}</label>
                        <input
                          type="number"
                          required
                          value={editingItem.data.ply}
                          onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, ply: e.target.value } })}
                          className="block w-full py-2.5 px-2 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                          placeholder="2"
                        />
                      </div>
                    </div>
                  </>
                )}

                {editingItem.type === 'raw_material' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Material Name</label>
                      <input
                        type="text"
                        required
                        value={editingItem.data.name}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                        placeholder="e.g. DSR Chemical, Softwood Pulp"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                      <select
                        value={editingItem.data.category}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, category: e.target.value as RawMaterialCategory } })}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white cursor-pointer"
                      >
                        <option value="WASTE_PAPER">Waste Paper</option>
                        <option value="OTHER_RAW_MATERIAL">Other Raw Material</option>
                        <option value="CHEMICAL">Chemical</option>
                        <option value="FIREWOOD">Firewood</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Current Stock (kg)</label>
                        <input
                          type="number"
                          required
                          value={editingItem.data.stock}
                          onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, stock: e.target.value } })}
                          className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Minimum Stock (kg)</label>
                        <input
                          type="number"
                          required
                          value={editingItem.data.minThreshold}
                          onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, minThreshold: e.target.value } })}
                          className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="edit-rm-active"
                        checked={editingItem.data.active !== false}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, active: e.target.checked } })}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <label htmlFor="edit-rm-active" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Active Material
                      </label>
                    </div>
                  </>
                )}

                {(editingItem.type === 'party' || editingItem.type === 'vendor') && (
                  <>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        {editingItem.type === 'party' ? 'Company Name' : 'Vendor Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={editingItem.data.name}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Contact Number (10 Digits)</label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={editingItem.data.contact}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, contact: e.target.value.replace(/\D/g, '').slice(0, 10) } })}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        {editingItem.type === 'party' ? 'Company Address' : 'Supplier Address'}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={editingItem.data.address}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, address: e.target.value } })}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      />
                    </div>
                  </>
                )}

                {editingItem.type === 'vehicle' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Vehicle Number</label>
                      <input
                        type="text"
                        required
                        value={editingItem.data.vehicleNo}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, vehicleNo: e.target.value } })}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Driver Name</label>
                      <input
                        type="text"
                        required
                        value={editingItem.data.driverName}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, driverName: e.target.value } })}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Driver Contact (10 Digits)</label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={editingItem.data.driverContact}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, driverContact: e.target.value.replace(/\D/g, '').slice(0, 10) } })}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                      />
                    </div>
                  </>
                )}

                {editingItem.type === 'user' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Display Name</label>
                      <input
                        type="text"
                        required
                        value={editingItem.data.displayName}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, displayName: e.target.value } })}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                      <input
                        type="email"
                        required
                        value={editingItem.data.email}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, email: e.target.value } })}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number (10 Digits)</label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={editingItem.data.phone}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, phone: e.target.value.replace(/\D/g, '').slice(0, 10) } })}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="btn-primary-gradient w-full py-3 text-xs uppercase tracking-wider cursor-pointer font-bold shadow-md active:scale-95 transition mt-2"
                >
                  {editingItem.type === 'product' && 'Update Master Product'}
                  {editingItem.type === 'raw_material' && 'Update Raw Material'}
                  {editingItem.type === 'party' && 'Update Customer Party'}
                  {editingItem.type === 'vendor' && 'Update Supplier Vendor'}
                  {editingItem.type === 'vehicle' && 'Update Vehicle Record'}
                  {editingItem.type === 'user' && 'Update User Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal overlay */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setViewingItem(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-[28px] sm:rounded-3xl max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 z-10">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Eye className="h-4 w-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {viewingItem.type === 'product' && 'Product Details'}
                    {viewingItem.type === 'raw_material' && 'Raw Material Details'}
                    {viewingItem.type === 'party' && 'Customer Party Details'}
                    {viewingItem.type === 'vendor' && 'Supplier Vendor Details'}
                    {viewingItem.type === 'vehicle' && 'Vehicle Details'}
                    {viewingItem.type === 'user' && 'User Account Details'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">View master item specifications</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable View Body */}
            <div
              data-modal-scroll="true"
              className="p-5 space-y-4 text-left text-xs flex-1 overflow-y-auto max-h-[calc(85vh-70px)] sm:max-h-[calc(80vh-70px)]"
            >
              {viewingItem.type === 'product' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">Product Name</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{viewingItem.data.name}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">QC Grade</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">Grade {viewingItem.data.grade}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center sm:text-left">
                      <span className="block text-[10px] uppercase font-black text-slate-400 mb-0.5">GSM</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{viewingItem.data.gsm}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center sm:text-left">
                      <span className="block text-[10px] uppercase font-black text-slate-400 mb-0.5">Size (cm)</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{viewingItem.data.size}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center sm:text-left">
                      <span className="block text-[10px] uppercase font-black text-slate-400 mb-0.5">Ply</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{viewingItem.data.ply}</span>
                    </div>
                  </div>
                </div>
              )}

              {viewingItem.type === 'raw_material' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">Material Name</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{viewingItem.data.name}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">Category</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{viewingItem.data.category.replace('_', ' ')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                      <span className="block text-[10px] uppercase font-black text-slate-400 mb-0.5">Current Stock</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{viewingItem.data.stock} kg</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                      <span className="block text-[10px] uppercase font-black text-slate-400 mb-0.5">Minimum Stock</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{viewingItem.data.minThreshold} kg</span>
                    </div>
                  </div>
                </div>
              )}

              {(viewingItem.type === 'party' || viewingItem.type === 'vendor') && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">Company Name</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{viewingItem.data.name}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">Contact Number</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{viewingItem.data.contact}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">Address</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 whitespace-pre-line">{viewingItem.data.address}</span>
                  </div>
                </div>
              )}

              {viewingItem.type === 'vehicle' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">Vehicle Number</span>
                    <span className="font-bold text-primary font-mono text-sm">{viewingItem.data.vehicleNo}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">Driver Name</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{viewingItem.data.driverName}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">Driver Contact</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{viewingItem.data.driverContact}</span>
                  </div>
                </div>
              )}

              {viewingItem.type === 'user' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                      {viewingItem.data.displayName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{viewingItem.data.displayName}</h4>
                      <p className="text-xs text-slate-400 font-mono">@{viewingItem.data.username}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                      <span className="block text-[10px] uppercase font-black text-slate-400 mb-0.5">System Role</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{viewingItem.data.role}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                      <span className="block text-[10px] uppercase font-black text-slate-400 mb-0.5">Status</span>
                      <span className={`font-bold ${viewingItem.data.active !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                        {viewingItem.data.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="col-span-2 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                      <span className="block text-[10px] uppercase font-black text-slate-400 mb-0.5">Email Address</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{viewingItem.data.email || 'N/A'}</span>
                    </div>
                    <div className="col-span-2 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                      <span className="block text-[10px] uppercase font-black text-slate-400 mb-0.5">Mobile Number</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{viewingItem.data.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="btn-primary-gradient w-full py-3 text-xs uppercase tracking-wider cursor-pointer font-bold shadow-md active:scale-95 transition mt-2"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Factory Reset Confirmation Modal */}
      {isFactoryResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-rose-200 dark:border-rose-900 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Confirm Factory Reset
                  </h3>
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                    Destructive Action — Zero Data State
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFactoryResetModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              data-modal-scroll="true"
              className="space-y-4 flex-1 overflow-y-auto overscroll-contain"
            >
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                <p className="font-bold text-rose-900 dark:text-rose-200">
                  Are you absolutely sure you want to perform a Factory Reset?
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>All production rolls, reels, and QC test logs will be permanently deleted.</li>
                  <li>All raw material stock, lots, and formulas will be reset to empty.</li>
                  <li>All dispatch challans and customer orders will be cleared.</li>
                  <li>All audit transaction logs will be cleared.</li>
                  <li>All user accounts except the primary Super Admin (<strong className="font-bold">admin</strong>) will be removed.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  To confirm, type <span className="font-mono text-rose-600 font-black">RESET</span> below:
                </label>
                <input
                  type="text"
                  value={resetConfirmationInput}
                  onChange={e => setResetConfirmationInput(e.target.value)}
                  placeholder="Type RESET to confirm"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsFactoryResetModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetConfirmationInput.trim() !== 'RESET' || isResetting}
                onClick={handleExecuteFactoryReset}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
                  resetConfirmationInput.trim() === 'RESET' && !isResetting
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 active:scale-98'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <Trash2 className="h-4 w-4" />
                <span>{isResetting ? 'Wiping System...' : 'Wipe & Reset Everything'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification element */}
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-auto z-50 animate-[slideUp_0.2s_ease-out]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl shadow-slate-900/10 dark:shadow-black/50 md:min-w-[340px]">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold flex-1 text-slate-800 dark:text-slate-100">{toast.text}</span>
            {toast.undoType && toast.undoData && (
              <button
                onClick={handleUndoMasterDelete}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer ml-2 hover:underline shrink-0"
              >
                Undo
              </button>
            )}
            <button 
              onClick={() => setToast(null)} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ml-1 shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* App Update Modal */}
      <AppUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />

    </div>
  );
};
export default AdminMasters;
