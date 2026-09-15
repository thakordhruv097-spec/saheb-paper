import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './modules/auth/AuthContext';
import { ProtectedRoute } from './modules/auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginView } from './modules/auth/LoginView';
import { DateFilterProvider } from './context/DateFilterContext';
import { useAuth } from './modules/auth/AuthContext';

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

// Dynamic route-level code-splitting with deployment resilience
const DashboardView = lazyWithRetry(() => import('./modules/dashboard/DashboardView').then(m => ({ default: m.DashboardView })), 'DashboardView');
const RawMaterialView = lazyWithRetry(() => import('./modules/raw-material/RawMaterialView').then(m => ({ default: m.RawMaterialView })), 'RawMaterialView');
const PulpMillView = lazyWithRetry(() => import('./modules/pulp-mill/PulpMillView').then(m => ({ default: m.PulpMillView })), 'PulpMillView');
const MachineView = lazyWithRetry(() => import('./modules/machine/MachineView').then(m => ({ default: m.MachineView })), 'MachineView');
const RewindingReelConversionView = lazyWithRetry(() => import('./modules/rewinder/RewindingReelConversionView').then(m => ({ default: m.RewindingReelConversionView })), 'RewindingReelConversionView');
const UtilitiesEtpView = lazyWithRetry(() => import('./modules/boiler/UtilitiesEtpView').then(m => ({ default: m.UtilitiesEtpView })), 'UtilitiesEtpView');
const FinishedStockDispatchView = lazyWithRetry(() => import('./modules/dispatch/FinishedStockDispatchView').then(m => ({ default: m.FinishedStockDispatchView })), 'FinishedStockDispatchView');
const StoreView = lazyWithRetry(() => import('./modules/store/StoreView').then(m => ({ default: m.StoreView })), 'StoreView');
const ReportsView = lazyWithRetry(() => import('./modules/reports/ReportsView').then(m => ({ default: m.ReportsView })), 'ReportsView');
const LabelStudioView = lazyWithRetry(() => import('./modules/label-studio/LabelStudioView').then(m => ({ default: m.LabelStudioView })), 'LabelStudioView');
const AdminMasters = lazyWithRetry(() => import('./modules/admin/AdminMasters').then(m => ({ default: m.AdminMasters })), 'AdminMasters');
const CompanySettingsView = lazyWithRetry(() => import('./modules/admin/CompanySettingsView').then(m => ({ default: m.CompanySettingsView })), 'CompanySettingsView');
const UserManagementView = lazyWithRetry(() => import('./modules/admin/UserManagementView').then(m => ({ default: m.UserManagementView })), 'UserManagementView');
const QRScannerView = lazyWithRetry(() => import('./modules/rewinder/QRScannerView').then(m => ({ default: m.QRScannerView })), 'QRScannerView');
const QRTraceabilityView = lazyWithRetry(() => import('./modules/rewinder/QRTraceabilityView').then(m => ({ default: m.QRTraceabilityView })), 'QRTraceabilityView');
const OrdersView = lazyWithRetry(() => import('./modules/orders/OrdersView').then(m => ({ default: m.OrdersView })), 'OrdersView');
const LabView = lazyWithRetry(() => import('./modules/lab/LabView').then(m => ({ default: m.LabView })), 'LabView');
const DispatchView = lazyWithRetry(() => import('./modules/dispatch/DispatchView').then(m => ({ default: m.DispatchView })), 'DispatchView');
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
      {/* Mobile Version: Exact pattern matching the reference screenshot */}
      <div className="block md:hidden w-full">
        <MobileProfileView />
      </div>

      {/* Desktop Version: Full multi-tab dashboard layout */}
      <div className="hidden md:block w-full">
        {user?.role === 'Admin' ? <AdminProfileView /> : <OperatorProfileView />}
      </div>
    </>
  );
}

import './i18n';
import { initSupabaseSync } from './data/index';
import { AppUpdateModal } from './components/AppUpdateModal';

