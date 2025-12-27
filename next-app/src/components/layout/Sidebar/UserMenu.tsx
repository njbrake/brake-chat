'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useRouter } from 'next/navigation';
import { Tooltip } from '@/components/common/Tooltip';
import { useAppStore, useUIStore } from '@/store';
import {
	Settings,
	ArchiveBox,
	UserGroup,
	SignOut,
	QuestionMarkCircle,
	Keyboard
} from '@/components/icons';

interface UserMenuProps {
	role?: string;
	help?: boolean;
	className?: string;
	onShow?: (type: string) => void;
	children: ReactNode;
}

export function UserMenu({
	role = '',
	help = false,
	className = 'max-w-[240px]',
	onShow,
	children
}: UserMenuProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [usage, setUsage] = useState<{ user_ids?: string[]; model_ids?: string[] } | null>(null);

	const mobile = useAppStore((s) => s.mobile);
	const user = useAppStore((s) => s.user);
	const setUser = useAppStore((s) => s.setUser);
	const setShowSettings = useUIStore((s) => s.setShowSettings);
	const setShowSidebar = useUIStore((s) => s.setShowSidebar);
	const setShowShortcuts = useUIStore((s) => s.setShowShortcuts);

	useEffect(() => {
		if (open) {
			// Fetch usage info when menu opens
			// getUsage would be implemented in the API layer
		}
	}, [open]);

	const handleSignOut = async () => {
		try {
			// Call sign out API
			const response = await fetch('/api/auths/signout', { method: 'POST' });
			const data = await response.json();

			setUser(undefined);
			localStorage.removeItem('token');

			window.location.href = data?.redirect_url ?? '/auth';
		} catch (error) {
			console.error('Sign out error:', error);
			window.location.href = '/auth';
		}
		setOpen(false);
	};

	return (
		<DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
			<DropdownMenuPrimitive.Trigger asChild>{children}</DropdownMenuPrimitive.Trigger>

			<DropdownMenuPrimitive.Portal>
				<DropdownMenuPrimitive.Content
					className={`w-full ${className} rounded-2xl px-1 py-1 border border-gray-100 dark:border-gray-800 z-50 bg-white dark:bg-gray-850 dark:text-white shadow-lg text-sm`}
					sideOffset={4}
					side="top"
					align="end"
				>
					<DropdownMenuPrimitive.Item
						className="flex rounded-xl py-1.5 px-3 w-full hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer outline-none"
						onSelect={async () => {
							setOpen(false);
							setShowSettings(true);
							if (mobile) {
								setShowSidebar(false);
							}
						}}
					>
						<div className="self-center mr-3">
							<Settings className="w-5 h-5" strokeWidth={1.5} />
						</div>
						<div className="self-center truncate">Settings</div>
					</DropdownMenuPrimitive.Item>

					<DropdownMenuPrimitive.Item
						className="flex rounded-xl py-1.5 px-3 w-full hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer outline-none"
						onSelect={() => {
							setOpen(false);
							onShow?.('archived-chat');
							if (mobile) {
								setShowSidebar(false);
							}
						}}
					>
						<div className="self-center mr-3">
							<ArchiveBox className="size-5" strokeWidth={1.5} />
						</div>
						<div className="self-center truncate">Archived Chats</div>
					</DropdownMenuPrimitive.Item>

					{role === 'admin' && (
						<DropdownMenuPrimitive.Item asChild>
							<Link
								href="/admin"
								className="flex rounded-xl py-1.5 px-3 w-full hover:bg-gray-50 dark:hover:bg-gray-800 transition select-none outline-none"
								onClick={() => {
									setOpen(false);
									if (mobile) {
										setShowSidebar(false);
									}
								}}
							>
								<div className="self-center mr-3">
									<UserGroup className="w-5 h-5" strokeWidth={1.5} />
								</div>
								<div className="self-center truncate">Admin Panel</div>
							</Link>
						</DropdownMenuPrimitive.Item>
					)}

					{help && (
						<>
							<DropdownMenuPrimitive.Separator className="border-gray-50 dark:border-gray-800 my-1" />

							{user?.role === 'admin' && (
								<>
									<DropdownMenuPrimitive.Item asChild>
										<a
											href="https://docs.openwebui.com"
											target="_blank"
											rel="noopener noreferrer"
											className="flex gap-3 items-center py-1.5 px-3 text-sm select-none w-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition outline-none"
											onClick={() => setOpen(false)}
										>
											<QuestionMarkCircle className="size-5" />
											<div className="flex items-center">Documentation</div>
										</a>
									</DropdownMenuPrimitive.Item>
								</>
							)}

							<DropdownMenuPrimitive.Item
								className="flex gap-3 items-center py-1.5 px-3 text-sm select-none w-full hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer outline-none"
								onSelect={() => {
									setOpen(false);
									setShowShortcuts(true);
									if (mobile) {
										setShowSidebar(false);
									}
								}}
							>
								<Keyboard className="size-5" />
								<div className="flex items-center">Keyboard shortcuts</div>
							</DropdownMenuPrimitive.Item>
						</>
					)}

					<DropdownMenuPrimitive.Separator className="border-gray-50 dark:border-gray-800 my-1" />

					<DropdownMenuPrimitive.Item
						className="flex rounded-xl py-1.5 px-3 w-full hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer outline-none"
						onSelect={handleSignOut}
					>
						<div className="self-center mr-3">
							<SignOut className="w-5 h-5" strokeWidth={1.5} />
						</div>
						<div className="self-center truncate">Sign Out</div>
					</DropdownMenuPrimitive.Item>

					{usage?.user_ids && usage.user_ids.length > 0 && (
						<>
							<DropdownMenuPrimitive.Separator className="border-gray-50 dark:border-gray-800 my-1" />
							<Tooltip
								content={
									usage?.model_ids && usage.model_ids.length > 0
										? `Running: ${usage.model_ids.join(', ')} ✨`
										: ''
								}
							>
								<div className="flex rounded-xl py-1 px-3 text-xs gap-2.5 items-center">
									<div className="flex items-center">
										<span className="relative flex size-2">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
											<span className="relative inline-flex rounded-full size-2 bg-green-500" />
										</span>
									</div>
									<div>
										<span>Active Users:</span>
										<span className="font-semibold"> {usage.user_ids.length}</span>
									</div>
								</div>
							</Tooltip>
						</>
					)}
				</DropdownMenuPrimitive.Content>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Root>
	);
}
