'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { createClient } from '@/lib/supabase-client';
import { Key, Eye, EyeOff, ExternalLink, ArrowLeft, LogOut, Save, User, Shield, CheckCircle, XCircle } from 'lucide-react';

function SettingsPageContent() {
  const { profile, refreshProfile } = useChat();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const router = useRouter();
  const supabase = createClient();

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
    setSaveStatus('saving');
    
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
      setSaveStatus('saved');
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving API key:', error);
      setSaveStatus('error');
      alert(error instanceof Error ? error.message : 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLogoutLoading(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLogoutLoading(false);
    }
  };

  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            Saving...
          </>
        );
      case 'saved':
        return (
          <>
            <CheckCircle size={16} />
            Saved!
          </>
        );
      case 'error':
        return (
          <>
            <XCircle size={16} />
            Error - Retry
          </>
        );
      default:
        return (
          <>
            <Save size={16} />
            Save Changes
          </>
        );
    }
  };

  const getSaveButtonClass = () => {
    switch (saveStatus) {
      case 'saved': 
        return 'bg-green-500 hover:bg-green-600';
      case 'error': 
        return 'bg-red-500 hover:bg-red-600';
      default: 
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <div className="min-h-screen animated-bg">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-strong border-b border-white/10"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => router.back()}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft size={20} />
              </motion.button>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
            </div>
            
            <motion.button
              onClick={handleLogout}
              disabled={isLogoutLoading}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLogoutLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"
                />
              ) : (
                <LogOut size={16} />
              )}
              {isLogoutLoading ? 'Logging out...' : 'Logout'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {profile && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="glass-strong rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center"
                >
                  <User size={20} className="text-blue-400" />
                </motion.div>
                <h2 className="text-lg font-semibold text-white">Profile Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Email
                  </label>
                  <div className="px-4 py-3 glass rounded-xl text-white font-mono text-sm">
                    {profile.email}
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    API Key Status
                  </label>
                  <div className={`px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2 ${
                    profile.openrouter_api_key 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {profile.openrouter_api_key ? (
                      <>
                        <CheckCircle size={16} />
                        Configured
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        Not configured
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-strong rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center"
              >
                <Key size={20} className="text-yellow-400" />
              </motion.div>
              <h2 className="text-lg font-semibold text-white">OpenRouter API Key</h2>
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-white/60 mb-3">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your OpenRouter API key"
                    className="input-glass w-full pr-12 text-white placeholder-white/40"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                  </motion.button>
                </div>
                <p className="text-sm text-white/40 mt-2">
                  Your API key is stored securely and only used to make requests to OpenRouter.
                </p>
              </motion.div>

              {profile?.openrouter_api_key && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="block text-sm font-medium text-white/60 mb-3">
                    Current API Key
                  </label>
                  <div className="px-4 py-3 glass rounded-xl text-white/60 font-mono text-sm">
                    {profile.openrouter_api_key.slice(0, 4) + '•'.repeat(profile.openrouter_api_key.length - 8) + profile.openrouter_api_key.slice(-4)}
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="glass rounded-xl p-4"
              >
                <h3 className="text-sm font-medium text-white mb-2">Need an API key?</h3>
                <p className="text-xs text-white/60 mb-3">
                  Get your free OpenRouter API key to access various AI models including GPT-4, Claude, and more.
                </p>
                <motion.a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  whileHover={{ x: 4 }}
                >
                  Get OpenRouter API Key
                  <ExternalLink size={14} />
                </motion.a>
              </motion.div>

              <motion.button
                onClick={handleSave}
                disabled={isLoading || !apiKey.trim()}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${getSaveButtonClass()}`}
                whileHover={!isLoading ? { scale: 1.02, y: -1 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {getSaveButtonContent()}
              </motion.button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-strong rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center"
              >
                <Shield size={20} className="text-green-400" />
              </motion.div>
              <h2 className="text-lg font-semibold text-white">Security & Privacy</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={16} className="text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">End-to-End Encryption</p>
                  <p className="text-white/60 text-xs">Your API keys are encrypted and stored securely</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle size={16} className="text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">No Data Collection</p>
                  <p className="text-white/60 text-xs">We don't store or analyze your conversations</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle size={16} className="text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Open Source</p>
                  <p className="text-white/60 text-xs">Full transparency with open source codebase</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ChatProvider>
      <SettingsPageContent />
    </ChatProvider>
  );
} 