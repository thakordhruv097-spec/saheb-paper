import { useEffect } from 'react';

/**
 * Custom hook to lock body & layout scrolling when a modal or overlay is open.
 * Prevents background page from scrolling without creating blank right-side gutters.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalDocOverflow = document.documentElement.style.overflow;
    const originalBodyOverscroll = document.body.style.overscrollBehavior;
    const originalDocOverscroll = document.documentElement.style.overscrollBehavior;

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

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocOverflow;
      document.body.style.overscrollBehavior = originalBodyOverscroll;
      document.documentElement.style.overscrollBehavior = originalDocOverscroll;
      mainContainers.forEach((el, idx) => {
        el.style.overflow = originalMainOverflows[idx] || '';
        el.style.overscrollBehavior = originalMainOverscrolls[idx] || '';
      });
    };
  }, [isLocked]);
}

export default useBodyScrollLock;
