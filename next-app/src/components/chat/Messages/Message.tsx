'use client';

import { useAppStore } from '@/store';
import { UserMessage } from './UserMessage';
import { ResponseMessage } from './ResponseMessage';

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
}

interface History {
	messages: Record<string, HistoryMessage>;
	currentId: string | null;
}

interface MessageProps {
	chatId: string;
	selectedModels: string[];
	idx: number;
	history: History;
	messageId: string;
	user: { id: string; name: string; role?: string };
	setInputText?: (text: string) => void;
	gotoMessage: (message: HistoryMessage, idx: number) => void;
	showPreviousMessage: (message: HistoryMessage) => void;
	showNextMessage: (message: HistoryMessage) => void;
	updateChat?: () => void;
	editMessage: (
		messageId: string,
		data: { content: string; files?: unknown[] },
		submit?: boolean
	) => void;
	saveMessage?: (messageId: string, message: HistoryMessage) => void;
	deleteMessage: (messageId: string) => void;
	rateMessage?: (messageId: string, rating: number) => void;
	submitMessage?: (prompt: string) => void;
	regenerateResponse?: (messageId?: string) => void;
	continueResponse?: () => void;
	mergeResponses?: () => void;
	addMessages?: (messages: unknown[]) => void;
	triggerScroll?: () => void;
	readOnly?: boolean;
	editCodeBlock?: boolean;
	topPadding?: boolean;
}

export function Message({
	chatId,
	selectedModels,
	idx,
	history,
	messageId,
	user,
	setInputText,
	gotoMessage,
	showPreviousMessage,
	showNextMessage,
	updateChat,
	editMessage,
	saveMessage,
	deleteMessage,
	rateMessage,
	submitMessage,
	regenerateResponse,
	continueResponse,
	mergeResponses,
	addMessages,
	triggerScroll,
	readOnly = false,
	editCodeBlock = true,
	topPadding = false
}: MessageProps) {
	const settings = useAppStore((s) => s.settings);

	const message = history.messages[messageId];

	if (!message) return null;

	const getSiblings = () => {
		if (message.parentId !== null) {
			return history.messages[message.parentId]?.childrenIds ?? [];
		}
		return (
			Object.values(history.messages)
				.filter((m) => m.parentId === null)
				.map((m) => m.id) ?? []
		);
	};

	const siblings = getSiblings();

	const parentModelsCount =
		message.parentId !== null ? (history.messages[message.parentId]?.models?.length ?? 1) : 1;

	const isUserMessage = message.role === 'user';
	const isMultiModel = parentModelsCount > 1;
	const isLastMessage = messageId === history.currentId;

	return (
		<div
			role="listitem"
			className={`flex flex-col justify-between px-5 mb-3 w-full ${
				settings?.widescreenMode ? 'max-w-full' : 'max-w-5xl'
			} mx-auto rounded-lg group`}
		>
			{isUserMessage ? (
				<UserMessage
					user={user}
					chatId={chatId}
					history={history}
					messageId={messageId}
					isFirstMessage={idx === 0}
					siblings={siblings}
					gotoMessage={gotoMessage}
					showPreviousMessage={showPreviousMessage}
					showNextMessage={showNextMessage}
					editMessage={editMessage}
					deleteMessage={deleteMessage}
					readOnly={readOnly}
					editCodeBlock={editCodeBlock}
					topPadding={topPadding}
				/>
			) : !isMultiModel ? (
				<ResponseMessage
					chatId={chatId}
					history={history}
					messageId={messageId}
					selectedModels={selectedModels}
					isLastMessage={isLastMessage}
					siblings={siblings}
					setInputText={setInputText}
					gotoMessage={gotoMessage}
					showPreviousMessage={showPreviousMessage}
					showNextMessage={showNextMessage}
					updateChat={updateChat}
					editMessage={editMessage}
					saveMessage={saveMessage}
					rateMessage={rateMessage}
					submitMessage={submitMessage}
					deleteMessage={deleteMessage}
					continueResponse={continueResponse}
					regenerateResponse={regenerateResponse}
					addMessages={addMessages}
					readOnly={readOnly}
					editCodeBlock={editCodeBlock}
					topPadding={topPadding}
				/>
			) : (
				<div className="text-sm text-gray-500">Multi-model responses not yet implemented</div>
			)}
		</div>
	);
}
