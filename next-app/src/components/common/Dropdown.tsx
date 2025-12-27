'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { ReactNode } from 'react';

interface DropdownProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  sideOffset?: number;
}

export function Dropdown({
  open,
  onOpenChange,
  side = 'bottom',
  align = 'start',
  trigger,
  children,
  className = 'w-full max-w-[200px] rounded-lg p-1 border border-gray-300 dark:border-gray-700 z-50 bg-white dark:bg-gray-850 text-gray-900 dark:text-white shadow-lg',
  sideOffset = 8,
}: DropdownProps) {
  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className={className}
          sideOffset={sideOffset}
          side={side}
          align={align}
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function DropdownItem({
  children,
  onClick,
  className = 'flex items-center px-3 py-2 text-sm font-medium cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-800 outline-none',
  disabled = false,
}: DropdownItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
}

interface DropdownSeparatorProps {
  className?: string;
}

export function DropdownSeparator({
  className = 'h-px bg-gray-200 dark:bg-gray-700 my-1',
}: DropdownSeparatorProps) {
  return <DropdownMenuPrimitive.Separator className={className} />;
}

interface DropdownLabelProps {
  children: ReactNode;
  className?: string;
}

export function DropdownLabel({
  children,
  className = 'px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400',
}: DropdownLabelProps) {
  return (
    <DropdownMenuPrimitive.Label className={className}>
      {children}
    </DropdownMenuPrimitive.Label>
  );
}
