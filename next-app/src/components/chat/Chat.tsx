'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore, useDataStore, useChatStore, useUIStore } from '@/store';
import { WEBUI_API_BASE_URL } from '@/lib/constants';
import { Messages } from './Messages';
import { MessageInput } from './MessageInput';
import { Navbar } from '@/components/layout/Navbar';
import { Spinner } from '@/components/common/Spinner';
import type { Message as MessageType } from '@/types';

interface HistoryFileItem {
  type: string;
  url: string;
  name?: string;
}

interface InputFileItem {
  id?: string;
  type: 'image' | 'file' | 'text';
  url?: string;
  name?: string;
  size?: number;
  status?: 'uploading' | 'uploaded' | 'error';
  content?: string;
  itemId?: string;
}

interface ChatProps {
  chatId?: string;
}

interface HistoryMessage {
  id: string;
  role: string;
  content: string;
  model?: string;
  parentId: string | null;
  childrenIds: string[];
  models?: string[];
  files?: HistoryFileItem[];
  timestamp?: number;
  done?: boolean;
  error?: boolean | { content: string };
  annotation?: { rating?: number };
}

interface History {
  messages: Record<string, HistoryMessage>;
  currentId: string | null;
}

export function Chat({ chatId }: ChatProps) {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const models = useDataStore((s) => s.models);
  const config = useAppStore((s) => s.config);
  const settings = useAppStore((s) => s.settings);
  const setChatId = useChatStore((s) => s.setChatId);
  const setChatTitle = useChatStore((s) => s.setChatTitle);
  const temporaryChatEnabled = useChatStore((s) => s.temporaryChatEnabled);
  const showSidebar = useUIStore((s) => s.showSidebar);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(['']);
  const [history, setHistory] = useState<History>({ messages: {}, currentId: null });
  const [autoScroll, setAutoScroll] = useState(true);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const generationControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  const loadChat = useCallback(async () => {
    if (!chatId) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        toast.error('Failed to load chat');
        router.push('/');
        return;
      }

      const chat = await res.json();
      setChatId(chat.id);
      setChatTitle(chat.title || 'New Chat');

      if (chat.chat?.history) {
        setHistory(chat.chat.history);
      } else if (chat.chat?.messages) {
        const messagesHistory: Record<string, HistoryMessage> = {};
        let lastId: string | null = null;

        chat.chat.messages.forEach((msg: MessageType) => {
          const id = msg.id || uuidv4();
          const files: HistoryFileItem[] | undefined = msg.files
            ?.filter((f) => f.url)
            .map((f) => ({
              type: f.type || 'file',
              url: f.url!,
              name: f.name,
            }));

          messagesHistory[id] = {
            id,
            parentId: lastId,
            childrenIds: [],
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            model: msg.model,
            files,
          };
          if (lastId && messagesHistory[lastId]) {
            messagesHistory[lastId].childrenIds.push(id);
          }
          lastId = id;
        });

        setHistory({ messages: messagesHistory, currentId: lastId });
      }

      if (chat.chat?.models) {
        setSelectedModels(chat.chat.models);
      }

      setLoading(false);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to load chat:', error);
      toast.error('Failed to load chat');
      router.push('/');
    }
  }, [chatId, router, scrollToBottom, setChatId, setChatTitle]);

  useEffect(() => {
    if (chatId) {
      loadChat();
    } else {
      setChatId('');
      setChatTitle('New Chat');
      setHistory({ messages: {}, currentId: null });
      setSelectedModels(
        settings?.models?.length ? settings.models : models.length ? [models[0].id] : ['']
      );
      setLoading(false);
    }
  }, [chatId, loadChat, models, settings, setChatId, setChatTitle]);

  const createMessagePair = useCallback(
    async (prompt: string, inputFiles: InputFileItem[]) => {
      if (!prompt.trim() && inputFiles.length === 0) return;

      const historyFiles: HistoryFileItem[] | undefined =
        inputFiles.length > 0
          ? inputFiles
              .filter((f) => f.url)
              .map((f) => ({
                type: f.type,
                url: f.url!,
                name: f.name,
              }))
          : undefined;

      const userMessageId = uuidv4();
      const userMessage: HistoryMessage = {
        id: userMessageId,
        parentId: history.currentId,
        childrenIds: [],
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
        files: historyFiles,
      };

      const updatedHistory = { ...history };
      updatedHistory.messages[userMessageId] = userMessage;

      if (history.currentId && updatedHistory.messages[history.currentId]) {
        updatedHistory.messages[history.currentId].childrenIds.push(userMessageId);
      }

      updatedHistory.currentId = userMessageId;

      const modelId = selectedModels[0] || models[0]?.id;
      if (!modelId) {
        toast.error('No model selected');
        return;
      }

      const assistantMessageId = uuidv4();
      const assistantMessage: HistoryMessage = {
        id: assistantMessageId,
        parentId: userMessageId,
        childrenIds: [],
        role: 'assistant',
        content: '',
        model: modelId,
        done: false,
      };

      updatedHistory.messages[assistantMessageId] = assistantMessage;
      updatedHistory.messages[userMessageId].childrenIds.push(assistantMessageId);
      updatedHistory.currentId = assistantMessageId;

      setHistory(updatedHistory);
      setGenerating(true);
      setAutoScroll(true);

      setTimeout(scrollToBottom, 100);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Not authenticated');
        setGenerating(false);
        return;
      }

      const controller = new AbortController();
      generationControllerRef.current = controller;

      try {
        const messages = Object.values(updatedHistory.messages)
          .filter((m) => m.id !== assistantMessageId)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const response = await fetch(`${WEBUI_API_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            model: modelId,
            messages,
            stream: true,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let content = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  content += delta;
                  setHistory((prev) => ({
                    ...prev,
                    messages: {
                      ...prev.messages,
                      [assistantMessageId]: {
                        ...prev.messages[assistantMessageId],
                        content,
                      },
                    },
                  }));

                  if (autoScroll) {
                    scrollToBottom();
                  }
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }

        setHistory((prev) => ({
          ...prev,
          messages: {
            ...prev.messages,
            [assistantMessageId]: {
              ...prev.messages[assistantMessageId],
              done: true,
              timestamp: Date.now(),
            },
          },
        }));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Generation error:', error);
          toast.error('Failed to generate response');
        }
      } finally {
        setGenerating(false);
        generationControllerRef.current = null;
      }
    },
    [history, selectedModels, models, autoScroll, scrollToBottom]
  );

  const stopResponse = useCallback(() => {
    if (generationControllerRef.current) {
      generationControllerRef.current.abort();
      generationControllerRef.current = null;
      setGenerating(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  const messagesList = Object.values(history.messages);

  return (
    <div className="flex flex-col h-full w-full">
      <Navbar
        chat={chatId ? { id: chatId, title: useChatStore.getState().chatTitle } : null}
        selectedModels={selectedModels}
        initNewChat={() => {
          router.push('/');
        }}
      />

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
        onScroll={(e) => {
          const target = e.currentTarget;
          const isAtBottom =
            target.scrollHeight - target.scrollTop - target.clientHeight < 100;
          setAutoScroll(isAtBottom);
        }}
      >
        {messagesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              What can I help with?
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Start a conversation by typing a message below.
            </p>
          </div>
        ) : (
          <Messages
            chatId={chatId || ''}
            history={history}
            selectedModels={selectedModels}
            submitMessage={(prompt: string) => {
              createMessagePair(prompt, []);
            }}
            regenerateResponse={(messageId?: string) => {
              // Regenerate logic would go here
            }}
            autoScroll={autoScroll}
          />
        )}
      </div>

      <MessageInput
        createMessagePair={createMessagePair}
        stopResponse={stopResponse}
        generating={generating}
        selectedModels={selectedModels}
        autoScroll={autoScroll}
      />
    </div>
  );
}
