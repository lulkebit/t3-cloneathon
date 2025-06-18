'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Conversation, Message, Profile, Folder } from '@/types/chat'; // Added Folder
import { createClient } from '@/lib/supabase-client';

interface ChatContextType {
  conversations: Conversation[];
  folders: Folder[];
  activeConversation: Conversation | null;
  messages: Message[];
  profile: Profile | null;
  user: any | null;
  isLoading: boolean;
  showArchived: boolean; // New state
  setActiveConversation: (conversation: Conversation | null) => void;
  refreshConversations: (includeArchived?: boolean) => Promise<void>; // Modified
  refreshMessages: (conversationId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUser: () => Promise<void>;
  createNewConversation: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  updateConversationTitle: (conversationId: string, newTitle: string) => void;
  addNewConversation: (conversation: Conversation) => void;
  // Folder methods
  refreshFolders: () => Promise<void>;
  createFolder: (name: string) => Promise<Folder | null>;
  updateFolder: (folderId: string, name: string) => Promise<Folder | null>;
  deleteFolder: (folderId: string) => Promise<void>;
  moveConversationToFolder: (conversationId: string, folderId: string | null) => Promise<void>;
  // Pin and Archive methods
  togglePinConversation: (conversationId: string) => Promise<void>;
  toggleArchiveConversation: (conversationId: string) => Promise<void>;
  toggleShowArchived: () => void; // New function
  // Message methods
  addOptimisticMessage: (message: Omit<Message, 'id' | 'created_at'>) => string;
  updateStreamingMessage: (messageId: string, content: string) => void;
  finalizeMessage: (messageId: string, finalContent: string) => void;
  removeOptimisticMessage: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]); // Added folders state
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newConversationIds, setNewConversationIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false); // New state for showing archived


  // Pin and Archive Functions
  const togglePinConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/pin`, { method: 'PUT' });
      if (response.ok) {
        const updatedConversation = await response.json();
        setConversations(prev =>
          prev.map(c => c.id === conversationId ? updatedConversation : c)
              .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        );
        if (activeConversation?.id === conversationId) {
            setActiveConversation(prev => prev ? { ...prev, is_pinned: updatedConversation.is_pinned } : null);
        }
      } else {
        console.error('Failed to toggle pin status');
      }
    } catch (error) {
      console.error('Error toggling pin status:', error);
    }
  };

  const toggleArchiveConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/archive`, { method: 'PUT' });
      if (response.ok) {
        // Refresh conversations to reflect change in archived status (it might disappear from list)
        await refreshConversations(showArchived);
        if (activeConversation?.id === conversationId) {
            // If active conversation is archived, clear it or handle as needed
            setActiveConversation(null);
            setMessages([]);
        }
      } else {
        console.error('Failed to toggle archive status');
      }
    } catch (error) {
      console.error('Error toggling archive status:', error);
    }
  };

  const toggleShowArchived = () => {
    setShowArchived(prev => {
      const newShowArchived = !prev;
      refreshConversations(newShowArchived); // Refresh conversations with new archive filter
      return newShowArchived;
    });
  };

  // Folder Management Functions
  const refreshFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      if (response.ok) {
        const data = await response.json();
        setFolders(data || []);
      } else {
        console.error('Failed to fetch folders:', response.statusText);
        setFolders([]);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
      setFolders([]);
    }
  };

  const createFolder = async (name: string): Promise<Folder | null> => {
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        const newFolder = await response.json();
        await refreshFolders(); // Refresh folder list
        return newFolder;
      } else {
        // Handle error (e.g., display to user)
        const errorData = await response.json();
        console.error('Failed to create folder:', errorData.error || response.statusText);
        alert(`Error creating folder: ${errorData.error || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      alert(`Error creating folder: ${error instanceof Error ? error.message : 'Network error'}`);
      return null;
    }
  };

  const updateFolder = async (folderId: string, name: string): Promise<Folder | null> => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        const updatedFolder = await response.json();
        await refreshFolders();
        return updatedFolder;
      } else {
        const errorData = await response.json();
        console.error('Failed to update folder:', errorData.error || response.statusText);
        alert(`Error updating folder: ${errorData.error || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      console.error('Error updating folder:', error);
      alert(`Error updating folder: ${error instanceof Error ? error.message : 'Network error'}`);
      return null;
    }
  };

  const deleteFolder = async (folderId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this folder? Conversations in it will not be deleted but will be unassigned.')) {
      return;
    }
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await refreshFolders();
        // Also refresh conversations as their folder_id might have been set to null
        await refreshConversations();
      } else {
        const errorData = await response.json();
        console.error('Failed to delete folder:', errorData.error || response.statusText);
        alert(`Error deleting folder: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert(`Error deleting folder: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };

  const moveConversationToFolder = async (conversationId: string, folderId: string | null): Promise<void> => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/folder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId }),
      });
      if (response.ok) {
        // Optimistically update conversation in local state or refresh
        setConversations(prev =>
          prev.map(c => c.id === conversationId ? { ...c, folder_id: folderId } : c)
        );
        if (activeConversation?.id === conversationId) {
            setActiveConversation(prev => prev ? { ...prev, folder_id: folderId } : null);
        }
        // No need to refresh all conversations if only one changed, unless backend logic is complex
      } else {
        const errorData = await response.json();
        console.error('Failed to move conversation:', errorData.error || response.statusText);
        alert(`Error moving conversation: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error moving conversation:', error);
      alert(`Error moving conversation: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };


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
      
      if (conversation && (!activeConversation || activeConversation.id !== conversation.id)) {
        setActiveConversation(conversation);
      }
    }
  }, [conversations, activeConversation]); // Removed location.pathname dependency to avoid potential issues with Next.js router if not needed

  const refreshConversations = async (includeArchived: boolean = showArchived) => {
    try {
      const url = includeArchived ? '/api/conversations?archived=true' : '/api/conversations';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Sort conversations: pinned first, then by updated_at
        const sortedConversations = (data.conversations || []).sort(
          (a: Conversation, b: Conversation) =>
            (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) ||
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setConversations(sortedConversations);
      } else {
        console.error('Failed to fetch conversations:', response.statusText);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    }
  };

  const refreshMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const serverMessages = data.messages || [];
        
        setMessages(prev => {
          // Keep only optimistic messages for this conversation that are actively streaming/loading
          const activeOptimisticMessages = prev.filter(msg => 
            msg.isOptimistic && 
            msg.conversation_id === conversationId &&
            (msg.isStreaming || msg.isLoading)
          );
          return [...serverMessages, ...activeOptimisticMessages];
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
    setNewConversationIds(prev => new Set([...prev, conversation.id]));
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([
        refreshConversations(showArchived), // Pass current showArchived state
        refreshProfile(),
        refreshUser(),
        refreshFolders(),
      ]);
      setIsLoading(false);
    };

    initializeData();
  }, [showArchived]); // Re-initialize if showArchived changes

  useEffect(() => {
    if (activeConversation) {
      // Check if this is a new conversation that shouldn't be refreshed yet
      if (newConversationIds.has(activeConversation.id)) {
        // For new conversations, just filter messages but don't refresh
        setMessages(prev => prev.filter(msg => 
          msg.conversation_id === activeConversation.id
        ));
        // Remove from new conversations set
        setNewConversationIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(activeConversation.id);
          return newSet;
        });
        return;
      }
      
      // For existing conversations, refresh normally
      setMessages(prev => prev.filter(msg => 
        msg.isOptimistic && msg.conversation_id === activeConversation.id
      ));
      refreshMessages(activeConversation.id);
    } else {
      setMessages([]);
    }
  }, [activeConversation]); // Don't include messages as dependency to avoid loops

  return (
    <ChatContext.Provider
      value={{
        conversations,
        folders,
        activeConversation,
        messages,
        profile,
        user,
        isLoading,
        showArchived, // Added
        setActiveConversation,
        refreshConversations, // Modified
        refreshMessages,
        refreshProfile,
        refreshUser,
        createNewConversation,
        deleteConversation,
        updateConversationTitle,
        addNewConversation,
        // Folder methods
        refreshFolders,
        createFolder,
        updateFolder,
        deleteFolder,
        moveConversationToFolder,
        // Pin and Archive methods
        togglePinConversation,
        toggleArchiveConversation,
        toggleShowArchived,
        // Message methods
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