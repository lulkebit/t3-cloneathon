'use client';

import React from 'react';

export function LoadingIndicator() {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      <div className="flex space-x-1.5">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse"
            style={{
              animationDelay: `${index * 0.2}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>
    </div>
  );
}
