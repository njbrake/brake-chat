'use client';

import { useEffect, RefObject } from 'react';

export function useClickOutside<T extends HTMLElement>(
	ref: RefObject<T | null>,
	handler: (event: MouseEvent | TouchEvent) => void,
	enabled: boolean = true
): void {
	useEffect(() => {
		if (!enabled) return;

		const listener = (event: MouseEvent | TouchEvent) => {
			const target = event.target as Node;
			if (!ref.current || ref.current.contains(target)) {
				return;
			}
			handler(event);
		};

		document.addEventListener('mousedown', listener);
		document.addEventListener('touchstart', listener);

		return () => {
			document.removeEventListener('mousedown', listener);
			document.removeEventListener('touchstart', listener);
		};
	}, [ref, handler, enabled]);
}
