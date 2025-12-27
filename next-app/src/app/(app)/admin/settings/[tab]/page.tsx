'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Database, Shield, Globe, Palette, Bell, Wrench, Key } from 'lucide-react';

interface SettingsTabPageProps {
	params: Promise<{ tab: string }>;
}

const TABS = [
	{ id: 'general', label: 'General', icon: Settings },
	{ id: 'connections', label: 'Connections', icon: Database },
	{ id: 'models', label: 'Models', icon: Globe },
	{ id: 'interface', label: 'Interface', icon: Palette },
	{ id: 'audio', label: 'Audio', icon: Bell },
	{ id: 'images', label: 'Images', icon: Palette },
	{ id: 'pipelines', label: 'Pipelines', icon: Wrench },
	{ id: 'documents', label: 'Documents', icon: Database },
	{ id: 'web-search', label: 'Web Search', icon: Globe },
	{ id: 'admin', label: 'Admin', icon: Shield },
	{ id: 'api-keys', label: 'API Keys', icon: Key }
];

export default function SettingsTabPage({ params }: SettingsTabPageProps) {
	const { tab } = use(params);
	const pathname = usePathname();
	const [isSaving, setIsSaving] = useState(false);

	const currentTab = TABS.find((t) => t.id === tab) || TABS[0];
	const Icon = currentTab.icon;

	return (
		<div className="flex h-full">
			<div className="w-48 border-r border-gray-200 dark:border-gray-700 p-4">
				<nav className="space-y-1">
					{TABS.map((tabItem) => {
						const TabIcon = tabItem.icon;
						const isActive = tab === tabItem.id;
						return (
							<Link
								key={tabItem.id}
								href={`/admin/settings/${tabItem.id}`}
								className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
									isActive
										? 'bg-gray-100 dark:bg-gray-800 font-medium'
										: 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'
								}`}
							>
								<TabIcon className="size-4" />
								{tabItem.label}
							</Link>
						);
					})}
				</nav>
			</div>

			<div className="flex-1 p-6 overflow-y-auto">
				<div className="max-w-2xl">
					<div className="flex items-center gap-3 mb-6">
						<div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
							<Icon className="size-5" />
						</div>
						<h2 className="text-xl font-semibold">{currentTab.label} Settings</h2>
					</div>

					<div className="space-y-6">
						<div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
							<p className="text-gray-500 dark:text-gray-400">
								Configure {currentTab.label.toLowerCase()} settings here. This section is under
								development.
							</p>
						</div>

						<div className="flex justify-end">
							<button
								className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition disabled:opacity-50"
								disabled={isSaving}
							>
								{isSaving ? 'Saving...' : 'Save Changes'}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
