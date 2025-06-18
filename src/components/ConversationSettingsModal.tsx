import { useState, useEffect, FormEvent } from 'react';
import { Conversation } from '@/types/chat';

interface ConversationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  onSave: (settings: Partial<Conversation>) => void;
}

const ConversationSettingsModal = ({
  isOpen,
  onClose,
  conversation,
  onSave,
}: ConversationSettingsModalProps) => {
  const [temperature, setTemperature] = useState<number | undefined>(undefined);
  const [topP, setTopP] = useState<number | undefined>(undefined);
  const [minP, setMinP] = useState<number | undefined>(undefined);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [systemPrompt, setSystemPrompt] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (conversation) {
      setTemperature(conversation.temperature);
      setTopP(conversation.top_p);
      setMinP(conversation.min_p);
      setSeed(conversation.seed);
      setSystemPrompt(conversation.systemPrompt);
    }
  }, [conversation]);

  if (!isOpen || !conversation) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      id: conversation.id,
      temperature,
      top_p: topP,
      min_p: minP,
      seed,
      systemPrompt,
    });
  };

  return (
    <div className="fixed inset-0 bg-[var(--shadow-color)] bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[var(--bg-subtle)] p-6 rounded-lg shadow-xl w-full max-w-md text-[var(--text-default)] border border-[var(--border-default)]">
        <h2 className="text-xl font-semibold mb-6 text-[var(--text-default)]">Conversation Settings</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="temperature" className="block text-sm font-medium text-[var(--text-subtle)] mb-1">
              Temperature
            </label>
            <input
              type="number"
              id="temperature"
              value={temperature ?? ''}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              min="0.0"
              max="2.0"
              step="0.1"
              className="w-full p-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-element)] text-[var(--text-default)] focus:ring-[var(--accent-default)] focus:border-[var(--accent-default)]"
              placeholder="Default: 0.7"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="topP" className="block text-sm font-medium text-[var(--text-subtle)] mb-1">
              Top P
            </label>
            <input
              type="number"
              id="topP"
              value={topP ?? ''}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              min="0.0"
              max="1.0"
              step="0.01"
              className="w-full p-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-element)] text-[var(--text-default)] focus:ring-[var(--accent-default)] focus:border-[var(--accent-default)]"
              placeholder="Default: 1.0"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="minP" className="block text-sm font-medium text-[var(--text-subtle)] mb-1">
              Min P
            </label>
            <input
              type="number"
              id="minP"
              value={minP ?? ''}
              onChange={(e) => setMinP(parseFloat(e.target.value))}
              min="0.0"
              max="1.0"
              step="0.01"
              className="w-full p-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-element)] text-[var(--text-default)] focus:ring-[var(--accent-default)] focus:border-[var(--accent-default)]"
              placeholder="Default: 0.0"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="seed" className="block text-sm font-medium text-[var(--text-subtle)] mb-1">
              Seed
            </label>
            <input
              type="number"
              id="seed"
              value={seed ?? ''}
              onChange={(e) => setSeed(parseInt(e.target.value, 10))}
              step="1"
              className="w-full p-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-element)] text-[var(--text-default)] focus:ring-[var(--accent-default)] focus:border-[var(--accent-default)]"
              placeholder="Any integer"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="systemPrompt" className="block text-sm font-medium text-[var(--text-subtle)] mb-1">
              System Prompt
            </label>
            <textarea
              id="systemPrompt"
              value={systemPrompt ?? ''}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="w-full p-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-element)] text-[var(--text-default)] focus:ring-[var(--accent-default)] focus:border-[var(--accent-default)] placeholder-[var(--text-muted)]"
              placeholder="e.g., You are a helpful AI assistant."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              // Using btn-ghost styling from globals.css, which is now theme-aware
              className="btn-ghost px-4 py-2 text-sm font-medium rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              // Using btn-primary styling from globals.css, which is now theme-aware
              className="btn-primary px-4 py-2 text-sm font-medium rounded-md"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConversationSettingsModal;
