import { useEffect, useState } from 'react';

/**
 * Universal Data Synchronization Hook for Saheb Paper ERP
 * Listens to internal custom events ('saheb_data_updated') and cross-tab StorageEvents ('storage')
 * Returns a reactive tick counter that triggers an instant, seamless re-render across all modules.
 */
export function useDataSync(tableFilter?: string[]): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = (e?: Event) => {
      if (!tableFilter || tableFilter.length === 0) {
        setTick(t => t + 1);
        return;
      }

      // If it's a cross-tab native storage event
      if (e instanceof StorageEvent) {
        if (!e.key) {
          setTick(t => t + 1);
          return;
        }
        const keyWithoutPrefix = e.key.replace(/^saheb_/, '');
        const matches = tableFilter.some(
          tf => tf === e.key || tf === keyWithoutPrefix || tf === 'all'
        );
        if (matches) {
          setTick(t => t + 1);
        }
        return;
      }

      // If it's internal CustomEvent
      if (e instanceof CustomEvent && e.detail?.tables) {
        const affected = e.detail.tables as string[];
        const hasMatch = affected.some(t => {
          const clean = t.replace(/^saheb_/, '');
          return (
            tableFilter.includes(t) ||
            tableFilter.includes(clean) ||
            t === 'all' ||
            clean === 'all'
          );
        });
        if (hasMatch) {
          setTick(t => t + 1);
        }
        return;
      }

      // Default refresh
      setTick(t => t + 1);
    };

    window.addEventListener('saheb_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('saheb_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [tableFilter ? tableFilter.join(',') : '']);

  return tick;
}

export default useDataSync;
