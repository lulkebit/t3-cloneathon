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
  addOptimisticMessage: (message: Omit<Message, 'id' | 'created_at'>) => string;
  updateStreamingMessage: (messageId: string, content: string) => void;
  finalizeMessage: (messageId: string, finalContent: string) => void;
  removeOptimisticMessage: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle URL changes for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const chatIdMatch = pathname.match(/^\/chat\/(.+)$/);
      
      if (chatIdMatch && chatIdMatch[1] && conversations.length > 0) {
        const chatId = chatIdMatch[1];
        const conversation = conversations.find(conv => conv.id === chatId);
        if (conversation && conversation.id !== activeConversation?.id) {
          setActiveConversation(conversation);
        }
      } else if (pathname === '/chat' && activeConversation) {
        setActiveConversation(null);
        setMessages([]);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [conversations, activeConversation]);

  // Überwache URL-Änderungen auch bei Conversation-Updates
  useEffect(() => {
    const pathname = window.location.pathname;
    const chatIdMatch = pathname.match(/^\/chat\/(.+)$/);
    
    if (chatIdMatch && chatIdMatch[1] && conversations.length > 0) {
      const chatId = chatIdMatch[1];
      const conversation = conversations.find(conv => conv.id === chatId);
      if (conversation && conversation.id !== activeConversation?.id) {
        setActiveConversation(conversation);
      }
    }
  }, [conversations]);

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
        const serverMessages = data.messages || [];
        
        // Behalte nur optimistische Nachrichten, die noch nicht durch Server-Nachrichten ersetzt wurden
        setMessages(prev => {
          const optimisticMessages = prev.filter(msg => msg.isOptimistic);
          return [...serverMessages, ...optimisticMessages];
        });
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

  // Neue Funktionen für optimistic updates
  const addOptimisticMessage = (message: Omit<Message, 'id' | 'created_at'>): string => {
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    const optimisticMessage: Message = {
      ...message,
      id: optimisticId,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    return optimisticId;
  };

  const updateStreamingMessage = (messageId: string, content: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content, isStreaming: true, isLoading: false }
        : msg
    ));
  };

  const finalizeMessage = (messageId: string, finalContent: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: finalContent, isOptimistic: false, isStreaming: false, isLoading: false }
        : msg
    ));
  };

  const removeOptimisticMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
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
      // Behalte optimistische Nachrichten für die aktuelle Conversation, lösche alle anderen
      setMessages(prev => prev.filter(msg => 
        msg.isOptimistic && msg.conversation_id === activeConversation.id
      ));
      refreshMessages(activeConversation.id);
    } else {
      // Leere Messages wenn kein Chat aktiv ist
      setMessages([]);
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
        addOptimisticMessage,
        updateStreamingMessage,
        finalizeMessage,
        removeOptimisticMessage,
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