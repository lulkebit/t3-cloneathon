'use client';

import React from 'react';
import { UserAvatar } from './UserAvatar';
import { AssistantAvatar } from './AssistantAvatar';

const formatModelName = (model: string) => {
  const parts = model.split('/');
  if (parts.length === 2) {
    const [provider, modelName] = parts;
    return modelName
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
  return model;
};

const getUserDisplayName = (user: any) => {
  if (!user?.user_metadata) return 'You';

  const metadata = user.user_metadata;
  return (
    metadata.full_name ||
    metadata.name ||
    metadata.display_name ||
    metadata.first_name ||
    (metadata.given_name && metadata.family_name
      ? `${metadata.given_name} ${metadata.family_name}`
      : null) ||
    metadata.given_name ||
    metadata.nickname ||
    'You'
  );
};

interface MessageHeaderProps {
  role: 'user' | 'assistant';
  user?: any;
  model?: string;
  isConsensus?: boolean;
  createdAt: string;
  content?: string;
}

export function MessageHeader({
  role,
  user,
  model,
  isConsensus = false,
  createdAt,
  content,
}: MessageHeaderProps) {
  // Check if this is a consensus message
  const isConsensusMessage =
    isConsensus ||
    (content && content.startsWith('[{') && content.includes('"model"'));

  return (
    <div
      className={`flex items-center gap-3 mb-3 ${
        role === 'user' ? 'flex-row-reverse' : ''
      }`}
    >
      {role === 'user' ? (
        <UserAvatar user={user} />
      ) : (
        <AssistantAvatar model={model} isConsensus={!!isConsensusMessage} />
      )}

      <div
        className={`flex items-center gap-2 ${
          role === 'user' ? 'flex-row-reverse' : ''
        }`}
      >
        <span
          className={`text-sm font-medium ${
            role === 'user' ? 'text-white/90' : 'text-blue-400'
          }`}
        >
          {role === 'user'
            ? getUserDisplayName(user)
            : isConsensusMessage
              ? 'Multi-Model Consensus'
              : model
                ? formatModelName(model)
                : 'Assistant'}
        </span>
        <span className="text-xs text-white/40">
          {new Date(createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
