'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TypeWriterProps {
  text: string;
  isComplete?: boolean;
  speed?: number;
}

export function TypeWriter({ text, isComplete = false, speed = 15 }: TypeWriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Für Streaming: Zeige Text sofort an
    if (!isComplete) {
      setDisplayedText(text);
      setIsTyping(text.length > 0);
      return;
    }

    // Für komplette Nachrichten: Typing-Effekt (falls gewünscht)
    setDisplayedText(text);
    setIsTyping(false);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, isComplete, speed]);

  return (
    <div className="relative">
      <div className="prose prose-invert max-w-none">
        <MarkdownRenderer content={displayedText} />
      </div>
      
      {isTyping && !isComplete && (
        <span className="inline-block w-0.5 h-5 bg-blue-400 ml-1 align-text-bottom opacity-75" />
      )}
    </div>
  );
} 