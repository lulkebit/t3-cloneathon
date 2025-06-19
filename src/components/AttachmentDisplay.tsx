'use client';

import React from 'react';
import { FileImage, FileText, Download } from 'lucide-react';

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
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div
      className={`mb-3 flex flex-wrap gap-2 ${
        isUserMessage ? 'justify-end' : 'justify-start'
      }`}
    >
      {attachments.map((attachment, index) => (
        <div
          key={attachment.id || index}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm max-w-xs"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {attachment.file_type.startsWith('image/') ? (
              <div className="flex items-center gap-2">
                <FileImage size={16} className="text-blue-400 flex-shrink-0" />
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
                <FileText size={16} className="text-red-400 flex-shrink-0" />
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
            <Download size={14} className="text-white/60 hover:text-white" />
          </a>
        </div>
      ))}
    </div>
  );
}
