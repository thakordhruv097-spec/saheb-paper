import { useEffect, useRef } from 'react';

type CloseHandler = () => void;

interface ModalBackEntry {
  id: string;
  close: CloseHandler;
}

// Global stack of currently open modals/drawers (LIFO order)
const modalBackStack: ModalBackEntry[] = [];

if (typeof window !== 'undefined') {
  // Global listener for popstate (Browser back / Android gesture / device back button)
  window.addEventListener('popstate', () => {
    if (modalBackStack.length > 0) {
      const topModal = modalBackStack.pop();
      if (topModal) {
        topModal.close();
      }
    }
  });

  // Global listener for Cordova/Capacitor Android hardware back button
  document.addEventListener('backbutton', (e: Event) => {
    if (modalBackStack.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      window.history.back(); // Pops the history state and triggers popstate handler above
    }
  });
}

/**
 * Custom hook that handles Android Hardware & Mobile Browser Back buttons for modals/overlays.
 *
 * Behavior:
 * 1. When `isOpen` is true, pushes a temporary history state and registers the modal in the stack.
 * 2. When the user presses the Android device Back button or browser Back button:
 *    - The topmost open modal is cleanly closed first without navigating away from the page.
 * 3. When the modal is closed via UI (e.g. Cancel button / X icon):
 *    - Cleans up the temporary history state so the user's forward/back history remains intact.
 */
export function useMobileBackHandler(isOpen: boolean, onClose: () => void, modalId: string = 'modal') {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const uniqueId = `${modalId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let isPushed = false;

    try {
      window.history.pushState({ modalBackId: uniqueId }, '');
      isPushed = true;
    } catch {
      // ignore
    }

    const entry: ModalBackEntry = {
      id: uniqueId,
      close: () => {
        isPushed = false;
        onCloseRef.current();
      },
    };

    modalBackStack.push(entry);

    return () => {
      // Clean up from stack if still present
      const index = modalBackStack.findIndex(item => item.id === uniqueId);
      if (index !== -1) {
        modalBackStack.splice(index, 1);
      }

      // If closed via UI (not via back button), pop the dummy history entry
      if (isPushed && window.history.state?.modalBackId === uniqueId) {
        try {
          window.history.back();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen, modalId]);
}

export default useMobileBackHandler;
