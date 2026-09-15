import React, { useState } from 'react';
import { useAuth, getFirstAccessibleRoute } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Building2,
  Pencil,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Check,
} from 'lucide-react';
import {
  getCompanyConfig,
  saveCompanyConfig,
  resetCompanyConfig,
  type CompanyConfig,
} from '../../config/company';

export const CompanySettingsView: React.FC = () => {
  const { user, isSimulating } = useAuth();

  // Company Profile Settings States
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>(() => getCompanyConfig());
  const [compName, setCompName] = useState(companyConfig.name);
  const [compLegalName, setCompLegalName] = useState(companyConfig.legalName);
  const [compPhone, setCompPhone] = useState(companyConfig.phone);
  const [compEmail, setCompEmail] = useState(companyConfig.email);
  const [compWebsite, setCompWebsite] = useState(companyConfig.website);
  const [compGstin, setCompGstin] = useState(companyConfig.gstin || '');
  const [compAddress, setCompAddress] = useState(companyConfig.address);
  const [compTagline, setCompTagline] = useState(companyConfig.tagline);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Access Control: Super Admin or Management
  if (user?.role !== 'Admin' && user?.username.toLowerCase() !== 'admin') {
    if (isSimulating) {
      return <Navigate to={getFirstAccessibleRoute(user)} replace />;
    }
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-800 space-y-3 max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-base font-black text-slate-900 dark:text-white">Access Restricted</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
          Company & Plant Settings is strictly restricted to Super Admin only.
        </p>
      </div>
    );
  }

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!compName.trim() || !compPhone.trim() || !compEmail.trim()) {
      setErrorMsg('Company Name, Phone, and Email are required.');
      return;
    }

    const updated = saveCompanyConfig({
      name: compName.trim(),
      legalName: compLegalName.trim(),
      phone: compPhone.trim(),
      whatsapp: compPhone.trim(),
      email: compEmail.trim(),
      website: compWebsite.trim(),
      websiteUrl: compWebsite.trim().startsWith('http')
        ? compWebsite.trim()
        : `https://${compWebsite.trim()}`,
      gstin: compGstin.trim(),
      address: compAddress.trim(),
      tagline: compTagline.trim(),
    });

    setCompanyConfig(updated);
    setSuccessMsg(
      'Company & Mill Profile updated successfully! Changes apply across all screens, PDFs, and invoices.'
    );

    // Notify other components/tabs
    window.dispatchEvent(new Event('saheb_data_updated'));
    window.dispatchEvent(new Event('storage'));

    setTimeout(() => {
      setSuccessMsg('');
    }, 5000);
  };

  const handleResetCompany = () => {
    if (confirm('Are you sure you want to restore company details to official factory defaults?')) {
      const reset = resetCompanyConfig();
      setCompanyConfig(reset);
      setCompName(reset.name);
      setCompLegalName(reset.legalName);
      setCompPhone(reset.phone);
      setCompEmail(reset.email);
      setCompWebsite(reset.website);
      setCompGstin(reset.gstin || '');
      setCompAddress(reset.address);
      setCompTagline(reset.tagline);
      setSuccessMsg('Company profile restored to official defaults.');

      window.dispatchEvent(new Event('saheb_data_updated'));
      window.dispatchEvent(new Event('storage'));

      setTimeout(() => {
        setSuccessMsg('');
      }, 5000);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* 1. CLEAN HEADER CARD WITH COMPANY & PLANT SETTINGS TITLE */}
      <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
              <Building2 className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                  Company &amp; Plant Settings
                </h1>
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold">
                  System Settings
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Configure official company profile, plant address, GSTIN, and contact details used across printouts, reports, and invoices.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-2xl border border-red-200 dark:border-red-800 font-bold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. LIVE PREVIEW CARD */}
      <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-900/90 dark:via-blue-950/40 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/60 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-blue-800/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary text-white shadow-md shadow-blue-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                {companyConfig.name}
              </h4>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {companyConfig.legalName} {companyConfig.tagline ? `• ${companyConfig.tagline}` : ''}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
            Active Configuration
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-white/80 dark:bg-slate-800/70 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
              Phone / WhatsApp
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-white">
              {companyConfig.phone}
            </span>
          </div>
          <div className="p-3 bg-white/80 dark:bg-slate-800/70 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
              Email Address
            </span>
            <span className="font-semibold text-slate-800 dark:text-white">
              {companyConfig.email}
            </span>
          </div>
          <div className="p-3 bg-white/80 dark:bg-slate-800/70 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
              Official Website
            </span>
            <a
              href={companyConfig.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-bold"
            >
              {companyConfig.website}
            </a>
          </div>
          {companyConfig.gstin && (
            <div className="p-3 bg-white/80 dark:bg-slate-800/70 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                GSTIN
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-white">
                {companyConfig.gstin}
              </span>
            </div>
          )}
          <div className="p-3 bg-white/80 dark:bg-slate-800/70 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 sm:col-span-2 md:col-span-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
              Physical Plant &amp; Registered Office Address
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {companyConfig.address}
            </span>
          </div>
        </div>
      </div>

      {/* 3. EDIT FORM */}
      <form
        onSubmit={handleCompanySubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-primary dark:text-blue-400">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Update Company &amp; Mill Details
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Modify company profile, contact details, GSTIN, and plant address dynamically without changing source code.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetCompany}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0"
            title="Reset all fields to factory defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restore Defaults</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Brand / Short Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={compName}
              onChange={e => setCompName(e.target.value)}
              className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
              placeholder="e.g. Saheb Paper"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Legal Registered Entity Name
            </label>
            <input
              type="text"
              value={compLegalName}
              onChange={e => setCompLegalName(e.target.value)}
              className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
              placeholder="e.g. Saheb Paper Mill Private Limited"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Phone / WhatsApp Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={compPhone}
              onChange={e => setCompPhone(e.target.value)}
              className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
              placeholder="e.g. +91 98250 12345"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Official Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={compEmail}
              onChange={e => setCompEmail(e.target.value)}
              className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
              placeholder="e.g. info@sahebpaper.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Official Website URL
            </label>
            <input
              type="text"
              value={compWebsite}
              onChange={e => setCompWebsite(e.target.value)}
              className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
              placeholder="e.g. www.sahebpaper.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              GSTIN / Tax Identification
            </label>
            <input
              type="text"
              value={compGstin}
              onChange={e => setCompGstin(e.target.value)}
              className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
              placeholder="e.g. 24AAAAA0000A1Z5"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Tagline / Industry Subtitle
            </label>
            <input
              type="text"
              value={compTagline}
              onChange={e => setCompTagline(e.target.value)}
              className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
              placeholder="e.g. Premium Kraft Paper & Industrial Packaging Solutions"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Plant &amp; Registered Office Address
            </label>
            <textarea
              rows={3}
              value={compAddress}
              onChange={e => setCompAddress(e.target.value)}
              className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
              placeholder="e.g. Survey No. 123/P, Near Industrial Estate, Morbi-Rajkot Highway..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="btn-primary-gradient px-6 py-3 text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/25 active:scale-98"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Save Company Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
