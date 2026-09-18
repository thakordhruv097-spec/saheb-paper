/**
 * Crash Monitoring & Resilience Telemetry Service
 * Catches uncaught runtime exceptions and records diagnostic logs.
 */

import { addLog } from '../data/index';
import { getDeviceInfo } from '../utils/deviceHelper';

let isTelemetryInitialized = false;

export function initTelemetry(): void {
  if (isTelemetryInitialized || typeof window === 'undefined') return;
  isTelemetryInitialized = true;

  // 1. Uncaught Javascript Errors
  window.addEventListener('error', (event: ErrorEvent) => {
    try {
      const device = getDeviceInfo();
      const errorMsg = event.message || 'Unknown Javascript Error';
      const file = event.filename ? event.filename.split('/').pop() : 'inline';
      const line = event.lineno || 0;

      console.error(`[Telemetry Error (${device})]:`, event.error || errorMsg);

      addLog(
        'System',
        'Runtime Error Captured',
        `Error: ${errorMsg} (${file}:${line}) on [${device}]`,
        'CrashMonitor'
      );
    } catch (e) {
      console.warn('Telemetry error handler failed:', e);
    }
  });

  // 2. Unhandled Promise Rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    try {
      const device = getDeviceInfo();
      const reason = event.reason?.message || String(event.reason) || 'Unhandled Promise Rejection';
      
      // Ignore routine network aborts or chunk reload retries
      if (reason.includes('AbortError') || reason.includes('dynamically imported')) {
        return;
      }

      console.error(`[Telemetry Unhandled Rejection (${device})]:`, event.reason);

      addLog(
        'System',
        'Unhandled Rejection Captured',
        `Rejection: ${reason.substring(0, 150)} on [${device}]`,
        'CrashMonitor'
      );
    } catch (e) {
      console.warn('Telemetry rejection handler failed:', e);
    }
  });
}
