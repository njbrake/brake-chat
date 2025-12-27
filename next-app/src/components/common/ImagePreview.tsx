'use client';

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';

interface ImagePreviewProps {
  show: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
}

export function ImagePreview({ show, onClose, src, alt = '' }: ImagePreviewProps) {
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

  const handleDownload = async () => {
    try {
      if (src.startsWith('data:image/')) {
        const base64Data = src.split(',')[1];
        const byteArray = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const blob = new Blob([byteArray], { type: 'image/png' });
        const mimeType = blob.type || 'image/png';
        const fileName = `generated_image.${mimeType.split('/')[1]}`;
        downloadBlob(blob, fileName);
      } else if (src.startsWith('blob:')) {
        const response = await fetch(src);
        const blob = await response.blob();
        const mimeType = blob.type || 'image/png';
        const fileName = `generated_image.${mimeType.split('/')[1]}`;
        downloadBlob(blob, fileName);
      } else if (src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://')) {
        const response = await fetch(src);
        const blob = await response.blob();
        const mimeType = blob.type || 'image/png';
        const fileName = `generated_image.${mimeType.split('/')[1]}`;
        downloadBlob(blob, fileName);
      }
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!show || typeof window === 'undefined') return null;

  return createPortal(
    <div className="modal fixed top-0 right-0 left-0 bottom-0 bg-black text-white w-full min-h-screen h-screen flex justify-center z-[9999] overflow-hidden overscroll-contain">
      <div className="absolute left-0 w-full flex justify-between select-none z-20">
        <div>
          <button
            className="p-5"
            onClick={onClose}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose();
            }}
          >
            <X className="size-6" />
          </button>
        </div>

        <div>
          <button className="p-5 z-[999]" onClick={handleDownload}>
            <Download className="size-6" />
          </button>
        </div>
      </div>

      <div className="flex h-full max-h-full justify-center items-center z-0">
        <img
          src={src}
          alt={alt}
          className="mx-auto h-full object-scale-down select-none"
          draggable={false}
        />
      </div>
    </div>,
    document.body
  );
}
