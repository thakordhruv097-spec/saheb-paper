import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';
import { AuthProvider, useAuth } from './modules/auth/AuthContext';
import { ProtectedRoute } from './modules/auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginView } from './modules/auth/LoginView';
import { MobileNavigationHandler } from './components/MobileNavigationHandler';
import { DateFilterProvider } from './context/DateFilterContext';
import { initSupabaseSync } from './data/index';

// Resilient lazy-loading wrapper that automatically recovers if a chunk fails to load due to a new deployment
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  chunkName: string
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error: any) {
      const msg = (error?.message || '').toLowerCase();
      const isChunkError =
        msg.includes('dynamically imported module') ||
        msg.includes('failed to fetch') ||
        msg.includes('importing a module script failed') ||
        msg.includes('loading chunk');

      const storageKey = `saheb_retry_${chunkName}`;
      const hasRetried = sessionStorage.getItem(storageKey);

      if (isChunkError && !hasRetried) {
        sessionStorage.setItem(storageKey, 'true');
        console.warn(`[lazyWithRetry] Failed to load ${chunkName} chunk, reloading page with latest bundle...`);
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}

// ── 5 CANONICAL MODULES + AUTH/PROFILE ──
const RewindingReelConversionView = lazyWithRetry(() => import('./modules/rewinder/RewindingReelConversionView').then(m => ({ default: m.RewindingReelConversionView })), 'RewindingReelConversionView');
const FinishedStockDispatchView = lazyWithRetry(() => import('./modules/dispatch/FinishedStockDispatchView').then(m => ({ default: m.FinishedStockDispatchView })), 'FinishedStockDispatchView');
const DispatchView = lazyWithRetry(() => import('./modules/dispatch/DispatchView').then(m => ({ default: m.DispatchView })), 'DispatchView');
const LabelStudioView = lazyWithRetry(() => import('./modules/label-studio/LabelStudioView').then(m => ({ default: m.LabelStudioView })), 'LabelStudioView');
const AdminMasters = lazyWithRetry(() => import('./modules/admin/AdminMasters').then(m => ({ default: m.AdminMasters })), 'AdminMasters');
const UserManagementView = lazyWithRetry(() => import('./modules/admin/UserManagementView').then(m => ({ default: m.UserManagementView })), 'UserManagementView');
const OperatorProfileView = lazyWithRetry(() => import('./modules/profile/OperatorProfileView').then(m => ({ default: m.OperatorProfileView })), 'OperatorProfileView');
const AdminProfileView = lazyWithRetry(() => import('./modules/profile/AdminProfileView').then(m => ({ default: m.AdminProfileView })), 'AdminProfileView');
const RoleManagementView = lazyWithRetry(() => import('./modules/profile/RoleManagementView').then(m => ({ default: m.RoleManagementView })), 'RoleManagementView');
const MobileProfileView = lazyWithRetry(() => import('./modules/profile/MobileProfileView').then(m => ({ default: m.MobileProfileView })), 'MobileProfileView');

const RouteLoadingFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center p-8">
    <div className="w-8 h-8 border-3 border-[#5E3BE8] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function ProfileRouteWrapper({ defaultTab }: { defaultTab?: 'profile' | 'roles' | 'users' }) {
  const { user } = useAuth();

  if (defaultTab === 'roles') {
    return <RoleManagementView />;
  }
  if (defaultTab === 'users') {
    return user?.role === 'Admin' ? <UserManagementView /> : <OperatorProfileView />;
  }

  return (
    <>
      <div className="block md:hidden w-full">
        <MobileProfileView />
      </div>
      <div className="hidden md:block w-full">
        {user?.role === 'Admin' ? <AdminProfileView /> : <OperatorProfileView />}
      </div>
    </>
  );
}

export default function App() {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        initSupabaseSync();
      }, { timeout: 1500 });
    } else {
      setTimeout(() => {
        initSupabaseSync();
      }, 300);
    }
  }, []);

  return (
    <Router>
      <MobileNavigationHandler />
      <AuthProvider>
        <DateFilterProvider>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<LoginView />} />

              {/* 1. DEFAULT HOME ROUTE -> REWINDER ROLL-TO-REEL */}
              <Route
                path="/"
                element={<Navigate to="/rewinding-reel-conversion" replace />}
              />
              <Route
                path="/dashboard"
                element={<Navigate to="/rewinding-reel-conversion" replace />}
              />

              {/* 2. REWINDER ROLL-TO-REEL (PRIMARY WORKSPACE) */}
              <Route
                path="/rewinding-reel-conversion"
                element={
                  <ProtectedRoute moduleName="rewinding_reel_conversion">
                    <Layout>
                      <RewindingReelConversionView />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* 3. STOCK CATEGORIZATION */}
              <Route
                path="/stock-categorization"
                element={
                  <ProtectedRoute moduleName="finished_stock_dispatch">
                    <Layout>
                      <FinishedStockDispatchView />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/finished-stock-dispatch" element={<Navigate to="/stock-categorization" replace />} />

              {/* 4. DISPATCH RECEIPT */}
              <Route
                path="/dispatch-receipt"
                element={<Navigate to="/dispatch-receipt/draft-packing-slip" replace />}
              />
              <Route
                path="/dispatch-receipt/draft-packing-slip"
                element={
                  <ProtectedRoute moduleName="dispatch_receipt">
                    <Layout>
                      <DispatchView initialTab="create_slip" />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dispatch-receipt/packing-slips-&-challans"
                element={
                  <ProtectedRoute moduleName="dispatch_receipt">
                    <Layout>
                      <DispatchView initialTab="slips_list" />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dispatch-receipt/dispatched-reels"
                element={
                  <ProtectedRoute moduleName="dispatch_receipt">
                    <Layout>
                      <DispatchView initialTab="dispatched_vault" />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* 5. LABEL STUDIO */}
              <Route
                path="/label-studio"
                element={
                  <ProtectedRoute moduleName="label_studio">
                    <Layout>
                      <LabelStudioView />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* 6. ADMIN MASTERS */}
              <Route
                path="/admin-panel-audit"
                element={
                  <ProtectedRoute moduleName="admin_panel_audit">
                    <Layout>
                      <AdminMasters />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* PROFILE & USER MANAGEMENT */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute moduleName="profile">
                    <Layout>
                      <ProfileRouteWrapper />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/role-management"
                element={
                  <ProtectedRoute moduleName="admin_panel_audit">
                    <Layout>
                      <RoleManagementView />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-management"
                element={
                  <ProtectedRoute moduleName="admin_panel_audit">
                    <Layout>
                      <ProfileRouteWrapper defaultTab="users" />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all Fallback: Redirect all removed or unknown routes to Rewinder */}
              <Route path="*" element={<Navigate to="/rewinding-reel-conversion" replace />} />
            </Routes>
          </Suspense>
        </DateFilterProvider>
      </AuthProvider>
    </Router>
  );
}
