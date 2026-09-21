import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { useDateFilter } from '../context/DateFilterContext';
import { CustomDatePickerModal } from './CustomDatePickerModal';
import { PrivacyConsentModal } from './PrivacyConsentModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { AppUpdateModal } from './AppUpdateModal';
import { AutoLockModal } from './AutoLockModal';
import { MobileToast, type ToastMessage } from './MobileToast';
import { getStoredTheme, applyTheme } from '../utils/themeHelper';
import { APP_VERSION } from '../config/version';
import { checkServerVersion, getInstalledVersionCode, isVersionDismissed, isUpdateAvailable, type AppVersionInfo } from '../services/appUpdateService';
import { isAndroidDevice, isMobileDevice } from '../utils/deviceHelper';
import { playNotificationSound } from '../utils/notificationSound';
import { useBodyScrollLock, resetAllScrollLocks } from '../hooks/useBodyScrollLock';
import { useMobileBackHandler } from '../hooks/useMobileBackHandler';
import { useDataSync } from '../hooks/useDataSync';
import { syncAllTables } from '../lib/supabaseSync';
import { getRawMaterials, getReels, getPendingOrders, getParties, getUsers, getAccountLockInfo, getLogs } from '../data/index';
import { HardDrive, ShieldAlert } from 'lucide-react';
import {
  LayoutDashboard,
  LayoutGrid,
  Warehouse,
  Home,
  Factory,
  Building2,
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
  RefreshCw,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, hasAccess, updateUserProfile, isSimulating, exitSimulation } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState<boolean>(() => getStoredTheme());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const dataSync = useDataSync();
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);

  const handleGlobalDataRefresh = async () => {
    if (isGlobalRefreshing) return;
    setIsGlobalRefreshing(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
      await syncAllTables(true);
      window.dispatchEvent(new CustomEvent('saheb_data_updated', {
        detail: { tables: ['all'], table: 'all' }
      }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('[Layout] Manual data refresh error:', e);
    } finally {
      setTimeout(() => {
        setIsGlobalRefreshing(false);
      }, 600);
    }
  };

  // Dropdown states for mobile compatibility
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  // Global Date & Timeframe Filter Context (Only active for Admin & Management)
  const { timeframe, setTimeframe, selectedDate, setSelectedDate, handlePrevDate, handleNextDate, systemToday } = useDateFilter();
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);
  const [isMobileDatePickerOpen, setIsMobileDatePickerOpen] = useState(false);

  // Profile, Privacy & Update Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPrivacyPolicyModalOpen, setIsPrivacyPolicyModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const [availableUpdate, setAvailableUpdate] = useState<AppVersionInfo | null>(null);
  const [updateToast, setUpdateToast] = useState<ToastMessage | null>(null);
  const lastSoundVersionRef = useRef<number | null>(null);

  // Automatic background update detection on application launch & periodic intervals
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const info = await checkServerVersion();
        if (info && isUpdateAvailable(info)) {
          // Register an active in-app notification under the Bell icon
          setAvailableUpdate(info);

          // Play sound and display on-screen alert once per version
          const soundKey = `saheb_update_sound_played_v${info.versionCode}`;
          const alreadyPlayed = sessionStorage.getItem(soundKey) || lastSoundVersionRef.current === info.versionCode;
          if (!alreadyPlayed) {
            sessionStorage.setItem(soundKey, 'true');
            lastSoundVersionRef.current = info.versionCode;
            playNotificationSound();
            setUpdateToast({
              id: `update-${info.versionCode}`,
              type: 'info',
              title: `Update Available: v${info.version}`,
              message: 'New version ready. Tap to view & install.',
              duration: 9000,
            });
            // Automatically open update modal so worker sees it directly!
            setIsUpdateModalOpen(true);
          }
        }
      } catch (e) {
        console.warn('[Layout] Background update check:', e);
      }
    };

    const timer = setTimeout(checkUpdates, 1000);
    const interval = setInterval(checkUpdates, 10000);

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', checkUpdates);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', checkUpdates);
    };
  }, []);

  // Security & Storage In-App Alerts (Admin Only)
  const [bruteForceAlert, setBruteForceAlert] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('saheb_brute_force_alert');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [storageUsagePercent, setStorageUsagePercent] = useState<number>(() => {
    try {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) totalBytes += (localStorage.getItem(key) || '').length * 2;
      }
      return Math.min(100, Math.round((totalBytes / 5242880) * 100));
    } catch {
      return 0;
    }
  });

  const [lockedAccountsCount, setLockedAccountsCount] = useState<number>(() => {
    try {
      const allUsers = getUsers();
      return allUsers.filter(u => getAccountLockInfo(u.username).isLocked).length;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const raw = localStorage.getItem('saheb_brute_force_alert');
        setBruteForceAlert(raw ? JSON.parse(raw) : null);

        let totalBytes = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) totalBytes += (localStorage.getItem(key) || '').length * 2;
        }
        setStorageUsagePercent(Math.min(100, Math.round((totalBytes / 5242880) * 100)));

        const allUsers = getUsers();
        setLockedAccountsCount(allUsers.filter(u => getAccountLockInfo(u.username).isLocked).length);
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('saheb_data_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('saheb_data_updated', handleStorageUpdate);
    };
  }, []);

  const handleDismissBruteForceAlert = () => {
    localStorage.removeItem('saheb_brute_force_alert');
    localStorage.removeItem('saheb_failed_pin_count');
    setBruteForceAlert(null);
  };

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

  const [showBottomNav, setShowBottomNav] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLElement | null>(null);
  const headerDatePickerRef = useRef<HTMLDivElement | null>(null);
  const mobileDatePickerRef = useRef<HTMLDivElement | null>(null);

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
    resetAllScrollLocks();

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

  // Define Ordered Mobile Tabs (Home -> Production / Store -> Dispatch -> More)
  const mobileTabs = useMemo(() => {
    const isStoreRole = user?.role === 'StoreManager' || user?.role === 'Shopper';

    let prodPath = '/machine-production';
    if (hasAccess('machine_production')) prodPath = '/machine-production';
    else if (hasAccess('pulp_mill_operations')) prodPath = '/pulp-mill-operations';
    else if (hasAccess('rewinding_reel_conversion')) prodPath = '/rewinding-reel-conversion';
    else if (hasAccess('lab')) prodPath = '/lab';
    else if (hasAccess('boiler')) prodPath = '/utilities-&-etp/boiler-operations';
    else if (hasAccess('etp')) prodPath = '/utilities-&-etp/etp-water-&-chemicals';
    else if (hasAccess('raw_material_stock')) prodPath = '/raw-material-stock';

    const secondTab = isStoreRole
      ? {
          id: 'store',
          path: '/spareparts-management',
          label: 'Store',
          icon: Wrench,
          aliases: ['/spareparts-management'],
        }
      : {
          id: 'production',
          path: prodPath,
          label: 'Production',
          icon: Factory,
          aliases: [
            '/machine-production',
            '/pulp-mill-operations',
            '/rewinding-reel-conversion',
            '/utilities-etp',
            '/utilities-&-etp',
            '/utilites-&-etp',
            '/utilities-&-etp/boiler-operations',
            '/utilites-&-etp/boiler-operations',
            '/utilities-&-etp/etp-water-&-chemicals',
            '/utilities-&-etp/electricity-&-power-grid',
            '/lab',
            '/raw-material-stock',
          ],
        };

    const moreAliases = [
      '/profile',
      '/admin-profile',
      '/role-management',
      '/user-management',
      '/monthly-yearly-reporting',
      '/label-studio',
      '/company-settings',
      '/company-plant-settings',
      '/admin-panel-audit',
    ];
    if (!isStoreRole) {
      moreAliases.push('/spareparts-management');
    }

    return [
      { id: 'home', path: '/', label: 'Home', icon: LayoutDashboard, aliases: ['/dashboard'] },
      secondTab,
      {
        id: 'dispatch',
        path: '/dispatch-receipt/draft-packing-slip',
        label: 'Dispatch',
        icon: Truck,
        aliases: [
          '/dispatch-receipt/draft-packing-slip',
          '/dispatch-receipt/packing-slips-&-challans',
          '/dispatch-receipt/dispatched-reels',
          '/dispatch-receipt/qr-scanner',
          '/dispatch-receipt',
          '/finished-stock-dispatch',
          '/stock-categorization',
          '/orders',
          '/qr-scanner',
          '/traceability',
          '/qr-traceability',
        ],
      },
      {
        id: 'more',
        path: '/profile',
        label: 'More',
        icon: User,
        aliases: moreAliases,
      },
    ];
  }, [user, hasAccess]);

  // Current Active Tab Index (0 to 3, or -1 if no match)
  const activeTabIndex = useMemo(() => {
    const currentPath = location.pathname;

    // 1. Root / Dashboard exact check
    if (currentPath === '/' || currentPath === '/dashboard') {
      const homeIdx = mobileTabs.findIndex(t => t.id === 'home');
      return homeIdx !== -1 ? homeIdx : 0;
    }

    // 2. Direct path match (excluding root)
    for (let i = 0; i < mobileTabs.length; i++) {
      const tab = mobileTabs[i];
      if (tab.id !== 'home') {
        const cleanTabPath = tab.path.split('?')[0];
        if (currentPath === cleanTabPath || currentPath.startsWith(cleanTabPath + '/')) {
          return i;
        }
      }
    }

    // 3. Alias match (exact or prefix match for nested sub-routes)
    for (let i = 0; i < mobileTabs.length; i++) {
      const tab = mobileTabs[i];
      if (tab.id !== 'home' && tab.aliases) {
        for (const alias of tab.aliases) {
          const cleanAlias = alias.split('?')[0];
          if (cleanAlias && cleanAlias !== '/') {
            if (currentPath === cleanAlias || currentPath.startsWith(cleanAlias + '/') || currentPath.startsWith(cleanAlias)) {
              return i;
            }
          }
        }
      }
    }

    // 4. Do NOT default to Home if unmatched
    return -1;
  }, [location.pathname, mobileTabs]);


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

  // Intercept Android & Browser Back buttons to close open mobile modals/drawers first
  useMobileBackHandler(mobileMenuOpen, () => setMobileMenuOpen(false), 'mobileMenuDrawer');
  useMobileBackHandler(isProfileModalOpen, () => setIsProfileModalOpen(false), 'profileEditModal');
  useMobileBackHandler(isDatePickerModalOpen, () => setIsDatePickerModalOpen(false), 'datePickerModal');
  useMobileBackHandler(isMobileDatePickerOpen, () => setIsMobileDatePickerOpen(false), 'mobileDatePickerModal');
  useMobileBackHandler(isPrivacyPolicyModalOpen, () => setIsPrivacyPolicyModalOpen(false), 'privacyPolicyModal');
  useMobileBackHandler(isUpdateModalOpen, () => setIsUpdateModalOpen(false), 'updateModal');

  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

  // Computes comprehensive reactive alert notifications
  const rawNotifications = useMemo(() => {
    const list: {
      id: string;
      type: 'stock' | 'qc' | 'order' | 'update' | 'security' | 'storage' | 'audit';
      title: string;
      desc: string;
    }[] = [];

    // 1. In-App System Update Alert (All Devices: Android, iOS, Desktop)
    if (availableUpdate) {
      list.unshift({
        id: `app-update-${availableUpdate.versionCode}`,
        type: 'update',
        title: `Update Available: v${availableUpdate.version}`,
        desc: `A new version of Saheb Paper ERP is ready. Tap here to review & install.`,
      });
    }

    // 2. Security Brute-Force & Account Lockout Alert
    if (bruteForceAlert) {
      list.unshift({
        id: 'brute-force-alert-banner',
        type: 'security',
        title: `🚨 Brute Force Security Alert`,
        desc: `Multiple unauthorized PIN login failures detected on ${bruteForceAlert.username || 'user account'} (${bruteForceAlert.attempts || 5} attempts). Review user access now.`,
      });
    }

    try {
      const allUsers = getUsers();
      allUsers.forEach(u => {
        const lockInfo = getAccountLockInfo(u.username);
        if (lockInfo.isLocked) {
          list.unshift({
            id: `lock-${u.username}`,
            type: 'security',
            title: `🔒 Account Locked: ${u.displayName || u.username}`,
            desc: `Locked for ${lockInfo.remainingMinutes}m due to failed attempts. Click to view & unlock.`,
          });
        }
      });
    } catch (e) {
      console.error(e);
    }

    // 3. Storage Warning (80%+ usage)
    if (storageUsagePercent >= 80) {
      list.unshift({
        id: 'storage-warning-80',
        type: 'storage',
        title: `⚠️ Database Storage Warning: ${storageUsagePercent}% Full`,
        desc: `Local database storage is at ${storageUsagePercent}% capacity. Please export a backup or clean old records to prevent data loss.`,
      });
    }

    // 4. Low Stock Thresholds (Raw Materials)
    try {
      const materials = getRawMaterials();
      materials.forEach(m => {
        if (m.active !== false && m.stock <= m.minThreshold) {
          list.push({
            id: `stock-${m.id}`,
            type: 'stock',
            title: `Low Stock: ${m.name}`,
            desc: `Current: ${m.stock >= 1000 ? `${(m.stock / 1000).toFixed(2)} Tons (${m.stock.toLocaleString()} kg)` : `${m.stock.toLocaleString()} kg`} (Min: ${m.minThreshold.toLocaleString()} kg)`,
          });
        }
      });
    } catch (e) {
      console.error(e);
    }

    // 5. QC Pending Backlog (>24 hours)
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

    // 6. Pending Orders Approaching (within 3 days)
    try {
      const orders = getPendingOrders();
      const parties = getParties();
      const threeDaysFromNow = Date.now() + 3 * 24 * 60 * 60 * 1000;
      orders.forEach(o => {
        if (o.status === 'PENDING' || o.status === 'PARTIAL') {
          const dueTime = new Date(o.dueDate).getTime();
          if (!isNaN(dueTime) && dueTime <= threeDaysFromNow) {
            const daysLeft = Math.ceil((dueTime - Date.now()) / (24 * 60 * 60 * 1000));
            const party = parties.find(p => p.id === o.partyId);
            list.push({
              id: `order-${o.id}`,
              type: 'order',
              title: `Delivery Due Soon: ${party?.name || 'Order #' + o.id}`,
              desc: `Due date is ${o.dueDate} (${daysLeft <= 0 ? 'Due today' : `${daysLeft} days left`})`,
            });
          }
        }
      });
    } catch (e) {
      console.error(e);
    }

    // 7. Recent High-Impact Master & Security Audit Logs for Admin/Management (< 24h)
    try {
      const recentLogs = getLogs();
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const criticalLogs = recentLogs.filter(l => {
        const logTime = new Date(l.timestamp).getTime();
        return !isNaN(logTime) && (now - logTime) < twentyFourHours && (
          l.module === 'Security' ||
          l.module === 'Admin' ||
          l.action.toLowerCase().includes('delete') ||
          l.action.toLowerCase().includes('unlock') ||
          l.action.toLowerCase().includes('reset') ||
          l.action.toLowerCase().includes('role')
        );
      }).slice(0, 3);

      criticalLogs.forEach(l => {
        list.push({
          id: `audit-${l.id}`,
          type: 'audit',
          title: `Audit: ${l.action}`,
          desc: `${l.details} (by ${l.user})`,
        });
      });
    } catch (e) {
      console.error(e);
    }

    return list;
  }, [location.pathname, availableUpdate, dataSync, bruteForceAlert, storageUsagePercent, lockedAccountsCount]);

  const activeNotifications = useMemo(() => {
    return rawNotifications
      .filter(n => !dismissedNotificationIds.includes(n.id))
      .filter(n => {
        if (n.type === 'update') return true;
        if (!user) return false;
        if (user.role === 'Admin' || user.role === 'Management') return true;
        // Operators only see notifications relevant to their specific role/access
        if (n.type === 'security' || n.type === 'storage' || n.type === 'audit') return false;
        if (n.type === 'stock') return hasAccess('raw_material_stock');
        if (n.type === 'qc') return hasAccess('machine_production') || hasAccess('rewinding_reel_conversion');
        if (n.type === 'order') return hasAccess('finished_stock_dispatch') || hasAccess('orders');
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
  };

  // Synchronize Dark Mode across all components and windows
  useEffect(() => {
    const syncThemeFromStorage = () => {
      const isDark = getStoredTheme();
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    const handleThemeEvent = (e: any) => {
      if (e?.detail?.isDark !== undefined) {
        setDarkMode(e.detail.isDark);
      } else {
        syncThemeFromStorage();
      }
    };

    window.addEventListener('saheb_theme_changed', handleThemeEvent);
    window.addEventListener('storage', syncThemeFromStorage);
    return () => {
      window.removeEventListener('saheb_theme_changed', handleThemeEvent);
      window.removeEventListener('storage', syncThemeFromStorage);
    };
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    applyTheme(nextTheme);
  };

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

  const isMobileHome = location.pathname === '/' || location.pathname === '/dashboard';

  const currentMobilePageTitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/label-studio')) return 'Label Studio';
    if (path.startsWith('/raw-material-stock')) return 'Raw Material Stock';
    if (path.startsWith('/pulp-mill-operations')) return 'Pulp Mill Operations';
    if (path.startsWith('/machine-production')) return 'Machine Production';
    if (path.startsWith('/rewinding-reel-conversion')) return 'Rewinder Production';
    if (path === '/lab' || path.startsWith('/lab/')) return 'Lab Quality Control';
    if (path.startsWith('/orders')) return 'Order Bookings';
    if (path.startsWith('/utilities-&-etp') || path.startsWith('/utilites-&-etp') || path.startsWith('/utilities-etp')) return 'Utilities & ETP';
    if (path.startsWith('/dispatch-receipt')) return 'Dispatch Receipt';
    if (path.startsWith('/stock-categorization') || path.startsWith('/finished-stock-dispatch')) return 'Stock Categorization';
    if (path.startsWith('/spareparts-management')) return 'Spares Store';
    if (path.startsWith('/monthly-yearly-reporting')) return 'Mill Reports';
    if (path.startsWith('/admin-panel-audit')) return 'Admin Masters';
    if (path.startsWith('/profile')) return 'My Profile';
    if (path.startsWith('/role-management')) return 'Role Management';
    if (path.startsWith('/user-management')) return 'User Management';
    if (path.startsWith('/company-settings')) return 'Company Settings';
    if (path.startsWith('/qr-scanner')) return 'QR Scanner';
    if (path.startsWith('/traceability') || path.startsWith('/qr-traceability')) return 'QR Traceability';

    const matched = menuItems.find(m => m.path === path || (path.startsWith(m.path) && m.path !== '/'));
    if (matched) return matched.label;
    const cleanSegment = path.split('/').filter(Boolean).pop();
    if (cleanSegment) {
      return cleanSegment.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    return 'ERP System';
  }, [location.pathname, menuItems]);

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light-primary dark:text-slate-100 flex flex-col transition-colors duration-200 w-full max-w-full">

      {/* Simulation Banner - Displays whenever Admin is simulating a worker */}
      {isSimulating && (
        <div className={`sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-3 sm:px-5 py-2 text-xs font-bold flex items-center justify-between shadow-lg backdrop-blur-md transition-all w-full max-w-full min-w-0 ${
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
              const returnRoute = localStorage.getItem('saheb_sim_return_route') || '/role-management';
              localStorage.removeItem('saheb_sim_return_route');
              navigate(returnRoute, { replace: true });
            }}
            className="ml-3 px-3.5 py-1 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-black shadow-md transition active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Exit Simulation</span>
          </button>
        </div>
      )}

      {/* 1. Header (Common across all sizes) - Seamless background matching page without white partition bar */}
      <header className={`sticky top-0 z-30 bg-bg-light/95 dark:bg-bg-dark/95 text-slate-900 dark:text-white backdrop-blur-md h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 transition-all duration-300 w-full max-w-full min-w-0 ${user ? 'md:ml-[268px] md:w-[calc(100%-268px)]' : 'w-full'
        } ${showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}>

        {/* Left Side Logo & Navigation */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
          {user && (
            isMobileHome ? (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white md:hidden transition shadow-[3px_3px_8px_rgba(163,163,196,0.18),-3px_-3px_8px_rgba(255,255,255,0.95)] dark:shadow-none shrink-0 cursor-pointer"
                aria-label="Toggle Menu"
                title="Toggle Menu"
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
            ) : (
              <button
                onClick={() => {
                  if (mobileMenuOpen) {
                    setMobileMenuOpen(false);
                  } else {
                    navigate(-1);
                  }
                }}
                className="p-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white md:hidden transition shadow-[3px_3px_8px_rgba(163,163,196,0.18),-3px_-3px_8px_rgba(255,255,255,0.95)] dark:shadow-none shrink-0 cursor-pointer"
                aria-label="Go Back"
                title="Go Back"
              >
                <ChevronLeft className="h-5 w-5 text-[#6C4FE0] dark:text-purple-400 stroke-[2.5]" />
              </button>
            )
          )}

          {/* Mobile Home: Saheb Logo + Company Name + ERP Badge + Subtitle */}
          {isMobileHome ? (
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
          ) : (
            /* Mobile Internal / Work Screens: Compact current Page/Screen Title */
            <div className="flex md:hidden items-center min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight tracking-tight font-heading truncate">
                {currentMobilePageTitle}
              </h2>
            </div>
          )}
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

            {/* Date Stepper Sub-controls (< 2026-08-19 [Calendar] >) inside the SAME pill */}
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

          {/* 3. Circular Dark/Light Mode Toggle Button (Desktop only) */}
          <button
            onClick={handleToggleTheme}
            className="hidden md:flex w-9 h-9 rounded-full bg-white dark:bg-[#131d38] items-center justify-center shadow-[3px_3px_8px_rgba(163,163,196,0.18),-3px_-3px_8px_rgba(255,255,255,0.95)] dark:shadow-none text-slate-600 dark:text-amber-300 hover:scale-105 transition cursor-pointer shrink-0"
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {/* 4. Circular Global Data Refresh & Cloud Sync Button (Desktop and Mobile) */}
          <button
            type="button"
            onClick={handleGlobalDataRefresh}
            disabled={isGlobalRefreshing}
            className="w-9 h-9 rounded-full bg-white dark:bg-[#131d38] flex items-center justify-center shadow-[3px_3px_8px_rgba(163,163,196,0.18),-3px_-3px_8px_rgba(255,255,255,0.95)] dark:shadow-none text-slate-600 dark:text-slate-200 hover:text-primary dark:hover:text-purple-400 hover:scale-105 active:scale-95 transition cursor-pointer shrink-0 disabled:opacity-75"
            title="Refresh App & Sync Cloud Data"
            aria-label="Refresh App Data"
          >
            <RefreshCw className={`h-4 w-4 ${isGlobalRefreshing ? 'animate-spin text-primary dark:text-purple-400' : ''}`} />
          </button>

          {/* Mobile Calendar Quick Selector (Visible only on Mobile Home tab, beside Bell icon) */}
          {isMobileHome && (
            <div className="relative shrink-0 md:hidden" ref={mobileDatePickerRef}>
              <button
                type="button"
                onClick={() => setIsMobileDatePickerOpen(prev => !prev)}
                className="w-9 h-9 rounded-full bg-white dark:bg-[#131d38] flex items-center justify-center shadow-[3px_3px_8px_rgba(163,163,196,0.18),-3px_-3px_8px_rgba(255,255,255,0.95)] dark:shadow-none text-slate-600 dark:text-slate-200 relative hover:scale-105 transition cursor-pointer"
                title="Select Date"
              >
                <Calendar className="h-4 w-4 text-[#6C4FE0] dark:text-purple-400" />
                {selectedDate !== systemToday && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#131d38]"></span>
                )}
              </button>

              {isMobileDatePickerOpen && (
                <CustomDatePickerModal
                  selectedDate={selectedDate}
                  onSelectDate={(newDateStr) => {
                    setSelectedDate(newDateStr);
                    setIsMobileDatePickerOpen(false);
                  }}
                  onClose={() => setIsMobileDatePickerOpen(false)}
                  align="right"
                  triggerRef={mobileDatePickerRef}
                />
              )}
            </div>
          )}

          {/* 4. Circular Notifications Bell Button (Visible on Desktop always, on Mobile only on Home tab) */}
          <div className={`relative shrink-0 ${isMobileHome ? 'flex' : 'hidden md:flex'}`}>
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
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setBellOpen(false)}
                />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 bg-white dark:bg-[#131d38] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-2xl py-2 sm:py-3 w-[calc(100vw-24px)] max-w-sm sm:w-88 z-50 max-h-[55vh] sm:max-h-96 flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-3.5 sm:px-4 pb-2 sm:pb-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Alerts & Notifications</span>
                    {activeNotifications.length > 0 ? (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[11px] sm:text-xs font-extrabold text-primary dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    ) : (
                      <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-800">Healthy</span>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto custom-scrollbar">
                    {activeNotifications.length === 0 ? (
                      <div className="p-4 sm:p-6 text-center text-xs text-slate-500 dark:text-slate-300 font-medium">
                        System healthy. No active alerts.
                      </div>
                    ) : (
                      activeNotifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setBellOpen(false);
                            if (n.type === 'update' || n.id.startsWith('app-update-')) {
                              setIsUpdateModalOpen(true);
                            } else if (n.type === 'security') {
                              navigate('/user-management');
                            } else if (n.type === 'storage' || n.type === 'audit') {
                              navigate('/admin-panel-audit');
                            } else if (n.type === 'stock') {
                              navigate('/raw-material-stock');
                            } else if (n.type === 'qc') {
                              navigate('/lab');
                            } else if (n.type === 'order') {
                              navigate('/orders');
                            }
                          }}
                          className={`p-2.5 sm:p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left space-y-1 relative group cursor-pointer ${
                            n.type === 'update' ? 'bg-purple-50/50 dark:bg-purple-950/20' :
                            n.type === 'security' ? 'bg-rose-50/50 dark:bg-rose-950/20' :
                            n.type === 'storage' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                              <span className={`h-2 w-2 rounded-full shrink-0 ${
                                n.type === 'security' ? 'bg-rose-500 animate-pulse ring-2 ring-rose-300 dark:ring-rose-800' :
                                n.type === 'storage' ? 'bg-amber-500 ring-2 ring-amber-300 dark:ring-amber-700' :
                                n.type === 'stock' ? 'bg-amber-500' :
                                n.type === 'qc' ? 'bg-purple-500' :
                                n.type === 'order' ? 'bg-blue-500' :
                                n.type === 'audit' ? 'bg-indigo-500' :
                                n.type === 'update' ? 'bg-[#6C4FE0] animate-pulse ring-2 ring-purple-300 dark:ring-purple-700' :
                                'bg-slate-500'
                              }`}></span>
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight break-words">{n.title}</span>
                            </div>
                            <button
                              onClick={(e) => dismissNotification(n.id, e)}
                              className="p-1 rounded text-slate-400 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shrink-0 transition -mr-1"
                              title="Dismiss alert"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 pl-3.5 sm:pl-4 leading-relaxed pr-1 font-normal break-words">{n.desc}</p>
                          {n.type === 'update' && (
                            <div className="pl-3.5 sm:pl-4 pt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                Tap here to open Update Center &rarr;
                              </span>
                            </div>
                          )}
                          {n.type === 'security' && (
                            <div className="pl-3.5 sm:pl-4 pt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                View &amp; Unlock Users &rarr;
                              </span>
                            </div>
                          )}
                          {n.type === 'storage' && (
                            <div className="pl-3.5 sm:pl-4 pt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                Open Storage &amp; Backup &rarr;
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 5. User Profile Capsule Pill (Desktop only) */}
          {user && (
            <div className="hidden md:block relative shrink-0">
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
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                  <div className="bg-white dark:bg-[#131d38] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-2xl overflow-hidden py-1.5 w-60 sm:w-64 font-sans">
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

                    {(user.role === 'Admin' || user.role === 'Management' || hasAccess('admin_panel_audit')) && (
                      <button
                        onClick={() => {
                          navigate('/company-settings');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-left transition border-b border-slate-100 dark:border-slate-800 cursor-pointer"
                      >
                        <Building2 className="h-4 w-4 text-[#5E3BE8] dark:text-purple-400" />
                        <span>Company & Plant Settings</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setIsUpdateModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-left transition border-b border-slate-100 dark:border-slate-800 cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4 text-[#2563EB] dark:text-blue-400" />
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
              </>
            )}
            </div>
          )}

        </div>
      </header>

      <div className="flex flex-1 relative">
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

            {/* Desktop Sidebar Bottom Controls */}
            <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80 shrink-0 select-none">
              <button
                type="button"
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-red-50/80 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-[11.5px] uppercase tracking-wider border border-red-200/70 dark:border-red-800/60 transition cursor-pointer shadow-2xs hover:dark:bg-red-900/60"
                title="Logout of Account"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>

          </aside>
        )}

        {/* 3. Main content area */}
        <main
          ref={mainRef}
          className={`flex-1 flex flex-col pb-32 md:pb-6 relative w-full max-w-full min-w-0 ${user ? 'md:ml-[268px] md:w-[calc(100%-268px)]' : 'w-full'
            }`}
        >
          {/* Admin Security Brute-Force / Locked Account Alert Banner */}
          {user?.role === 'Admin' && (bruteForceAlert || lockedAccountsCount > 0) && (
            <div className="mx-2.5 sm:mx-4 lg:mx-6 mt-3 p-3.5 bg-rose-500/15 border-2 border-rose-500/80 rounded-2xl flex items-center justify-between gap-3 text-rose-800 dark:text-rose-200 shadow-md animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
                <div className="text-xs font-semibold leading-snug">
                  {bruteForceAlert ? (
                    <>
                      <strong className="font-bold">Security Alert:</strong> {bruteForceAlert.attempts || 5}+ failed PIN attempts detected for <span className="font-mono font-bold">@{bruteForceAlert.username || 'user'}</span>. Account is LOCKED.
                    </>
                  ) : (
                    <>
                      <strong className="font-bold">Security Alert:</strong> {lockedAccountsCount} user {lockedAccountsCount === 1 ? 'account is' : 'accounts are'} currently locked due to failed PIN attempts.
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs active:scale-95"
                >
                  Unlock / Manage
                </button>
                {bruteForceAlert && (
                  <button
                    type="button"
                    onClick={handleDismissBruteForceAlert}
                    className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 rounded-lg cursor-pointer"
                    title="Dismiss Alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Admin 80% Database Storage Warning Alert Banner */}
          {user?.role === 'Admin' && storageUsagePercent >= 80 && (
            <div className="mx-2.5 sm:mx-4 lg:mx-6 mt-3 p-3 bg-amber-500/15 border border-amber-500/60 rounded-2xl flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <HardDrive className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="text-xs font-semibold leading-snug">
                  <strong className="font-bold">Storage Warning:</strong> Application storage is at <span className="font-mono font-bold">{storageUsagePercent}%</span> capacity. Please download a backup from Admin Masters.
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin-panel-audit')}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shrink-0"
              >
                Backup
              </button>
            </div>
          )}

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
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsUpdateModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200/80 dark:border-blue-900/50 transition cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
          <div className={`fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-light/95 via-bg-light/60 to-transparent dark:from-bg-dark/95 dark:via-bg-dark/60 dark:to-transparent pointer-events-none z-30 md:hidden print:hidden transition-all duration-300 ${showBottomNav ? 'opacity-100' : 'opacity-0'
            }`} />
          {/* 4-TAB SYNCHRONIZED MOBILE BOTTOM NAVIGATION */}
          <nav className={`fixed bottom-3 left-3 right-3 max-w-[calc(100vw-24px)] mx-auto h-16 bg-white/95 dark:bg-[#131d38]/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl flex md:hidden items-center justify-around px-1.5 z-40 select-none overflow-hidden print:hidden transition-all duration-300 ease-in-out ${showBottomNav ? 'translate-y-0 opacity-100' : 'translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none'
            }`}>
            {mobileTabs.map((tab, idx) => {
              const isActive = activeTabIndex === idx;
              const Icon = tab.icon;

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
                    placeholder="sahebpaper@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="8000563666"
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
      <AutoLockModal />

      {/* On-screen Toast Notification with sound when update arrives */}
      {updateToast && (
        <div
          onClick={() => {
            setIsUpdateModalOpen(true);
            setUpdateToast(null);
          }}
          className="cursor-pointer"
        >
          <MobileToast
            toast={updateToast}
            onClose={() => setUpdateToast(null)}
          />
        </div>
      )}

    </div>
  );
};
export default Layout;
