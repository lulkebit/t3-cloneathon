import React from 'react';
import { ChatProvider } from '@/contexts/ChatContext';
import { ChatPageContent } from '@/components/ChatPageContent';

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  return (
    <ChatProvider>
      <ChatPageContent chatId={params.id} />
    </ChatProvider>
  );
} 