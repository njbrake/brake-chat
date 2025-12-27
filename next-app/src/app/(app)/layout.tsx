'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, useUIStore, useDataStore, useChatStore } from '@/store';
import { SocketProvider } from '@/context/SocketContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Spinner } from '@/components/common/Spinner';
import type { Model, Tool, Banner } from '@/types';
import { WEBUI_API_BASE_URL } from '@/lib/constants';

async function getModels(token: string): Promise<Model[]> {
	const res = await fetch(`${WEBUI_API_BASE_URL}/models`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) return [];
	return res.json();
}

async function getTools(token: string): Promise<Tool[]> {
	const res = await fetch(`${WEBUI_API_BASE_URL}/tools`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) return [];
	return res.json();
}

async function getBanners(token: string): Promise<Banner[]> {
	const res = await fetch(`${WEBUI_API_BASE_URL}/configs/banners`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) return [];
	return res.json();
}

async function getUserSettings(token: string): Promise<Record<string, unknown> | null> {
	const res = await fetch(`${WEBUI_API_BASE_URL}/users/user/settings`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) return null;
	return res.json();
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const user = useAppStore((s) => s.user);
	const setSettings = useAppStore((s) => s.setSettings);
	const setBanners = useAppStore((s) => s.setBanners);
	const setModels = useDataStore((s) => s.setModels);
	const setTools = useDataStore((s) => s.setTools);
	const showSidebar = useUIStore((s) => s.showSidebar);
	const setTemporaryChatEnabled = useChatStore((s) => s.setTemporaryChatEnabled);

	const [loaded, setLoaded] = useState(false);

	const loadData = useCallback(async () => {
		const token = localStorage.getItem('token');
		if (!token) return;

		try {
			const [modelsData, toolsData, bannersData, settingsData] = await Promise.all([
				getModels(token),
				getTools(token),
				getBanners(token),
				getUserSettings(token)
			]);

			setModels(modelsData);
			setTools(toolsData);
			setBanners(bannersData);

			if (settingsData?.ui) {
				setSettings(settingsData.ui as Record<string, unknown>);
			}
		} catch (error) {
			console.error('Failed to load data:', error);
		}
	}, [setModels, setTools, setBanners, setSettings]);

	useEffect(() => {
		if (user === undefined || user === null) {
			router.push('/auth');
			return;
		}

		if (!['user', 'admin'].includes(user?.role ?? '')) {
			return;
		}

		const init = async () => {
			await loadData();

			if (user?.role !== 'admin' && user?.permissions?.chat?.temporary_enforced) {
				setTemporaryChatEnabled(true);
			}

			setLoaded(true);
		};

		init();
	}, [user, router, loadData, setTemporaryChatEnabled]);

	if (!user) {
		return (
			<div className="w-full h-screen flex items-center justify-center bg-white dark:bg-gray-900">
				<Spinner className="size-8" />
			</div>
		);
	}

	if (!['user', 'admin'].includes(user?.role ?? '')) {
		return (
			<div className="w-full h-screen flex items-center justify-center bg-white dark:bg-gray-900">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Pending</h1>
					<p className="mt-2 text-gray-600 dark:text-gray-400">Your account is pending approval.</p>
				</div>
			</div>
		);
	}

	return (
		<SocketProvider>
			<div className="app relative">
				<div className="text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 h-screen max-h-[100dvh] overflow-auto flex flex-row justify-end">
					<Sidebar />

					{loaded ? (
						<main
							className={`flex-1 h-full overflow-auto transition-all duration-200 ${
								showSidebar ? 'md:ml-[260px]' : ''
							}`}
						>
							{children}
						</main>
					) : (
						<div
							className={`w-full flex-1 h-full flex items-center justify-center ${
								showSidebar ? 'md:max-w-[calc(100%-260px)]' : ''
							}`}
						>
							<Spinner className="size-5" />
						</div>
					)}
				</div>
			</div>
		</SocketProvider>
	);
}
