'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

import { useChat } from '@/contexts/ChatContext';
import { Send, Bot, Loader2, ChevronDown, Check, Brain, Search, X, Paperclip, FileImage, FileText, Trash2, AlertCircle, Users, Type } from 'lucide-react';
import { getPopularModels } from '@/lib/openrouter';
import { Attachment, ConsensusResponse } from '@/types/chat';
import { MultiModelSelector } from './MultiModelSelector';
import { 
  getModelCapabilities, 
  canModelProcessFileType, 
  getFileUploadAcceptString, 
  getMaxFileSizeForModel,
  getModelCapabilityDescription 
} from '@/lib/model-capabilities';

export function ChatInput() {
  const {
    activeConversation,
    refreshConversations,
    refreshMessages,
    setActiveConversation,
    updateConversationTitle,
    addNewConversation,
    addOptimisticMessage,
    updateStreamingMessage,
    finalizeMessage,
    removeOptimisticMessage,
  } = useChat();

  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(() => {
    // Initialize with last used model from localStorage, fallback to 'openai/o3'
    if (typeof window !== 'undefined') {
      const lastUsedModel = localStorage.getItem('lastUsedModel');
      return lastUsedModel || 'openai/o3-mini';
    }
    return 'openai/o3-mini';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isConsensusMode, setIsConsensusMode] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isMultiModelSelectorOpen, setIsMultiModelSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeConversation && activeConversation.model) {
      // Check if this is a consensus conversation
      if (activeConversation.model.startsWith('consensus:')) {
        setIsConsensusMode(true);
        // Extract the models from the consensus string
        const modelsString = activeConversation.model.replace('consensus:', '');
        const models = modelsString ? modelsString.split(',') : [];
        setSelectedModels(models);
      } else {
        setIsConsensusMode(false);
        setSelectedModel(activeConversation.model);
      }
    } else {
      // Reset to defaults for new conversations
      setIsConsensusMode(false);
      // Load last used model from localStorage for new conversations
      const lastUsedModel = localStorage.getItem('lastUsedModel');
      setSelectedModel(lastUsedModel || 'openai/o3-mini');
      
      // Load last used consensus models from localStorage
      const lastUsedConsensusModels = localStorage.getItem('lastUsedConsensusModels');
      if (lastUsedConsensusModels) {
        try {
          const models = JSON.parse(lastUsedConsensusModels);
          if (Array.isArray(models) && models.length > 0) {
            setSelectedModels(models);
          } else {
            setSelectedModels([]);
          }
        } catch {
          setSelectedModels([]);
        }
      } else {
        setSelectedModels([]);
      }
    }
  }, [activeConversation]);

  // Clear incompatible attachments when model changes
  useEffect(() => {
    if (attachments.length > 0) {
      const compatibleAttachments = attachments.filter(attachment => 
        canModelProcessFileType(selectedModel, attachment.file_type)
      );
      
      if (compatibleAttachments.length !== attachments.length) {
        setAttachments(compatibleAttachments);
        if (compatibleAttachments.length === 0) {
          alert(`Attachments removed: ${selectedModel} doesn't support the uploaded file types.`);
        } else {
          alert(`Some attachments removed: ${selectedModel} doesn't support all uploaded file types.`);
        }
      }
    }
  }, [selectedModel, attachments]);

  // Save selected consensus models to localStorage when they change
  useEffect(() => {
    if (selectedModels.length > 0 && !activeConversation) {
      localStorage.setItem('lastUsedConsensusModels', JSON.stringify(selectedModels));
    }
  }, [selectedModels, activeConversation]);

  // Save selected model to localStorage when it changes
  useEffect(() => {
    if (selectedModel && !activeConversation) {
      localStorage.setItem('lastUsedModel', selectedModel);
    }
  }, [selectedModel, activeConversation]);

  const popularModels = getPopularModels();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && attachments.length === 0) || isLoading) return;

    const userMessage = message;
    const messageAttachments = [...attachments];
    setMessage('');
    setIsLoading(true);
    setStreamingMessage('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    let conversationId: string | null = null;
    let userMessageId: string | undefined;
    let assistantMessageId: string | undefined;
    
    try {
      if (activeConversation) {
        conversationId = activeConversation.id;
        
        userMessageId = addOptimisticMessage({
          conversation_id: conversationId!,
          role: 'user',
          content: userMessage,
          attachments: messageAttachments,
        });

        assistantMessageId = addOptimisticMessage({
          conversation_id: conversationId!,
          role: 'assistant',
          content: '',
          isLoading: true,
        });
      } else {
        const createConversationResponse = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'New Chat',
            model: selectedModel,
          }),
        });

        if (!createConversationResponse.ok) {
          throw new Error('Failed to create conversation');
        }

        const conversationData = await createConversationResponse.json();
        conversationId = conversationData.conversation.id;
        
        // Add the new conversation to the list without triggering a full refresh
        addNewConversation(conversationData.conversation);
        
        window.history.pushState(null, '', `/chat/${conversationId}`);
        
        userMessageId = addOptimisticMessage({
          conversation_id: conversationId!,
          role: 'user',
          content: userMessage,
          attachments: messageAttachments,
        });

        assistantMessageId = addOptimisticMessage({
          conversation_id: conversationId!,
          role: 'assistant',
          content: '',
          isLoading: true,
        });
      }
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          model: selectedModel,
          conversationId: conversationId,
          attachments: messageAttachments,
        }),
      });

      if (!response.ok) {
        if (userMessageId) removeOptimisticMessage(userMessageId);
        if (assistantMessageId) removeOptimisticMessage(assistantMessageId);
        throw new Error('Failed to send message');
      }

      if (!response.body) {
        if (userMessageId) removeOptimisticMessage(userMessageId);
        if (assistantMessageId) removeOptimisticMessage(assistantMessageId);
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk && assistantMessageId) {
                assistantContent += parsed.chunk;
                updateStreamingMessage(assistantMessageId, assistantContent);
              } else if (parsed.error && assistantMessageId) {
                // Handle error from API - show error message in chat
                const errorContent = parsed.errorContent || `❌ **Error**: ${parsed.error}`;
                finalizeMessage(assistantMessageId, errorContent);
                
                (async () => {
                  try {
                    // Remove optimistic messages first to prevent duplicates
                    if (userMessageId) {
                      removeOptimisticMessage(userMessageId);
                    }
                    if (assistantMessageId) {
                      removeOptimisticMessage(assistantMessageId);
                    }
                    
                    // Then refresh messages from server
                    if (conversationId) {
                      await refreshMessages(conversationId);
                    }
                  } catch (error) {
                    console.error('Error refreshing messages after error:', error);
                  }
                })();
              } else if (parsed.titleUpdate && parsed.conversationId && parsed.title) {
                // Handle title update - update conversation title without switching chats
                updateConversationTitle(parsed.conversationId, parsed.title);
              } else if (parsed.done && assistantMessageId) {
                finalizeMessage(assistantMessageId, assistantContent);
                
                (async () => {
                  try {
                    // Remove optimistic messages first to prevent duplicates
                    if (userMessageId) {
                      removeOptimisticMessage(userMessageId);
                    }
                    if (assistantMessageId) {
                      removeOptimisticMessage(assistantMessageId);
                    }
                    
                    // Then refresh messages from server
                    if (conversationId) {
                      await refreshMessages(conversationId);
                    }
                  } catch (error) {
                    console.error('Error refreshing messages after streaming:', error);
                  }
                })();
              }
            } catch (e) {
              console.error('Error parsing streaming data:', e, 'Data:', data);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message in chat if we have an assistant message to update
      if (assistantMessageId) {
        let errorMessage = 'An unexpected error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        finalizeMessage(assistantMessageId, `❌ **Error**: ${errorMessage}`);
        
        // Try to save error to database
        if (conversationId) {
          try {
            await fetch(`/api/conversations/${conversationId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                role: 'assistant',
                content: `❌ **Error**: ${errorMessage}`,
              }),
            });
          } catch (dbError) {
            console.error('Failed to save error message to database:', dbError);
          }
        }
      } else {
        // If no assistant message, remove user message and show alert
        if (userMessageId) {
          removeOptimisticMessage(userMessageId);
        }
        
        let errorMessage = 'Failed to send message';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        alert(`Error: ${errorMessage}`);
      }
      
      if (assistantMessageId && !conversationId) {
        removeOptimisticMessage(assistantMessageId);
      }
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
      setAttachments([]);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  };

  const handleConsensusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && attachments.length === 0) || isLoading || selectedModels.length === 0) return;

    const userMessage = message;
    const messageAttachments = [...attachments];
    setMessage('');
    setIsLoading(true);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    let conversationId: string | null = null;
    let userMessageId: string | undefined;
    let assistantMessageId: string | undefined;
    
    try {
      if (activeConversation) {
        conversationId = activeConversation.id;
        
        userMessageId = addOptimisticMessage({
          conversation_id: conversationId!,
          role: 'user',
          content: userMessage,
          attachments: messageAttachments,
        });

        assistantMessageId = addOptimisticMessage({
          conversation_id: conversationId!,
          role: 'assistant',
          content: '',
          isLoading: true,
          isConsensus: true,
          consensusResponses: selectedModels.map(model => ({
            model,
            content: '',
            isLoading: true,
            responseTime: 0,
          })),
        });
      } else {
        const createConversationResponse = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'New Chat',
            model: `consensus:${selectedModels.join(',')}`,
          }),
        });

        if (!createConversationResponse.ok) {
          throw new Error('Failed to create conversation');
        }

        const conversationData = await createConversationResponse.json();
        conversationId = conversationData.conversation.id;
        
        // Add the new conversation to the list without triggering a full refresh
        addNewConversation(conversationData.conversation);
        
        window.history.pushState(null, '', `/chat/${conversationId}`);
        
        userMessageId = addOptimisticMessage({
          conversation_id: conversationId!,
          role: 'user',
          content: userMessage,
          attachments: messageAttachments,
        });

        assistantMessageId = addOptimisticMessage({
          conversation_id: conversationId!,
          role: 'assistant',
          content: '',
          isLoading: true,
          isConsensus: true,
          consensusResponses: selectedModels.map(model => ({
            model,
            content: '',
            isLoading: true,
            responseTime: 0,
          })),
        });
      }

      const response = await fetch('/api/chat/consensus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          models: selectedModels,
          conversationId: conversationId,
          attachments: messageAttachments,
        }),
      });

      if (!response.ok) {
        if (userMessageId) removeOptimisticMessage(userMessageId);
        if (assistantMessageId) removeOptimisticMessage(assistantMessageId);
        throw new Error('Failed to send consensus message');
      }

      if (!response.body) {
        if (userMessageId) removeOptimisticMessage(userMessageId);
        if (assistantMessageId) removeOptimisticMessage(assistantMessageId);
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let consensusResponses: ConsensusResponse[] = selectedModels.map(model => ({
        model,
        content: '',
        isLoading: true,
        responseTime: 0,
      }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'consensus_update' && assistantMessageId) {
                const { modelIndex, content } = parsed;
                if (modelIndex < consensusResponses.length) {
                  consensusResponses[modelIndex] = {
                    ...consensusResponses[modelIndex],
                    content,
                    isStreaming: true,
                    isLoading: false,
                  };
                  
                  updateStreamingMessage(assistantMessageId, JSON.stringify(consensusResponses));
                }
              } else if (parsed.type === 'consensus_complete' && assistantMessageId) {
                const { modelIndex, content, responseTime } = parsed;
                if (modelIndex < consensusResponses.length) {
                  consensusResponses[modelIndex] = {
                    ...consensusResponses[modelIndex],
                    content,
                    isStreaming: false,
                    isLoading: false,
                    responseTime,
                  };
                  
                  updateStreamingMessage(assistantMessageId, JSON.stringify(consensusResponses));
                }
              } else if (parsed.type === 'consensus_error' && assistantMessageId) {
                const { modelIndex, error, responseTime } = parsed;
                if (modelIndex < consensusResponses.length) {
                  consensusResponses[modelIndex] = {
                    ...consensusResponses[modelIndex],
                    error,
                    isLoading: false,
                    isStreaming: false,
                    responseTime,
                  };
                  
                  updateStreamingMessage(assistantMessageId, JSON.stringify(consensusResponses));
                }
              } else if (parsed.type === 'title_update' && parsed.conversationId && parsed.title) {
                // Handle title update for consensus - update conversation title without switching chats
                updateConversationTitle(parsed.conversationId, parsed.title);
              } else if (parsed.type === 'consensus_final' && assistantMessageId) {
                finalizeMessage(assistantMessageId, JSON.stringify(parsed.responses));
                
                (async () => {
                  try {
                    // Remove optimistic messages first to prevent duplicates
                    if (userMessageId) {
                      removeOptimisticMessage(userMessageId);
                    }
                    if (assistantMessageId) {
                      removeOptimisticMessage(assistantMessageId);
                    }
                    
                    // Then refresh messages from server
                    if (conversationId) {
                      await refreshMessages(conversationId);
                    }
                  } catch (error) {
                    console.error('Error refreshing messages after consensus:', error);
                  }
                })();
              }
            } catch (e) {
              console.error('Error parsing consensus streaming data:', e, 'Data:', data);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending consensus message:', error);
      
      if (assistantMessageId) {
        let errorMessage = 'An unexpected error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        finalizeMessage(assistantMessageId, `❌ **Error**: ${errorMessage}`);
      } else {
        if (userMessageId) {
          removeOptimisticMessage(userMessageId);
        }
        
        let errorMessage = 'Failed to send consensus message';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        alert(`Error: ${errorMessage}`);
      }
      
      if (assistantMessageId && !conversationId) {
        removeOptimisticMessage(assistantMessageId);
      }
    } finally {
      setIsLoading(false);
      setAttachments([]);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const modelCapabilities = getModelCapabilities(selectedModel);
    const maxFileSize = getMaxFileSizeForModel(selectedModel) * 1024 * 1024; // Convert MB to bytes

    // Validate files before uploading
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      // Check if model supports this file type
      if (!canModelProcessFileType(selectedModel, file.type)) {
        errors.push(`${file.name}: File type not supported by ${selectedModel}`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (max ${getMaxFileSizeForModel(selectedModel)}MB)`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(`Upload errors:\n${errors.join('\n')}`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('model', selectedModel);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload file');
        }

        return await response.json();
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProviderLogo = (provider: string) => {
    const providerLogos: Record<string, string> = {
      'anthropic': '/logos/anthropic.svg',
      'openai': '/logos/openai.svg',
      'google': '/logos/google.svg',
      'meta-llama': '/logos/meta.svg',
      'mistralai': '/logos/mistral.svg',
      'deepseek': '/logos/deepseek.svg',
      'x-ai': '/logos/x-ai.svg'
    };
    
    return providerLogos[provider.toLowerCase()] || null;
  };

  const formatModelName = (model: string) => {
    const parts = model.split('/');
    if (parts.length === 2) {
      const [provider, modelName] = parts;
      return {
        name: modelName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        provider: provider.charAt(0).toUpperCase() + provider.slice(1),
        providerKey: provider,
        logo: getProviderLogo(provider)
      };
    }
    return { 
      name: model, 
      provider: '', 
      providerKey: '', 
      logo: null
    };
  };

  const renderCapabilityIcons = (model: string) => {
    const capabilities = getModelCapabilities(model);
    const icons = [];

    // Always show text capability
    icons.push(
      <div key="text" className="w-5 h-5 flex items-center justify-center rounded-md bg-white/10 border border-white/20">
        <Type size={12} className="text-white/80" />
      </div>
    );

    if (capabilities.supportsImages) {
      icons.push(
        <div key="images" className="w-5 h-5 flex items-center justify-center rounded-md bg-blue-500/20 border border-blue-400/30">
          <FileImage size={12} className="text-blue-400" />
        </div>
      );
    }

    if (capabilities.supportsPDF) {
      icons.push(
        <div key="pdf" className="w-5 h-5 flex items-center justify-center rounded-md bg-red-500/20 border border-red-400/30">
          <FileText size={12} className="text-red-400" />
        </div>
      );
    }

    return icons;
  };

  const filteredAndSortedModels = useMemo(() => {
    const filtered = popularModels.filter(model => {
      const modelInfo = formatModelName(model);
      const searchTerm = searchQuery.toLowerCase();
      return (
        modelInfo.name.toLowerCase().includes(searchTerm) ||
        modelInfo.provider.toLowerCase().includes(searchTerm) ||
        model.toLowerCase().includes(searchTerm)
      );
    });

    const grouped = filtered.reduce((acc, model) => {
      const modelInfo = formatModelName(model);
      const provider = modelInfo.provider || 'Other';
      
      if (!acc[provider]) {
        acc[provider] = [];
      }
      acc[provider].push(model);
      
      return acc;
    }, {} as Record<string, string[]>);

    const sortedProviders = Object.keys(grouped).sort();
    const result: Array<{ provider: string; models: string[] }> = [];
    
    sortedProviders.forEach(provider => {
      result.push({
        provider,
        models: grouped[provider].sort()
      });
    });

    return result;
  }, [popularModels, searchQuery]);

  const selectedModelInfo = formatModelName(selectedModel);

  return (
    <>
      {isModelModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModelModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
          
          <div
            className="relative w-full max-w-5xl max-h-[85vh] glass-strong backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl flex flex-col opacity-100 scale-100 overflow-hidden modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-8 pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 glass-strong rounded-2xl flex items-center justify-center border border-white/20">
                  <Brain size={24} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Select AI Model</h2>
                  <p className="text-white/60 text-sm mt-1">Choose the perfect AI model for your task</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsModelModalOpen(false)}
                className="cursor-pointer p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group"
                title="Close"
              >
                <X size={20} className="text-white/60 group-hover:text-white transition-colors" />
              </button>
            </div>

            <div className="px-8 pt-6 pb-4">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search models by name or provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 focus:bg-white/8 transition-all duration-200"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8">
              <div className="space-y-8">
                {filteredAndSortedModels.map(({ provider, models }) => (
                  <div key={provider} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 glass rounded-xl flex items-center justify-center border border-white/10">
                          {(() => {
                            const logo = getProviderLogo(provider);
                            return logo ? (
                              <img
                                src={logo}
                                alt={`${provider} logo`}
                                className="w-5 h-5 object-contain"
                              />
                            ) : (
                              <Brain size={14} className="text-white/60" />
                            );
                          })()}
                        </div>
                        <h3 className="text-lg font-semibold text-white capitalize">
                          {provider.replace('-', ' ')}
                        </h3>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>
                      <span className="text-white/40 text-sm font-medium">
                        {models.length} model{models.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {models.map((model) => {
                        const modelInfo = formatModelName(model);
                        const isSelected = selectedModel === model;
                        
                        return (
                          <button
                            key={model}
                            onClick={() => {
                              setSelectedModel(model);
                              setIsModelModalOpen(false);
                            }}
                            className={`cursor-pointer p-4 rounded-2xl border text-center transition-all group relative min-h-[100px] flex flex-col justify-center items-center hover:scale-[0.98] hover:shadow-lg ${
                              isSelected
                                ? 'glass-strong border-blue-400/60 bg-blue-500/20 shadow-blue-500/30 ring-2 ring-blue-400/30'
                                : 'glass border-white/10 hover:border-white/25 hover:bg-white/5'
                            }`}
                          >
                            {isSelected && (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl"></div>
                                <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-400/30 z-10">
                                  <Check size={14} className="text-white font-bold" />
                                </div>
                              </>
                            )}
                            
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-8 h-8 flex items-center justify-center rounded-xl glass border border-white/15">
                                {modelInfo.logo ? (
                                  <img
                                    src={modelInfo.logo}
                                    alt={`${modelInfo.provider} logo`}
                                    className="w-5 h-5 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <Brain 
                                  size={14} 
                                  className={`text-white/60 ${modelInfo.logo ? 'hidden' : ''}`}
                                />
                              </div>
                              
                              <div className="flex flex-col items-center gap-2">
                                <div className="font-semibold text-white text-sm text-center">
                                  {modelInfo.name}
                                </div>
                                <div className="flex items-center justify-center gap-1.5">
                                  {renderCapabilityIcons(model)}
                                </div>
                              </div>
                            </div>
                            

                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {filteredAndSortedModels.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 glass rounded-2xl flex items-center justify-center">
                      <Search size={24} className="text-white/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No models found</h3>
                    <p className="text-white/60">
                      No models match your search for "{searchQuery}". Try a different search term.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pb-4 flex justify-center">
        <div className="w-full max-w-4xl glass-strong backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl">

          <form onSubmit={isConsensusMode ? handleConsensusSubmit : handleSubmit} className="w-full">
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {attachment.file_type.startsWith('image/') ? (
                        <FileImage size={16} className="text-blue-400" />
                      ) : (
                        <FileText size={16} className="text-red-400" />
                      )}
                      <span className="text-white/80 truncate max-w-32">
                        {attachment.filename}
                      </span>
                      <span className="text-white/40 text-xs">
                        {formatFileSize(attachment.file_size)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="cursor-pointer p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <Trash2 size={14} className="text-white/60 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative group/send">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="w-full min-h-[40px] max-h-32 resize-none bg-transparent border-none outline-none focus:outline-none disabled:opacity-50 pr-24 text-white placeholder-white/60 p-3"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (isConsensusMode) {
                      handleConsensusSubmit(e);
                    } else {
                      handleSubmit(e);
                    }
                  }
                }}
              />
              
              <div className="absolute right-3 top-1/2 translate-y-1 flex items-center gap-1">
                {(() => {
                  const modelCapabilities = getModelCapabilities(selectedModel);
                  const acceptString = getFileUploadAcceptString(selectedModel);
                  const supportsFiles = modelCapabilities.supportsImages || modelCapabilities.supportsPDF;
                  
                  return (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={acceptString}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || isUploading || !supportsFiles}
                        className="relative group cursor-pointer p-2 rounded-lg hover:bg-white/10 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                      >
                        {isUploading ? (
                          <Loader2 size={18} className="text-blue-400 animate-spin" />
                        ) : !supportsFiles ? (
                          <AlertCircle size={18} className="text-red-400" />
                        ) : (
                          <Paperclip size={18} className="text-white/60 hover:text-white" />
                        )}
                        
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          {isUploading 
                            ? 'Uploading...' 
                            : !supportsFiles 
                              ? 'Model doesn\'t support files'
                              : `Attach ${getModelCapabilityDescription(selectedModel).toLowerCase()}`
                          }
                        </div>
                      </button>
                    </>
                  );
                })()}

                <button
                  type="submit"
                  disabled={(!message.trim() && attachments.length === 0) || isLoading || (isConsensusMode && selectedModels.length === 0)}
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
              </div>
            </div>
          </form>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative group/consensus-toggle">
                <button
                  type="button"
                  onClick={() => {
                    setIsConsensusMode(!isConsensusMode);
                    if (!isConsensusMode && selectedModels.length === 0) {
                      // Load last used consensus models from localStorage
                      const lastUsedConsensusModels = localStorage.getItem('lastUsedConsensusModels');
                      if (lastUsedConsensusModels) {
                        try {
                          const models = JSON.parse(lastUsedConsensusModels);
                          if (Array.isArray(models) && models.length > 0) {
                            setSelectedModels(models);
                          }
                        } catch {
                          // If parsing fails, don't set any models
                        }
                      }
                    }
                  }}
                  disabled={isLoading || activeConversation !== null}
                  className={`inline-flex items-center gap-2 px-3 py-2 border rounded-xl text-sm transition-all ${
                    activeConversation !== null
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer'
                  } ${
                    isLoading || activeConversation !== null ? 'opacity-50' : ''
                  } ${
                    isConsensusMode
                      ? 'glass-strong border-purple-400/30 bg-purple-500/10 text-purple-300'
                      : 'glass-hover border-white/10 text-white/80 hover:text-white hover:scale-[1.02]'
                  }`}
                >
                  <Users size={16} className={isConsensusMode ? 'text-purple-400' : 'text-white/60'} />
                  <span>Consensus Mode</span>
                </button>
                
                {activeConversation !== null && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/consensus-toggle:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Mode locked for existing conversation
                  </div>
                )}
              </div>

              {isConsensusMode ? (
                <div className="relative group/model-selector">
                  <button
                    type="button"
                    onClick={() => setIsMultiModelSelectorOpen(true)}
                    disabled={isLoading || activeConversation !== null}
                    className={`inline-flex items-center gap-2 px-3 py-2 border border-white/10 rounded-xl text-sm transition-all ${
                      activeConversation !== null
                        ? 'cursor-not-allowed opacity-50 text-white/40'
                        : 'cursor-pointer glass-hover text-white/80 hover:text-white hover:scale-[1.02]'
                    } ${
                      isLoading || activeConversation !== null ? 'opacity-50' : ''
                    }`}
                  >
                    <Brain size={16} className="text-purple-400" />
                    <span>{selectedModels.length} Model{selectedModels.length !== 1 ? 's' : ''}</span>
                    <ChevronDown size={14} className="text-white/40" />
                  </button>
                  
                  {activeConversation !== null && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/model-selector:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Models locked for existing conversation
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative group/single-model-selector">
                  <button
                    onClick={() => setIsModelModalOpen(true)}
                    disabled={isLoading || activeConversation !== null}
                    className={`inline-flex items-center gap-2 px-3 py-2 border border-white/10 rounded-xl text-sm transition-all ${
                      activeConversation !== null
                        ? 'cursor-not-allowed opacity-50 text-white/40'
                        : 'cursor-pointer glass-hover text-white/80 hover:text-white hover:scale-[1.02]'
                    } ${
                      isLoading || activeConversation !== null ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center rounded flex-shrink-0">
                      {selectedModelInfo.logo ? (
                        <img
                          src={selectedModelInfo.logo}
                          alt={`${selectedModelInfo.provider} logo`}
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <Bot 
                        size={14} 
                        className={`text-blue-400 ${selectedModelInfo.logo ? 'hidden' : ''}`}
                      />
                    </div>
                    <span>{selectedModelInfo.name}</span>
                    <ChevronDown size={14} className="text-white/40" />
                  </button>
                  
                  {activeConversation !== null && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/single-model-selector:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Model locked for existing conversation
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>


        </div>
      </div>

      <MultiModelSelector
        selectedModels={selectedModels}
        onModelsChange={setSelectedModels}
        isOpen={isMultiModelSelectorOpen}
        onClose={() => setIsMultiModelSelectorOpen(false)}
      />
    </>
  );
} 