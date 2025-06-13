'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { createClient } from '@/lib/supabase-client';
import { 
  Key, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  ArrowLeft, 
  LogOut, 
  Save, 
  User, 
  CheckCircle, 
  XCircle,
  Settings,
  Palette,
  Globe,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

type SettingsSection = 'profile' | 'api' | 'appearance' | 'general';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  isLogoutLoading: boolean;
}

function SettingsSidebar({ activeSection, onSectionChange, isCollapsed, onToggleCollapse, onLogout, isLogoutLoading }: SettingsSidebarProps) {
  const settingsSections = [
    { id: 'profile' as SettingsSection, label: 'Profile', icon: User, color: 'blue' },
    { id: 'api' as SettingsSection, label: 'API Keys', icon: Key, color: 'yellow' },
    { id: 'appearance' as SettingsSection, label: 'Appearance', icon: Palette, color: 'pink' },
    { id: 'general' as SettingsSection, label: 'General', icon: Globe, color: 'indigo' },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-4 top-4 z-50 lg:hidden"
          >
            <motion.button
              onClick={onToggleCollapse}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 backdrop-blur-sm flex items-center justify-center rounded-lg transition-colors text-white/50 hover:text-white/80 border border-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -256, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 256 }}
            exit={{ opacity: 0, x: -256, width: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="bg-black/20 backdrop-blur-sm border-r border-white/5 flex flex-col h-screen overflow-hidden fixed lg:relative z-40"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Settings size={16} className="text-white/80" />
                  </div>
                  <h2 className="text-white font-semibold">Settings</h2>
                </div>
                <motion.button
                  onClick={onToggleCollapse}
                  className="lg:hidden w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={14} />
                </motion.button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {settingsSections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  
                  return (
                    <motion.button
                      key={section.id}
                      onClick={() => onSectionChange(section.id)}
                      className={`cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left relative ${
                        isActive
                          ? 'bg-white/10 text-white/90'
                          : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeSettingsIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/60 rounded-r-sm"
                          initial={{ opacity: 0, scaleY: 0 }}
                          animate={{ opacity: 1, scaleY: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                        isActive 
                          ? `bg-${section.color}-500/20` 
                          : 'bg-white/5'
                      }`}>
                        <Icon size={14} className={
                          isActive 
                            ? `text-${section.color}-400` 
                            : 'text-white/40'
                        } />
                      </div>
                      
                      <span className="text-sm font-medium">{section.label}</span>
                      
                      <ChevronRight size={12} className={`ml-auto transition-transform ${
                        isActive ? 'rotate-90' : ''
                      }`} />
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-white/5">
              <motion.button
                onClick={onLogout}
                disabled={isLogoutLoading}
                className="cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span className="text-sm font-medium">
                  {isLogoutLoading ? 'Logging out...' : 'Logout'}
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggleCollapse}
        />
      )}
    </>
  );
}

function ProfileSection() {
  const { profile } = useChat();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {profile && (
        <div className="glass-strong rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Email Address
              </label>
              <div className="px-4 py-3 glass rounded-xl text-white font-mono text-sm">
                {profile.email}
              </div>
              <p className="text-xs text-white/40 mt-1">
                This is your login email and cannot be changed.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Account Status
              </label>
              <div className="px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30">
                <CheckCircle size={16} />
                Active
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ApiKeysSection() {
  const { profile, refreshProfile } = useChat();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* API Key Status */}
      <div className="glass-strong rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-white">OpenRouter API Key</h4>
          <div className={`px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-2 ${
            profile?.openrouter_api_key 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {profile?.openrouter_api_key ? (
              <>
                <CheckCircle size={14} />
                Configured
              </>
            ) : (
              <>
                <XCircle size={14} />
                Not configured
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
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
              Your API key is encrypted and stored securely.
            </p>
          </div>

          {profile?.openrouter_api_key && (
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Current API Key
              </label>
              <div className="px-4 py-3 glass rounded-xl text-white/60 font-mono text-sm">
                {profile.openrouter_api_key.slice(0, 4) + '•'.repeat(profile.openrouter_api_key.length - 8) + profile.openrouter_api_key.slice(-4)}
              </div>
            </div>
          )}

          <div className="glass rounded-xl p-4">
            <h5 className="text-sm font-medium text-white mb-2">Need an API key?</h5>
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
          </div>

          <motion.button
            onClick={handleSave}
            disabled={isLoading || !apiKey.trim()}
            className={`cursor-pointer flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${getSaveButtonClass()}`}
            whileHover={!isLoading ? { scale: 1.02, y: -1 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
          >
            {getSaveButtonContent()}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}



function AppearanceSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="glass-strong rounded-2xl p-6">
        <p className="text-white/60 text-sm">Appearance customization will be available in a future update.</p>
      </div>
    </motion.div>
  );
}

function GeneralSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="glass-strong rounded-2xl p-6">
        <p className="text-white/60 text-sm">General settings will be available in a future update.</p>
      </div>
    </motion.div>
  );
}

function SettingsPageContent() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'profile':
        return { title: 'Profile Information', description: 'Manage your account details and preferences.' };
      case 'api':
        return { title: 'API Keys', description: 'Configure your API keys to access AI models.' };
      case 'appearance':
        return { title: 'Appearance', description: 'Customize the look and feel of the application.' };
      case 'general':
        return { title: 'General Settings', description: 'General application preferences and settings.' };
      default:
        return { title: 'Profile Information', description: 'Manage your account details and preferences.' };
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'api':
        return <ApiKeysSection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'general':
        return <GeneralSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="min-h-screen animated-bg flex">
      {/* Sidebar */}
      <SettingsSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleLogout}
        isLogoutLoading={isLogoutLoading}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="h-full">
            <div className="px-4 sm:px-6 lg:px-8 py-8 h-full">
              {/* Header with Back Button */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{getSectionTitle().title}</h3>
                  <p className="text-white/60 text-sm">{getSectionTitle().description}</p>
                </div>
                <motion.button
                  onClick={() => router.back()}
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft size={16} />
                  <span className="text-sm font-medium">Back to Chat</span>
                </motion.button>
              </div>
              <div className="h-[calc(100%-4rem)]">
                {renderActiveSection()}
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