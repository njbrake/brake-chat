'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { Tooltip } from '@/components/common/Tooltip';
import { Spinner } from '@/components/common/Spinner';
import { Loader } from '@/components/common/Loader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Collapsible } from '@/components/common/Collapsible';
import { PencilSquare, Search, Sidebar as SidebarIcon, GarbageBin, Plus } from '@/components/icons';
import { useAppStore, useChatStore, useUIStore, useDataStore } from '@/store';
import { WEBUI_BASE_URL, WEBUI_API_BASE_URL } from '@/lib/constants';

import { UserMenu } from './UserMenu';
import { ChatItem } from './ChatItem';

const BREAKPOINT = 768;

export function Sidebar() {
	const router = useRouter();
	const navRef = useRef<HTMLDivElement>(null);

	// Store state
	const user = useAppStore((s) => s.user);
	const mobile = useAppStore((s) => s.mobile);
	const isApp = useAppStore((s) => s.isApp);
	const config = useAppStore((s) => s.config);
	const settings = useAppStore((s) => s.settings);
	const WEBUI_NAME = useAppStore((s) => s.WEBUI_NAME);

	const showSidebar = useUIStore((s) => s.showSidebar);
	const setShowSidebar = useUIStore((s) => s.setShowSidebar);
	const setShowSearch = useUIStore((s) => s.setShowSearch);
	const setShowArchivedChats = useUIStore((s) => s.setShowArchivedChats);

	const chats = useChatStore((s) => s.chats);
	const pinnedChats = useChatStore((s) => s.pinnedChats);
	const channels = useChatStore((s) => s.channels);
	const folders = useChatStore((s) => s.folders);
	const chatId = useChatStore((s) => s.chatId);
	const setChatId = useChatStore((s) => s.setChatId);
	const selectedFolder = useChatStore((s) => s.selectedFolder);
	const setSelectedFolder = useChatStore((s) => s.setSelectedFolder);
	const temporaryChatEnabled = useChatStore((s) => s.temporaryChatEnabled);
	const setTemporaryChatEnabled = useChatStore((s) => s.setTemporaryChatEnabled);
	const scrollPaginationEnabled = useChatStore((s) => s.scrollPaginationEnabled);
	const currentChatPage = useChatStore((s) => s.currentChatPage);
	const setCurrentChatPage = useChatStore((s) => s.setCurrentChatPage);

	const models = useDataStore((s) => s.models);

	// Local state
	const [scrollTop, setScrollTop] = useState(0);
	const [shiftKey, setShiftKey] = useState(false);
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
	const [editMode, setEditMode] = useState(false);
	const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
	const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [chatListLoading, setChatListLoading] = useState(false);
	const [allChatsLoaded, setAllChatsLoaded] = useState(false);
	const [draggedOver, setDraggedOver] = useState(false);

	const selectedCount = selectedChatIds.size;
	const canDelete =
		selectedCount > 0 && (user?.role === 'admin' || (user?.permissions?.chat?.delete ?? false));

	const isWindows = typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);

	// Initialize sidebar visibility from localStorage
	useEffect(() => {
		if (!mobile) {
			const savedSidebar = localStorage.getItem('sidebar');
			setShowSidebar(savedSidebar === 'true');
		} else {
			setShowSidebar(false);
		}
	}, [mobile, setShowSidebar]);

	// Save sidebar state to localStorage
	useEffect(() => {
		localStorage.setItem('sidebar', String(showSidebar));
	}, [showSidebar]);

	// Keyboard event handlers
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Shift') setShiftKey(true);
			if (e.key === 'Escape' && editMode) exitEditMode();
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === 'Shift') setShiftKey(false);
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [editMode]);

	const enterEditMode = () => {
		setEditMode(true);
		setSelectedChatIds(new Set());
	};

	const exitEditMode = () => {
		setEditMode(false);
		setSelectedChatIds(new Set());
		setShowBulkDeleteConfirm(false);
	};

	const toggleChatSelection = (chatId: string) => {
		setSelectedChatIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(chatId)) {
				newSet.delete(chatId);
			} else {
				newSet.add(chatId);
			}
			return newSet;
		});
	};

	const selectAllChats = () => {
		if (!chats) return;
		if (selectedChatIds.size === chats.length) {
			setSelectedChatIds(new Set());
		} else {
			setSelectedChatIds(new Set(chats.map((chat) => chat.id)));
		}
	};

	const bulkDeleteHandler = async () => {
		setShowBulkDeleteConfirm(false);
		setDeleting(true);

		try {
			// API call to delete chats would go here
			// await deleteChatsByIds(localStorage.token, Array.from(selectedChatIds));
		} catch (error) {
			console.error('Failed to delete chats:', error);
		} finally {
			setDeleting(false);
			exitEditMode();
		}
	};

	const newChatHandler = useCallback(() => {
		setSelectedChatId(null);
		setSelectedFolder(null);

		if (user?.role !== 'admin' && user?.permissions?.chat?.temporary_enforced) {
			setTemporaryChatEnabled(true);
		} else {
			setTemporaryChatEnabled(false);
		}

		if (mobile) {
			setTimeout(() => setShowSidebar(false), 0);
		}
	}, [mobile, setSelectedFolder, setShowSidebar, setTemporaryChatEnabled, user]);

	const loadMoreChats = async () => {
		if (chatListLoading || allChatsLoaded) return;

		setChatListLoading(true);
		try {
			// Load more chats via API
			setCurrentChatPage(currentChatPage + 1);
		} catch (error) {
			console.error('Failed to load more chats:', error);
			setAllChatsLoaded(true);
		} finally {
			setChatListLoading(false);
		}
	};

	// Collapsed sidebar view
	if (!showSidebar && !mobile) {
		return (
			<div
				className="pt-[7px] pb-2 px-1.5 flex flex-col justify-between text-black dark:text-white hover:bg-gray-50/30 dark:hover:bg-gray-950/30 h-full z-10 transition-all border-e-[0.5px] border-gray-50 dark:border-gray-850"
				id="sidebar"
			>
				<button
					className={`flex flex-col flex-1 ${isWindows ? 'cursor-pointer' : 'cursor-[e-resize]'}`}
					onClick={() => setShowSidebar(true)}
				>
					<div className="pb-1.5">
						<Tooltip content="Open Sidebar" side="right">
							<button
								className={`flex rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850 transition group ${
									isWindows ? 'cursor-pointer' : 'cursor-[e-resize]'
								}`}
								aria-label="Open Sidebar"
							>
								<div className="self-center flex items-center justify-center size-9">
									<img
										src={`${WEBUI_BASE_URL}/static/favicon.png`}
										className="sidebar-new-chat-icon size-6 rounded-full group-hover:hidden"
										alt=""
									/>
									<SidebarIcon className="size-5 hidden group-hover:flex" />
								</div>
							</button>
						</Tooltip>
					</div>

					<div className="-mt-[0.5px]">
						<div>
							<Tooltip content="New Chat" side="right">
								<Link
									className="cursor-pointer flex rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850 transition group"
									href="/"
									draggable={false}
									onClick={(e) => {
										e.stopPropagation();
										e.preventDefault();
										router.push('/');
										newChatHandler();
									}}
									aria-label="New Chat"
								>
									<div className="self-center flex items-center justify-center size-9">
										<PencilSquare className="size-4.5" />
									</div>
								</Link>
							</Tooltip>
						</div>

						<div>
							<Tooltip content="Search" side="right">
								<button
									className="cursor-pointer flex rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850 transition group"
									onClick={(e) => {
										e.stopPropagation();
										e.preventDefault();
										setShowSearch(true);
									}}
									draggable={false}
									aria-label="Search"
								>
									<div className="self-center flex items-center justify-center size-9">
										<Search className="size-4.5" />
									</div>
								</button>
							</Tooltip>
						</div>

						{(user?.role === 'admin' ||
							user?.permissions?.workspace?.models ||
							user?.permissions?.workspace?.knowledge ||
							user?.permissions?.workspace?.prompts ||
							user?.permissions?.workspace?.tools) && (
							<div>
								<Tooltip content="Workspace" side="right">
									<Link
										className="cursor-pointer flex rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850 transition group"
										href="/workspace"
										aria-label="Workspace"
										draggable={false}
									>
										<div className="self-center flex items-center justify-center size-9">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth={1.5}
												stroke="currentColor"
												className="size-4.5"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z"
												/>
											</svg>
										</div>
									</Link>
								</Tooltip>
							</div>
						)}
					</div>
				</button>

				<div>
					<div className="py-0.5">
						{user && (
							<UserMenu
								role={user.role}
								onShow={(type) => {
									if (type === 'archived-chat') {
										setShowArchivedChats(true);
									}
								}}
							>
								<div className="cursor-pointer flex rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850 transition group">
									<div className="self-center flex items-center justify-center size-9">
										<img
											src={`${WEBUI_API_BASE_URL}/users/${user.id}/profile/image`}
											className="size-6 object-cover rounded-full"
											alt="Open User Profile Menu"
											aria-label="Open User Profile Menu"
										/>
									</div>
								</div>
							</UserMenu>
						)}
					</div>
				</div>
			</div>
		);
	}

	// Mobile overlay
	const MobileOverlay = showSidebar && mobile && (
		<div
			className={`${
				isApp ? 'ml-[4.5rem] md:ml-0' : ''
			} fixed md:hidden z-40 top-0 right-0 left-0 bottom-0 bg-black/60 w-full min-h-screen h-screen flex justify-center overflow-hidden overscroll-contain`}
			onMouseDown={() => setShowSidebar(false)}
		/>
	);

	// Expanded sidebar
	return (
		<>
			<ConfirmDialog
				show={showBulkDeleteConfirm}
				onClose={() => setShowBulkDeleteConfirm(false)}
				onConfirm={bulkDeleteHandler}
			>
				<div className="flex flex-col gap-2">
					<div className="text-lg font-medium">{`Delete ${selectedCount} chats?`}</div>
					<div className="text-sm text-gray-500">
						{`This will permanently delete ${selectedCount} conversations. This action cannot be undone.`}
					</div>
				</div>
			</ConfirmDialog>

			{MobileOverlay}

			<AnimatePresence>
				{showSidebar && (
					<motion.div
						ref={navRef}
						id="sidebar"
						className={`h-screen max-h-[100dvh] min-h-screen select-none ${
							showSidebar
								? `${mobile ? 'bg-gray-50 dark:bg-gray-950' : 'bg-gray-50/70 dark:bg-gray-950/70'} z-50`
								: 'bg-transparent z-0'
						} ${
							isApp ? 'ml-[4.5rem] md:ml-0' : 'transition-all duration-300'
						} shrink-0 text-gray-900 dark:text-gray-200 text-sm fixed top-0 left-0 overflow-x-hidden`}
						initial={{ x: -260 }}
						animate={{ x: 0 }}
						exit={{ x: -260 }}
						transition={{ duration: 0.25 }}
					>
						<div
							className={`my-auto flex flex-col justify-between h-screen max-h-[100dvh] w-[260px] overflow-x-hidden scrollbar-hidden z-50 ${
								showSidebar ? '' : 'invisible'
							}`}
						>
							{/* Header */}
							<div className="sidebar px-2 pt-2 pb-1.5 flex justify-between space-x-1 text-gray-600 dark:text-gray-400 sticky top-0 z-10 -mb-3">
								<Link
									className="flex items-center rounded-xl size-8.5 h-full justify-center hover:bg-gray-100/50 dark:hover:bg-gray-850/50 transition no-drag-region"
									href="/"
									draggable={false}
									onClick={newChatHandler}
								>
									<img
										crossOrigin="anonymous"
										src={`${WEBUI_BASE_URL}/static/favicon.png`}
										className="sidebar-new-chat-icon size-6 rounded-full"
										alt=""
									/>
								</Link>

								<Link href="/" className="flex flex-1 px-1.5" onClick={newChatHandler}>
									<div
										id="sidebar-webui-name"
										className="self-center font-medium text-gray-850 dark:text-white font-primary"
									>
										{WEBUI_NAME}
									</div>
								</Link>

								<Tooltip content="Close Sidebar" side="bottom">
									<button
										className={`flex rounded-xl size-8.5 justify-center items-center hover:bg-gray-100/50 dark:hover:bg-gray-850/50 transition ${
											isWindows ? 'cursor-pointer' : 'cursor-[w-resize]'
										}`}
										onClick={() => setShowSidebar(false)}
										aria-label="Close Sidebar"
									>
										<div className="self-center p-1.5">
											<SidebarIcon className="size-4" />
										</div>
									</button>
								</Tooltip>

								<div
									className={`${
										scrollTop > 0 ? 'visible' : 'invisible'
									} sidebar-bg-gradient-to-b bg-gradient-to-b from-gray-50 dark:from-gray-950 to-transparent from-50% pointer-events-none absolute inset-0 -z-10 -mb-6`}
								/>
							</div>

							{/* Content */}
							<div
								className={`relative flex flex-col flex-1 overflow-y-auto scrollbar-hidden pt-3 ${
									editMode && selectedCount > 0 ? 'pb-20' : 'pb-3'
								}`}
								onScroll={(e) => {
									const target = e.target as HTMLDivElement;
									setScrollTop(target.scrollTop);
								}}
							>
								{/* Navigation buttons */}
								<div className="pb-1.5">
									<div className="px-1.5 flex justify-center text-gray-800 dark:text-gray-200">
										<Link
											id="sidebar-new-chat-button"
											className="group grow flex items-center space-x-3 rounded-2xl px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-900 transition outline-none"
											href="/"
											draggable={false}
											onClick={newChatHandler}
											aria-label="New Chat"
										>
											<div className="self-center">
												<PencilSquare className="size-4.5" strokeWidth={2} />
											</div>
											<div className="flex flex-1 self-center translate-y-[0.5px]">
												<div className="self-center text-sm font-primary">New Chat</div>
											</div>
										</Link>
									</div>

									<div className="px-1.5 flex justify-center text-gray-800 dark:text-gray-200">
										<button
											id="sidebar-search-button"
											className="group grow flex items-center space-x-3 rounded-2xl px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-900 transition outline-none"
											onClick={() => setShowSearch(true)}
											draggable={false}
											aria-label="Search"
										>
											<div className="self-center">
												<Search strokeWidth={2} className="size-4.5" />
											</div>
											<div className="flex flex-1 self-center translate-y-[0.5px]">
												<div className="self-center text-sm font-primary">Search</div>
											</div>
										</button>
									</div>

									{(user?.role === 'admin' ||
										user?.permissions?.workspace?.models ||
										user?.permissions?.workspace?.knowledge ||
										user?.permissions?.workspace?.prompts ||
										user?.permissions?.workspace?.tools) && (
										<div className="px-1.5 flex justify-center text-gray-800 dark:text-gray-200">
											<Link
												id="sidebar-workspace-button"
												className="grow flex items-center space-x-3 rounded-2xl px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-900 transition"
												href="/workspace"
												draggable={false}
												aria-label="Workspace"
											>
												<div className="self-center">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth={2}
														stroke="currentColor"
														className="size-4.5"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z"
														/>
													</svg>
												</div>
												<div className="flex self-center translate-y-[0.5px]">
													<div className="self-center text-sm font-primary">Workspace</div>
												</div>
											</Link>
										</div>
									)}
								</div>

								{/* Chats section */}
								<Collapsible title="Chats" defaultOpen className="px-2 mt-0.5 relative">
									{(user?.role === 'admin' || (user?.permissions?.chat?.delete ?? false)) && (
										<button
											className="absolute z-20 right-2 top-[5px] text-xs px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition"
											onClick={() => {
												if (editMode) {
													exitEditMode();
												} else {
													enterEditMode();
												}
											}}
											aria-pressed={editMode}
											aria-label={editMode ? 'Cancel' : 'Edit'}
										>
											{editMode ? 'Cancel' : 'Edit'}
										</button>
									)}

									{/* Pinned chats */}
									{pinnedChats && pinnedChats.length > 0 && (
										<div className="mb-1">
											<Collapsible title="Pinned" buttonClassName="text-gray-500" defaultOpen>
												<div className="ml-3 pl-1 mt-[1px] flex flex-col overflow-y-auto scrollbar-hidden border-l border-gray-100 dark:border-gray-900 text-gray-900 dark:text-gray-200">
													{pinnedChats.map((chat) => (
														<ChatItem
															key={`pinned-chat-${chat.id}`}
															id={chat.id}
															title={chat.title}
															shiftKey={shiftKey}
															selected={selectedChatId === chat.id}
															onSelect={() => setSelectedChatId(chat.id)}
															onUnselect={() => setSelectedChatId(null)}
															onChange={() => {
																// Refresh chat list
															}}
														/>
													))}
												</div>
											</Collapsible>
										</div>
									)}

									{/* Regular chats */}
									<div className="flex-1 flex flex-col overflow-y-auto scrollbar-hidden">
										<div className="pt-1.5">
											{chats ? (
												<>
													{chats.map((chat, idx) => (
														<div key={`chat-${chat.id}`}>
															{(idx === 0 ||
																(idx > 0 && chat.time_range !== chats[idx - 1].time_range)) && (
																<div
																	className={`w-full pl-2.5 text-xs text-gray-500 dark:text-gray-500 font-medium ${
																		idx === 0 ? '' : 'pt-5'
																	} pb-1.5`}
																>
																	{chat.time_range}
																</div>
															)}
															<ChatItem
																id={chat.id}
																title={chat.title}
																shiftKey={shiftKey}
																selected={selectedChatId === chat.id}
																editMode={editMode}
																isSelected={selectedChatIds.has(chat.id)}
																onToggleSelect={toggleChatSelection}
																onSelect={() => setSelectedChatId(chat.id)}
																onUnselect={() => setSelectedChatId(null)}
																onChange={() => {
																	// Refresh chat list
																}}
															/>
														</div>
													))}

													{scrollPaginationEnabled && !allChatsLoaded && (
														<Loader onVisible={loadMoreChats}>
															<div className="w-full flex justify-center py-1 text-xs animate-pulse items-center gap-2">
																<Spinner className="size-4" />
																<div>Loading...</div>
															</div>
														</Loader>
													)}
												</>
											) : (
												<div className="w-full flex justify-center py-1 text-xs animate-pulse items-center gap-2">
													<Spinner className="size-4" />
													<div>Loading...</div>
												</div>
											)}
										</div>
									</div>
								</Collapsible>

								{/* Edit mode action bar */}
								{editMode && selectedCount > 0 && (
									<motion.div
										className="px-2 py-2 sticky bottom-[60px] z-10 -mt-3 sidebar bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800"
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 20 }}
										transition={{ duration: 0.2 }}
										role="region"
										aria-label="Chat selection actions"
									>
										<div className="flex items-center justify-between gap-2">
											<div
												className="text-sm text-gray-600 dark:text-gray-400"
												role="status"
												aria-live="polite"
											>
												{`${selectedCount} chats selected`}
											</div>
											<div className="flex gap-1.5">
												<button
													className="text-sm px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition"
													onClick={selectAllChats}
													aria-label={
														chats && selectedChatIds.size === chats.length
															? 'Deselect all chats'
															: 'Select all chats'
													}
												>
													{chats && selectedChatIds.size === chats.length
														? 'Deselect All'
														: 'Select All'}
												</button>
												<button
													className="text-sm px-3 py-1.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
													onClick={() => setShowBulkDeleteConfirm(true)}
													disabled={deleting || !canDelete}
													aria-label="Delete selected chats"
												>
													{deleting ? (
														<>
															<Spinner className="size-3.5" />
															<span className="whitespace-nowrap">Deleting...</span>
														</>
													) : (
														<>
															<GarbageBin className="size-4" strokeWidth={2} />
															<span className="whitespace-nowrap">Delete</span>
														</>
													)}
												</button>
											</div>
										</div>
									</motion.div>
								)}
							</div>

							{/* Footer with user menu */}
							<div className="px-1.5 pt-1.5 pb-2 sticky bottom-0 z-10 -mt-3 sidebar">
								<div className="sidebar-bg-gradient-to-t bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent from-50% pointer-events-none absolute inset-0 -z-10 -mt-6" />
								<div className="flex flex-col font-primary">
									{user && (
										<UserMenu
											role={user.role}
											onShow={(type) => {
												if (type === 'archived-chat') {
													setShowArchivedChats(true);
												}
											}}
										>
											<div className="flex items-center rounded-2xl py-2 px-1.5 w-full hover:bg-gray-100/50 dark:hover:bg-gray-900/50 transition cursor-pointer">
												<div className="self-center mr-3">
													<img
														src={`${WEBUI_API_BASE_URL}/users/${user.id}/profile/image`}
														className="size-6 object-cover rounded-full"
														alt="Open User Profile Menu"
														aria-label="Open User Profile Menu"
													/>
												</div>
												<div className="self-center font-medium">{user.name}</div>
											</div>
										</UserMenu>
									)}
								</div>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
