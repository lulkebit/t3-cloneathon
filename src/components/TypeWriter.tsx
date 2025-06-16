'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TypeWriterProps {
  text: string;
  isComplete?: boolean;
  speed?: number;
  onComplete?: () => void;
  typingMode?: 'character' | 'word';
}

export function TypeWriter({ 
  text, 
  isComplete = false, 
  speed = 25,
  onComplete,
  typingMode = 'character'
}: TypeWriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cursor blinking effect
  useEffect(() => {
    const blinkCursor = () => {
      setShowCursor(prev => !prev);
      cursorTimeoutRef.current = setTimeout(blinkCursor, 530);
    };
    
    if (!isComplete) {
      blinkCursor();
    } else {
      setShowCursor(false);
    }

    return () => {
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
  }, [isComplete]);

  // Immediately update displayed text when new content arrives
  useEffect(() => {
    setDisplayedText(text);
    setIsTyping(!isComplete && text.length > 0);
    
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [text, isComplete, onComplete]);

  // Insert cursor after markdown rendering
  useEffect(() => {
    if (!containerRef.current || isComplete) return;

    const container = containerRef.current;
    const lastTextNode = findLastTextNode(container);
    
    if (lastTextNode && lastTextNode.parentElement) {
      // Remove any existing cursor
      const existingCursor = container.querySelector('.typewriter-cursor-inline');
      if (existingCursor) {
        existingCursor.remove();
      }

      // Create and insert cursor
      const cursor = document.createElement('span');
      cursor.className = `typewriter-cursor-inline inline-block w-0.5 h-5 bg-blue-400 typewriter-cursor typing`;
      cursor.style.opacity = showCursor ? '1' : '0';
      cursor.style.verticalAlign = 'text-bottom';
      cursor.style.marginLeft = '2px';

      // Insert cursor after the last text node
      if (lastTextNode.nextSibling) {
        lastTextNode.parentElement.insertBefore(cursor, lastTextNode.nextSibling);
      } else {
        lastTextNode.parentElement.appendChild(cursor);
      }
    }
  }, [displayedText, isComplete, showCursor]);

  // Helper function to find the last text node
  const findLastTextNode = (element: HTMLElement): Text | null => {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let lastTextNode: Text | null = null;
    let node;
    
    while (node = walker.nextNode()) {
      if (node.textContent && node.textContent.trim()) {
        lastTextNode = node as Text;
      }
    }

    return lastTextNode;
  };

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="prose prose-invert max-w-none streaming-message"
      >
        <MarkdownRenderer content={displayedText} />
      </div>
    </div>
  );
} 