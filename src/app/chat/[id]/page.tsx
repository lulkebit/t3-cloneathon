import React from 'react';
import { ChatProvider } from '@/contexts/ChatContext';
import { ChatPageContent } from '@/components/ChatPageContent';

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  
  return (
    <ChatProvider>
      <ChatPageContent chatId={id} />
    </ChatProvider>
  );
} 