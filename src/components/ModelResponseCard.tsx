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
  BarChart3,
} from 'lucide-react';
import { ConsensusResponse } from '@/types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  QualityMetricsDisplay,
  QualityScoreBadge,
} from './QualityMetricsDisplay';

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

export function ModelResponseCard({
  response,
  isExpanded,
  copiedModel,
  onToggleExpanded,
  onCopyResponse,
  formatModelName,
  formatResponseTime,
  isSideBySide = false,
}: ModelResponseCardProps) {
  const [showQualityMetrics, setShowQualityMetrics] = useState(false);

  const modelInfo = formatModelName(response.model);
  const hasContent = response.content && response.content.trim().length > 0;
  const hasQualityMetrics =
    response.qualityMetrics && !response.error && !response.isLoading;

  return (
    <div
      className={`glass-hover rounded-xl border transition-all duration-200 ${
        response.error
          ? 'border-red-400/30 bg-red-500/5'
          : response.isLoading
            ? 'border-yellow-400/30 bg-yellow-500/5'
            : 'border-white/10'
      } ${isSideBySide ? 'consensus-card' : ''}`}
    >
      <div
        className={`flex items-start gap-3 p-4 ${hasContent && !isSideBySide ? 'cursor-pointer' : ''} ${isSideBySide ? 'model-header' : ''}`}
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

        <div className="flex-1 min-w-0 pr-2">
          <div className="font-medium text-white/90 truncate text-sm">
            {modelInfo.name}
          </div>
          <div className="text-xs text-white/50 truncate">
            {modelInfo.provider}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 min-w-0">
          {/* Top row - Status and Quality Score */}
          <div className="flex items-center gap-1.5 justify-end">
            {response.error && (
              <div className="flex items-center gap-1 text-red-400 text-xs shrink-0">
                <AlertCircle size={10} />
                <span className="hidden sm:inline">Error</span>
              </div>
            )}

            {response.isLoading && (
              <div className="flex items-center gap-1 text-yellow-400 text-xs shrink-0">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                <span className="hidden sm:inline">Loading...</span>
              </div>
            )}

            {/* Quality Score Badge */}
            {hasQualityMetrics && response.qualityMetrics && (
              <QualityScoreBadge
                score={response.qualityMetrics.qualityScore}
                className="text-xs shrink-0"
              />
            )}
          </div>

          {/* Bottom row - Time and Actions */}
          <div className="flex items-center gap-1 justify-end">
            {response.responseTime && (
              <div className="flex items-center gap-1 text-white/40 text-xs shrink-0">
                <Clock size={10} />
                <span className="text-xs">
                  {formatResponseTime(response.responseTime)}
                </span>
              </div>
            )}

            {hasQualityMetrics && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQualityMetrics(!showQualityMetrics);
                }}
                className="cursor-pointer p-1 rounded hover:bg-white/10 transition-colors shrink-0"
                title="Toggle Quality Metrics"
              >
                <BarChart3
                  size={12}
                  className={`${showQualityMetrics ? 'text-purple-400' : 'text-white/40'} hover:text-white/60`}
                />
              </button>
            )}

            {hasContent && !response.isLoading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyResponse(response.content, response.model);
                }}
                className="cursor-pointer p-1 rounded hover:bg-white/10 transition-colors shrink-0"
                title="Copy Response"
              >
                {copiedModel === response.model ? (
                  <Check size={12} className="text-green-400" />
                ) : (
                  <Copy
                    size={12}
                    className="text-white/40 hover:text-white/60"
                  />
                )}
              </button>
            )}

            {hasContent && !isSideBySide && (
              <button
                className="cursor-pointer p-1 rounded hover:bg-white/10 transition-colors shrink-0"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronUp size={12} className="text-white/40" />
                ) : (
                  <ChevronDown size={12} className="text-white/40" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {hasContent && (isExpanded || isSideBySide) && (
        <div
          className={`px-4 pb-4 border-t border-white/10 ${isSideBySide ? 'flex-1 min-h-0 model-content' : ''}`}
        >
          <div
            className={`mt-4 ${isSideBySide ? 'max-h-96 overflow-y-auto' : ''}`}
          >
            <MarkdownRenderer content={response.content} />

            {/* Quality Metrics Display */}
            {hasQualityMetrics && response.qualityMetrics && (
              <div
                className={`quality-metrics mt-4 pt-4 border-t border-white/20 ${
                  showQualityMetrics ? 'expanded' : 'collapsed'
                }`}
              >
                <QualityMetricsDisplay metrics={response.qualityMetrics} />
              </div>
            )}
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
