'use client';

import { APP_NAME } from '@/lib/constants';
import { useAppStore } from '@/store';

export default function Home() {
	const theme = useAppStore((state) => state.theme);

	return (
		<div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
			<div className="text-center">
				<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{APP_NAME}</h1>
				<p className="text-gray-600 dark:text-gray-400 mb-8">React Migration in Progress</p>
				<div className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
					<p>Current theme: {theme}</p>
					<p className="text-green-600 dark:text-green-400">✓ Next.js setup complete</p>
					<p className="text-green-600 dark:text-green-400">✓ Tailwind CSS configured</p>
					<p className="text-green-600 dark:text-green-400">✓ Zustand stores created</p>
					<p className="text-green-600 dark:text-green-400">✓ API client copied</p>
					<p className="text-green-600 dark:text-green-400">✓ Types defined</p>
					<p className="text-green-600 dark:text-green-400">✓ Custom hooks created</p>
				</div>
			</div>
		</div>
	);
}
