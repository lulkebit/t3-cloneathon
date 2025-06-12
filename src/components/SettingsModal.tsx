'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';
import { X, Key, Save, Loader2, ExternalLink, Shield, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { profile, refreshProfile } = useChat();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (profile?.openrouter_api_key) {
      setApiKey(profile.openrouter_api_key);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your OpenRouter API key');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openrouter_api_key: apiKey.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save API key');
      }

      await refreshProfile();
      onClose();
    } catch (error) {
      console.error('Error saving API key:', error);
      alert(error instanceof Error ? error.message : 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="glass-strong rounded-3xl max-w-lg w-full p-8 relative border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 glass rounded-2xl flex items-center justify-center">
                  <Key size={20} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Settings</h2>
              </motion.div>
              
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                onClick={onClose}
                className="p-3 glass-hover rounded-2xl text-white/60 hover:text-white transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* API Key Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6 relative z-10"
            >
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your OpenRouter API key"
                    className="w-full input-glass pr-12 text-white placeholder-white/40"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-white/40 hover:text-white/80 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </motion.button>
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs text-white/50 mt-2 flex items-center gap-2"
                >
                  <Shield size={12} />
                  Your API key is stored securely and only used for OpenRouter requests.
                </motion.p>
              </div>

              {/* API Key Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass border border-blue-400/30 rounded-2xl p-6 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"></div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 glass-strong rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Key size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">Get your OpenRouter API Key</h3>
                    <p className="text-sm text-white/70 mb-4 leading-relaxed">
                      You need an OpenRouter API key to use this chat application. OpenRouter provides access to various AI models through a unified API.
                    </p>
                    <motion.a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm bg-blue-500/20 text-blue-300 hover:text-blue-200 px-3 py-2 rounded-xl border border-blue-400/30 hover:border-blue-400/50 transition-all"
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Get API Key <ExternalLink size={14} />
                    </motion.a>
                  </div>
                </div>
              </motion.div>

              {/* Current Status */}
              {profile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass rounded-2xl p-4 border border-white/10"
                >
                  <h4 className="font-medium text-white mb-3">Current Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Email:</span>
                      <span className="font-mono text-white/80">{profile.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">API Key:</span>
                      {profile.openrouter_api_key ? (
                        <span className="font-mono text-green-400">
                          {showApiKey ? profile.openrouter_api_key : maskApiKey(profile.openrouter_api_key)}
                        </span>
                      ) : (
                        <span className="text-red-400">Not configured</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-end gap-3 mt-8 relative z-10"
            >
              <motion.button
                onClick={onClose}
                className="btn-ghost px-6 py-3"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              
              <motion.button
                onClick={handleSave}
                disabled={isLoading || !apiKey.trim()}
                className="btn-primary px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="save"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      className="flex items-center gap-2"
                    >
                      <Save size={16} />
                      Save
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 