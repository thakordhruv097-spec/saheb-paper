import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { useDateFilter } from '../context/DateFilterContext';
import { CustomDatePickerModal } from './CustomDatePickerModal';
import { PrivacyConsentModal } from './PrivacyConsentModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { AppUpdateModal } from './AppUpdateModal';
import { APP_VERSION } from '../config/version';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { getRawMaterials, getReels, getPendingOrders } from '../data/index';
import {
  LayoutDashboard,
  LayoutGrid,
  Warehouse,
  Home,
  Factory,
  Cog,
  RotateCw,
  Package,
  QrCode,
  Search,
  Settings,
  LogOut,
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  ChevronDown,
  User,
  UserCheck,
  Shield,
  Flame,
  Droplet,
  Lightbulb,
  Truck,
  BarChart2,
  Wrench,
  GitBranch,
  FileText,
  Bell,
  FlaskConical,
  Layers,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Beaker,
  Tag,
  Palette,
  Sparkles,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, hasAccess, updateUserProfile, isSimulating, exitSimulation } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('saheb_theme') === 'dark';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Dropdown states for mobile compatibility
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  // Global Date & Timeframe Filter Context (Only active for Admin & Management)
  const { timeframe, setTimeframe, selectedDate, setSelectedDate, handlePrevDate, handleNextDate, systemToday } = useDateFilter();
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);

  // Profile, Privacy & Update Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPrivacyPolicyModalOpen, setIsPrivacyPolicyModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  useBodyScrollLock(isProfileModalOpen || mobileMenuOpen || isPrivacyPolicyModalOpen || isUpdateModalOpen);
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePin, setProfilePin] = useState('');
  const [profileSecurityQuestion, setProfileSecurityQuestion] = useState('What is your favorite color?');
  const [profileSecurityAnswer, setProfileSecurityAnswer] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  const openProfileModal = () => {
    if (user) {
      setProfileDisplayName(user.displayName);
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      setProfilePin('');
      setProfileSecurityQuestion(user.securityQuestion || 'What is your favorite color?');
      setProfileSecurityAnswer(user.securityAnswer || '');
    }
    setIsProfileModalOpen(true);
    setProfileDropdownOpen(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileDisplayName.trim()) return;

    const pinTrimmed = profilePin.trim();
    if (pinTrimmed && (pinTrimmed.length !== 4 || isNaN(Number(pinTrimmed)))) {
      alert('Security PIN must be exactly 4 numeric digits');
      return;
    }

    const payload = {
      displayName: profileDisplayName,
      email: profileEmail,
      phone: profilePhone,
      securityQuestion: profileSecurityQuestion,
      securityAnswer: profileSecurityAnswer,
      ...(pinTrimmed ? { pin: pinTrimmed } : {}),
    };

    const success = await updateUserProfile(payload);

    if (success) {
      setProfileSaveSuccess(true);
      setTimeout(() => {
        setProfileSaveSuccess(false);
        setIsProfileModalOpen(false);
        setProfilePin('');
      }, 1000);
    }
  };

  // Lock background body scroll when profile modal is open
  useEffect(() => {
    if (isProfileModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isProfileModalOpen]);

  const [showBottomNav, setShowBottomNav] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLElement | null>(null);
  const headerDatePickerRef = useRef<HTMLDivElement | null>(null);

  // Auto-hide top header & bottom nav bar on scroll down, show on scroll up
  useEffect(() => {
    const mainEl = mainRef.current;

    const handleScroll = () => {
      const mainScroll = mainEl ? mainEl.scrollTop : 0;
      const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
      const currentScrollY = Math.max(mainScroll, windowScroll);

      // Threshold: only trigger if scroll distance is greater than 8px
      const diff = Math.abs(currentScrollY - lastScrollY.current);
      if (diff < 8) return;

      if (currentScrollY <= 15) {
        setShowBottomNav(true);
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY.current) {
        setShowBottomNav(false);
        setShowHeader(false);
      } else {
        setShowBottomNav(true);
        setShowHeader(true);
      }

      lastScrollY.current = currentScrollY;
    };

    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Reset navigation visibility and scroll position on route change to ALWAYS open at the very top of the page
  useEffect(() => {
    setShowBottomNav(true);
    setShowHeader(true);
    lastScrollY.current = 0;

    const resetScroll = () => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();

    // Microtask & macrotask fallbacks to guarantee scroll reset even after async route/DOM updates
    const timer1 = setTimeout(resetScroll, 0);
    const timer2 = setTimeout(resetScroll, 40);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname, location.search]);

  // Click away handlers for dropdown menu states
  useEffect(() => {
    const handleOutsideClick = () => {
      setLangDropdownOpen(false);
      setProfileDropdownOpen(false);
      setBellOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Lock body scroll when mobile menu is open to prevent background scrolling
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Define Ordered Mobile Tabs (Home -> Production -> Scan -> Dispatch -> More)
  const mobileTabs = useMemo(() => {
    let prodPath = '/machine-production';
    if (user?.role === 'PulpOperator') prodPath = '/pulp-mill-operations';
    else if (user?.role === 'BoilerOperator') prodPath = '/utilities-&-etp/boiler-operations';
    else if (user?.role === 'RewinderOperator') prodPath = '/rewinding-reel-conversion';
    else if (user?.role === 'EtpOperator') prodPath = '/utilities-&-etp/etp-water-&-chemicals';

    return [
      { id: 'home', path: '/', label: 'Home', icon: LayoutDashboard, aliases: [] },
      { id: 'production', path: prodPath, label: 'Production', icon: Factory, aliases: ['/machine-production', '/pulp-mill-operations', '/rewinding-reel-conversion', '/utilities-etp', '/utilities-&-etp/boiler-operations', '/utilities-&-etp/etp-water-&-chemicals', '/utilities-&-etp/electricity-&-power-grid', '/utilites-&-etp/boiler-operations', '/utilities-&-etp'] },
      { id: 'scan', path: '/qr-scanner', label: 'Scan', icon: QrCode, aliases: ['/traceability'] },
      { id: 'dispatch', path: '/dispatch-receipt/draft-packing-slip', label: 'Dispatch', icon: Truck, aliases: ['/dispatch-receipt/draft-packing-slip', '/dispatch-receipt/packing-slips-&-challans', '/dispatch-receipt/dispatched-reels', '/dispatch-receipt', '/finished-stock-dispatch', '/stock-categorization'] },
      { id: 'more', path: '/profile', label: 'More', icon: User, aliases: ['/admin-profile', '/role-management', '/user-management', '/monthly-yearly-reporting', '/raw-material-stock'] },
    ];
  }, [user]);

  // Current Active Tab Index (0 to 4)
  const activeTabIndex = useMemo(() => {
    const currentPath = location.pathname;
    // 1. Direct path match
    for (let i = 0; i < mobileTabs.length; i++) {
      const tab = mobileTabs[i];
      if (tab.path === currentPath || tab.path.split('?')[0] === currentPath) return i;
    }
    // 2. Alias match
    for (let i = 0; i < mobileTabs.length; i++) {
      const tab = mobileTabs[i];
      if (tab.aliases?.some(a => currentPath.startsWith(a.split('?')[0]))) return i;
    }
    return 0;
  }, [location.pathname, mobileTabs]);

  // Touch Swipe Gesture State & Handlers
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null || touchStartTimeRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    const elapsed = Date.now() - touchStartTimeRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchStartTimeRef.current = null;

    // Ignore interactive form controls and horizontal scrollable elements
    const target = e.target as HTMLElement | null;
    if (target) {
      const isInteractive = ['INPUT', 'TEXTAREA', 'SELECT', 'CANVAS'].includes(target.tagName);
      const isInsideScrollable = target.closest('table') || target.closest('.overflow-x-auto') || target.closest('[data-no-swipe="true"]');
      if (isInteractive || isInsideScrollable) return;
    }

    // Minimum distance: 50px, duration < 600ms, and must be predominantly horizontal
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > 1.3 * Math.abs(deltaY) && elapsed < 600) {
      if (deltaX < 0) {
        // Left Swipe -> Move to NEXT Tab (Home -> Production -> Scan -> Dispatch -> More)
        if (activeTabIndex < mobileTabs.length - 1) {
          const nextTab = mobileTabs[activeTabIndex + 1];
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
          navigate(nextTab.path);
        }
      } else {
        // Right Swipe -> Move to PREVIOUS Tab (More -> Dispatch -> Scan -> Production -> Home)
        if (activeTabIndex > 0) {
          const prevTab = mobileTabs[activeTabIndex - 1];
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
          navigate(prevTab.path);
        }
      }
    }
  };

  const toggleLang = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLangDropdownOpen(!langDropdownOpen);
    setProfileDropdownOpen(false);
    setBellOpen(false);
  };

  const toggleProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProfileDropdownOpen(!profileDropdownOpen);
    setLangDropdownOpen(false);
    setBellOpen(false);
  };

  const toggleBell = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBellOpen(!bellOpen);
    setLangDropdownOpen(false);
    setProfileDropdownOpen(false);
  };
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

  // Computes alert notifications
  const rawNotifications = useMemo(() => {
    const list: { id: string; type: 'stock' | 'qc' | 'order'; title: string; desc: string }[] = [];

    // 1. Low Stock Thresholds
    try {
      const materials = getRawMaterials();
      materials.forEach(m => {
        if (m.stock <= m.minThreshold) {
          list.push({
            id: `stock-${m.id}`,
            type: 'stock',
            title: `Low Stock: ${m.name}`,
            desc: `Current: ${m.stock.toLocaleString()} kg (Min Threshold: ${m.minThreshold} kg)`,
          });
        }
      });
    } catch (e) {
      console.error(e);
    }

    // 2. QC Pending Backlog (>24 hours)
    try {
      const reels = getReels();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      reels.forEach(r => {
        if (r.status === 'QC_PENDING') {
          const prodTime = new Date(r.productionDate).getTime();
          if (!isNaN(prodTime) && prodTime < oneDayAgo) {
            list.push({
              id: `qc-${r.reelNo}`,
              type: 'qc',
              title: `QC Pending Backlog: ${r.reelNo.substring(r.reelNo.length - 8)}`,
              desc: `Awaiting inspection for >24 hrs. Produced ${r.productionDate.substring(0, 10)}.`,
            });
          }
        }
      });
    } catch (e) {
      console.error(e);
    }

    // 3. Pending Orders Approaching (within 3 days)
    try {
      const orders = getPendingOrders();
      const threeDaysFromNow = Date.now() + 3 * 24 * 60 * 60 * 1000;
      orders.forEach(o => {
        if (o.status === 'PENDING' || o.status === 'PARTIAL') {
          const dueTime = new Date(o.dueDate).getTime();
          if (!isNaN(dueTime) && dueTime <= threeDaysFromNow) {
            const daysLeft = Math.ceil((dueTime - Date.now()) / (24 * 60 * 60 * 1000));
            list.push({
              id: `order-${o.id}`,
              type: 'order',
              title: `Delivery Due Soon`,
              desc: `Due date is ${o.dueDate} (${daysLeft <= 0 ? '0' : daysLeft} days left)`,
            });
          }
        }
      });
    } catch (e) {
      console.error(e);
    }

    return list;
  }, [location.pathname]);

  const activeNotifications = useMemo(() => {
    return rawNotifications
      .filter(n => !dismissedNotificationIds.includes(n.id))
      .filter(n => {
        if (!user) return false;
        if (user.role === 'Admin' || user.role === 'Management') return true;
        // Operators only see notifications relevant to their specific role/access
        if (n.type === 'stock') return hasAccess('raw_material_stock');
        if (n.type === 'qc') return hasAccess('machine_production') || hasAccess('rewinding_reel_conversion');
        if (n.type === 'order') return hasAccess('finished_stock_dispatch');
        return false;
      });
  }, [rawNotifications, dismissedNotificationIds, user, hasAccess]);

  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedNotificationIds(prev => [...prev, id]);
  };

  const clearAllNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allIds = rawNotifications.map(n => n.id);
    setDismissedNotificationIds(allIds);
  };  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('saheb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('saheb_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    i18n.changeLanguage('en');
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const getUtilitiesPath = () => {
    if (hasAccess('boiler')) return '/utilities-&-etp/boiler-operations';
    if (hasAccess('etp')) return '/utilities-&-etp/etp-water-&-chemicals';
    if (hasAccess('electricity')) return '/utilities-&-etp/electricity-&-power-grid';
    return '/utilities-&-etp/boiler-operations';
  };

  const menuItems = [
    { id: 'dashboard', path: '/', label: t('nav.dashboard', 'Dashboard'), icon: LayoutGrid },
    { id: 'raw_material_stock', path: '/raw-material-stock', label: t('nav.raw_material', 'Raw Material'), icon: Home },
    { id: 'pulp_mill_operations', path: '/pulp-mill-operations', label: t('nav.pulp_mill', 'Pulp Mill'), icon: Factory },
    { id: 'machine_production', path: '/machine-production', label: t('nav.machine', 'Machine Production'), icon: Cog },
    { id: 'rewinding_reel_conversion', path: '/rewinding-reel-conversion', label: t('nav.rewinder', 'Rewinder Roll-to-Reel'), icon: RotateCw },
    { id: 'lab', path: '/lab', label: 'Lab Quality Control', icon: FlaskConical },
    { id: 'orders', path: '/orders', label: t('nav.orders', 'Order Bookings'), icon: FileText },
    { id: 'utilities_etp', path: getUtilitiesPath(), label: t('nav.utilities_etp', 'Utilities & ETP'), icon: Droplet },
    { id: 'dispatch_receipt', path: '/dispatch-receipt/draft-packing-slip', label: t('nav.dispatch_receipt', 'Dispatch Receipt'), icon: Truck },
    { id: 'finished_stock_dispatch', path: '/stock-categorization', label: t('nav.finished_stock_dispatch', 'Stock Categorization'), icon: Layers },
    { id: 'spareparts_management', path: '/spareparts-management', label: t('nav.store', 'Spares Store'), icon: Wrench },
    { id: 'label_studio', path: '/label-studio', label: 'Label Studio', icon: Tag },
    { id: 'monthly_yearly_reporting', path: '/monthly-yearly-reporting', label: t('nav.reports', 'Mill Reports'), icon: BarChart2 },
    { id: 'admin_panel_audit', path: '/admin-panel-audit', label: t('nav.admin_masters', 'Admin Masters'), icon: Settings },
  ];

  const visibleMenuItems = menuItems.filter(item => hasAccess(item.id));

  // Dynamic Section Categories for Sidebar
  const sidebarSections = useMemo(() => {
    const core = visibleMenuItems.filter(i => ['dashboard'].includes(i.id));
    const production = visibleMenuItems.filter(i => ['raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion', 'lab'].includes(i.id));
    const operations = visibleMenuItems.filter(i => ['orders', 'utilities_etp', 'dispatch_receipt', 'finished_stock_dispatch', 'spareparts_management'].includes(i.id));
    const admin = visibleMenuItems.filter(i => ['label_studio', 'monthly_yearly_reporting', 'admin_panel_audit'].includes(i.id));

    return [
      { title: 'CORE NAVIGATION', items: core },
      { title: 'PRODUCTION & MILL', items: production },
      { title: 'OPERATIONS & LOGISTICS', items: operations },
      { title: 'ANALYTICS & GOVERNANCE', items: admin },
    ].filter(section => section.items.length > 0);
  }, [visibleMenuItems]);

  // Dropdown states for top horizontal navbar (tablet/desktop)
  const toggleDropdown = (name: string) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light-primary dark:text-slate-100 flex flex-col transition-colors duration-200 w-full max-w-full overflow-x-hidden">

      {/* Simulation Banner - Displays whenever Admin is simulating a worker */}
      {isSimulating && (
        <div className={`sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-3 sm:px-5 py-2 text-xs font-bold flex items-center justify-between shadow-lg backdrop-blur-md transition-all w-full max-w-full overflow-x-hidden min-w-0 ${
          user ? 'md:ml-[268px] md:w-[calc(100%-268px)]' : 'w-full'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300"></span>
            </span>
            <span className="font-extrabold tracking-wider uppercase text-[10px] bg-white/20 px-2 py-0.5 rounded-full shrink-0">
              Simulating
            </span>
            <span className="truncate text-slate-100 text-xs font-semibold hidden sm:inline">
              Viewing as: <strong className="text-white font-bold">{user?.displayName}</strong> ({user?.designation || user?.role}) &bull; Active permissions applied
            </span>
            <span className="truncate text-slate-100 text-xs font-semibold sm:hidden">
              Worker: <strong className="text-white font-bold">{user?.displayName}</strong>
            </span>
          </div>

          <button
            onClick={async () => {
              await exitSimulation();
              navigate('/admin-panel-audit?tab=roles', { state: { tab: 'roles' } });
            }}
            className="ml-3 px-3.5 py-1 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-black shadow-md transition active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Exit Simulation</span>
          </button>
        </div>
      )}

      {/* 1. Header (Common across all sizes) - Seamless background matching page without white partition bar */}
      <header className={`sticky top-0 z-30 bg-bg-light/95 dark:bg-bg-dark/95 text-slate-900 dark:text-white backdrop-blur-md h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 transition-all duration-300 w-full max-w-full overflow-x-hidden min-w-0 ${user ? 'md:ml-[268px] md:w-[calc(100%-268px)]' : 'w-full'
        } ${showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}>

        {/* Left Side Logo & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          {(user?.role === 'Admin' || user?.role === 'Management') && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white md:hidden transition shadow-[3px_3px_8px_rgba(163,163,196,0.18),-3px_-3px_8px_rgba(255,255,255,0.95)] dark:shadow-none shrink-0 cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <svg className="h-5 w-5 text-[#6C4FE0] dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="15" y2="12" />
                  <line x1="3" y1="18" x2="9" y2="18" />
                </svg>
              )}
            </button>
          )}

          {/* Mobile Only Header Logo */}
          <div className="flex md:hidden items-center gap-2.5 cursor-pointer group select-none min-w-0" onClick={() => navigate('/')}>
            <img src={`${import.meta.env.BASE_URL}saheb-logo-official.png`} alt="Saheb Paper Logo" className="h-8 w-auto max-w-[48px] object-contain shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-none tracking-tight truncate font-heading">
                  Saheb Paper Pvt. Ltd.
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#6C4FE0] dark:text-purple-300 text-[8px] font-black uppercase shrink-0 border border-purple-200/90 dark:border-purple-800/80">
                  ERP
                </span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium tracking-tight truncate mt-0.5">
                Paper Mill Management System
              </p>
            </div>
          </div>
        </div>

        {/* Right Side Header Controls - Matching exact reference image */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">

          {/* Date & Timeframe Filter controls - Visible on Desktop, Hidden on Mobile */}
          <div className="hidden md:flex items-center bg-white dark:bg-[#131d38] rounded-full p-1 pl-1.5 pr-1.5 sm:pr-2 gap-1 sm:gap-2 shadow-[4px_4px_14px_rgba(163,163,196,0.2),-4px_-4px_14px_rgba(255,255,255,0.95)] dark:shadow-none shrink-0 min-w-0">
            {/* Timeframe Selector Sub-pill (Day / Week / Month / All) - Visible on large desktop */}
            <div className="hidden lg:flex items-center gap-0.5">
              {(['day', 'week', 'month', 'all'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 sm:px-3.5 py-1 text-[10px] sm:text-xs font-bold rounded-full capitalize transition-all cursor-pointer ${timeframe === tf
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {tf === 'day' ? 'Day' : tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'All'}
                </button>
              ))}
            </div>

            {/* Date Stepper Sub-controls (< 2026-08-19 📅 >) inside the SAME pill */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={handlePrevDate}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                title="Previous Date"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <div className="relative" ref={headerDatePickerRef}>
                <div
                  onClick={() => setIsDatePickerModalOpen(prev => !prev)}
                  className="flex items-center bg-white dark:bg-slate-900 rounded-full px-2 sm:px-3 py-0.5 shadow-[inset_1px_1px_3px_rgba(163,163,196,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.9)] dark:shadow-none group cursor-pointer select-none"
                  title="Click to select date"
                >
                  <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-white mr-1 sm:mr-1.5 font-sans">
                    {selectedDate}
                  </span>
                  <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform" />
                </div>

                {isDatePickerModalOpen && (
                  <CustomDatePickerModal
                    selectedDate={selectedDate}
                    onSelectDate={(newDateStr) => setSelectedDate(newDateStr)}
                    onClose={() => setIsDatePickerModalOpen(false)}
                    align="right"
                    triggerRef={headerDatePickerRef}
                  />
                )}
              </div>

              <button
                onClick={handleNextDate}
                disabled={selectedDate >= systemToday}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
                title="Next Date"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 3. Circular Dark/Light Mode Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-full bg-white dark:bg-[#131d38] flex items-center justify-center shadow-[3px_3px_8px_rgba(163,163,196,0.18),-3px_-3px_8px_rgba(255,255,255,0.95)] dark:shadow-none text-slate-600 dark:text-amber-300 hover:scale-105 transition cursor-pointer shrink-0"
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {/* 4. Circular Notifications Bell Button */}
          <div className="relative shrink-0">
            <button
              onClick={toggleBell}
              className="w-9 h-9 rounded-full bg-white dark:bg-[#131d38] flex items-center justify-center shadow-[3px_3px_8px_rgba(163,163,196,0.18),-3px_-3px_8px_rgba(255,255,255,0.95)] dark:shadow-none text-slate-600 dark:text-slate-200 relative hover:scale-105 transition cursor-pointer"
              title="Notifications & Alerts"
            >
              <Bell className="h-4 w-4" />
              {activeNotifications.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#5B3DC9] ring-2 ring-white dark:ring-[#131d38]"></span>
              )}
            </button>

            {bellOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 bg-white dark:bg-[#131d38] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-2xl py-3 w-80 sm:w-88 z-50 max-h-96 overflow-y-auto font-sans"
              >
                <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Alerts & Notifications</span>
                  {activeNotifications.length > 0 ? (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs font-extrabold text-primary dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-800">Healthy</span>
                  )}
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeNotifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-300 font-medium">
                      System healthy. No active alerts.
                    </div>
                  ) : (
                    activeNotifications.map(n => (
                      <div key={n.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left space-y-1.5 relative group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${n.type === 'stock' ? 'bg-amber-500' :
                              n.type === 'qc' ? 'bg-purple-500' : 'bg-red-500'
                              }`}></span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{n.title}</span>
                          </div>
                          <button
                            onClick={(e) => dismissNotification(n.id, e)}
                            className="p-1 rounded text-slate-400 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shrink-0 transition"
                            title="Dismiss alert"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-200 pl-4 leading-relaxed pr-2 font-normal">{n.desc}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 5. User Profile Capsule Pill */}
          {user && (
            <div className="relative shrink-0">
              <div
                onClick={toggleProfile}
                className="bg-white dark:bg-[#131d38] border border-slate-200/80 dark:border-slate-800 rounded-full p-1 sm:pl-3 sm:pr-1.5 sm:py-1.5 flex items-center gap-2 shadow-[3px_3px_10px_rgba(163,163,196,0.18),-3px_-3px_10px_rgba(255,255,255,0.95)] dark:shadow-none cursor-pointer hover:scale-[1.02] transition-all select-none"
                title="Profile Settings"
              >
                <div className="hidden sm:flex flex-col items-start justify-center text-left min-w-0 max-w-[80px] md:max-w-[100px] lg:max-w-[140px]">
                  <span className="text-[12px] font-black text-slate-900 dark:text-white leading-none tracking-tight truncate w-full">
                    {user.displayName}
                  </span>
                  <span className="mt-1 px-2 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#6C4FE0] dark:text-purple-300 text-[8.5px] font-black uppercase tracking-wider leading-none border border-purple-200/90 dark:border-purple-800/80 shadow-[0_1px_2px_rgba(108,79,224,0.06)] truncate max-w-full">
                    {user.role}
                  </span>
                </div>

                {/* Profile Circle Avatar */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#5B3DC9] text-white rounded-full flex items-center justify-center shadow-xs shrink-0">
                  <User className="h-4 w-4" />
                </div>
              </div>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="bg-white dark:bg-[#131d38] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-2xl overflow-hidden py-1.5 w-56 font-sans">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                      <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{user.displayName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">@{user.username} ({user.role})</p>
                    </div>

                    <button
                      onClick={() => {
                        navigate('/profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 text-left transition border-b border-slate-100 dark:border-slate-800 cursor-pointer"
                    >
                      <User className="h-4 w-4 text-primary dark:text-blue-400" />
                      <span>My Profile & Details</span>
                    </button>

                    {user.role === 'Admin' && (
                      <button
                        onClick={() => {
                          navigate('/role-management');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-800 text-left transition border-b border-slate-100 dark:border-slate-800 cursor-pointer"
                      >
                        <Shield className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                        <span>Role Management</span>
                      </button>
                    )}

                    {(user.role === 'Admin' || user.role === 'Management') && (
                      <button
                        onClick={() => {
                          navigate('/user-management');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition border-b border-slate-100 dark:border-slate-800 cursor-pointer"
                      >
                        <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span>User Management</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setIsUpdateModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-left transition border-b border-slate-100 dark:border-slate-800 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4 text-[#2563EB] dark:text-blue-400" />
                      <div className="flex items-center justify-between flex-1">
                        <span>Check Updates</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold">
                          v{APP_VERSION}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-left transition cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-red-500 dark:text-red-400" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* 2. Left Sidebar (Tablet/Desktop: md:flex) - Floating Premium Neomorphic Card */}
        {user && (
          <aside className="hidden md:flex flex-col fixed top-3 left-3 bottom-3 w-[248px] bg-white dark:bg-[#131d38] text-slate-800 dark:text-white z-40 select-none shadow-[8px_8px_24px_rgba(163,163,196,0.18),-8px_-8px_24px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-[22px] overflow-hidden p-2.5 h-[calc(100vh-24px)]">

            {/* Top Header Card / Pill */}
            <div
              className="bg-white dark:bg-[#1a2544] p-2 rounded-2xl flex items-center gap-2.5 shadow-[3px_3px_8px_rgba(163,163,196,0.14),-3px_-3px_8px_rgba(255,255,255,0.95)] dark:shadow-none mb-2 shrink-0 cursor-pointer group select-none transition-all hover:scale-[1.01]"
              onClick={() => navigate('/')}
            >
              <img
                src={`${import.meta.env.BASE_URL}saheb-logo-official.png`}
                alt="Saheb Paper Logo"
                className="h-8 w-auto max-w-[48px] object-contain shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white leading-none tracking-tight truncate font-heading">
                    Saheb Paper
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#6C4FE0] dark:text-purple-300 text-[8.5px] font-black uppercase shrink-0 border border-purple-200/90 dark:border-purple-800/80">
                    ERP
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium tracking-tight truncate mt-0.5">
                  Paper Mill Management
                </p>
              </div>
            </div>

            {/* Sidebar Navigation Sections */}
            <div className="flex-1 overflow-y-auto pr-0.5 select-none flex flex-col space-y-3.5 dashboard-custom-scrollbar py-1">
              {sidebarSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <div className="px-3 pt-0.5 pb-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-[#6B7C96] dark:text-slate-400 font-sans">
                    {section.title}
                  </div>

                  <div className="space-y-1">
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path || (item.id === 'dispatch_receipt' && location.pathname.startsWith('/dispatch-receipt')) || (item.id === 'utilities_etp' && (location.pathname.startsWith('/utilities-&-etp') || location.pathname.startsWith('/utilites-&-etp') || location.pathname.startsWith('/utilities-etp')));
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigate(item.path)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl transition-all duration-150 text-left cursor-pointer group select-none ${isActive
                            ? 'bg-primary text-white font-bold shadow-sm shadow-primary/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-[#F3F2FA] dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform ${isActive ? 'text-white stroke-[2.2]' : 'text-slate-400 dark:text-slate-400 stroke-[1.8] group-hover:scale-110 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} />
                            <span className={`text-[12.5px] font-sans tracking-tight leading-tight truncate ${isActive ? 'font-bold text-white' : 'font-semibold text-[#334155] dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                              {item.label}
                            </span>
                          </div>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-white shadow-xs shrink-0 ml-1.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </aside>
        )}

        {/* 3. Main content area with Touch Gesture Swipe support */}
        <main
          ref={mainRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden pb-32 md:pb-6 relative w-full max-w-full min-w-0 ${user ? 'md:ml-[268px] md:w-[calc(100%-268px)]' : 'w-full'
            } dashboard-main-scrollbar`}
        >
          {/* Actual children page content */}
          <div className="p-2.5 sm:p-4 lg:p-6 flex-1 flex flex-col w-full max-w-full min-w-0 overflow-x-hidden">{children}</div>
        </main>
      </div>

      {/* 4. Mobile Slide-out Menu - Light Mode: Clean White / Dark Mode: #131d38 */}
      {mobileMenuOpen && user && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-80 bg-white dark:bg-[#131d38] text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 h-full p-5 flex flex-col shadow-2xl transition"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header & Profile Card */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{user.displayName}</h3>
                  <span className="text-[10px] font-black uppercase text-primary dark:text-blue-400 tracking-wider">
                    {user.role === 'Admin' ? 'Master Admin' : user.role}
                  </span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Navigation List */}
            <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1">

              {visibleMenuItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.id === 'dispatch_receipt' && location.pathname.startsWith('/dispatch-receipt')) || (item.id === 'utilities_etp' && (location.pathname.startsWith('/utilities-&-etp') || location.pathname.startsWith('/utilites-&-etp') || location.pathname.startsWith('/utilities-etp')));
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-left transition cursor-pointer ${isActive
                      ? 'bg-primary text-white font-bold shadow-sm shadow-primary/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white stroke-[2.2]' : 'text-slate-400 dark:text-slate-400 stroke-[1.8]'}`} />
                      <span className={`text-xs sm:text-sm ${isActive ? 'font-bold text-white' : 'font-semibold text-slate-700 dark:text-slate-200'}`}>{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-white shadow-xs shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Controls inside Mobile Drawer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div
                onClick={() => setDarkMode(!darkMode)}
                className="bg-white dark:bg-[#1a2544] rounded-2xl p-2.5 px-3.5 flex items-center justify-between shadow-[3px_3px_10px_rgba(163,163,196,0.18),-3px_-3px_10px_rgba(255,255,255,0.9)] cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                  {darkMode ? <Moon className="h-4 w-4 text-purple-400" /> : <Sun className="h-4 w-4 text-slate-500" />}
                  <span className="text-xs font-bold">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <div className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${darkMode ? 'bg-slate-700 justify-start' : 'bg-[#6C4FE0] justify-end'}`}>
                  <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsUpdateModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200/80 dark:border-blue-900/50 transition cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Check for Updates</span>
                </div>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-blue-200/70 dark:bg-blue-900/80 font-black">
                  v{APP_VERSION}
                </span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold text-xs uppercase tracking-wider border border-red-200 dark:border-red-800 transition cursor-pointer shadow-2xs hover:dark:bg-red-900/60"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout of Account</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. Floating Dynamic Island Bottom Navigation Bar (Mobile: md:hidden) */}
      {user && (
        <>
          {/* Subtle Background Backdrop Mask to prevent page content bleed */}
          <div className={`fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent dark:from-[#0b1329] dark:to-transparent pointer-events-none z-30 md:hidden transition-all duration-300 ${showBottomNav ? 'opacity-100' : 'opacity-0'
            }`} />
          {/* 5-TAB SYNCHRONIZED MOBILE BOTTOM NAVIGATION */}
          <nav className={`fixed bottom-3 left-3 right-3 max-w-[calc(100vw-24px)] mx-auto h-16 bg-white/95 dark:bg-[#131d38]/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl flex md:hidden items-center justify-around px-1.5 z-40 select-none overflow-hidden transition-all duration-300 ease-in-out ${showBottomNav ? 'translate-y-0 opacity-100' : 'translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none'
            }`}>
            {mobileTabs.map((tab, idx) => {
              const isActive = activeTabIndex === idx;
              const isScanTab = tab.id === 'scan';
              const Icon = tab.icon;

              if (isScanTab) {
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                      navigate(tab.path);
                    }}
                    className="flex flex-col items-center justify-center flex-1 py-1 group cursor-pointer"
                    title={tab.label}
                  >
                    <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center -mt-5 shadow-xl active:scale-90 transition-all ${isActive
                      ? 'bg-gradient-to-tr from-[#6C4FE0] to-[#7C3AED] shadow-[#6C4FE0]/50 ring-4 ring-white dark:ring-slate-900 scale-105'
                      : 'bg-gradient-to-tr from-[#6C4FE0] to-[#7C3AED] shadow-[#6C4FE0]/40 ring-4 ring-white dark:ring-slate-900 group-hover:scale-105'
                      }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-[10px] mt-0.5 font-extrabold transition-colors ${isActive ? 'text-primary dark:text-blue-400 font-black' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                      {tab.label}
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                    navigate(tab.path);
                  }}
                  className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${isActive
                    ? 'text-[#6C4FE0] dark:text-purple-400 font-extrabold scale-105'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  title={tab.label}
                >
                  <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-[#EDE9FE] dark:bg-purple-950/60 shadow-xs' : ''}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] mt-0.5 font-bold tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </>
      )}

      {/* MY PROFILE EDIT MODAL */}
      {isProfileModalOpen && user && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg text-white border border-white/30">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">{user.displayName}</h3>
                  <span className="text-xs font-mono bg-white/20 px-2.5 py-0.5 rounded-full text-blue-100 border border-white/20">
                    Role: {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs">
              {profileSaveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Profile updated successfully!
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Username (Fixed)</label>
                  <input
                    type="text"
                    disabled
                    value={user.username}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Account Role</label>
                  <input
                    type="text"
                    disabled
                    value={user.role}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={profileDisplayName}
                  onChange={(e) => setProfileDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="Your Full Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="operator@sahebpaper.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                  Security PIN (4-Digits) <span className="text-[10px] text-slate-400 font-normal lowercase">(leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={4}
                    value={profilePin}
                    placeholder="•••• (Unchanged)"
                    onChange={(e) => setProfilePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Security Question</label>
                  <select
                    value={profileSecurityQuestion}
                    onChange={(e) => setProfileSecurityQuestion(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  >
                    <option value="What is your favorite color?">What is your favorite color?</option>
                    <option value="What is your pet's name?">What is your pet's name?</option>
                    <option value="What town were you born in?">What town were you born in?</option>
                    <option value="What is your favorite food?">What is your favorite food?</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Security Answer</label>
                  <input
                    type="text"
                    value={profileSecurityAnswer}
                    onChange={(e) => setProfileSecurityAnswer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="Answer for PIN recovery"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Privacy Policy & Data Consent Modals */}
      <PrivacyConsentModal />
      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyModalOpen}
        onClose={() => setIsPrivacyPolicyModalOpen(false)}
      />
      <AppUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />

    </div>
  );
};
export default Layout;
