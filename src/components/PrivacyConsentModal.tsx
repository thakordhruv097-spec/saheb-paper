import React, { useState, useEffect } from 'react';
import { ShieldCheck, Shield, ExternalLink, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../modules/auth/AuthContext';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { addLog, saveUser } from '../data/index';
import type { User } from '../data/types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export const PrivacyConsentModal: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!user) {
      setIsOpen(false);
      return;
    }

    // 1. Super Admin never gets blocked by this popup
    if (user.username.toLowerCase() === 'admin' || user.role === 'Admin') {
      setIsOpen(false);
      return;
    }

    // 2. Check if this user has already consented on this device or on their account
    const consentKey = `saheb_privacy_consent_${user.username.toLowerCase()}`;
    const hasLocalConsent = !!localStorage.getItem(consentKey);
    const hasAccountConsent = !!user.privacyConsented;

    if (hasLocalConsent || hasAccountConsent) {
      setIsOpen(false);
      return;
    }

    // 3. Default built-in factory demo users vs new created users
    const DEFAULT_PRELOADED_USERS = ['admin', 'pulper', 'plant_manager', 'dispatcher', 'shop', 'viewer'];
    const isDefaultSeedUser = DEFAULT_PRELOADED_USERS.includes(user.username.toLowerCase());

    // Only show if user is a new user (either marked isNewUser === true, or a newly created non-default user whose isNewUser is not false)
    const isNew = user.isNewUser === true || (!isDefaultSeedUser && user.isNewUser !== false);

    if (isNew) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [user]);

  if (!user || !isOpen) return null;

  const handleDismissOrAccept = (didAgree: boolean = true) => {
    const consentKey = `saheb_privacy_consent_${user.username.toLowerCase()}`;
    const timestamp = new Date().toISOString();
    localStorage.setItem(consentKey, JSON.stringify({
      username: user.username,
      acceptedAt: timestamp,
      policyVersion: '2026-v2.4',
    }));

    // Update user object so isNewUser is false and privacyConsented is true
    const updatedUser: User = {
      ...user,
      isNewUser: false,
      privacyConsented: true,
    };
    saveUser(updatedUser);
    if (updateUserProfile) {
      updateUserProfile({ isNewUser: false, privacyConsented: true });
    }

    if (didAgree) {
      addLog(
        'Auth',
        'Privacy Policy Consent',
        `New User ${user.displayName} (@${user.username}) accepted Data Privacy Terms (DPDP Act 2023 v2.4)`,
        user.displayName || user.username
      );
    }

    setIsOpen(false);
  };

  const handleAccept = () => {
    if (!agreed) return;
    handleDismissOrAccept(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
        <div 
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] overflow-hidden text-left font-sans animate-in zoom-in-95 duration-150"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 p-5 sm:p-6 pb-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50 shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Data Privacy &amp; Mill Consent
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary dark:text-blue-400">
                    Required
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Saheb Paper Pvt. Ltd. • DPDP Act 2023 Compliance
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDismissOrAccept(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-1 rounded-lg"
              title="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div
            data-modal-scroll="true"
            className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain"
          >
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <p>
                Welcome, <strong className="text-slate-900 dark:text-white">{user.displayName}</strong>.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                In accordance with company guidelines and the Digital Personal Data Protection Act (DPDP Act 2023), all shift actions, batch weights, QC test entries, and dispatch logs recorded on this terminal are audited for manufacturing accountability and legal traceability.
              </p>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary dark:text-blue-400 hover:underline cursor-pointer pt-1"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Read Full Privacy Policy &amp; Terms</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-primary border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
                />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight select-none">
                  I have reviewed and agree to the Saheb Paper Internal Privacy Policy, Data Retention Rules, and Manufacturing System Protocols.
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              disabled={!agreed}
              onClick={handleAccept}
              className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
                agreed
                  ? 'bg-primary hover:bg-blue-800 text-white shadow-primary/25 active:scale-98'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
              }`}
            >
              <span>Accept &amp; Continue to Mill ERP</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <PrivacyPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
      />
    </>
  );
};
export default PrivacyConsentModal;
