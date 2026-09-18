import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id?: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface MobileToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const MobileToast: React.FC<MobileToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration || 3500;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const typeStyles = {
    success: {
      bg: 'bg-white dark:bg-[#131d38]',
      border: 'border-emerald-500/40 dark:border-emerald-500/50',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      Icon: CheckCircle2,
      titleColor: 'text-slate-900 dark:text-white',
      accentBar: 'bg-emerald-500',
    },
    error: {
      bg: 'bg-white dark:bg-[#131d38]',
      border: 'border-rose-500/40 dark:border-rose-500/50',
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
      Icon: AlertCircle,
      titleColor: 'text-slate-900 dark:text-white',
      accentBar: 'bg-rose-500',
    },
    warning: {
      bg: 'bg-white dark:bg-[#131d38]',
      border: 'border-amber-500/40 dark:border-amber-500/50',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      Icon: AlertTriangle,
      titleColor: 'text-slate-900 dark:text-white',
      accentBar: 'bg-amber-500',
    },
    info: {
      bg: 'bg-white dark:bg-[#131d38]',
      border: 'border-blue-500/40 dark:border-blue-500/50',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
      Icon: Info,
      titleColor: 'text-slate-900 dark:text-white',
      accentBar: 'bg-blue-500',
    },
  };

  const style = typeStyles[toast.type] || typeStyles.info;
  const IconComponent = style.Icon;

  return (
    <div
      role="alert"
      className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-[420px] pointer-events-auto transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-5"
    >
      <div
        className={`${style.bg} ${style.border} border rounded-2xl shadow-2xl p-3.5 sm:p-4 flex items-start gap-3 relative overflow-hidden backdrop-blur-md`}
      >
        {/* Left Side Color Accent Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.accentBar}`} />

        {/* Status Icon */}
        <div className={`p-2 rounded-xl ${style.iconBg} shrink-0 mt-0.5 shadow-2xs`}>
          <IconComponent className="w-5 h-5 stroke-[2.2]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <h4 className={`text-xs sm:text-sm font-black ${style.titleColor} leading-tight`}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5 leading-relaxed break-words">
              {toast.message}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0 cursor-pointer -mr-1"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
