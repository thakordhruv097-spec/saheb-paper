/**
 * Saheb Paper ERP — Application Version & Update Management
 * Single source of truth for build versions, changelogs, and update verification.
 */

export interface VersionChangelog {
  version: string;
  releaseDate: string;
  title: string;
  highlights: string[];
  mandatory?: boolean;
}

export interface AppUpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseDate: string;
  releaseNotes: string[];
  mandatory: boolean;
  downloadUrl?: string;
  changelogs: VersionChangelog[];
}

export const APP_BASE_VERSION = 'Beta 1.10.15';
export const APP_BASE_CODE = 35;
export const APP_BUILD_DATE = '2026-11-06';

const isStandaloneClient =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as any)?.standalone === true ||
    (window as any)?.Capacitor?.isNativePlatform?.());

export const APP_VERSION =
  (isStandaloneClient &&
    typeof window !== 'undefined' &&
    window.localStorage &&
    window.localStorage.getItem('saheb_installed_version_name')) ||
  APP_BASE_VERSION;

export const APP_CHANGELOGS: VersionChangelog[] = [
  {
    version: 'Beta 1.10.15',
    releaseDate: '2026-11-06',
    title: 'High-Accuracy Rapid QR Scanning & Customer Party Direct Entry (Beta 1.10.15)',
    mandatory: true,
    highlights: [
      'High-Accuracy Rapid QR Scanning: Tuned decode frequency (12 FPS), wide detection boundary & continuous hardware autofocus for instant mobile scan detection',
      'Customer Party Direct Typing: Type party name directly in dispatch and press Enter to auto-save to database and select immediately',
      'Camera Resolution Tuning: 720p hardware streaming eliminates mobile WebView CPU choking and frame lag',
      'Cache-Busting In-App Update: Cache-busting URL parameter reload guarantees fresh bundle loading on mobile app update',
    ],
  },
  {
    version: 'Beta 1.10.14',
    releaseDate: '2026-11-05',
    title: 'Dispatch Vehicle Validation, Scanner Refinements & Digits Filter (Beta 1.10.14)',
    mandatory: true,
    highlights: [
      'Indian Vehicle Formatting & Validation: Standard auto-hyphenation (GJ-05-BX-4921) with dynamic format hint badge',
      'Live QR Scanner Layout Optimization: Eliminated dead bottom space and improved mobile viewport flex fitting',
      'QR Verification Modal Dual-Theme: Complete Light Mode and Dark Mode styling for Reel Verified in Stock popup',
      'Digits-Only Reel Number Inputs: Strictly numeric inputs with numeric mobile keypad across dispatch and scanner',
      'Date Picker Cleanliness: Clean custom date picker without redundant timeframe selector tabs in dispatch forms',
      'Dark Mode Glow Fix: Removed unintended white neumorphic borders/glows in dark mode inputs and cards',
      'Localhost Testing Utilities: Safely isolated 15 test reels for local validation without affecting production cloud',
    ],
  },
  {
    version: 'Beta 1.10.13',
    releaseDate: '2026-11-05',
    title: 'Pure In-App Update Release (Beta 1.10.13)',
    mandatory: true,
    highlights: [
      'Pure In-App Update: Instant in-place reload with zero external browser popups',
      'Offline Service Worker Cache: Instant offline reload for uninterrupted mill operations',
      'Exact Preview PDF Layout & Color Matching',
    ],
  },
  {
    version: 'Beta 1.10.12',
    releaseDate: '2026-11-05',
    title: 'Instant In-App OTA Update Release (Beta 1.10.12)',
    mandatory: true,
    highlights: [
      'Pure In-App OTA Update: Instant smooth update and restart without APK downloads or browser popups',
      'Offline Service Worker Cache: Faster local asset loading in paper mill operations',
      'Exact Preview PDF Layout & Color Matching',
    ],
  },
  {
    version: 'Beta 1.10.11',
    releaseDate: '2026-11-05',
    title: 'Seamless In-App OTA Update Release (Beta 1.10.11)',
    mandatory: true,
    highlights: [
      'Seamless In-App OTA Update: Instant updates without APK downloads or Chrome redirects',
      'Offline Service Worker Cache: App opens and functions offline in mill environments',
      'Exact Preview PDF Matching: Generated Dispatch Receipt PDF matches Official Preview colors and formatting',
      'Zero Package Conflicts: Eliminates signature mismatch and uninstallation requirements',
    ],
  },
  {
    version: 'Beta 1.10.8',
    releaseDate: '2026-11-05',
    title: 'Clean Industrial Login & Security Release (Beta 1.10.8)',
    mandatory: true,
    highlights: [
      'Clean Industrial Login: Completely removed all festival themes, badges, and festive assets',
      'Standard Warehouse Photography: Authentic paper rolls background active across mobile and desktop',
      'Login Security Lockout: 3 failed attempts lockout threshold with clear admin contact details',
      'Strict 4-Digit PIN Validation: Sanitized numeric-only input requiring exact 4 digits',
      'Deep Two-Tone Audio Feedback: Dual resonant audio tones (380 Hz -> 260 Hz) on failed login verification',
      'Simplified Mobile Stock Summary: Compact single-spec reel counts, weights, and streamlined search interface',
      'Header UI Refinement: Clean single-pill user profile badge without duplicate role indicators',
    ],
  },
  {
    version: 'Beta 1.10.7',
    releaseDate: '2026-11-05',
    title: 'Mobile Polish, Deep Audio Feedback & Security Release (Beta 1.10.7)',
    mandatory: true,
    highlights: [
      'Login Lockout Security: 3 failed attempts lockout threshold with clear admin contact details',
      'Strict 4-Digit PIN Validation: Sanitized numeric-only input requiring exact 4 digits before submission',
      'Deep Two-Tone Audio Feedback: Dual resonant audio tones (380 Hz -> 260 Hz) on failed login verification',
      'Modern Full-Bleed Mobile Login: Full-screen responsive warehouse background photography with glass overlay',
      'Clean Security Alert Banner: Refined alert styling in header with solid rose-red badges',
      'Simplified Mobile Stock Summary: Compact single-spec reel counts, weights, and streamlined search interface',
      'Header UI Refinement: Clean single-pill user profile badge without duplicate role indicators',
    ],
  },
  {
    version: 'Beta 1.10.6',
    releaseDate: '2026-11-05',
    title: 'Exact Preview Matching & Native Direct PDF Release (Beta 1.10.6)',
    mandatory: true,
    highlights: [
      'Exact Preview Matching: Downloaded Dispatch Receipt PDF now matches the Official Preview modal format and colors identically',
      'Native MediaStore Direct PDF Save: Saves directly into /storage/emulated/0/Download/ without opening Chrome',
      'Seamless Offline Downloads: Zero external browser redirects, 100% in-app file saving',
    ],
  },
  {
    version: 'Beta 1.10.5',
    releaseDate: '2026-11-04',
    title: 'Scanner Accuracy & Industrial UI Release (Beta 1.10.5)',
    mandatory: true,
    highlights: [
      'Instant Barcode/QR Scanning: Native hardware BarcodeDetector & continuous auto-focus enabled (sub-40ms detect)',
      'Mobile Back Navigation: Hardware and in-app back buttons smoothly return to previous screen without jumping to dashboard',
      'Industrial ERP Badging: Replaced pastel green and sparkles with clean slate sequential tags (#1, #2, #3...)',
      'Clean Stock Categorization: Removed floating scan button for clean full-screen view',
      'Thermal Label Studio: Initial blank selection state preventing accidental reel prints',
    ],
  },
  {
    version: 'Beta 1.10.4',
    releaseDate: '2026-09-23',
    title: 'Master Registry Simplification & UI Polish (Beta 1.9)',
    mandatory: true,
    highlights: [
      'Product Masters: Simplified to Product Name only (removed GSM, Size, Ply, and QC Grade)',
      'Party & Vendor Masters: Removed Contact Number fields across all forms, tables, and dialogs',
      'Header UI: Removed redundant global refresh icon to keep dashboard clean',
      'Mobile Optimization: Complete cache sanitization and updated mobile listings',
    ],
  },
  {
    version: 'Beta 1.8',
    releaseDate: '2026-09-21',
    title: 'Stability & Data Integrity Patch (Beta 1.8)',
    highlights: [
      'Fix: Deleted dispatch challans no longer reappear after cloud sync',
      'Fix: Factory Reset now clears both local and cloud data completely',
      'Fix: Resolved merge conflicts in Excel export and dispatch modules',
      'Improved cloud sync reliability for packing slips',
    ],
  },
  {
    version: 'Beta 1.7',
    releaseDate: '2026-09-20',
    title: 'Corporate Excel & Unified PC-Mobile Release (Beta 1.7)',
    highlights: [
      'Enterprise Excel (.xlsx) Designer: Ultra-premium navy-gold company headers, formatted metadata & automated audit tables',
      'Flawless Layout Standard: Fixed contiguous rows, zero squished/collapsed lines, and locked executive footer standard',
      'Unified PC & Mobile Updates: Complete 1-click in-app updater and Check for Updates on both Windows PC and Mobile',
      'Quick-Access Desktop Sidebar: Mobile-style Check for Updates button with live version pill and 1-tap Logout',
      'Sub-second Cloud Sync & Offline Caching across all mill workstations',
    ],
  },
  {
    version: 'Beta 1.5',
    releaseDate: '2026-09-19',
    title: 'Mobile Header & Stock Filter Refinements (Beta 1.5)',
    highlights: [
      'Custom searchable select dropdowns across Stock Categorization filters',
      'Streamlined mobile header: Calendar & Notifications exclusively on Home tab',
      'Seamless mobile profile background and navigation backdrop layout',
      'Embedded calendar timeframe controls (Day, Week, Month, All) in Mill Reports',
      'Smart no-data warning states preventing blank PDF report generation',
      'Enhanced master data save and delete audit logging',
    ],
  },
  {
    version: 'Beta 1.4',
    releaseDate: '2026-09-19',
    title: 'Instant In-App Updates & Performance (Beta 1.4)',
    highlights: [
      'Simplified Changelog: Clear and easy-to-read update highlights',
      'Faster Update Alerts: Background updates now detect in just 15 seconds',
      'Instant In-App Update: 1-tap installation with notification chime',
    ],
  },
  {
    version: '1.3.0',
    releaseDate: '2026-09-16',
    title: 'Major System Update (v1.3)',
    highlights: [
      'Tensile Dry auto-calculation with ISO strength formula',
      'Paper Test Report full-width Remarks & notes interface',
      'Streamlined Rewinder & Label Studio print controls',
      'Official high-resolution Saheb Paper brand icons & assets',
      'Sub-second live cloud sync performance upgrade',
    ],
  },
  {
    version: '1.1.0',
    releaseDate: '2026-09-11',
    title: 'Production Security & Mobile Scanner Release',
    highlights: [
      'SHA-256 cryptographic salted PIN hashing for all operators and admins',
      'Supabase Cloud Row-Level Security (RLS) policies for 18 production tables',
      'DPDP Act 2023 In-App Privacy Policy & First-Time Consent Modal',
      'Android Native Camera, Torch, and Storage hardware permissions',
      'Modal background scroll locking for zero UI jitter on mobile and desktop',
      'Clean production data baseline with Admin Factory Reset capability',
    ],
  },
  {
    version: '1.0.0',
    releaseDate: '2026-09-06',
    title: 'Initial Production Milestone',
    highlights: [
      '13 Complete Paper Mill Operational Modules',
      'Real-Time Offline-First Supabase Data Sync Architecture',
      'Raw Material Inward, Pulp Mill Batching, & Jumbo Roll Production Tracking',
      'Rewinding Conversion, Stock Categorization, & Dispatch Slip Generation',
      'Lab QC Inspection, ETP/Boiler Readings, & Spare Parts Store Management',
      'Thermal Label Studio & Barcode Traceability System',
    ],
  },
];

