import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { isPinHashed } from '../../lib/security';
import {
  User,
  Mail,
  Phone,
  KeyRound,
  CheckCircle2,
  LogOut,
  Eye,
  EyeOff,
  Edit3,
  Building2,
  Crown,
  FileText,
  Globe,
  MapPin,
  ChevronRight,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { COMPANY_CONFIG } from '../../config/company';
import { APP_VERSION } from '../../config/version';
import { AppUpdateModal } from '../../components/AppUpdateModal';

export const AdminProfileView: React.FC = () => {
  const { user, updateUserProfile, logout } = useAuth();

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || 'Admin');
  const [email, setEmail] = useState(user?.email || COMPANY_CONFIG.email);
  const [phone, setPhone] = useState(user?.phone || '');
  const [pin, setPin] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState(user?.securityQuestion || 'What is your favorite color?');
  const [securityAnswer, setSecurityAnswer] = useState(user?.securityAnswer || '');
  const [showPin, setShowPin] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const pinTrimmed = pin.trim();
    if (pinTrimmed && (pinTrimmed.length !== 4 || isNaN(Number(pinTrimmed)))) {
      setErrorMsg('Security PIN must be exactly 4 numeric digits.');
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

    const updated = await updateUserProfile(payload);

    if (updated) {
      setSuccessMsg('Master Admin Profile updated successfully!');
      setIsEditing(false);
      setPin('');
    } else {
      setErrorMsg('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-full space-y-2.5 sm:space-y-3 font-sans pb-2">
      
      {/* 1. TOP HEADER CARD */}
      <div className="bg-white dark:bg-[#131d38] rounded-[24px] px-5 py-3.5 shadow-[5px_5px_16px_rgba(170,185,220,0.18),-5px_-5px_16px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_14px_rgba(0,0,0,0.35)] text-slate-900 dark:text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] bg-[#EEF4FF] dark:bg-blue-950/60 shadow-[inset_1.5px_1.5px_3px_rgba(180,195,230,0.2),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-center text-[#2563EB] dark:text-blue-400 shrink-0">
              <User className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Admin Profile
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 font-normal mt-0.5">
                Manage your personal information and account security
              </p>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[#EEF4FF] dark:bg-blue-950/60 text-xs font-semibold text-[#2563EB] dark:text-blue-400 shadow-[2px_2px_5px_rgba(180,195,230,0.2),-2px_-2px_5px_rgba(255,255,255,0.9)] dark:shadow-none">
              <Crown className="w-3.5 h-3.5 stroke-[2]" />
              <span>Fixed Superuser Role</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-[14px] text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}
      {errorMsg && (
        <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-[14px] text-xs font-medium shadow-xs">
          {errorMsg}
        </div>
      )}

      {/* 2. ADMIN CREDENTIALS CONTENT */}
      <div>
        {!isEditing ? (
          <div className="space-y-2.5 sm:space-y-3">
            {/* ROW 1: Full Display Name & Username / Fixed Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
              {/* Full Display Name */}
              <div className="bg-white dark:bg-[#131d38] rounded-[20px] p-3.5 sm:p-4 shadow-[4px_4px_14px_rgba(170,185,220,0.15),-4px_-4px_14px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_12px_rgba(0,0,0,0.25)] flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-[14px] bg-[#EEF4FF] dark:bg-blue-950/60 shadow-[inset_1.5px_1.5px_3px_rgba(180,195,230,0.2),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-center text-[#2563EB] dark:text-blue-400 shrink-0">
                  <User className="h-4.5 w-4.5 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block leading-tight">Full Display Name</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white block mt-0.5 leading-tight">
                    {user.displayName || 'Rajesh Sharma'}
                  </span>
                </div>
              </div>

              {/* Username / Fixed Role */}
              <div className="bg-white dark:bg-[#131d38] rounded-[20px] p-3.5 sm:p-4 shadow-[4px_4px_14px_rgba(170,185,220,0.15),-4px_-4px_14px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_12px_rgba(0,0,0,0.25)] flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-[14px] bg-[#EEF4FF] dark:bg-blue-950/60 shadow-[inset_1.5px_1.5px_3px_rgba(180,195,230,0.2),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-center text-[#2563EB] dark:text-blue-400 shrink-0">
                  <FileText className="h-4.5 w-4.5 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block leading-tight">Username / Fixed Role</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">
                      {user.username}
                    </span>
                    <span className="px-2 py-0.5 rounded-[6px] bg-[#DBEAFE] dark:bg-blue-950 text-[#1D4ED8] dark:text-blue-300 text-[11px] font-semibold leading-none">
                      {user.role || 'Admin'})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: Email Address & Phone Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
              {/* Email Address */}
              <div className="bg-white dark:bg-[#131d38] rounded-[20px] p-3.5 sm:p-4 shadow-[4px_4px_14px_rgba(170,185,220,0.15),-4px_-4px_14px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_12px_rgba(0,0,0,0.25)] flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-[14px] bg-[#EEF4FF] dark:bg-blue-950/60 shadow-[inset_1.5px_1.5px_3px_rgba(180,195,230,0.2),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-center text-[#2563EB] dark:text-blue-400 shrink-0">
                  <Mail className="h-4.5 w-4.5 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block leading-tight">Email Address</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white block mt-0.5 leading-tight">
                    {user.email || COMPANY_CONFIG.email}
                  </span>
                </div>
              </div>

              {/* Phone Number */}
              <div className="bg-white dark:bg-[#131d38] rounded-[20px] p-3.5 sm:p-4 shadow-[4px_4px_14px_rgba(170,185,220,0.15),-4px_-4px_14px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_12px_rgba(0,0,0,0.25)] flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-[14px] bg-[#EEF4FF] dark:bg-blue-950/60 shadow-[inset_1.5px_1.5px_3px_rgba(180,195,230,0.2),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-center text-[#2563EB] dark:text-blue-400 shrink-0">
                  <Phone className="h-4.5 w-4.5 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block leading-tight">Phone Number</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white block mt-0.5 leading-tight">
                    {user.phone || COMPANY_CONFIG.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* ROW 3: Security PIN (Full Width) */}
            <div className="bg-white dark:bg-[#131d38] rounded-[20px] p-3.5 sm:p-4 shadow-[4px_4px_14px_rgba(170,185,220,0.15),-4px_-4px_14px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_12px_rgba(0,0,0,0.25)] flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-[14px] bg-[#EEF4FF] dark:bg-blue-950/60 shadow-[inset_1.5px_1.5px_3px_rgba(180,195,230,0.2),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-center text-[#2563EB] dark:text-blue-400 shrink-0">
                  <KeyRound className="h-4.5 w-4.5 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block leading-tight">Security PIN</span>
                  <span className="text-sm font-bold font-mono tracking-widest text-slate-800 dark:text-white block mt-0.5 leading-tight">
                    {showPin ? (isPinHashed(user.pin) ? 'SHA-256 (Protected)' : (user.pin || '1234')) : '••••'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[#EEF4FF] dark:bg-slate-800 text-xs font-semibold text-[#2563EB] dark:text-blue-400 shadow-[2px_2px_5px_rgba(180,195,230,0.2),-2px_-2px_5px_rgba(255,255,255,0.9)] dark:shadow-none hover:opacity-90 transition cursor-pointer"
              >
                {showPin ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 stroke-[2]" />
                    <span>Hide PIN</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 stroke-[2]" />
                    <span>Show PIN</span>
                  </>
                )}
              </button>
            </div>

            {/* ROW 4: SAHEB PAPER PVT. LTD. (OFFICIAL MILL REGISTRY) */}
            <div className="bg-white dark:bg-[#131d38] rounded-[22px] p-4 sm:p-4.5 shadow-[5px_5px_16px_rgba(170,185,220,0.18),-5px_-5px_16px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_14px_rgba(0,0,0,0.35)] border-l-[4px] border-l-[#2563EB] space-y-3">
              <div className="flex items-center justify-between gap-3 pb-0.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[12px] bg-[#EEF4FF] dark:bg-blue-950/60 shadow-[inset_1.5px_1.5px_3px_rgba(180,195,230,0.2),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-center text-[#2563EB] dark:text-blue-400 shrink-0">
                    <Building2 className="h-4.5 w-4.5 stroke-[2]" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase">
                    {COMPANY_CONFIG.name}
                  </h3>
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] bg-[#EEF4FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_5px_rgba(180,195,230,0.2),-2px_-2px_5px_rgba(255,255,255,0.9)] dark:shadow-none">
                    <ShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
                    <span>OFFICIAL MILL REGISTRY</span>
                  </div>
                </div>
              </div>

              {/* Company Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                {/* Phone / WhatsApp */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#EEF4FF] dark:bg-blue-950/60 shadow-[inset_1px_1px_2px_rgba(180,195,230,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-center text-[#2563EB] dark:text-blue-400 shrink-0">
                    <Phone className="h-3.5 w-3.5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 block leading-tight">Phone / WhatsApp</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-white block mt-0.5 font-mono leading-tight">{COMPANY_CONFIG.phone}</span>
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#EEF4FF] dark:bg-blue-950/60 shadow-[inset_1px_1px_2px_rgba(180,195,230,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-center text-[#2563EB] dark:text-blue-400 shrink-0">
                    <Mail className="h-3.5 w-3.5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 block leading-tight">Email Address</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-white block mt-0.5 leading-tight">{COMPANY_CONFIG.email}</span>
                  </div>
                </div>

                {/* Official Website */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#EEF4FF] dark:bg-blue-950/60 shadow-[inset_1px_1px_2px_rgba(180,195,230,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-center text-[#2563EB] dark:text-blue-400 shrink-0">
                    <Globe className="h-3.5 w-3.5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 block leading-tight">Official Website</span>
                    <a href={COMPANY_CONFIG.websiteUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline block mt-0.5 leading-tight">
                      {COMPANY_CONFIG.website}
                    </a>
                  </div>
                </div>

                {/* Registered Plant Address */}
                <div className="flex items-center gap-2.5 md:col-span-2">
                  <div className="w-8 h-8 rounded-full bg-[#EEF4FF] dark:bg-blue-950/60 shadow-[inset_1px_1px_2px_rgba(180,195,230,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-center text-[#2563EB] dark:text-blue-400 shrink-0">
                    <MapPin className="h-3.5 w-3.5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 block leading-tight">Registered Plant Address</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 block mt-0.5 leading-tight font-normal">{COMPANY_CONFIG.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3 px-5 rounded-[18px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs sm:text-sm shadow-[0_4px_14px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Edit3 className="h-4 w-4 stroke-[2]" />
                <span>Update My Profile Details</span>
                <ChevronRight className="h-4 w-4 stroke-[2]" />
              </button>

              <button
                onClick={logout}
                className="w-full py-3 px-5 rounded-[18px] bg-[#FFF1F2] hover:bg-[#FFE4E6] dark:bg-red-950/30 text-[#EF4444] border border-[#FECDD3] dark:border-red-900/40 font-semibold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4 stroke-[2]" />
                <span>Logout of Account</span>
              </button>
            </div>

            {/* FOOTER METADATA */}
            <div className="flex items-center justify-between text-[#94A3B8] dark:text-slate-500 text-[11px] font-normal pt-1 px-1">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>Last login: 19 Aug 2026, 10:24 AM</span>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(true)}
                className="inline-flex items-center gap-1.5 font-bold text-[#2563EB] dark:text-blue-400 hover:underline cursor-pointer"
              >
                <span>Saheb Paper ERP v{APP_VERSION}</span>
              </button>
            </div>
          </div>
        ) : (
          /* EDIT ADMIN PROFILE FORM */
          <form onSubmit={handleSaveProfile} className="bg-white dark:bg-[#131d38] rounded-[20px] p-5 shadow-[5px_5px_16px_rgba(170,185,220,0.18),-5px_-5px_16px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_14px_rgba(0,0,0,0.35)] space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5 dark:border-slate-700">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Edit Master Admin Credentials
              </h2>
              <span className="text-xs font-semibold text-[#2563EB] dark:text-blue-400">Editing Admin Account</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[10px] text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[10px] text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number (10 Digits)</label>
                <input
                  type="text"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[10px] text-xs font-medium font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  placeholder="e.g. 8000563666"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  4-Digit Security PIN <span className="text-[10px] text-slate-400 font-normal">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="•••• (Unchanged)"
                  className="w-full px-3 py-2 bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[10px] text-xs font-mono font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Security Question</label>
                <select
                  value={securityQuestion}
                  onChange={e => setSecurityQuestion(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[10px] text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                >
                  <option value="What is your favorite color?">What is your favorite color?</option>
                  <option value="What is your pet's name?">What is your pet's name?</option>
                  <option value="What town were you born in?">What town were you born in?</option>
                  <option value="What is your favorite food?">What is your favorite food?</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Security Answer</label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={e => setSecurityAnswer(e.target.value)}
                  placeholder="Answer for account recovery"
                  className="w-full px-3 py-2 bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[10px] text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 rounded-[10px] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Admin Credentials</span>
              </button>
            </div>
          </form>
        )}
      </div>

      <AppUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />

    </div>
  );
};

export default AdminProfileView;
