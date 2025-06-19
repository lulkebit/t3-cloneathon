'use client';

import React, { useState } from 'react';
import {
  Brain,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  List,
  Grid3X3,
} from 'lucide-react';
import { ConsensusResponse } from '@/types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';

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
          <div className="flex items-center gap-1 ml-3 p-1 glass-hover rounded-lg border border-white/10">
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
              title="Side by Side View"
            >
              <Grid3X3 size={14} />
            </button>
          </div>
        )}
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
        <div
          className={`grid gap-4 ${
            responses.length === 2
              ? 'grid-cols-1 lg:grid-cols-2'
              : responses.length === 3
                ? 'grid-cols-1 lg:grid-cols-3'
                : responses.length >= 4
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                  : 'grid-cols-1'
          }`}
        >
          {responses.map((response, index) => (
            <ModelResponseCard
              key={response.model}
              response={response}
              isExpanded={true} // Always expanded in side-by-side view
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
        <div className="flex items-center gap-2 p-3 glass-hover rounded-xl border border-white/10">
          <div className="text-sm text-white/60 flex-1">
            Compare responses from {completedResponses.length} models
          </div>
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
      )}
    </div>
  );
}

// Extract ModelResponseCard as a separate component for reusability
interface ModelResponseCardProps {
  response: ConsensusResponse;
  isExpanded: boolean;
  copiedModel: string | null;
  onToggleExpanded: (model: string) => void;
  onCopyResponse: (content: string, model: string) => void;
  formatModelName: (model: string) => {
    name: string;
    provider: string;
    logo: string | null;
  };
  formatResponseTime: (ms: number) => string;
  isSideBySide?: boolean;
}

function ModelResponseCard({
  response,
  isExpanded,
  copiedModel,
  onToggleExpanded,
  onCopyResponse,
  formatModelName,
  formatResponseTime,
  isSideBySide = false,
}: ModelResponseCardProps) {
  const modelInfo = formatModelName(response.model);
  const hasContent = response.content && response.content.trim().length > 0;

  return (
    <div
      className={`glass-hover rounded-xl border transition-all duration-200 ${
        response.error
          ? 'border-red-400/30 bg-red-500/5'
          : response.isLoading
            ? 'border-yellow-400/30 bg-yellow-500/5'
            : 'border-white/10'
      } ${isSideBySide ? 'h-full flex flex-col' : ''}`}
    >
      <div
        className={`flex items-center gap-3 p-4 ${hasContent && !isSideBySide ? 'cursor-pointer' : ''}`}
        onClick={() =>
          hasContent && !isSideBySide && onToggleExpanded(response.model)
        }
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
          <div className="text-sm text-white/50">{modelInfo.provider}</div>
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
                onCopyResponse(response.content, response.model);
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

          {hasContent && !isSideBySide && (
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

      {hasContent && (isExpanded || isSideBySide) && (
        <div
          className={`px-4 pb-4 border-t border-white/10 ${isSideBySide ? 'flex-1 overflow-hidden' : ''}`}
        >
          <div
            className={`mt-4 ${isSideBySide ? 'h-full overflow-y-auto' : ''}`}
          >
            <MarkdownRenderer content={response.content} />
          </div>
        </div>
      )}

      {response.error && (
        <div className="px-4 pb-4 border-t border-red-400/20">
          <div className="mt-4 p-3 bg-red-500/10 border border-red-400/20 rounded-lg">
            <div className="text-red-400 text-sm font-medium mb-1">Error</div>
            <div className="text-red-300/80 text-sm">{response.error}</div>
          </div>
        </div>
      )}

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

      {response.isStreaming && hasContent && !isExpanded && !isSideBySide && (
        <div className="px-4 pb-4 border-t border-white/10">
          <div className="mt-4 text-white/70 text-sm line-clamp-2">
            {response.content.substring(0, 150)}
            {response.content.length > 150 && '...'}
          </div>
        </div>
      )}
    </div>
  );
}
