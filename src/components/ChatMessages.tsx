'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { ChatEmptyState } from './ChatEmptyState';
import { MessageItem } from './MessageItem';

interface ChatMessagesProps {
  isSidebarCollapsed: boolean;
}

export function ChatMessages({ isSidebarCollapsed }: ChatMessagesProps) {
  const { messages, activeConversation, isLoading, refreshMessages, user } =
    useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleRetry = async (messageId: string, messageIndex: number) => {
    if (!activeConversation || retryingId) return;

    setRetryingId(messageId);

    try {
      const userMessage = messages[messageIndex - 1];
      if (!userMessage || userMessage.role !== 'user') {
        console.error('Could not find preceding user message');
        return;
      }

      const deleteResponse = await fetch(
        `/api/conversations/${activeConversation.id}/messages/${messageId}`,
        {
          method: 'DELETE',
        }
      );

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete message');
      }

      const model = activeConversation.model || 'openai/o3-mini';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          model: model,
          conversationId: activeConversation.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate response');
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

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
                if (parsed.done) {
                  await refreshMessages(activeConversation.id);
                  break;
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (error) {
      console.error('Error retrying message:', error);
    } finally {
      setRetryingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-dots mb-4">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-white/60">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!activeConversation && messages.length === 0) {
    return <ChatEmptyState />;
  }

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative">
      <ScrollToBottomButton
        scrollContainerRef={scrollContainerRef}
        onScrollToBottom={scrollToBottom}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <div className="w-full max-w-4xl mx-auto px-6 py-8 space-y-6">
        {messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            messageIndex={index}
            user={user}
            activeConversation={activeConversation}
            copiedId={copiedId}
            retryingId={retryingId}
            onCopy={handleCopy}
            onRetry={handleRetry}
          />
        ))}
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
}
