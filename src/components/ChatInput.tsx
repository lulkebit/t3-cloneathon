'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';
import { Send, Bot, Loader2, Sparkles, Zap, ChevronDown, Check } from 'lucide-react';
import { getPopularModels } from '@/lib/openrouter';

export function ChatInput() {
  const {
    activeConversation,
    refreshConversations,
    refreshMessages,
    setActiveConversation,
  } = useChat();

  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3.5-sonnet');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const popularModels = getPopularModels();

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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          model: selectedModel,
          conversationId: activeConversation?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

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
              if (parsed.content) {
                setStreamingMessage(prev => prev + parsed.content);
              } else if (parsed.finished) {
                // Refresh conversations and messages when streaming is complete
                await Promise.all([
                  refreshConversations(),
                  activeConversation?.id ? refreshMessages(activeConversation.id) : Promise.resolve(),
                ]);

                // Set the active conversation if it was created
                if (parsed.conversationId && !activeConversation) {
                  const conversationsResponse = await fetch('/api/conversations');
                  if (conversationsResponse.ok) {
                    const conversationsData = await conversationsResponse.json();
                    const newConversation = conversationsData.find((c: any) => c.id === parsed.conversationId);
                    if (newConversation) {
                      setActiveConversation(newConversation);
                    }
                  }
                }
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  const formatModelName = (model: string) => {
    const parts = model.split('/');
    if (parts.length === 2) {
      const [provider, modelName] = parts;
      return {
        name: modelName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        provider: provider.charAt(0).toUpperCase() + provider.slice(1)
      };
    }
    return { name: model, provider: '' };
  };

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
            
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md glass-strong backdrop-blur-xl rounded-2xl border border-white/10 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 glass rounded-xl flex items-center justify-center">
                  <Zap size={16} className="text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Choose AI Model</h2>
              </div>

                             <div className="space-y-2 max-h-80 overflow-y-auto overflow-x-hidden">
                 {popularModels.map((model) => {
                   const modelInfo = formatModelName(model);
                   const isSelected = selectedModel === model;
                   
                   return (
                     <motion.button
                       key={model}
                       onClick={() => {
                         setSelectedModel(model);
                         setIsModelModalOpen(false);
                       }}
                       className={`w-full p-3 rounded-xl border text-left transition-all group ${
                         isSelected
                           ? 'glass-strong border-blue-400/30 bg-blue-500/10'
                           : 'glass-hover border-white/10 hover:border-white/20'
                       }`}
                       whileHover={{ y: -1 }}
                       whileTap={{ scale: 0.98 }}
                     >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white/90 text-sm">
                            {modelInfo.name}
                          </div>
                          <div className="text-white/50 text-xs">
                            {modelInfo.provider}
                          </div>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                          >
                            <Check size={12} className="text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
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
              className="mb-6 glass-strong rounded-2xl p-4 border border-white/10 overflow-hidden"
            >
              <div className="flex items-start gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0 w-8 h-8 glass rounded-xl flex items-center justify-center"
                >
                  <Bot size={16} className="text-blue-400" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white/90 whitespace-pre-wrap text-sm leading-relaxed"
                  >
                    {streamingMessage}
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-block w-2 h-4 ml-1 bg-blue-400 rounded-sm"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Input Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 items-end"
        >
          <div className="flex-1 relative">
            <motion.textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="w-full min-h-[50px] max-h-32 resize-none input-glass focus-ring disabled:opacity-50 pr-12"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              whileFocus={{ scale: 1.01 }}
            />
            
            {/* Character indicator for long messages */}
            <AnimatePresence>
              {message.length > 100 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-2 right-2 text-xs text-white/40 bg-black/20 rounded px-2 py-1"
                >
                  {message.length}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <motion.button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="w-12 h-12 btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
            transition={isLoading ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.2 }}
          >
            {isLoading ? (
              <Loader2 size={18} />
            ) : (
              <Send size={18} />
            )}
                     </motion.button>
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
             <Bot size={14} className="text-blue-400" />
             <span>{selectedModelInfo.name}</span>
             <ChevronDown size={14} className="text-white/40" />
           </motion.button>
         </motion.div>
         </motion.div>
       </div>
     </>
   );
 } 