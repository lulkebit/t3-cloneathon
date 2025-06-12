'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';
import { User, Bot, Sparkles, Copy, Check, RotateCcw, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { LoadingIndicator } from './LoadingIndicator';
import { TypeWriter } from './TypeWriter';

export function ChatMessages() {
  const { messages, activeConversation, isLoading, refreshMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
      // Find the user message that preceded this assistant message
      const userMessage = messages[messageIndex - 1];
      if (!userMessage || userMessage.role !== 'user') {
        console.error('Could not find preceding user message');
        return;
      }

      // Delete the assistant message
      const deleteResponse = await fetch(`/api/conversations/${activeConversation.id}/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete message');
      }

      // Get the model from the conversation or use a default
      const model = activeConversation.model || 'google/gemma-3n-e4b-it:free';

      // Resend the user message to generate a new response
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

      // Handle the streaming response
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
                  // Refresh messages when streaming is complete
                  await refreshMessages(activeConversation.id);
                  break;
                }
              } catch (e) {
                // Ignore parsing errors
              }
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
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 glass-strong rounded-3xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
            <Bot size={32} className="text-blue-400 relative z-10" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-4">
            Welcome to AI Chat
          </h3>
          
          <p className="text-white/60 leading-relaxed">
            Start a new conversation to chat with various AI models through OpenRouter.
            Choose your preferred model and begin chatting!
          </p>

          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-white/40">
            <Sparkles size={16} />
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto relative">
      {/* Message Container - aligned with input width */}
      <div className="w-full max-w-4xl mx-auto px-6 py-8 space-y-6">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`group ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}
          >
            {/* Message Header */}
            <div className={`flex items-center gap-3 mb-3 ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30' 
                  : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30'
              }`}>
                {message.role === 'user' ? (
                  <User size={16} className="text-white/90" />
                ) : (
                  <Bot size={16} className="text-blue-400" />
                )}
              </div>

              {/* Name and timestamp */}
              <div className={`flex items-center gap-2 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}>
                <span className={`text-sm font-medium ${
                  message.role === 'user' ? 'text-white/90' : 'text-blue-400'
                }`}>
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </span>
                <span className="text-xs text-white/40">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Message Content */}
            <div className={`relative ${
              message.role === 'user' 
                ? 'mr-11 max-w-2xl' 
                : 'ml-11 max-w-4xl'
            }`}>
              {/* Message content with markdown rendering */}
              <div className={`${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                {message.role === 'user' ? (
                  // For user messages, keep simple text rendering
                  <div className="prose prose-sm max-w-none">
                    {message.content.split('\n').map((line, lineIndex) => (
                      <p
                        key={lineIndex}
                        className={`${lineIndex === 0 ? '' : 'mt-2'} text-white/90 leading-relaxed text-right`}
                      >
                        {line || '\u00A0'}
                      </p>
                    ))}
                  </div>
                ) : (
                  // For assistant messages, handle loading, streaming, and completed states
                  <div className="relative">
                    <div>
                      {message.isLoading ? (
                        <LoadingIndicator />
                      ) : message.isStreaming ? (
                        <TypeWriter 
                          text={message.content} 
                          isComplete={false}
                          speed={20}
                        />
                      ) : (
                        <MarkdownRenderer content={message.content} />
                      )}
                    </div>
                    
                    {/* Action buttons for assistant messages */}
                    <div className="flex justify-start gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {/* Copy button */}
                      <div className="relative group/copy">
                        <button
                          onClick={() => handleCopy(message.id, message.content)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-150"
                        >
                          {copiedId === message.id ? (
                            <Check size={16} className="text-green-400" />
                          ) : (
                            <Copy size={16} className="text-white/60 hover:text-white" />
                          )}
                        </button>
                        
                        {/* Hover tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/copy:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          {copiedId === message.id ? 'Copied!' : 'Copy'}
                        </div>
                      </div>

                      {/* Retry button */}
                      <div className="relative group/retry">
                        <button
                          onClick={() => handleRetry(message.id, index)}
                          disabled={retryingId === message.id || !activeConversation}
                          className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                          {retryingId === message.id ? (
                            <Loader2 size={16} className="text-blue-400 animate-spin" />
                          ) : (
                            <RotateCcw size={16} className="text-white/60 hover:text-white" />
                          )}
                        </button>
                        
                        {/* Hover tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/retry:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          {retryingId === message.id ? 'Retrying...' : 'Retry'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div ref={messagesEndRef} />
    </div>
  );
} 