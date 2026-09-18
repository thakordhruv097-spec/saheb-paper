import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { User, Edit3, ShieldCheck, Mail, Phone, Lock, HelpCircle, CheckCircle2, Eye, EyeOff, X, KeyRound, RefreshCw, LogOut, Building2 } from 'lucide-react';
import { COMPANY_CONFIG } from '../../config/company';
import { MODULES_13 } from '../../data/types';
import { APP_VERSION } from '../../config/version';
import { AppUpdateModal } from '../../components/AppUpdateModal';

interface OperatorProfileViewProps {
  defaultTab?: 'profile';
}

export const OperatorProfileView: React.FC<OperatorProfileViewProps> = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Form State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pin, setPin] = useState(user?.pin || '');
  const [securityQuestion, setSecurityQuestion] = useState(
    user?.securityQuestion || 'What is your favorite color?'
  );
  const [securityAnswer, setSecurityAnswer] = useState(user?.securityAnswer || '');

  const handleStartEdit = () => {
    if (user) {
      setDisplayName(user.displayName);
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setPin('');
      setSecurityQuestion(user.securityQuestion || 'What is your favorite color?');
      setSecurityAnswer(user.securityAnswer || '');
    }
    setIsEditing(true);
    setSaveSuccess(false);
    setSaveError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setSaveError('');

    if (!displayName.trim()) {
      setSaveError('Display Name cannot be empty');
      return;
    }

    const pinTrimmed = pin.trim();
    if (pinTrimmed && (pinTrimmed.length !== 4 || isNaN(Number(pinTrimmed)))) {
      setSaveError('Security PIN must be exactly 4 numeric digits');
      return;
    }

    const payload = {
      displayName: displayName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
      ...(pinTrimmed ? { pin: pinTrimmed } : {}),
    };

    const success = await updateUserProfile(payload);

    if (success) {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } else {
      setSaveError('Failed to save profile changes. Please try again.');
    }
  };

  if (!user) return null;

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      
      {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
      <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 font-black text-lg sm:text-xl flex items-center justify-center shadow-2xs shrink-0">
              {user.displayName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                  {user.displayName}
                </h1>
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold">
                  {user.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                @{user.username} • Account Status: Active
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION ALERT */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 font-bold animate-fadeIn shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>Your operator profile details have been updated successfully!</span>
        </div>
      )}

      {/* 2. READ-ONLY PROFILE DETAILS PAGE (WHEN NOT EDITING) */}
      {!isEditing ? (
        <div className="neumorphic-card rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-primary dark:text-blue-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Operator Personal & Account Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Verified credentials and security parameters for shift entry</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-300/50 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified Operator
            </span>
          </div>

          {/* DISPLAY INFORMATION GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Display Name */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" /> Full Display Name
              </span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white">{user.displayName}</p>
            </div>

            {/* Account Role & Username */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" /> Username / Fixed Role
              </span>
              <p className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                {user.username} <span className="text-xs text-primary font-bold">({user.role})</span>
              </p>
            </div>

            {/* Email Address */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" /> Email Address
              </span>
              <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                {user.email || <span className="text-slate-400 italic font-normal">Not configured</span>}
              </p>
            </div>

            {/* Phone Number */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" /> Phone Number
              </span>
              <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                {user.phone || <span className="text-slate-400 italic font-normal">Not configured</span>}
              </p>
            </div>

            {/* Official Enterprise / Mill Information */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/60 to-indigo-50/40 dark:from-slate-900/80 dark:to-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200/60 dark:border-purple-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#6C4FE0] dark:text-purple-400" />
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                    {COMPANY_CONFIG.name}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#EDE9FE] dark:bg-purple-950/60 text-[#6C4FE0] dark:text-purple-300">
                  Mill Registry
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact Desk</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{COMPANY_CONFIG.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Email Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{COMPANY_CONFIG.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Official Portal</span>
                  <a href={COMPANY_CONFIG.websiteUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">
                    {COMPANY_CONFIG.website}
                  </a>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Plant Location</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{COMPANY_CONFIG.address}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Active Module Permissions */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Active Module Permissions (
                  {user?.role === 'Admin' || user?.role === 'Viewer' ? MODULES_13.length : MODULES_13.filter(m => (user?.customModules || []).includes(m.key)).length}
                  /{MODULES_13.length})
                </span>
                {user?.role === 'Admin' ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    Permanent Super Admin Authority (Locked)
                  </span>
                ) : user?.role === 'Viewer' ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    Viewer Mode (Read-Only Data Locked)
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-primary dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                    Role Synchronized
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {MODULES_13.filter(m => (user?.role === 'Admin' || user?.role === 'Viewer' ? true : (user?.customModules || []).includes(m.key))).length === 0 ? (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                    No operational modules currently assigned by Admin.
                  </span>
                ) : (
                  MODULES_13.filter(m => (user?.role === 'Admin' || user?.role === 'Viewer' ? true : (user?.customModules || []).includes(m.key))).map(m => (
                    <span key={m.key} className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-2xs">
                      {user?.role === 'Admin' ? (
                        <Lock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      )}
                      <span>{m.label}</span>
                    </span>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* UPDATE PROFILE & LOGOUT CTA BUTTONS */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleStartEdit}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Update My Profile Details</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-[#2563EB] dark:text-blue-300 font-extrabold text-xs uppercase tracking-wider border border-blue-200/80 dark:border-blue-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Check Updates (v{APP_VERSION})</span>
              </button>
            </div>

            <button
              onClick={logout}
              className="w-full sm:hidden px-6 py-3.5 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 font-extrabold text-xs uppercase tracking-wider border border-red-200 dark:border-red-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout of Account</span>
            </button>
          </div>

        </div>
      ) : (
        /* 3. INTERACTIVE PROFILE EDIT FORM (SHOWN ON EDIT CLICK) */
        <div className="neumorphic-card rounded-3xl p-6 sm:p-8 shadow-lg space-y-6 animate-fadeIn">
          
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary dark:text-blue-400">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Update Profile Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Modify your personal contact information & security PIN</p>
              </div>
            </div>
            <button
              onClick={handleCancelEdit}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {saveError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-2xl border border-red-200 dark:border-red-800 font-bold">
              {saveError}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Username (Fixed) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Username (Fixed)
                </label>
                <input
                  type="text"
                  disabled
                  value={user.username}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-2xl font-mono text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Account Role (Fixed) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Account Role
                </label>
                <input
                  type="text"
                  disabled
                  value={user.role}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-2xl font-mono text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Display Name */}
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Full Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl font-bold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition shadow-2xs"
                  placeholder="Your Full Name"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl font-semibold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition shadow-2xs"
                  placeholder="operator@sahebpaper.com"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Phone Number (10 Digits)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition shadow-2xs"
                  placeholder="e.g. 8000563666"
                />
              </div>

              {/* Security PIN */}
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Security PIN (4-Digits) <span className="text-[10px] text-slate-400 font-normal lowercase">(leave blank to keep current)</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={4}
                    value={pin}
                    placeholder="•••• (Unchanged)"
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl font-mono text-sm font-black tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Security Question */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Security Recovery Question
                </label>
                <select
                  value={securityQuestion}
                  onChange={e => setSecurityQuestion(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl font-semibold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition shadow-2xs"
                >
                  <option value="What is your favorite color?">What is your favorite color?</option>
                  <option value="What is your pet's name?">What is your pet's name?</option>
                  <option value="What town were you born in?">What town were you born in?</option>
                  <option value="What is your favorite food?">What is your favorite food?</option>
                </select>
              </div>

              {/* Security Answer */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Security Answer
                </label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={e => setSecurityAnswer(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl font-semibold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition shadow-2xs"
                  placeholder="Answer for PIN recovery"
                />
              </div>

            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>

        </div>
      )}

      <AppUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />

    </div>
  );
};

export default OperatorProfileView;
