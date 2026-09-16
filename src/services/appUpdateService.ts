export interface AppVersionInfo {
  version: string;
  versionCode: number;
  releaseDate: string;
  title: string;
  highlights: string[];
  packageSizeMb: number;
  mandatory?: boolean;
}

export const CURRENT_CLIENT_VERSION = '1.3.0';
export const CURRENT_CLIENT_VERSION_CODE = 4;

const LOCAL_VERSION_KEY = 'saheb_installed_version_code';
const LAST_UPDATE_CHECK_KEY = 'saheb_last_update_check';
const DISMISSED_VERSION_KEY = 'saheb_dismissed_version_code';

/**
 * Get current installed version code
 */
export function getInstalledVersionCode(): number {
  try {
    const stored = localStorage.getItem(LOCAL_VERSION_KEY);
    const parsed = stored ? parseInt(stored, 10) : CURRENT_CLIENT_VERSION_CODE;
    return isNaN(parsed) ? CURRENT_CLIENT_VERSION_CODE : Math.max(parsed, CURRENT_CLIENT_VERSION_CODE);
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
    localStorage.setItem(DISMISSED_VERSION_KEY, String(versionCode));
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
    `${import.meta.env.BASE_URL}version.json?_t=${timestamp}`,
    `https://raw.githubusercontent.com/thakordhruv097-spec/saheb-paper/main/public/version.json?_t=${timestamp}`,
    `https://saheb-paper-erp.thakordhruv097.workers.dev/version.json?_t=${timestamp}`,
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
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
