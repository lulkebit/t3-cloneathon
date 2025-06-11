'use client';

import React, { useState, useEffect } from 'react';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import { SettingsModal } from '@/components/SettingsModal';
import { AlertCircle, Key } from 'lucide-react';

function ChatPageContent() {
  const { profile, isLoading } = useChat();
  const [showSettings, setShowSettings] = useState(false);

  // Show settings automatically if no API key is configured
  useEffect(() => {
    if (!isLoading && profile && !profile.openrouter_api_key) {
      setShowSettings(true);
    }
  }, [profile, isLoading]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading chat...</div>
      </div>
    );
  }

  // Show setup prompt if no API key
  if (!profile?.openrouter_api_key) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Key size={48} className="mx-auto mb-4 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to AI Chat</h1>
            <p className="text-gray-600 mb-6">
              To get started, you'll need to configure your OpenRouter API key. This allows you to chat with various AI models.
            </p>
            <button
              onClick={() => setShowSettings(true)}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Configure API Key
            </button>
          </div>
        </div>
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <ChatSidebar onSettingsClick={() => setShowSettings(true)} />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <ChatMessages />
        
        {/* Input */}
        <ChatInput />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
} 