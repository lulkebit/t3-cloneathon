'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';
import { User, Bot, Sparkles, Copy, Check, RotateCcw, Loader2, FileImage, FileText, Download, Users } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { LoadingIndicator } from './LoadingIndicator';
import { TypeWriter } from './TypeWriter';
import { ConsensusMessage } from './ConsensusMessage';
import { ConsensusResponse } from '@/types/chat';

const getProviderLogo = (model: string) => {
  const providerLogos: Record<string, string> = {
    'anthropic': '/logos/anthropic.svg',
    'openai': '/logos/openai.svg',
    'google': '/logos/google.svg',
    'meta-llama': '/logos/meta.svg',
    'mistralai': '/logos/mistral.svg',
    'deepseek': '/logos/deepseek.svg'
  };
  
  const provider = model.split('/')[0];
  return providerLogos[provider.toLowerCase()] || null;
};

const formatModelName = (model: string) => {
  const parts = model.split('/');
  if (parts.length === 2) {
    const [provider, modelName] = parts;
    return modelName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return model;
};

const getUserDisplayName = (user: any) => {
  if (!user?.user_metadata) return 'You';
  
  const metadata = user.user_metadata;
  return metadata.full_name || 
         metadata.name || 
         metadata.display_name || 
         metadata.first_name ||
         (metadata.given_name && metadata.family_name ? `${metadata.given_name} ${metadata.family_name}` : null) ||
         metadata.given_name ||
         metadata.nickname ||
         'You';
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function ChatMessages() {
  const { messages, activeConversation, isLoading, refreshMessages, user } = useChat();
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
      const userMessage = messages[messageIndex - 1];
      if (!userMessage || userMessage.role !== 'user') {
        console.error('Could not find preceding user message');
        return;
      }

      const deleteResponse = await fetch(`/api/conversations/${activeConversation.id}/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete message');
      }

      const model = activeConversation.model || 'openai/o3';

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
              } catch (e) {
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
      <div className="w-full max-w-4xl mx-auto px-6 py-8 space-y-6">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`group ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}
          >
            <div className={`flex items-center gap-3 mb-3 ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30' 
                  : (message.isConsensus || (message.content && message.content.startsWith('[{') && message.content.includes('"model"')))
                    ? 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30'
                    : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30'
              }`}>
                {message.role === 'user' ? (
                  user?.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="User Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-white/90" />
                  )
                ) : (
                  (() => {
                    // Check if this is a consensus message
                    const isConsensusMessage = message.isConsensus || (message.content && message.content.startsWith('[{') && message.content.includes('"model"'));
                    
                    if (isConsensusMessage) {
                      return <Users size={16} className="text-purple-400" />;
                    }
                    
                    const logoUrl = activeConversation?.model ? getProviderLogo(activeConversation.model) : null;
                    if (logoUrl) {
                      return (
                        <img 
                          src={logoUrl} 
                          alt="Provider Logo" 
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const botIcon = target.nextElementSibling as HTMLElement;
                            if (botIcon) {
                              botIcon.classList.remove('hidden');
                            }
                          }}
                        />
                      );
                    }
                    
                    // Fallback to Bot icon for assistant messages
                    return <Bot size={16} className="text-blue-400" />;
                  })()
                )}
              </div>

              <div className={`flex items-center gap-2 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}>
                <span className={`text-sm font-medium ${
                  message.role === 'user' ? 'text-white/90' : 'text-blue-400'
                }`}>
                  {message.role === 'user' 
                    ? getUserDisplayName(user)
                    : (message.isConsensus || (message.content && message.content.startsWith('[{') && message.content.includes('"model"')))
                      ? 'Multi-Model Consensus'
                      : activeConversation?.model 
                        ? formatModelName(activeConversation.model)
                        : 'Assistant'
                  }
                </span>
                <span className="text-xs text-white/40">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div className={`relative ${
              message.role === 'user' 
                ? 'mr-11' 
                : 'ml-11'
            }`} style={{
              maxWidth: message.role === 'assistant' ? 'calc(100% - 2.75rem - 2.75rem)' : 'calc(100% - 2.75rem - 2.75rem)'
            }}>
              <div className={`${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                {message.role === 'user' ? (
                  <div className={`prose prose-sm max-w-none ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {/* Display attachments for user messages */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className={`mb-3 flex flex-wrap gap-2 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}>
                        {message.attachments.map((attachment, index) => (
                          <div
                            key={attachment.id || index}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm max-w-xs"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {attachment.file_type.startsWith('image/') ? (
                                <div className="flex items-center gap-2">
                                  <FileImage size={16} className="text-blue-400 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-white/80 truncate text-xs">
                                      {attachment.filename}
                                    </div>
                                    <div className="text-white/40 text-xs">
                                      {formatFileSize(attachment.file_size)}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <FileText size={16} className="text-red-400 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-white/80 truncate text-xs">
                                      {attachment.filename}
                                    </div>
                                    <div className="text-white/40 text-xs">
                                      {formatFileSize(attachment.file_size)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <a
                              href={attachment.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cursor-pointer p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                            >
                              <Download size={14} className="text-white/60 hover:text-white" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {message.content && (
                      <MarkdownRenderer 
                        content={message.content} 
                        isUserMessage={true}
                        className="text-right"
                      />
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <div>
                      {message.isConsensus || (message.content && message.content.startsWith('[{') && message.content.includes('"model"')) ? (
                        (() => {
                          let consensusResponses: ConsensusResponse[] = [];
                          try {
                            if (message.consensusResponses) {
                              consensusResponses = message.consensusResponses;
                            } else if (message.content) {
                              // Try to parse the content as consensus responses
                              const parsed = JSON.parse(message.content);
                              if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].model) {
                                consensusResponses = parsed;
                              } else {
                                // If it's not consensus data, fall back to regular rendering
                                return <MarkdownRenderer content={message.content} />;
                              }
                            }
                          } catch (e) {
                            console.error('Error parsing consensus responses:', e);
                            // If parsing fails, render as regular markdown
                            return <MarkdownRenderer content={message.content} />;
                          }
                          
                          return (
                            <ConsensusMessage 
                              responses={consensusResponses}
                              isStreaming={message.isStreaming}
                            />
                          );
                        })()
                      ) : message.isLoading ? (
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
                    
                    {/* Only show copy/retry for non-consensus messages */}
                    {!(message.isConsensus || (message.content && message.content.startsWith('[{') && message.content.includes('"model"'))) && (
                      <div className="flex justify-start gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="relative group/copy">
                          <button
                            onClick={() => handleCopy(message.id, message.content)}
                            className="cursor-pointer p-2 rounded-lg hover:bg-white/10 transition-colors duration-150"
                          >
                            {copiedId === message.id ? (
                              <Check size={16} className="text-green-400" />
                            ) : (
                              <Copy size={16} className="text-white/60 hover:text-white" />
                            )}
                          </button>
                          
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/copy:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            {copiedId === message.id ? 'Copied!' : 'Copy'}
                          </div>
                        </div>

                      <div className="relative group/retry">
                        <button
                          onClick={() => handleRetry(message.id, index)}
                          disabled={retryingId === message.id || !activeConversation}
                          className="cursor-pointer p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                          {retryingId === message.id ? (
                            <Loader2 size={16} className="text-blue-400 animate-spin" />
                          ) : (
                            <RotateCcw size={16} className="text-white/60 hover:text-white" />
                          )}
                        </button>
                        
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/retry:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          {retryingId === message.id ? 'Retrying...' : 'Retry'}
                        </div>
                      </div>
                    </div>
                    )}
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