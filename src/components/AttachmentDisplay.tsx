'use client';

import React, { useState } from 'react';
import { FileImage, FileText, Download, X } from 'lucide-react';

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface Attachment {
  id?: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_url: string;
}

interface AttachmentDisplayProps {
  attachments: Attachment[];
  isUserMessage?: boolean;
}

export function AttachmentDisplay({
  attachments,
  isUserMessage = false,
}: AttachmentDisplayProps) {
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set()
  );
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleImageError = (attachmentId: string) => {
    setImageLoadErrors((prev) => new Set(prev).add(attachmentId));
  };

  const openFullscreen = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  return (
    <>
      <div
        className={`mb-3 flex flex-wrap gap-2 ${
          isUserMessage ? 'justify-end' : 'justify-start'
        }`}
      >
        {attachments.map((attachment, index) => {
          const attachmentKey =
            attachment.id || `${attachment.filename}-${index}`;
          const isImage = attachment.file_type.startsWith('image/');
          const hasImageError = imageLoadErrors.has(attachmentKey);

          if (isImage && !hasImageError) {
            // Image preview
            return (
              <div
                key={attachmentKey}
                className="relative group cursor-pointer"
                onClick={() => openFullscreen(attachment.file_url)}
              >
                <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  <img
                    src={attachment.file_url}
                    alt={attachment.filename}
                    className="w-32 h-32 object-cover transition-transform group-hover:scale-105"
                    onError={() => handleImageError(attachmentKey)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                    <div className="text-xs font-medium truncate">
                      {attachment.filename}
                    </div>
                    <div className="text-xs text-white/70">
                      {formatFileSize(attachment.file_size)}
                    </div>
                  </div>
                </div>
                <a
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-1 right-1 p-1 rounded bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={12} className="text-white" />
                </a>
              </div>
            );
          } else {
            // Non-image or image with error - show as before
            return (
              <div
                key={attachmentKey}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm max-w-xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isImage ? (
                    <div className="flex items-center gap-2">
                      <FileImage
                        size={16}
                        className="text-blue-400 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-white/80 truncate text-xs">
                          {attachment.filename}
                        </div>
                        <div className="text-white/40 text-xs">
                          {formatFileSize(attachment.file_size)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileText
                        size={16}
                        className="text-red-400 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-white/80 truncate text-xs">
                          {attachment.filename}
                        </div>
                        <div className="text-white/40 text-xs">
                          {formatFileSize(attachment.file_size)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <a
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  <Download
                    size={14}
                    className="text-white/60 hover:text-white"
                  />
                </a>
              </div>
            );
          }
        })}
      </div>

      {/* Fullscreen image modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeFullscreen}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={fullscreenImage}
              alt="Fullscreen preview"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
