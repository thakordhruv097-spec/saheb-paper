import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../../data/types';
import {
  getUsers,
  updateRawUserPin,
  addLog,
  saveUser,
  getAccountLockInfo,
  recordFailedLogin,
  resetFailedLogin,
  unlockUserAccount,
  unlockAccountWithSecurityQuestion,
} from '../../data/index';
import { hashPin, isPinHashed, generateSecureToken } from '../../lib/security';
import { getDeviceInfo } from '../../utils/deviceHelper';

interface AuthContextType {
  user: User | null;
  login: (username: string, pin: string) => Promise<boolean>;
  logout: () => void;
  resetPin: (username: string, newPin: string) => Promise<boolean>;
  updateUserProfile: (updatedFields: Partial<User>) => Promise<boolean>;
  simulateWorkerLogin: (targetUsername: string) => Promise<boolean>;
  exitSimulation: () => Promise<boolean>;
  unlockUserAccount: (targetUsername: string) => Promise<boolean>;
  unlockAccountWithSecurityQuestion: (username: string, answer: string, newPin?: string) => Promise<{ success: boolean; message: string }>;
  getAccountLockInfo: (username: string) => {
    isLocked: boolean;
    remainingMinutes: number;
    failedAttempts: number;
    securityQuestion?: string;
    lockedReason?: string;
  };
  isSimulating: boolean;
  simulatedBy: string | null;
  hasAccess: (module: string) => boolean;
  isViewer: boolean;
  canEdit: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours session expiry window

interface SessionData {
  token: string;
  expiresAt: number;
  user: User;
  simulatedBy?: string;
}

export const getFirstAccessibleRoute = (targetUser?: User | null): string => {
  if (!targetUser) return '/login';
  const modules = targetUser.customModules || [];
  if (modules.includes('dashboard') || targetUser.role === 'Admin') return '/';
  if (modules.includes('raw_material_stock')) return '/raw-material-stock';
  if (modules.includes('pulp_mill_operations')) return '/pulp-mill-operations';
  if (modules.includes('machine_production')) return '/machine-production';
  if (modules.includes('rewinding_reel_conversion')) return '/rewinding-reel-conversion';
  if (modules.includes('lab')) return '/lab';
  if (modules.includes('boiler')) return '/utilities-&-etp/boiler-operations';
  if (modules.includes('etp') || modules.includes('etp_chemicals')) return '/utilities-&-etp/etp-water-&-chemicals';
  if (modules.includes('electricity')) return '/utilities-&-etp/electricity-&-power-grid';
  if (modules.includes('orders')) return '/orders';
  if (modules.includes('finished_stock_dispatch')) return '/stock-categorization';
  if (modules.includes('dispatch') || modules.includes('dispatch_receipt')) return '/dispatch-receipt/draft-packing-slip';
  if (modules.includes('spareparts_management')) return '/spareparts-management';
  if (modules.includes('label_studio')) return '/label-studio';
  if (modules.includes('monthly_yearly_reporting')) return '/monthly-yearly-reporting';

  if (targetUser.customModules && Array.isArray(targetUser.customModules)) {
    return '/profile';
  }

  // Role-based smart fallback ONLY when customModules has not been configured yet (legacy)
  const role = (targetUser.role || '').toLowerCase();
  const uname = (targetUser.username || '').toLowerCase();
  if (role.includes('lab') || role.includes('qc') || uname.includes('lab') || role === 'plantmanager') return '/lab';
  if (role.includes('pulp') || uname.includes('pulper')) return '/pulp-mill-operations';
  if (role.includes('machine') || role.includes('machinery') || uname.includes('machinery') || uname.includes('manager')) return '/machine-production';
  if (role.includes('dispatch')) return '/dispatch-receipt/draft-packing-slip';
  if (role.includes('shop') || role.includes('store')) return '/spareparts-management';
  if (role.includes('boiler')) return '/utilities-&-etp/boiler-operations';
  if (role.includes('etp')) return '/utilities-&-etp/etp-water-&-chemicals';
  if (role.includes('view')) return '/monthly-yearly-reporting';

  return '/profile';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulatedBy, setSimulatedBy] = useState<string | null>(() => {
    const direct = localStorage.getItem('saheb_simulated_by');
    if (direct) return direct;
    const rawSession = localStorage.getItem('saheb_session');
    if (rawSession) {
      try {
        const session: SessionData = JSON.parse(rawSession);
        if (session.simulatedBy) return session.simulatedBy;
      } catch (err) {}
    }
    return null;
  });
  const isSimulating = Boolean(simulatedBy);
  const isViewer = Boolean(
    user && (user.role === 'Viewer' || (user.roles && user.roles.includes('Viewer')) || user.username.toLowerCase() === 'viewer')
  );
  const canEdit = !isViewer;

