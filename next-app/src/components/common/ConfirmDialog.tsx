'use client';

import { useEffect, useCallback, ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import FocusTrap from 'focus-trap-react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface ConfirmDialogProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void | Promise<void>;
  input?: boolean;
  inputPlaceholder?: string;
  children?: ReactNode;
}

export function ConfirmDialog({
  show,
  onClose,
  title = '',
  message = '',
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  onConfirm,
  input = false,
  inputPlaceholder = '',
  children,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (show) {
      setInputValue('');
    }
  }, [show]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'Enter') {
        handleConfirm();
      }
    },
    [onClose]
  );

  const handleConfirm = async () => {
    onClose();
    await onConfirm?.();
  };

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

  const parsedMessage = message
    ? DOMPurify.sanitize(marked.parse(message) as string)
    : '';

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <FocusTrap>
          <motion.div
            className="fixed top-0 right-0 left-0 bottom-0 bg-black/60 w-full h-screen max-h-[100dvh] flex justify-center z-[99999999] overflow-hidden overscroll-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onMouseDown={() => onClose()}
          >
            <motion.div
              className="m-auto max-w-full w-[32rem] mx-2 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm rounded-4xl max-h-[100dvh] shadow-3xl border border-white dark:border-gray-900"
              initial={{ scale: 0.985, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.985, opacity: 0 }}
              transition={{ duration: 0.1 }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="px-[1.75rem] py-6 flex flex-col">
                <div className="text-lg font-medium dark:text-gray-200 mb-2.5">
                  {title || 'Confirm your action'}
                </div>

                {children || (
                  <div className="text-sm text-gray-500 flex-1">
                    {message ? (
                      <div dangerouslySetInnerHTML={{ __html: parsedMessage }} />
                    ) : (
                      'This action cannot be undone. Do you wish to continue?'
                    )}

                    {input && (
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={inputPlaceholder || 'Enter your message'}
                        className="w-full mt-2 rounded-lg px-4 py-2 text-sm dark:text-gray-300 dark:bg-gray-900 outline-hidden resize-none"
                        rows={3}
                        required
                      />
                    )}
                  </div>
                )}

                <div className="mt-6 flex justify-between gap-1.5">
                  <button
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-850 dark:hover:bg-gray-800 dark:text-white font-medium w-full py-2 rounded-3xl transition"
                    onClick={onClose}
                    type="button"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    className="text-sm bg-gray-900 hover:bg-gray-850 text-gray-100 dark:bg-gray-100 dark:hover:bg-white dark:text-gray-800 font-medium w-full py-2 rounded-3xl transition"
                    onClick={handleConfirm}
                    type="button"
                  >
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>,
    document.body
  );
}
