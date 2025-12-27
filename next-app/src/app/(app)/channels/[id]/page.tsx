'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppStore, useUIStore } from '@/store';
import { WEBUI_API_BASE_URL } from '@/lib/constants';
import { Spinner } from '@/components/common/Spinner';
import { Tooltip } from '@/components/common/Tooltip';
import { Menu, Settings, Users, Hash } from 'lucide-react';

interface ChannelPageProps {
  params: Promise<{ id: string }>;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  user_id?: string;
  access_control?: {
    read?: { group_ids?: string[]; user_ids?: string[] };
    write?: { group_ids?: string[]; user_ids?: string[] };
  };
}

interface ChannelMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    profile_image_url?: string;
  };
}

async function getChannelById(token: string, channelId: string): Promise<Channel | null> {
  const res = await fetch(`${WEBUI_API_BASE_URL}/channels/${channelId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function getChannelMessages(
  token: string,
  channelId: string
): Promise<ChannelMessage[]> {
  const res = await fetch(`${WEBUI_API_BASE_URL}/channels/${channelId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export default function ChannelPage({ params }: ChannelPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const WEBUI_NAME = useAppStore((s) => s.WEBUI_NAME);
  const user = useAppStore((s) => s.user);
  const mobile = useAppStore((s) => s.mobile);
  const showSidebar = useUIStore((s) => s.showSidebar);
  const setShowSidebar = useUIStore((s) => s.setShowSidebar);

  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadChannel = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const channelData = await getChannelById(token, id);
    if (!channelData) {
      toast.error('Channel not found');
      router.push('/');
      return;
    }

    setChannel(channelData);

    const messagesData = await getChannelMessages(token, id);
    setMessages(messagesData);

    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadChannel();
  }, [loadChannel]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setSending(true);
    try {
      const res = await fetch(`${WEBUI_API_BASE_URL}/channels/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
        setNewMessage('');
      } else {
        toast.error('Failed to send message');
      }
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-gray-900">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <>
      <title>{`${channel?.name || 'Channel'} • ${WEBUI_NAME}`}</title>
      <div
        className={`relative flex flex-col w-full h-screen max-h-[100dvh] transition-width duration-200 ease-in-out ${
          showSidebar ? 'md:max-w-[calc(100%-260px)]' : ''
        } max-w-full`}
      >
        <nav className="px-2.5 py-2 border-b border-gray-200 dark:border-gray-700 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {mobile && (
                <Tooltip content={showSidebar ? 'Close Sidebar' : 'Open Sidebar'}>
                  <button
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-850 transition"
                    onClick={() => setShowSidebar(!showSidebar)}
                  >
                    <Menu className="size-5" />
                  </button>
                </Tooltip>
              )}
              <div className="flex items-center gap-2">
                <Hash className="size-5 text-gray-500" />
                <span className="font-medium">{channel?.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                <Users className="size-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                <Settings className="size-5" />
              </button>
            </div>
          </div>
          {channel?.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-8">
              {channel.description}
            </div>
          )}
        </nav>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Hash className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Welcome to #{channel?.name}</h2>
              <p className="text-gray-500 dark:text-gray-400">
                This is the beginning of the channel. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {message.user?.profile_image_url ? (
                    <img
                      src={message.user.profile_image_url}
                      alt={message.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {message.user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{message.user?.name || 'Unknown'}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 break-words">{message.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`Message #${channel?.name || 'channel'}`}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
