'use client';

import { useEffect, useRef, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import FocusTrap from 'focus-trap-react';
import { motion, AnimatePresence } from 'framer-motion';

type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

interface ModalProps {
	show: boolean;
	onClose: () => void;
	size?: ModalSize;
	containerClassName?: string;
	className?: string;
	children: ReactNode;
}

const sizeToWidth: Record<ModalSize, string> = {
	full: 'w-full',
	xs: 'w-[16rem]',
	sm: 'w-[30rem]',
	md: 'w-[42rem]',
	lg: 'w-[56rem]',
	xl: 'w-[70rem]',
	'2xl': 'w-[84rem]',
	'3xl': 'w-[100rem]'
};

export function Modal({
	show,
	onClose,
	size = 'md',
	containerClassName = 'p-3',
	className = 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-4xl',
	children
}: ModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);

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
				<FocusTrap
					focusTrapOptions={{
						allowOutsideClick: (e: MouseEvent | TouchEvent) => {
							const target = e.target as HTMLElement;
							return target.closest('[data-sonner-toast]') !== null;
						}
					}}
				>
					<motion.div
						ref={modalRef}
						aria-modal="true"
						role="dialog"
						className={`modal fixed top-0 right-0 left-0 bottom-0 bg-black/30 dark:bg-black/60 w-full h-screen max-h-[100dvh] ${containerClassName} flex justify-center z-[9999] overflow-y-auto overscroll-contain`}
						style={{ scrollbarGutter: 'stable' }}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.1 }}
						onMouseDown={() => onClose()}
					>
						<motion.div
							className={`m-auto max-w-full ${sizeToWidth[size]} ${
								size !== 'full' ? 'mx-2' : ''
							} shadow-3xl min-h-fit scrollbar-hidden ${className} border border-white dark:border-gray-850`}
							initial={{ scale: 0.985, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.985, opacity: 0 }}
							transition={{ duration: 0.1 }}
							onMouseDown={(e) => e.stopPropagation()}
						>
							{children}
						</motion.div>
					</motion.div>
				</FocusTrap>
			)}
		</AnimatePresence>,
		document.body
	);
}
