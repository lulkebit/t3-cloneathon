'use client';

import React, { useState } from 'react';
import { Brain, Clock, List, Grid3X3 } from 'lucide-react';
import { ConsensusResponse } from '@/types/chat';
import { ModelResponseCard } from './ModelResponseCard';

interface ConsensusMessageProps {
  responses: ConsensusResponse[];
  isStreaming?: boolean;
}

type ViewMode = 'stacked' | 'sideBySide';

export function ConsensusMessage({
  responses,
  isStreaming,
}: ConsensusMessageProps) {
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('stacked');

  const getProviderLogo = (provider: string) => {
    const providerLogos: Record<string, string> = {
      openai: '/logos/openai.svg',
      anthropic: '/logos/anthropic.svg',
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

  const completedResponses = responses.filter((r) => !r.isLoading && !r.error);
  const errorResponses = responses.filter((r) => r.error);
  const loadingResponses = responses.filter((r) => r.isLoading);

  return (
    <div className="space-y-4">
      {/* Fixed Header with improved responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 glass-strong rounded-xl border border-purple-400/20">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain size={16} className="text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white">Multi-Model Consensus</div>
            <div className="text-sm text-white/60">
              {completedResponses.length} of {responses.length} models completed
              {isStreaming && ' (streaming...)'}
            </div>
          </div>
        </div>

        {/* Stats and Controls Row */}
        <div className="flex items-center gap-3 flex-wrap">
          {completedResponses.length > 0 && (
            <div className="text-xs text-white/40 flex-shrink-0">
              Avg:{' '}
              {formatResponseTime(
                completedResponses.reduce(
                  (sum, r) => sum + (r.responseTime || 0),
                  0
                ) / completedResponses.length
              )}
            </div>
          )}

          {/* View Mode Toggle */}
          {responses.length > 1 && (
            <div className="flex items-center gap-1 p-1 glass-hover rounded-lg border border-white/10 flex-shrink-0">
              <button
                onClick={() => setViewMode('stacked')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'stacked'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/10'
                }`}
                title="Stacked View"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewMode('sideBySide')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'sideBySide'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/10'
                }`}
                title="Grid View"
              >
                <Grid3X3 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'stacked' ? (
        <div className="space-y-3">
          {responses.map((response, index) => (
            <ModelResponseCard
              key={response.model}
              response={response}
              isExpanded={expandedModels.has(response.model)}
              copiedModel={copiedModel}
              onToggleExpanded={toggleExpanded}
              onCopyResponse={copyResponse}
              formatModelName={formatModelName}
              formatResponseTime={formatResponseTime}
            />
          ))}
        </div>
      ) : (
        // Improved grid layout with better responsive breakpoints
        <div
          className={`grid gap-4 ${
            responses.length === 1
              ? 'grid-cols-1'
              : responses.length === 2
                ? 'grid-cols-1 xl:grid-cols-2'
                : responses.length === 3
                  ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                  : responses.length === 4
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}
        >
          {responses.map((response, index) => (
            <ModelResponseCard
              key={response.model}
              response={response}
              isExpanded={true} // Always expanded in grid view
              copiedModel={copiedModel}
              onToggleExpanded={toggleExpanded}
              onCopyResponse={copyResponse}
              formatModelName={formatModelName}
              formatResponseTime={formatResponseTime}
              isSideBySide={true}
            />
          ))}
        </div>
      )}

      {completedResponses.length > 1 && viewMode === 'stacked' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 glass-hover rounded-xl border border-white/10">
          <div className="text-sm text-white/60 flex-1">
            Compare responses from {completedResponses.length} models
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const allModels = new Set(responses.map((r) => r.model));
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
        </div>
      )}
    </div>
  );
}
