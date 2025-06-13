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
  // OpenAI GPT-4 Vision models
  'openai/gpt-4o': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 20,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },
  'openai/gpt-4o-mini': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 20,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },
  'openai/gpt-4-vision-preview': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 20,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },

  // Anthropic Claude models (some support images)
  'anthropic/claude-3.5-sonnet': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 10,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },
  'anthropic/claude-3-opus': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 10,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },
  'anthropic/claude-3-sonnet': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 10,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },
  'anthropic/claude-3-haiku': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 10,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },

  // Google Gemini models (support images)
  'google/gemini-pro-vision': {
    supportsImages: true,
    supportsPDF: false,
    supportsVision: true,
    maxFileSize: 10,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: [],
  },
  'google/gemini-1.5-pro': {
    supportsImages: true,
    supportsPDF: true,
    supportsVision: true,
    maxFileSize: 10,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: ['application/pdf'],
  },
  'google/gemini-1.5-flash': {
    supportsImages: true,
    supportsPDF: true,
    supportsVision: true,
    maxFileSize: 10,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocumentTypes: ['application/pdf'],
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