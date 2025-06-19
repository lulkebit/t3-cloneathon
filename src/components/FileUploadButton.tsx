'use client';

import React from 'react';
import { Loader2, AlertCircle, Paperclip } from 'lucide-react';
import {
  getModelCapabilities,
  getFileUploadAcceptString,
  getModelCapabilityDescription,
} from '@/lib/model-capabilities';

interface FileUploadButtonProps {
  selectedModel: string;
  isLoading: boolean;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileUploadButton({
  selectedModel,
  isLoading,
  isUploading,
  fileInputRef,
  onFileSelect,
}: FileUploadButtonProps) {
  const modelCapabilities = getModelCapabilities(selectedModel);
  const acceptString = getFileUploadAcceptString(selectedModel);
  const supportsFiles =
    modelCapabilities.supportsImages || modelCapabilities.supportsPDF;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptString}
        onChange={onFileSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading || isUploading || !supportsFiles}
        className="relative group cursor-pointer p-2 rounded-lg hover:bg-white/10 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
      >
        {isUploading ? (
          <Loader2 size={18} className="text-blue-400 animate-spin" />
        ) : !supportsFiles ? (
          <AlertCircle size={18} className="text-red-400" />
        ) : (
          <Paperclip size={18} className="text-white/60 hover:text-white" />
        )}

        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {isUploading
            ? 'Uploading...'
            : !supportsFiles
              ? "Model doesn't support files"
              : `Attach ${getModelCapabilityDescription(selectedModel).toLowerCase()}`}
        </div>
      </button>
    </>
  );
}
