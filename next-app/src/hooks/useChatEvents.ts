'use client';

import { useEffect, useCallback } from 'react';
import { useSocketOptional } from '@/context/SocketContext';
import { useChatStore } from '@/store';
import { WEBUI_API_BASE_URL } from '@/lib/constants';

interface ChatEventData {
	type: string;
	data: {
		chat_id?: string;
		message_id?: string;
		content?: string;
		done?: boolean;
		[key: string]: unknown;
	};
}

interface ChannelEventData {
	type: string;
	channel_id?: string;
	data: unknown;
}

interface UseChatEventsOptions {
	onNewMessage?: (data: ChatEventData['data']) => void;
	onMessageUpdate?: (data: ChatEventData['data']) => void;
	onChatUpdate?: (data: ChatEventData['data']) => void;
	onTypingStart?: (data: ChatEventData['data']) => void;
	onTypingEnd?: (data: ChatEventData['data']) => void;
}

export function useChatEvents(options: UseChatEventsOptions = {}) {
	const socketContext = useSocketOptional();
	const chatId = useChatStore((s) => s.chatId);

	const handleChatEvent = useCallback(
		(event: ChatEventData) => {
			const { type, data } = event;

			switch (type) {
				case 'chat:message:new':
					options.onNewMessage?.(data);
					break;
				case 'chat:message:update':
					options.onMessageUpdate?.(data);
					break;
				case 'chat:update':
					options.onChatUpdate?.(data);
					break;
				case 'chat:typing:start':
					options.onTypingStart?.(data);
					break;
				case 'chat:typing:end':
					options.onTypingEnd?.(data);
					break;
				default:
					console.log('Unknown chat event:', type, data);
			}
		},
		[options]
	);

	useEffect(() => {
		if (!socketContext?.socket) return;

		const eventHandler = (event: ChatEventData) => {
			if (event.data?.chat_id === chatId || !event.data?.chat_id) {
				handleChatEvent(event);
			}
		};

		socketContext.on('events', eventHandler as (...args: unknown[]) => void);

		return () => {
			socketContext.off('events', eventHandler as (...args: unknown[]) => void);
		};
	}, [socketContext, chatId, handleChatEvent]);

	const emitTyping = useCallback(
		(isTyping: boolean) => {
			if (!socketContext?.socket || !chatId) return;

			socketContext.emit('chat:typing', {
				chat_id: chatId,
				typing: isTyping
			});
		},
		[socketContext, chatId]
	);

	return {
		emitTyping,
		connected: socketContext?.connected ?? false
	};
}

interface UseChannelEventsOptions {
	channelId: string;
	onMessage?: (data: ChannelEventData['data']) => void;
	onUserJoin?: (data: ChannelEventData['data']) => void;
	onUserLeave?: (data: ChannelEventData['data']) => void;
}

export function useChannelEvents(options: UseChannelEventsOptions) {
	const socketContext = useSocketOptional();
	const { channelId, onMessage, onUserJoin, onUserLeave } = options;

	useEffect(() => {
		if (!socketContext?.socket || !channelId) return;

		const eventHandler = (event: ChannelEventData) => {
			if (event.channel_id !== channelId) return;

			switch (event.type) {
				case 'channel:message':
					onMessage?.(event.data);
					break;
				case 'channel:user:join':
					onUserJoin?.(event.data);
					break;
				case 'channel:user:leave':
					onUserLeave?.(event.data);
					break;
				default:
					console.log('Unknown channel event:', event.type, event.data);
			}
		};

		socketContext.emit('channel:join', { channel_id: channelId });
		socketContext.on('events:channel', eventHandler as (...args: unknown[]) => void);

		return () => {
			socketContext.emit('channel:leave', { channel_id: channelId });
			socketContext.off('events:channel', eventHandler as (...args: unknown[]) => void);
		};
	}, [socketContext, channelId, onMessage, onUserJoin, onUserLeave]);

	const sendMessage = useCallback(
		async (content: string) => {
			const token = localStorage.getItem('token');
			if (!token || !channelId) return null;

			const res = await fetch(`${WEBUI_API_BASE_URL}/channels/${channelId}/messages`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ content })
			});

			if (!res.ok) {
				throw new Error('Failed to send message');
			}

			return res.json();
		},
		[channelId]
	);

	return {
		sendMessage,
		connected: socketContext?.connected ?? false
	};
}
