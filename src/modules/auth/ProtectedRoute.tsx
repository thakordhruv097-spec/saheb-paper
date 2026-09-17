import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth, getFirstAccessibleRoute } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  moduleName: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, moduleName }) => {
  const { user, hasAccess, isSimulating, exitSimulation } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess(moduleName)) {
    // If navigating to root / dashboard without dashboard access, or during worker simulation,
    // seamlessly redirect to the user's primary accessible module to prevent "Access Denied"
    if (moduleName === 'dashboard' || isSimulating) {
      return <Navigate to={getFirstAccessibleRoute(user)} replace />;
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center p-6 text-center">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-200 dark:border-red-900/50 space-y-4">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-amber-500">
              <AlertTriangle className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {isSimulating ? (
              <>
                Simulated worker <strong>{user.displayName}</strong> does not have permission to view the <strong>{moduleName}</strong> module.
              </>
            ) : (
              <>
                You do not have the required permissions to view the <strong>{moduleName}</strong> module.
              </>
            )}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {isSimulating && (
              <button
                onClick={async () => {
                  await exitSimulation();
                  const returnRoute = localStorage.getItem('saheb_sim_return_route') || '/role-management';
                  localStorage.removeItem('saheb_sim_return_route');
                  navigate(returnRoute, { replace: true });
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Exit Simulation &amp; Return to Roles
              </button>
            )}
            {hasAccess('dashboard') ? (
              <button
                onClick={() => navigate('/')}
                className="btn-primary-gradient px-5 py-2.5 text-xs uppercase tracking-wider cursor-pointer"
              >
                Back to Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate(getFirstAccessibleRoute(user))}
                className="btn-primary-gradient px-5 py-2.5 text-xs uppercase tracking-wider cursor-pointer"
              >
                Go to Accessible Workspace
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
export default ProtectedRoute;
