/**
 * Theme helper for Saheb Paper ERP
 * Synchronizes Dark/Light mode across Layout, Mobile Profile, and DOM
 */

export const getStoredTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('saheb_theme') === 'dark';
  } catch {
    return false;
  }
};

export const applyTheme = (isDark: boolean) => {
  if (typeof document === 'undefined') return;
  try {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('saheb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('saheb_theme', 'light');
    }
  } catch (err) {
    console.warn('[Theme] Could not persist theme preference:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('saheb_theme_changed', { detail: { isDark } }));
  }
};
