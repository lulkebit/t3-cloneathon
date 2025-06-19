'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ScrollToBottomButtonProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onScrollToBottom: () => void;
  isSidebarCollapsed: boolean;
}

export function ScrollToBottomButton({
  scrollContainerRef,
  onScrollToBottom,
  isSidebarCollapsed,
}: ScrollToBottomButtonProps) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Show button when user is more than 150px from bottom
      setShowButton(distanceFromBottom > 150);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check with delay to ensure content is loaded
    const initialCheck = () => {
      handleScroll();
    };

    // Check immediately and after a short delay
    initialCheck();
    const timeoutId = setTimeout(initialCheck, 500);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [scrollContainerRef]);

  return (
    <AnimatePresence>
      {showButton && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            x: isSidebarCollapsed ? -128 : 0,
          }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 30,
            delay: 0.06,
          }}
          className="fixed bottom-42 left-1/2 transform -translate-x-1/2 z-50"
          style={{ left: 'calc(50% + 128px)' }}
        >
          <motion.button
            onClick={onScrollToBottom}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-all duration-200 shadow-lg hover:shadow-xl text-xs font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronDown size={14} className="animate-bounce" />
            <span>Scroll to bottom</span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
