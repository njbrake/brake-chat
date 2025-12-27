'use client';

import { ReactNode } from 'react';

interface NameProps {
  children: ReactNode;
  className?: string;
}

export function Name({ children, className = '' }: NameProps) {
  return (
    <div
      className={`flex items-center gap-1 font-medium text-sm text-gray-800 dark:text-gray-200 ${className}`}
    >
      {children}
    </div>
  );
}
