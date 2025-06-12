'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';
import { Plus, MessageSquare, Trash2, Settings } from 'lucide-react';

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
      <div className="w-64 bg-black/20 backdrop-blur-sm border-r border-white/5 p-4 flex flex-col h-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <div className="h-8 bg-white/5 rounded-lg animate-pulse"></div>
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-white/5 rounded-md animate-pulse"
              ></div>
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
      className="w-64 bg-black/20 backdrop-blur-sm border-r border-white/5 flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <motion.button
          onClick={() => {
            createNewConversation();
            window.history.replaceState(null, '', '/chat');
          }}
          className="w-full bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 h-8 text-xs font-medium rounded-md transition-colors text-white/70 hover:text-white/90"
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={14} />
          New Chat
        </motion.button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <AnimatePresence mode="popLayout">
          {conversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <MessageSquare size={20} className="text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-xs">No conversations</p>
            </motion.div>
          ) : (
            conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  setActiveConversation(conversation);
                  window.history.replaceState(null, '', `/chat/${conversation.id}`);
                }}
                className={`group cursor-pointer p-2 rounded-md transition-colors relative ${
                  activeConversation?.id === conversation.id
                    ? 'bg-white/10 text-white/90'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                {/* Active indicator */}
                {activeConversation?.id === conversation.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/60 rounded-r-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}

                <div className="flex items-center justify-between pl-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-medium truncate mb-1">
                      {conversation.title}
                    </h3>
                    <p className="text-xs opacity-50">
                      {formatDate(conversation.updated_at)}
                    </p>
                  </div>
                  
                  <motion.button
                    onClick={(e) => handleDeleteConversation(e, conversation.id)}
                    disabled={deletingId === conversation.id}
                    className="opacity-0 group-hover:opacity-60 hover:opacity-100 p-1 transition-opacity"
                    whileTap={{ scale: 0.9 }}
                  >
                    {deletingId === conversation.id ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border border-white/40 border-t-transparent rounded-full"
                      />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Settings Navigation */}
      <div className="p-4 border-t border-white/5">
        <Link href="/settings">
          <motion.div
            className="w-full flex items-center gap-2 text-white/50 hover:text-white/80 px-2 py-2 rounded-md hover:bg-white/5 transition-colors text-xs"
            whileTap={{ scale: 0.98 }}
          >
            <Settings size={14} />
            Settings
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
} 