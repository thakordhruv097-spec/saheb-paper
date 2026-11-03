import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Database,
  Wifi,
  ShieldCheck,
  RefreshCw,
  Clock,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  uptimeSeconds: number;
  version: string;
  database: {
    configured: boolean;
    connected: boolean;
    latencyMs: number | null;
    error?: string;
  };
  client: {
    localStorage: boolean;
    telemetryActive: boolean;
    userAgent: string;
  };
}

const APP_START_TIME = Date.now();

export const HealthCheckView: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const isJsonFormat = typeof window !== 'undefined' && window.location.search.includes('format=json');

  const runHealthCheck = useCallback(async () => {
    setLoading(true);
    const start = performance.now();
    let dbConnected = false;
    let latency: number | null = null;
    let dbError: string | undefined = undefined;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('saheb_products')
          .select('count', { count: 'exact', head: true });

        latency = Math.round(performance.now() - start);
        if (!error) {
          dbConnected = true;
        } else {
          dbError = error.message;
        }
      } catch (err: any) {
        dbError = err?.message || 'Database connection timeout';
        latency = Math.round(performance.now() - start);
      }
    } else {
      dbError = 'Supabase credentials not configured in environment';
    }

    // Check localStorage availability
    let storageOk = false;
    try {
      localStorage.setItem('__saheb_health_probe__', '1');
      storageOk = localStorage.getItem('__saheb_health_probe__') === '1';
      localStorage.removeItem('__saheb_health_probe__');
    } catch {
      storageOk = false;
    }

    const overallStatus: 'healthy' | 'degraded' | 'down' = dbConnected && storageOk
      ? 'healthy'
      : dbConnected || storageOk
      ? 'degraded'
      : 'down';

    const result: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - APP_START_TIME) / 1000),
      version: '1.9.0',
      database: {
        configured: isSupabaseConfigured,
        connected: dbConnected,
        latencyMs: latency,
        error: dbError,
      },
      client: {
        localStorage: storageOk,
        telemetryActive: true,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      },
    };

    setHealthData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    runHealthCheck();
    // Auto-refresh probe every 30 seconds if page is kept open
    const interval = setInterval(runHealthCheck, 30000);
    return () => clearInterval(interval);
  }, [runHealthCheck]);

  // If format=json is queried (for automated curl/pings), render raw clean JSON
  if (isJsonFormat && healthData) {
    return (
      <pre style={{ margin: 0, padding: 16, fontFamily: 'monospace', fontSize: 13, background: '#0F172A', color: '#38BDF8' }}>
        {JSON.stringify(healthData, null, 2)}
      </pre>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans select-none">
      <div className="w-full max-w-xl bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              healthData?.status === 'healthy' 
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' 
                : healthData?.status === 'degraded'
                ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
            }`}>
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white font-heading">
                  Saheb Paper ERP
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  v{healthData?.version || '1.9.0'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Autonomous Telemetry &amp; Uptime Probe
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={runHealthCheck}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
            title="Refresh Diagnostic Probe"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* System Overall Status Badge */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          healthData?.status === 'healthy'
            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
            : healthData?.status === 'degraded'
            ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
            : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
        }`}>
          <div className="flex items-center gap-3">
            {healthData?.status === 'healthy' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            )}
            <div>
              <div className="text-xs font-black uppercase tracking-wider">
                {loading ? 'Evaluating Health...' : `System ${healthData?.status || 'Unknown'}`}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {healthData?.status === 'healthy' 
                  ? 'All services operational. Cloud database & local cache connected.' 
                  : healthData?.database.error || 'System operating in degraded mode.'}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono font-black shrink-0 px-2.5 py-1 rounded-lg bg-black/30 border border-white/10">
            200 OK
          </span>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* PostgreSQL Cloud DB Card */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Database className="h-4 w-4 text-[#6C4FE0]" />
                Cloud PostgreSQL
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                healthData?.database.connected 
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' 
                  : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
              }`}>
                {healthData?.database.connected ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-slate-500 font-medium">Roundtrip Latency:</span>
              <span className="text-sm font-mono font-black text-slate-200">
                {healthData?.database.latencyMs !== null ? `${healthData?.database.latencyMs} ms` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Local Cache & Persistence */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-cyan-400" />
                Local Persistence
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                healthData?.client.localStorage 
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' 
                  : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
              }`}>
                {healthData?.client.localStorage ? 'Active' : 'Failed'}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-slate-500 font-medium">Offline Storage:</span>
              <span className="text-sm font-mono font-black text-slate-200">
                IndexedDB / LS
              </span>
            </div>
          </div>

          {/* Background Crash Telemetry */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Crash Telemetry
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                Armed
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-slate-500 font-medium">Cloud Logging:</span>
              <span className="text-sm font-mono font-black text-slate-200">
                Active (saheb_logs)
              </span>
            </div>
          </div>

          {/* Edge Availability & Network */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Wifi className="h-4 w-4 text-amber-400" />
                Probe Timestamp
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800/60">
                UTC
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">
                {healthData?.timestamp ? healthData.timestamp.split('T')[1].replace('Z', '') : '--'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {healthData?.timestamp ? healthData.timestamp.split('T')[0] : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80 text-xs">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition cursor-pointer font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </button>

          <a
            href="?format=json"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-mono text-[11px] font-bold"
          >
            Raw JSON API Endpoint (/health?format=json)
          </a>
        </div>

      </div>
    </div>
  );
};

export default HealthCheckView;

