'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';
import { Tooltip } from './Tooltip';
import { useAppStore } from '@/store';

interface SwitchProps {
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	id?: string;
	ariaLabelledbyId?: string;
	tooltip?: boolean | string;
	disabled?: boolean;
}

export function Switch({
	checked = true,
	onChange,
	id,
	ariaLabelledbyId,
	tooltip = false,
	disabled = false
}: SwitchProps) {
	const settings = useAppStore((state) => state.settings);
	const highContrastMode = settings?.highContrastMode ?? false;

	const tooltipContent =
		typeof tooltip === 'string'
			? tooltip
			: typeof tooltip === 'boolean' && tooltip
				? checked
					? 'Enabled'
					: 'Disabled'
				: '';

	const switchElement = (
		<SwitchPrimitive.Root
			checked={checked}
			onCheckedChange={onChange}
			id={id}
			aria-labelledby={ariaLabelledbyId}
			disabled={disabled}
			className={`flex h-[1.125rem] min-h-[1.125rem] w-8 shrink-0 cursor-pointer items-center rounded-full px-1 mx-[1px] transition ${
				highContrastMode
					? 'focus:outline focus:outline-2 focus:outline-gray-800 focus:dark:outline-gray-200'
					: 'outline outline-1 outline-gray-100 dark:outline-gray-800'
			} ${
				checked ? 'bg-emerald-500 dark:bg-emerald-700' : 'bg-gray-200 dark:bg-transparent'
			} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
		>
			<SwitchPrimitive.Thumb className="pointer-events-none block size-3 shrink-0 rounded-full bg-white transition-transform data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0 data-[state=unchecked]:shadow-mini" />
		</SwitchPrimitive.Root>
	);

	if (tooltipContent) {
		return <Tooltip content={tooltipContent}>{switchElement}</Tooltip>;
	}

	return switchElement;
}
