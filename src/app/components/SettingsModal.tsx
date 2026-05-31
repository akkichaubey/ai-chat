'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Key, Info, User, Brain, Save, Plus, Trash2, ChevronDown, Edit2, Upload, DatabaseBackup, Sun, Moon, Monitor } from 'lucide-react';

interface Settings {
  apiKey: string;
  model: string;
  temperature: number;
  persona: string;
  customSystemPrompt: string;
  theme?: string;
  appearanceMode?: string;
  provider?: string;
}

interface Memory {
  id: string;
  key: string;
  value: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
}

const PERSONAS = [
  { id: 'general', name: 'General Assistant', description: 'Helpful, precise, and general purpose.' },
  { id: 'writer', name: 'Creative Writer', description: 'Creative writing assistant for brainstorming, outlines, and copy.' },
  { id: 'code', name: 'Code Architect', description: 'Senior developer writing clean, modular code.' },
  { id: 'custom', name: 'Custom Prompt', description: 'Define your own AI system behavior.' },
];

export const PERSONA_PROMPTS: Record<string, string> = {
  general: 'You are a helpful, precise, and knowledgeable AI assistant.',
  writer: 'You are a creative writer and editor. Help the user draft essays, brainstorm concepts, compose copy, and refine written materials. Focus on tone, structure, flow, and engaging prose.',
  code: 'You are a senior software architect and coding expert. Provide clean, well-structured, production-ready code with explanations. Focus on modularity, security, performance, and best practices.'
};

