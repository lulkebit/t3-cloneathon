'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function LoadingIndicator() {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      <div className="flex space-x-1.5">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: index * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <motion.span
        className="text-sm text-white/60 font-medium"
        animate={{ 
          opacity: [0.6, 1, 0.6],
          y: [0, -1, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
      </motion.span>
    </div>
  );
} 