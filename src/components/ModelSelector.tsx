'use client';

import React, { useMemo, useState } from 'react';
import {
  Brain,
  Search,
  X,
  Check,
  FileImage,
  FileText,
  Type,
} from 'lucide-react';
import { getPopularModels } from '@/lib/openrouter';
import { getModelCapabilities } from '@/lib/model-capabilities';

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ModelSelector({
  selectedModel,
  onModelSelect,
  isOpen,
  onClose,
}: ModelSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const popularModels = getPopularModels();

  const getProviderLogo = (provider: string) => {
    const providerLogos: Record<string, string> = {
      anthropic: '/logos/anthropic.svg',
      openai: '/logos/openai.svg',
      google: '/logos/google.svg',
      'meta-llama': '/logos/meta.svg',
      mistralai: '/logos/mistral.svg',
      deepseek: '/logos/deepseek.svg',
    };

    return providerLogos[provider.toLowerCase()] || null;
  };

  const formatModelName = (model: string) => {
    const parts = model.split('/');
    if (parts.length === 2) {
      const [provider, modelName] = parts;
      return {
        name: modelName
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        provider: provider,
        logo: getProviderLogo(provider),
      };
    }
    return {
      name: model,
      provider: 'Other',
      logo: null,
    };
  };

  const renderCapabilityIcons = (model: string) => {
    const capabilities = getModelCapabilities(model);
    const icons = [];

    icons.push(
      <div
        key="text"
        className="w-5 h-5 flex items-center justify-center rounded-md bg-white/10 border border-white/20"
      >
        <Type size={12} className="text-white/80" />
      </div>
    );

    if (capabilities.supportsImages) {
      icons.push(
        <div
          key="images"
          className="w-5 h-5 flex items-center justify-center rounded-md bg-blue-500/20 border border-blue-400/30"
        >
          <FileImage size={12} className="text-blue-400" />
        </div>
      );
    }

    if (capabilities.supportsPDF) {
      icons.push(
        <div
          key="pdf"
          className="w-5 h-5 flex items-center justify-center rounded-md bg-red-500/20 border border-red-400/30"
        >
          <FileText size={12} className="text-red-400" />
        </div>
      );
    }

    return icons;
  };

  const filteredAndSortedModels = useMemo(() => {
    const filtered = popularModels.filter((model) => {
      const modelInfo = formatModelName(model);
      const searchTerm = searchQuery.toLowerCase();
      return (
        modelInfo.name.toLowerCase().includes(searchTerm) ||
        modelInfo.provider.toLowerCase().includes(searchTerm) ||
        model.toLowerCase().includes(searchTerm)
      );
    });

    const grouped = filtered.reduce(
      (acc, model) => {
        const modelInfo = formatModelName(model);
        const provider = modelInfo.provider || 'Other';

        if (!acc[provider]) {
          acc[provider] = [];
        }
        acc[provider].push(model);

        return acc;
      },
      {} as Record<string, string[]>
    );

    const sortedProviders = Object.keys(grouped).sort();
    const result: Array<{ provider: string; models: string[] }> = [];

    sortedProviders.forEach((provider) => {
      result.push({
        provider,
        models: grouped[provider].sort(),
      });
    });

    return result;
  }, [popularModels, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
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
              <p className="text-white/60 text-sm mt-1">
                Choose the perfect AI model for your task
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group"
            title="Close"
          >
            <X
              size={20}
              className="text-white/60 group-hover:text-white transition-colors"
            />
          </button>
        </div>

        <div className="px-8 pt-6 pb-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40"
            />
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
                          onModelSelect(model);
                          onClose();
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
                              <Check
                                size={14}
                                className="text-white font-bold"
                              />
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
                                  target.nextElementSibling?.classList.remove(
                                    'hidden'
                                  );
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
          </div>
        </div>
      </div>
    </div>
  );
}
