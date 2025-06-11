'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { createClient } from '@/lib/supabase-client';
import { Key, Eye, EyeOff, ExternalLink, ArrowLeft, LogOut, Save } from 'lucide-react';

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
      
      // Reset save status after 2 seconds
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

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4);
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'saved': return 'Saved!';
      case 'error': return 'Error - Retry';
      default: return 'Save Changes';
    }
  };

  const getSaveButtonClass = () => {
    const baseClass = "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    
    switch (saveStatus) {
      case 'saved': 
        return `${baseClass} bg-green-600 text-white`;
      case 'error': 
        return `${baseClass} bg-red-600 text-white hover:bg-red-700`;
      default: 
        return `${baseClass} bg-blue-600 text-white hover:bg-blue-700`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
            
            <button
              onClick={handleLogout}
              disabled={isLogoutLoading}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLogoutLoading ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <LogOut size={16} />
              )}
              {isLogoutLoading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Information */}
          {profile && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono">
                    {profile.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key Status
                  </label>
                  <div className={`px-3 py-2 border border-gray-200 rounded-lg font-medium ${
                    profile.openrouter_api_key ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {profile.openrouter_api_key ? 'Configured' : 'Not configured'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OpenRouter API Key Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Key size={24} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">OpenRouter API Key</h2>
            </div>

            <div className="space-y-6">
              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your OpenRouter API key"
                    className="w-full px-3 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Your API key is stored securely and only used to make requests to OpenRouter.
                </p>
              </div>

              {/* Current API Key Display */}
              {profile?.openrouter_api_key && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Current API Key</h4>
                  <div className="font-mono text-sm text-gray-600">
                    {showApiKey ? profile.openrouter_api_key : maskApiKey(profile.openrouter_api_key)}
                  </div>
                </div>
              )}

              {/* Info Section */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Key size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-blue-900 mb-2">Get your OpenRouter API Key</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      You need an OpenRouter API key to use this chat application. OpenRouter provides access to various AI models through a unified API.
                    </p>
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline transition-colors"
                    >
                      Get API Key <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isLoading || !apiKey.trim()}
                  className={getSaveButtonClass()}
                >
                  {saveStatus === 'saving' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save size={16} />
                  )}
                  {getSaveButtonText()}
                </button>
              </div>
            </div>
          </div>
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