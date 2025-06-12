'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import { SettingsModal } from '@/components/SettingsModal';
import { Key, Sparkles } from 'lucide-react';

function ChatPageContent() {
  const { profile, isLoading } = useChat();
  const [showSettings, setShowSettings] = useState(false);

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
          <p className="text-white/60">Initializing chat...</p>
        </motion.div>
      </div>
    );
  }

  // Show setup prompt if no API key (first-time user experience)
  if (!profile?.openrouter_api_key) {
    return (
      <div className="h-screen flex items-center justify-center animated-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="max-w-md w-full mx-4"
        >
          <div className="glass-strong rounded-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className="w-16 h-16 mx-auto mb-6 glass rounded-2xl flex items-center justify-center"
            >
              <Key size={24} className="text-blue-400" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-3"
            >
              Welcome to AI Chat
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/60 mb-8 leading-relaxed"
            >
              To get started, you'll need to configure your OpenRouter API key. This allows you to chat with various AI models.
            </motion.p>
            
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
          </div>
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

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
} 