/**
 * Compare two semver strings: returns 1 if vA > vB, -1 if vA < vB, 0 if equal
 */
export function compareVersions(vA: string, vB: string): number {
  const cleanA = vA.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const cleanB = vB.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(cleanA.length, cleanB.length); i++) {
    const a = cleanA[i] || 0;
    const b = cleanB[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

/**
 * Check for updates against remote cloud configuration or local state
 */
export async function checkAppUpdate(): Promise<AppUpdateInfo> {
  try {
    // Check if custom remote version is set in localStorage / Cloud mock
    const remoteVersionOverride = localStorage.getItem('saheb_remote_version');
    const targetVersion = remoteVersionOverride || APP_VERSION;
    const isNewer = compareVersions(targetVersion, APP_VERSION) > 0;

    return {
      hasUpdate: isNewer,
      currentVersion: APP_VERSION,
      latestVersion: targetVersion,
      releaseDate: APP_BUILD_DATE,
      releaseNotes: isNewer
        ? ['Performance enhancements and stability improvements', 'Bug fixes for production shift reporting']
        : APP_CHANGELOGS[0].highlights,
      mandatory: false,
      downloadUrl: 'https://github.com/thakordhruv097-spec/saheb-paper/releases/latest/download/SahebPaper-Beta-1.0.apk',
      changelogs: APP_CHANGELOGS,
    };
  } catch (err) {
    console.warn('[VersionCheck] Failed to check remote version:', err);
    return {
      hasUpdate: false,
      currentVersion: APP_VERSION,
      latestVersion: APP_VERSION,
      releaseDate: APP_BUILD_DATE,
      releaseNotes: [],
      mandatory: false,
      changelogs: APP_CHANGELOGS,
    };
  }
}
