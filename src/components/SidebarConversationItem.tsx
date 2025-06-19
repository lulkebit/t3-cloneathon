'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Edit3, Trash2, Check, X } from 'lucide-react';

interface ConversationItemProps {
  conversation: {
    id: string;
    title: string;
    model: string;
    updated_at: string;
  };
  isActive: boolean;
  editingId: string | null;
  editTitle: string;
  confirmingDeleteId: string | null;
  deletingId: string | null;
  isRenaming: boolean;
  index: number;
  onConversationClick: () => void;
  onEditClick: (e: React.MouseEvent, conversationId: string, currentTitle: string) => void;
  onDeleteClick: (e: React.MouseEvent, conversationId: string) => void;
  onCancelDelete: (e: React.MouseEvent) => void;
  onSaveEdit: (e: React.MouseEvent, conversationId: string) => void;
  onCancelEdit: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent, conversationId: string) => void;
  onEditTitleChange: (value: string) => void;
  formatDate: (dateString: string) => string;
}

export function SidebarConversationItem({
  conversation,
  isActive,
  editingId,
  editTitle,
  confirmingDeleteId,
  deletingId,
  isRenaming,
  index,
  onConversationClick,
  onEditClick,
  onDeleteClick,
  onCancelDelete,
  onSaveEdit,
  onCancelEdit,
  onKeyDown,
  onEditTitleChange,
  formatDate,
}: ConversationItemProps) {
  const isConsensusConversation = (model: string) => {
    return model.startsWith('consensus:');
  };

  return (
    <motion.div
      key={conversation.id}
      layout
      initial={{ opacity: 0, y: 20, x: -20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.9 }}
      transition={{ 
        delay: 0.5 + index * 0.05,
        duration: 0.3,
        ease: "easeOut"
      }}
      onClick={onConversationClick}
      className={`group p-2 rounded-md transition-colors relative ${
        deletingId === conversation.id
          ? 'cursor-not-allowed opacity-50'
          : editingId === conversation.id
          ? 'cursor-default'
          : 'cursor-pointer'
      } ${
        isActive
          ? 'bg-white/10 text-white/90'
          : 'text-white/60 hover:bg-white/5 hover:text-white/80'
      }`}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/60 rounded-r-sm"
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      <div className="relative pl-2">
        {/* Main content area - full width */}
        <div className="w-full pr-2">
          <div className="flex items-center gap-1.5 mb-1">
            {isConsensusConversation(conversation.model) && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex-shrink-0 relative group/consensus"
              >
                <div className="w-4 h-4 bg-purple-500/20 border border-purple-400/30 rounded-full flex items-center justify-center">
                  <Users size={8} className="text-purple-400" />
                </div>
                
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/consensus:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Multi-Model Consensus Chat
                </div>
              </motion.div>
            )}
            {editingId === conversation.id ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => onEditTitleChange(e.target.value)}
                onKeyDown={(e) => onKeyDown(e, conversation.id)}
                className="text-xs font-medium bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                style={{ width: 'calc(100% - 80px)' }}
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            ) : (
              <h3 className="text-xs font-medium truncate flex-1">
                {conversation.title}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs opacity-50">
              {formatDate(conversation.updated_at)}
            </p>
            {isConsensusConversation(conversation.model) && (
              <span className="text-[10px] text-purple-400/60 font-medium">
                {(() => {
                  // Extract the models part after 'consensus:'
                  const modelsString = conversation.model.replace('consensus:', '');
                  const modelCount = modelsString ? modelsString.split(',').length : 0;
                  return modelCount > 0 ? `${modelCount} Models` : 'Consensus';
                })()}
              </span>
            )}
          </div>
        </div>

        {/* Deleting status overlay */}
        {deletingId === conversation.id && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-1 right-2 flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded px-2 py-1"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border border-red-400/60 border-t-transparent rounded-full"
            />
            <span className="text-[10px] text-red-400/80 font-medium">
              Deleting...
            </span>
          </motion.div>
        )}
        
        {/* Gradient background for buttons */}
        <div 
          className="absolute top-0 right-0 bottom-0 w-32 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 rounded-r-md"
          style={{
            background: isActive
              ? 'linear-gradient(to right, transparent 10%, #27252b 50%)'
              : 'linear-gradient(to right, transparent 10%, #1a191e 50%)'
          }}
        />
        
        {/* Action buttons - positioned as overlay */}
        <div className="absolute top-1 right-1 flex items-center gap-1 z-20">
          {editingId === conversation.id ? (
            <>
              <motion.button
                onClick={(e) => onSaveEdit(e, conversation.id)}
                disabled={isRenaming || editTitle.trim() === ''}
                className={`p-1.5 rounded transition-colors backdrop-blur-sm ${
                  isRenaming || editTitle.trim() === ''
                    ? 'bg-green-500/10 cursor-not-allowed'
                    : 'cursor-pointer bg-green-500/20 hover:bg-green-500/30'
                }`}
                whileHover={isRenaming || editTitle.trim() === '' ? {} : { scale: 1.05 }}
                whileTap={isRenaming || editTitle.trim() === '' ? {} : { scale: 0.95 }}
              >
                {isRenaming ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border border-white/40 border-t-transparent rounded-full"
                  />
                ) : (
                  <Check size={14} className="text-green-400" />
                )}
              </motion.button>
              {!isRenaming && (
                <motion.button
                  onClick={onCancelEdit}
                  className="cursor-pointer p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={14} className="text-white/60" />
                </motion.button>
              )}
            </>
          ) : confirmingDeleteId === conversation.id ? (
            <>
              <motion.button
                onClick={(e) => onDeleteClick(e, conversation.id)}
                disabled={deletingId === conversation.id}
                className={`p-1.5 rounded transition-colors backdrop-blur-sm ${
                  deletingId === conversation.id
                    ? 'bg-red-500/10 cursor-not-allowed'
                    : 'cursor-pointer bg-red-500/20 hover:bg-red-500/30'
                }`}
                whileHover={deletingId === conversation.id ? {} : { scale: 1.05 }}
                whileTap={deletingId === conversation.id ? {} : { scale: 0.95 }}
              >
                {deletingId === conversation.id ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border border-white/40 border-t-transparent rounded-full"
                  />
                ) : (
                  <Check size={14} className="text-red-400" />
                )}
              </motion.button>
              {deletingId !== conversation.id && (
                <motion.button
                  onClick={onCancelDelete}
                  className="cursor-pointer p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={14} className="text-white/60" />
                </motion.button>
              )}
            </>
          ) : (
            <>
              <motion.button
                onClick={(e) => onEditClick(e, conversation.id, conversation.title)}
                disabled={deletingId === conversation.id}
                className="cursor-pointer opacity-0 group-hover:opacity-60 hover:opacity-100 p-1.5 transition-opacity rounded hover:bg-blue-500/20 backdrop-blur-sm"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Edit3 size={14} className="text-white/60" />
              </motion.button>
              <motion.button
                onClick={(e) => onDeleteClick(e, conversation.id)}
                disabled={deletingId === conversation.id}
                className="cursor-pointer opacity-0 group-hover:opacity-60 hover:opacity-100 p-1.5 transition-opacity rounded hover:bg-red-500/20 backdrop-blur-sm"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Trash2 size={14} className="text-white/60" />
              </motion.button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
} 