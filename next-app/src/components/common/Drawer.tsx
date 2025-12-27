'use client';

import { useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface DrawerProps {
  show: boolean;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}

export function Drawer({
  show,
  onClose,
  className = '',
  children,
}: DrawerProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (show) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [show, handleKeyDown]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          className="modal fixed right-0 bottom-0 left-0 z-[999] flex h-screen max-h-[100dvh] w-full justify-center overflow-hidden overscroll-contain bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={() => onClose()}
        >
          <motion.div
            className={`mt-auto w-full bg-gray-50 dark:bg-gray-900 dark:text-gray-100 ${className} scrollbar-hidden max-h-[100dvh] overflow-y-auto`}
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.1 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
