import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { RefreshCw, AlertTriangle, Home, Sparkles } from 'lucide-react';
import { getDeviceInfo } from '../utils/deviceHelper';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[RootErrorBoundary Captured]:', error, errorInfo);

    // Auto-recover from dynamic import failures after fresh web deployments
    const msg = (error?.message || '').toLowerCase();
    if (
      msg.includes('dynamically imported module') ||
      msg.includes('failed to fetch') ||
      msg.includes('importing a module script failed') ||
      msg.includes('loading chunk') ||
      msg.includes('error loading dynamically imported')
    ) {
      const reloadKey = 'saheb_chunk_reload_lock';
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, 'true');
        console.warn('[RootErrorBoundary] New deployment detected. Reloading latest bundle...');
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  handleGoHome = () => {
    sessionStorage.clear();
    window.location.href = window.location.origin + window.location.pathname + '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError =
        (this.state.error?.message || '').toLowerCase().includes('dynamically imported') ||
        (this.state.error?.message || '').toLowerCase().includes('failed to fetch');
      const device = getDeviceInfo();
      const logoUrl = `${import.meta.env.BASE_URL}logo.webp`;

      return (
        <div className="min-h-screen min-h-[100dvh] w-full bg-[#EFEFFD] text-slate-800 flex items-center justify-center p-4 sm:p-6 font-sans select-none">
          <div className="w-full max-w-[460px] bg-white rounded-3xl border border-[#E5E3FB] p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(94,59,232,0.18)] text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Saheb Logo & Alert Icon */}
            <div className="flex flex-col items-center justify-center gap-3">
              <img
                src={logoUrl}
                alt="Saheb Paper"
                className="h-10 w-auto object-contain drop-shadow-2xs"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shadow-xs">
                {isChunkError ? (
                  <Sparkles className="w-7 h-7 text-[#5E3BE8]" />
                ) : (
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                )}
              </div>
            </div>

            {/* Error Titles */}
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
                {isChunkError ? 'System Update Available' : 'Something Went Wrong'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                {isChunkError
                  ? 'A new version of Saheb Paper ERP is available. Please refresh to load the latest system updates.'
                  : 'An unexpected application issue occurred. Your data is safe. Please refresh to continue.'}
              </p>
            </div>

            {/* Error Detail Pill */}
            {!isChunkError && this.state.error?.message && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-[11px] font-mono text-slate-600 overflow-x-auto">
                <span className="text-rose-600 font-bold block mb-1">Diagnostic info ({device}):</span>
                <span className="text-slate-800 font-semibold break-words">{this.state.error.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-5 rounded-2xl bg-[#5E3BE8] hover:bg-[#4E27E0] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#5E3BE8]/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh &amp; Reload</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="py-3 px-5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
            </div>

            {/* Footer Brand */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
              Saheb Paper ERP • Palanpur, Gujarat
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
