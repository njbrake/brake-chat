'use client';

import { useEffect, useRef, useCallback } from 'react';

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  minSize?: number | null;
  maxSize?: number | null;
  required?: boolean;
  readOnly?: boolean;
  className?: string;
  onBlur?: () => void;
}

export function Textarea({
  value,
  onChange,
  placeholder = '',
  rows = 1,
  minSize = null,
  maxSize = null,
  required = false,
  readOnly = false,
  className = 'w-full rounded-lg px-3.5 py-2 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden h-full',
  onBlur,
}: TextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '';
    let height = textarea.scrollHeight;

    if (maxSize && height > maxSize) {
      height = maxSize;
    }
    if (minSize && height < minSize) {
      height = minSize;
    }

    textarea.style.height = `${height}px`;
  }, [maxSize, minSize]);

  useEffect(() => {
    resize();
    const interval = setInterval(() => {
      if (textareaRef.current) {
        clearInterval(interval);
        resize();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [resize]);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      placeholder={placeholder}
      className={className}
      style={{ fieldSizing: 'content' } as React.CSSProperties}
      rows={rows}
      required={required}
      readOnly={readOnly}
      onChange={(e) => {
        onChange(e.target.value);
        resize();
      }}
      onFocus={resize}
      onBlur={onBlur}
    />
  );
}