export default function App() {
  React.useEffect(() => {
    initSupabaseSync();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AppUpdateModal />
        <DateFilterProvider>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<LoginView />} />

            {/* Protected Routes inside Layout Shell */}
            <Route
              path="/"
              element={
                <ProtectedRoute moduleName="dashboard">
                  <Layout>
                    <DashboardView />
                  </Layout>
                </ProtectedRoute>
              }
            />

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
              path="/qr-scanner"
              element={
                <ProtectedRoute moduleName="dashboard">
                  <Layout>
                    <QRScannerView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/traceability"
              element={
                <ProtectedRoute moduleName="dashboard">
                  <Layout>
                    <QRTraceabilityView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/raw-material-stock"
              element={
                <ProtectedRoute moduleName="raw_material_stock">
                  <Layout>
                    <RawMaterialView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute moduleName="orders">
                  <Layout>
                    <OrdersView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pulp-mill-operations"
              element={
                <ProtectedRoute moduleName="pulp_mill_operations">
                  <Layout>
                    <PulpMillView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/machine-production"
              element={
                <ProtectedRoute moduleName="machine_production">
                  <Layout>
                    <MachineView />
                  </Layout>
                </ProtectedRoute>
              }
            />

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

            {/* Utilities & ETP Routes */}
            <Route
              path="/utilities-&-etp/boiler-operations"
              element={
                <ProtectedRoute moduleName="utilities_etp">
                  <Layout>
                    <UtilitiesEtpView initialTab="boiler" />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/utilites-&-etp/boiler-operations"
              element={<Navigate to="/utilities-&-etp/boiler-operations" replace />}
            />

            <Route
              path="/utilities-&-etp/etp-water-&-chemicals"
              element={
                <ProtectedRoute moduleName="utilities_etp">
                  <Layout>
                    <UtilitiesEtpView initialTab="etp_chemicals" />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/utilities-&-etp/electricity-&-power-grid"
              element={
                <ProtectedRoute moduleName="utilities_etp">
                  <Layout>
                    <UtilitiesEtpView initialTab="electricity" />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Aliases & Fallbacks */}
            <Route
              path="/utilities-&-etp"
              element={<Navigate to="/utilities-&-etp/boiler-operations" replace />}
            />
            <Route
              path="/utilites-&-etp"
              element={<Navigate to="/utilities-&-etp/boiler-operations" replace />}
            />
            <Route
              path="/utilities-etp"
              element={<Navigate to="/utilities-&-etp/boiler-operations" replace />}
            />
            <Route
              path="/utilities-etp/boiler-operations"
              element={<Navigate to="/utilities-&-etp/boiler-operations" replace />}
            />
            <Route
              path="/utilities-etp/etp-water-&-chemicals"
              element={<Navigate to="/utilities-&-etp/etp-water-&-chemicals" replace />}
            />
            <Route
              path="/utilities-etp/electricity-&-power-grid"
              element={<Navigate to="/utilities-&-etp/electricity-&-power-grid" replace />}
            />

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

            <Route
              path="/spareparts-management"
              element={
                <ProtectedRoute moduleName="spareparts_management">
                  <Layout>
                    <StoreView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/lab"
              element={
                <ProtectedRoute moduleName="lab">
                  <Layout>
                    <LabView />
                  </Layout>
                </ProtectedRoute>
              }
            />

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

            <Route
              path="/monthly-yearly-reporting"
              element={
                <ProtectedRoute moduleName="monthly_yearly_reporting">
                  <Layout>
                    <ReportsView />
                  </Layout>
                </ProtectedRoute>
              }
            />

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

            <Route
              path="/company-settings"
              element={
                <ProtectedRoute moduleName="admin_panel_audit">
                  <Layout>
                    <CompanySettingsView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/company-plant-settings"
              element={<Navigate to="/company-settings" replace />}
            />

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

            <Route
              path="/dispatch-receipt/qr-scanner"
              element={
                <ProtectedRoute moduleName="dispatch_receipt">
                  <Layout>
                    <DispatchView initialTab="qr_scanner" />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dispatch-receipt/packing-slips-and-challans"
              element={<Navigate to="/dispatch-receipt/packing-slips-&-challans" replace />}
            />
            <Route
              path="/dispatch-receipt/packing-slips-challans"
              element={<Navigate to="/dispatch-receipt/packing-slips-&-challans" replace />}
            />
            <Route
              path="/experiment"
              element={<Navigate to="/dispatch-receipt/draft-packing-slip" replace />}
            />
            <Route
              path="/dispatch"
              element={<Navigate to="/dispatch-receipt/draft-packing-slip" replace />}
            />
            <Route
              path="/dispatch_receipt"
              element={<Navigate to="/dispatch-receipt/draft-packing-slip" replace />}
            />
            <Route
              path="/dispatch-receipt/vault"
              element={<Navigate to="/dispatch-receipt/dispatched-reels" replace />}
            />
            <Route
              path="/dispatch-receipt/slips"
              element={<Navigate to="/dispatch-receipt/packing-slips-&-challans" replace />}
            />



            <Route
              path="/user-management"
              element={
                <ProtectedRoute moduleName="admin_panel_audit">
                  <Layout>
                    <UserManagementView />
                  </Layout>
                </ProtectedRoute>
              }
            />


            <Route
              path="/admin-profile"
              element={
                <ProtectedRoute moduleName="admin_panel_audit">
                  <Layout>
                    <AdminProfileView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Wildcard Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </DateFilterProvider>
    </AuthProvider>
  </Router>
  );
}
