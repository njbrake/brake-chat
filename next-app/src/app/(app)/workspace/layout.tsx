'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore, useUIStore } from '@/store';
import { Tooltip } from '@/components/common/Tooltip';
import { Menu } from 'lucide-react';

interface WorkspaceLayoutProps {
	children: React.ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
	const pathname = usePathname();
	const router = useRouter();
	const user = useAppStore((s) => s.user);
	const WEBUI_NAME = useAppStore((s) => s.WEBUI_NAME);
	const mobile = useAppStore((s) => s.mobile);
	const showSidebar = useUIStore((s) => s.showSidebar);
	const setShowSidebar = useUIStore((s) => s.setShowSidebar);

	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		if (user?.role !== 'admin') {
			if (pathname.includes('/models') && !user?.permissions?.workspace?.models) {
				router.push('/');
				return;
			}
			if (pathname.includes('/knowledge') && !user?.permissions?.workspace?.knowledge) {
				router.push('/');
				return;
			}
			if (pathname.includes('/prompts') && !user?.permissions?.workspace?.prompts) {
				router.push('/');
				return;
			}
		}
		setLoaded(true);
	}, [user, pathname, router]);

	const canViewModels = user?.role === 'admin' || user?.permissions?.workspace?.models;
	const canViewKnowledge = user?.role === 'admin' || user?.permissions?.workspace?.knowledge;
	const canViewPrompts = user?.role === 'admin' || user?.permissions?.workspace?.prompts;

	const getLinkClass = (path: string) => {
		const isActive = pathname.includes(path);
		return `min-w-fit p-1.5 transition ${
			isActive ? '' : 'text-gray-300 dark:text-gray-600 hover:text-gray-700 dark:hover:text-white'
		}`;
	};

	if (!loaded) {
		return null;
	}

	return (
		<>
			<title>{`Workspace • ${WEBUI_NAME}`}</title>
			<div
				className={`relative flex flex-col w-full h-screen max-h-[100dvh] transition-width duration-200 ease-in-out ${
					showSidebar ? 'md:max-w-[calc(100%-260px)]' : ''
				} max-w-full`}
			>
				<nav className="px-2.5 pt-1.5 backdrop-blur-xl">
					<div className="flex items-center gap-1">
						{mobile && (
							<div
								className={`${showSidebar ? 'md:hidden' : ''} self-center flex flex-none items-center`}
							>
								<Tooltip content={showSidebar ? 'Close Sidebar' : 'Open Sidebar'}>
									<button
										id="sidebar-toggle-button"
										className="cursor-pointer flex rounded-lg hover:bg-gray-100 dark:hover:bg-gray-850 transition"
										onClick={() => setShowSidebar(!showSidebar)}
									>
										<div className="self-center p-1.5">
											<Menu className="size-5" />
										</div>
									</button>
								</Tooltip>
							</div>
						)}

						<div>
							<div className="flex gap-1 scrollbar-none overflow-x-auto w-fit text-center text-sm font-medium rounded-full bg-transparent py-1 touch-auto pointer-events-auto">
								{canViewModels && (
									<Link className={getLinkClass('/workspace/models')} href="/workspace/models">
										Models
									</Link>
								)}
								{canViewKnowledge && (
									<Link
										className={getLinkClass('/workspace/knowledge')}
										href="/workspace/knowledge"
									>
										Knowledge
									</Link>
								)}
								{canViewPrompts && (
									<Link className={getLinkClass('/workspace/prompts')} href="/workspace/prompts">
										Prompts
									</Link>
								)}
							</div>
						</div>
					</div>
				</nav>

				<div
					className="pb-1 px-3 md:px-[18px] flex-1 max-h-full overflow-y-auto"
					id="workspace-container"
				>
					{children}
				</div>
			</div>
		</>
	);
}