  // Global lockdown of all print actions for Viewer mode
  useEffect(() => {
    if (!isViewer) return;

    // Block keyboard print shortcuts (Ctrl+P / Cmd+P)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Intercept window.print calls
    const originalPrint = window.print;
    window.print = () => {
      console.warn('[Security] Printing is locked for Viewer mode.');
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.print = originalPrint;
    };
  }, [isViewer]);

  const clearSession = () => {
    setUser(null);
    setSimulatedBy(null);
    localStorage.removeItem('saheb_session');
    localStorage.removeItem('saheb_active_user');
    localStorage.removeItem('saheb_simulated_by');
  };

  useEffect(() => {
    const rawSession = localStorage.getItem('saheb_session');
    if (rawSession) {
      try {
        const session: SessionData = JSON.parse(rawSession);
        const now = Date.now();

        // Validate Token Expiry (8-hour window)
        if (!session.expiresAt || now > session.expiresAt) {
          console.warn('[Security] Session token expired. Redirecting to login.');
          clearSession();
        } else {
          // Verify user is still active in users master database
          const currentUsers = getUsers();
          const activeDbUser = currentUsers.find(u => u.username.toLowerCase() === session.user.username.toLowerCase());
          if (!activeDbUser || activeDbUser.active === false) {
            console.warn('[Security] Session invalidated: user is deactivated or deleted.');
            clearSession();
          } else {
            setUser(activeDbUser);
            if (session.simulatedBy) {
              setSimulatedBy(session.simulatedBy);
              localStorage.setItem('saheb_simulated_by', session.simulatedBy);
            }
          }
        }
      } catch (err) {
        console.error('[Security] Failed to parse session data:', err);
        clearSession();
      }
    } else {
      // Clear legacy un-expirable user storage if present
      localStorage.removeItem('saheb_active_user');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const syncSessionFromStorage = () => {
      const rawSession = localStorage.getItem('saheb_session');
      if (rawSession) {
        try {
          const session: SessionData = JSON.parse(rawSession);
          const currentUsers = getUsers();
          const targetUsername = session.user?.username;
          if (!targetUsername) return;

          const activeDbUser = currentUsers.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
          if (activeDbUser && activeDbUser.active !== false) {
            setUser(prev => {
              if (
                prev &&
                prev.username === activeDbUser.username &&
                prev.role === activeDbUser.role &&
                prev.displayName === activeDbUser.displayName &&
                JSON.stringify(prev.customModules || []) === JSON.stringify(activeDbUser.customModules || [])
              ) {
                return prev;
              }
              // Update local session storage so it stays synchronized across reload
              session.user = { ...activeDbUser };
              localStorage.setItem('saheb_session', JSON.stringify(session));
              localStorage.setItem('saheb_active_user', JSON.stringify(activeDbUser));
              return { ...activeDbUser };
            });
            const simBy = session.simulatedBy || localStorage.getItem('saheb_simulated_by') || null;
            setSimulatedBy(prev => prev === simBy ? prev : simBy);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('storage', syncSessionFromStorage);
    window.addEventListener('focus', syncSessionFromStorage);
    window.addEventListener('saheb_data_updated', syncSessionFromStorage);
    return () => {
      window.removeEventListener('storage', syncSessionFromStorage);
      window.removeEventListener('focus', syncSessionFromStorage);
      window.removeEventListener('saheb_data_updated', syncSessionFromStorage);
    };
  }, []);

  const login = async (username: string, pin: string): Promise<boolean> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    // 1. Check if user is currently locked
    const lockInfo = getAccountLockInfo(cleanUser);
    if (lockInfo.isLocked) {
      addLog('Security', 'Login Attempt Blocked', `Locked user "${cleanUser}" attempted login while locked (${lockInfo.remainingMinutes} min remaining)`, 'System');
      return false;
    }

    const users = getUsers();
    const hashedPin = await hashPin(cleanPin);

    const foundUser = users.find(u => {
      const uName = u.username.toLowerCase();
      const matchName =
        uName === cleanUser ||
        (cleanUser === 'shop' && (uName === 'shopper' || u.role === 'Shopper')) ||
        (cleanUser === 'shopper' && (uName === 'shop' || u.role === 'Shopper')) ||
        (cleanUser === 'pulper' && (uName === 'pulper' || u.role === 'LabOperator')) ||
        (cleanUser === 'lab_operator' && (uName === 'pulper' || u.role === 'LabOperator'));

      if (!matchName) return false;

      // Smart Dual-Check: Verify against SHA-256 hashed PIN or plaintext (legacy)
      const matchesHash = u.pin === hashedPin;
      const matchesPlain = u.pin.trim() === cleanPin;

      return matchesHash || matchesPlain;
    });

    if (foundUser) {
      if (foundUser.active === false) {
        addLog('Auth', 'Login Blocked', `Attempted login for deactivated user: ${foundUser.username}`, 'System');
        return false;
      }

      // Reset failed login attempts on success
      resetFailedLogin(foundUser.username);

      // Seamless Auto-Migration: If stored PIN is still plaintext, upgrade to hashed PIN immediately
      if (!isPinHashed(foundUser.pin)) {
        foundUser.pin = hashedPin;
        saveUser(foundUser);
      }

      const token = generateSecureToken('token');
      const expiresAt = Date.now() + SESSION_DURATION_MS; // 8 hours duration

      const session: SessionData = {
        token,
        user: foundUser,
        expiresAt,
      };

      localStorage.setItem('saheb_session', JSON.stringify(session));
      localStorage.setItem('saheb_active_user', JSON.stringify(foundUser)); // fallback key
      localStorage.removeItem('saheb_failed_pin_count');
      localStorage.setItem('saheb_last_active_time', String(Date.now()));
      setUser(foundUser);
      addLog('Auth', 'Login Successful', `User authenticated: ${foundUser.username} on [${getDeviceInfo()}]`, foundUser.username);
      return true;
    }

    // Record Failed Login attempt per user
    const device = getDeviceInfo();
    recordFailedLogin(cleanUser, device);

    return false;
  };

  const logout = () => {
    if (user) {
      addLog('Auth', 'Logout', `User logged out: ${user.username}`, user.username);
    }
    clearSession();
  };

  const resetPin = async (username: string, newPin: string): Promise<boolean> => {
    const users = getUsers();
    const userToReset = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!userToReset) return false;

    const hashed = await hashPin(newPin);
    return updateRawUserPin(userToReset.username, hashed);
  };

  const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    const users = getUsers();
    const idx = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (idx === -1) return false;

    if (updates.pin && !isPinHashed(updates.pin)) {
      updates.pin = await hashPin(updates.pin);
    }

    const updatedUser: User = { ...users[idx], ...updates };
    saveUser(updatedUser);

    // Update session storage
    const rawSession = localStorage.getItem('saheb_session');
    if (rawSession) {
      try {
        const session: SessionData = JSON.parse(rawSession);
        session.user = updatedUser;
        localStorage.setItem('saheb_session', JSON.stringify(session));
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.setItem('saheb_active_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    window.dispatchEvent(new Event('storage'));
    return true;
  };

  const simulateWorkerLogin = async (username: string): Promise<boolean> => {
    const users = getUsers();
    const targetUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!targetUser) return false;

    const token = generateSecureToken('token_sim');
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const adminUsername = (user && user.role === 'Admin') ? user.username : (simulatedBy || 'admin');

    const session: SessionData = {
      token,
      user: targetUser,
      expiresAt,
      simulatedBy: adminUsername,
    };

    localStorage.setItem('saheb_session', JSON.stringify(session));
    localStorage.setItem('saheb_active_user', JSON.stringify(targetUser));
    localStorage.setItem('saheb_simulated_by', adminUsername);
    setUser(targetUser);
    setSimulatedBy(adminUsername);
    window.dispatchEvent(new Event('storage'));
    addLog('Auth', 'Worker Login Simulated', `Admin simulated session for: ${targetUser.username} (${targetUser.displayName})`, 'Admin');
    return true;
  };

  const exitSimulation = async (): Promise<boolean> => {
    const users = getUsers();
    const targetAdminUsername = simulatedBy || 'admin';
    const adminUser = users.find(u => u.username.toLowerCase() === targetAdminUsername.toLowerCase())
      || users.find(u => u.role === 'Admin')
      || users[0];

    if (!adminUser) return false;

    const token = generateSecureToken('token_admin');
    const expiresAt = Date.now() + SESSION_DURATION_MS;

    const session: SessionData = {
      token,
      user: adminUser,
      expiresAt,
    };

    localStorage.setItem('saheb_session', JSON.stringify(session));
    localStorage.setItem('saheb_active_user', JSON.stringify(adminUser));
    localStorage.removeItem('saheb_simulated_by');
    setUser(adminUser);
    setSimulatedBy(null);
    window.dispatchEvent(new Event('storage'));
    addLog('Auth', 'Simulation Exited', `Restored session for Admin: ${adminUser.username}`, 'Admin');
    return true;
  };

  // GRANULAR PERMISSION EVALUATION (STRICT NO-FALLBACK TO PREVENT PERMISSION BYPASS)
  const hasAccess = (moduleName: string): boolean => {
    if (!user) return false;

    // Admin Masters / User Management / System Audit is STRICTLY restricted to Super Admin only.
    // No other user, viewer, or operator profile can EVER access Admin Masters.
    if (moduleName === 'admin_panel_audit' || moduleName === 'admin_masters' || moduleName === 'user_management') {
      return user.role === 'Admin' || (user.roles && user.roles.includes('Admin')) || user.username.toLowerCase() === 'admin';
    }

    // Super Admin has master authority across all endpoints
    if (user.role === 'Admin' || (user.roles && user.roles.includes('Admin')) || user.username.toLowerCase() === 'admin') return true;

    // Viewer has observational access across ALL 13 operational ERP modules (excluding Admin Masters)
    if (user.role === 'Viewer' || (user.roles && user.roles.includes('Viewer')) || user.username.toLowerCase() === 'viewer') {
      return true;
    }

    // Custom assigned modules configured by Admin in Role Management
    const custom = user.customModules && Array.isArray(user.customModules)
      ? user.customModules
      : [];

    // Direct match against assigned custom module keys
    if (custom.includes(moduleName)) return true;

    // Route & Menu level access checks
    if (moduleName === 'dashboard') return custom.includes('dashboard');
    if (moduleName === 'raw_material_stock') return custom.includes('raw_material_stock');
    if (moduleName === 'pulp_mill_operations') return custom.includes('pulp_mill_operations');
    if (moduleName === 'machine_production') return custom.includes('machine_production');
    if (moduleName === 'rewinding_reel_conversion') return custom.includes('rewinding_reel_conversion');
    if (moduleName === 'lab') return custom.includes('lab');

    // Individual utilities and unified module
    if (moduleName === 'utilities_etp') {
      return custom.includes('utilities_etp') || custom.includes('boiler') || custom.includes('etp') || custom.includes('electricity');
    }
    if (moduleName === 'boiler') return custom.includes('boiler');
    if (moduleName === 'etp' || moduleName === 'etp_chemicals') return custom.includes('etp') || custom.includes('etp_chemicals');
    if (moduleName === 'electricity') return custom.includes('electricity');

    if (moduleName === 'orders') return custom.includes('orders');

    // Finished Stock & Stock Categorization
    if (moduleName === 'finished_stock_dispatch') {
      return (
        custom.includes('finished_stock_dispatch') ||
        custom.includes('finish_stock') ||
        custom.includes('stock_category')
      );
    }

    // Dispatch Receipt & Vault
    if (moduleName === 'dispatch_receipt' || moduleName === 'dispatch') {
      return custom.includes('dispatch') || custom.includes('dispatch_receipt');
    }

    if (moduleName === 'spareparts_management') return custom.includes('spareparts_management');
    if (moduleName === 'label_studio') return custom.includes('label_studio');
    if (moduleName === 'monthly_yearly_reporting') return custom.includes('monthly_yearly_reporting');
    if (moduleName === 'admin_panel_audit' || moduleName === 'admin_masters') {
      return false;
    }
    if (moduleName === 'profile') return true;

    // STRICT DENIAL: If a module is NOT enabled in Role Management, DENY ACCESS!
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center">
        <div className="text-primary font-bold animate-pulse text-lg">Loading Session...</div>
      </div>
    );
  }

  const handleUnlockUserAccount = async (targetUsername: string): Promise<boolean> => {
    const operator = user?.username || 'Admin';
    return unlockUserAccount(targetUsername, operator);
  };

  const handleUnlockAccountWithSecurityQuestion = async (
    username: string,
    answer: string,
    newPin?: string
  ): Promise<{ success: boolean; message: string }> => {
    return unlockAccountWithSecurityQuestion(username, answer, newPin);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        resetPin,
        updateUserProfile,
        simulateWorkerLogin,
        exitSimulation,
        unlockUserAccount: handleUnlockUserAccount,
        unlockAccountWithSecurityQuestion: handleUnlockAccountWithSecurityQuestion,
        getAccountLockInfo,
        isSimulating,
        simulatedBy,
        hasAccess,
        isViewer,
        canEdit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
