import React from 'react';
import { Shield, X, Lock, FileText, CheckCircle2, Building2, Printer, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] overflow-hidden text-left font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary dark:text-blue-400 border border-primary/20 shrink-0">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Privacy Policy &amp; Data Notice
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  DPDP Act 2023
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Saheb Paper Pvt. Ltd. — Internal Mill Operations &amp; ERP System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              title="Print Policy"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div
          data-modal-scroll="true"
          className="p-5 sm:p-7 overflow-y-auto overscroll-contain flex-1 space-y-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed scrollbar-thin"
        >
          
          {/* Quick Notice Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-950 dark:text-blue-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs">
              <Building2 className="h-4 w-4 text-primary shrink-0" />
              <span>Internal Enterprise Tool Notice</span>
            </div>
            <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80 leading-normal">
              This system is an internal industrial software designed solely for authorized employees, operators, and plant managers of <strong>Saheb Paper Pvt. Ltd.</strong> It is not a public commercial service.
            </p>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-primary" />
              1. Information We Collect
            </h3>
            <p>
              To maintain factory operations, batch traceability, quality control, and dispatch verification, the ERP collects:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li><strong>Operator Identification:</strong> Username, employee ID, display name, registered phone number, and designated plant role.</li>
              <li><strong>Machine &amp; Mill Telemetry:</strong> Shift production logs, jumbo roll weights, GSM samples, breakages, raw material consumption, boiler steam pressure, and ETP readings.</li>
              <li><strong>Dispatch &amp; Commercial Records:</strong> Customer party names, vendor names, vehicle registration numbers, driver contacts, and packing slip records.</li>
              <li><strong>Audit Logs:</strong> Immutable timestamps of all data creation, modification, stock deductions, and administrative operations.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              2. Purpose &amp; Legal Basis
            </h3>
            <p>
              Data processing is conducted strictly under the legitimate operational interests of Saheb Paper Pvt. Ltd. and in full compliance with the <em>Digital Personal Data Protection Act, 2023 (DPDP Act)</em> for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>End-to-end quality assurance (QC Grade A/B) and thermal barcode reel traceability.</li>
              <li>Warehouse inventory management and automated raw material reorder monitoring.</li>
              <li>Generation of legal dispatch invoices, packing slips, and GST e-Way bill reconciliations.</li>
              <li>System auditability, security enforcement, and fraud prevention.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              3. Data Security &amp; Confidentiality
            </h3>
            <p>
              We implement enterprise-grade technical safeguards to protect mill operational data:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li><strong>Role-Based Access Control (RBAC):</strong> Plant operators only access modules relevant to their assigned shift and station.</li>
              <li><strong>Row-Level Security (RLS):</strong> PostgreSQL database tables are safeguarded with strict RLS policies prohibiting unauthorized deletions.</li>
              <li><strong>Immutable Audit Trail:</strong> Transaction logs are write-only/append-only and cannot be tampered with or modified.</li>
              <li><strong>Session Timeouts:</strong> Inactive mobile/desktop sessions automatically expire to prevent unauthorized physical terminal access.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
              4. Data Sharing &amp; Third Parties
            </h3>
            <p>
              Saheb Paper Pvt. Ltd. does <strong>not sell, rent, or monetize</strong> any collected employee or operational data. Information is only shared with:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Statutory government portals (e.g. GST e-Way Bill authorities, pollution control boards) where legally mandated.</li>
              <li>Encrypted cloud infrastructure providers (Supabase / AWS) strictly bound by data confidentiality agreements.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              5. Grievance Officer &amp; Contact
            </h3>
            <p>
              For privacy queries, data correction requests, or operational policy reviews, contact:
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-[11px]">
              <div className="font-bold text-slate-900 dark:text-white">
                Saheb Paper Pvt. Ltd. (Compliance &amp; Data Privacy Desk)
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Survey No. 42/1, Chandsar Road, Palanpur, Gujarat — 385510</span>
              </div>
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 flex-wrap">
                <a href="tel:+918000563666" className="flex items-center gap-1 hover:text-primary transition">
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>+91 80005 63666</span>
                </a>
                <a href="mailto:privacy@sahebpaper.com" className="flex items-center gap-1 hover:text-primary transition">
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>privacy@sahebpaper.com</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
          <span className="text-[10px] text-slate-400 font-mono">
            Last Updated: September 2026 • v2.4
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-wider shadow-md hover:bg-blue-800 transition cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
export default PrivacyPolicyModal;
