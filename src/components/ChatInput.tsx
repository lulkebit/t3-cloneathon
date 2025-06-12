'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';
import { Send, Bot, Loader2, Sparkles, Zap } from 'lucide-react';
import { getPopularModels } from '@/lib/openrouter';

export function ChatInput() {
  const {
    activeConversation,
    refreshConversations,
    refreshMessages,
    setActiveConversation,
  } = useChat();

  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3.5-sonnet');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const popularModels = getPopularModels();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage('');
    setIsLoading(true);
    setStreamingMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          model: selectedModel,
          conversationId: activeConversation?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentStreamingMessage = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }
                
                if (data.chunk) {
                  currentStreamingMessage += data.chunk;
                  setStreamingMessage(currentStreamingMessage);
                }
                
                if (data.done && data.conversationId) {
                  // Update active conversation and refresh data
                  if (!activeConversation) {
                    const response = await fetch('/api/conversations');
                    if (response.ok) {
                      const convData = await response.json();
                      const newConversation = convData.conversations.find(
                        (conv: any) => conv.id === data.conversationId
                      );
                      if (newConversation) {
                        setActiveConversation(newConversation);
                      }
                    }
                  }
                  
                  await Promise.all([
                    refreshConversations(),
                    activeConversation 
                      ? refreshMessages(activeConversation.id)
                      : refreshMessages(data.conversationId)
                  ]);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="border-t border-white/10 glass-strong backdrop-blur-xl p-6"
    >
      {/* Model Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-blue-400" />
            <label className="text-sm font-medium text-white/80">AI Model</label>
          </div>
        </div>
        
        <motion.select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full input-glass focus-ring disabled:opacity-50"
          disabled={isLoading}
          whileFocus={{ scale: 1.01 }}
        >
          {popularModels.map((model) => (
            <option key={model} value={model} className="bg-gray-900 text-white">
              {model.split('/').pop()} ({model.split('/')[0]})
            </option>
          ))}
        </motion.select>
      </motion.div>

      {/* Streaming Message Display */}
      <AnimatePresence>
        {streamingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mb-6 glass-strong rounded-2xl p-4 border border-white/10 overflow-hidden"
          >
            <div className="flex items-start gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex-shrink-0 w-8 h-8 glass rounded-xl flex items-center justify-center"
              >
                <Bot size={16} className="text-blue-400" />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed"
                >
                  {streamingMessage}
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mt-3"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 size={14} className="text-blue-400" />
                  </motion.div>
                  <span className="text-xs text-white/50">AI is typing...</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4 items-end"
      >
        <div className="flex-1 relative">
          <motion.textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="w-full input-glass focus-ring resize-none min-h-[56px] max-h-32 py-4 pr-4"
            rows={1}
            disabled={isLoading}
            whileFocus={{ scale: 1.01 }}
          />
          
          {/* Character indicator */}
          {message.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-2 right-3 text-xs text-white/40"
            >
              {message.length}
            </motion.div>
          )}
        </div>
        
        <motion.button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="h-14 w-14 btn-primary rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={isLoading ? { 
            boxShadow: "0 0 20px rgba(0, 122, 255, 0.5)" 
          } : {}}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Loader2 size={20} className="animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key="send"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Send size={20} />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Subtle glow effect when message ready */}
          {message.trim() && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-400/20 rounded-2xl animate-pulse"
            />
          )}
        </motion.button>
      </motion.form>

      {/* Helper text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xs text-white/40 mt-3 text-center"
      >
        Press <kbd className="px-1.5 py-0.5 text-xs bg-white/10 rounded border border-white/20">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 text-xs bg-white/10 rounded border border-white/20">Shift+Enter</kbd> for new line
      </motion.p>
    </motion.div>
  );
} 