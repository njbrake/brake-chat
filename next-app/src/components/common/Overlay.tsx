'use client';

import { ReactNode } from 'react';
import { Spinner } from './Spinner';

interface OverlayProps {
  show: boolean;
  content?: string;
  opacity?: number;
  children?: ReactNode;
}

export function Overlay({
  show,
  content = '',
  opacity = 1,
  children,
}: OverlayProps) {
  return (
    <div className="relative">
      {show && (
        <div className="absolute w-full h-full flex">
          <div
            className="absolute rounded-sm"
            style={{
              inset: '-10px',
              opacity,
              backdropFilter: 'blur(5px)',
            }}
          />

          <div className="flex w-full flex-col justify-center">
            <div className="py-3">
              <Spinner className="ml-2" />
            </div>

            {content && (
              <div className="text-center text-gray-100 text-xs font-medium z-50">
                {content}
              </div>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
