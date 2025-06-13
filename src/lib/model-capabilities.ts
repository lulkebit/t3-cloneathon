export interface ModelCapabilities {
  supportsImages: boolean;
  supportsPDF: boolean;
  supportsVision: boolean;
  maxFileSize?: number; // in MB
  supportedImageTypes?: string[];
  supportedDocumentTypes?: string[];
}

// Define capabilities for different AI models
const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  'google/gemini-2.0-flash-001': {
    supportsImages: true,
    supportsPDF: true,
    supportsVision: true,
    maxFileSize: 20,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: ['application/pdf'],
  },
  'google/gemini-2.0-flash-lite-001': {
    supportsImages: true,
    supportsPDF: true,
    supportsVision: true,
    maxFileSize: 20,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: ['application/pdf'],
  },
  'google/gemini-2.5-flash-preview-05-20': {
    supportsImages: true,
    supportsPDF: true,
    supportsVision: true,
    maxFileSize: 20,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: ['application/pdf'],
  },
  'google/gemini-2.5-pro-preview': {
    supportsImages: true,
    supportsPDF: true,
    supportsVision: true,
    maxFileSize: 20,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: ['application/pdf'],
  },
  'openai/gpt-4o-mini': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 20,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },
  'openai/gpt-4o-2024-11-20': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 20,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },
  'openai/gpt-4.1': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 20,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },
  'openai/gpt-4.1-mini': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 20,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },
  'openai/gpt-4.1-nano': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 20,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },
  'openai/o3-mini': {
    supportsImages: false,
    supportsPDF: false,
    supportsVision: false,
    maxFileSize: 0,
    supportedImageTypes: [],
    supportedDocumentTypes: [],
  },
  'openai/o4-mini': {
    supportsImages: false,
    supportsPDF: false,
    supportsVision: false,
    maxFileSize: 0,
    supportedImageTypes: [],
    supportedDocumentTypes: [],
  },
  'openai/o3': {
    supportsImages: false,
    supportsPDF: false,
    supportsVision: false,
    maxFileSize: 0,
    supportedImageTypes: [],
    supportedDocumentTypes: [],
  },
  'anthropic/claude-opus-4': {
    supportsImages: true,
    supportsPDF: true,
    supportsVision: true,
    maxFileSize: 32,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: ['application/pdf'],
  },
  'anthropic/claude-sonnet-4': {
    supportsImages: true,
    supportsPDF: true,
    supportsVision: true,
    maxFileSize: 32,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: ['application/pdf'],
  },
  'anthropic/claude-3.7-sonnet': {
    supportsImages: true,
    supportsPDF: true,
    supportsVision: true,
    maxFileSize: 32,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: ['application/pdf'],
  },
  'anthropic/claude-3.5-sonnet': {
    supportsImages: true,
    supportsPDF: true,
    supportsVision: true,
    maxFileSize: 32,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: ['application/pdf'],
  },
  'meta-llama/llama-3.3-70b-instruct': {
    supportsImages: false,
    supportsPDF: false,
    supportsVision: false,
    maxFileSize: 0,
    supportedImageTypes: [],
    supportedDocumentTypes: [],
  },
  'meta-llama/llama-4-scout': {
    supportsImages: false,
    supportsPDF: false,
    supportsVision: false,
    maxFileSize: 0,
    supportedImageTypes: [],
    supportedDocumentTypes: [],
  },
  'meta-llama/llama-4-maverick': {
    supportsImages: false,
    supportsPDF: false,
    supportsVision: false,
    maxFileSize: 0,
    supportedImageTypes: [],
    supportedDocumentTypes: [],
  },
  'deepseek/deepseek-chat-v3-0324:free': {
    supportsImages: false,
    supportsPDF: false,
    supportsVision: false,
    maxFileSize: 0,
    supportedImageTypes: [],
    supportedDocumentTypes: [],
  },
  'deepseek/deepseek-r1-0528:free': {
    supportsImages: false,
    supportsPDF: false,
    supportsVision: false,
    maxFileSize: 0,
    supportedImageTypes: [],
    supportedDocumentTypes: [],
  },
  'x-ai/grok-3-beta': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 25,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },
  'x-ai/grok-3-mini-beta': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 25,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },

  // Default capabilities for models not explicitly listed (no file support)
  'default': {
    supportsImages: false,
    supportsPDF: false,
    supportsVision: false,
    maxFileSize: 0,
    supportedImageTypes: [],
    supportedDocumentTypes: [],
  },
};

export function getModelCapabilities(modelId: string): ModelCapabilities {
  // Check for exact match first
  if (MODEL_CAPABILITIES[modelId]) {
    return MODEL_CAPABILITIES[modelId];
  }

  // Check for partial matches (useful for versioned models)
  for (const [key, capabilities] of Object.entries(MODEL_CAPABILITIES)) {
    if (key !== 'default' && modelId.includes(key)) {
      return capabilities;
    }
  }

  // Return default (no file support) for unknown models
  return MODEL_CAPABILITIES['default'];
}

export function canModelProcessFileType(modelId: string, fileType: string): boolean {
  const capabilities = getModelCapabilities(modelId);
  
  if (fileType.startsWith('image/')) {
    return capabilities.supportsImages && 
           (capabilities.supportedImageTypes?.includes(fileType) ?? false);
  }
  
  if (fileType === 'application/pdf') {
    return capabilities.supportsPDF && 
           (capabilities.supportedDocumentTypes?.includes(fileType) ?? false);
  }
  
  return false;
}

export function getMaxFileSizeForModel(modelId: string): number {
  const capabilities = getModelCapabilities(modelId);
  return capabilities.maxFileSize ?? 0;
}

export function getSupportedFileTypesForModel(modelId: string): string[] {
  const capabilities = getModelCapabilities(modelId);
  return [
    ...(capabilities.supportedImageTypes ?? []),
    ...(capabilities.supportedDocumentTypes ?? []),
  ];
}

export function getFileUploadAcceptString(modelId: string): string {
  const supportedTypes = getSupportedFileTypesForModel(modelId);
  
  if (supportedTypes.length === 0) {
    return '';
  }
  
  // Convert MIME types to file extensions for the accept attribute
  const acceptTypes: string[] = [];
  
  if (supportedTypes.some(type => type.startsWith('image/'))) {
    acceptTypes.push('image/*');
  }
  
  if (supportedTypes.includes('application/pdf')) {
    acceptTypes.push('.pdf');
  }
  
  return acceptTypes.join(',');
}

export function getModelCapabilityDescription(modelId: string): string {
  const capabilities = getModelCapabilities(modelId);
  
  if (!capabilities.supportsImages && !capabilities.supportsPDF) {
    return 'Text only';
  }
  
  const supportedTypes: string[] = [];
  
  if (capabilities.supportsImages) {
    supportedTypes.push('images');
  }
  
  if (capabilities.supportsPDF) {
    supportedTypes.push('PDFs');
  }
  
  return `Supports ${supportedTypes.join(' and ')}`;
} 