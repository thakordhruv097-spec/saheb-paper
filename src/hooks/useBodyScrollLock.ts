import { useEffect } from 'react';

/**
 * Custom hook to lock body & layout scrolling when a modal or overlay is open.
 * Prevents background page from scrolling, bouncing, or shifting on mobile and desktop.
 * Restores exact scroll position upon closing.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    // Capture current scroll position before locking
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalBodyOverflow = document.body.style.overflow;
    const originalDocOverflow = document.documentElement.style.overflow;
    const originalBodyOverscroll = document.body.style.overscrollBehavior;
    const originalDocOverscroll = document.documentElement.style.overscrollBehavior;

    // Fixed position lock is required for mobile iOS/Android to prevent rubber-band background scrolling
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';

    // Also lock main container scroll if present in layout
    const mainContainers = Array.from(document.querySelectorAll('main, .dashboard-main-scrollbar')) as HTMLElement[];
    const originalMainOverflows = mainContainers.map(el => el.style.overflow);
    const originalMainOverscrolls = mainContainers.map(el => el.style.overscrollBehavior);
    mainContainers.forEach(el => {
      el.style.overflow = 'hidden';
      el.style.overscrollBehavior = 'none';
    });

    // Touch event listener on document to block touch gestures outside the scrollable modal body
    const preventTouchScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Allow scrolling if the touch originated inside an element intended to scroll
      const scrollableModal = target.closest('[data-modal-scroll="true"], .modal-scrollable-content, .overflow-y-auto, .overflow-auto');
      if (!scrollableModal) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('touchmove', preventTouchScroll, { passive: false });

    return () => {
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocOverflow;
      document.body.style.overscrollBehavior = originalBodyOverscroll;
      document.documentElement.style.overscrollBehavior = originalDocOverscroll;
      mainContainers.forEach((el, idx) => {
        el.style.overflow = originalMainOverflows[idx] || '';
        el.style.overscrollBehavior = originalMainOverscrolls[idx] || '';
      });

      document.removeEventListener('touchmove', preventTouchScroll);

      // Seamlessly restore exact previous scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}

export default useBodyScrollLock;

