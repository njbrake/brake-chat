'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useAppStore, useChatStore } from '@/store';
import { Message } from './Message';
import { Spinner } from '@/components/common/Spinner';
import { Loader } from '@/components/common/Loader';

interface HistoryMessage {
	id: string;
	role: string;
	content: string;
	model?: string;
	parentId: string | null;
	childrenIds: string[];
	models?: string[];
	files?: { type: string; url: string; name?: string }[];
	timestamp?: number;
	done?: boolean;
	error?: boolean | { content: string };
	annotation?: { rating?: number };
	originalContent?: string;
}

interface History {
	messages: Record<string, HistoryMessage>;
	currentId: string | null;
}

interface MessagesProps {
	className?: string;
	chatId?: string;
	user?: { id: string; name: string; role?: string };
	prompt?: string;
	history: History;
	selectedModels: string[];
	atSelectedModel?: string;
	setInputText?: (text: string) => void;
	sendMessage?: (history: History, messageId: string) => Promise<void>;
	continueResponse?: () => void;
	regenerateResponse?: (messageId?: string) => void;
	mergeResponses?: () => void;
	showMessage?: (params: { id: string | null }) => void;
	submitMessage?: (prompt: string) => void;
	addMessages?: (messages: unknown[]) => void;
	onHistoryChange?: (history: History) => void;
	readOnly?: boolean;
	editCodeBlock?: boolean;
	topPadding?: boolean;
	bottomPadding?: boolean;
	autoScroll?: boolean;
	onSelect?: (params: unknown) => void;
	messagesCount?: number | null;
}

