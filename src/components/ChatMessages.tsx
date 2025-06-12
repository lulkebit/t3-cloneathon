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
    <div className="flex-1 overflow-y-auto relative">
      {/* Message Container - aligned with input width */}
      <div className="w-full max-w-4xl mx-auto px-6 py-8 space-y-8">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                delay: index * 0.03
              }}
              className={`group ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}
            >
              {/* Message Header */}
              <motion.div
                initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 + 0.1 }}
                className={`flex items-center gap-3 mb-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
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
              </motion.div>

              {/* Message Content */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 + 0.15 }}
                className={`relative ${
                  message.role === 'user' 
                    ? 'mr-11 max-w-2xl text-right' 
                    : 'ml-11'
                }`}
              >
                {/* Message text directly on background */}
                <div className="prose prose-sm max-w-none">
                  {message.content.split('\n').map((line, lineIndex) => (
                    <motion.p
                      key={lineIndex}
                      initial={{ opacity: 0, x: message.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 + lineIndex * 0.01 + 0.2 }}
                      className={`${lineIndex === 0 ? '' : 'mt-2'} text-white/90 leading-relaxed group-hover:text-white transition-colors duration-200 ${
                        message.role === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {line || '\u00A0'}
                    </motion.p>
                  ))}
                </div>

                {/* Subtle hover indicator */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute top-0 bottom-0 w-0.5 ${
                    message.role === 'user' 
                      ? 'right-0 origin-right bg-purple-400/50' 
                      : 'left-0 origin-left bg-blue-400/50'
                  }`}
                />
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div ref={messagesEndRef} />
    </div>
  );
} 