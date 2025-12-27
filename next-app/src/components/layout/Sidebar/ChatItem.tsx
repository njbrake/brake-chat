'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/common/Checkbox';
import { Tooltip } from '@/components/common/Tooltip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/common/Dropdown';
import {
	GarbageBin,
	ArchiveBox,
	Sparkles,
	Document,
	EllipsisHorizontal,
	Copy,
	Share,
	Pencil,
	FolderOpen
} from '@/components/icons';
import { useAppStore, useChatStore, useUIStore } from '@/store';

interface ChatItemProps {
	id: string;
	title: string;
	className?: string;
	selected?: boolean;
	shiftKey?: boolean;
	editMode?: boolean;
	isSelected?: boolean;
	onToggleSelect?: (id: string) => void;
	onSelect?: () => void;
	onUnselect?: () => void;
	onChange?: () => void;
	onTag?: (type: string, name: string) => void;
}

export function ChatItem({
	id,
	title,
	className = '',
	selected = false,
	shiftKey = false,
	editMode = false,
	isSelected = false,
	onToggleSelect,
	onSelect,
	onUnselect,
	onChange,
	onTag
}: ChatItemProps) {
	const router = useRouter();
	const itemRef = useRef<HTMLDivElement>(null);

	const mobile = useAppStore((s) => s.mobile);
	const chatId = useChatStore((s) => s.chatId);
	const selectedFolder = useChatStore((s) => s.selectedFolder);
	const setSelectedFolder = useChatStore((s) => s.setSelectedFolder);
	const setShowSidebar = useUIStore((s) => s.setShowSidebar);

	const [mouseOver, setMouseOver] = useState(false);
	const [confirmEdit, setConfirmEdit] = useState(false);
	const [chatTitle, setChatTitle] = useState(title);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [dragged, setDragged] = useState(false);
	const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			if (editMode) {
				e.preventDefault();
				onToggleSelect?.(id);
			} else {
				onSelect?.();

				if (selectedFolder) {
					setSelectedFolder(null);
				}

				if (mobile) {
					setShowSidebar(false);
				}
			}
		},
		[
			editMode,
			id,
			mobile,
			onSelect,
			onToggleSelect,
			selectedFolder,
			setSelectedFolder,
			setShowSidebar
		]
	);

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setChatTitle(title);
			setConfirmEdit(true);
		},
		[title]
	);

	const handleTitleSubmit = useCallback(async () => {
		if (chatTitle !== title && chatTitle.trim() !== '') {
			// API call to update chat title would go here
			onChange?.();
		}
		setConfirmEdit(false);
		setChatTitle('');
	}, [chatTitle, onChange, title]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				handleTitleSubmit();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				setConfirmEdit(false);
				setChatTitle('');
			}
		},
		[handleTitleSubmit]
	);

	const handleDelete = useCallback(async () => {
		// API call to delete chat would go here
		onChange?.();
		if (chatId === id) {
			router.push('/');
		}
	}, [chatId, id, onChange, router]);

	const handleArchive = useCallback(async () => {
		// API call to archive chat would go here
		onChange?.();
	}, [onChange]);

	const isActive = id === chatId || confirmEdit;

	return (
		<>
			<ConfirmDialog
				show={showDeleteConfirm}
				title="Delete chat?"
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={handleDelete}
			>
				<div className="text-sm text-gray-500 flex-1 line-clamp-3">
					This will delete <span className="font-semibold">{title}</span>.
				</div>
			</ConfirmDialog>

			<div ref={itemRef} className={`w-full ${className} relative group`}>
				{confirmEdit ? (
					<div
						className={`w-full flex justify-between rounded-xl px-[11px] py-[6px] ${
							isActive
								? 'bg-gray-100 dark:bg-gray-900 selected'
								: selected
									? 'bg-gray-100 dark:bg-gray-950 selected'
									: 'group-hover:bg-gray-100 dark:group-hover:bg-gray-950'
						} whitespace-nowrap text-ellipsis relative ${generating ? 'cursor-not-allowed' : ''}`}
					>
						<input
							id={`chat-title-input-${id}`}
							value={chatTitle}
							onChange={(e) => setChatTitle(e.target.value)}
							className="bg-transparent w-full outline-none mr-10"
							placeholder={generating ? 'Generating...' : ''}
							disabled={generating}
							onKeyDown={handleKeyDown}
							onBlur={handleTitleSubmit}
							autoFocus
						/>
					</div>
				) : (
					<Link
						href={editMode ? '#' : `/c/${id}`}
						className={`w-full flex items-center gap-2 justify-between rounded-xl px-[11px] py-[6px] ${
							isActive
								? 'bg-gray-100 dark:bg-gray-900 selected'
								: selected
									? 'bg-gray-100 dark:bg-gray-950 selected'
									: isSelected
										? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
										: 'group-hover:bg-gray-100 dark:group-hover:bg-gray-950'
						} whitespace-nowrap text-ellipsis`}
						onClick={handleClick}
						onDoubleClick={handleDoubleClick}
						onMouseEnter={() => setMouseOver(true)}
						onMouseLeave={() => setMouseOver(false)}
						draggable={false}
					>
						{editMode && (
							<div onClick={(e) => e.stopPropagation()}>
								<Checkbox
									state={isSelected ? 'checked' : 'unchecked'}
									onChange={() => onToggleSelect?.(id)}
									aria-label={`Select chat: ${title}`}
								/>
							</div>
						)}

						<div className="flex self-center flex-1 w-full">
							<div
								dir="auto"
								className="text-left self-center overflow-hidden w-full h-[20px] truncate"
							>
								{title}
							</div>
						</div>
					</Link>
				)}

				{!editMode && (
					<div
						className={`${
							isActive
								? 'from-gray-100 dark:from-gray-900 selected'
								: selected
									? 'from-gray-100 dark:from-gray-950 selected'
									: 'invisible group-hover:visible from-gray-100 dark:from-gray-950'
						} absolute ${
							className === 'pr-2' ? 'right-[8px]' : 'right-1'
						} top-[4px] py-1 pr-0.5 mr-1.5 pl-5 bg-gradient-to-l from-80% to-transparent`}
						onMouseEnter={() => setMouseOver(true)}
						onMouseLeave={() => setMouseOver(false)}
					>
						{confirmEdit ? (
							<div className="flex self-center items-center space-x-1.5 z-10 translate-y-[0.5px] -translate-x-[0.5px]">
								<Tooltip content="Generate">
									<button
										className="self-center dark:hover:text-white transition disabled:cursor-not-allowed"
										disabled={generating}
									>
										<Sparkles strokeWidth={2} className="size-4" />
									</button>
								</Tooltip>
							</div>
						) : shiftKey && mouseOver ? (
							<div className="flex items-center self-center space-x-1.5">
								<Tooltip content="Archive" className="flex items-center">
									<button
										className="self-center dark:hover:text-white transition"
										onClick={handleArchive}
										type="button"
									>
										<ArchiveBox className="size-4 translate-y-[0.5px]" strokeWidth={2} />
									</button>
								</Tooltip>

								<Tooltip content="Delete">
									<button
										className="self-center dark:hover:text-white transition"
										onClick={() => setShowDeleteConfirm(true)}
										type="button"
									>
										<GarbageBin strokeWidth={2} className="size-4" />
									</button>
								</Tooltip>
							</div>
						) : (
							<div className="flex self-center z-10 items-end">
								<Dropdown
									trigger={
										<button
											aria-label="Chat Menu"
											className="self-center dark:hover:text-white transition m-0"
											onClick={() => onSelect?.()}
										>
											<EllipsisHorizontal className="w-4 h-4" />
										</button>
									}
									side="bottom"
									align="end"
								>
									<DropdownItem
										onClick={() => {
											setChatTitle(title);
											setConfirmEdit(true);
										}}
									>
										<Pencil className="size-4" />
										<span>Rename</span>
									</DropdownItem>
									<DropdownItem onClick={() => {}}>
										<Copy className="size-4" />
										<span>Clone</span>
									</DropdownItem>
									<DropdownItem onClick={() => {}}>
										<Share className="size-4" />
										<span>Share</span>
									</DropdownItem>
									<DropdownItem onClick={() => {}}>
										<FolderOpen className="size-4" />
										<span>Move to Folder</span>
									</DropdownItem>
									<DropdownSeparator />
									<DropdownItem onClick={handleArchive}>
										<ArchiveBox className="size-4" />
										<span>Archive</span>
									</DropdownItem>
									<DropdownItem onClick={() => setShowDeleteConfirm(true)} className="text-red-500">
										<GarbageBin className="size-4" />
										<span>Delete</span>
									</DropdownItem>
								</Dropdown>
							</div>
						)}
					</div>
				)}
			</div>
		</>
	);
}
