'use client';

import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { LoadingIndicator } from './LoadingIndicator';
import { TypeWriter } from './TypeWriter';
import { ConsensusMessage } from './ConsensusMessage';
import { ConsensusResponse } from '@/types/chat';

interface MessageContentProps {
  content: string;
  isConsensus?: boolean;
  consensusResponses?: ConsensusResponse[];
  isLoading?: boolean;
  isStreaming?: boolean;
  isUserMessage?: boolean;
}

export function MessageContent({
  content,
  isConsensus = false,
  consensusResponses,
  isLoading = false,
  isStreaming = false,
  isUserMessage = false,
}: MessageContentProps) {
  // Check if this is a consensus message by content or flag
  const isConsensusMessage =
    isConsensus ||
    (content && content.startsWith('[{') && content.includes('"model"'));

  if (isUserMessage) {
    return content ? (
      <MarkdownRenderer
        content={content}
        isUserMessage={true}
        className="text-right"
      />
    ) : null;
  }

  // Assistant message rendering
  if (isConsensusMessage) {
    let responses: ConsensusResponse[] = [];
    try {
      if (consensusResponses) {
        responses = consensusResponses;
      } else if (content) {
        // Try to parse the content as consensus responses
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].model) {
          responses = parsed;
        } else {
          // If it's not consensus data, fall back to regular rendering
          return <MarkdownRenderer content={content} />;
        }
      }
    } catch (e) {
      console.error('Error parsing consensus responses:', e);
      // If parsing fails, render as regular markdown
      return <MarkdownRenderer content={content} />;
    }

    return <ConsensusMessage responses={responses} isStreaming={isStreaming} />;
  }

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (isStreaming) {
    return (
      <TypeWriter
        text={content}
        isComplete={false}
        speed={15}
        typingMode="character"
      />
    );
  }

  return <MarkdownRenderer content={content} />;
}