const BACKUP_KEYS = [
  'gemma_chat_sessions',
  'gemma_chat_messages_map',
  'gemma_projects',
  'gemma_memories',
  'gemma_custom_prompts',
  'gemma_favorite_prompts',
  'gemma_chat_settings',
  'gemma_chat_custom_gpts',
];

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'memory'>('general');

  // General States
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [persona, setPersona] = useState(settings.persona || 'general');
  const [customSystemPrompt, setCustomSystemPrompt] = useState(settings.customSystemPrompt || '');
  const [theme, setTheme] = useState(settings.theme || 'default');
  const [appearanceMode, setAppearanceMode] = useState(settings.appearanceMode || 'dark');
  const [provider, setProvider] = useState(settings.provider || 'gemini');
  const [keyValidating, setKeyValidating] = useState(false);
  const [keyValidResult, setKeyValidResult] = useState<'valid' | 'invalid' | null>(null);

  // Memory States
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryValue, setNewMemoryValue] = useState('');
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editMemKey, setEditMemKey] = useState('');
  const [editMemValue, setEditMemValue] = useState('');


  // Backup/Restore
  const importInputRef = useRef<HTMLInputElement>(null);

  // Sync internal states
  useEffect(() => {
    if (isOpen) {
      const syncTimer = setTimeout(() => {
        setApiKey(settings.apiKey);
        setTemperature(settings.temperature);
        setPersona(settings.persona || 'general');
        setCustomSystemPrompt(settings.customSystemPrompt || '');
        setTheme(settings.theme || 'default');
        setAppearanceMode(settings.appearanceMode || 'dark');
        setProvider(settings.provider || 'gemini');
        setKeyValidResult(null);

        // Load Memories
        const savedMemories = localStorage.getItem('gemma_memories');
        if (savedMemories) {
          try { setMemories(JSON.parse(savedMemories)); } catch { setMemories([]); }
        } else {
          setMemories([]);
        }
      }, 0);
      return () => clearTimeout(syncTimer);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handlePersonaChange = (newPersona: string) => {
    setPersona(newPersona);
    if (newPersona !== 'custom') {
      setCustomSystemPrompt(PERSONA_PROMPTS[newPersona] || '');
    }
  };

  const handlePromptTextChange = (text: string) => {
    setCustomSystemPrompt(text);
    setPersona('custom');
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryKey.trim() || !newMemoryValue.trim()) return;

    const newMem: Memory = {
      id: Date.now().toString(),
      key: newMemoryKey.trim(),
      value: newMemoryValue.trim()
    };

    const updated = [...memories, newMem];
    setMemories(updated);
    localStorage.setItem('gemma_memories', JSON.stringify(updated));
    setNewMemoryKey('');
    setNewMemoryValue('');
  };

  const handleDeleteMemory = (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    localStorage.setItem('gemma_memories', JSON.stringify(updated));
  };

  const handleClearAllMemory = () => {
    setMemories([]);
    localStorage.setItem('gemma_memories', JSON.stringify([]));
  };

  const handleEditMemory = (mem: Memory) => {
    setEditingMemoryId(mem.id);
    setEditMemKey(mem.key);
    setEditMemValue(mem.value);
  };

  const handleUpdateMemory = (id: string) => {
    if (!editMemKey.trim() || !editMemValue.trim()) return;
    const updated = memories.map(m =>
      m.id === id ? { ...m, key: editMemKey.trim(), value: editMemValue.trim() } : m
    );
    setMemories(updated);
    localStorage.setItem('gemma_memories', JSON.stringify(updated));
    setEditingMemoryId(null);
    setEditMemKey('');
    setEditMemValue('');
  };

  const handleCancelEdit = () => {
    setEditingMemoryId(null);
    setEditMemKey('');
    setEditMemValue('');
  };


  const handleExportBackup = () => {
    const data: Record<string, unknown> = {};
    for (const key of BACKUP_KEYS) {
      const val = localStorage.getItem(key);
      if (val !== null) {
        try { data[key] = JSON.parse(val); } catch { data[key] = val; }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        for (const key of BACKUP_KEYS) {
          if (key in data) {
            localStorage.setItem(key, JSON.stringify(data[key]));
          }
        }
        window.location.reload();
      } catch {
        alert('Failed to parse backup file. Please ensure it is a valid workspace JSON backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleValidateKey = async () => {
    if (!apiKey.trim()) return;
    setKeyValidating(true);
    setKeyValidResult(null);
    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim(), provider })
      });
      const data = await res.json();
      setKeyValidResult(data.valid ? 'valid' : 'invalid');
    } catch {
      setKeyValidResult('invalid');
    } finally {
      setKeyValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      apiKey: apiKey.trim(),
      model: settings.model,
      temperature,
      persona,
      customSystemPrompt,
      theme,
      appearanceMode,
      provider
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-[#1e1f20] border border-[#303134] rounded-3xl overflow-hidden shadow-2xl shadow-black/60 transition-all z-10 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#303134] bg-[#131314] shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 tracking-wide">
              Control Center &amp; Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2d2f31] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-[#303134] bg-[#131314]/30 px-6 shrink-0 text-xs settings-tab-bar">
          {[
            { id: 'general', label: 'General', Icon: User },
            { id: 'memory', label: 'AI Memory Dashboard', Icon: Brain },
          ].map(tab => {
            const Icon = tab.Icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'general' | 'memory')}
                className={`py-3 px-4 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  active 
                    ? 'border-[#a8c7fa] text-[#a8c7fa]' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Tabs */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          
          {/* General Tab */}
          {activeTab === 'general' && (
            <form onSubmit={handleSubmit} className="space-y-4 font-sans">
              {/* AI Provider + API Key */}
              <div className="space-y-2 p-4 bg-[#131314] border border-[#303134] rounded-2xl">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  AI Provider &amp; API Key
                </label>
                {/* Provider selector */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: 'gemini', label: 'Gemini', color: 'text-blue-400' },
                    { id: 'openai', label: 'OpenAI', color: 'text-emerald-400' },
                    { id: 'anthropic', label: 'Claude', color: 'text-orange-400' },
                    { id: 'openrouter', label: 'Router', color: 'text-purple-400' },
                    { id: 'groq', label: 'Groq', color: 'text-yellow-400' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setProvider(p.id); setApiKey(''); setKeyValidResult(null); }}
                      className={`py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                        provider === p.id
                          ? `border-[#a8c7fa] bg-[#a8c7fa]/10 ${p.color}`
                          : 'border-[#303134] text-slate-500 hover:text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {/* API Key input + validate */}
                <div className="relative flex items-center gap-2">
                  <Key className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder={provider === 'gemini' ? 'AIzaSy...' : provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                    value={apiKey}
                    onChange={(e) => { setApiKey(e.target.value); setKeyValidResult(null); }}
                    className={`flex-1 bg-[#1e1f20] border rounded-xl py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-colors ${
                      keyValidResult === 'valid' ? 'border-emerald-500' : keyValidResult === 'invalid' ? 'border-rose-500' : 'border-[#303134] focus:border-[#a8c7fa]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleValidateKey}
                    disabled={!apiKey.trim() || keyValidating}
                    className="px-3 py-2 text-[10px] font-bold rounded-xl bg-[#2d2f31] hover:bg-[#a8c7fa] hover:text-[#131314] text-slate-300 disabled:opacity-40 transition-all shrink-0 cursor-pointer"
                  >
                    {keyValidating ? (
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                    ) : keyValidResult === 'valid' ? '✓ Valid' : keyValidResult === 'invalid' ? '✗ Invalid' : 'Verify'}
                  </button>
                </div>
                <div className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#a8c7fa] shrink-0 mt-0.5" />
                  <span className="text-[10px] text-slate-500 leading-normal">
                    {provider === 'gemini' ? 'Get your key at aistudio.google.com/app/apikey' :
                     provider === 'openai' ? 'Get your key at platform.openai.com/api-keys' :
                     provider === 'anthropic' ? 'Get your key at console.anthropic.com/settings/keys' :
                     provider === 'openrouter' ? 'Get your key at openrouter.ai/keys' :
                     'Get your key at console.groq.com/keys'}. If blank, uses server-side fallback.
                  </span>
                </div>
              </div>

              {/* AI Persona Selection */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                  AI Persona
                </label>
                <div className="relative">
                  <select
                    value={persona}
                    onChange={(e) => handlePersonaChange(e.target.value)}
                    className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-2xl py-2.5 pl-4 pr-10 text-xs text-slate-200 focus:outline-none cursor-pointer appearance-none"
                  >
                    {PERSONAS.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#1e1f20] text-slate-200 text-xs">
                        {p.name} - {p.description}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Appearance Mode */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Appearance Mode
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { value: 'dark', label: 'Dark Mode', Icon: Moon },
                    { value: 'light', label: 'Light Mode', Icon: Sun },
                    { value: 'system', label: 'Follow System', Icon: Monitor },
                  ].map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAppearanceMode(value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        appearanceMode === value
                          ? 'border-[#a8c7fa] bg-[#a8c7fa]/10 text-[#a8c7fa]'
                          : 'border-[#303134] text-slate-400 hover:text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Customization */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Global Color Theme
                </label>
                <div className="relative">
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-2xl py-2.5 pl-4 pr-10 text-xs text-slate-200 focus:outline-none cursor-pointer appearance-none"
                  >
                    <option value="default" className="bg-[#1e1f20]">Google AI Studio (Default)</option>
                    <option value="claude" className="bg-[#1e1f20]">Claude Charcoal</option>
                    <option value="midnight" className="bg-[#1e1f20]">Midnight Cosmic Purple</option>
                    <option value="cyberpunk" className="bg-[#1e1f20]">Cyberpunk Neon</option>
                    <option value="forest" className="bg-[#1e1f20]">Forest Green</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Custom System Prompt / Instructions */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                  System Instructions
                </label>
                <textarea
                  placeholder="Provide instructions to guide the AI's behavior..."
                  value={customSystemPrompt}
                  onChange={(e) => handlePromptTextChange(e.target.value)}
                  rows={3}
                  className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-2xl py-2.5 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-sans leading-relaxed scrollbar-thin"
                />
              </div>

              {/* Temperature Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                    Temperature (Creativity)
                  </label>
                  <span className="text-[10px] font-mono font-bold text-[#a8c7fa] bg-[#2d2f31]/50 px-1.5 py-0.5 rounded border border-[#303134]">
                    {temperature.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#2d2f31] rounded-lg appearance-none cursor-pointer accent-[#a8c7fa]"
                />
              </div>

              {/* Footer Save */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#303134] shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2d2f31] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#131314] shadow-md shadow-black/10 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Configuration
                </button>
              </div>
            </form>
          )}

          {/* Memory Dashboard Tab */}
          {activeTab === 'memory' && (
            <div className="space-y-5">
              <div className="p-3 bg-indigo-950/20 border border-[#303134] rounded-2xl text-[11px] text-[#a8c7fa] flex gap-2 items-start font-sans leading-relaxed">
                <Brain className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">AI Chat Memory Bank:</span> Cross-chat memories allow the model to retain business goals, tech preferences, and language constraints across all workspace threads permanently.
                </div>
              </div>

              {/* Add Memory Form */}
              <form onSubmit={handleAddMemory} className="p-4 bg-[#131314] border border-[#303134] rounded-2xl space-y-3 shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Add New Manual Memory Entry
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Key (e.g., Tech Stack)"
                    value={newMemoryKey}
                    onChange={(e) => setNewMemoryKey(e.target.value)}
                    required
                    className="w-full bg-[#1e1f20] border border-[#303134] rounded-xl py-1.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#a8c7fa]"
                  />
                  <input
                    type="text"
                    placeholder="Memory (e.g., Prefers Tailwind)"
                    value={newMemoryValue}
                    onChange={(e) => setNewMemoryValue(e.target.value)}
                    required
                    className="col-span-2 w-full bg-[#1e1f20] border border-[#303134] rounded-xl py-1.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#a8c7fa]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#2d2f31] hover:bg-[#a8c7fa] hover:text-[#131314] text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Commit Memory Entry
                </button>
              </form>

              {/* Memory List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pl-1 pr-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
                    Currently Stored Memories ({memories.length})
                  </span>
                  {memories.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllMemory}
                      className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                  {memories.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs italic">
                      No memory facts committed yet. Write statements in chat or add manually.
                    </div>
                  ) : (
                    memories.map(mem => (
                      <div
                        key={mem.id}
                        className="p-3 bg-[#131314]/30 border border-[#303134]/30 rounded-xl text-xs"
                      >
                        {editingMemoryId === mem.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={editMemKey}
                                onChange={(e) => setEditMemKey(e.target.value)}
                                className="w-full bg-[#1e1f20] border border-[#a8c7fa] rounded-lg py-1.5 px-2 text-xs text-slate-100 focus:outline-none"
                              />
                              <input
                                type="text"
                                value={editMemValue}
                                onChange={(e) => setEditMemValue(e.target.value)}
                                className="col-span-2 w-full bg-[#1e1f20] border border-[#a8c7fa] rounded-lg py-1.5 px-2 text-xs text-slate-100 focus:outline-none"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateMemory(mem.id)}
                                className="flex-1 py-1.5 bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#131314] font-semibold text-[10px] rounded-lg transition-all"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex-1 py-1.5 bg-[#2d2f31] hover:bg-[#3a3c3e] text-slate-300 font-semibold text-[10px] rounded-lg transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-300 block text-[10px] uppercase text-[#a8c7fa]">{mem.key}</span>
                              <span className="text-slate-400 leading-normal block mt-0.5">{mem.value}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleEditMemory(mem)}
                                className="p-1.5 rounded-lg border border-[#303134] hover:bg-[#2d2f31] text-slate-500 hover:text-[#a8c7fa] transition-colors"
                                title="Edit memory"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMemory(mem.id)}
                                className="p-1.5 rounded-lg border border-[#303134] hover:bg-rose-950/20 text-slate-500 hover:text-rose-450 transition-colors"
                                title="Forget memory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Workspace Backup & Restore */}
              <div className="p-4 bg-[#131314] border border-[#303134] rounded-2xl space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pl-1">
                  Workspace Backup &amp; Restore
                </span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Export all your sessions, messages, projects, memories, and settings into a single JSON file, or restore from a previous backup.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex-1 py-2 bg-[#2d2f31] hover:bg-[#a8c7fa] hover:text-[#131314] text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <DatabaseBackup className="w-3.5 h-3.5" />
                    Export Backup
                  </button>
                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    className="flex-1 py-2 bg-[#2d2f31] hover:bg-[#2d2f31]/80 text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#303134]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import Backup
                  </button>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBackup}
                  />
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
