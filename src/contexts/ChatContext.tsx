'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Conversation, Message, Profile } from '@/types/chat';
import { createClient } from '@/lib/supabase-client';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  profile: Profile | null;
  user: any | null;
  isLoading: boolean;
  setActiveConversation: (conversation: Conversation | null) => void;
  refreshConversations: () => Promise<void>;
  refreshMessages: (conversationId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUser: () => Promise<void>;
  createNewConversation: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  updateConversationTitle: (conversationId: string, newTitle: string) => void;
  addNewConversation: (conversation: Conversation) => void;
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
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const pathname = window.location.pathname;
    const chatIdMatch = pathname.match(/^\/chat\/(.+)$/);
    
    if (chatIdMatch && chatIdMatch[1] && conversations.length > 0) {
      const chatId = chatIdMatch[1];
      const conversation = conversations.find(conv => conv.id === chatId);
      
      // Only set active conversation if:
      // 1. We found a conversation with the URL ID
      // 2. It's different from the current active conversation
      // 3. We don't already have an active conversation with the same ID (to prevent switching during title updates)
      if (conversation && (!activeConversation || activeConversation.id !== conversation.id)) {
        setActiveConversation(conversation);
      }
    }
  }, [conversations, activeConversation]);

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
        
        setMessages(prev => {
          // Keep only optimistic messages for this conversation that are still relevant
          const optimisticMessages = prev.filter(msg => 
            msg.isOptimistic && 
            msg.conversation_id === conversationId
          );
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
        const createResponse = await fetch('/api/profile/create', {
          method: 'POST',
        });
        if (createResponse.ok) {
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

  const refreshUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        setUser(user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
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

  const updateConversationTitle = (conversationId: string, newTitle: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, title: newTitle }
        : conv
    ));
    
    // Also update active conversation if it's the one being updated
    if (activeConversation?.id === conversationId) {
      setActiveConversation(prev => prev ? { ...prev, title: newTitle } : null);
    }
  };

  const addNewConversation = (conversation: Conversation) => {
    setConversations(prev => [conversation, ...prev]);
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([
        refreshConversations(),
        refreshProfile(),
        refreshUser(),
      ]);
      setIsLoading(false);
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      setMessages(prev => prev.filter(msg => 
        msg.isOptimistic && msg.conversation_id === activeConversation.id
      ));
      refreshMessages(activeConversation.id);
    } else {
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
        user,
        isLoading,
        setActiveConversation,
        refreshConversations,
        refreshMessages,
        refreshProfile,
        refreshUser,
        createNewConversation,
        deleteConversation,
        updateConversationTitle,
        addNewConversation,
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