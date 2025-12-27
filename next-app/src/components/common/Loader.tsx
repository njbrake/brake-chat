'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface LoaderProps {
	onVisible?: () => void;
	children?: ReactNode;
}

export function Loader({ onVisible, children }: LoaderProps) {
	const loaderRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!loaderRef.current || !onVisible) return;

		let intervalId: NodeJS.Timeout | undefined;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						intervalId = setInterval(() => {
							onVisible();
						}, 100);
					} else {
						if (intervalId) {
							clearInterval(intervalId);
						}
					}
				});
			},
			{
				root: null,
				rootMargin: '0px',
				threshold: 0.1
			}
		);

		observer.observe(loaderRef.current);

		return () => {
			observer.disconnect();
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, [onVisible]);

	return <div ref={loaderRef}>{children}</div>;
}
