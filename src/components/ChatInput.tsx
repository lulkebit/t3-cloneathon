'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useChat } from '@/contexts/ChatContext';
import { Send, Bot, Loader2, Sparkles, Zap, ChevronDown, Check, Brain, Search, X } from 'lucide-react';
import { getPopularModels } from '@/lib/openrouter';
import { MarkdownRenderer } from './MarkdownRenderer';

export function ChatInput() {
  const {
    activeConversation,
    refreshConversations,
    refreshMessages,
    setActiveConversation,
    addOptimisticMessage,
    updateStreamingMessage,
    finalizeMessage,
    removeOptimisticMessage,
  } = useChat();

  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('google/gemma-3n-e4b-it:free');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Switch model when active conversation changes
  useEffect(() => {
    if (activeConversation && activeConversation.model) {
      setSelectedModel(activeConversation.model);
    }
  }, [activeConversation]);

  const popularModels = getPopularModels();

  // Mock model creation dates (in a real app, this would come from the API)
  const modelCreationDates: Record<string, string> = {
    'anthropic/claude-3.5-sonnet': '2024-10-22',
    'openai/gpt-4o': '2024-05-13',
    'openai/gpt-4o-mini': '2024-07-18',
    'anthropic/claude-3-haiku': '2024-03-07',
    'deepseek/deepseek-r1-0528:free': '2024-05-28',
    'google/gemma-3n-e4b-it:free': '2024-12-11',
    'meta-llama/llama-3.1-405b-instruct': '2024-07-23',
    'meta-llama/llama-3.1-70b-instruct': '2024-07-23',
    'google/gemini-pro': '2023-12-13',
    'mistralai/mistral-7b-instruct': '2023-09-27',
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage('');
    setIsLoading(true);
    setStreamingMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    let conversationId: string | null = null;
    let userMessageId: string | undefined;
    let assistantMessageId: string | undefined;
    
    try {
      // Prüfe ob wir in einem bestehenden Chat sind oder einen neuen erstellen müssen
      if (activeConversation) {
        // Bestehender Chat: Verwende aktuelle Conversation
        conversationId = activeConversation.id;
        
        // Zeige sofort die Benutzernachricht an
        userMessageId = addOptimisticMessage({
          conversation_id: conversationId!,
          role: 'user',
          content: userMessage,
        });

        // Zeige Loading-Indikator für AI-Antwort
        assistantMessageId = addOptimisticMessage({
          conversation_id: conversationId!,
          role: 'assistant',
          content: '',
          isLoading: true,
        });
      } else {
        // Neuer Chat: Erstelle sofort einen neuen Chat auf dem Server
        const createConversationResponse = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''),
            model: selectedModel,
          }),
        });

        if (!createConversationResponse.ok) {
          throw new Error('Failed to create conversation');
        }

        const conversationData = await createConversationResponse.json();
        conversationId = conversationData.conversation.id;
        
        // Aktualisiere die Conversation-Liste
        await refreshConversations();
        
        // Navigiere sofort zum neuen Chat
        window.history.pushState(null, '', `/chat/${conversationId}`);
        
        // Zeige die Benutzernachricht sofort an
        userMessageId = addOptimisticMessage({
          conversation_id: conversationId!,
          role: 'user',
          content: userMessage,
        });

        // Zeige Loading-Indikator für AI-Antwort
        assistantMessageId = addOptimisticMessage({
          conversation_id: conversationId!,
          role: 'assistant',
          content: '',
          isLoading: true,
        });
      }

      // Sende die Nachricht an die AI
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          model: selectedModel,
          conversationId: conversationId,
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

      // Start streaming the assistant response
      if (assistantMessageId) {
        updateStreamingMessage(assistantMessageId, '');
      }

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
              } else if (parsed.done && assistantMessageId) {
                // Streaming ist abgeschlossen
                finalizeMessage(assistantMessageId, assistantContent);
                
                // Lade echte Nachrichten und räume auf
                setTimeout(async () => {
                  if (conversationId) {
                    await refreshMessages(conversationId);
                  }
                  
                  // Entferne die optimistischen Nachrichten nach dem Server-Update
                  if (userMessageId) {
                    removeOptimisticMessage(userMessageId);
                  }
                  if (assistantMessageId) {
                    removeOptimisticMessage(assistantMessageId);
                  }
                }, 300);
              }
            } catch (e) {
              console.error('Error parsing streaming data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Entferne optimistische Nachrichten bei Fehler falls sie existieren
      if (userMessageId) {
        removeOptimisticMessage(userMessageId);
      }
      if (assistantMessageId) {
        removeOptimisticMessage(assistantMessageId);
      }
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  const getProviderLogo = (provider: string) => {
    const providerLogos: Record<string, string> = {
      'anthropic': '/logos/anthropic.svg',
      'openai': '/logos/openai.svg',
      'google': '/logos/google.svg',
      'meta-llama': '/logos/meta.svg',
      'mistralai': '/logos/mistral.svg',
      'deepseek': '/logos/deepseek.svg'
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
        logo: getProviderLogo(provider),
        createdDate: modelCreationDates[model] || null
      };
    }
    return { 
      name: model, 
      provider: '', 
      providerKey: '', 
      logo: null,
      createdDate: modelCreationDates[model] || null
    };
  };

  // Filter and sort models
  const filteredAndSortedModels = useMemo(() => {
    // Filter by search query
    const filtered = popularModels.filter(model => {
      const modelInfo = formatModelName(model);
      const searchTerm = searchQuery.toLowerCase();
      return (
        modelInfo.name.toLowerCase().includes(searchTerm) ||
        modelInfo.provider.toLowerCase().includes(searchTerm) ||
        model.toLowerCase().includes(searchTerm)
      );
    });

    // Group by provider and sort
    const grouped = filtered.reduce((acc, model) => {
      const modelInfo = formatModelName(model);
      const provider = modelInfo.provider || 'Other';
      
      if (!acc[provider]) {
        acc[provider] = [];
      }
      acc[provider].push(model);
      
      return acc;
    }, {} as Record<string, string[]>);

    // Sort providers alphabetically and models within each provider
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
      {/* Modal Overlay */}
      <AnimatePresence>
        {isModelModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModelModalOpen(false)}
          >
            {/* Blurred Background */}
            <motion.div
              initial={{ backdropFilter: 'blur(0px)' }}
              animate={{ backdropFilter: 'blur(20px)' }}
              exit={{ backdropFilter: 'blur(0px)' }}
              className="absolute inset-0 bg-black/30"
            />
            
            {/* Modal Content - Made larger */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-4xl max-h-[80vh] glass-strong backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 glass rounded-xl flex items-center justify-center">
                    <Zap size={16} className="text-blue-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Choose AI Model</h2>
                </div>
                
                <button
                  onClick={() => setIsModelModalOpen(false)}
                  className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X size={16} className="text-white/60" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Models Grid - Made scrollable and organized by provider */}
              <div className="flex-1 overflow-y-auto space-y-6">
                {filteredAndSortedModels.map(({ provider, models }) => (
                  <div key={provider} className="space-y-3">
                    {/* Provider Header */}
                    <div className="flex items-center gap-2 px-2">
                      <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider">
                        {provider}
                      </h3>
                      <div className="flex-1 h-px bg-white/10"></div>
                    </div>
                    
                    {/* Models Grid for this provider */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {models.map((model) => {
                        const modelInfo = formatModelName(model);
                        const isSelected = selectedModel === model;
                        
                        return (
                          <motion.button
                            key={model}
                            onClick={() => {
                              setSelectedModel(model);
                              setIsModelModalOpen(false);
                            }}
                            className={`p-4 rounded-xl border text-left transition-all group relative h-24 flex flex-col justify-between ${
                              isSelected
                                ? 'glass-strong border-blue-400/30 bg-blue-500/10'
                                : 'glass-hover border-white/10 hover:border-white/20'
                            }`}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Selection Indicator */}
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                              >
                                <Check size={10} className="text-white" />
                              </motion.div>
                            )}
                            
                            {/* Model Header */}
                            <div className="flex items-start gap-2">
                              {/* Provider Logo */}
                              <div className="w-6 h-6 flex items-center justify-center rounded-md glass border border-white/10 flex-shrink-0">
                                {modelInfo.logo ? (
                                  <img
                                    src={modelInfo.logo}
                                    alt={`${modelInfo.provider} logo`}
                                    className="w-4 h-4 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <Brain 
                                  size={12} 
                                  className={`text-white/60 ${modelInfo.logo ? 'hidden' : ''}`}
                                />
                              </div>
                              
                              {/* Model Name */}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-white/90 text-xs truncate">
                                  {modelInfo.name}
                                </div>
                              </div>
                            </div>
                            
                            {/* Model Footer */}
                            <div className="space-y-1">
                              {modelInfo.createdDate && (
                                <div className="text-white/40 text-xs">
                                  {modelInfo.createdDate}
                                </div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {filteredAndSortedModels.length === 0 && (
                  <div className="text-center py-8 text-white/40">
                    No models found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input */}
      <div className="p-6 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-4xl glass-strong backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl"
        >

          {/* Streaming Message Display */}
          <AnimatePresence>
            {streamingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="mb-6 overflow-hidden"
              >
                {/* Message Header */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 mb-3"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                    <Bot size={16} className="text-blue-400" />
                  </div>

                  {/* Name */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-400">Assistant</span>
                    <span className="text-xs text-white/40">typing...</span>
                  </div>
                </motion.div>

                {/* Message Content */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="ml-11 relative max-w-4xl"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative"
                  >
                    <MarkdownRenderer 
                      content={streamingMessage} 
                      className="streaming-message"
                    />
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-block w-0.5 h-4 ml-1 bg-blue-400 absolute"
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message Input Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <div className="relative group/send">
              <motion.textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="w-full min-h-[50px] max-h-32 resize-none bg-transparent border-none outline-none focus:outline-none disabled:opacity-50 pr-14 text-white placeholder-white/60 p-4"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                whileFocus={{ scale: 1.01 }}
              />
              
              {/* Send button inside textarea */}
              <div className="absolute right-3 top-1/2 translate-y-1 flex flex-col items-center group/sendbutton">
                <motion.button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="p-2 rounded-lg border border-transparent hover:bg-white/10 hover:border-white/20 hover:backdrop-blur-sm hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Send message"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="text-blue-400 animate-spin" />
                  ) : (
                    <Send size={20} className="text-white/60 hover:text-white" />
                  )}
                </motion.button>
                <span className="text-xs text-white/50 mt-1 opacity-0 group-hover/sendbutton:opacity-100 transition-opacity duration-200">
                  {isLoading ? 'Sending...' : 'Send'}
                </span>
              </div>
              
              {/* Character indicator for long messages */}
              <AnimatePresence>
                {message.length > 100 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute bottom-2 left-3 text-xs text-white/40 bg-black/20 rounded px-2 py-1"
                  >
                    {message.length}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.form>

          {/* Model Selection Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 flex justify-start"
          >
            <motion.button
              onClick={() => setIsModelModalOpen(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 glass-hover border border-white/10 rounded-xl text-sm text-white/80 hover:text-white transition-all disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Provider Logo */}
              <div className="w-5 h-5 flex items-center justify-center rounded flex-shrink-0">
                {selectedModelInfo.logo ? (
                  <img
                    src={selectedModelInfo.logo}
                    alt={`${selectedModelInfo.provider} logo`}
                    className="w-4 h-4 object-contain"
                    onError={(e) => {
                      // Fallback to placeholder icon if image fails to load
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
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
} 