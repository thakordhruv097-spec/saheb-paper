import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  getPackingSlips,
  savePackingSlip,
  confirmDispatch,
  deletePackingSlip,
  getReels,
  getParties,
  getVehicles,
  getPendingOrders,
  savePendingOrder,
  getProducts,
} from '../../data/index';
import type { PackingSlip, Reel, PendingOrder } from '../../data/types';
import * as XLSX from 'xlsx';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { COMPANY_CONFIG } from '../../config/company';
import { DataFilterBar } from '../../components/DataFilterBar';
import { CustomSearchableSelect } from '../../components/CustomSearchableSelect';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Truck,
  Plus,
  FileText,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  Printer,
  Trash2,
  Search,
  ListFilter,
  PackageCheck,
  Package,
  Calendar,
  ChevronDown,
  ChevronUp,
  Zap,
  SlidersHorizontal,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  X,
  RotateCcw,
  ScanBarcode,
  Eye,
  Building2,
  Check,
  Pencil,
  MoreVertical,
  Lock,
  QrCode,
  Tag,
  Hash,
} from 'lucide-react';

import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';
import { DispatchedReelsVault } from './DispatchedReelsVault';
import { QRScannerView } from '../rewinder/QRScannerView';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';

interface DispatchViewProps {
  initialTab?: 'orders' | 'create_slip' | 'slips_list' | 'dispatched_vault' | 'qr_scanner';
  hideTabs?: boolean;
  hideHeader?: boolean;
  onOpenScanner?: () => void;
}

