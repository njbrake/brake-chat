'use client';

import { useState } from 'react';
import { WEBUI_BASE_URL } from '@/lib/constants';
import { useAppStore } from '@/store';
import { ImagePreview } from './ImagePreview';
import { X } from 'lucide-react';

interface ImageProps {
	src: string;
	alt?: string;
	className?: string;
	imageClassName?: string;
	dismissible?: boolean;
	onDismiss?: () => void;
}

export function Image({
	src,
	alt = '',
	className,
	imageClassName = 'rounded-lg',
	dismissible = false,
	onDismiss
}: ImageProps) {
	const settings = useAppStore((state) => state.settings);
	const [showImagePreview, setShowImagePreview] = useState(false);

	const highContrastMode = settings?.highContrastMode ?? false;
	const containerClassName =
		className ?? `w-full ${highContrastMode ? '' : 'outline-hidden focus:outline-hidden'}`;

	const resolvedSrc = src.startsWith('/') ? `${WEBUI_BASE_URL}${src}` : src;

	return (
		<>
			<ImagePreview
				show={showImagePreview}
				onClose={() => setShowImagePreview(false)}
				src={resolvedSrc}
				alt={alt}
			/>

			<div className="relative group w-fit flex items-center">
				<button
					className={containerClassName}
					onClick={() => setShowImagePreview(true)}
					aria-label="Show image preview"
					type="button"
				>
					<img
						src={resolvedSrc}
						alt={alt}
						className={imageClassName}
						draggable={false}
						data-cy="image"
					/>
				</button>

				{dismissible && (
					<div className="absolute -top-1 -right-1">
						<button
							aria-label="Remove image"
							className="bg-white text-black border border-white rounded-full group-hover:visible invisible transition"
							type="button"
							onClick={onDismiss}
						>
							<X className="size-4" />
						</button>
					</div>
				)}
			</div>
		</>
	);
}
