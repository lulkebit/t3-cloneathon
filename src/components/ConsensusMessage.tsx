'use client';

import React, { useState } from 'react';
import { Brain, Clock, AlertCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { ConsensusResponse } from '@/types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ConsensusMessageProps {
  responses: ConsensusResponse[];
  isStreaming?: boolean;
}

export function ConsensusMessage({ responses, isStreaming }: ConsensusMessageProps) {
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [copiedModel, setCopiedModel] = useState<string | null>(null);

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
        logo: getProviderLogo(provider),
      };
    }
    return { 
      name: model, 
      provider: '', 
      logo: null,
    };
  };

  const toggleExpanded = (model: string) => {
    const newExpanded = new Set(expandedModels);
    if (newExpanded.has(model)) {
      newExpanded.delete(model);
    } else {
      newExpanded.add(model);
    }
    setExpandedModels(newExpanded);
  };

  const copyResponse = async (content: string, model: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedModel(model);
      setTimeout(() => setCopiedModel(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const completedResponses = responses.filter(r => !r.isLoading && !r.error);
  const errorResponses = responses.filter(r => r.error);
  const loadingResponses = responses.filter(r => r.isLoading);

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center gap-3 p-4 glass-strong rounded-xl border border-purple-400/20">
        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
          <Brain size={16} className="text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-white">Multi-Model Consensus</div>
          <div className="text-sm text-white/60">
            {completedResponses.length} of {responses.length} models completed
            {isStreaming && ' (streaming...)'}
          </div>
        </div>
        {completedResponses.length > 0 && (
          <div className="text-xs text-white/40">
            Avg: {formatResponseTime(
              completedResponses.reduce((sum, r) => sum + (r.responseTime || 0), 0) / completedResponses.length
            )}
          </div>
        )}
      </div>

      {/* Model Responses */}
      <div className="space-y-3">
        {responses.map((response, index) => {
          const modelInfo = formatModelName(response.model);
          const isExpanded = expandedModels.has(response.model);
          const hasContent = response.content && response.content.trim().length > 0;

          return (
            <div
              key={response.model}
              className={`glass-hover rounded-xl border transition-all duration-200 ${
                response.error 
                  ? 'border-red-400/30 bg-red-500/5' 
                  : response.isLoading 
                    ? 'border-yellow-400/30 bg-yellow-500/5' 
                    : 'border-white/10'
              }`}
            >
              {/* Model Header */}
              <div 
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => hasContent && toggleExpanded(response.model)}
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg glass border border-white/10">
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

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white/90 truncate">
                    {modelInfo.name}
                  </div>
                  <div className="text-sm text-white/50">
                    {modelInfo.provider}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {response.error && (
                    <div className="flex items-center gap-1 text-red-400 text-xs">
                      <AlertCircle size={12} />
                      Error
                    </div>
                  )}
                  
                  {response.isLoading && (
                    <div className="flex items-center gap-1 text-yellow-400 text-xs">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      Loading...
                    </div>
                  )}

                  {response.responseTime && (
                    <div className="flex items-center gap-1 text-white/40 text-xs">
                      <Clock size={12} />
                      {formatResponseTime(response.responseTime)}
                    </div>
                  )}

                  {hasContent && !response.isLoading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyResponse(response.content, response.model);
                      }}
                      className="cursor-pointer p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      {copiedModel === response.model ? (
                        <Check size={14} className="text-green-400" />
                      ) : (
                        <Copy size={14} className="text-white/40 hover:text-white/60" />
                      )}
                    </button>
                  )}

                  {hasContent && (
                    <button className="cursor-pointer p-1 rounded hover:bg-white/10 transition-colors">
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-white/40" />
                      ) : (
                        <ChevronDown size={16} className="text-white/40" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Model Response Content */}
              {hasContent && isExpanded && (
                <div className="px-4 pb-4 border-t border-white/10">
                  <div className="mt-4">
                    <MarkdownRenderer content={response.content} />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {response.error && (
                <div className="px-4 pb-4 border-t border-red-400/20">
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-400/20 rounded-lg">
                    <div className="text-red-400 text-sm font-medium mb-1">Error</div>
                    <div className="text-red-300/80 text-sm">{response.error}</div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {response.isLoading && (
                <div className="px-4 pb-4 border-t border-yellow-400/20">
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      Waiting for response...
                    </div>
                  </div>
                </div>
              )}

              {/* Streaming Content Preview */}
              {response.isStreaming && hasContent && !isExpanded && (
                <div className="px-4 pb-4 border-t border-white/10">
                  <div className="mt-4 text-white/70 text-sm line-clamp-2">
                    {response.content.substring(0, 150)}
                    {response.content.length > 150 && '...'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      {completedResponses.length > 1 && (
        <div className="flex items-center gap-2 p-3 glass-hover rounded-xl border border-white/10">
          <div className="text-sm text-white/60 flex-1">
            Compare responses from {completedResponses.length} models
          </div>
          <button
            onClick={() => {
              const allModels = new Set(responses.map(r => r.model));
              setExpandedModels(allModels);
            }}
            className="cursor-pointer px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg text-white/80 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={() => setExpandedModels(new Set())}
            className="cursor-pointer px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg text-white/80 transition-colors"
          >
            Collapse All
          </button>
        </div>
      )}
    </div>
  );
} 