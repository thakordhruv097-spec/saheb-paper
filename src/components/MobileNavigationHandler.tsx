import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { popTopModal } from '../hooks/useMobileBackHandler';

// Hierarchical Parent Fallback Routing Table
// If browser history is at the start of a session, Android Back falls back to these parent modules:
const PARENT_ROUTE_MAP: Record<string, string> = {
  // Dispatch sub-modules -> Dispatch
  '/dispatch-receipt': '/dispatch',
  '/dispatch-receipt/draft-packing-slip': '/dispatch',
  '/dispatch-receipt/packing-slips-&-challans': '/dispatch',
  '/dispatch-receipt/dispatched-reels': '/dispatch',
  '/dispatch-receipt/qr-scanner': '/dispatch',
  '/finished-stock-dispatch': '/dispatch',

  // Production sub-modules -> Machine Production
  '/utilities-&-etp/boiler-operations': '/machine-production',
  '/utilites-&-etp/boiler-operations': '/machine-production',
  '/utilities-&-etp/etp-water-&-chemicals': '/machine-production',
  '/utilities-&-etp/electricity-&-power-grid': '/machine-production',
  '/utilities-&-etp/ro-plant-water-treatment': '/machine-production',
  '/utilities-&-etp': '/machine-production',
  '/utilites-&-etp': '/machine-production',
  '/pulp-mill-operations': '/machine-production',
  '/rewinding-reel-conversion': '/machine-production',
  '/lab': '/machine-production',

  // QR sub-modules -> QR Scanner / Home
  '/traceability': '/qr-scanner',
  '/qr-traceability': '/qr-scanner',
  '/qr-scanner': '/',

  // Admin & Management sub-modules -> Profile / Home
  '/role-management': '/profile',
  '/user-management': '/profile',
  '/company-settings': '/profile',
  '/label-studio': '/dispatch',

  // Top level modules -> Home
  '/dispatch': '/',
  '/machine-production': '/',
  '/store': '/',
  '/reports': '/',
  '/orders': '/',
  '/raw-material-stock': '/',
  '/profile': '/',
};

export const MobileNavigationHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPressTime = useRef<number>(0);
  const [showExitToast, setShowExitToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Internal session route stack tracker
  const routeStack = useRef<string[]>([]);

  useEffect(() => {
    const current = location.pathname;
    const last = routeStack.current[routeStack.current.length - 1];
    if (last !== current) {
      routeStack.current.push(current);
    }
  }, [location.pathname]);

  useEffect(() => {
    let capListenerHandle: { remove: () => void } | null = null;

    const setupListener = async () => {
      try {
        capListenerHandle = await CapApp.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
          handleAndroidBackButton(canGoBack);
        });
      } catch {
        // Non-Capacitor / web browser environment fallback
      }
    };

    const handleAndroidBackButton = (canGoBack?: boolean) => {
      // 1. Priority 1: Check if any modal, drawer, or dialog is currently open
      if (popTopModal()) {
        return;
      }

      const currentPath = location.pathname;
      const isRoot = currentPath === '/' || currentPath === '/login';

      // 2. Priority 2: If inside any nested route or sub-module
      if (!isRoot) {
        // If internal stack has prior history, navigate back
        if (routeStack.current.length > 1) {
          routeStack.current.pop(); // remove current
          const previousRoute = routeStack.current[routeStack.current.length - 1];
          if (previousRoute && previousRoute !== currentPath) {
            navigate(previousRoute);
            return;
          }
        }

        // Browser history fallback
        if (canGoBack || window.history.length > 1) {
          navigate(-1);
          return;
        }

        // Fallback to logical parent route
        const parentRoute = PARENT_ROUTE_MAP[currentPath] || '/';
        navigate(parentRoute);
        return;
      }

      // 3. Priority 3: User is at genuine ROOT screen ('/' or '/login')
      const now = Date.now();
      if (now - lastBackPressTime.current < 2000) {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setShowExitToast(false);
        try {
          CapApp.exitApp();
        } catch {
          // Ignore
        }
      } else {
        lastBackPressTime.current = now;
        setShowExitToast(true);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
          setShowExitToast(false);
        }, 2000);
      }
    };

    // Popstate fallback for standard browser back
    const handlePopState = () => {
      if (popTopModal()) {
        // Modal was closed, keep current route
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);
    setupListener();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (capListenerHandle) {
        capListenerHandle.remove();
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [location.pathname, navigate]);

  if (!showExitToast) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
      <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-2xl backdrop-blur-md border border-slate-700/50 flex items-center gap-2">
        <span>Press back again to exit</span>
      </div>
    </div>
  );
};

export default MobileNavigationHandler;
