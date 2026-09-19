export interface AppVersionInfo {
  version: string;
  versionCode: number;
  releaseDate: string;
  title: string;
  highlights: string[];
  packageSizeMb: number;
  mandatory?: boolean;
  apkUrl?: string;
  exeUrl?: string;
}

export const DEFAULT_CLIENT_VERSION = 'Beta 1.6';
export const DEFAULT_CLIENT_VERSION_CODE = 12;

const isStandaloneClient =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as any)?.standalone === true ||
    (window as any)?.Capacitor?.isNativePlatform?.());

export const CURRENT_CLIENT_VERSION =
  (typeof window !== 'undefined' &&
    window.localStorage &&
    window.localStorage.getItem('saheb_installed_version_name')) ||
  DEFAULT_CLIENT_VERSION;

export const CURRENT_CLIENT_VERSION_CODE =
  (typeof window !== 'undefined' &&
    window.localStorage &&
    parseInt(window.localStorage.getItem('saheb_installed_version_code') || '', 10)) ||
  DEFAULT_CLIENT_VERSION_CODE;

const LOCAL_VERSION_KEY = 'saheb_installed_version_code';
const LOCAL_VERSION_NAME_KEY = 'saheb_installed_version_name';
const LAST_UPDATE_CHECK_KEY = 'saheb_last_update_check';
const DISMISSED_VERSION_KEY = 'saheb_dismissed_version_code';

/**
 * Get current installed version code
 */
export function getInstalledVersionCode(): number {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(LOCAL_VERSION_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
    return 8;
  } catch {
    return 8;
  }
}

/**
 * Get current installed version name string (e.g. 'Beta 1.4')
 */
export function getInstalledVersionName(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(LOCAL_VERSION_NAME_KEY);
      if (stored) {
        return stored;
      }
    }
    return 'Beta 1.2';
  } catch {
    return 'Beta 1.2';
  }
}

/**
 * Robust check if a remote version info constitutes a new update
 */
export function isUpdateAvailable(info: AppVersionInfo | null): boolean {
  if (!info) return false;
  const currentCode = getInstalledVersionCode();
  const currentName = getInstalledVersionName();

  // 1. Check if server versionCode is strictly newer
  if (info.versionCode > currentCode) return true;

  // 2. Check if server version string differs (e.g. Beta 1.2 vs Beta 1.1)
  if (info.version && currentName && info.version.trim().toLowerCase() !== currentName.trim().toLowerCase()) {
    return true;
  }

  return false;
}

/**
 * Save installed version code and version name after successful update
 */
export function markVersionInstalled(versionCode: number, versionName?: string): void {
  try {
    localStorage.setItem(LOCAL_VERSION_KEY, String(versionCode));
    localStorage.setItem(DISMISSED_VERSION_KEY, String(versionCode));
    if (versionName) {
      localStorage.setItem(LOCAL_VERSION_NAME_KEY, versionName);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('saheb_version_updated', {
          detail: { versionCode, versionName },
        })
      );
    }
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
  const timestamp = Date.now();
  const candidateUrls = [
    `https://raw.githubusercontent.com/thakordhruv097-spec/saheb-paper/main/public/version.json?_t=${timestamp}`,
    `https://api.github.com/repos/thakordhruv097-spec/saheb-paper/contents/public/version.json?_t=${timestamp}`,
    `https://thakordhruv097-spec.github.io/saheb-paper/version.json?_t=${timestamp}`,
    `${import.meta.env.BASE_URL}version.json?_t=${timestamp}`,
  ];

  for (const url of candidateUrls) {
    try {
      const isGithubApi = url.includes('api.github.com');
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          ...(isGithubApi ? { 'Accept': 'application/vnd.github.v3.raw' } : {}),
        },
      });

      if (response.ok) {
        const data: AppVersionInfo = await response.json();
        if (data && data.versionCode) {
          localStorage.setItem(LAST_UPDATE_CHECK_KEY, String(Date.now()));
          return data;
        }
      }
    } catch {
      // Fall through to next endpoint
    }
  }

  return null;
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
