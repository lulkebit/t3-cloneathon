'use client';

import React from 'react';
import { Send, Loader2 } from 'lucide-react';

interface SendButtonProps {
  isLoading: boolean;
  isDisabled: boolean;
}

export function SendButton({ isLoading, isDisabled }: SendButtonProps) {
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="relative group cursor-pointer p-2 rounded-lg hover:bg-white/10 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
    >
      {isLoading ? (
        <Loader2 size={18} className="text-blue-400 animate-spin" />
      ) : (
        <Send size={20} className="text-white/60 hover:text-white" />
      )}

      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {isLoading ? 'Sending...' : 'Send'}
      </div>
    </button>
  );
}
