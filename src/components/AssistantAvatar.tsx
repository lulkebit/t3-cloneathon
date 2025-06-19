'use client';

import React from 'react';
import { Users } from 'lucide-react';

const getProviderLogo = (model: string) => {
  const providerLogos: Record<string, string> = {
    anthropic: '/logos/anthropic.svg',
    openai: '/logos/openai.svg',
    google: '/logos/google.svg',
    'meta-llama': '/logos/meta.svg',
    mistralai: '/logos/mistral.svg',
    deepseek: '/logos/deepseek.svg',
  };

  const provider = model.split('/')[0];
  return providerLogos[provider.toLowerCase()] || null;
};

interface AssistantAvatarProps {
  model?: string;
  isConsensus?: boolean;
  size?: number;
}

export function AssistantAvatar({
  model,
  isConsensus = false,
  size = 16,
}: AssistantAvatarProps) {
  const avatarClasses = isConsensus
    ? 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30'
    : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30';

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${avatarClasses}`}
    >
      {isConsensus ? (
        <Users size={size} className="text-purple-400" />
      ) : (
        (() => {
          const logoUrl = model ? getProviderLogo(model) : null;
          if (logoUrl) {
            return (
              <img
                src={logoUrl}
                alt="Provider Logo"
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const botIcon = target.nextElementSibling as HTMLElement;
                  if (botIcon) {
                    botIcon.classList.remove('hidden');
                  }
                }}
              />
            );
          }

          // Fallback to AI image for assistant messages
          return (
            <img
              src="/ai.png"
              alt="AI Assistant"
              className="w-4 h-4 object-contain"
            />
          );
        })()
      )}
    </div>
  );
}
