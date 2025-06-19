'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { SidebarConversationItem } from './SidebarConversationItem';
import { CollapsedSidebar } from './CollapsedSidebar';

interface ChatSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ChatSidebar({
  isCollapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    createNewConversation,
    deleteConversation,
    renameConversation,
    isLoading,
  } = useChat();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirmingDeleteId === conversationId) {
      handleDeleteConversation(conversationId);
    } else {
      setConfirmingDeleteId(conversationId);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    setDeletingId(conversationId);
    setConfirmingDeleteId(null);
    try {
      await deleteConversation(conversationId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDeleteId(null);
  };

  const handleEditClick = (
    e: React.MouseEvent,
    conversationId: string,
    currentTitle: string
  ) => {
    e.stopPropagation();
    setEditingId(conversationId);
    setEditTitle(currentTitle);
    setConfirmingDeleteId(null); // Cancel any pending delete
  };

  const handleSaveEdit = async (
    e: React.MouseEvent,
    conversationId: string
  ) => {
    e.stopPropagation();
    if (editTitle.trim() === '') {
      return;
    }

    setIsRenaming(true);
    try {
      const success = await renameConversation(
        conversationId,
        editTitle.trim()
      );
      if (success) {
        setEditingId(null);
        setEditTitle('');
      }
    } finally {
      setIsRenaming(false);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, conversationId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(e as any, conversationId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit(e as any);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const isConsensusConversation = (model: string) => {
    return model.startsWith('consensus:');
  };

  return (
    <>
      <CollapsedSidebar
        isVisible={isCollapsed}
        onToggleExpand={onToggleCollapse}
        onNewChat={() => {
          createNewConversation();
          window.history.replaceState(null, '', '/chat');
        }}
      />

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -256, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 256 }}
            exit={{ opacity: 0, x: -256, width: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="bg-black/20 backdrop-blur-sm border-r border-white/5 flex flex-col h-full overflow-hidden"
          >
            {isLoading ? (
              <motion.div
                className="p-4 flex flex-col h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="h-8 bg-white/5 rounded-lg animate-pulse"></div>
                  <div className="space-y-1">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="h-12 bg-white/5 rounded-md animate-pulse"
                      ></motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <>
                <motion.div
                  className="p-4 border-b border-white/5 flex items-center gap-2"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.button
                    onClick={() => {
                      createNewConversation();
                      window.history.replaceState(null, '', '/chat');
                    }}
                    className="cursor-pointer flex-1 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 h-8 text-xs font-medium rounded-md transition-colors text-white/70 hover:text-white/90"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Plus size={14} />
                    New Chat
                  </motion.button>

                  <div className="relative group/collapse">
                    <motion.button
                      onClick={onToggleCollapse}
                      className="cursor-pointer w-8 h-8 bg-white/5 hover:bg-white/10 flex items-center justify-center rounded-md transition-colors text-white/50 hover:text-white/80"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <ChevronLeft size={14} />
                    </motion.button>
                  </div>
                </motion.div>

                <motion.div
                  className="flex-1 overflow-y-auto p-2 space-y-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <AnimatePresence mode="popLayout">
                    {conversations.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: 0.5 }}
                        className="text-center py-8"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6, type: 'spring' }}
                        >
                          <MessageSquare
                            size={20}
                            className="text-white/20 mx-auto mb-2"
                          />
                        </motion.div>
                        <motion.p
                          className="text-white/40 text-xs"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7 }}
                        >
                          No conversations
                        </motion.p>
                      </motion.div>
                    ) : (
                      conversations.map((conversation, index) => (
                        <SidebarConversationItem
                          key={conversation.id}
                          conversation={conversation}
                          isActive={activeConversation?.id === conversation.id}
                          editingId={editingId}
                          editTitle={editTitle}
                          confirmingDeleteId={confirmingDeleteId}
                          deletingId={deletingId}
                          isRenaming={isRenaming}
                          index={index}
                          onConversationClick={() => {
                            if (
                              deletingId !== conversation.id &&
                              editingId !== conversation.id
                            ) {
                              setActiveConversation(conversation);
                              window.history.replaceState(
                                null,
                                '',
                                `/chat/${conversation.id}`
                              );
                            }
                          }}
                          onEditClick={handleEditClick}
                          onDeleteClick={handleDeleteClick}
                          onCancelDelete={handleCancelDelete}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                          onKeyDown={handleKeyDown}
                          onEditTitleChange={setEditTitle}
                          formatDate={formatDate}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  className="p-4 border-t border-white/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Link href="/settings">
                    <motion.div
                      className="w-full flex items-center gap-2 text-white/50 hover:text-white/80 px-2 py-2 rounded-md hover:bg-white/5 transition-colors text-xs"
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Settings size={14} />
                      Settings
                    </motion.div>
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
