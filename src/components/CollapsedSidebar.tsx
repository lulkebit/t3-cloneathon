'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Plus } from 'lucide-react';

interface CollapsedSidebarProps {
  isVisible: boolean;
  onToggleExpand: () => void;
  onNewChat: () => void;
}

export function CollapsedSidebar({
  isVisible,
  onToggleExpand,
  onNewChat,
}: CollapsedSidebarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -50, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.8 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed left-4 top-4 z-50 flex flex-col gap-2"
        >
          <div className="relative group/expand">
            <motion.button
              onClick={onToggleExpand}
              className="cursor-pointer w-10 h-10 bg-white/5 hover:bg-white/10 backdrop-blur-sm flex items-center justify-center rounded-lg transition-colors text-white/50 hover:text-white/80 border border-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight size={16} />
            </motion.button>

            <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/expand:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              Expand Sidebar
            </div>
          </div>

          <div className="relative group/newchat">
            <motion.button
              onClick={onNewChat}
              className="cursor-pointer w-10 h-10 bg-white/5 hover:bg-white/10 backdrop-blur-sm flex items-center justify-center rounded-lg transition-colors text-white/70 hover:text-white/90 border border-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={16} />
            </motion.button>

            <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/newchat:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              New Chat
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
