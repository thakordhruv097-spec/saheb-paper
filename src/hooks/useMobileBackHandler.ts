import { useEffect, useRef } from 'react';

type CloseHandler = () => void;

interface ModalBackEntry {
  id: string;
  close: CloseHandler;
}

// Global stack of currently open modals/drawers (LIFO order)
const modalBackStack: ModalBackEntry[] = [];

/**
 * Pops and invokes the close callback of the topmost open modal.
 * Returns true if a modal was closed, false if the stack was empty.
 */
export function popTopModal(): boolean {
  if (modalBackStack.length > 0) {
    const topModal = modalBackStack.pop();
    if (topModal) {
      topModal.close();
      return true;
    }
  }
  return false;
}

/**
 * Checks if any modal or drawer is currently registered in the back stack.
 */
export function isAnyModalOpen(): boolean {
  return modalBackStack.length > 0;
}

/**
 * Manually registers a modal or overlay into the back stack.
 * Returns an unregister cleanup function.
 */
export function registerModalEntry(id: string, close: CloseHandler): () => void {
  const entry: ModalBackEntry = { id, close };
  modalBackStack.push(entry);
  return () => {
    const index = modalBackStack.findIndex(item => item.id === id);
    if (index !== -1) {
      modalBackStack.splice(index, 1);
    }
  };
}

/**
 * Custom hook that integrates component modals with the Android & Mobile Back navigation stack.
 * When `isOpen` is true, registers the modal into the global back stack.
 * When the user presses the Android hardware Back button or gesture:
 * - The topmost open modal is cleanly closed first without navigating away from the page.
 */
export function useMobileBackHandler(isOpen: boolean, onClose: () => void, modalId: string = 'modal') {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const uniqueId = `${modalId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cleanup = registerModalEntry(uniqueId, () => {
      onCloseRef.current();
    });

    return () => {
      cleanup();
    };
  }, [isOpen, modalId]);
}

export default useMobileBackHandler;
