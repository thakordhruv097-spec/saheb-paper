export interface AppVersionInfo {
  version: string;
  versionCode: number;
  releaseDate: string;
  title: string;
  highlights: string[];
  packageSizeMb: number;
  mandatory?: boolean;
}

export const CURRENT_CLIENT_VERSION = '1.2.0';
export const CURRENT_CLIENT_VERSION_CODE = 3;

const LOCAL_VERSION_KEY = 'saheb_installed_version_code';
const LAST_UPDATE_CHECK_KEY = 'saheb_last_update_check';
const DISMISSED_VERSION_KEY = 'saheb_dismissed_version_code';

/**
 * Get current installed version code
 */
export function getInstalledVersionCode(): number {
  try {
    const stored = localStorage.getItem(LOCAL_VERSION_KEY);
    return stored ? parseInt(stored, 10) : CURRENT_CLIENT_VERSION_CODE;
  } catch {
    return CURRENT_CLIENT_VERSION_CODE;
  }
}

/**
 * Save installed version code after successful update
 */
export function markVersionInstalled(versionCode: number): void {
  try {
    localStorage.setItem(LOCAL_VERSION_KEY, String(versionCode));
    localStorage.removeItem(DISMISSED_VERSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Check if a specific version code was dismissed for today
 */
export function isVersionDismissed(versionCode: number): boolean {
  try {
    const dismissed = localStorage.getItem(DISMISSED_VERSION_KEY);
    return dismissed === String(versionCode);
  } catch {
    return false;
  }
}

/**
 * Dismiss version notification temporarily
 */
export function dismissVersion(versionCode: number): void {
  try {
    localStorage.setItem(DISMISSED_VERSION_KEY, String(versionCode));
  } catch {
    // ignore
  }
}

/**
 * Fetch latest version metadata from the server with cache-busting
 */
export async function checkServerVersion(): Promise<AppVersionInfo | null> {
  try {
    const timestamp = Date.now();
    const url = `${import.meta.env.BASE_URL}version.json?_t=${timestamp}`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: AppVersionInfo = await response.json();
    localStorage.setItem(LAST_UPDATE_CHECK_KEY, String(Date.now()));
    return data;
  } catch (err) {
    console.debug('[AppUpdateService] Version check skipped:', err);
    return null;
  }
}

/**
 * Clears service workers and caches cleanly during update
 */
export async function clearAppCaches(): Promise<void> {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
  } catch (e) {
    console.warn('[AppUpdateService] Cache clear error:', e);
  }
}
