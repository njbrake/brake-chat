'use client';

import { useState } from 'react';

interface ProfileImageProps {
  src: string;
  className?: string;
  alt?: string;
}

export function ProfileImage({ src, className = 'size-8', alt = 'Profile' }: ProfileImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`${className} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400`}
      >
        <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} rounded-full object-cover`}
      onError={() => setError(true)}
    />
  );
}
