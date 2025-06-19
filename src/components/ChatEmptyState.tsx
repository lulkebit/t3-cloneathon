'use client';

import React from 'react';
import {
  Sparkles,
  FileText,
  Languages,
  Code,
  MessageSquare,
  Lightbulb,
  PenTool,
} from 'lucide-react';

interface QuickAction {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  prompt: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'summarize',
    icon: FileText,
    title: 'Summarize',
    description: 'Summarize text or documents',
    prompt:
      'Please summarize the following text/document and highlight the key points:',
  },
  {
    id: 'translate',
    icon: Languages,
    title: 'Translate',
    description: 'Translate text between languages',
    prompt:
      'Please translate the following text (automatically detect the source language and ask for target language if needed):',
  },
  {
    id: 'code-review',
    icon: Code,
    title: 'Code Review',
    description: 'Analyze and improve code',
    prompt:
      'Please conduct a code review for the following code. Analyze structure, performance, security and best practices:',
  },
  {
    id: 'explain',
    icon: Lightbulb,
    title: 'Explain',
    description: 'Explain complex topics simply',
    prompt:
      'Please explain the following topic/concept in a clear and structured way:',
  },
  {
    id: 'improve-writing',
    icon: PenTool,
    title: 'Improve Writing',
    description: 'Correct and improve text style',
    prompt:
      'Please improve the following text in terms of grammar, style and clarity:',
  },
  {
    id: 'brainstorm',
    icon: MessageSquare,
    title: 'Brainstorm',
    description: 'Develop and structure ideas',
    prompt: "Let's brainstorm and structure ideas about the following topic:",
  },
];

interface ChatEmptyStateProps {
  onQuickAction?: (prompt: string) => void;
}

export function ChatEmptyState({ onQuickAction }: ChatEmptyStateProps) {
  const handleQuickAction = (action: QuickAction) => {
    if (onQuickAction) {
      onQuickAction(action.prompt);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-4xl w-full">
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

        <p className="text-white/60 leading-relaxed mb-8">
          Start a new conversation to chat with various AI models through
          OpenRouter. Choose your preferred model and begin chatting!
        </p>

        {/* Quick Actions */}
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="cursor-pointer group p-3 glass-subtle hover:glass-strong rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-200 flex-shrink-0">
                    <action.icon size={16} className="text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm text-white group-hover:text-white/90 transition-colors duration-200">
                      {action.title}
                    </h5>
                    <p className="text-xs text-white/60 group-hover:text-white/70 transition-colors duration-200 mt-0.5 line-clamp-2">
                      {action.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-white/40">
          <Sparkles size={16} />
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
