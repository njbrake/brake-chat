'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import {
	ChevronLeft,
	ChevronRight,
	Pencil,
	Copy,
	Trash2,
	ThumbsUp,
	ThumbsDown,
	RefreshCw,
	Play,
	StepForward,
	Volume2,
	VolumeX
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore, useDataStore } from '@/store';
import { WEBUI_API_BASE_URL } from '@/lib/constants';
import { copyToClipboard } from '@/lib/utils';
import { Markdown } from './Markdown';
import { ProfileImage } from './ProfileImage';
import { Name } from './Name';
import { Tooltip } from '@/components/common/Tooltip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Image } from '@/components/common/Image';
import { Spinner } from '@/components/common/Spinner';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

interface HistoryMessage {
	id: string;
	role: string;
	content: string;
	model?: string;
	parentId: string | null;
	childrenIds: string[];
	files?: { type: string; url: string; name?: string }[];
	timestamp?: number;
	done?: boolean;
	error?: boolean | { content: string };
	info?: {
		eval_count?: number;
		eval_duration?: number;
		prompt_eval_count?: number;
		total_duration?: number;
	};
	annotation?: { rating?: number };
	sources?: unknown[];
}

interface History {
	messages: Record<string, HistoryMessage>;
	currentId: string | null;
}

interface ResponseMessageProps {
	chatId: string;
	history: History;
	messageId: string;
	selectedModels: string[];
	siblings: string[];
	setInputText?: (text: string) => void;
	gotoMessage?: (message: HistoryMessage, idx: number) => void;
	showPreviousMessage: (message: HistoryMessage) => void;
	showNextMessage: (message: HistoryMessage) => void;
	updateChat?: () => void;
	editMessage: (
		messageId: string,
		data: { content: string; files?: unknown[] },
		submit?: boolean
	) => void;
	saveMessage?: (messageId: string, message: HistoryMessage) => void;
	rateMessage?: (messageId: string, rating: number) => void;
	submitMessage?: (prompt: string) => void;
	deleteMessage: (messageId: string) => void;
	continueResponse?: () => void;
	regenerateResponse?: (messageId?: string) => void;
	addMessages?: (messages: unknown[]) => void;
	isLastMessage?: boolean;
	readOnly?: boolean;
	editCodeBlock?: boolean;
	topPadding?: boolean;
}

