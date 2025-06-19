import { ResponseQualityMetrics } from '@/types/chat';

export interface QualityAnalysisInput {
  response: string;
  prompt: string;
  responseTime: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  temperature?: number;
  topP?: number;
  finishReason?: string;
}

export class ResponseQualityAnalyzer {
  /**
   * Analyze the quality of an AI response
   */
  static analyzeResponse(input: QualityAnalysisInput): ResponseQualityMetrics {
    const {
      response,
      prompt,
      responseTime,
      tokenUsage,
      cost,
      temperature,
      topP,
      finishReason,
    } = input;

    // Basic text metrics
    const wordCount = this.countWords(response);
    const sentenceCount = this.countSentences(response);
    const averageSentenceLength =
      sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const readabilityScore = this.calculateFleschScore(response);

    // Quality scoring
    const coherenceScore = this.calculateCoherenceScore(response);
    const relevanceScore = this.calculateRelevanceScore(response, prompt);
    const completenessScore = this.calculateCompletenessScore(response, prompt);
    const clarityScore = this.calculateClarityScore(response);

    // Overall quality score (weighted average)
    const qualityScore = this.calculateOverallQualityScore({
      coherenceScore,
      relevanceScore,
      completenessScore,
      clarityScore,
      responseTime,
      wordCount,
      readabilityScore,
    });

    return {
      responseTime,
      tokenUsage,
      cost,
      qualityScore,
      coherenceScore,
      relevanceScore,
      completenessScore,
      clarityScore,
      wordCount,
      sentenceCount,
      averageSentenceLength,
      readabilityScore,
      temperature,
      topP,
      finishReason,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Count words in text
   */
  private static countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Count sentences in text
   */
  private static countSentences(text: string): number {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    return sentences.length;
  }

  /**
   * Calculate Flesch Reading Ease Score
   * Higher scores indicate easier readability
   */
  private static calculateFleschScore(text: string): number {
    const words = this.countWords(text);
    const sentences = this.countSentences(text);

    if (sentences === 0 || words === 0) return 0;

    // Count syllables (approximation)
    const syllables = this.countSyllables(text);

    // Flesch Reading Ease formula
    const score =
      206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

    // Normalize to 0-100 scale
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Approximate syllable counting
   */
  private static countSyllables(text: string): number {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.reduce((total, word) => {
      // Basic syllable counting rules
      let syllables = word.match(/[aeiouy]+/g)?.length || 1;

      // Adjustments
      if (word.endsWith('e')) syllables--;
      if (word.endsWith('le') && word.length > 2) syllables++;
      if (syllables === 0) syllables = 1;

      return total + syllables;
    }, 0);
  }

  /**
   * Calculate coherence score based on text structure and flow
   */
  private static calculateCoherenceScore(response: string): number {
    let score = 50; // Base score

    // Check for logical connectors
    const connectors = [
      'however',
      'therefore',
      'furthermore',
      'moreover',
      'consequently',
      'additionally',
      'meanwhile',
      'nevertheless',
      'thus',
      'hence',
      'first',
      'second',
      'finally',
      'in conclusion',
      'for example',
      'specifically',
      'in other words',
      'that is',
      'namely',
    ];

    const connectorCount = connectors.reduce((count, connector) => {
      return count + (response.toLowerCase().includes(connector) ? 1 : 0);
    }, 0);

    // Bonus for logical connectors (up to 20 points)
    score += Math.min(20, connectorCount * 3);

    // Check for consistent structure
    const hasStructure =
      /^\s*\d+\.|\*|\-/.test(response) ||
      response.includes('\n\n') ||
      /#{1,6}\s/.test(response); // Headers

    if (hasStructure) score += 15;

    // Penalty for repetitive content
    const words = response.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;

    if (repetitionRatio < 0.5) score -= 20;
    else if (repetitionRatio > 0.8) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate relevance score based on keyword overlap and topic consistency
   */
  private static calculateRelevanceScore(
    response: string,
    prompt: string
  ): number {
    let score = 50; // Base score

    // Extract keywords from prompt (simple approach)
    const promptKeywords = this.extractKeywords(prompt.toLowerCase());
    const responseKeywords = this.extractKeywords(response.toLowerCase());

    // Calculate keyword overlap
    const overlap = promptKeywords.filter((keyword) =>
      responseKeywords.includes(keyword)
    ).length;

    const overlapRatio =
      promptKeywords.length > 0 ? overlap / promptKeywords.length : 0;

    // Bonus for keyword overlap (up to 40 points)
    score += overlapRatio * 40;

    // Check if response directly addresses the prompt
    const questionWords = [
      'what',
      'how',
      'why',
      'when',
      'where',
      'who',
      'which',
    ];
    const promptHasQuestion = questionWords.some((word) =>
      prompt.toLowerCase().includes(word)
    );

    if (promptHasQuestion) {
      // Check if response provides direct answers
      const hasDirectAnswer =
        response.includes('because') ||
        response.includes('answer') ||
        /\b(is|are|was|were)\b/.test(response) ||
        response.includes('explanation');

      if (hasDirectAnswer) score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate completeness score based on response depth and coverage
   */
  private static calculateCompletenessScore(
    response: string,
    prompt: string
  ): number {
    let score = 50; // Base score

    const wordCount = this.countWords(response);
    const promptWordCount = this.countWords(prompt);

    // Length appropriateness (not too short, not excessively long)
    const expectedLength = Math.max(20, promptWordCount * 2);

    if (wordCount < expectedLength * 0.5) {
      score -= 30; // Too short
    } else if (
      wordCount >= expectedLength * 0.5 &&
      wordCount <= expectedLength * 3
    ) {
      score += 20; // Good length
    } else if (wordCount > expectedLength * 5) {
      score -= 10; // Potentially too verbose
    }

    // Check for examples or explanations
    const hasExamples = /for example|such as|instance|specifically|like/.test(
      response.toLowerCase()
    );
    if (hasExamples) score += 15;

    // Check for multiple perspectives or comprehensive coverage
    const hasMultiplePerspectives =
      response.includes('on the other hand') ||
      response.includes('alternatively') ||
      response.includes('another approach') ||
      /\b(also|additionally|furthermore)\b/.test(response);

    if (hasMultiplePerspectives) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate clarity score based on readability and structure
   */
  private static calculateClarityScore(response: string): number {
    let score = 50; // Base score

    const readabilityScore = this.calculateFleschScore(response);

    // Bonus for good readability
    if (readabilityScore >= 60) score += 20;
    else if (readabilityScore >= 30) score += 10;
    else score -= 15;

    // Check for clear sentence structure
    const sentences = response
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const averageLength =
      sentences.reduce((sum, s) => sum + this.countWords(s), 0) /
      sentences.length;

    // Optimal sentence length is 15-20 words
    if (averageLength >= 10 && averageLength <= 25) {
      score += 15;
    } else if (averageLength > 30) {
      score -= 20; // Too complex
    }

    // Check for jargon or overly complex language
    const complexWords = response.match(/\b\w{10,}\b/g)?.length || 0;
    const totalWords = this.countWords(response);
    const complexRatio = complexWords / totalWords;

    if (complexRatio > 0.2) score -= 15; // Too much jargon

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate overall quality score with weighted factors
   */
  private static calculateOverallQualityScore(metrics: {
    coherenceScore: number;
    relevanceScore: number;
    completenessScore: number;
    clarityScore: number;
    responseTime: number;
    wordCount: number;
    readabilityScore: number;
  }): number {
    const {
      coherenceScore,
      relevanceScore,
      completenessScore,
      clarityScore,
      responseTime,
      wordCount,
      readabilityScore,
    } = metrics;

    // Weighted average of quality dimensions
    let score =
      relevanceScore * 0.3 + // Most important
      clarityScore * 0.25 + // Very important
      coherenceScore * 0.2 + // Important
      completenessScore * 0.2 + // Important
      readabilityScore * 0.05; // Nice to have

    // Response time factor (penalty for very slow responses)
    if (responseTime > 30000) {
      // > 30 seconds
      score -= 10;
    } else if (responseTime > 10000) {
      // > 10 seconds
      score -= 5;
    }

    // Word count factor (penalty for very short responses)
    if (wordCount < 10) {
      score -= 20;
    } else if (wordCount < 5) {
      score -= 40;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Extract keywords from text (simple approach)
   */
  private static extractKeywords(text: string): string[] {
    // Remove common stop words
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'this',
      'that',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'me',
      'him',
      'her',
      'us',
      'them',
    ]);

    return (
      text
        .toLowerCase()
        .match(/\b\w{3,}\b/g) // Words with 3+ characters
        ?.filter((word) => !stopWords.has(word))
        ?.filter((word, index, arr) => arr.indexOf(word) === index) || [] // Unique
    );
  }

  /**
   * Get quality category based on score
   */
  static getQualityCategory(score: number): string {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Very Poor';
  }

  /**
   * Get quality insights and recommendations
   */
  static getQualityInsights(metrics: ResponseQualityMetrics): string[] {
    const insights: string[] = [];

    if (metrics.relevanceScore < 50) {
      insights.push('Response may not fully address the original question');
    }

    if (metrics.clarityScore < 50) {
      insights.push('Response could be clearer and easier to understand');
    }

    if (metrics.coherenceScore < 50) {
      insights.push('Response lacks logical flow and structure');
    }

    if (metrics.completenessScore < 50) {
      insights.push('Response may be incomplete or lack sufficient detail');
    }

    if (metrics.readabilityScore < 30) {
      insights.push('Response is difficult to read and may be too complex');
    }

    if (metrics.responseTime > 20000) {
      insights.push('Response time was slower than optimal');
    }

    if (metrics.wordCount < 20) {
      insights.push('Response is quite brief and may lack detail');
    }

    // Positive insights
    if (metrics.qualityScore >= 85) {
      insights.push('Excellent overall response quality');
    } else if (metrics.qualityScore >= 70) {
      insights.push('Good response quality with minor areas for improvement');
    }

    return insights;
  }
}
