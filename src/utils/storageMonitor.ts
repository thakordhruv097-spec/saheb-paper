import { KEYS, getLogs, addLog } from '../data/index';

export interface StorageItemDetail {
  key: string;
  name: string;
  bytes: number;
  formattedSize: string;
  itemCount: number;
  percentOfTotal: number;
}

export interface StorageUsageReport {
  usedBytes: number;
  quotaBytes: number;
  percentageUsed: number;
  formattedUsed: string;
  formattedQuota: string;
  formattedFree: string;
  freeBytes: number;
  isWarning: boolean; // >= 80%
  isCritical: boolean; // >= 90%
  itemBreakdown: StorageItemDetail[];
  totalKeys: number;
}

const DEFAULT_QUOTA_BYTES = 5 * 1024 * 1024; // 5 MB standard localStorage quota

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const KEY_FRIENDLY_NAMES: Record<string, string> = {
  [KEYS.USERS]: 'User Accounts & Security',
  [KEYS.RAW_MATERIALS]: 'Raw Materials Catalog & Stock',
  [KEYS.PRODUCTS]: 'Product Master (GSM/Size/Ply)',
  [KEYS.PARTIES]: 'Party Customers Master',
  [KEYS.VENDORS]: 'Vendor Suppliers Master',
  [KEYS.VEHICLES]: 'Vehicles & Transporters Master',
  [KEYS.FORMULAS]: 'Pulp Mill Chemical Formulas',
  [KEYS.ROLLS]: 'Machine Production Rolls (Daily)',
  [KEYS.REELS]: 'Rewinding Finished Reels & QC',
  [KEYS.LOGS]: 'System Audit Trail & Event Logs',
  [KEYS.BOILER_LOGS]: 'Boiler Operations & Fuel Logs',
  [KEYS.ETP_LOGS]: 'ETP / Effluent Water Logs',
  [KEYS.ELECTRICITY_LOGS]: 'Power Consumption & Electricity',
  [KEYS.PENDING_ORDERS]: 'Customer Orders Ledger',
  [KEYS.PACKING_SLIPS]: 'Dispatch Packing Slips & Challans',
  [KEYS.STORE_ITEMS]: 'Store Inventory & Spare Parts',
  [KEYS.RAW_MATERIAL_LOTS]: 'Raw Material Inward Lots',
  [KEYS.LAB_REPORTS]: 'Laboratory Quality Test Reports',
};

export function getStorageUsageReport(simulatedUsagePercent?: number): StorageUsageReport {
  let totalBytes = 0;
  const breakdown: StorageItemDetail[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const rawVal = localStorage.getItem(key) || '';
      // UTF-16 character takes 2 bytes
      const bytes = (key.length + rawVal.length) * 2;
      totalBytes += bytes;

      let itemCount = 0;
      try {
        const parsed = JSON.parse(rawVal);
        if (Array.isArray(parsed)) {
          itemCount = parsed.length;
        } else if (typeof parsed === 'object' && parsed !== null) {
          itemCount = Object.keys(parsed).length;
        } else {
          itemCount = 1;
        }
      } catch {
        itemCount = 1;
      }

      const friendlyName = KEY_FRIENDLY_NAMES[key] || key.replace(/^saheb_/, '').replace(/_/g, ' ').toUpperCase();

      breakdown.push({
        key,
        name: friendlyName,
        bytes,
        formattedSize: formatBytes(bytes),
        itemCount,
        percentOfTotal: 0,
      });
    }
  } catch (err) {
    console.error('Error calculating storage usage:', err);
  }

  const quotaBytes = DEFAULT_QUOTA_BYTES;
  let percentageUsed = Math.min(100, Math.round((totalBytes / quotaBytes) * 100));

  if (simulatedUsagePercent !== undefined && simulatedUsagePercent >= 0) {
    percentageUsed = Math.min(100, simulatedUsagePercent);
    totalBytes = Math.round((quotaBytes * percentageUsed) / 100);
  }

  const freeBytes = Math.max(0, quotaBytes - totalBytes);

  // Compute percentage of total for each breakdown item
  const validTotal = breakdown.reduce((sum, item) => sum + item.bytes, 0);
  breakdown.forEach(item => {
    item.percentOfTotal = validTotal > 0 ? Math.round((item.bytes / validTotal) * 100) : 0;
  });

  // Sort largest to smallest
  breakdown.sort((a, b) => b.bytes - a.bytes);

  return {
    usedBytes: totalBytes,
    quotaBytes,
    percentageUsed,
    formattedUsed: formatBytes(totalBytes),
    formattedQuota: formatBytes(quotaBytes),
    formattedFree: formatBytes(freeBytes),
    freeBytes,
    isWarning: percentageUsed >= 80,
    isCritical: percentageUsed >= 90,
    itemBreakdown: breakdown,
    totalKeys: localStorage.length,
  };
}

/**
 * Purges audit logs older than specified days or limits to max count
 * to immediately reclaim space when storage is full.
 */
export function purgeOldAuditLogs(keepDays: number = 30, keepMaxCount: number = 500, operator: string = 'Admin'): {
  removedCount: number;
  reclaimedBytes: number;
  remainingCount: number;
} {
  try {
    const logs = getLogs();
    const initialBytes = (localStorage.getItem(KEYS.LOGS) || '').length * 2;
    const now = Date.now();
    const cutoffTime = now - keepDays * 24 * 60 * 60 * 1000;

    // Filter logs that are within the cutoff and limit to max count
    let filtered = logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return !isNaN(logTime) && logTime >= cutoffTime;
    });

    if (filtered.length > keepMaxCount) {
      filtered = filtered.slice(0, keepMaxCount);
    }

    const removedCount = Math.max(0, logs.length - filtered.length);
    localStorage.setItem(KEYS.LOGS, JSON.stringify(filtered));

    const finalBytes = (localStorage.getItem(KEYS.LOGS) || '').length * 2;
    const reclaimedBytes = Math.max(0, initialBytes - finalBytes);

    addLog(
      'Admin',
      'Storage Cleaned: Purge Audit Logs',
      `Storage maintenance executed: Purged ${removedCount} legacy audit logs older than ${keepDays} days. Reclaimed ${formatBytes(reclaimedBytes)} of storage.`,
      operator
    );

    return {
      removedCount,
      reclaimedBytes,
      remainingCount: filtered.length,
    };
  } catch (err) {
    console.error('Error purging old logs:', err);
    return {
      removedCount: 0,
      reclaimedBytes: 0,
      remainingCount: 0,
    };
  }
}
