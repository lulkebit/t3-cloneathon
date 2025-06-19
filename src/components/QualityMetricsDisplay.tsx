'use client';

import React from 'react';
import { ResponseQualityMetrics } from '@/types/chat';
import { ResponseQualityAnalyzer } from '@/lib/response-quality-analyzer';

interface QualityMetricsDisplayProps {
  metrics: ResponseQualityMetrics & {
    category?: string;
    insights?: string[];
  };
  className?: string;
}

export function QualityMetricsDisplay({
  metrics,
  className = '',
}: QualityMetricsDisplayProps) {
  const category =
    metrics.category ||
    ResponseQualityAnalyzer.getQualityCategory(metrics.qualityScore);
  const insights =
    metrics.insights || ResponseQualityAnalyzer.getQualityInsights(metrics);

  const getScoreColor = (score: number) => {
    if (score >= 85)
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score >= 70) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    if (score >= 55)
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (score >= 40)
      return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 55) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatResponseTime = (time: number) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  const formatCost = (cost?: number) => {
    if (!cost) return 'N/A';
    if (cost < 0.001) return `$${(cost * 1000).toFixed(3)}k`;
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div
      className={`glass-strong rounded-xl p-4 space-y-4 border border-white/10 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/90">
          Response Quality Analysis
        </h3>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium border ${getScoreColor(metrics.qualityScore)}`}
        >
          {category} ({metrics.qualityScore}/100)
        </div>
      </div>

      {/* Main Quality Score */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/60">Overall Quality</span>
          <span className="text-sm font-medium text-white/90">
            {metrics.qualityScore}/100
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getScoreBarColor(metrics.qualityScore)}`}
            style={{ width: `${metrics.qualityScore}%` }}
          />
        </div>
      </div>

      {/* Quality Dimensions Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-white/50">Relevance</span>
            <span className="text-xs font-medium text-white/80">
              {metrics.relevanceScore}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1">
            <div
              className={`h-1 rounded-full ${getScoreBarColor(metrics.relevanceScore)}`}
              style={{ width: `${metrics.relevanceScore}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-white/50">Clarity</span>
            <span className="text-xs font-medium text-white/80">
              {metrics.clarityScore}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1">
            <div
              className={`h-1 rounded-full ${getScoreBarColor(metrics.clarityScore)}`}
              style={{ width: `${metrics.clarityScore}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-white/50">Coherence</span>
            <span className="text-xs font-medium text-white/80">
              {metrics.coherenceScore}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1">
            <div
              className={`h-1 rounded-full ${getScoreBarColor(metrics.coherenceScore)}`}
              style={{ width: `${metrics.coherenceScore}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-white/50">Completeness</span>
            <span className="text-xs font-medium text-white/80">
              {metrics.completenessScore}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1">
            <div
              className={`h-1 rounded-full ${getScoreBarColor(metrics.completenessScore)}`}
              style={{ width: `${metrics.completenessScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/10">
        <div className="text-center">
          <div className="text-xs text-white/50">Response Time</div>
          <div className="text-sm font-medium text-white/90">
            {formatResponseTime(metrics.responseTime)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-white/50">Words</div>
          <div className="text-sm font-medium text-white/90">
            {metrics.wordCount}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-white/50">Cost</div>
          <div className="text-sm font-medium text-white/90">
            {formatCost(metrics.cost)}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4 text-xs text-white/60">
        <div>
          <span className="text-white/50">Readability:</span>{' '}
          {metrics.readabilityScore}/100
        </div>
        <div>
          <span className="text-white/50">Avg. sentence:</span>{' '}
          {metrics.averageSentenceLength.toFixed(1)} words
        </div>
        <div>
          <span className="text-white/50">Tokens:</span>{' '}
          {metrics.tokenUsage.totalTokens}
        </div>
        <div>
          <span className="text-white/50">Temperature:</span>{' '}
          {metrics.temperature || 'N/A'}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="pt-2 border-t border-white/10">
          <div className="text-xs font-medium text-white/80 mb-2">Insights</div>
          <ul className="space-y-1">
            {insights.map((insight, index) => (
              <li
                key={index}
                className="text-xs text-white/60 flex items-start"
              >
                <span className="text-white/40 mr-2">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Compact version for inline display
export function QualityScoreBadge({
  score,
  className = '',
  onClick,
}: {
  score: number;
  className?: string;
  onClick?: () => void;
}) {
  const category = ResponseQualityAnalyzer.getQualityCategory(score);
  const getScoreColor = (score: number) => {
    if (score >= 85)
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score >= 70) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    if (score >= 55)
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (score >= 40)
      return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  return (
    <div
      className={`inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium ${getScoreColor(score)} ${className} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {score}/100 {category}
    </div>
  );
}
