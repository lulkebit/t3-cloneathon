'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export function ChatEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 glass-strong rounded-3xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
          <img
            src="/ai.png"
            alt="AI Assistant"
            className="w-14 h-14 object-contain relative z-10"
          />
        </div>

        <h3 className="text-2xl font-bold text-white mb-4">
          Welcome to Convex Chat
        </h3>

        <p className="text-white/60 leading-relaxed">
          Start a new conversation to chat with various AI models through
          OpenRouter. Choose your preferred model and begin chatting!
        </p>

        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-white/40">
          <Sparkles size={16} />
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
