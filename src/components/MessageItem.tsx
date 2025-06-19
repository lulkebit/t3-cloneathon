'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageHeader } from './MessageHeader';
import { AttachmentDisplay } from './AttachmentDisplay';
import { MessageContent } from './MessageContent';
import { MessageActions } from './MessageActions';

interface MessageItemProps {
  message: any;
  messageIndex: number;
  user: any;
  activeConversation: any;
  copiedId: string | null;
  retryingId: string | null;
  onCopy: (messageId: string, content: string) => Promise<void>;
  onRetry: (messageId: string, messageIndex: number) => Promise<void>;
}

export function MessageItem({
  message,
  messageIndex,
  user,
  activeConversation,
  copiedId,
  retryingId,
  onCopy,
  onRetry,
}: MessageItemProps) {
  const isConsensusMessage =
    message.isConsensus ||
    (message.content &&
      message.content.startsWith('[{') &&
      message.content.includes('"model"'));

  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}
    >
      <MessageHeader
        role={message.role}
        user={user}
        model={activeConversation?.model}
        isConsensus={message.isConsensus}
        createdAt={message.created_at}
        content={message.content}
      />

      <div
        className={`relative ${message.role === 'user' ? 'mr-11' : 'ml-11'}`}
        style={{
          maxWidth:
            message.role === 'assistant'
              ? 'calc(100% - 2.75rem - 2.75rem)'
              : 'calc(100% - 2.75rem - 2.75rem)',
        }}
      >
        <div
          className={`${message.role === 'user' ? 'text-right' : 'text-left'}`}
        >
          {message.role === 'user' ? (
            <div
              className={`prose prose-sm max-w-none ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <AttachmentDisplay
                attachments={message.attachments || []}
                isUserMessage={true}
              />
              <MessageContent content={message.content} isUserMessage={true} />
            </div>
          ) : (
            <div className="relative">
              <MessageContent
                content={message.content}
                isConsensus={message.isConsensus}
                consensusResponses={message.consensusResponses}
                isLoading={message.isLoading}
                isStreaming={message.isStreaming}
                isUserMessage={false}
              />

              {!isConsensusMessage && (
                <MessageActions
                  messageId={message.id}
                  messageIndex={messageIndex}
                  content={message.content}
                  copiedId={copiedId}
                  retryingId={retryingId}
                  isAssistantMessage={message.role === 'assistant'}
                  canRetry={!!activeConversation}
                  onCopy={onCopy}
                  onRetry={onRetry}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
