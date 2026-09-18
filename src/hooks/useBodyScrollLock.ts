import { useEffect } from 'react';

// Global reference counter for concurrent open modals/drawers
let activeLocksCount = 0;

/**
 * Force reset all scroll locks — guarantees that page scrolling is never left stuck
 * on route changes, unmounts, or unexpected state transitions.
 */
export function resetAllScrollLocks() {
  activeLocksCount = 0;
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('modal-scroll-locked');
    document.body.classList.remove('modal-scroll-locked');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }
}

/**
 * Custom hook to lock background scrolling cleanly when a modal, drawer, or dialog is open.
 * Uses reference counting so nested or sequential modals never conflict or freeze scrolling.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    activeLocksCount++;
    if (activeLocksCount === 1) {
      document.documentElement.classList.add('modal-scroll-locked');
      document.body.classList.add('modal-scroll-locked');
      document.body.style.overflow = 'hidden';
    }

    return () => {
      activeLocksCount = Math.max(0, activeLocksCount - 1);
      if (activeLocksCount === 0) {
        document.documentElement.classList.remove('modal-scroll-locked');
        document.body.classList.remove('modal-scroll-locked');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };
  }, [isLocked]);
}

export default useBodyScrollLock;