export function ResponseMessage({
	chatId,
	history,
	messageId,
	selectedModels,
	siblings,
	setInputText,
	gotoMessage,
	showPreviousMessage,
	showNextMessage,
	updateChat,
	editMessage,
	saveMessage,
	rateMessage,
	submitMessage,
	deleteMessage,
	continueResponse,
	regenerateResponse,
	addMessages,
	isLastMessage = true,
	readOnly = false,
	editCodeBlock = true,
	topPadding = false
}: ResponseMessageProps) {
	const settings = useAppStore((s) => s.settings);
	const user = useAppStore((s) => s.user);
	const models = useDataStore((s) => s.models);

	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [messageIndexEdit, setMessageIndexEdit] = useState(false);
	const [edit, setEdit] = useState(false);
	const [editedContent, setEditedContent] = useState('');
	const [speaking, setSpeaking] = useState(false);

	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const message = history.messages[messageId];
	const model = models.find((m) => m.id === message?.model);
	const siblingIndex = siblings.indexOf(message?.id);

	useEffect(() => {
		if (edit && textareaRef.current) {
			textareaRef.current.style.height = '';
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
			textareaRef.current.focus();
		}
	}, [edit]);

	const handleCopyToClipboard = useCallback(async (text: string) => {
		const res = await copyToClipboard(text);
		if (res) {
			toast.success('Copied to clipboard');
		}
	}, []);

	const handleEditMessage = useCallback(() => {
		setEdit(true);
		setEditedContent(message?.content ?? '');
	}, [message]);

	const handleEditConfirm = useCallback(
		(submit = true) => {
			if (!editedContent) {
				toast.error('Please enter a message.');
				return;
			}

			editMessage(message.id, { content: editedContent }, submit);
			setEdit(false);
			setEditedContent('');
		},
		[editedContent, message?.id, editMessage]
	);

	const cancelEdit = useCallback(() => {
		setEdit(false);
		setEditedContent('');
	}, []);

	const handleRate = useCallback(
		(rating: number) => {
			rateMessage?.(message.id, rating);
		},
		[message?.id, rateMessage]
	);

	const toggleSpeak = useCallback(() => {
		if (speaking) {
			speechSynthesis.cancel();
			setSpeaking(false);
		} else {
			if (!message?.content?.trim()) {
				toast.info('No content to speak');
				return;
			}
			const utterance = new SpeechSynthesisUtterance(message.content);
			utterance.onend = () => setSpeaking(false);
			speechSynthesis.speak(utterance);
			setSpeaking(true);
		}
	}, [speaking, message?.content]);

	const chatBubble = settings?.chatBubble ?? true;
	const highContrastMode = settings?.highContrastMode ?? false;

	if (!message) return null;

	const isError = message.error;
	const isDone = message.done !== false;

	const modelInfo = model?.info?.meta;
	const modelName = model?.name || message.model || 'Assistant';

	const tokenStats = message.info;
	const tokensPerSecond =
		tokenStats?.eval_count && tokenStats?.eval_duration
			? (tokenStats.eval_count / (tokenStats.eval_duration / 1e9)).toFixed(2)
			: null;

	return (
		<>
			<ConfirmDialog
				show={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				title="Delete message?"
				onConfirm={() => deleteMessage(message.id)}
			/>

			<div
				className="flex w-full response-message group"
				dir={settings?.chatDirection}
				id={`message-${message.id}`}
			>
				{!chatBubble && (
					<div className="shrink-0 ltr:mr-3 rtl:ml-3 mt-1">
						<ProfileImage
							src={`${WEBUI_API_BASE_URL}/static/favicon.png`}
							className="size-8"
							alt={modelName}
						/>
					</div>
				)}

				<div className="flex-auto w-0 max-w-full pl-1">
					{!chatBubble && (
						<div className="flex items-center gap-2">
							<Name>
								{modelName}
								{message.timestamp && (
									<div
										className={`self-center text-xs font-medium first-letter:capitalize ml-0.5 translate-y-[1px] ${
											highContrastMode
												? 'dark:text-gray-900 text-gray-100'
												: 'invisible group-hover:visible transition'
										}`}
									>
										<Tooltip content={dayjs(message.timestamp * 1000).format('LLLL')}>
											<span className="line-clamp-1">
												{dayjs(message.timestamp * 1000).fromNow()}
											</span>
										</Tooltip>
									</div>
								)}
							</Name>
						</div>
					)}

					<div className={`chat-${message.role} w-full min-w-full markdown-prose`}>
						{message.files && message.files.length > 0 && (
							<div className="mb-2 flex flex-wrap gap-2">
								{message.files.map((file, idx) => (
									<div key={idx}>
										{file.type === 'image' ? (
											<Image src={file.url} imageClassName="max-h-96 rounded-lg" />
										) : (
											<div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
												<span className="text-sm">{file.name || 'File'}</span>
											</div>
										)}
									</div>
								))}
							</div>
						)}

						{isError ? (
							<div className="flex gap-2.5 border px-4 py-3 border-red-600/10 bg-red-600/10 rounded-2xl">
								<div className="text-red-600 dark:text-red-400">
									{typeof message.error === 'object' && message.error?.content
										? message.error.content
										: 'An error occurred while generating the response.'}
								</div>
							</div>
						) : edit ? (
							<div className="w-full bg-gray-50 dark:bg-gray-800 rounded-3xl px-5 py-3 mb-2">
								<div className="max-h-96 overflow-auto">
									<textarea
										ref={textareaRef}
										className="bg-transparent outline-none w-full resize-none"
										value={editedContent}
										onChange={(e) => {
											setEditedContent(e.target.value);
											e.target.style.height = '';
											e.target.style.height = `${e.target.scrollHeight}px`;
										}}
										onKeyDown={(e) => {
											if (e.key === 'Escape') {
												cancelEdit();
											}
											if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
												handleEditConfirm();
											}
										}}
									/>
								</div>

								<div className="mt-2 mb-1 flex justify-between text-sm font-medium">
									<div>
										<button
											className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 transition rounded-3xl"
											onClick={() => handleEditConfirm(false)}
										>
											Save
										</button>
									</div>

									<div className="flex space-x-1.5">
										<button
											className="px-3.5 py-1.5 bg-white dark:bg-gray-900 hover:bg-gray-100 text-gray-800 dark:text-gray-100 transition rounded-3xl"
											onClick={cancelEdit}
										>
											Cancel
										</button>

										<button
											className="px-3.5 py-1.5 bg-gray-900 dark:bg-white hover:bg-gray-850 text-gray-100 dark:text-gray-800 transition rounded-3xl"
											onClick={() => handleEditConfirm(true)}
										>
											Submit
										</button>
									</div>
								</div>
							</div>
						) : (
							<>
								{!isDone && !message.content && (
									<div className="flex items-center gap-2 py-2">
										<Spinner className="size-4" />
										<span className="text-sm text-gray-500">Generating...</span>
									</div>
								)}

								{message.content && (
									<div className={`flex ${chatBubble ? 'justify-start' : 'w-full'}`}>
										<div className={chatBubble ? 'max-w-[90%]' : 'w-full'}>
											<Markdown
												id={`${chatId}-${message.id}`}
												content={message.content}
												model={model}
												editCodeBlock={editCodeBlock}
												topPadding={topPadding}
											/>
										</div>
									</div>
								)}
							</>
						)}

						{!edit && isDone && (
							<div
								className={`flex flex-wrap items-center gap-1 ${chatBubble ? '' : ''} text-gray-600 dark:text-gray-500 mt-1`}
							>
								{!chatBubble && siblings.length > 1 && (
									<div className="flex self-center" dir="ltr">
										<button
											className="self-center p-1 hover:bg-black/5 dark:hover:bg-white/5 dark:hover:text-white hover:text-black rounded-md transition"
											onClick={() => showPreviousMessage(message)}
										>
											<ChevronLeft className="size-3.5" strokeWidth={2.5} />
										</button>

										{messageIndexEdit ? (
											<div className="text-sm flex justify-center font-semibold self-center dark:text-gray-100 min-w-fit">
												<input
													type="number"
													value={siblingIndex + 1}
													min={1}
													max={siblings.length}
													className="bg-transparent font-semibold self-center dark:text-gray-100 min-w-fit outline-none w-8 text-center"
													onFocus={(e) => e.target.select()}
													onBlur={(e) => {
														gotoMessage?.(message, Number(e.target.value) - 1);
														setMessageIndexEdit(false);
													}}
													onKeyDown={(e) => {
														if (e.key === 'Enter') {
															gotoMessage?.(
																message,
																Number((e.target as HTMLInputElement).value) - 1
															);
															setMessageIndexEdit(false);
														}
													}}
												/>
												/{siblings.length}
											</div>
										) : (
											<div
												className="text-sm tracking-widest font-semibold self-center dark:text-gray-100 min-w-fit cursor-pointer"
												onDoubleClick={() => setMessageIndexEdit(true)}
											>
												{siblingIndex + 1}/{siblings.length}
											</div>
										)}

										<button
											className="self-center p-1 hover:bg-black/5 dark:hover:bg-white/5 dark:hover:text-white hover:text-black rounded-md transition"
											onClick={() => showNextMessage(message)}
										>
											<ChevronRight className="size-3.5" strokeWidth={2.5} />
										</button>
									</div>
								)}

								{!readOnly && (
									<>
										<Tooltip content="Edit" side="bottom">
											<button
												className={`${highContrastMode ? '' : 'invisible group-hover:visible'} p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg dark:hover:text-white hover:text-black transition`}
												onClick={handleEditMessage}
											>
												<Pencil className="size-4" strokeWidth={2} />
											</button>
										</Tooltip>

										<Tooltip content="Copy" side="bottom">
											<button
												className={`${highContrastMode ? '' : 'invisible group-hover:visible'} p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg dark:hover:text-white hover:text-black transition`}
												onClick={() => handleCopyToClipboard(message.content)}
											>
												<Copy className="size-4" strokeWidth={2} />
											</button>
										</Tooltip>

										<Tooltip content={speaking ? 'Stop' : 'Read aloud'} side="bottom">
											<button
												className={`${highContrastMode ? '' : 'invisible group-hover:visible'} p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg dark:hover:text-white hover:text-black transition`}
												onClick={toggleSpeak}
											>
												{speaking ? (
													<VolumeX className="size-4" strokeWidth={2} />
												) : (
													<Volume2 className="size-4" strokeWidth={2} />
												)}
											</button>
										</Tooltip>

										<Tooltip content="Good response" side="bottom">
											<button
												className={`${highContrastMode ? '' : 'invisible group-hover:visible'} p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg dark:hover:text-white hover:text-black transition ${message.annotation?.rating === 1 ? 'text-green-500' : ''}`}
												onClick={() => handleRate(1)}
											>
												<ThumbsUp className="size-4" strokeWidth={2} />
											</button>
										</Tooltip>

										<Tooltip content="Bad response" side="bottom">
											<button
												className={`${highContrastMode ? '' : 'invisible group-hover:visible'} p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg dark:hover:text-white hover:text-black transition ${message.annotation?.rating === -1 ? 'text-red-500' : ''}`}
												onClick={() => handleRate(-1)}
											>
												<ThumbsDown className="size-4" strokeWidth={2} />
											</button>
										</Tooltip>

										{isLastMessage && (
											<>
												<Tooltip content="Regenerate" side="bottom">
													<button
														className={`${highContrastMode ? '' : 'invisible group-hover:visible'} p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg dark:hover:text-white hover:text-black transition`}
														onClick={() => regenerateResponse?.(message.id)}
													>
														<RefreshCw className="size-4" strokeWidth={2} />
													</button>
												</Tooltip>

												{message.content && (
													<Tooltip content="Continue" side="bottom">
														<button
															className={`${highContrastMode ? '' : 'invisible group-hover:visible'} p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg dark:hover:text-white hover:text-black transition`}
															onClick={() => continueResponse?.()}
														>
															<StepForward className="size-4" strokeWidth={2} />
														</button>
													</Tooltip>
												)}
											</>
										)}

										{(user?.role === 'admin' ||
											!!(user?.permissions?.chat as Record<string, unknown>)?.delete_message) &&
											siblings.length > 1 && (
												<Tooltip content="Delete" side="bottom">
													<button
														className={`${highContrastMode ? '' : 'invisible group-hover:visible'} p-1 rounded-sm dark:hover:text-white hover:text-black transition`}
														onClick={() => setShowDeleteConfirm(true)}
													>
														<Trash2 className="size-4" strokeWidth={2} />
													</button>
												</Tooltip>
											)}
									</>
								)}

								{tokensPerSecond && (
									<div className="text-xs text-gray-400 ml-2">{tokensPerSecond} tokens/s</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
