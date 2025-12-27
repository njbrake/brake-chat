'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore, useUIStore } from '@/store';
import { Tooltip } from '@/components/common/Tooltip';
import { Menu } from 'lucide-react';

interface AdminLayoutProps {
	children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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
			router.push('/');
			return;
		}
		setLoaded(true);
	}, [user, router]);

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
			<title>{`Admin Panel • ${WEBUI_NAME}`}</title>
			<div
				className={`flex flex-col h-screen max-h-[100dvh] flex-1 transition-width duration-200 ease-in-out ${
					showSidebar ? 'md:max-w-[calc(100%-260px)]' : 'md:max-w-[calc(100%-49px)]'
				} w-full max-w-full`}
			>
				<nav className="px-2.5 pt-1.5 backdrop-blur-xl">
					<div className="flex items-center gap-1">
						{mobile && (
							<div
								className={`${showSidebar ? 'md:hidden' : ''} flex flex-none items-center self-end`}
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

						<div className="flex w-full">
							<div className="flex gap-1 scrollbar-none overflow-x-auto w-fit text-center text-sm font-medium rounded-full bg-transparent pt-1">
								<Link className={getLinkClass('/admin/users')} href="/admin/users">
									Users
								</Link>
								<Link className={getLinkClass('/admin/evaluations')} href="/admin/evaluations">
									Evaluations
								</Link>
								<Link className={getLinkClass('/admin/settings')} href="/admin/settings">
									Settings
								</Link>
							</div>
						</div>
					</div>
				</nav>

				<div className="pb-1 flex-1 max-h-full overflow-y-auto">{children}</div>
			</div>
		</>
	);
}
