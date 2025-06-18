'use client';

import React from 'react';
import { useLayout, ChatStyle } from '@/contexts/LayoutContext';
import { MessageSquare, List } from 'lucide-react'; // Example icons

const ChatStyleSwitcher: React.FC = () => {
  const { chatStyle, setChatStyle } = useLayout();

  const styles: { value: ChatStyle; label: string; icon: JSX.Element }[] = [
    { value: 'bubbles', label: 'Chat Bubbles', icon: <MessageSquare size={16} /> },
    { value: 'classic', label: 'Classic View', icon: <List size={16} /> },
  ];

  const handleStyleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setChatStyle(event.target.value as ChatStyle);
  };

  return (
    <div className="chat-style-switcher relative inline-block">
      <label htmlFor="chat-style-select" className="sr-only">Select Chat View Style</label>
      <select
        id="chat-style-select"
        value={chatStyle}
        onChange={handleStyleChange}
        className="appearance-none w-full bg-[var(--glass-bg)] text-[var(--text-default)] border border-[var(--glass-border-color)] rounded-lg py-2 px-3 pr-8 leading-tight focus:outline-none focus:border-[var(--accent-default)] focus:ring-1 focus:ring-[var(--accent-default)]"
        style={{ minWidth: '150px' }} // Adjusted minWidth for longer labels
      >
        {styles.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--text-subtle)]">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
};

export default ChatStyleSwitcher;
