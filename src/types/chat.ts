export interface Attachment {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  isOptimistic?: boolean;
  isStreaming?: boolean;
  isLoading?: boolean;
  attachments?: Attachment[];
  isConsensus?: boolean;
  consensusResponses?: ConsensusResponse[];
}

export interface ConsensusResponse {
  model: string;
  content: string;
  isStreaming?: boolean;
  isLoading?: boolean;
  error?: string;
  responseTime?: number;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface Profile {
  id: string;
  email: string;
  openrouter_api_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string;
  };
  top_provider: {
    max_completion_tokens: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MultiModelRequest {
  message: string;
  models: string[];
  conversationId?: string;
  attachments?: Attachment[];
} 