export const DispatchView: React.FC<DispatchViewProps> = ({ initialTab = 'orders', hideTabs = false, hideHeader = false, onOpenScanner }) => {
  const { t } = useTranslation();
  const { user, isViewer } = useAuth();
  const { timeframe, selectedDate } = useDateFilter();
  const navigate = useNavigate();
  const location = useLocation();

  const [slips, setSlips] = useState<PackingSlip[]>(() => getPackingSlips());
  const [reels, setReels] = useState<Reel[]>(() => getReels());
  const [orders, setOrders] = useState<PendingOrder[]>(() => getPendingOrders());
  const parties = getParties();
  const vehicles = getVehicles();
  const products = getProducts();

  // Tab View Toggle - Determine from URL pathname or initialTab prop
  const [activeTab, setActiveTab] = useState<'orders' | 'create_slip' | 'slips_list' | 'dispatched_vault' | 'qr_scanner'>(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    if (location.pathname.includes('qr-scanner')) {
      return isDesktop ? 'create_slip' : 'qr_scanner';
    }
    if (location.pathname.includes('dispatched-reels') || location.pathname.includes('dispatched-vault')) return 'dispatched_vault';
    if (location.pathname.includes('packing-slips')) return 'slips_list';
    if (location.pathname.includes('draft-packing-slip')) return 'create_slip';
    return initialTab === 'qr_scanner' && isDesktop ? 'create_slip' : initialTab;
  });

  // Sync tab with URL location changes & redirect desktop to draft-packing-slip if on qr_scanner
  useEffect(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    if (location.pathname.includes('qr-scanner')) {
      if (isDesktop) {
        setActiveTab('create_slip');
        navigate('/dispatch-receipt/draft-packing-slip', { replace: true });
      } else {
        setActiveTab('qr_scanner');
      }
    } else if (location.pathname.includes('dispatched-reels') || location.pathname.includes('dispatched-vault')) {
      setActiveTab('dispatched_vault');
    } else if (location.pathname.includes('packing-slips')) {
      setActiveTab('slips_list');
    } else if (location.pathname.includes('draft-packing-slip')) {
      setActiveTab('create_slip');
    } else if (initialTab) {
      if (initialTab === 'qr_scanner' && isDesktop) {
        setActiveTab('create_slip');
        navigate('/dispatch-receipt/draft-packing-slip', { replace: true });
      } else {
        setActiveTab(initialTab);
      }
    }
    setReels(getReels());
    setSlips(getPackingSlips());
    setOrders(getPendingOrders());
  }, [location.pathname, initialTab, navigate]);

  // Responsive Guard: If user was on mobile QR scanner and maximizes/resizes window to desktop,
  // automatically redirect to Draft Packing Slip so desktop is never blank
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        if (location.pathname.includes('qr-scanner') || activeTab === 'qr_scanner') {
          setActiveTab('create_slip');
          navigate('/dispatch-receipt/draft-packing-slip', { replace: true });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname, activeTab, navigate]);

  // Real-time listener: instant UI update whenever Supabase syncs new data
  useEffect(() => {
    const handleDataUpdate = (e?: any) => {
      const tables: string[] = e?.detail?.tables || (e?.detail?.table ? [e.detail.table] : []);
      const isAll = tables.length === 0 || tables.includes('all');

      if (isAll || tables.some(t => t.includes('order') || t.includes('pending'))) {
        setOrders(getPendingOrders());
      }
      if (isAll || tables.some(t => t.includes('reel') || t.includes('rewinder') || t.includes('stock'))) {
        setReels(getReels());
      }
      if (isAll || tables.some(t => t.includes('slip') || t.includes('dispatch') || t.includes('packing'))) {
        setSlips(getPackingSlips());
      }
    };

    window.addEventListener('saheb_data_updated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);
    return () => {
      window.removeEventListener('saheb_data_updated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
    };
  }, []);

  const handleTabChange = (tab: 'orders' | 'create_slip' | 'slips_list' | 'dispatched_vault' | 'qr_scanner') => {
    setActiveTab(tab);
    setReels(getReels());
    setSlips(getPackingSlips());
    setOrders(getPendingOrders());
    setSuccessMsg('');
    setErrorMsg('');
    if (!hideTabs) {
      if (tab === 'create_slip') {
        navigate('/dispatch-receipt/draft-packing-slip');
      } else if (tab === 'slips_list') {
        navigate('/dispatch-receipt/packing-slips-&-challans');
      } else if (tab === 'dispatched_vault') {
        navigate('/dispatch-receipt/dispatched-reels');
      } else if (tab === 'qr_scanner') {
        navigate('/dispatch-receipt/qr-scanner');
      }
    }
  };

  // 4. Edit Delivery Challan Modal State
  const [editingSlip, setEditingSlip] = useState<PackingSlip | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editPartyId, setEditPartyId] = useState('');
  const [editVehicleId, setEditVehicleId] = useState('');
  const [editReelNos, setEditReelNos] = useState<string[]>([]);
  const [editReelInput, setEditReelInput] = useState('');
  const [editModalError, setEditModalError] = useState('');

  // 5. In-Stock Reels Selection Modal (within Edit Challan)
  const [isEditStockPickerOpen, setIsEditStockPickerOpen] = useState(false);
  const [editPickerSearch, setEditPickerSearch] = useState('');
  const [editPickerProductFilter, setEditPickerProductFilter] = useState<'ALL' | string>('ALL');
  const [editPickerGsmFilter, setEditPickerGsmFilter] = useState<'ALL' | number>('ALL');
  const [editPickerSizeFilter, setEditPickerSizeFilter] = useState<'ALL' | number>('ALL');
  const [editPickerPlyFilter, setEditPickerPlyFilter] = useState<'ALL' | number>('ALL');
  const [editPickerGradeFilter, setEditPickerGradeFilter] = useState<'ALL' | 'A' | 'B'>('ALL');
  const [editPickerViewMode, setEditPickerViewMode] = useState<'grid' | 'table'>('grid');
  const [editPickerBarcodeInput, setEditPickerBarcodeInput] = useState('');
  const [editPickerSelectedNos, setEditPickerSelectedNos] = useState<string[]>([]);

  // 6. Three-dots Action Menu Dropdown State
  const [openMenuSlipId, setOpenMenuSlipId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    setReels(getReels());
  }, [activeTab]);

  // Tactile Web Audio Beep Sound
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  };

  // Success / Error States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Search Queries
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [slipSearchQuery, setSlipSearchQuery] = useState('');
  const [showAllReels, setShowAllReels] = useState(false);

  // Fast Reel Selection Filter States (Multi-select)
  const [reelSearchQuery, setReelSearchQuery] = useState('');
  const [reelProductFilters, setReelProductFilters] = useState<string[]>([]);
  const [reelGsmFilters, setReelGsmFilters] = useState<number[]>([]);
  const [reelSizeFilters, setReelSizeFilters] = useState<number[]>([]);
  const [reelPlyFilters, setReelPlyFilters] = useState<number[]>([]);
  const [reelGradeFilters, setReelGradeFilters] = useState<string[]>([]);
  const [reelViewMode, setReelViewMode] = useState<'grid' | 'table'>('grid');
  const [barcodeGunInput, setBarcodeGunInput] = useState('');

  const filteredOrders = useMemo(() => {
    const q = orderSearchQuery.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter(order => {
      const partyObj = parties.find(p => p.id === order.partyId);
      const prodObj = products.find(p => p.id === order.productId);
      return (
        (partyObj && partyObj.name.toLowerCase().includes(q)) ||
        (prodObj && prodObj.name.toLowerCase().includes(q)) ||
        order.id.toLowerCase().includes(q)
      );
    });
  }, [orders, orderSearchQuery, parties, products]);

  // Packing Slip List Filter States
  const [slipStatusFilter, setSlipStatusFilter] = useState<'ALL' | 'DRAFT' | 'CONFIRMED'>('ALL');
  const [slipPartyFilter, setSlipPartyFilter] = useState<'ALL' | string>('ALL');

  const filteredSlips = useMemo(() => {
    const q = slipSearchQuery.toLowerCase().trim();
    return slips.filter(slip => {
      if (slipStatusFilter !== 'ALL' && slip.status !== slipStatusFilter) return false;
      if (slipPartyFilter !== 'ALL' && slip.partyId !== slipPartyFilter) return false;
      if (q) {
        const partyObj = parties.find(p => p.id === slip.partyId);
        const vehicleObj = vehicles.find(v => v.id === slip.vehicleId);
        const matchNo = slip.slipNo.toLowerCase().includes(q);
        const matchDate = slip.date.toLowerCase().includes(q);
        const matchParty = partyObj && partyObj.name.toLowerCase().includes(q);
        const matchVehicle = vehicleObj && (vehicleObj.vehicleNo.toLowerCase().includes(q) || (slip.vehicleId || '').toLowerCase().includes(q));
        if (!matchNo && !matchDate && !matchParty && !matchVehicle) return false;
      }
      return true;
    });
  }, [slips, slipSearchQuery, slipStatusFilter, slipPartyFilter, parties, vehicles]);

  // 1. Order Creation States
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [orderGsm, setOrderGsm] = useState('16');
  const [orderSize, setOrderSize] = useState('30');
  const [orderPly, setOrderPly] = useState('2');
  const [orderTons, setOrderTons] = useState('25');
  const [orderQty, setOrderQty] = useState('20');
  const [orderReceiveDate, setOrderReceiveDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [openOrderDuePicker, setOpenOrderDuePicker] = useState(false);

  // 2. Packing Slip Form States
  const [slipNo, setSlipNo] = useState('');
  const [slipDate, setSlipDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [openSlipDatePicker, setOpenSlipDatePicker] = useState(false);
  const [slipPartyId, setSlipPartyId] = useState('');
  const [slipVehicleId, setSlipVehicleId] = useState('');
  const [selectedReelNos, setSelectedReelNos] = useState<string[]>([]);
  const [receiverSig, setReceiverSig] = useState('');

  // Custom Party Selection Dropdown States
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [partySearchQuery, setPartySearchQuery] = useState('');
  const partyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target as Node)) {
        setIsPartyDropdownOpen(false);
      }
    };
    if (isPartyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPartyDropdownOpen]);

  const filteredPartyOptions = useMemo(() => {
    const q = partySearchQuery.toLowerCase().trim();
    if (!q) return parties;
    return parties.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.contact && p.contact.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q))
    );
  }, [parties, partySearchQuery]);

  const selectedParty = useMemo(() => {
    return parties.find(p => p.id === slipPartyId);
  }, [parties, slipPartyId]);

  // 3. Active Challan Detail Modal (for PDF/Excel print review)
  const [viewingSlip, setViewingSlip] = useState<PackingSlip | null>(null);
  const [directPrintSlip, setDirectPrintSlip] = useState<PackingSlip | null>(null);
  const [receiptPage, setReceiptPage] = useState(1);
  const [receiptGroupMode, setReceiptGroupMode] = useState<'grouped' | 'sequential'>('grouped');
  const [receiptViewMode, setReceiptViewMode] = useState<'paged' | 'continuous'>('paged');

  useBodyScrollLock(!!viewingSlip || !!editingSlip || isEditStockPickerOpen);

  // Auto-generate sequential receipt number (starts with 1, auto-increments with existing receipts)
  const defaultReceiptNo = useMemo(() => {
    let maxNum = 0;
    slips.forEach(s => {
      const trimmed = (s.slipNo || '').trim();
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && String(num) === trimmed) {
        if (num > maxNum) maxNum = num;
      } else {
        const match = trimmed.match(/(\d+)$/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
      }
    });
    return maxNum > 0 ? String(maxNum + 1) : '1';
  }, [slips]);

  const autoSlipNo = slipNo.trim() || defaultReceiptNo;

  // Filter available reels in stock for Packing Slip selection (strictly in-stock warehouse reels)
  const availableReels = useMemo(() => {
    return reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B');
  }, [reels]);

  // Unique Products present in available reels for quick filter pills
  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    availableReels.forEach(r => {
      if (r.product) set.add(r.product);
    });
    return Array.from(set).sort();
  }, [availableReels]);

  // Unique GSMs present in available reels
  const uniqueGsms = useMemo(() => {
    const set = new Set<number>();
    availableReels.forEach(r => {
      if (r.gsm) set.add(r.gsm);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [availableReels]);

  // Unique Sizes present in available reels
  const uniqueSizes = useMemo(() => {
    const set = new Set<number>();
    availableReels.forEach(r => {
      if (r.size) set.add(r.size);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [availableReels]);

  // Unique Plys present in available reels
  const uniquePlys = useMemo(() => {
    const set = new Set<number>();
    availableReels.forEach(r => {
      if (r.ply) set.add(r.ply);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [availableReels]);

  // Multi-select toggle helpers
  const toggleProductFilter = (prod: string) => {
    setReelProductFilters(prev =>
      prev.includes(prod) ? prev.filter(p => p !== prod) : [...prev, prod]
    );
  };

  const toggleGsmFilter = (gsm: number) => {
    setReelGsmFilters(prev =>
      prev.includes(gsm) ? prev.filter(g => g !== gsm) : [...prev, gsm]
    );
  };

  const toggleSizeFilter = (sz: number) => {
    setReelSizeFilters(prev =>
      prev.includes(sz) ? prev.filter(s => s !== sz) : [...prev, sz]
    );
  };

  const togglePlyFilter = (ply: number) => {
    setReelPlyFilters(prev =>
      prev.includes(ply) ? prev.filter(p => p !== ply) : [...prev, ply]
    );
  };

  const toggleGradeFilter = (gr: string) => {
    setReelGradeFilters(prev =>
      prev.includes(gr) ? prev.filter(g => g !== gr) : [...prev, gr]
    );
  };

  const clearAllFilters = () => {
    setReelProductFilters([]);
    setReelGsmFilters([]);
    setReelSizeFilters([]);
    setReelPlyFilters([]);
    setReelGradeFilters([]);
    setReelSearchQuery('');
  };

  // Real-time filtered available reels (Multi-select)
  const filteredAvailableReels = useMemo(() => {
    return availableReels.filter(r => {
      if (reelProductFilters.length > 0) {
        const prod = (r.product || '').toLowerCase().trim();
        const match = reelProductFilters.some(t => {
          const target = t.toLowerCase().trim();
          return prod === target || prod.includes(target) || target.includes(prod);
        });
        if (!match) return false;
      }
      if (reelGsmFilters.length > 0 && !reelGsmFilters.includes(r.gsm)) return false;
      if (reelSizeFilters.length > 0 && !reelSizeFilters.includes(r.size)) return false;
      if (reelPlyFilters.length > 0 && !reelPlyFilters.includes(r.ply || 1)) return false;
      if (reelGradeFilters.length > 0 && !reelGradeFilters.includes((r.qcGrade || 'A').toUpperCase())) return false;
      if (reelSearchQuery.trim()) {
        const q = reelSearchQuery.toLowerCase().trim();
        const matchReelNo = r.reelNo.toLowerCase().includes(q);
        const matchProd = (r.product || '').toLowerCase().includes(q);
        const matchGsm = String(r.gsm).includes(q);
        const matchSize = String(r.size).includes(q);
        const matchWeight = String(r.weight).includes(q);
        if (!matchReelNo && !matchProd && !matchGsm && !matchSize && !matchWeight) return false;
      }
      return true;
    });
  }, [availableReels, reelProductFilters, reelGsmFilters, reelSizeFilters, reelPlyFilters, reelGradeFilters, reelSearchQuery]);

  // Predictive typing suggestions when user types in the rapid entry box
  const typingReelMatches = useMemo(() => {
    const q = barcodeGunInput.trim().toLowerCase();
    if (!q) return [];
    return availableReels
      .filter(r => !selectedReelNos.includes(r.reelNo) && (
        r.reelNo.toLowerCase().includes(q) ||
        String(r.gsm).includes(q) ||
        String(r.size).includes(q) ||
        (r.product || '').toLowerCase().includes(q)
      ))
      .slice(0, 4);
  }, [barcodeGunInput, availableReels, selectedReelNos]);

  // Live selected reels list and aggregated weight for Challan PDF preview
  const selectedReelsList = useMemo(() => {
    return availableReels.filter(r => selectedReelNos.includes(r.reelNo));
  }, [availableReels, selectedReelNos]);

  const totalSelectedWeight = useMemo(() => {
    return selectedReelsList.reduce((sum, r) => sum + (r.weight || 0), 0);
  }, [selectedReelsList]);

  const selectedSpecSummary = useMemo(() => {
    const map: { [k: string]: { label: string; count: number; weight: number } } = {};
    selectedReelsList.forEach(r => {
      const k = `${r.product || 'Tissue Paper'} • ${r.gsm} GSM • ${r.size} CM • ${r.ply || 1}P`;
      if (!map[k]) map[k] = { label: k, count: 0, weight: 0 };
      map[k].count += 1;
      map[k].weight += (r.weight || 0);
    });
    return Object.values(map);
  }, [selectedReelsList]);

  // Fast Batch Selection Actions
  const handleSelectAllFiltered = () => {
    const allNos = filteredAvailableReels.map(r => r.reelNo);
    setSelectedReelNos(prev => Array.from(new Set([...prev, ...allNos])));
    playBeep();
  };

  const handleDeselectAllFiltered = () => {
    const filteredSet = new Set(filteredAvailableReels.map(r => r.reelNo));
    setSelectedReelNos(prev => prev.filter(no => !filteredSet.has(no)));
    playBeep();
  };

  const handleSelectTopN = (n: number) => {
    const unselected = filteredAvailableReels.filter(r => !selectedReelNos.includes(r.reelNo));
    const toAdd = unselected.slice(0, n).map(r => r.reelNo);
    if (toAdd.length > 0) {
      setSelectedReelNos(prev => [...prev, ...toAdd]);
      playBeep();
    }
  };

  const handleBarcodeGunSubmit = (e?: React.FormEvent, customVal?: string) => {
    if (e) e.preventDefault();
    const raw = (customVal !== undefined ? customVal : barcodeGunInput).trim();
    if (!raw) return;
    const codes = raw.split(/[\s,]+/).filter(Boolean);
    const validCodesToAdd: string[] = [];
    codes.forEach(code => {
      // 1. Exact match first
      let found = availableReels.find(r => r.reelNo.toUpperCase() === code.toUpperCase());
      // 2. Partial match (last digits or subcode)
      if (!found) {
        found = availableReels.find(r => r.reelNo.toUpperCase().includes(code.toUpperCase()));
      }
      if (found) {
        validCodesToAdd.push(found.reelNo);
      }
    });
    if (validCodesToAdd.length > 0) {
      setSelectedReelNos(prev => Array.from(new Set([...prev, ...validCodesToAdd])));
      playBeep();
      setBarcodeGunInput('');
      setSuccessMsg(`Added ${validCodesToAdd.length} reel(s): ${validCodesToAdd.join(', ')}`);
    } else {
      setErrorMsg(`Reel '${raw}' not found in active warehouse stock.`);
    }
  };

  // Handle Product select in Order Booking
  const handleSelectOrderProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setOrderGsm(String(prod.gsm || 16));
      setOrderSize(String(prod.size || 30));
      setOrderPly(String(prod.ply || 2));
    }
  };

  // Handle Order submit
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (isViewer) {
      setErrorMsg('Viewer Mode: Booking customer orders is locked. You have read-only access.');
      return;
    }

    if (!selectedPartyId || !selectedProductId || (!orderQty && !orderTons) || !orderReceiveDate) {
      setErrorMsg('Please select Customer Party, Product, Quantity and Receive Date');
      return;
    }

    const qty = parseInt(orderQty) || Math.round(((parseFloat(orderTons) || 1) * 1000) / 1200) || 1;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) {
      setErrorMsg('Invalid product selection');
      return;
    }

    const newOrder: PendingOrder = {
      id: `or-${Date.now()}`,
      partyId: selectedPartyId,
      productId: selectedProductId,
      gsm: parseFloat(orderGsm) || prod.gsm,
      size: parseFloat(orderSize) || prod.size,
      ply: parseInt(orderPly) || prod.ply,
      qty,
      weightTons: parseFloat(orderTons) || parseFloat(((qty * 1200) / 1000).toFixed(2)),
      receiveDate: orderReceiveDate,
      dueDate: orderReceiveDate,
      status: 'PENDING',
      dispatchedQty: 0,
    };

    savePendingOrder(newOrder, user?.displayName || 'System');
    setOrders(getPendingOrders());
    setSuccessMsg('Customer Order Booking successfully registered!');
    setSelectedPartyId('');
    setSelectedProductId('');
    setOrderTons('25');
    setOrderQty('20');
  };

  // Toggle reel selection
  const handleToggleReel = (rNo: string) => {
    setSelectedReelNos(prev => {
      const exists = prev.includes(rNo);
      playBeep();
      return exists ? prev.filter(n => n !== rNo) : [...prev, rNo];
    });
  };

  // Handle Draft Packing Slip creation
  const handleSlipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (isViewer) {
      setErrorMsg('Viewer Mode: Creating packing slips is locked. You have read-only access.');
      return;
    }

    const targetSlipNo = slipNo.trim() || autoSlipNo;

    if (!slipPartyId || !slipVehicleId.trim() || selectedReelNos.length === 0) {
      setErrorMsg('Please select Customer Party, enter Vehicle / Truck No, and select at least 1 Reel.');
      return;
    }

    if (slips.some(s => s.slipNo.toUpperCase() === targetSlipNo.toUpperCase())) {
      setErrorMsg(`Challan number ${targetSlipNo} has already been logged.`);
      return;
    }

    const newSlip: PackingSlip = {
      id: `slip-${Date.now()}`,
      slipNo: targetSlipNo,
      date: slipDate,
      partyId: slipPartyId,
      vehicleId: slipVehicleId.trim(),
      reelNos: [...selectedReelNos],
      driverSignature: 'Gate Verified',
      receiverSignature: receiverSig.trim() || 'Gate Verified',
      status: 'DRAFT',
    };

    savePackingSlip(newSlip, user?.displayName || 'System');
    setSlips(getPackingSlips());
    setSuccessMsg(`Draft Packing Slip #${targetSlipNo} created successfully! Reels linked: ${selectedReelNos.length}`);
    
    // Reset Form
    setSlipNo('');
    setSlipPartyId('');
    setSlipVehicleId('');
    setSelectedReelNos([]);
    setReceiverSig('');
    handleTabChange('slips_list');
  };

  // Handle Open Edit Challan
  const handleOpenEditSlip = (slip: PackingSlip) => {
    setEditingSlip(slip);
    setEditDate(slip.date);
    setEditPartyId(slip.partyId);
    setEditVehicleId(slip.vehicleId);
    setEditReelNos([...slip.reelNos]);
    setEditReelInput('');
    setEditModalError('');
  };

  // Handle Remove Reel from Edit
  const handleRemoveReelFromEdit = (rNo: string) => {
    setEditReelNos(prev => prev.filter(no => no !== rNo));
  };

  // Handle Add Reel to Edit
  const handleAddReelToEdit = (rNo: string) => {
    const cleanNo = rNo.trim();
    if (!cleanNo) return;
    if (!editReelNos.includes(cleanNo)) {
      setEditReelNos(prev => [...prev, cleanNo]);
      setEditReelInput('');
    }
  };

  // Handle Save Edit Slip
  const handleSaveEditSlip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlip) return;
    setEditModalError('');

    if (!editPartyId) {
      setEditModalError('Please select a Customer / Party.');
      return;
    }
    if (!editVehicleId.trim()) {
      setEditModalError('Please specify a Vehicle Number.');
      return;
    }
    if (editReelNos.length === 0) {
      setEditModalError('Delivery Challan must have at least 1 linked reel.');
      return;
    }

    const updatedSlip: PackingSlip = {
      ...editingSlip,
      date: editDate,
      partyId: editPartyId,
      vehicleId: editVehicleId,
      reelNos: editReelNos,
    };

    savePackingSlip(updatedSlip, user?.displayName || 'System');
    setSlips(getPackingSlips());
    setReels(getReels());
    setOrders(getPendingOrders());
    setEditingSlip(null);
    setSuccessMsg(`Delivery Challan #${updatedSlip.slipNo} updated successfully!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Stock Reels Picker Handlers for Edit Modal
  const handleOpenEditStockPicker = () => {
    setEditPickerSearch(editReelInput.trim());
    setEditPickerBarcodeInput('');
    setEditPickerSelectedNos([]);
    setEditPickerProductFilter('ALL');
    setEditPickerGsmFilter('ALL');
    setEditPickerSizeFilter('ALL');
    setEditPickerPlyFilter('ALL');
    setEditPickerGradeFilter('ALL');
    setIsEditStockPickerOpen(true);
  };

  const handleTogglePickerReel = (rNo: string) => {
    setEditPickerSelectedNos(prev => {
      const exists = prev.includes(rNo);
      playBeep();
      return exists ? prev.filter(n => n !== rNo) : [...prev, rNo];
    });
  };

  const handleSelectAllPickerReels = (reelsList: Reel[]) => {
    const allNos = reelsList.map(r => r.reelNo);
    setEditPickerSelectedNos(prev => Array.from(new Set([...prev, ...allNos])));
    playBeep();
  };

  const handleSelectPickerTopN = (n: number, reelsList: Reel[]) => {
    const topNos = reelsList.slice(0, n).map(r => r.reelNo);
    setEditPickerSelectedNos(prev => Array.from(new Set([...prev, ...topNos])));
    playBeep();
  };

  const handleDeselectAllPickerReels = () => {
    setEditPickerSelectedNos([]);
    playBeep();
  };

  const handlePickerBarcodeSubmit = (e?: React.FormEvent, directReelNo?: string) => {
    if (e) e.preventDefault();
    const query = (directReelNo || editPickerBarcodeInput).trim().toLowerCase();
    if (!query) return;

    const matched = availableReelsForEdit.find(r => r.reelNo.toLowerCase() === query);
    if (matched) {
      if (!editPickerSelectedNos.includes(matched.reelNo)) {
        setEditPickerSelectedNos(prev => [...prev, matched.reelNo]);
        playBeep();
      }
      setEditPickerBarcodeInput('');
    }
  };

  const handleConfirmAddFromStockPicker = () => {
    if (editPickerSelectedNos.length > 0) {
      setEditReelNos(prev => Array.from(new Set([...prev, ...editPickerSelectedNos])));
      setEditReelInput('');
    }
    setIsEditStockPickerOpen(false);
  };

  // Filter available reels in stock for Edit Challan picker
  const availableReelsForEdit = useMemo(() => {
    return reels.filter(r => {
      const isNotDispatched = r.status !== 'DISPATCHED' && r.status !== 'DELIVERED';
      const isNotAlreadyInChallan = !editReelNos.includes(r.reelNo);
      return isNotDispatched && isNotAlreadyInChallan;
    });
  }, [reels, editReelNos]);

  // Unique products for edit picker
  const editPickerUniqueProducts = useMemo(() => {
    const set = new Set<string>();
    availableReelsForEdit.forEach(r => {
      if (r.product) set.add(r.product);
    });
    return Array.from(set).sort();
  }, [availableReelsForEdit]);

  // Unique GSMs for edit picker
  const editPickerUniqueGsms = useMemo(() => {
    const set = new Set<number>();
    availableReelsForEdit.forEach(r => {
      if (editPickerProductFilter === 'ALL' || r.product === editPickerProductFilter) {
        if (r.gsm) set.add(r.gsm);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [availableReelsForEdit, editPickerProductFilter]);

  // Unique Sizes for edit picker
  const editPickerUniqueSizes = useMemo(() => {
    const set = new Set<number>();
    availableReelsForEdit.forEach(r => {
      const matchProd = editPickerProductFilter === 'ALL' || r.product === editPickerProductFilter;
      const matchGsm = editPickerGsmFilter === 'ALL' || r.gsm === editPickerGsmFilter;
      if (matchProd && matchGsm && r.size) {
        set.add(r.size);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [availableReelsForEdit, editPickerProductFilter, editPickerGsmFilter]);

  // Unique Plys for edit picker
  const editPickerUniquePlys = useMemo(() => {
    const set = new Set<number>();
    availableReelsForEdit.forEach(r => {
      const matchProd = editPickerProductFilter === 'ALL' || r.product === editPickerProductFilter;
      const matchGsm = editPickerGsmFilter === 'ALL' || r.gsm === editPickerGsmFilter;
      const matchSize = editPickerSizeFilter === 'ALL' || r.size === editPickerSizeFilter;
      if (matchProd && matchGsm && matchSize && r.ply) {
        set.add(r.ply);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [availableReelsForEdit, editPickerProductFilter, editPickerGsmFilter, editPickerSizeFilter]);

  const filteredAvailableReelsForEdit = useMemo(() => {
    const q = editPickerSearch.toLowerCase().trim();
    return availableReelsForEdit.filter(r => {
      if (editPickerProductFilter !== 'ALL' && r.product !== editPickerProductFilter) return false;
      if (editPickerGsmFilter !== 'ALL' && r.gsm !== editPickerGsmFilter) return false;
      if (editPickerSizeFilter !== 'ALL' && r.size !== editPickerSizeFilter) return false;
      if (editPickerPlyFilter !== 'ALL' && r.ply !== editPickerPlyFilter) return false;
      if (editPickerGradeFilter !== 'ALL') {
        const grade = (r.qcGrade || 'A').toUpperCase();
        if (grade !== editPickerGradeFilter) return false;
      }
      if (q) {
        const matchNo = r.reelNo.toLowerCase().includes(q);
        const matchProd = r.product.toLowerCase().includes(q);
        const matchGsm = String(r.gsm).includes(q);
        const matchSize = String(r.size).includes(q);
        const matchWeight = String(r.weight).includes(q);
        if (!matchNo && !matchProd && !matchGsm && !matchSize && !matchWeight) return false;
      }
      return true;
    });
  }, [availableReelsForEdit, editPickerSearch, editPickerProductFilter, editPickerGsmFilter, editPickerSizeFilter, editPickerPlyFilter, editPickerGradeFilter]);

  // Handle Confirm Dispatch trigger (atomic decrement & status updates)
  const handleConfirmDispatch = (slipId: string) => {
    setSuccessMsg('');
    setErrorMsg('');

    if (isViewer) {
      setErrorMsg('Viewer Mode: Confirming dispatch is locked. You have read-only access.');
      return;
    }

    try {
      confirmDispatch(slipId, user?.displayName || 'System');
      // Refresh local lists
      setSlips(getPackingSlips());
      setReels(getReels());
      setOrders(getPendingOrders());
      setSuccessMsg('Dispatch finalized successfully! Finished stock counts decremented and transaction audit log written.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error finalizing dispatch');
    }
  };

  // Handle Delete Challan
  const handleDeleteSlip = (slip: PackingSlip) => {
    if (isViewer) {
      setErrorMsg('Viewer Mode: Deleting challans is locked.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete Delivery Challan #${slip.slipNo}? Any reels linked to this challan will be restored to warehouse finished stock.`)) {
      deletePackingSlip(slip.id, user?.displayName || 'Admin');
      setSlips(getPackingSlips());
      setReels(getReels());
      setOrders(getPendingOrders());
      playBeep();
      setSuccessMsg(`Delivery Challan #${slip.slipNo} deleted successfully. Linked reels restored to finished stock.`);
    }
  };

  // --- SHEETJS EXPORTS ---
  const handleExportExcel = (slip: PackingSlip) => {
    const partyObj = parties.find(p => p.id === slip.partyId);
    const vehicleObj = vehicles.find(v => v.id === slip.vehicleId);
    const linkedReels = reels.filter(r => slip.reelNos.includes(r.reelNo));

    const data = linkedReels.map(r => ({
      'Reel Number': r.reelNo,
      'Product Description': r.product,
      'GSM': r.gsm,
      'Size (cm)': r.size,
      'Ply': r.ply,
      'Weight (kg)': r.weight,
      'Joints': r.joint,
      'QC Grade': r.qcGrade,
    }));

    const worksheet = XLSX.utils.json_to_sheet([]);
    
    // Add Metadata header rows
    XLSX.utils.sheet_add_aoa(worksheet, [
      [`${COMPANY_CONFIG.name} - DELIVERY CHALLAN RECEIPT`],
      [`Address: ${COMPANY_CONFIG.address}`],
      [`Phone: ${COMPANY_CONFIG.phone}`, `Email: ${COMPANY_CONFIG.email}`, `Website: ${COMPANY_CONFIG.website}`],
      [`Challan No: ${slip.slipNo}`, `Date: ${slip.date}`],
      [`Customer: ${partyObj?.name || 'N/A'}`, `Vehicle No: ${vehicleObj?.vehicleNo || 'N/A'}`],
      [`Driver: ${slip.driverSignature}`, `Receiver: ${slip.receiverSignature}`],
      [], // blank separator row
    ], { origin: "A1" });

    // Add data starting at row 6
    XLSX.utils.sheet_add_json(worksheet, data, { origin: "A6" });

    // Set column widths
    worksheet['!cols'] = [
      { wch: 28 }, // Reel Number
      { wch: 22 }, // Product Description
      { wch: 8 },  // GSM
      { wch: 12 }, // Size
      { wch: 6 },  // Ply
      { wch: 14 }, // Weight
      { wch: 14 }, // Diameter
      { wch: 8 },  // Joints
      { wch: 10 }, // QC Grade
    ];

    // Merge title row
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Challan Summary");
    XLSX.writeFile(workbook, `Delivery_Challan_${slip.slipNo}.xlsx`);
  };

  const handlePrintSlip = (slip: PackingSlip) => {
    if (isViewer) return;
    setDirectPrintSlip(slip);
    document.body.classList.add('printing-challan');

    const cleanup = () => {
      document.body.classList.remove('printing-challan');
      setDirectPrintSlip(null);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 2000);
    }, 120);
  };

  const handlePrintChallan = () => {
    if (isViewer) return;
    document.body.classList.add('printing-challan');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-challan');
    }, 1500);
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      
      {/* Title / Hero Banner */}
      {!hideHeader && (
        <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs relative z-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
                <Truck className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                    {initialTab === 'orders' ? 'Order Bookings' : 'Dispatch Receipt'}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {initialTab === 'orders'
                    ? 'Manage pending customer purchase orders and view required quantities.'
                    : 'Issue delivery challans, scan loading reels, and track customer shipments.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Accessible Segmented Tab Bar */}
      {!hideTabs && (
        <div className="bg-white dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 w-full">
            {initialTab === 'orders' ? (
              <button
                type="button"
                onClick={() => { setActiveTab('orders'); setSuccessMsg(''); setErrorMsg(''); }}
                className="col-span-1 md:col-span-3 w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer bg-primary text-white shadow-xs"
              >
                <FileText className="h-4.5 w-4.5" />
                <span>Customer Order Bookings</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleTabChange('create_slip')}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                    activeTab === 'create_slip'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="truncate">Draft Packing Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('slips_list')}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                    activeTab === 'slips_list'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Truck className="h-4 w-4 shrink-0" />
                  <span className="truncate">Packing Slips &amp; Challans</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                    activeTab === 'slips_list' 
                      ? 'bg-white/20 text-white border border-white/30' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80'
                  }`}>
                    {slips.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('dispatched_vault')}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                    activeTab === 'dispatched_vault'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <PackageCheck className="h-4 w-4 shrink-0" />
                  <span className="truncate">Dispatched Reels</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                    activeTab === 'dispatched_vault' 
                      ? 'bg-white/20 text-white border border-white/30' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80'
                  }`}>
                    {reels.filter(r => r.status === 'DISPATCHED' || r.challanNo).length}
                  </span>
                </button>

                {/* Mobile-Only QR Scanner Tab */}
                <button
                  type="button"
                  onClick={() => handleTabChange('qr_scanner')}
                  className={`md:hidden w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                    activeTab === 'qr_scanner'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <QrCode className="h-4 w-4 shrink-0" />
                  <span className="truncate">QR Scanner</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

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

      {/* 1. TAB: Pending Customer Orders */}
      {activeTab === 'orders' && (() => {
        const timeframeOrders = orders.filter(o => isDateInTimeframe(o.receiveDate || o.dueDate || '', selectedDate, timeframe));
        const timeframeLabel = timeframe === 'day' ? `For Day (${selectedDate})` : timeframe === 'week' ? 'Weekly Window' : timeframe === 'month' ? `Month (${selectedDate.substring(0, 7)})` : 'All-Time';
        const pendingCount = timeframeOrders.filter(o => o.status !== 'COMPLETED').length;
        const totalReelsOrdered = timeframeOrders.reduce((sum, o) => sum + (o.qty || 0), 0);
        const totalTonsOrdered = timeframeOrders.reduce((sum, o) => sum + (o.weightTons || 0), 0);

        return (
          <div className="space-y-4">
            {/* Top KPI Metrics Row for Orders */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Orders</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{timeframeOrders.length}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5 truncate">{timeframeLabel}</span>
              </div>

              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Pending Fulfillment</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {pendingCount}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Awaiting Dispatch</span>
              </div>

              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Ordered Units</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {totalReelsOrdered}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Reels Booked</span>
              </div>

              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Total Volume</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {totalTonsOrdered > 0 ? `${totalTonsOrdered.toFixed(1)} T` : `${totalReelsOrdered} Reels`}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Booked Tonnage</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* List Section */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Active Orders Ledger
            </h3>

            {/* Search bar */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 flex items-center gap-3">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={orderSearchQuery}
                onChange={e => setOrderSearchQuery(e.target.value)}
                placeholder="Search orders by customer or product..."
                className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
              />
              <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                <ListFilter className="h-4 w-4" />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center font-medium">No orders match your search criteria.</p>
            ) : (
              <div className="space-y-4">
                {/* Desktop/Tablet Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                        <th className="py-3 px-3">Customer Party</th>
                        <th className="py-3 px-3">Product Specs</th>
                        <th className="py-3 px-3">Ordered Qty</th>
                        <th className="py-3 px-3">Dispatched</th>
                        <th className="py-3 px-3">Stock vs Pending</th>
                        <th className="py-3 px-3">Receive Date</th>
                        <th className="py-3 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {filteredOrders.map(order => {
                        const partyObj = parties.find(p => p.id === order.partyId);
                        const prodObj = products.find(p => p.id === order.productId);
                        const pendingReels = Math.max(0, order.qty - order.dispatchedQty);
                        const inStockMatching = reels.filter(
                          r => (r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B' || r.status === 'QC_PASSED') &&
                               !r.challanNo &&
                               r.gsm === order.gsm &&
                               r.size === order.size &&
                               r.ply === order.ply
                        );
                        const hasEnoughStock = inStockMatching.length >= pendingReels;

                        return (
                          <tr key={order.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{partyObj?.name}</td>
                            <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                              <span className="font-extrabold">{prodObj?.name || 'Tissue Paper'}</span>
                              <span className="text-[11px] text-slate-500 block font-mono">{order.gsm} GSM &bull; {order.size} cm &bull; {order.ply} Ply</span>
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white font-mono">
                              {order.weightTons ? `${order.weightTons} T` : ''} <span className="text-slate-500 font-normal">({order.qty} reels)</span>
                            </td>
                            <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold font-mono">{order.dispatchedQty} reels</td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                hasEnoughStock
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${hasEnoughStock ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {hasEnoughStock
                                  ? `Ready (${inStockMatching.length} in stock)`
                                  : `Shortfall (${inStockMatching.length}/${pendingReels} stock)`}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                              {order.receiveDate || order.dueDate}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                order.status === 'PENDING' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200' :
                                order.status === 'PARTIAL' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200' :
                                'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Stacked Cards */}
                <div className="block md:hidden space-y-3">
                  {filteredOrders.map(order => {
                    const partyObj = parties.find(p => p.id === order.partyId);
                    const prodObj = products.find(p => p.id === order.productId);
                    const pendingReels = Math.max(0, order.qty - order.dispatchedQty);
                    const inStockMatching = reels.filter(
                      r => (r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B' || r.status === 'QC_PASSED') &&
                           !r.challanNo &&
                           r.gsm === order.gsm &&
                           r.size === order.size &&
                           r.ply === order.ply
                    );
                    const hasEnoughStock = inStockMatching.length >= pendingReels;

                    return (
                      <div key={order.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs text-left">
                        <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
                          <span className="font-bold text-slate-900 dark:text-white">{partyObj?.name}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            order.status === 'PENDING' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' :
                            order.status === 'PARTIAL' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' :
                            'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 text-[11px] text-slate-600 dark:text-slate-400">
                          <div>
                            <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Product Spec</span>
                            <span className="font-semibold text-slate-800 dark:text-white">{prodObj?.name} ({order.gsm}GSM | {order.size}cm | {order.ply}P)</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Ordered Weight / Qty</span>
                            <span className="font-bold text-slate-800 dark:text-white font-mono">{order.weightTons ? `${order.weightTons} T` : ''} ({order.qty} reels)</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Stock vs Pending</span>
                            <span className={`font-bold ${hasEnoughStock ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {hasEnoughStock ? `Ready (${inStockMatching.length} stock)` : `Shortfall (${inStockMatching.length}/${pendingReels})`}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Receive Date</span>
                            <span className="font-medium text-slate-800 dark:text-white font-mono">{order.receiveDate || order.dueDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Register New Order Booking
            </h3>

            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <CustomSearchableSelect
                  label="SELECT CUSTOMER PARTY"
                  placeholder="-- Choose Customer Party --"
                  value={selectedPartyId}
                  onChange={setSelectedPartyId}
                  options={parties.map(p => ({
                    value: p.id,
                    label: p.name,
                    sublabel: p.contact ? `Contact: ${p.contact}` : p.address,
                  }))}
                  required
                />
              </div>

              <div>
                <CustomSearchableSelect
                  label="SELECT PRODUCT"
                  placeholder="-- Choose Product --"
                  value={selectedProductId}
                  onChange={handleSelectOrderProduct}
                  options={products.map(p => ({
                    value: p.id,
                    label: `${p.name} (${p.gsm} GSM, ${p.size} cm)`,
                  }))}
                  required
                />
              </div>

              {/* Specs Grid: GSM, Size, Ply */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">GSM</label>
                  <input
                    type="number"
                    value={orderGsm}
                    onChange={e => setOrderGsm(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold font-mono dark:text-white border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Size (cm)</label>
                  <input
                    type="number"
                    value={orderSize}
                    onChange={e => setOrderSize(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold font-mono dark:text-white border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Ply</label>
                  <CustomSearchableSelect
                    size="sm"
                    value={orderPly}
                    onChange={setOrderPly}
                    options={[
                      { value: '1', label: '1 Ply' },
                      { value: '2', label: '2 Ply' },
                      { value: '3', label: '3 Ply' },
                    ]}
                    hideSearch
                  />
                </div>
              </div>

              {/* Weight in Tons & Reels count */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Weight (Tons)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={orderTons}
                    onChange={e => {
                      const val = e.target.value;
                      setOrderTons(val);
                      if (val) {
                        setOrderQty(String(Math.round(((parseFloat(val) || 0) * 1000) / 1200)));
                      }
                    }}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700"
                    placeholder="25.0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Ordered Reels</label>
                  <input
                    type="number"
                    value={orderQty}
                    onChange={e => {
                      const val = e.target.value;
                      setOrderQty(val);
                      if (val) {
                        setOrderTons(((parseFloat(val) * 1200) / 1000).toFixed(1));
                      }
                    }}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold font-mono dark:text-white border border-slate-200 dark:border-slate-700"
                    placeholder="20"
                  />
                </div>
              </div>

              {/* Receive Date */}
              <div className="relative">
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Receive Date
                </label>
                <button
                  type="button"
                  onClick={() => setOpenOrderDuePicker(prev => !prev)}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700"
                >
                  <span className={orderReceiveDate ? 'font-bold font-mono' : 'text-slate-400 font-normal'}>
                    {orderReceiveDate || 'dd-mm-yyyy'}
                  </span>
                  <Calendar className="h-4 w-4 text-primary dark:text-blue-400" />
                </button>
                {openOrderDuePicker && (
                  <CustomDatePickerModal
                    selectedDate={orderReceiveDate}
                    onSelectDate={(newDate) => {
                      setOrderReceiveDate(newDate);
                      setOpenOrderDuePicker(false);
                    }}
                    onClose={() => setOpenOrderDuePicker(false)}
                    allowFuture={true}
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={isViewer}
                title={isViewer ? 'Viewer Mode: Booking customer orders is locked (Read-Only)' : 'Book Customer Order'}
                className={`w-full py-3 text-xs uppercase tracking-wider rounded-2xl font-black transition flex items-center justify-center gap-2 ${
                  isViewer
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                    : 'btn-primary-gradient cursor-pointer font-black shadow-lg'
                }`}
              >
                {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : null}
                <span>{isViewer ? 'Book Customer Order (Locked)' : 'Book Customer Order'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  })()}

      {/* 2. TAB: Create Draft Packing Slip */}
      {activeTab === 'create_slip' && (
        <form
          onSubmit={handleSlipSubmit}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
              const inputEl = e.target as HTMLInputElement;
              if (inputEl.placeholder?.includes('Scan / Type Reel Number')) {
                return; // let rapid reel entry handle its own submit
              }
              e.preventDefault();
            }
          }}
          className="flex flex-col gap-5 w-full items-stretch"
        >
          
          {/* Top Challan Header & Dispatch Form (Full-Width Card) */}
          <div className="neumorphic-card p-5 sm:p-6 space-y-4 text-left w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Create Gate Pass Challan
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Fill dispatch details above and select warehouse reels below
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800 font-mono">
                RECEIPT #{autoSlipNo}
              </span>
            </div>

            {/* Form Fields in 4-Column Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. Editable Receipt No (Defaults to next sequence starting with 1) */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Receipt No</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {slipNo.trim() ? 'Custom' : 'Auto'}
                  </span>
                </label>
                <div className="relative">
                  <Hash className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={slipNo}
                    onChange={e => setSlipNo(e.target.value)}
                    placeholder={defaultReceiptNo}
                    className="w-full py-2.5 pl-9 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                  />
                </div>
              </div>
              {/* Custom Modern Searchable Party Dropdown */}
              <div className="relative" ref={partyDropdownRef}>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Customer / Party Name</span>
                  {selectedParty && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                      Selected
                    </span>
                  )}
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setIsPartyDropdownOpen(prev => !prev);
                    setPartySearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border rounded-2xl text-xs font-bold transition cursor-pointer text-left ${
                    isPartyDropdownOpen
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Building2 className={`h-4 w-4 shrink-0 ${selectedParty ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    <span className={`truncate ${selectedParty ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-400 font-normal'}`}>
                      {selectedParty ? selectedParty.name : '-- Select Customer Party --'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1.5">
                    {selectedParty && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlipPartyId('');
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 cursor-pointer rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Clear party"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isPartyDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </div>
                </button>

                {/* Dropdown Popup Menu */}
                {isPartyDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 min-w-[240px]">
                    {/* Search inside Dropdown */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/60">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={partySearchQuery}
                          onChange={e => setPartySearchQuery(e.target.value)}
                          placeholder="Search customer party..."
                          className="w-full py-1.5 pl-8 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none dark:text-white"
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Party Options List */}
                    <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                      {filteredPartyOptions.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400 font-semibold">
                          No matching customer party found
                        </div>
                      ) : (
                        filteredPartyOptions.map(p => {
                          const isSelected = slipPartyId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSlipPartyId(p.id);
                                setIsPartyDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="truncate text-slate-900 dark:text-white font-extrabold">{p.name}</div>
                                {(p.contact || p.address) && (
                                  <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                                    {p.contact} {p.address ? `• ${p.address}` : ''}
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Vehicle / Truck No</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="dispatch-truck-suggestions"
                    value={slipVehicleId}
                    onChange={e => setSlipVehicleId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none dark:text-white uppercase font-mono placeholder:normal-case placeholder:font-sans"
                    placeholder="e.g. GJ-05-BX-4921"
                  />
                  <datalist id="dispatch-truck-suggestions">
                    {vehicles.map(v => (
                      <option key={v.id} value={v.vehicleNo}>{v.vehicleNo}</option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="relative">
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  Dispatch Date
                </label>
                <button
                  type="button"
                  onClick={() => setOpenSlipDatePicker(prev => !prev)}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span className={slipDate ? 'font-mono' : 'text-slate-400 font-normal'}>{slipDate || 'dd-mm-yyyy'}</span>
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </button>
                {openSlipDatePicker && (
                  <CustomDatePickerModal
                    selectedDate={slipDate}
                    onSelectDate={(newDate) => {
                      setSlipDate(newDate);
                      setOpenSlipDatePicker(false);
                    }}
                    onClose={() => setOpenSlipDatePicker(false)}
                    allowFuture={true}
                  />
                )}
              </div>
            </div>

            {/* Bottom summary bar with Weight Tally + Dispatch Action Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center gap-3">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Total Loaded:
                  </span>
                  <span className="text-sm font-black font-mono text-primary dark:text-blue-400">
                    {selectedReelNos.length} Reels
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {availableReels.filter(r => selectedReelNos.includes(r.reelNo)).reduce((sum, r) => sum + (r.weight || 0), 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">KG</span>
                  </span>
                </div>

                <div className="text-xs text-slate-500 font-semibold">
                  {receiverSig ? (
                    <span className="text-slate-600 dark:text-slate-300">Receiver: {receiverSig}</span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleTabChange('qr_scanner')}
                  className="md:hidden px-3.5 py-2.5 rounded-2xl text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 cursor-pointer transition flex items-center gap-1.5"
                  title="Open Mobile QR Scanner"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Scan QR</span>
                </button>

                <button
                  type="submit"
                  disabled={isViewer}
                  title={isViewer ? 'Viewer Mode: Dispatch is locked (Read-Only)' : 'Print Gate Pass & Dispatch'}
                  className={`py-3 px-6 text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl font-black transition ${
                    isViewer
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                      : 'btn-primary-gradient cursor-pointer'
                  }`}
                >
                  {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Truck className="h-4 w-4" />}
                  <span>{isViewer ? 'Print Gate Pass & Dispatch (Locked)' : 'Print Gate Pass & Dispatch'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reel Selection Ledger (Full Width Card) - FAST BATCH & MULTI-SELECTION ENGINE */}
          <div className="neumorphic-card p-5 sm:p-6 space-y-4 text-left w-full">
            
            {/* 1. Header with Tally, Search Bar & View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Warehouse Stock Reels
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-black font-mono">
                    {selectedReelNos.length} Selected ({availableReels.filter(r => selectedReelNos.includes(r.reelNo)).reduce((s, r) => s + (r.weight || 0), 0).toLocaleString()} kg)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Showing {filteredAvailableReels.length} of {availableReels.length} available reels
                </p>
              </div>

              {/* RIGHT SIDE OF PICTURE 3: Live Search Input + View Switcher */}
              <div className="flex items-center gap-2">
                {/* Search Bar placed directly in Pic 3 spot */}
                <div className="relative w-full sm:w-56">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reelSearchQuery}
                    onChange={e => setReelSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    placeholder="Search No, GSM, Size..."
                    className="w-full py-1.5 pl-8 pr-7 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none dark:text-white"
                  />
                  {reelSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setReelSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Rapid Reel / Barcode Gun Entry Bar (Clean Input without Clunky Datalist) */}
            <div className="space-y-2">
              <div className="flex gap-1.5 relative">
                <div className="relative w-full">
                  <ScanBarcode className="h-4 w-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={barcodeGunInput}
                    onChange={e => setBarcodeGunInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleBarcodeGunSubmit(e);
                      }
                    }}
                    placeholder="Scan / Type Reel Number (e.g. 1048)..."
                    className="w-full py-2 pl-8 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none dark:text-white font-mono placeholder:font-sans placeholder:font-normal"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleBarcodeGunSubmit()}
                  className="px-4 py-2 bg-[#008163] hover:bg-[#006e54] text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Reel</span>
                </button>
              </div>

              {/* Smart Predictive Typing Assistance Chips (Instant 1-Click Tap to Add) */}
              {typingReelMatches.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 rounded-xl">
                  <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider mr-1">
                    Quick Match (Tap to Add):
                  </span>
                  {typingReelMatches.map(r => (
                    <button
                      key={r.reelNo}
                      type="button"
                      onClick={() => handleBarcodeGunSubmit(undefined, r.reelNo)}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer transition flex items-center gap-1 font-mono"
                    >
                      <Plus className="h-3 w-3 text-blue-500" />
                      <span>{r.reelNo}</span>
                      <span className="text-[10px] font-normal text-slate-400">({r.gsm}g • {r.size}cm • {r.weight}kg)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Streamlined Batch Selection & Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  Quick Select:
                </span>
                
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-extrabold border border-blue-200 dark:border-blue-800 cursor-pointer transition flex items-center gap-1"
                >
                  <CheckSquare className="h-3 w-3" />
                  <span>Select All ({filteredAvailableReels.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTopN(5)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-extrabold cursor-pointer transition"
                >
                  + 5 Reels
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTopN(10)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-extrabold cursor-pointer transition"
                >
                  + 10 Reels
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTopN(20)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-extrabold cursor-pointer transition"
                >
                  + 20 Reels
                </button>

                {selectedReelNos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReelNos([]);
                      playBeep();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-extrabold border border-red-200 dark:border-red-800 cursor-pointer transition flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    <span>Clear Selection ({selectedReelNos.length})</span>
                  </button>
                )}
              </div>

              {reelSearchQuery && (
                <button
                  type="button"
                  onClick={() => setReelSearchQuery('')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Search Filter</span>
                </button>
              )}
            </div>


            {/* 4. REELS LIST: High-Density Table View */}
            {filteredAvailableReels.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl font-semibold">
                No warehouse reels match your current filter. Try resetting the search query.
              </p>
            ) : (
              /* HIGH-DENSITY COMPACT TABLE VIEW */
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase text-[10px] font-black tracking-wider z-10">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredAvailableReels.length > 0 && filteredAvailableReels.every(r => selectedReelNos.includes(r.reelNo))}
                          onChange={e => {
                            if (e.target.checked) handleSelectAllFiltered();
                            else handleDeselectAllFiltered();
                          }}
                          className="h-3.5 w-3.5 rounded text-blue-600 cursor-pointer"
                        />
                      </th>
                      <th className="py-2 px-3">Reel Number</th>
                      <th className="py-2 px-3">Product Spec</th>
                      <th className="py-2 px-3">GSM</th>
                      <th className="py-2 px-3">Size</th>
                      <th className="py-2 px-3">Weight</th>
                      <th className="py-2 px-3">Joints</th>
                      <th className="py-2 px-3 text-right">QC Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                    {filteredAvailableReels.map(reel => {
                      const isChecked = selectedReelNos.includes(reel.reelNo);
                      return (
                        <tr
                          key={reel.reelNo}
                          onClick={() => handleToggleReel(reel.reelNo)}
                          className={`cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-blue-50/70 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by row click
                              className="h-3.5 w-3.5 rounded text-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono font-bold">{reel.reelNo}</td>
                          <td className="py-2 px-3 text-[11px] truncate max-w-[150px]">{reel.product}</td>
                          <td className="py-2 px-3">{reel.gsm}</td>
                          <td className="py-2 px-3">{reel.size} cm</td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{reel.weight} kg</td>
                          <td className="py-2 px-3 text-[11px] text-slate-500">{reel.joint} Joints</td>
                          <td className="py-2 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              reel.qcGrade === 'A'
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                            }`}>
                              Grade {reel.qcGrade || 'A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          {/* 5. LIVE PRINTABLE DELIVERY CHALLAN & GATE PASS DOCUMENT PREVIEW */}
          {selectedReelNos.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5 text-slate-900 dark:text-slate-100 relative overflow-hidden text-left">
              
              {/* Paper document top decorative bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>

              {/* Challan Document Header */}
              <div className="border-b-2 border-slate-200 dark:border-slate-800 pb-4 pt-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900 dark:text-white">
                      {COMPANY_CONFIG?.name || 'SAHEB PAPER PVT. LTD.'}
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {COMPANY_CONFIG?.address || 'Survey No. 42/1, NH-8A, Morbi-Wankaner Road, Gujarat - 363642'}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-black font-mono">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{autoSlipNo}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    DELIVERY CHALLAN &amp; GATE PASS (LIVE PREVIEW)
                  </div>
                </div>
              </div>

              {/* Consignee & Vehicle Information Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    Billed / Consigned To:
                  </span>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedParty ? selectedParty.name : <span className="text-amber-600 font-normal italic">Party not selected yet (Select above)</span>}
                  </div>
                  {selectedParty?.contact && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Contact: {selectedParty.contact}
                    </div>
                  )}
                  {selectedParty?.address && (
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {selectedParty.address}
                    </div>
                  )}
                </div>

                <div className="md:border-l md:border-slate-200 md:dark:border-slate-700 md:pl-4 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    Dispatch &amp; Vehicle Logistics:
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Vehicle / Truck No:</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white uppercase">
                      {slipVehicleId || <span className="text-amber-600 font-normal italic">Not specified</span>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Dispatch Date:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{slipDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Gate Pass Clearance:</span>
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3 inline-block" />
                      Gate Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Selected Reels Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Loaded Reels Manifest ({selectedReelNos.length} Items)
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReelNos([]);
                      playBeep();
                    }}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear All ({selectedReelNos.length})</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-[340px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-wider z-10 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Reel Number</th>
                        <th className="py-2.5 px-3">Product Description</th>
                        <th className="py-2.5 px-3 text-center">GSM</th>
                        <th className="py-2.5 px-3 text-center">Size (cm)</th>
                        <th className="py-2.5 px-3 text-center">Ply</th>
                        <th className="py-2.5 px-3 text-center">Joints</th>
                        <th className="py-2.5 px-3 text-right">Net Weight</th>
                        <th className="py-2.5 px-3 text-center w-12">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {selectedReelNos.map((reelNo, index) => {
                        const r = availableReels.find(x => x.reelNo === reelNo) || reels.find(x => x.reelNo === reelNo);
                        const weightVal = r?.weight || 0;
                        return (
                          <tr key={reelNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{index + 1}</td>
                            <td className="py-2 px-3 font-mono font-black text-slate-900 dark:text-white">{reelNo}</td>
                            <td className="py-2 px-3 text-[11px] text-slate-700 dark:text-slate-300">
                              {r?.product || 'Tissue Paper'}
                            </td>
                            <td className="py-2 px-3 text-center font-mono">{r?.gsm || '-'}</td>
                            <td className="py-2 px-3 text-center font-mono">{r?.size || '-'}</td>
                            <td className="py-2 px-3 text-center font-mono">{r?.ply || 1}P</td>
                            <td className="py-2 px-3 text-center text-[11px] text-slate-500">{r?.joint ?? 0}</td>
                            <td className="py-2 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                              {weightVal.toLocaleString()} kg
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReelNos(prev => prev.filter(no => no !== reelNo));
                                  playBeep();
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition"
                                title="Remove Reel from Challan"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Spec Group Breakdown Chips */}
              {selectedSpecSummary.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300 tracking-wider mr-1">
                    Spec Summary:
                  </span>
                  {selectedSpecSummary.map(item => (
                    <span
                      key={item.label}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-2xs"
                    >
                      {item.label} &rarr; <span className="text-primary dark:text-blue-400 font-mono font-black">{item.count} Reels</span> ({item.weight.toLocaleString()} kg)
                    </span>
                  ))}
                </div>
              )}

              {/* Grand Totals & Signature Block */}
              <div className="border-t-2 border-slate-200 dark:border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Quantity</span>
                    <span className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
                      {selectedReelNos.length} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Reels</span>
                    </span>
                  </div>
                  <div className="h-9 w-px bg-slate-200 dark:bg-slate-700"></div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Net Weight</span>
                    <div className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {totalSelectedWeight.toLocaleString()} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">KG</span>
                      <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 ml-1.5">({(totalSelectedWeight / 1000).toFixed(3)} MT)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-2.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Driver / Gate Clearance</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 block">Gate Verified</span>
                  </div>
                  <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-2.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Authorized Signatory</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 block">{COMPANY_CONFIG?.name || 'SAHEB PAPER PVT. LTD.'}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Challan Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const tempDraftSlip: PackingSlip = {
                      id: `DRAFT-${Date.now()}`,
                      slipNo: autoSlipNo,
                      date: slipDate,
                      partyId: slipPartyId,
                      vehicleId: slipVehicleId || 'GJ01EP1234',
                      reelNos: selectedReelNos,
                      driverSignature: 'Gate Verified',
                      receiverSignature: receiverSig || 'Authorized Consignee',
                      status: 'DRAFT',
                      dispatchDate: slipDate,
                    };
                    setViewingSlip(tempDraftSlip);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Full Printable PDF Preview</span>
                </button>

                <button
                  type="submit"
                  disabled={isViewer}
                  title={isViewer ? 'Viewer Mode: Confirming dispatch is locked (Read-Only)' : 'Confirm Dispatch & Issue Gate Pass'}
                  className={`w-full sm:w-auto py-3 px-6 text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl font-black transition ${
                    isViewer
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                      : 'btn-primary-gradient cursor-pointer shadow-md'
                  }`}
                >
                  {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Truck className="h-4 w-4" />}
                  <span>{isViewer ? 'Confirm Dispatch & Issue Gate Pass (Locked)' : 'Confirm Dispatch & Issue Gate Pass'}</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl space-y-2">
              <ScanBarcode className="h-8 w-8 text-slate-400 mx-auto" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                No Reels Selected for Challan
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Scan reels with a barcode gun, use the QR camera, or click on reels above to add them to this delivery challan.
              </p>
            </div>
          )}

        </form>
      )}

      {/* 3. TAB: Packing Slips & Challans List (Modern Filterable Ledger) */}
      {activeTab === 'slips_list' && (() => {
        const timeframeSlips = slips.filter(s => isDateInTimeframe(s.date, selectedDate, timeframe));
        const timeframeLabel = timeframe === 'day' ? `For Day (${selectedDate})` : timeframe === 'week' ? 'Weekly Window' : timeframe === 'month' ? `Month (${selectedDate.substring(0, 7)})` : 'All-Time';
        const timeframeDispatched = timeframeSlips.filter(s => s.status !== 'DRAFT').length;
        const timeframeDrafts = timeframeSlips.filter(s => s.status === 'DRAFT').length;
        const timeframeLinkedReels = timeframeSlips.reduce((sum, s) => sum + (s.reelNos ? s.reelNos.length : 0), 0);

        return (
          <div className="space-y-4 text-left">
            
            {/* Top KPI Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Challans</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{timeframeSlips.length}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5 truncate">{timeframeLabel}</span>
              </div>

              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Dispatched Slips</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {timeframeDispatched}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Finalized &amp; Decremented</span>
              </div>

              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Pending Drafts</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {timeframeDrafts}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Awaiting Confirmation</span>
              </div>

              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Total Linked Reels</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {timeframeLinkedReels}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Dispatched Reel Units</span>
              </div>
            </div>

            {/* Filter Toolbar Container */}
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            
            {/* Header Title + Fast Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Registered Delivery Challans
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Showing {filteredSlips.length} of {slips.length} total slips
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={slipSearchQuery}
                  onChange={e => setSlipSearchQuery(e.target.value)}
                  placeholder="Search Challan No, Customer, Vehicle, Date..."
                  className="w-full py-2 pl-9 pr-7 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none dark:text-white"
                />
                {slipSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSlipSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Row: Status Chips & Customer Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
              
              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  Status:
                </span>
                
                <button
                  type="button"
                  onClick={() => setSlipStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                    slipStatusFilter === 'ALL'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All ({slips.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSlipStatusFilter('CONFIRMED')}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
                    slipStatusFilter === 'CONFIRMED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  <span>Dispatched ({slips.filter(s => s.status !== 'DRAFT').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSlipStatusFilter('DRAFT')}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
                    slipStatusFilter === 'DRAFT'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                  <span>Drafts ({slips.filter(s => s.status === 'DRAFT').length})</span>
                </button>
              </div>

              {/* Customer / Party Dropdown Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Party:</span>
                <select
                  value={slipPartyFilter}
                  onChange={e => setSlipPartyFilter(e.target.value)}
                  className="py-1 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Parties ({parties.length})</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                {(slipStatusFilter !== 'ALL' || slipPartyFilter !== 'ALL' || slipSearchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSlipStatusFilter('ALL');
                      setSlipPartyFilter('ALL');
                      setSlipSearchQuery('');
                    }}
                    className="px-2.5 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

            </div>

            {/* Table / Empty state */}
            {filteredSlips.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500">No packing slips match your current filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSlipStatusFilter('ALL');
                    setSlipPartyFilter('ALL');
                    setSlipSearchQuery('');
                  }}
                  className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div>
                {/* Desktop/Tablet High Density Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
                        <th className="py-3 px-3">Challan Number</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Party / Customer</th>
                        <th className="py-3 px-3">Vehicle No</th>
                        <th className="py-3 px-3">Linked Reels</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {filteredSlips
                        .slice()
                        .sort((a, b) => (b.slipNo || '').localeCompare(a.slipNo || '', undefined, { numeric: true }))
                        .map(slip => {
                          const partyObj = parties.find(p => p.id === slip.partyId);
                          const vehicleObj = vehicles.find(v => v.id === slip.vehicleId || v.vehicleNo === slip.vehicleId);
                          const vehicleDisplay = vehicleObj ? vehicleObj.vehicleNo : (slip.vehicleId || 'N/A');
                          
                          // Calculate Total Weight for slip
                          const linkedReels = reels.filter(r => slip.reelNos.includes(r.reelNo));
                          const totalWeightKg = linkedReels.reduce((sum, r) => sum + (r.weight || 0), 0);

                          return (
                            <tr key={slip.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                              <td className="py-3 px-3">
                                <button
                                  type="button"
                                  onClick={() => setViewingSlip(slip)}
                                  className="font-mono font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer flex items-center gap-1.5"
                                >
                                  <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                  <span>{slip.slipNo}</span>
                                </button>
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">{slip.date}</td>
                              <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                                {partyObj?.name || 'Walk-in Customer'}
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono">
                                  {vehicleDisplay}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {slip.reelNos.length} reels
                                </span>
                                {totalWeightKg > 0 && (
                                  <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                                    ({totalWeightKg.toLocaleString()} kg)
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  slip.status === 'DRAFT'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${slip.status === 'DRAFT' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                  <span>{slip.status === 'DRAFT' ? 'Draft Gate Pass' : 'Dispatched'}</span>
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5 relative">
                                    {/* 1. Preview Receipt Icon Only */}
                                    <button
                                      type="button"
                                      onClick={() => setViewingSlip(slip)}
                                      title="Preview Receipt & Gate Pass"
                                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 rounded-lg transition cursor-pointer border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shadow-2xs"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>

                                    {slip.status === 'DRAFT' ? (
                                      <button
                                        type="button"
                                        disabled={isViewer}
                                        onClick={() => handleConfirmDispatch(slip.id)}
                                        title={isViewer ? 'Viewer Mode: Dispatch confirmation is locked (Read-Only)' : 'Confirm Dispatch'}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 ${
                                          isViewer
                                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                                            : 'bg-[#008163] hover:bg-[#006e54] text-white shadow-xs shadow-[#008163]/25 cursor-pointer'
                                        }`}
                                      >
                                        {isViewer ? <Lock className="h-3 w-3 text-amber-500" /> : <Check className="h-3 w-3" />}
                                        <span>Confirm</span>
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleExportExcel(slip)}
                                          title="Export Excel (.xlsx)"
                                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900/80 cursor-pointer transition flex items-center justify-center"
                                        >
                                          <FileSpreadsheet className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isViewer) return;
                                            handlePrintSlip(slip);
                                          }}
                                          disabled={isViewer}
                                          title={isViewer ? "Printing locked for Viewer (Read-Only)" : "Print Official Dispatch Receipt & Gate Pass"}
                                          className={`p-1.5 rounded-lg border flex items-center justify-center transition ${
                                            isViewer
                                              ? 'opacity-50 cursor-not-allowed text-slate-400 border-slate-200 dark:border-slate-800'
                                              : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-900/80 cursor-pointer'
                                          }`}
                                        >
                                          {isViewer ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : <Printer className="h-3.5 w-3.5" />}
                                        </button>
                                      </>
                                    )}

                                    {/* 2. Three-Dots Menu Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (openMenuSlipId === slip.id) {
                                          setOpenMenuSlipId(null);
                                          setMenuPos(null);
                                        } else {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const spaceBelow = window.innerHeight - rect.bottom;
                                          const openUp = spaceBelow < 120;
                                          setMenuPos({
                                            top: openUp ? rect.top - 82 : rect.bottom + 6,
                                            right: Math.max(12, window.innerWidth - rect.right),
                                          });
                                          setOpenMenuSlipId(slip.id);
                                        }
                                      }}
                                      title="Challan Actions"
                                      className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                                        openMenuSlipId === slip.id
                                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 shadow-xs'
                                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive Cards */}
                <div className="block md:hidden space-y-2.5">
                  {filteredSlips
                    .slice()
                    .sort((a, b) => (b.slipNo || '').localeCompare(a.slipNo || '', undefined, { numeric: true }))
                    .map(slip => {
                      const partyObj = parties.find(p => p.id === slip.partyId);
                      const vehicleObj = vehicles.find(v => v.id === slip.vehicleId || v.vehicleNo === slip.vehicleId);
                      const vehicleDisplay = vehicleObj ? vehicleObj.vehicleNo : (slip.vehicleId || 'N/A');
                      const linkedReels = reels.filter(r => slip.reelNos.includes(r.reelNo));
                      const totalWeightKg = linkedReels.reduce((sum, r) => sum + (r.weight || 0), 0);

                      return (
                        <div
                          key={slip.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5 text-xs text-left shadow-2xs"
                        >
                          <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
                            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-xs">
                              {slip.slipNo}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              slip.status === 'DRAFT'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${slip.status === 'DRAFT' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                              <span>{slip.status}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="font-bold text-slate-400 block uppercase text-[8px]">Party</span>
                              <span className="font-bold text-slate-900 dark:text-white truncate block">{partyObj?.name || 'Walk-in'}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 block uppercase text-[8px]">Vehicle</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{vehicleDisplay}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 block uppercase text-[8px]">Date</span>
                              <span className="font-semibold text-slate-600 dark:text-slate-400">{slip.date}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 block uppercase text-[8px]">Reels &amp; Weight</span>
                              <span className="font-bold text-slate-800 dark:text-white">{slip.reelNos.length} reels ({totalWeightKg} kg)</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t dark:border-slate-800 flex items-center justify-end gap-1.5 relative">
                            {/* Preview Receipt Icon */}
                            <button
                              type="button"
                              onClick={() => setViewingSlip(slip)}
                              title="Preview Receipt & Gate Pass"
                              className="p-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 rounded-xl border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shadow-2xs"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {slip.status === 'DRAFT' ? (
                              <button
                                type="button"
                                disabled={isViewer}
                                onClick={() => handleConfirmDispatch(slip.id)}
                                title={isViewer ? 'Viewer Mode: Dispatch confirmation is locked (Read-Only)' : 'Confirm Dispatch'}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 ${
                                  isViewer
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                                    : 'bg-[#008163] hover:bg-[#006e54] text-white shadow-xs shadow-[#008163]/25 flex items-center gap-1 cursor-pointer'
                                }`}
                              >
                                {isViewer ? <Lock className="h-3 w-3 text-amber-500" /> : <Check className="h-3 w-3" />}
                                <span>Confirm</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleExportExcel(slip)}
                                  className="p-1.5 text-emerald-600 rounded-lg border border-emerald-200 dark:border-emerald-800"
                                >
                                  <FileSpreadsheet className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isViewer) return;
                                    handlePrintSlip(slip);
                                  }}
                                  disabled={isViewer}
                                  title={isViewer ? "Printing locked for Viewer (Read-Only)" : "Print Official Dispatch Receipt & Gate Pass"}
                                  className={`p-1.5 rounded-lg border flex items-center justify-center transition ${
                                    isViewer
                                      ? 'opacity-50 cursor-not-allowed text-slate-400 border-slate-200 dark:border-slate-800'
                                      : 'text-blue-600 border-blue-200 dark:border-blue-800 cursor-pointer'
                                  }`}
                                >
                                  {isViewer ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : <Printer className="h-3.5 w-3.5" />}
                                </button>
                              </>
                            )}

                            {/* Three-Dots Menu Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openMenuSlipId === slip.id) {
                                  setOpenMenuSlipId(null);
                                  setMenuPos(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const spaceBelow = window.innerHeight - rect.bottom;
                                  const openUp = spaceBelow < 120;
                                  setMenuPos({
                                    top: openUp ? rect.top - 82 : rect.bottom + 6,
                                    right: Math.max(12, window.innerWidth - rect.right),
                                  });
                                  setOpenMenuSlipId(slip.id);
                                }
                              }}
                              title="Challan Actions"
                              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Universal Portal Floating Dropdown Menu */}
                {openMenuSlipId && menuPos && (() => {
                  const currentSlip = slips.find(s => s.id === openMenuSlipId);
                  if (!currentSlip) return null;

                  return createPortal(
                    <>
                      {/* Click Outside Overlay */}
                      <div
                        className="fixed inset-0 z-[9998]"
                        onClick={() => {
                          setOpenMenuSlipId(null);
                          setMenuPos(null);
                        }}
                      />
                      {/* Floating Dropdown - Exactly 2 Actions: Edit Challan & Delete Challan */}
                      <div
                        style={{
                          position: 'fixed',
                          top: `${menuPos.top}px`,
                          right: `${menuPos.right}px`,
                        }}
                        className="w-38 bg-white dark:bg-[#131d38] border border-slate-200 dark:border-[#203058] rounded-2xl shadow-2xl z-[9999] p-1.5 space-y-1 animate-in fade-in zoom-in-95 text-left select-none font-sans"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={isViewer}
                          onClick={() => {
                            if (isViewer) return;
                            setOpenMenuSlipId(null);
                            setMenuPos(null);
                            handlePrintSlip(currentSlip);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                            isViewer
                              ? 'opacity-50 cursor-not-allowed text-slate-400'
                              : 'text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer'
                          }`}
                          title={isViewer ? "Printing locked for Viewer (Read-Only)" : undefined}
                        >
                          {isViewer ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : <Printer className="h-3.5 w-3.5 text-blue-500" />}
                          <span>{isViewer ? 'Print Receipt (Locked)' : 'Print Receipt & Gate Pass'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuSlipId(null);
                            setMenuPos(null);
                            handleOpenEditSlip(currentSlip);
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 rounded-xl transition cursor-pointer flex items-center gap-2"
                        >
                          <Pencil className="h-3.5 w-3.5 text-amber-500" />
                          <span>Edit Challan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuSlipId(null);
                            setMenuPos(null);
                            handleDeleteSlip(currentSlip);
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition cursor-pointer flex items-center gap-2"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          <span>Delete Challan</span>
                        </button>
                      </div>
                    </>,
                    document.body
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      );
    })()}

      {/* 5. EDIT DELIVERY CHALLAN MODAL */}
      {editingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Edit Delivery Challan
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                      {editingSlip.slipNo}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      editingSlip.status === 'DRAFT'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                    }`}>
                      {editingSlip.status === 'DRAFT' ? 'Draft Gate Pass' : 'Dispatched'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlip(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editModalError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-800 font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{editModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditSlip} className="space-y-4">
              {/* Form Fields: Date, Customer, Vehicle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Challan Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Party / Customer
                  </label>
                  <select
                    required
                    value={editPartyId}
                    onChange={e => setEditPartyId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="">Select Customer...</option>
                    {parties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    required
                    value={editVehicleId}
                    onChange={e => setEditVehicleId(e.target.value.toUpperCase())}
                    placeholder="e.g. MH-04-ZZ-9012"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                  />
                </div>
              </div>

              {/* Linked Reels Section */}
              <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Linked Reels in Challan
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Total: <strong className="text-slate-900 dark:text-white">{editReelNos.length} reels</strong> ({reels.filter(r => editReelNos.includes(r.reelNo)).reduce((sum, r) => sum + (r.weight || 0), 0).toLocaleString()} kg)
                    </p>
                  </div>
                </div>

                {/* Add Reel Input & Stock Picker trigger inside Modal */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={editReelInput}
                      onChange={e => setEditReelInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = editReelInput.trim();
                          if (!val) {
                            handleOpenEditStockPicker();
                            return;
                          }
                          const found = reels.find(r => r.reelNo.toLowerCase() === val.toLowerCase());
                          if (found) {
                            handleAddReelToEdit(found.reelNo);
                          } else {
                            handleOpenEditStockPicker();
                          }
                        }
                      }}
                      placeholder="Type or scan reel number (e.g. 260500586)..."
                      className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-[#008163]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const val = editReelInput.trim();
                      if (val) {
                        const found = reels.find(r => r.reelNo.toLowerCase() === val.toLowerCase());
                        if (found) {
                          handleAddReelToEdit(found.reelNo);
                          return;
                        }
                      }
                      handleOpenEditStockPicker();
                    }}
                    className="px-4 py-2.5 bg-[#008163] hover:bg-[#006e54] text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer shadow-md shadow-[#008163]/25 flex items-center justify-center gap-1.5 transition"
                  >
                    <PackageCheck className="h-4 w-4" />
                    <span>+ Add Reel (From Stock)</span>
                  </button>
                </div>

                {/* List of currently linked reels */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {editReelNos.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 font-medium space-y-2">
                      <p>No reels currently linked to this challan.</p>
                      <button
                        type="button"
                        onClick={handleOpenEditStockPicker}
                        className="px-3 py-1.5 bg-[#008163]/10 hover:bg-[#008163]/20 text-[#008163] dark:text-emerald-400 rounded-lg text-xs font-bold cursor-pointer transition inline-flex items-center gap-1"
                      >
                        <PackageCheck className="h-3.5 w-3.5" />
                        <span>Open In-Stock Reels Picker</span>
                      </button>
                    </div>
                  ) : (
                    editReelNos.map(rNo => {
                      const reelObj = reels.find(r => r.reelNo === rNo);
                      return (
                        <div key={rNo} className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-slate-900 dark:text-white">{rNo}</span>
                            {reelObj && (
                              <span className="text-[11px] text-slate-500 font-semibold">
                                {reelObj.product} &bull; {reelObj.gsm} GSM &bull; {reelObj.size} cm &bull; <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{reelObj.weight} kg</strong>
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveReelFromEdit(rNo)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                            title="Remove reel from challan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSlip(null)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isViewer}
                  title={isViewer ? 'Viewer Mode: Saving challan changes is locked (Read-Only)' : 'Save Challan Changes'}
                  className={`px-6 py-2.5 font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center gap-1.5 ${
                    isViewer
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                      : 'bg-[#008163] hover:bg-[#006e54] text-white shadow-md shadow-[#008163]/25 cursor-pointer'
                  }`}
                >
                  {isViewer ? <Lock className="h-4 w-4 text-amber-500" /> : <Check className="h-4 w-4" />}
                  <span>{isViewer ? 'Save Challan Changes (Locked)' : 'Save Challan Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. IN-STOCK REELS SELECTION MODAL (POPUP WINDOW - EXACT IMAGE 2 RICH CHIP / PILL FILTERS) */}
      {isEditStockPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-left max-h-[94vh] flex flex-col animate-in zoom-in-95">
            {/* Header: Title, Tally, Search & View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Warehouse Stock Reels
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 text-[11px] font-black font-mono">
                    {editPickerSelectedNos.length} Selected ({reels.filter(r => editPickerSelectedNos.includes(r.reelNo)).reduce((s, r) => s + (r.weight || 0), 0).toLocaleString()} kg)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Showing {filteredAvailableReelsForEdit.length} of {availableReelsForEdit.length} available reels
                </p>
              </div>

              {/* Right Side Search Bar & Layout Switcher & Close */}
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editPickerSearch}
                    onChange={e => setEditPickerSearch(e.target.value)}
                    placeholder="Search No, GSM, Size..."
                    className="w-full py-1.5 pl-8 pr-7 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none dark:text-white"
                  />
                  {editPickerSearch && (
                    <button
                      type="button"
                      onClick={() => setEditPickerSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* View Switcher: Grid vs Table */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditPickerViewMode('grid')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      editPickerViewMode === 'grid'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="Card Grid View"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPickerViewMode('table')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      editPickerViewMode === 'table'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="Compact Table View"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditStockPickerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ml-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Rapid Barcode Gun / Keyboard Input Bar */}
            <div className="flex gap-1.5 relative">
              <div className="relative w-full">
                <ScanBarcode className="h-4 w-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={editPickerBarcodeInput}
                  onChange={e => setEditPickerBarcodeInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handlePickerBarcodeSubmit(e);
                    }
                  }}
                  placeholder="Scan / Type Reel Number (e.g. 1048)..."
                  className="w-full py-2 pl-8 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none dark:text-white font-mono placeholder:font-sans placeholder:font-normal"
                />
              </div>
              <button
                type="button"
                onClick={() => handlePickerBarcodeSubmit()}
                className="px-4 py-2 bg-[#008163] hover:bg-[#006e54] text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer shadow-sm flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Reel</span>
              </button>
            </div>

            {/* Rich Pill Filters (BATCH SELECT, PRODUCT, GRADE, GSM, SIZE, PLY) */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              
              {/* Row A: Quick 1-Click Batch Actions */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  Batch Select:
                </span>
                
                <button
                  type="button"
                  onClick={() => handleSelectAllPickerReels(filteredAvailableReelsForEdit)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-extrabold border border-blue-200 dark:border-blue-800 cursor-pointer transition flex items-center gap-1"
                >
                  <CheckSquare className="h-3 w-3" />
                  <span>Select All Filtered ({filteredAvailableReelsForEdit.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPickerTopN(5, filteredAvailableReelsForEdit)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-extrabold cursor-pointer transition"
                >
                  + 5 Reels
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPickerTopN(10, filteredAvailableReelsForEdit)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-extrabold cursor-pointer transition"
                >
                  + 10 Reels
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPickerTopN(20, filteredAvailableReelsForEdit)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-extrabold cursor-pointer transition"
                >
                  + 20 Reels
                </button>

                {editPickerSelectedNos.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeselectAllPickerReels}
                    className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-extrabold border border-red-200 dark:border-red-800 cursor-pointer transition ml-auto flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    <span>Clear Selection</span>
                  </button>
                )}
              </div>

              {/* Row B: Product & Grade Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  Product:
                </span>

                <button
                  type="button"
                  onClick={() => setEditPickerProductFilter('ALL')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                    editPickerProductFilter === 'ALL'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All Products ({availableReelsForEdit.length})
                </button>

                {editPickerUniqueProducts.map(prod => {
                  const count = availableReelsForEdit.filter(r => r.product === prod).length;
                  return (
                    <button
                      key={prod}
                      type="button"
                      onClick={() => setEditPickerProductFilter(prod)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                        editPickerProductFilter === prod
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {prod} ({count})
                    </button>
                  );
                })}

                {/* Grade Filter Pill Group (All, Grade A, Grade B) */}
                <div className="flex items-center gap-1 ml-auto bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] font-black text-slate-400 uppercase px-1">Grade:</span>
                  <button
                    type="button"
                    onClick={() => setEditPickerGradeFilter('ALL')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition ${
                      editPickerGradeFilter === 'ALL'
                        ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPickerGradeFilter('A')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition ${
                      editPickerGradeFilter === 'A'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    Grade A
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPickerGradeFilter('B')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition ${
                      editPickerGradeFilter === 'B'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    }`}
                  >
                    Grade B Only
                  </button>
                </div>
              </div>

              {/* Row C: GSM Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  GSM:
                </span>

                <button
                  type="button"
                  onClick={() => setEditPickerGsmFilter('ALL')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                    editPickerGsmFilter === 'ALL'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All GSM
                </button>

                {editPickerUniqueGsms.map(gsm => {
                  const count = availableReelsForEdit.filter(r => (editPickerProductFilter === 'ALL' || r.product === editPickerProductFilter) && r.gsm === gsm).length;
                  return (
                    <button
                      key={gsm}
                      type="button"
                      onClick={() => setEditPickerGsmFilter(gsm)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                        editPickerGsmFilter === gsm
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {gsm} GSM ({count})
                    </button>
                  );
                })}
              </div>

              {/* Row D: Size Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  Size:
                </span>

                <button
                  type="button"
                  onClick={() => setEditPickerSizeFilter('ALL')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                    editPickerSizeFilter === 'ALL'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All Sizes
                </button>

                {editPickerUniqueSizes.map(sz => {
                  const count = availableReelsForEdit.filter(r =>
                    (editPickerProductFilter === 'ALL' || r.product === editPickerProductFilter) &&
                    (editPickerGsmFilter === 'ALL' || r.gsm === editPickerGsmFilter) &&
                    r.size === sz
                  ).length;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setEditPickerSizeFilter(sz)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                        editPickerSizeFilter === sz
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {sz} cm ({count})
                    </button>
                  );
                })}
              </div>

              {/* Row E: Ply Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  Ply:
                </span>

                <button
                  type="button"
                  onClick={() => setEditPickerPlyFilter('ALL')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                    editPickerPlyFilter === 'ALL'
                      ? 'bg-amber-900 dark:bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All Ply
                </button>

                {editPickerUniquePlys.map(pVal => {
                  const count = availableReelsForEdit.filter(r =>
                    (editPickerProductFilter === 'ALL' || r.product === editPickerProductFilter) &&
                    (editPickerGsmFilter === 'ALL' || r.gsm === editPickerGsmFilter) &&
                    (editPickerSizeFilter === 'ALL' || r.size === editPickerSizeFilter) &&
                    r.ply === pVal
                  ).length;
                  return (
                    <button
                      key={pVal}
                      type="button"
                      onClick={() => setEditPickerPlyFilter(pVal)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                        editPickerPlyFilter === pVal
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {pVal} Ply ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reels Grid / Table Scroll Area */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl max-h-80 min-h-[220px]">
              {filteredAvailableReelsForEdit.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Package className="h-10 w-10 mx-auto opacity-40 text-slate-400" />
                  <p className="text-xs font-bold">No in-stock reels match your search/filter criteria.</p>
                  <p className="text-[10px] text-slate-500">Try clearing your filters or check if reels are already in challans.</p>
                </div>
              ) : editPickerViewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-3">
                  {filteredAvailableReelsForEdit.map(reel => {
                    const isSelected = editPickerSelectedNos.includes(reel.reelNo);
                    return (
                      <div
                        key={reel.reelNo}
                        onClick={() => handleTogglePickerReel(reel.reelNo)}
                        className={`p-3 rounded-xl border transition cursor-pointer select-none relative flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-50/80 dark:bg-[#008163]/15 border-[#008163] shadow-xs'
                            : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-md transition ${isSelected ? 'bg-[#008163] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                              {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                            </div>
                            <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                              {reel.reelNo}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono font-black text-xs">
                            {reel.weight} kg
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-[10px] pt-1.5 border-t border-slate-100 dark:border-slate-800/80 font-semibold text-slate-600 dark:text-slate-400">
                          <div>
                            <span className="text-[8px] text-slate-400 uppercase block font-bold">Product</span>
                            <span className="truncate block font-bold text-slate-800 dark:text-slate-200">{reel.product}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 uppercase block font-bold">GSM / Size</span>
                            <span>{reel.gsm}G &bull; {reel.size}cm</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-slate-400 uppercase block font-bold">QC Grade</span>
                            <span className={`font-black ${reel.qcGrade === 'B' ? 'text-amber-600' : 'text-[#008163] dark:text-emerald-400'}`}>
                              Grade {reel.qcGrade || 'A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* High-Density Compact Table View */
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 sticky top-0 bg-white dark:bg-surface-dark z-10">
                      <th className="py-2.5 px-3 w-10">Select</th>
                      <th className="py-2.5 px-3">Reel Number</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">GSM</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Ply</th>
                      <th className="py-2.5 px-3">Weight</th>
                      <th className="py-2.5 px-3 text-right">QC Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredAvailableReelsForEdit.map(reel => {
                      const isSelected = editPickerSelectedNos.includes(reel.reelNo);
                      return (
                        <tr
                          key={reel.reelNo}
                          onClick={() => handleTogglePickerReel(reel.reelNo)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-50/80 dark:bg-[#008163]/20'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                          }`}
                        >
                          <td className="py-2 px-3">
                            <div className={`p-1 w-6 h-6 rounded-md flex items-center justify-center transition ${isSelected ? 'bg-[#008163] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                              {isSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">{reel.reelNo}</td>
                          <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">{reel.product}</td>
                          <td className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-400">{reel.gsm} GSM</td>
                          <td className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-400">{reel.size} cm</td>
                          <td className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-400">{reel.ply} Ply</td>
                          <td className="py-2 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400">{reel.weight} kg</td>
                          <td className="py-2 px-3 text-right font-black">
                            <span className={reel.qcGrade === 'B' ? 'text-amber-600' : 'text-[#008163] dark:text-emerald-400'}>
                              Grade {reel.qcGrade || 'A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Selected: <strong className="text-[#008163] dark:text-emerald-400 font-mono text-sm">{editPickerSelectedNos.length} reels</strong>
                {editPickerSelectedNos.length > 0 && (
                  <span className="text-slate-500 font-mono ml-2">
                    ({reels.filter(r => editPickerSelectedNos.includes(r.reelNo)).reduce((s, r) => s + (r.weight || 0), 0).toLocaleString()} kg)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditStockPickerOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddFromStockPicker}
                  disabled={editPickerSelectedNos.length === 0}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-md ${
                    editPickerSelectedNos.length === 0
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-[#008163] hover:bg-[#006e54] text-white shadow-[#008163]/25'
                  }`}
                >
                  <Check className="h-4 w-4" />
                  <span>Add Selected ({editPickerSelectedNos.length}) to Challan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: Dispatched Reels Archive & Vault (Test Section) */}
      {activeTab === 'dispatched_vault' && (
        <DispatchedReelsVault
          reels={reels}
          slips={slips}
          parties={parties}
          vehicles={vehicles}
          onViewChallan={(slip) => setViewingSlip(slip)}
          onPrintChallan={(slip) => handlePrintSlip(slip)}
        />
      )}

      {/* 4. TAB: Mobile QR Scanner (Mobile Only) */}
      {activeTab === 'qr_scanner' && (
        <div className="md:hidden w-full pt-1">
          <QRScannerView />
        </div>
      )}

      {/* Challan View Detail Modal / Printable Receipt (Multi-Page & Spec Grouped) */}
      {(viewingSlip || directPrintSlip) && (() => {
        const activeReceiptSlip = viewingSlip || directPrintSlip;
        if (!activeReceiptSlip) return null;

        const isDirectPrint = !viewingSlip && !!directPrintSlip;
        const partyObj = parties.find(p => p.id === activeReceiptSlip.partyId);
        const vehicleObj = vehicles.find(v => v.id === activeReceiptSlip.vehicleId || v.vehicleNo === activeReceiptSlip.vehicleId);
        const vehicleDisplay = vehicleObj ? vehicleObj.vehicleNo : (activeReceiptSlip.vehicleId || 'GJ01EP1234');
        
        // Match reels from state or getReels()
        let linkedReels = reels.filter(r => (activeReceiptSlip.reelNos || []).includes(r.reelNo));
        if (linkedReels.length === 0) {
          const allReels = getReels();
          linkedReels = allReels.filter(r => (activeReceiptSlip.reelNos || []).includes(r.reelNo));
          if (linkedReels.length === 0 && allReels.length > 0) {
            linkedReels = allReels.slice(0, 4);
          }
        }

        // Grouping for Product Summary table & Spec-wise Grouping
        const specMap: { [key: string]: {
          key: string;
          product: string;
          gsm: number;
          size: number;
          ply: number;
          reels: Reel[];
          totalWeight: number;
        } } = {};

        linkedReels.forEach(r => {
          const key = `${r.product || 'Tissue Paper'}__${r.gsm}__${r.size}__${r.ply || 1}`;
          if (!specMap[key]) {
            specMap[key] = {
              key,
              product: r.product || 'Tissue Paper',
              gsm: r.gsm,
              size: r.size,
              ply: r.ply || 1,
              reels: [],
              totalWeight: 0,
            };
          }
          specMap[key].reels.push(r);
          specMap[key].totalWeight += (r.weight || 0);
        });

        const specGroupsList = Object.values(specMap);
        const grandTotalWeight = linkedReels.reduce((sum, r) => sum + (r.weight || 0), 0);

        // Build flattened items list based on group mode
        type PrintableReelItem = Reel & {
          displayIndex: number;
          isGroupStart: boolean;
          groupLabel: string;
          groupTotalReels: number;
          groupTotalWeight: number;
        };

        const sortedReelItems: PrintableReelItem[] = [];
        let runningSr = 0;

        if (receiptGroupMode === 'grouped') {
          specGroupsList.forEach(group => {
            group.reels.forEach((reel, idxInGroup) => {
              runningSr += 1;
              sortedReelItems.push({
                ...reel,
                displayIndex: runningSr,
                isGroupStart: idxInGroup === 0,
                groupLabel: `${group.product} • ${group.gsm} GSM • ${group.size} CM • ${group.ply} PLY`,
                groupTotalReels: group.reels.length,
                groupTotalWeight: group.totalWeight,
              });
            });
          });
        } else {
          linkedReels.forEach((reel, idx) => {
            sortedReelItems.push({
              ...reel,
              displayIndex: idx + 1,
              isGroupStart: false,
              groupLabel: '',
              groupTotalReels: 0,
              groupTotalWeight: 0,
            });
          });
        }

        // 20 reels per page for clean A4 printing without overflow
        const REELS_PER_PAGE = 20;
        const totalPages = Math.max(1, Math.ceil(sortedReelItems.length / REELS_PER_PAGE));

        const pages: PrintableReelItem[][] = [];
        for (let p = 0; p < totalPages; p++) {
          pages.push(sortedReelItems.slice(p * REELS_PER_PAGE, (p + 1) * REELS_PER_PAGE));
        }

        // Active page for on-screen paged view
        const currentActivePage = Math.min(Math.max(1, receiptPage), totalPages);

        return createPortal(
          <div
            id="printable-receipt-modal"
            className={`${
              isDirectPrint
                ? 'hidden print:block print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:z-auto'
                : 'fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-1 sm:p-4 overflow-y-auto overscroll-contain print:static print:block print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:z-auto'
            }`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewingSlip(null);
            }}
          >
            <div
              className={`bg-white text-slate-900 ${
                isDirectPrint ? '' : 'rounded-2xl sm:rounded-3xl max-w-4xl w-full p-2 sm:p-6 space-y-3 sm:space-y-4 shadow-2xl my-auto relative'
              } print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 print:rounded-none print:space-y-0 print:block print:overflow-visible`}
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Floating Top-Right Close Button (Screen Preview Mode Only) */}
              {!isDirectPrint && (
                <button
                  type="button"
                  onClick={() => setViewingSlip(null)}
                  className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition cursor-pointer z-30 print:hidden shadow-xs"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Modal Top Toolbar (Screen Preview Mode Only) */}
              {!isDirectPrint && (
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 sm:gap-3 border-b border-slate-200 pb-3 pr-8 sm:pr-10 print:hidden">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600">
                      <FileText className="h-4 sm:h-5 w-4 sm:w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                        Official Dispatch Receipt Preview
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">
                        {linkedReels.length} Reels &bull; {grandTotalWeight.toLocaleString()} KG &bull; {totalPages} {totalPages === 1 ? 'Page' : 'Pages (A4 Multi-Page)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {/* Spec Group Toggle */}
                    <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl text-[10px] sm:text-[11px] font-extrabold">
                      <button
                        type="button"
                        onClick={() => setReceiptGroupMode('grouped')}
                        className={`px-2 sm:px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                          receiptGroupMode === 'grouped'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>Group by Spec</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiptGroupMode('sequential')}
                        className={`px-2 sm:px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                          receiptGroupMode === 'sequential'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>List 1..N</span>
                      </button>
                    </div>

                    {/* Multi-page Navigation for Screen Preview */}
                    {totalPages > 1 && (
                      <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl text-[10px] sm:text-xs font-bold gap-1">
                        <button
                          type="button"
                          disabled={currentActivePage <= 1}
                          onClick={() => setReceiptPage(p => Math.max(1, p - 1))}
                          className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs hover:bg-slate-50 cursor-pointer"
                        >
                          ◀
                        </button>
                        <span className="px-1 sm:px-2 font-mono text-[10px] sm:text-[11px] font-black text-slate-700">
                          Page {currentActivePage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={currentActivePage >= totalPages}
                          onClick={() => setReceiptPage(p => Math.min(totalPages, p + 1))}
                          className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs hover:bg-slate-50 cursor-pointer"
                        >
                          ▶
                        </button>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      type="button"
                      disabled={isViewer}
                      onClick={handlePrintChallan}
                      title={isViewer ? "Printing locked for Viewer (Read-Only)" : undefined}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 rounded-xl font-bold transition ${
                        isViewer
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                          : 'btn-primary-gradient cursor-pointer'
                      }`}
                    >
                      {isViewer ? <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" /> : <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                      <span>{isViewer ? 'Print (Locked)' : `Print All (${totalPages})`}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PRINTABLE RECEIPT CONTAINER (Multi-Page A4 Sheet Stack) */}
              <div className={`${isDirectPrint ? '' : 'bg-slate-100/60 p-0 sm:p-4 rounded-xl sm:rounded-2xl space-y-4 sm:space-y-6'} print:bg-white print:p-0 print:m-0 print:space-y-0 print:block print:overflow-visible`}>
                {pages.map((pageReels, pageIndex) => {
                  const pageNumber = pageIndex + 1;
                  const isLastPage = pageNumber === totalPages;

                  // In interactive screen preview, if paged mode is active, show only active page (while print still renders all)
                  const isHiddenOnScreen = !isDirectPrint && receiptViewMode === 'paged' && pageNumber !== currentActivePage;

                  return (
                    <div
                      key={pageIndex}
                      className={`${
                        isDirectPrint
                          ? 'flex flex-col justify-between'
                          : 'bg-white p-3 sm:p-7 text-black font-sans shadow-md border border-slate-200 rounded-xl flex flex-col justify-between'
                      } min-h-[268mm] print:min-h-[275mm] print:h-[275mm] print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print-page-break ${
                        isHiddenOnScreen ? 'hidden print:block' : 'block'
                      }`}
                      style={{
                        pageBreakAfter: pageIndex < totalPages - 1 ? 'always' : 'auto',
                        breakAfter: pageIndex < totalPages - 1 ? 'page' : 'auto',
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid',
                      }}
                    >
                      {/* Top Document Content (Header, Metadata, Tables) */}
                      <div className="flex-1">
                        {/* 1. Header Banner & Metadata (Full on Page 1, Compact Continuation on Page 2+) */}
                        {pageIndex === 0 ? (
                          <>
                            <div className="border-b-2 border-black pb-2 mb-2.5 sm:mb-3 text-center">
                              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-black uppercase leading-tight font-heading">
                                SAHEB PAPER PVT. LTD.
                              </h1>
                            </div>

                            {/* 2. Document Title */}
                            <div className="text-center my-1.5 sm:my-2">
                              <h2 className="text-sm sm:text-lg font-black tracking-[0.2em] sm:tracking-[0.25em] text-black uppercase">
                                DISPATCH RECEIPT
                              </h2>
                            </div>

                            {/* 3. Metadata Box */}
                            <div className="border border-slate-300 rounded p-2.5 sm:p-3 text-[10px] sm:text-xs text-left grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-y-2.5 sm:gap-x-3 font-sans bg-white mb-3 sm:mb-3.5">
                              <div>
                                <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">RECEIPT NO</span>
                                <span className="font-bold font-mono text-black text-[11px] sm:text-sm">{activeReceiptSlip.slipNo}</span>
                              </div>
                              <div>
                                <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">DISPATCH DATE</span>
                                <span className="font-bold text-black text-[11px] sm:text-sm">{activeReceiptSlip.date}</span>
                              </div>
                              <div>
                                <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">CUSTOMER / PARTY</span>
                                <span className="font-bold text-black text-[11px] sm:text-sm block truncate">{partyObj?.name || 'Walk-in'}</span>
                                {partyObj?.contact && (
                                  <span className="text-[9px] sm:text-[10px] text-slate-600 font-mono font-bold block truncate">
                                    {partyObj.contact}
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">VEHICLE / TRUCK NO</span>
                                <span className="font-bold font-mono text-black text-[11px] sm:text-sm uppercase block truncate">{vehicleDisplay}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          /* Compact Continuation Header for Page 2+ */
                          <div className="border-b-2 border-black pb-2 mb-3 sm:mb-3.5 text-left flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <h1 className="text-sm sm:text-lg font-black tracking-tight text-black uppercase leading-tight font-heading">
                                SAHEB PAPER PVT. LTD.
                              </h1>
                              <span className="text-[8.5px] sm:text-[9px] font-black uppercase text-slate-700 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded border border-slate-300">
                                DISPATCH RECEIPT (CONTD.)
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 4. DISPATCHED REELS Table (With Spec-Group Headers) */}
                        <div className="mb-3.5 sm:mb-4 text-left">
                          <div className="flex items-center justify-between mb-1.5">
                            <h3 className="text-[11px] sm:text-xs font-black text-black uppercase tracking-wider">
                              DISPATCHED REELS {totalPages > 1 ? `(Part ${pageNumber} of ${totalPages})` : ''}
                            </h3>
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500">
                              Showing items {pageIndex * REELS_PER_PAGE + 1} - {Math.min((pageIndex + 1) * REELS_PER_PAGE, sortedReelItems.length)} of {sortedReelItems.length}
                            </span>
                          </div>

                          <div className="border border-slate-300 overflow-x-auto">
                            <table className="w-full text-left text-[9px] sm:text-xs border-collapse font-sans">
                              <thead className="bg-[#0B132B] text-white uppercase text-[8px] sm:text-[10px] font-black tracking-wider">
                                <tr>
                                  <th className="py-1.5 sm:py-2 px-1 sm:px-2.5 text-center w-6 sm:w-10">SR</th>
                                  <th className="py-1.5 sm:py-2 px-1.5 sm:px-3 font-mono">REEL NO</th>
                                  <th className="py-1.5 sm:py-2 px-1.5 sm:px-3">PRODUCT</th>
                                  <th className="py-1.5 sm:py-2 px-1 sm:px-3 text-center">GSM</th>
                                  <th className="py-1.5 sm:py-2 px-1 sm:px-3 text-center whitespace-nowrap">SIZE (CM)</th>
                                  <th className="py-1.5 sm:py-2 px-1 sm:px-3 text-center">PLY</th>
                                  <th className="py-1.5 sm:py-2 px-1.5 sm:px-3 text-right whitespace-nowrap">WEIGHT (KG)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
                                {pageReels.map((reel) => (
                                  <React.Fragment key={reel.reelNo}>
                                    {receiptGroupMode === 'grouped' && reel.isGroupStart && (
                                      <tr className="bg-slate-100 font-black border-y border-slate-300">
                                        <td colSpan={7} className="py-1 sm:py-1.5 px-2 sm:px-3">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[9.5px] sm:text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600 inline-block"></span>
                                              {reel.groupLabel}
                                            </span>
                                            <span className="text-[8.5px] sm:text-[10px] font-black text-slate-700 bg-white px-1.5 sm:px-2 py-0.5 rounded border border-slate-300">
                                              {reel.groupTotalReels} Reels &bull; {reel.groupTotalWeight.toLocaleString()} KG
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                    <tr className="hover:bg-slate-50">
                                      <td className="py-1 sm:py-1.5 px-1 sm:px-2.5 text-center font-bold text-slate-700">{reel.displayIndex}</td>
                                      <td className="py-1 sm:py-1.5 px-1.5 sm:px-3 font-mono font-bold whitespace-nowrap">{reel.reelNo}</td>
                                      <td className="py-1 sm:py-1.5 px-1.5 sm:px-3 truncate max-w-[90px] sm:max-w-none">{reel.product}</td>
                                      <td className="py-1 sm:py-1.5 px-1 sm:px-3 text-center font-semibold">{reel.gsm}</td>
                                      <td className="py-1 sm:py-1.5 px-1 sm:px-3 text-center font-semibold">{reel.size}</td>
                                      <td className="py-1 sm:py-1.5 px-1 sm:px-3 text-center font-semibold">{reel.ply || 1}</td>
                                      <td className="py-1 sm:py-1.5 px-1.5 sm:px-3 text-right font-mono font-bold whitespace-nowrap">{reel.weight}</td>
                                    </tr>
                                  </React.Fragment>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 5. PRODUCT SUMMARY Table (On Last Page) */}
                        {isLastPage && (
                          <div className="mb-4 sm:mb-5 text-left">
                            <h3 className="text-[11px] sm:text-xs font-black text-black uppercase tracking-wider mb-1.5">
                              PRODUCT SUMMARY (ITEMIZED BREAKDOWN)
                            </h3>
                            <div className="border border-slate-300 overflow-x-auto">
                              <table className="w-full text-left text-[9px] sm:text-xs border-collapse font-sans">
                                <thead className="bg-[#0B132B] text-white uppercase text-[8px] sm:text-[10px] font-black tracking-wider">
                                  <tr>
                                    <th className="py-1.5 sm:py-2 px-1.5 sm:px-3">PRODUCT SPECIFICATION</th>
                                    <th className="py-1.5 sm:py-2 px-1 sm:px-3 text-center">GSM</th>
                                    <th className="py-1.5 sm:py-2 px-1 sm:px-3 text-center">SIZE</th>
                                    <th className="py-1.5 sm:py-2 px-1 sm:px-3 text-center">PLY</th>
                                    <th className="py-1.5 sm:py-2 px-1 sm:px-3 text-center">REELS</th>
                                    <th className="py-1.5 sm:py-2 px-1.5 sm:px-3 text-right whitespace-nowrap">TOTAL WEIGHT</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
                                  {specGroupsList.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                      <td className="py-1 sm:py-1.5 px-1.5 sm:px-3 font-bold">{item.product}</td>
                                      <td className="py-1 sm:py-1.5 px-1 sm:px-3 text-center">{item.gsm}</td>
                                      <td className="py-1 sm:py-1.5 px-1 sm:px-3 text-center whitespace-nowrap">{item.size} CM</td>
                                      <td className="py-1 sm:py-1.5 px-1 sm:px-3 text-center whitespace-nowrap">{item.ply} Ply</td>
                                      <td className="py-1 sm:py-1.5 px-1 sm:px-3 text-center font-bold font-mono">{item.reels.length}</td>
                                      <td className="py-1 sm:py-1.5 px-1.5 sm:px-3 text-right font-mono font-bold whitespace-nowrap">{item.totalWeight.toLocaleString()} KG</td>
                                    </tr>
                                  ))}
                                  {/* GRAND TOTAL Row */}
                                  <tr className="bg-[#FEE4CB] font-black text-slate-950 border-t-2 border-slate-300 text-[10px] sm:text-xs">
                                    <td colSpan={4} className="py-1.5 sm:py-2 px-1.5 sm:px-3 uppercase tracking-wider font-black">
                                      GRAND TOTAL
                                    </td>
                                    <td className="py-1.5 sm:py-2 px-1 sm:px-3 text-center font-mono font-black text-xs sm:text-sm">
                                      {linkedReels.length} Reels
                                    </td>
                                    <td className="py-1.5 sm:py-2 px-1.5 sm:px-3 text-right font-mono font-black text-xs sm:text-sm whitespace-nowrap">
                                      {grandTotalWeight.toLocaleString()} KG
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Section Anchored at End of Page (Signatures + Footer) */}
                      <div className="mt-auto pt-4 sm:pt-6 space-y-3 sm:space-y-4">
                        {/* 6. Signatures (On Last Page) */}
                        {isLastPage && (
                          <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-3 sm:pt-4 mb-2 text-center font-sans">
                            <div className="border-t-2 border-black pt-1.5 sm:pt-2">
                              <span className="text-[8.5px] sm:text-xs font-black uppercase text-black tracking-wider block">
                                PREPARED BY
                              </span>
                            </div>
                            <div className="border-t-2 border-black pt-1.5 sm:pt-2">
                              <span className="text-[8.5px] sm:text-xs font-black uppercase text-black tracking-wider block">
                                DRIVER SIGNATURE
                              </span>
                            </div>
                            <div className="border-t-2 border-black pt-1.5 sm:pt-2">
                              <span className="text-[8.5px] sm:text-xs font-black uppercase text-black tracking-wider block">
                                RECEIVER / GATE
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 7. Footer Caption with Page Count */}
                        <div className="text-center text-[8px] sm:text-[9px] font-semibold text-slate-600 pt-2 border-t border-slate-200 flex justify-between items-center gap-2">
                          <span className="truncate">{COMPANY_CONFIG.name} &bull; {COMPANY_CONFIG.shortAddress} &bull; Ph: {COMPANY_CONFIG.phone} &bull; {COMPANY_CONFIG.website}</span>
                          <span className="font-mono font-bold shrink-0">Page {pageNumber} of {totalPages}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>,
          document.body
        );
      })()}

    </div>
  );
};
export default DispatchView;
