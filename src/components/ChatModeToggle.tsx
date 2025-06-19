'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Bot, Brain, ChevronDown } from 'lucide-react';

interface ChatModeToggleProps {
  isConsensusMode: boolean;
  selectedModels: string[];
  selectedModel: string;
  isLoading: boolean;
  activeConversation: any;
  onConsenusModeToggle: () => void;
  onMultiModelSelectorOpen: () => void;
  onSingleModelSelectorOpen: () => void;
  formatModelName: (model: string) => { name: string; provider: string; logo: string | null };
}

export function ChatModeToggle({
  isConsensusMode,
  selectedModels,
  selectedModel,
  isLoading,
  activeConversation,
  onConsenusModeToggle,
  onMultiModelSelectorOpen,
  onSingleModelSelectorOpen,
  formatModelName,
}: ChatModeToggleProps) {
  const selectedModelInfo = formatModelName(selectedModel);

  return (
    <div className="flex items-center gap-3">
      <div className="relative group/consensus-toggle">
        <button
          type="button"
          onClick={onConsenusModeToggle}
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
            onClick={onMultiModelSelectorOpen}
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
            onClick={onSingleModelSelectorOpen}
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
  );
} 