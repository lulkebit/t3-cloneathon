'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';
import { Plus, MessageSquare, Trash2, Settings, Sparkles, Bot } from 'lucide-react';

export function ChatSidebar() {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    createNewConversation,
    deleteConversation,
    isLoading,
  } = useChat();


  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setDeletingId(conversationId);
    try {
      await deleteConversation(conversationId);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="w-80 glass-strong border-r border-white/10 p-6 flex flex-col h-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="h-12 glass rounded-xl animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="h-20 glass rounded-xl animate-pulse"
              ></motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-80 glass-strong border-r border-white/10 flex flex-col h-full backdrop-blur-xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <motion.button
          onClick={() => {
            createNewConversation();
            window.history.replaceState(null, '', '/chat');
          }}
          className="w-full btn-primary flex items-center justify-center gap-3 h-12 text-sm font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Plus size={18} />
          New Chat
        </motion.button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {conversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="w-16 h-16 mx-auto mb-4 glass rounded-2xl flex items-center justify-center"
              >
                <MessageSquare size={24} className="text-white/40" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/60 text-sm mb-2"
              >
                No conversations yet
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/40 text-xs"
              >
                Start a new chat to begin
              </motion.p>
            </motion.div>
          ) : (
            conversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  delay: index * 0.05,
                  type: "spring", 
                  stiffness: 300,
                  damping: 30
                }}
                onClick={() => {
                  setActiveConversation(conversation);
                  window.history.replaceState(null, '', `/chat/${conversation.id}`);
                }}
                className={`group cursor-pointer p-4 rounded-xl border transition-all relative overflow-hidden ${
                  activeConversation?.id === conversation.id
                    ? 'glass-strong border-blue-400/30 bg-blue-500/10'
                    : 'glass-hover border-white/10 hover:border-white/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active indicator */}
                {activeConversation?.id === conversation.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}

                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pl-3">
                    <motion.h3
                      className="font-medium text-white/90 truncate text-sm mb-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {conversation.title}
                    </motion.h3>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Bot size={12} className="text-blue-400 flex-shrink-0" />
                      <motion.p
                        className="text-white/50 text-xs truncate"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {conversation.model.split('/').pop()}
                      </motion.p>
                    </div>
                    
                    <motion.p
                      className="text-white/40 text-xs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {formatDate(conversation.updated_at)}
                    </motion.p>
                  </div>
                  
                  <motion.button
                    onClick={(e) => handleDeleteConversation(e, conversation.id)}
                    disabled={deletingId === conversation.id}
                    className="opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-red-400 transition-all rounded-lg hover:bg-red-500/10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {deletingId === conversation.id ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full"
                      />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Settings Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 border-t border-white/10"
      >
        <Link href="/settings">
          <motion.div
            className="w-full flex items-center gap-3 text-white/60 hover:text-white px-4 py-3 rounded-xl glass-hover transition-all text-sm font-medium"
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Settings size={18} />
            Settings
          </motion.div>
        </Link>
      </motion.div>
    </motion.div>
  );
} 