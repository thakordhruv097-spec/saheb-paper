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

export const APP_VERSION = 'Beta 1.0';
export const APP_BUILD_DATE = '2026-09-18';

export const APP_CHANGELOGS: VersionChangelog[] = [
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
      downloadUrl: 'https://github.com/thakordhruv097-spec/saheb-paper/releases/latest',
      changelogs: APP_CHANGELOGS,
    };
  } catch (err) {
    console.warn('[VersionCheck] Failed to check remote version:', err);
    return {
      hasUpdate: false,
      currentVersion: APP_VERSION,
      latestVersion: APP_VERSION,
      releaseDate: APP_BUILD_DATE,
      releaseNotes: APP_CHANGELOGS[0].highlights,
      mandatory: false,
      changelogs: APP_CHANGELOGS,
    };
  }
}
