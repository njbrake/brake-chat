'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import { Eye, EyeOff } from 'lucide-react';

interface SensitiveInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password';
  required?: boolean;
  readOnly?: boolean;
  outerClassName?: string;
  inputClassName?: string;
  showButtonClassName?: string;
}

export function SensitiveInput({
  id = 'password-input',
  value,
  onChange,
  placeholder = '',
  type = 'text',
  required = true,
  readOnly = false,
  outerClassName = 'flex flex-1 bg-transparent',
  inputClassName = 'w-full text-sm py-0.5 bg-transparent',
  showButtonClassName = 'pl-1.5 transition bg-transparent',
}: SensitiveInputProps) {
  const [show, setShow] = useState(false);
  const settings = useAppStore((state) => state.settings);
  const highContrastMode = settings?.highContrastMode ?? false;

  const inputType = type === 'password' && !show ? 'password' : 'text';

  return (
    <div className={outerClassName}>
      <label className="sr-only" htmlFor={id}>
        {placeholder || 'Password'}
      </label>
      <input
        id={id}
        className={`${inputClassName} ${show ? '' : 'password'} ${
          highContrastMode
            ? 'placeholder:text-gray-700 dark:placeholder:text-gray-100'
            : 'outline-hidden placeholder:text-gray-300 dark:placeholder:text-gray-600'
        }`}
        placeholder={placeholder}
        type={inputType}
        value={value}
        required={required && !readOnly}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      <button
        className={showButtonClassName}
        type="button"
        aria-pressed={show}
        aria-label="Make password visible in the user interface"
        onClick={(e) => {
          e.preventDefault();
          setShow(!show);
        }}
      >
        {show ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  );
}
