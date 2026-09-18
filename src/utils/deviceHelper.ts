/**
 * Device & Platform Helper Utility
 * Identifies the client environment (Android App, Windows PC, iOS, etc.)
 */

export function getDeviceInfo(): string {
  if (typeof navigator === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent || '';
  
  // Capacitor / Native Android wrapper check
  if ((window as any)?.Capacitor?.isNativePlatform?.() || /android/i.test(ua)) {
    return 'Android App';
  }
  
  if (/iPad|iPhone|iPod/.test(ua)) {
    return 'iOS Device';
  }
  
  if (/Windows NT/i.test(ua)) {
    return 'Windows PC';
  }
  
  if (/Macintosh|Mac OS X/i.test(ua)) {
    return 'Mac OS';
  }
  
  if (/Linux/i.test(ua)) {
    return 'Linux PC';
  }
  return 'Web Client';
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isCap = (window as any)?.Capacitor?.isNativePlatform?.() || (window as any)?.Capacitor?.getPlatform?.() === 'android';
  return !!(isCap || /android/i.test(ua));
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return isAndroidDevice() || /iPad|iPhone|iPod|Mobile/i.test(ua);
}

