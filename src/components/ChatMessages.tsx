'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';
import { User, Bot, Sparkles } from 'lucide-react';

export function ChatMessages() {
  const { messages, activeConversation, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="loading-dots mb-4">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-white/60">Loading messages...</p>
        </motion.div>
      </div>
    );
  }

  if (!activeConversation && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="w-20 h-20 mx-auto mb-6 glass-strong rounded-3xl flex items-center justify-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
            <Bot size={32} className="text-blue-400 relative z-10" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border border-blue-400/20 rounded-2xl"
            ></motion.div>
          </motion.div>
          
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-4"
          >
            Welcome to AI Chat
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/60 leading-relaxed"
          >
            Start a new conversation to chat with various AI models through OpenRouter.
            Choose your preferred model and begin chatting!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 mt-6 text-sm text-white/40"
          >
            <Sparkles size={16} />
            <span>Press Enter to send, Shift+Enter for new line</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: index * 0.05
            }}
            className={`flex gap-4 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 + 0.1 }}
                className="flex-shrink-0 w-10 h-10 glass-strong rounded-2xl flex items-center justify-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20"></div>
                <Bot size={18} className="text-blue-400 relative z-10" />
              </motion.div>
            )}
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 + 0.15 }}
              className={`max-w-2xl rounded-2xl px-6 py-4 relative overflow-hidden ${
                message.role === 'user'
                  ? 'glass-strong border border-blue-400/30 ml-12'
                  : 'glass border border-white/10 mr-12'
              }`}
            >
              {/* Background gradient for user messages */}
              {message.role === 'user' && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
              )}
              
              <div className="relative z-10">
                <div className="prose prose-sm max-w-none">
                  {message.content.split('\n').map((line, lineIndex) => (
                    <motion.p
                      key={lineIndex}
                      initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + lineIndex * 0.02 + 0.2 }}
                      className={`${lineIndex === 0 ? '' : 'mt-3'} ${
                        message.role === 'user' ? 'text-white/90' : 'text-white/90'
                      } leading-relaxed`}
                    >
                      {line || '\u00A0'}
                    </motion.p>
                  ))}
                </div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.3 }}
                  className={`text-xs mt-3 flex items-center gap-2 ${
                    message.role === 'user' ? 'text-white/50' : 'text-white/50'
                  }`}
                >
                  <span>
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {message.role === 'assistant' && (
                    <>
                      <span>•</span>
                      <span className="text-blue-400">AI</span>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>

            {message.role === 'user' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 + 0.1 }}
                className="flex-shrink-0 w-10 h-10 glass-strong rounded-2xl flex items-center justify-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20"></div>
                <User size={18} className="text-white/80 relative z-10" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      
      <div ref={messagesEndRef} />
    </div>
  );
} 