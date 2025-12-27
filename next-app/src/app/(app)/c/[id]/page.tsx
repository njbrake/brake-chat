'use client';

import { use } from 'react';
import { Chat } from '@/components/chat';

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { id } = use(params);
  return <Chat chatId={id} />;
}
