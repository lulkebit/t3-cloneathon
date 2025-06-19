import {
  ChatMessage,
  OpenRouterModel,
  ResponseQualityMetrics,
} from '@/types/chat';
import {
  ResponseQualityAnalyzer,
  QualityAnalysisInput,
} from './response-quality-analyzer';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export class OpenRouterService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async createChatCompletion(
    model: string,
    messages: ChatMessage[],
    onChunk?: (chunk: string) => void,
    referer?: string,
    enableQualityScoring: boolean = true
  ): Promise<{ content: string; qualityMetrics?: ResponseQualityMetrics }> {
    const startTime = Date.now();

    try {
      const requestBody = {
        model,
        messages,
        stream: !!onChunk,
        max_tokens: 4000,
        temperature: 0.7,
        // Enable usage tracking for quality metrics
        usage: { include: true },
      };

      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(referer && { 'HTTP-Referer': referer }),
          'X-Title': 'T3 Cloneathon Chat',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || 'Failed to create completion'
        );
      }

      let fullResponse = '';
      let responseData: any = null;
      let responseTime = 0;

      if (onChunk && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
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
                  const content = parsed.choices?.[0]?.delta?.content;

                  if (content) {
                    fullResponse += content;
                    onChunk(content);
                  }

                  // Capture final response data with usage info
                  if (parsed.usage && !responseData) {
                    responseData = parsed;
                    responseTime = Date.now() - startTime;
                  }
                } catch (e) {}
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        responseData = await response.json();
        fullResponse = responseData.choices?.[0]?.message?.content || '';
        responseTime = Date.now() - startTime;
      }

      let qualityMetrics: ResponseQualityMetrics | undefined;

      // Calculate quality metrics if enabled and we have a valid response
      if (enableQualityScoring && fullResponse.trim() && messages.length > 0) {
        try {
          // Get the user's prompt (last user message)
          const userMessage = messages
            .slice()
            .reverse()
            .find((msg) => msg.role === 'user');

          if (userMessage) {
            const prompt =
              typeof userMessage.content === 'string'
                ? userMessage.content
                : JSON.stringify(userMessage.content);

            const analysisInput: QualityAnalysisInput = {
              response: fullResponse,
              prompt,
              responseTime,
              tokenUsage: {
                promptTokens: responseData?.usage?.prompt_tokens || 0,
                completionTokens: responseData?.usage?.completion_tokens || 0,
                totalTokens: responseData?.usage?.total_tokens || 0,
              },
              cost: responseData?.usage?.cost,
              temperature: requestBody.temperature,
              topP: undefined, // Could be added to request if needed
              finishReason: responseData?.choices?.[0]?.finish_reason,
            };

            qualityMetrics =
              ResponseQualityAnalyzer.analyzeResponse(analysisInput);
          }
        } catch (qualityError) {
          console.error('Error calculating quality metrics:', qualityError);
          // Don't fail the entire request if quality analysis fails
        }
      }

      return {
        content: fullResponse,
        qualityMetrics,
      };
    } catch (error) {
      console.error('Error creating chat completion:', error);
      throw error;
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const getPopularModels = (): string[] => [
  'google/gemini-2.0-flash-001',
  'google/gemini-2.0-flash-lite-001',
  'google/gemini-2.5-flash-preview-05-20',
  'google/gemini-2.5-pro-preview',
  'openai/gpt-4o-mini',
  'openai/gpt-4o-2024-11-20',
  'openai/gpt-4.1',
  'openai/gpt-4.1-mini',
  'openai/gpt-4.1-nano',
  'openai/o3-mini',
  'openai/o4-mini',
  'anthropic/claude-opus-4',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3.7-sonnet',
  'anthropic/claude-3.5-sonnet',
  'meta-llama/llama-3.3-70b-instruct',
  'meta-llama/llama-4-scout',
  'meta-llama/llama-4-maverick',
  'deepseek/deepseek-chat-v3-0324:free',
  'deepseek/deepseek-r1-0528:free',
  'x-ai/grok-3-beta',
  'x-ai/grok-3-mini-beta',
];
