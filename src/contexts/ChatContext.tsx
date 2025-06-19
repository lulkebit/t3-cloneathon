'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
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
  renameConversation: (
    conversationId: string,
    newTitle: string
  ) => Promise<boolean>;
  addNewConversation: (conversation: Conversation) => void;
  addOptimisticMessage: (message: Omit<Message, 'id' | 'created_at'>) => string;
  updateStreamingMessage: (messageId: string, content: string) => void;
  finalizeMessage: (messageId: string, finalContent: string) => void;
  removeOptimisticMessage: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newConversationIds, setNewConversationIds] = useState<Set<string>>(
    new Set()
  );

  // Track pending operations to prevent race conditions
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(
    new Set()
  );
  const refreshTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const chatIdMatch = pathname.match(/^\/chat\/(.+)$/);

      if (chatIdMatch && chatIdMatch[1] && conversations.length > 0) {
        const chatId = chatIdMatch[1];
        const conversation = conversations.find((conv) => conv.id === chatId);
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
      const conversation = conversations.find((conv) => conv.id === chatId);

      // Only set active conversation if:
      // 1. We found a conversation with the URL ID
      // 2. It's different from the current active conversation
      // 3. We don't already have an active conversation with the same ID (to prevent switching during title updates)
      if (
        conversation &&
        (!activeConversation || activeConversation.id !== conversation.id)
      ) {
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

  const refreshMessages = useCallback(
    async (conversationId: string, force = false) => {
      // Prevent multiple concurrent refreshes for the same conversation
      const operationKey = `refresh-${conversationId}`;
      if (pendingOperations.has(operationKey) && !force) {
        return;
      }

      // Additional safety: don't refresh if we just refreshed recently (unless forced)
      const lastRefreshKey = `lastRefresh-${conversationId}`;
      const now = Date.now();
      const lastRefresh = refreshTimeouts.current.get(lastRefreshKey);
      if (!force && lastRefresh && now - Number(lastRefresh) < 1000) {
        return; // Don't refresh if we refreshed less than 1 second ago
      }

      try {
        setPendingOperations((prev) => new Set([...prev, operationKey]));
        refreshTimeouts.current.set(lastRefreshKey, now as any);

        const response = await fetch(
          `/api/conversations/${conversationId}/messages`
        );

        if (response.ok) {
          const data = await response.json();
          const serverMessages = data.messages || [];

          setMessages((prev) => {
            // Check if we have any active optimistic messages for this conversation
            const activeOptimisticMessages = prev.filter(
              (msg) =>
                msg.isOptimistic &&
                msg.conversation_id === conversationId &&
                (msg.isStreaming || msg.isLoading)
            );

            // If we have active optimistic messages and this isn't a forced refresh, preserve them
            if (activeOptimisticMessages.length > 0 && !force) {
              return prev; // Don't update, keep optimistic messages
            }

            // Only update if the server messages are actually different
            const existingMessages = prev.filter(
              (msg) => msg.conversation_id === conversationId
            );
            const hasChanges =
              serverMessages.length !== existingMessages.length ||
              serverMessages.some((serverMsg: any, index: number) => {
                const existingMsg = existingMessages[index];
                return (
                  !existingMsg ||
                  existingMsg.id !== serverMsg.id ||
                  existingMsg.content !== serverMsg.content
                );
              });

            if (!hasChanges && !force) {
              return prev; // No changes, don't update
            }

            // Safe to replace with server messages
            return [
              ...prev.filter((msg) => msg.conversation_id !== conversationId),
              ...serverMessages,
            ];
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setPendingOperations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(operationKey);
          return newSet;
        });
      }
    },
    [pendingOperations]
  );

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
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
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

  const addOptimisticMessage = (
    message: Omit<Message, 'id' | 'created_at'>
  ): string => {
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    const optimisticMessage: Message = {
      ...message,
      id: optimisticId,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    return optimisticId;
  };

  const updateStreamingMessage = (messageId: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, content, isStreaming: true, isLoading: false }
          : msg
      )
    );
  };

  const finalizeMessage = (messageId: string, finalContent: string) => {
    setMessages((prev) => {
      const messageToFinalize = prev.find((msg) => msg.id === messageId);
      const conversationId = messageToFinalize?.conversation_id;

      const updatedMessages = prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content: finalContent,
              isOptimistic: false,
              isStreaming: false,
              isLoading: false,
            }
          : msg
      );

      // Schedule a server refresh after all optimistic operations are complete
      if (conversationId && messageToFinalize?.isOptimistic) {
        // Clear any existing timeout for this conversation
        const existingTimeout = refreshTimeouts.current.get(conversationId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Check if this was the last active optimistic message for this conversation
        const remainingActiveOptimistic = updatedMessages.filter(
          (msg) =>
            msg.isOptimistic &&
            msg.conversation_id === conversationId &&
            (msg.isStreaming || msg.isLoading)
        );

        // Only schedule a refresh if this was actually the last optimistic message
        // and we're not in a new conversation
        if (remainingActiveOptimistic.length === 0) {
          // Remove from new conversations set to allow future refreshes
          setNewConversationIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(conversationId);
            return newSet;
          });

          // Only schedule refresh for conversations that might need server sync
          // Skip if we just finalized a user message (no need to refresh for user messages)
          if (messageToFinalize.role === 'assistant') {
            const timeout = setTimeout(() => {
              refreshMessages(conversationId, true);
              refreshTimeouts.current.delete(conversationId);
            }, 1000); // Reduced back to 1 second since we're more selective

            refreshTimeouts.current.set(conversationId, timeout);
          }
        }
      }

      return updatedMessages;
    });
  };

  const removeOptimisticMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const updateConversationTitle = (
    conversationId: string,
    newTitle: string
  ) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, title: newTitle } : conv
      )
    );

    // Also update active conversation if it's the one being updated
    if (activeConversation?.id === conversationId) {
      setActiveConversation((prev) =>
        prev ? { ...prev, title: newTitle } : null
      );
    }
  };

  const renameConversation = async (
    conversationId: string,
    newTitle: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/conversations?id=${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state with the updated conversation
        updateConversationTitle(conversationId, data.conversation.title);
        return true;
      } else {
        console.error('Failed to rename conversation:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error renaming conversation:', error);
      return false;
    }
  };

  const addNewConversation = (conversation: Conversation) => {
    setConversations((prev) => [conversation, ...prev]);
    // Mark this as a new conversation to prevent immediate refreshMessages
    setNewConversationIds((prev) => new Set([...prev, conversation.id]));
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
      // Don't refresh messages for new conversations - they rely on optimistic messages
      if (!newConversationIds.has(activeConversation.id)) {
        // This is an existing conversation - refresh messages from server
        refreshMessages(activeConversation.id);
      }
    } else {
      // Clear messages when no conversation is selected
      setMessages([]);
    }
  }, [activeConversation, refreshMessages, newConversationIds]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      refreshTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      refreshTimeouts.current.clear();
    };
  }, []);

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
        renameConversation,
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
