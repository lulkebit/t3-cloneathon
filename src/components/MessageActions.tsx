"use client";

import React from "react";
import { Copy, Check, RotateCcw, Loader2 } from "lucide-react";

interface MessageActionsProps {
  messageId: string;
  messageIndex: number;
  content: string;
  copiedId: string | null;
  retryingId: string | null;
  isAssistantMessage: boolean;
  canRetry: boolean;
  onCopy: (messageId: string, content: string) => Promise<void>;
  onRetry: (messageId: string, messageIndex: number) => Promise<void>;
}

export function MessageActions({
  messageId,
  messageIndex,
  content,
  copiedId,
  retryingId,
  isAssistantMessage,
  canRetry,
  onCopy,
  onRetry,
}: MessageActionsProps) {
  return (
    <div className="flex justify-start gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="relative group/copy">
        <button
          onClick={() => onCopy(messageId, content)}
          className="cursor-pointer p-2 rounded-lg hover:bg-white/10 transition-colors duration-150"
        >
          {copiedId === messageId ? (
            <Check size={16} className="text-green-400" />
          ) : (
            <Copy size={16} className="text-white/60 hover:text-white" />
          )}
        </button>

        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/copy:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          {copiedId === messageId ? "Copied!" : "Copy"}
        </div>
      </div>

      {isAssistantMessage && (
        <div className="relative group/retry">
          <button
            onClick={() => onRetry(messageId, messageIndex)}
            disabled={retryingId === messageId || !canRetry}
            className="cursor-pointer p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {retryingId === messageId ? (
              <Loader2 size={16} className="text-blue-400 animate-spin" />
            ) : (
              <RotateCcw size={16} className="text-white/60 hover:text-white" />
            )}
          </button>

          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/retry:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            {retryingId === messageId ? "Retrying..." : "Retry"}
          </div>
        </div>
      )}
    </div>
  );
}
