import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../modules/auth/AuthContext';
import { verifyPin } from '../lib/security';
import { Lock, Unlock, LogOut, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { addLog } from '../data/index';
import { getDeviceInfo } from '../utils/deviceHelper';

const AUTO_LOCK_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 Hours idle timeout

export const AutoLockModal: React.FC = () => {
  const { user, logout } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check last activity timestamp
  const resetTimer = useCallback(() => {
    if (isLocked || !user) return;
    const now = Date.now();
    localStorage.setItem('saheb_last_active_time', String(now));
  }, [isLocked, user]);

  useEffect(() => {
    if (!user) {
      setIsLocked(false);
      return;
    }

    // Set initial active timestamp if not present
    if (!localStorage.getItem('saheb_last_active_time')) {
      localStorage.setItem('saheb_last_active_time', String(Date.now()));
    }

    const checkIdle = () => {
      const lastActive = Number(localStorage.getItem('saheb_last_active_time') || Date.now());
      const elapsed = Date.now() - lastActive;

      if (elapsed >= AUTO_LOCK_TIMEOUT_MS && !isLocked) {
        setIsLocked(true);
        addLog(
          'Security',
          'Screen Auto-Locked',
          `Session auto-locked after 8 hours of inactivity for user "${user.username}" on [${getDeviceInfo()}]`,
          user.username
        );
      }
    };

    const interval = setInterval(checkIdle, 30000); // Check every 30s

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetTimer();

    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));

    return () => {
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [user, isLocked, resetTimer]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user || !pin.trim()) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanPin = pin.trim();
      const isValid = verifyPin(cleanPin, user.pin);

      if (isValid) {
        setIsLocked(false);
        setPin('');
        setError('');
        localStorage.setItem('saheb_last_active_time', String(Date.now()));
        addLog(
          'Security',
          'Screen Unlocked',
          `Session unlocked by user "${user.username}" on [${getDeviceInfo()}]`,
          user.username
        );
      } else {
        setError('Incorrect PIN. Please try again.');
        addLog(
          'Security',
          'Failed Auto-Lock PIN',
          `Invalid unlock PIN entered for user "${user.username}" on [${getDeviceInfo()}]`,
          'System'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLocked || !user) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans">
      <div className="w-full max-w-[380px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-7 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Lock Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4 shadow-sm border border-amber-200/60 dark:border-amber-900/60">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-black text-slate-900 dark:text-white font-heading">
          Session Auto-Locked
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          App locked due to 8 hours of inactivity for safety.
        </p>

        {/* User Identity Pill */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Logged In User</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.displayName || user.username}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-primary dark:text-blue-400">
            {user.role}
          </span>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="mt-5 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-900/60 font-semibold">
              {error}
            </div>
          )}

          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 4-digit PIN"
              autoFocus
              className="w-full text-center text-lg tracking-widest font-mono font-bold py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || pin.length !== 4}
            className="w-full py-3 px-4 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Unlock &amp; Resume</span>
              </>
            )}
          </button>
        </form>

        {/* Logout Option */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account / Logout</span>
          </button>
        </div>

      </div>
    </div>
  );
};
