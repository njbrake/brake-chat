'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useAppStore, useChatStore, useDataStore } from '@/store';
import { WEBUI_API_BASE_URL } from '@/lib/constants';
import { Messages } from '@/components/chat/Messages';
import { Spinner } from '@/components/common/Spinner';

dayjs.extend(localizedFormat);

interface SharedChatPageProps {
  params: Promise<{ id: string }>;
}

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
}

interface History {
  messages: Record<string, HistoryMessage>;
  currentId: string | null;
}

interface SharedChat {
  id: string;
  user_id: string;
  title: string;
  chat: {
    title: string;
    models?: string[];
    history?: History;
    messages?: HistoryMessage[];
    timestamp: number;
  };
}

interface ChatUser {
  id: string;
  name: string;
  profile_image_url?: string;
}

async function getChatByShareId(token: string, shareId: string): Promise<SharedChat | null> {
  const res = await fetch(`${WEBUI_API_BASE_URL}/chats/share/${shareId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function cloneChatById(token: string, chatId: string): Promise<{ id: string } | null> {
  const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${chatId}/clone`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function getUserById(token: string, userId: string): Promise<ChatUser | null> {
  const res = await fetch(`${WEBUI_API_BASE_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export default function SharedChatPage({ params }: SharedChatPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const WEBUI_NAME = useAppStore((s) => s.WEBUI_NAME);
  const settings = useAppStore((s) => s.settings);
  const setChatId = useChatStore((s) => s.setChatId);

  const [loaded, setLoaded] = useState(false);
  const [chat, setChat] = useState<SharedChat | null>(null);
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [title, setTitle] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['']);
  const [history, setHistory] = useState<History>({ messages: {}, currentId: null });

  const loadSharedChat = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const sharedChat = await getChatByShareId(token, id);
    if (!sharedChat) {
      router.push('/');
      return;
    }

    setChat(sharedChat);
    setChatId(id);

    const user = await getUserById(token, sharedChat.user_id);
    setChatUser(user);

    const chatContent = sharedChat.chat;
    if (chatContent) {
      setSelectedModels(chatContent.models || ['']);
      setTitle(chatContent.title || '');

      if (chatContent.history) {
        const historyWithDone = { ...chatContent.history };
        const messages = Object.values(historyWithDone.messages);
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage) {
            historyWithDone.messages[lastMessage.id] = { ...lastMessage, done: true };
          }
        }
        setHistory(historyWithDone);
      } else if (chatContent.messages) {
        const messagesHistory: Record<string, HistoryMessage> = {};
        let lastId: string | null = null;

        chatContent.messages.forEach((msg) => {
          messagesHistory[msg.id] = {
            ...msg,
            parentId: lastId,
            childrenIds: [],
            done: true,
          };
          if (lastId && messagesHistory[lastId]) {
            messagesHistory[lastId].childrenIds.push(msg.id);
          }
          lastId = msg.id;
        });

        setHistory({ messages: messagesHistory, currentId: lastId });
      }

      setLoaded(true);
    }
  }, [id, router, setChatId]);

  useEffect(() => {
    loadSharedChat();
  }, [loadSharedChat]);

  const cloneSharedChat = async () => {
    if (!chat) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await cloneChatById(token, chat.id);
    if (res) {
      router.push(`/c/${res.id}`);
    } else {
      toast.error('Failed to clone chat');
    }
  };

  if (!loaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-gray-900">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="h-screen max-h-[100dvh] w-full flex flex-col text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900">
      <div className="flex flex-col flex-auto justify-center relative">
        <div className="flex flex-col w-full flex-auto overflow-auto h-0" id="messages-container">
          <div
            className={`pt-5 px-2 w-full mx-auto ${
              settings?.widescreenMode ? 'max-w-full' : 'max-w-5xl'
            }`}
          >
            <div className="px-3">
              <div className="text-2xl font-medium line-clamp-1">{title}</div>
              <div className="flex text-sm justify-between items-center mt-1">
                <div className="text-gray-400">
                  {chat?.chat?.timestamp ? dayjs(chat.chat.timestamp).format('LLL') : ''}
                </div>
              </div>
            </div>
          </div>

          <div className="h-full w-full flex flex-col py-2">
            <div className="w-full">
              <Messages
                className="h-full flex pt-4 pb-8"
                user={chatUser ? { id: chatUser.id, name: chatUser.name } : undefined}
                chatId={id}
                readOnly={true}
                selectedModels={selectedModels}
                history={history}
                bottomPadding={true}
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 left-0 flex justify-center w-full bg-gradient-to-b from-transparent to-white dark:to-gray-900">
          <div className="pb-5">
            <button
              className="px-3.5 py-1.5 text-sm font-medium bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-full"
              onClick={cloneSharedChat}
            >
              Clone Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
