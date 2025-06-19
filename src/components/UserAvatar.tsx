'use client';

import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  user: any;
  size?: number;
}

export function UserAvatar({ user, size = 16 }: UserAvatarProps) {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30">
      {user?.user_metadata?.avatar_url ? (
        <img
          src={user.user_metadata.avatar_url}
          alt="User Avatar"
          className="w-full h-full object-cover"
        />
      ) : (
        <User size={size} className="text-white/90" />
      )}
    </div>
  );
}
