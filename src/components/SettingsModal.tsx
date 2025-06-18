'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';
import { X, Key, Save, Loader2, ExternalLink, Shield, Eye, EyeOff, Palette } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher'; // Import ThemeSwitcher

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { profile, refreshProfile } = useChat();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // New state for default settings
  const [defaultTemperature, setDefaultTemperature] = useState<number | undefined>(undefined);
  const [defaultTopP, setDefaultTopP] = useState<number | undefined>(undefined);
  const [defaultMinP, setDefaultMinP] = useState<number | undefined>(undefined);
  const [defaultSeed, setDefaultSeed] = useState<number | undefined>(undefined);
  const [defaultSystemPrompt, setDefaultSystemPrompt] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (profile) {
      setApiKey(profile.openrouter_api_key || '');
      setDefaultTemperature(profile.default_temperature);
      setDefaultTopP(profile.default_top_p);
      setDefaultMinP(profile.default_min_p);
      setDefaultSeed(profile.default_seed);
      setDefaultSystemPrompt(profile.default_system_prompt);
    }
  }, [profile]);

  const handleSave = async () => {
    // API key is still mandatory for saving any settings for now
    if (!apiKey.trim()) {
      alert('Please enter your OpenRouter API key before saving settings.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        openrouter_api_key: apiKey.trim(),
        default_temperature: defaultTemperature,
        default_top_p: defaultTopP,
        default_min_p: defaultMinP,
        default_seed: defaultSeed,
        default_system_prompt: defaultSystemPrompt,
      };

      // Remove undefined fields to avoid sending them
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      await refreshProfile();
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(error instanceof Error ? error.message : 'Failed to save settings');
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl"></div>
            
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-8 relative z-10 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            >
              {/* API Key Section */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-4">API Configuration</h3>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
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
              </section>

              {/* Default Conversation Settings Section */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-4 pt-4 border-t border-white/10">Default Conversation Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="defaultTemperature" className="block text-sm font-medium text-white/80 mb-1">
                      Default Temperature
                    </label>
                    <input
                      type="number"
                      id="defaultTemperature"
                      value={defaultTemperature ?? ''}
                      onChange={(e) => setDefaultTemperature(e.target.value ? parseFloat(e.target.value) : undefined)}
                      min="0.0"
                      max="2.0"
                      step="0.1"
                      placeholder="e.g., 0.7"
                      className="w-full input-glass text-white placeholder-white/40"
                    />
                  </div>
                  <div>
                    <label htmlFor="defaultTopP" className="block text-sm font-medium text-white/80 mb-1">
                      Default Top P
                    </label>
                    <input
                      type="number"
                      id="defaultTopP"
                      value={defaultTopP ?? ''}
                      onChange={(e) => setDefaultTopP(e.target.value ? parseFloat(e.target.value) : undefined)}
                      min="0.0"
                      max="1.0"
                      step="0.01"
                      placeholder="e.g., 0.9"
                      className="w-full input-glass text-white placeholder-white/40"
                    />
                  </div>
                  <div>
                    <label htmlFor="defaultMinP" className="block text-sm font-medium text-white/80 mb-1">
                      Default Min P
                    </label>
                    <input
                      type="number"
                      id="defaultMinP"
                      value={defaultMinP ?? ''}
                      onChange={(e) => setDefaultMinP(e.target.value ? parseFloat(e.target.value) : undefined)}
                      min="0.0"
                      max="1.0"
                      step="0.01"
                      placeholder="e.g., 0.1"
                      className="w-full input-glass text-white placeholder-white/40"
                    />
                  </div>
                  <div>
                    <label htmlFor="defaultSeed" className="block text-sm font-medium text-white/80 mb-1">
                      Default Seed
                    </label>
                    <input
                      type="number"
                      id="defaultSeed"
                      value={defaultSeed ?? ''}
                      onChange={(e) => setDefaultSeed(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      step="1"
                      placeholder="e.g., 42"
                      className="w-full input-glass text-white placeholder-white/40"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="defaultSystemPrompt" className="block text-sm font-medium text-white/80 mb-1">
                    Default System Prompt
                  </label>
                  <textarea
                    id="defaultSystemPrompt"
                    value={defaultSystemPrompt ?? ''}
                    onChange={(e) => setDefaultSystemPrompt(e.target.value || undefined)}
                    rows={3}
                    className="w-full input-glass text-white placeholder-white/40"
                    placeholder="e.g., You are a helpful AI assistant."
                  />
                </div>
                <p className="text-xs text-white/50 mt-2">
                  These settings will be applied to new conversations by default. You can override them per conversation.
                </p>
              </section>

              {/* Theme Settings Section */}
              <section>
                <h3 className="text-lg font-semibold text-[var(--text-default)] mb-3 pt-4 border-t border-[var(--border-subtle)] flex items-center">
                  <Palette size={18} className="mr-2 text-[var(--accent-default)]" />
                  Appearance
                </h3>
                <div className="mb-2">
                    <label htmlFor="theme-switcher-label" className="block text-sm font-medium text-[var(--text-subtle)] mb-1">
                        Select Theme
                    </label>
                    <ThemeSwitcher />
                </div>
                 <p className="text-xs text-[var(--text-muted)] mt-2">
                  Choose your preferred interface theme.
                </p>
              </section>


              {profile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass rounded-2xl p-4 border-[var(--glass-border-color)] mt-6"
                >
                  <h4 className="font-medium text-[var(--text-default)] mb-3">Current Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-subtle)]">Email:</span>
                      <span className="font-mono text-[var(--text-default)] opacity-80">{profile.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-subtle)]">API Key:</span>
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
                disabled={isLoading || !apiKey.trim()} // Still require API key to save any settings
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