'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import { SettingsModal } from '@/components/SettingsModal';
import { Key, Sparkles } from 'lucide-react';

interface ChatPageContentProps {
  chatId?: string;
}

export function ChatPageContent({ chatId }: ChatPageContentProps) {
  const { profile, isLoading, conversations, setActiveConversation } = useChat();
  const [showSettings, setShowSettings] = useState(false);

  // Set active conversation based on chat ID
  useEffect(() => {
    if (!isLoading && conversations.length > 0) {
      if (chatId) {
        const conversation = conversations.find(conv => conv.id === chatId);
        if (conversation) {
          setActiveConversation(conversation);
        } else {
          // If chat ID not found, redirect to general chat
          window.history.replaceState(null, '', '/chat');
          setActiveConversation(null);
        }
      } else {
        // No chat ID means we're on general chat page
        setActiveConversation(null);
      }
    }
  }, [conversations, chatId, isLoading, setActiveConversation]);

  // Show settings automatically if no API key is configured (first-time setup)
  useEffect(() => {
    if (!isLoading && profile && !profile.openrouter_api_key) {
      setShowSettings(true);
    }
  }, [profile, isLoading]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center animated-bg">
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
          <p className="text-white/60">Loading chat...</p>
        </motion.div>
      </div>
    );
  }

  if (!profile?.openrouter_api_key) {
    return (
      <div className="h-screen flex items-center justify-center animated-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-6 glass rounded-3xl flex items-center justify-center"
          >
            <Key size={32} className="text-blue-400" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white mb-4"
          >
            Welcome to AI Chat
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 mb-8 leading-relaxed"
          >
            To get started, you'll need to configure your OpenRouter API key. 
            This allows you to chat with various AI models.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => setShowSettings(true)}
              className="btn-primary w-full flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles size={18} />
              Configure API Key
            </motion.button>
          </motion.div>
        </motion.div>
        
        {/* Settings modal for first-time setup only */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex animated-bg overflow-hidden"
    >
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <ChatSidebar />
      </motion.div>
      
      {/* Main Chat Area */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col relative"
      >
        {/* Messages */}
        <ChatMessages />
        
        {/* Input */}
        <ChatInput />
      </motion.div>
    </motion.div>
  );
} 