export function Messages({
	className = 'h-full flex pt-8',
	chatId = '',
	user: propUser,
	prompt,
	history: initialHistory,
	selectedModels,
	atSelectedModel,
	setInputText,
	sendMessage,
	continueResponse,
	regenerateResponse,
	mergeResponses,
	showMessage,
	submitMessage,
	addMessages,
	onHistoryChange,
	readOnly = false,
	editCodeBlock = true,
	topPadding = false,
	bottomPadding = false,
	autoScroll: initialAutoScroll = true,
	onSelect,
	messagesCount: initialMessagesCount = 20
}: MessagesProps) {
	const storeUser = useAppStore((s) => s.user);
	const settings = useAppStore((s) => s.settings);
	const temporaryChatEnabled = useChatStore((s) => s.temporaryChatEnabled);

	const user = propUser || storeUser;

	const [history, setHistory] = useState<History>(initialHistory);
	const [messagesLoading, setMessagesLoading] = useState(false);
	const [messagesCount, setMessagesCount] = useState(initialMessagesCount);
	const [autoScroll, setAutoScroll] = useState(initialAutoScroll);

	useEffect(() => {
		setHistory(initialHistory);
	}, [initialHistory]);

	const messages = useMemo(() => {
		if (!history.currentId) return [];

		const _messages: HistoryMessage[] = [];
		let message: HistoryMessage | undefined = history.messages[history.currentId];
		const maxCount = messagesCount ?? Infinity;

		while (message && _messages.length <= maxCount) {
			_messages.unshift({ ...message });
			message = message.parentId !== null ? history.messages[message.parentId] : undefined;
		}

		return _messages;
	}, [history.currentId, history.messages, messagesCount]);

	const loadMoreMessages = useCallback(async () => {
		const element = document.getElementById('messages-container');
		if (element) {
			element.scrollTop = element.scrollTop + 100;
		}

		setMessagesLoading(true);
		setMessagesCount((prev) => (prev ?? 20) + 20);

		await new Promise((resolve) => setTimeout(resolve, 100));
		setMessagesLoading(false);
	}, []);

	const scrollToBottom = useCallback(() => {
		const element = document.getElementById('messages-container');
		if (element) {
			element.scrollTop = element.scrollHeight;
		}
	}, []);

	const updateChat = useCallback(async () => {
		if (!temporaryChatEnabled) {
			onHistoryChange?.(history);
		}
	}, [temporaryChatEnabled, history, onHistoryChange]);

	const gotoMessage = useCallback(
		async (message: HistoryMessage, idx: number) => {
			const siblings =
				message.parentId !== null
					? history.messages[message.parentId]?.childrenIds || []
					: Object.values(history.messages)
							.filter((msg) => msg.parentId === null)
							.map((msg) => msg.id);

			const clampedIdx = Math.max(0, Math.min(idx, siblings.length - 1));
			let messageId = siblings[clampedIdx];

			if (message.id !== messageId) {
				let messageChildrenIds = history.messages[messageId]?.childrenIds || [];
				while (messageChildrenIds.length !== 0) {
					messageId = messageChildrenIds[messageChildrenIds.length - 1];
					messageChildrenIds = history.messages[messageId]?.childrenIds || [];
				}

				setHistory((prev) => ({ ...prev, currentId: messageId }));
			}

			if (settings?.scrollOnBranchChange ?? true) {
				setTimeout(scrollToBottom, 100);
			}
		},
		[history.messages, settings?.scrollOnBranchChange, scrollToBottom]
	);

	const showPreviousMessage = useCallback(
		async (message: HistoryMessage) => {
			const siblings =
				message.parentId !== null
					? history.messages[message.parentId]?.childrenIds || []
					: Object.values(history.messages)
							.filter((m) => m.parentId === null)
							.map((m) => m.id);

			const currentIdx = siblings.indexOf(message.id);
			const prevIdx = Math.max(currentIdx - 1, 0);

			if (currentIdx !== prevIdx) {
				let messageId = siblings[prevIdx];
				let messageChildrenIds = history.messages[messageId]?.childrenIds || [];

				while (messageChildrenIds.length !== 0) {
					messageId = messageChildrenIds[messageChildrenIds.length - 1];
					messageChildrenIds = history.messages[messageId]?.childrenIds || [];
				}

				setHistory((prev) => ({ ...prev, currentId: messageId }));

				if (settings?.scrollOnBranchChange ?? true) {
					setTimeout(scrollToBottom, 100);
				}
			}
		},
		[history.messages, settings?.scrollOnBranchChange, scrollToBottom]
	);

	const showNextMessage = useCallback(
		async (message: HistoryMessage) => {
			const siblings =
				message.parentId !== null
					? history.messages[message.parentId]?.childrenIds || []
					: Object.values(history.messages)
							.filter((m) => m.parentId === null)
							.map((m) => m.id);

			const currentIdx = siblings.indexOf(message.id);
			const nextIdx = Math.min(currentIdx + 1, siblings.length - 1);

			if (currentIdx !== nextIdx) {
				let messageId = siblings[nextIdx];
				let messageChildrenIds = history.messages[messageId]?.childrenIds || [];

				while (messageChildrenIds.length !== 0) {
					messageId = messageChildrenIds[messageChildrenIds.length - 1];
					messageChildrenIds = history.messages[messageId]?.childrenIds || [];
				}

				setHistory((prev) => ({ ...prev, currentId: messageId }));

				if (settings?.scrollOnBranchChange ?? true) {
					setTimeout(scrollToBottom, 100);
				}
			}
		},
		[history.messages, settings?.scrollOnBranchChange, scrollToBottom]
	);

	const rateMessage = useCallback(
		async (messageId: string, rating: number) => {
			setHistory((prev) => ({
				...prev,
				messages: {
					...prev.messages,
					[messageId]: {
						...prev.messages[messageId],
						annotation: {
							...prev.messages[messageId]?.annotation,
							rating
						}
					}
				}
			}));

			await updateChat();
		},
		[updateChat]
	);

	const editMessage = useCallback(
		async (
			messageId: string,
			{ content, files }: { content: string; files?: unknown[] },
			submit = true
		) => {
			if ((selectedModels ?? []).filter((id) => id).length === 0) {
				toast.error('Model not selected');
				return;
			}

			const message = history.messages[messageId];

			if (message?.role === 'user') {
				if (submit) {
					const userMessageId = uuidv4();
					const userMessage: HistoryMessage = {
						id: userMessageId,
						parentId: message.parentId,
						childrenIds: [],
						role: 'user',
						content,
						files: files as HistoryMessage['files'],
						models: selectedModels,
						timestamp: Math.floor(Date.now() / 1000)
					};

					const newMessages = { ...history.messages };
					if (message.parentId !== null && newMessages[message.parentId]) {
						newMessages[message.parentId] = {
							...newMessages[message.parentId],
							childrenIds: [...newMessages[message.parentId].childrenIds, userMessageId]
						};
					}

					newMessages[userMessageId] = userMessage;

					const newHistory = {
						messages: newMessages,
						currentId: userMessageId
					};

					setHistory(newHistory);
					sendMessage?.(newHistory, userMessageId);
				} else {
					setHistory((prev) => ({
						...prev,
						messages: {
							...prev.messages,
							[messageId]: {
								...prev.messages[messageId],
								content,
								files: files as HistoryMessage['files']
							}
						}
					}));
					await updateChat();
				}
			} else {
				if (submit) {
					const responseMessageId = uuidv4();
					const parentId = message.parentId;

					const responseMessage: HistoryMessage = {
						...message,
						id: responseMessageId,
						parentId,
						childrenIds: [],
						files: undefined,
						content,
						timestamp: Math.floor(Date.now() / 1000)
					};

					const newMessages = { ...history.messages };
					newMessages[responseMessageId] = responseMessage;

					if (parentId !== null && newMessages[parentId]) {
						newMessages[parentId] = {
							...newMessages[parentId],
							childrenIds: [...newMessages[parentId].childrenIds, responseMessageId]
						};
					}

					setHistory({
						messages: newMessages,
						currentId: responseMessageId
					});
					await updateChat();
				} else {
					setHistory((prev) => ({
						...prev,
						messages: {
							...prev.messages,
							[messageId]: {
								...prev.messages[messageId],
								originalContent: prev.messages[messageId].content,
								content
							}
						}
					}));
					await updateChat();
				}
			}
		},
		[history.messages, selectedModels, sendMessage, updateChat]
	);

	const saveMessage = useCallback(
		async (messageId: string, message: HistoryMessage) => {
			setHistory((prev) => ({
				...prev,
				messages: {
					...prev.messages,
					[messageId]: message
				}
			}));
			await updateChat();
		},
		[updateChat]
	);

	const deleteMessage = useCallback(
		async (messageId: string) => {
			const messageToDelete = history.messages[messageId];
			const parentMessageId = messageToDelete.parentId;
			const childMessageIds = messageToDelete.childrenIds ?? [];
			const grandchildrenIds = childMessageIds.flatMap(
				(childId) => history.messages[childId]?.childrenIds ?? []
			);

			const newMessages = { ...history.messages };

			if (parentMessageId && newMessages[parentMessageId]) {
				newMessages[parentMessageId] = {
					...newMessages[parentMessageId],
					childrenIds: [
						...newMessages[parentMessageId].childrenIds.filter((id) => id !== messageId),
						...grandchildrenIds
					]
				};
			}

			grandchildrenIds.forEach((grandchildId) => {
				if (newMessages[grandchildId]) {
					newMessages[grandchildId] = {
						...newMessages[grandchildId],
						parentId: parentMessageId
					};
				}
			});

			[messageId, ...childMessageIds].forEach((id) => {
				delete newMessages[id];
			});

			setHistory({
				messages: newMessages,
				currentId: parentMessageId
			});

			showMessage?.({ id: parentMessageId });
			await updateChat();
		},
		[history.messages, showMessage, updateChat]
	);

	const triggerScroll = useCallback(() => {
		if (autoScroll) {
			const element = document.getElementById('messages-container');
			if (element) {
				const isNearBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
				setAutoScroll(isNearBottom);
				if (isNearBottom) {
					setTimeout(scrollToBottom, 100);
				}
			}
		}
	}, [autoScroll, scrollToBottom]);

	useEffect(() => {
		if (autoScroll && bottomPadding) {
			scrollToBottom();
		}
	}, [autoScroll, bottomPadding, scrollToBottom]);

	const hasMessages = Object.keys(history?.messages ?? {}).length > 0;

	if (!hasMessages) {
		return (
			<div className={className}>
				<div className="flex items-center justify-center h-full text-gray-500">
					Start a conversation
				</div>
			</div>
		);
	}

	const showLoadMore = messages.length > 0 && messages[0]?.parentId !== null;

	return (
		<div className={className}>
			<div className="w-full pt-2">
				<section className="w-full" aria-labelledby="chat-conversation">
					<h2 className="sr-only" id="chat-conversation">
						Chat Conversation
					</h2>

					{showLoadMore && (
						<Loader
							onVisible={() => {
								if (!messagesLoading) {
									loadMoreMessages();
								}
							}}
						>
							<div className="w-full flex justify-center py-1 text-xs animate-pulse items-center gap-2">
								<Spinner className="size-4" />
								<div>Loading...</div>
							</div>
						</Loader>
					)}

					<ul role="log" aria-live="polite" aria-relevant="additions" aria-atomic="false">
						{messages.map((message, messageIdx) => (
							<Message
								key={message.id}
								chatId={chatId}
								history={history}
								selectedModels={selectedModels}
								messageId={message.id}
								idx={messageIdx}
								user={user!}
								setInputText={setInputText}
								gotoMessage={gotoMessage}
								showPreviousMessage={showPreviousMessage}
								showNextMessage={showNextMessage}
								updateChat={updateChat}
								editMessage={editMessage}
								deleteMessage={deleteMessage}
								rateMessage={rateMessage}
								saveMessage={saveMessage}
								submitMessage={submitMessage}
								regenerateResponse={regenerateResponse}
								continueResponse={continueResponse}
								mergeResponses={mergeResponses}
								addMessages={addMessages}
								triggerScroll={triggerScroll}
								readOnly={readOnly}
								editCodeBlock={editCodeBlock}
								topPadding={topPadding}
							/>
						))}
					</ul>
				</section>

				<div className="pb-18" />
				{bottomPadding && <div className="pb-6" />}
			</div>
		</div>
	);
}

export { Message } from './Message';
export { UserMessage } from './UserMessage';
export { ResponseMessage } from './ResponseMessage';
export { Markdown } from './Markdown';
export { CodeBlock } from './CodeBlock';
export { ProfileImage } from './ProfileImage';
export { Name } from './Name';
