'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileImage, FileText, X } from 'lucide-react';
import { Attachment } from '@/types/chat';

interface AttachmentListProps {
  attachments: Attachment[];
  onRemoveAttachment: (index: number) => void;
}

export function AttachmentList({
  attachments,
  onRemoveAttachment,
}: AttachmentListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <FileImage size={16} className="text-blue-400" />;
    } else if (fileType === 'application/pdf') {
      return <FileText size={16} className="text-red-400" />;
    } else {
      return <FileText size={16} className="text-white/60" />;
    }
  };

  if (attachments.length === 0) return null;

  return (
    <div className="mb-3">
      <AnimatePresence>
        {attachments.map((attachment, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mb-2 group hover:bg-white/8 transition-colors"
          >
            <div className="flex-shrink-0">
              {getFileIcon(attachment.file_type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-white/80 font-medium truncate">
                  {attachment.filename}
                </p>
                <span className="text-xs text-white/40 flex-shrink-0">
                  {formatFileSize(attachment.file_size)}
                </span>
              </div>
              {attachment.file_type.startsWith('image/') && (
                <p className="text-xs text-white/40 mt-1">Image file</p>
              )}
              {attachment.file_type === 'application/pdf' && (
                <p className="text-xs text-white/40 mt-1">PDF document</p>
              )}
            </div>

            <motion.button
              type="button"
              onClick={() => onRemoveAttachment(index)}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-500/20 transition-colors group/remove"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X
                size={14}
                className="text-white/40 group-hover/remove:text-red-400"
              />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
