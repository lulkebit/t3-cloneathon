'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Attachment, ConsensusResponse } from '@/types/chat';
import { MultiModelSelector } from './MultiModelSelector';
import { AttachmentList } from './AttachmentList';
import { ChatModeToggle } from './ChatModeToggle';
import { ModelSelector } from './ModelSelector';
import { FileUploadButton } from './FileUploadButton';
import { SendButton } from './SendButton';
import {
  getModelCapabilities,
  canModelProcessFileType,
  getMaxFileSizeForModel,
} from '@/lib/model-capabilities';
import { formatModelName } from '@/lib/model-utils';

export function ChatInput() {
  const {
    activeConversation,
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

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isConsensusMode, setIsConsensusMode] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isMultiModelSelectorOpen, setIsMultiModelSelectorOpen] =
    useState(false);
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
      const lastUsedConsensusModels = localStorage.getItem(
        'lastUsedConsensusModels'
      );
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
      const compatibleAttachments = attachments.filter((attachment) =>
        canModelProcessFileType(selectedModel, attachment.file_type)
      );

      if (compatibleAttachments.length !== attachments.length) {
        setAttachments(compatibleAttachments);
        if (compatibleAttachments.length === 0) {
          alert(
            `Attachments removed: ${selectedModel} doesn't support the uploaded file types.`
          );
        } else {
          alert(
            `Some attachments removed: ${selectedModel} doesn't support all uploaded file types.`
          );
        }
      }
    }
  }, [selectedModel, attachments]);

  // Save selected consensus models to localStorage when they change
  useEffect(() => {
    if (selectedModels.length > 0 && !activeConversation) {
      localStorage.setItem(
        'lastUsedConsensusModels',
        JSON.stringify(selectedModels)
      );
    }
  }, [selectedModels, activeConversation]);

  // Save selected model to localStorage when it changes
  useEffect(() => {
    if (selectedModel && !activeConversation) {
      localStorage.setItem('lastUsedModel', selectedModel);
    }
  }, [selectedModel, activeConversation]);

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

        // FIRST: Add the new conversation to the list
        addNewConversation(conversationData.conversation);

        // SECOND: Set active conversation and update URL BEFORE adding messages
        setActiveConversation(conversationData.conversation);
        window.history.pushState(null, '', `/chat/${conversationId}`);

        // THIRD: Add optimistic messages after conversation is properly set
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
                const errorContent =
                  parsed.errorContent || `❌ **Error**: ${parsed.error}`;
                finalizeMessage(assistantMessageId, errorContent);
              } else if (
                parsed.titleUpdate &&
                parsed.conversationId &&
                parsed.title
              ) {
                // Handle title update - update conversation title without switching chats
                updateConversationTitle(parsed.conversationId, parsed.title);
              } else if (parsed.done && assistantMessageId) {
                finalizeMessage(assistantMessageId, assistantContent);
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
    if (
      (!message.trim() && attachments.length === 0) ||
      isLoading ||
      selectedModels.length === 0
    )
      return;

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
          consensusResponses: selectedModels.map((model) => ({
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

        // FIRST: Add the new conversation to the list
        addNewConversation(conversationData.conversation);

        // SECOND: Set active conversation and update URL BEFORE adding messages
        setActiveConversation(conversationData.conversation);
        window.history.pushState(null, '', `/chat/${conversationId}`);

        // THIRD: Add optimistic messages after conversation is properly set
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
          consensusResponses: selectedModels.map((model) => ({
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
      let consensusResponses: ConsensusResponse[] = selectedModels.map(
        (model) => ({
          model,
          content: '',
          isLoading: true,
          responseTime: 0,
        })
      );

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

                  updateStreamingMessage(
                    assistantMessageId,
                    JSON.stringify(consensusResponses)
                  );
                }
              } else if (
                parsed.type === 'consensus_complete' &&
                assistantMessageId
              ) {
                const { modelIndex, content, responseTime } = parsed;
                if (modelIndex < consensusResponses.length) {
                  consensusResponses[modelIndex] = {
                    ...consensusResponses[modelIndex],
                    content,
                    isStreaming: false,
                    isLoading: false,
                    responseTime,
                  };

                  updateStreamingMessage(
                    assistantMessageId,
                    JSON.stringify(consensusResponses)
                  );
                }
              } else if (
                parsed.type === 'consensus_error' &&
                assistantMessageId
              ) {
                const { modelIndex, error, responseTime } = parsed;
                if (modelIndex < consensusResponses.length) {
                  consensusResponses[modelIndex] = {
                    ...consensusResponses[modelIndex],
                    error,
                    isLoading: false,
                    isStreaming: false,
                    responseTime,
                  };

                  updateStreamingMessage(
                    assistantMessageId,
                    JSON.stringify(consensusResponses)
                  );
                }
              } else if (
                parsed.type === 'title_update' &&
                parsed.conversationId &&
                parsed.title
              ) {
                // Handle title update for consensus - update conversation title without switching chats
                updateConversationTitle(parsed.conversationId, parsed.title);
              } else if (
                parsed.type === 'consensus_final' &&
                assistantMessageId
              ) {
                finalizeMessage(
                  assistantMessageId,
                  JSON.stringify(parsed.responses)
                );
              }
            } catch (e) {
              console.error(
                'Error parsing consensus streaming data:',
                e,
                'Data:',
                data
              );
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

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const modelCapabilities = getModelCapabilities(selectedModel);
    const maxFileSize = getMaxFileSizeForModel(selectedModel) * 1024 * 1024; // Convert MB to bytes

    // Validate files before uploading
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // Check if model supports this file type
      if (!canModelProcessFileType(selectedModel, file.type)) {
        errors.push(
          `${file.name}: File type not supported by ${selectedModel}`
        );
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        errors.push(
          `${file.name}: File too large (max ${getMaxFileSizeForModel(
            selectedModel
          )}MB)`
        );
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
      setAttachments((prev) => [...prev, ...uploadedFiles]);
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
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <ModelSelector
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />

      <div className="px-4 pb-4 flex justify-center">
        <div className="w-full max-w-4xl glass-strong backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl">
          <form
            onSubmit={isConsensusMode ? handleConsensusSubmit : handleSubmit}
            className="w-full"
          >
            <AttachmentList
              attachments={attachments}
              onRemoveAttachment={removeAttachment}
            />

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
                <FileUploadButton
                  selectedModel={selectedModel}
                  isLoading={isLoading}
                  isUploading={isUploading}
                  fileInputRef={fileInputRef}
                  onFileSelect={handleFileSelect}
                />

                <SendButton
                  isLoading={isLoading}
                  isDisabled={
                    (!message.trim() && attachments.length === 0) ||
                    isLoading ||
                    (isConsensusMode && selectedModels.length === 0)
                  }
                />
              </div>
            </div>
          </form>

          <div className="mt-3 flex items-center justify-between">
            <ChatModeToggle
              isConsensusMode={isConsensusMode}
              selectedModels={selectedModels}
              selectedModel={selectedModel}
              isLoading={isLoading}
              activeConversation={activeConversation}
              onConsenusModeToggle={() => {
                setIsConsensusMode(!isConsensusMode);
                if (!isConsensusMode && selectedModels.length === 0) {
                  // Load last used consensus models from localStorage
                  const lastUsedConsensusModels = localStorage.getItem(
                    'lastUsedConsensusModels'
                  );
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
              onMultiModelSelectorOpen={() => setIsMultiModelSelectorOpen(true)}
              onSingleModelSelectorOpen={() => setIsModelModalOpen(true)}
              formatModelName={formatModelName}
            />
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
