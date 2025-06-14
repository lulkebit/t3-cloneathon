import React from 'react';
import { ChatProvider } from '@/contexts/ChatContext';
import { ChatPageContent } from '@/components/ChatPageContent';

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
} 