import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  User,
  Edit3,
  Settings,
  Bell,
  Lock,
  KeyRound,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Users,
  Globe,
  Palette,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Building2,
  Phone,
  Mail,
  ShieldAlert,
  Sun,
  Moon,
  Info,
  Sparkles,
} from 'lucide-react';
import { COMPANY_CONFIG } from '../../config/company';
import { APP_VERSION } from '../../config/version';
import { AppUpdateModal } from '../../components/AppUpdateModal';
import { PrivacyPolicyModal } from '../../components/PrivacyPolicyModal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useMobileBackHandler } from '../../hooks/useMobileBackHandler';

export const MobileProfileView: React.FC = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Modals & Bottom Sheets
  const [activeModal, setActiveModal] = useState<
    'edit' | 'security' | 'notifications' | 'language' | 'theme' | 'help' | 'privacy' | null
  >(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Lock background page scroll completely whenever any modal is open
  useBodyScrollLock(!!activeModal || logoutConfirmOpen || isUpdateModalOpen);

  // Intercept Android hardware Back and browser Back to close open modal first
  useMobileBackHandler(!!activeModal, () => setActiveModal(null), 'mobileProfileActiveModal');
  useMobileBackHandler(logoutConfirmOpen, () => setLogoutConfirmOpen(false), 'mobileProfileLogoutModal');
  useMobileBackHandler(isUpdateModalOpen, () => setIsUpdateModalOpen(false), 'mobileProfileUpdateModal');

  // Edit Profile Form State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pin, setPin] = useState(user?.pin || '');
  const [securityQuestion, setSecurityQuestion] = useState(
    user?.securityQuestion || 'What is your favorite color?'
  );
  const [securityAnswer, setSecurityAnswer] = useState(user?.securityAnswer || '');
  const [showPin, setShowPin] = useState(false);

  // Notification Toggles
  const [notifProd, setNotifProd] = useState(true);
  const [notifQc, setNotifQc] = useState(true);
  const [notifDispatch, setNotifDispatch] = useState(true);

  // Toast / Feedback
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('saheb_theme') === 'dark';
  });

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('saheb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('saheb_theme', 'light');
    }
  };

  if (!user) return null;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast('Display Name cannot be empty', 'error');
      return;
    }

    const updated = await updateUserProfile({
      displayName: displayName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
    });

    if (updated) {
      showToast('Profile updated successfully!', 'success');
      setActiveModal(null);
    } else {
      showToast('Failed to update profile', 'error');
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinTrimmed = pin.trim();
    if (pinTrimmed && (pinTrimmed.length !== 4 || isNaN(Number(pinTrimmed)))) {
      showToast('Security PIN must be exactly 4 numeric digits', 'error');
      return;
    }

    const payload = {
      displayName: user.displayName,
      email: user.email || '',
      phone: user.phone || '',
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
      ...(pinTrimmed ? { pin: pinTrimmed } : {}),
    };

    const updated = await updateUserProfile(payload);

    if (updated) {
      showToast('Security settings updated successfully!', 'success');
      setActiveModal(null);
      setPin('');
    } else {
      showToast('Failed to update security settings', 'error');
    }
  };

  const openEditModal = () => {
    setDisplayName(user.displayName);
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setActiveModal('edit');
  };

  const openSecurityModal = () => {
    setPin('');
    setSecurityQuestion(user.securityQuestion || 'What is your favorite color?');
    setSecurityAnswer(user.securityAnswer || '');
    setActiveModal('security');
  };

  const isAdmin = user.role === 'Admin';

  // Compute User Initials
  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="w-full min-h-screen bg-slate-50/60 dark:bg-bg-dark font-sans pb-24 px-4 pt-2 select-none">
      
      {/* Toast Notification Alert */}
      {feedbackMsg && (
        <div className="fixed top-4 left-4 right-4 z-50 p-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          {feedbackType === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <Info className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{feedbackMsg}</span>
        </div>
      )}

      {/* 1. TOP NATIVE HEADER BAR */}
      <div className="py-2 mb-4">
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
          Profile
        </h1>
      </div>

      {/* 2. USER PROFILE HERO AREA (Centered Native App Style) */}
      <div className="flex flex-col items-center justify-center text-center mb-6">
        {/* Monogram Avatar Circle (No image upload required) */}
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-800 via-blue-900 to-indigo-950 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-blue-950/20 border-4 border-white dark:border-slate-800 ring-2 ring-primary/20">
            {initials}
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        {/* User Display Name */}
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
          {user.displayName}
        </h2>

        {/* Subtitle / Email */}
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
          {user.email || `${user.username.toLowerCase()}@sahebpaper.com`}
        </p>

        {/* Role & ID Badge */}
        <div className="flex items-center gap-2 mt-2">
          <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary dark:text-blue-400 border border-primary/20">
            {user.role}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-800">
            {user.empId || `EMP-001`}
          </span>
        </div>
      </div>

      {/* 3. MENU ITEMS CONTAINER (White Rounded Group Card Pattern) */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 mb-6">
        
        {/* 1. Edit Profile */}
        <button
          type="button"
          onClick={openEditModal}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-primary transition">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white">Edit Profile</div>
              <div className="text-[11px] text-slate-400 font-medium">Name, Phone, Email Address</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* 2. Account Settings */}
        <button
          type="button"
          onClick={openSecurityModal}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-primary transition">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white">Account Settings</div>
              <div className="text-[11px] text-slate-400 font-medium">Security PIN &amp; Password</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* 3. Notification Preferences */}
        <button
          type="button"
          onClick={() => setActiveModal('notifications')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-primary transition">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white">Notification Preferences</div>
              <div className="text-[11px] text-slate-400 font-medium">Mill Shifts &amp; Stock Alerts</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* 4. Privacy & Security */}
        <button
          type="button"
          onClick={() => setActiveModal('privacy')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-primary transition">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white">Privacy &amp; Security</div>
              <div className="text-[11px] text-slate-400 font-medium">Session, Role Access &amp; Audit</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* 5. Role Management (Admin only shortcut) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => navigate('/role-management')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-primary transition">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white">Role Permission Matrix</div>
                <div className="text-[11px] text-slate-400 font-medium">Configure 13 Worker Modules</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* 6. User Accounts (Admin only shortcut) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => navigate('/user-management')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-primary transition">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white">User Accounts</div>
                <div className="text-[11px] text-slate-400 font-medium">Create &amp; Manage Workers</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* 7. Language & Appearance */}
        <button
          type="button"
          onClick={() => setActiveModal('theme')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-primary transition">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white">Theme &amp; Appearance</div>
              <div className="text-[11px] text-slate-400 font-medium">
                {darkMode ? 'Dark Mode Active' : 'Light Mode Active'}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* 8. Help & Support */}
        <button
          type="button"
          onClick={() => setActiveModal('help')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-primary transition">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white">Help &amp; Support</div>
              <div className="text-[11px] text-slate-400 font-medium">SOP Guides &amp; Mill Helpline</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* 9. App Updates & Changelog */}
        <button
          type="button"
          onClick={() => {
            setIsUpdateModalOpen(true);
          }}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-primary transition">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>System Updates</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-mono font-bold text-slate-600 dark:text-slate-300">
                  v{APP_VERSION}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Version history &amp; release changelogs</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

      </div>

      {/* 4. RED LOGOUT BUTTON (Bottom Action) */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setLogoutConfirmOpen(true)}
          className="w-full flex items-center justify-center gap-2 p-3.5 bg-white dark:bg-surface-dark border border-red-200/80 dark:border-red-900/50 rounded-2xl text-xs font-black text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer shadow-2xs active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* App Version Info Footer */}
      <div
        onClick={() => setIsUpdateModalOpen(true)}
        className="text-center text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
      >
        <Sparkles className="h-3 w-3 text-blue-500" />
        <span>{COMPANY_CONFIG.name} ERP &bull; v{APP_VERSION} (Mobile)</span>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: EDIT PROFILE */}
      {/* ======================================================== */}
      {activeModal === 'edit' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onTouchMove={e => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col overflow-hidden text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between border-b p-5 sm:p-6 pb-3 sm:pb-4 dark:border-slate-700 bg-white dark:bg-surface-dark shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Edit Personal Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              data-modal-scroll="true"
              className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain"
            >
              <form id="mobile-edit-profile-form" onSubmit={handleSaveProfile} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </form>
            </div>

            {/* Fixed Footer Actions */}
            <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer active:scale-98 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="mobile-edit-profile-form"
                className="flex-1 py-3 bg-primary text-white font-black rounded-xl text-xs shadow-md cursor-pointer active:scale-98 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ACCOUNT SECURITY SETTINGS */}
      {/* ======================================================== */}
      {activeModal === 'security' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onTouchMove={e => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col overflow-hidden text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between border-b p-5 sm:p-6 pb-3 sm:pb-4 dark:border-slate-700 bg-white dark:bg-surface-dark shrink-0">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Security PIN &amp; Credentials
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              data-modal-scroll="true"
              className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain"
            >
              <form id="mobile-security-form" onSubmit={handleSaveSecurity} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    4-Digit Quick PIN <span className="text-[9px] text-slate-400 font-normal lowercase">(leave blank to keep current)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={4}
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="•••• (Unchanged)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-black font-mono tracking-widest dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Used for fast mobile station unlock.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Security Question
                  </label>
                  <select
                    value={securityQuestion}
                    onChange={e => setSecurityQuestion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold dark:text-white"
                  >
                    <option value="What is your favorite color?">What is your favorite color?</option>
                    <option value="What is your birth city?">What is your birth city?</option>
                    <option value="What is your first pet's name?">What is your first pet's name?</option>
                    <option value="What was your first vehicle number?">What was your first vehicle number?</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Security Answer
                  </label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={e => setSecurityAnswer(e.target.value)}
                    placeholder="Your answer..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </form>
            </div>

            {/* Fixed Footer Actions */}
            <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer active:scale-98 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="mobile-security-form"
                className="flex-1 py-3 bg-primary text-white font-black rounded-xl text-xs shadow-md cursor-pointer active:scale-98 transition"
              >
                Update PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: NOTIFICATIONS PREFERENCES */}
      {/* ======================================================== */}
      {activeModal === 'notifications' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onTouchMove={e => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col overflow-hidden text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between border-b p-5 sm:p-6 pb-3 sm:pb-4 dark:border-slate-700 bg-white dark:bg-surface-dark shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Notification Preferences
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              data-modal-scroll="true"
              className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3 overscroll-contain"
            >
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">Machine Production Alerts</div>
                  <div className="text-[10px] text-slate-400">Jumbo roll completion and speed alerts</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifProd}
                  onChange={e => setNotifProd(e.target.checked)}
                  className="h-4 w-4 accent-primary rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">QC Lab Grade Warnings</div>
                  <div className="text-[10px] text-slate-400">Low brightness or Grade B reel warnings</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifQc}
                  onChange={e => setNotifQc(e.target.checked)}
                  className="h-4 w-4 accent-primary rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">Dispatch &amp; Stock Gatepass</div>
                  <div className="text-[10px] text-slate-400">Vehicle loading and invoice generation</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifDispatch}
                  onChange={e => setNotifDispatch(e.target.checked)}
                  className="h-4 w-4 accent-primary rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Fixed Footer Action */}
            <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark shrink-0">
              <button
                type="button"
                onClick={() => {
                  showToast('Notification preferences saved!');
                  setActiveModal(null);
                }}
                className="w-full py-3 bg-primary text-white font-black rounded-xl text-xs shadow-md cursor-pointer active:scale-98 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: THEME & APPEARANCE */}
      {/* ======================================================== */}
      {activeModal === 'theme' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onTouchMove={e => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col overflow-hidden text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between border-b p-5 sm:p-6 pb-3 sm:pb-4 dark:border-slate-700 bg-white dark:bg-surface-dark shrink-0">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Theme &amp; Appearance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              data-modal-scroll="true"
              className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain"
            >
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => {
                    if (darkMode) toggleDarkMode();
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition ${
                    !darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sun className="h-6 w-6 text-amber-500" />
                  <span className="text-xs font-black">Light Mode</span>
                </div>

                <div
                  onClick={() => {
                    if (!darkMode) toggleDarkMode();
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition ${
                    darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Moon className="h-6 w-6 text-blue-400" />
                  <span className="text-xs font-black">Dark Mode</span>
                </div>
              </div>
            </div>

            {/* Fixed Footer Action */}
            <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-3 bg-primary text-white font-black rounded-xl text-xs shadow-md cursor-pointer active:scale-98 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: PRIVACY POLICY & DPDP ACT COMPLIANCE */}
      {/* ======================================================== */}
      <PrivacyPolicyModal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
      />

      {/* ======================================================== */}
      {/* MODAL 6: HELP & SUPPORT */}
      {/* ======================================================== */}
      {activeModal === 'help' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onTouchMove={e => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col overflow-hidden text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between border-b p-5 sm:p-6 pb-3 sm:pb-4 dark:border-slate-700 bg-white dark:bg-surface-dark shrink-0">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Mill ERP Support
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              data-modal-scroll="true"
              className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain"
            >
              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-1">
                  <div className="font-black text-slate-900 dark:text-white">{COMPANY_CONFIG.name} Helpdesk</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">For shift discrepancies or ERP assistance, contact plant supervisor.</p>
                  <div className="text-xs font-mono font-black text-primary dark:text-blue-400 pt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> +91 98765 43210</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> support@sahebpaper.com</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer Action */}
            <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-3 bg-primary text-white font-black rounded-xl text-xs shadow-md cursor-pointer active:scale-98 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: LOGOUT CONFIRMATION */}
      {/* ======================================================== */}
      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onTouchMove={e => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setLogoutConfirmOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-center max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] overflow-y-auto overscroll-contain"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <LogOut className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Sign Out of Mill ERP?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You will need your PIN or credentials to log back into this station.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow-md cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Update Modal */}
      <AppUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />

    </div>
  );
};

export default MobileProfileView;
