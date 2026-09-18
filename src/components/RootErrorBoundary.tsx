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

      return (
        <div className="min-h-screen min-h-[100dvh] w-full bg-[#0B132B] text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans select-none">
          <div className="w-full max-w-[460px] bg-[#141E38] rounded-3xl border border-slate-700/70 p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg">
              {isChunkError ? <Sparkles className="w-8 h-8 text-blue-400" /> : <AlertTriangle className="w-8 h-8" />}
            </div>

            {/* Error Titles */}
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight text-white font-heading">
                {isChunkError ? 'System Update Available' : 'Something Went Wrong'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {isChunkError
                  ? 'A new version of Saheb Paper ERP is available. Please refresh to load the latest system updates.'
                  : 'An unexpected application issue occurred. Your data is safe. Please refresh to continue.'}
              </p>
            </div>

            {/* Error Detail Pill */}
            {!isChunkError && this.state.error?.message && (
              <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-left text-[11px] font-mono text-slate-400 overflow-x-auto">
                <span className="text-rose-400 font-bold block mb-0.5">Diagnostic info ({device}):</span>
                <span className="line-clamp-2">{this.state.error.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-5 rounded-2xl bg-[#5E3BE8] hover:bg-[#4E27E0] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh &amp; Reload</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
            </div>

            {/* Footer Brand */}
            <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 font-medium">
              Saheb Paper ERP • Palanpur, Gujarat
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
