'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TypeWriterProps {
  text: string;
  isComplete?: boolean;
  speed?: number;
}

export function TypeWriter({ text, isComplete = false, speed = 15 }: TypeWriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (isComplete) {
      setDisplayedText(text);
      return;
    }

    // Nur weiter tippen, wenn neuer Text verfügbar ist
    if (indexRef.current < text.length) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const typeNextChar = () => {
        const nextIndex = indexRef.current + 1;
        setDisplayedText(text.slice(0, nextIndex));
        indexRef.current = nextIndex;

        if (nextIndex < text.length) {
          const char = text[nextIndex - 1];
          const delay = char === '.' || char === '!' || char === '?' ? speed * 3 :
                       char === ',' || char === ';' ? speed * 2 :
                       char === ' ' ? speed * 0.5 :
                       speed;
          
          timeoutRef.current = setTimeout(typeNextChar, delay);
        }
      };

      timeoutRef.current = setTimeout(typeNextChar, speed);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, isComplete, speed]);

  // Reset wenn neuer Text weniger Zeichen hat (sollte normalerweise nicht passieren)
  useEffect(() => {
    if (text.length < displayedText.length) {
      setDisplayedText(text);
      indexRef.current = text.length;
    }
  }, [text.length, displayedText.length]);

  const isTyping = !isComplete && indexRef.current < text.length;

  return (
    <div className="relative">
      <div className="prose prose-invert max-w-none">
        <MarkdownRenderer content={displayedText} />
      </div>
      
      <AnimatePresence>
        {isTyping && (
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="inline-block w-0.5 h-5 bg-blue-400 ml-1 align-text-bottom"
          />
        )}
      </AnimatePresence>
    </div>
  );
} 