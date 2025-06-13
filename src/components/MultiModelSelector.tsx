'use client';

import React, { useState, useMemo } from 'react';
import { Brain, Check, X, Search, Users } from 'lucide-react';
import { getPopularModels } from '@/lib/openrouter';

interface MultiModelSelectorProps {
  selectedModels: string[];
  onModelsChange: (models: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function MultiModelSelector({ 
  selectedModels, 
  onModelsChange, 
  isOpen, 
  onClose 
}: MultiModelSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const popularModels = getPopularModels();

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

  const getProviderLogo = (provider: string) => {
    const providerLogos: Record<string, string> = {
      'openai': '/logos/openai.svg',
      'anthropic': '/logos/anthropic.svg',
      'google': '/logos/google.svg',
      'meta-llama': '/logos/meta.svg',
      'mistralai': '/logos/mistral.svg',
      'deepseek': '/logos/deepseek.svg',
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

  const toggleModel = (model: string) => {
    if (selectedModels.includes(model)) {
      onModelsChange(selectedModels.filter(m => m !== model));
    } else {
      onModelsChange([...selectedModels, model]);
    }
  };

  const clearAll = () => {
    onModelsChange([]);
  };

  const selectRecommended = () => {
    const recommended = [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'google/gemma-3n-e4b-it:free'
    ];
    onModelsChange(recommended);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      <div
        className="relative w-full max-w-5xl max-h-[85vh] glass-strong backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex flex-col opacity-100 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-purple-400" />
            <h2 className="text-xl font-bold text-white">Multi-Model Consensus</h2>
            <div className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-sm text-purple-300">
              {selectedModels.length} selected
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="cursor-pointer p-2 rounded-lg hover:bg-white/10 transition-colors duration-150"
          >
            <X size={20} className="text-white/60 hover:text-white" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 transition-colors duration-150"
              autoFocus
            />
          </div>
          
          <button
            onClick={selectRecommended}
            className="px-4 py-3 bg-purple-500/20 border border-purple-400/30 rounded-xl text-purple-300 hover:bg-purple-500/30 transition-colors duration-150 whitespace-nowrap"
          >
            Select Recommended
          </button>
          
          <button
            onClick={clearAll}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 transition-colors duration-150"
          >
            Clear All
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {filteredAndSortedModels.map(({ provider, models }) => (
            <div key={provider} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider">
                  {provider}
                </h3>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {models.map((model) => {
                  const modelInfo = formatModelName(model);
                  const isSelected = selectedModels.includes(model);
                  
                  return (
                    <button
                      key={model}
                      onClick={() => toggleModel(model)}
                      className={`cursor-pointer p-4 rounded-xl border text-left transition-all group relative h-24 flex flex-col justify-between hover:scale-[0.98] ${
                        isSelected
                          ? 'glass-strong border-purple-400/30 bg-purple-500/10'
                          : 'glass-hover border-white/10 hover:border-white/20'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2">
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
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white/90 text-xs truncate">
                            {modelInfo.name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        {modelInfo.createdDate && (
                          <div className="text-white/40 text-xs">
                            {modelInfo.createdDate}
                          </div>
                        )}
                      </div>
                    </button>
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

        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">
              Select 2-5 models for best consensus results
            </div>
            <button
              onClick={onClose}
              disabled={selectedModels.length === 0}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-150 ${
                selectedModels.length === 0
                  ? 'bg-white/5 text-white/40 cursor-not-allowed'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              Use {selectedModels.length} Model{selectedModels.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 