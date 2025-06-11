'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Conversation, Message, Profile } from '@/types/chat';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  profile: Profile | null;
  isLoading: boolean;
  setActiveConversation: (conversation: Conversation | null) => void;
  refreshConversations: () => Promise<void>;
  refreshMessages: (conversationId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  createNewConversation: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const refreshMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      } else if (response.status === 404 || response.status === 500) {
        // Profile might not exist, try to create it
        console.log('Profile not found, attempting to create...');
        const createResponse = await fetch('/api/profile/create', {
          method: 'POST',
        });
        if (createResponse.ok) {
          // Retry fetching the profile
          const retryResponse = await fetch('/api/profile');
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            setProfile(retryData.profile);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const createNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations?id=${conversationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await refreshConversations();
        if (activeConversation?.id === conversationId) {
          createNewConversation();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([
        refreshConversations(),
        refreshProfile(),
      ]);
      setIsLoading(false);
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      refreshMessages(activeConversation.id);
    }
  }, [activeConversation]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        profile,
        isLoading,
        setActiveConversation,
        refreshConversations,
        refreshMessages,
        refreshProfile,
        createNewConversation,
        deleteConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 