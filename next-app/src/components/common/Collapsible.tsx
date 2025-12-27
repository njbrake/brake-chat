'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface CollapsibleProps {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	title?: ReactNode;
	className?: string;
	buttonClassName?: string;
	chevron?: boolean;
	disabled?: boolean;
	children: ReactNode;
	trigger?: ReactNode;
}

export function Collapsible({
	open: controlledOpen,
	defaultOpen = false,
	onOpenChange,
	title,
	className = '',
	buttonClassName = 'w-fit text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition',
	chevron = false,
	disabled = false,
	children,
	trigger
}: CollapsibleProps) {
	const [internalOpen, setInternalOpen] = useState(defaultOpen);

	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : internalOpen;

	const handleToggle = () => {
		if (disabled) return;
		const newState = !open;
		if (!isControlled) {
			setInternalOpen(newState);
		}
		onOpenChange?.(newState);
	};

	return (
		<div className={className}>
			<div
				className={`${buttonClassName} cursor-pointer`}
				onClick={handleToggle}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleToggle();
					}
				}}
			>
				<div className="w-full font-medium flex items-center justify-between gap-2">
					{trigger || (
						<>
							<div>{title}</div>
							{chevron && (
								<div className="flex self-center translate-y-[1px]">
									{open ? (
										<ChevronUp strokeWidth={3.5} className="size-3.5" />
									) : (
										<ChevronDown strokeWidth={3.5} className="size-3.5" />
									)}
								</div>
							)}
						</>
					)}
				</div>
			</div>

			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: 'easeOut' }}
						style={{ overflow: 'hidden' }}
					>
						{children}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
