'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Info, User, Brain, CreditCard, Save, Plus, Trash2, CheckCircle2, ChevronDown } from 'lucide-react';

interface Settings {
  apiKey: string;
  model: string;
  temperature: number;
  persona: string;
  customSystemPrompt: string;
  theme?: string;
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
  sessionsCount?: number;
  projectsCount?: number;
  assistantsCount?: number;
  messagesCount?: number;
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

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  sessionsCount = 0,
  projectsCount = 0,
  assistantsCount = 0,
  messagesCount = 0
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'memory' | 'billing'>('general');

  // General States
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [persona, setPersona] = useState(settings.persona || 'general');
  const [customSystemPrompt, setCustomSystemPrompt] = useState(settings.customSystemPrompt || '');
  const [theme, setTheme] = useState(settings.theme || 'default');

  // Memory States
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryValue, setNewMemoryValue] = useState('');

  // Subscription/Billing States
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'pro_plus'>('free');
  const [upgradeProcessing, setUpgradeProcessing] = useState<string | null>(null);

  // Sync internal states
  useEffect(() => {
    if (isOpen) {
      const syncTimer = setTimeout(() => {
        setApiKey(settings.apiKey);
        setTemperature(settings.temperature);
        setPersona(settings.persona || 'general');
        setCustomSystemPrompt(settings.customSystemPrompt || '');
        setTheme(settings.theme || 'default');

        // Load Memories
        const savedMemories = localStorage.getItem('gemma_memories');
        if (savedMemories) {
          try { setMemories(JSON.parse(savedMemories)); } catch {}
        } else {
          // Initialize with default mock memories for beautiful demonstration
          const defaults: Memory[] = [
            { id: 'm1', key: 'Programming Language', value: 'User prefers TypeScript and modern Next.js structures.' },
            { id: 'm2', key: 'Tone Preference', value: 'User prefers precise explanations without unnecessary conversation.' }
          ];
          setMemories(defaults);
          localStorage.setItem('gemma_memories', JSON.stringify(defaults));
        }

        // Load Subscription
        const savedPlan = localStorage.getItem('gemma_subscription_plan');
        if (savedPlan) {
          setUserPlan(savedPlan as 'free' | 'pro' | 'pro_plus');
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

  const handleUpgradePlan = (plan: 'pro' | 'pro_plus') => {
    setUpgradeProcessing(plan);
    setTimeout(() => {
      setUserPlan(plan);
      localStorage.setItem('gemma_subscription_plan', plan);
      setUpgradeProcessing(null);
      alert(`Payment Successful! Your workspace has been upgraded to ${plan.replace('_', ' ').toUpperCase()} successfully.`);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      apiKey: apiKey.trim(),
      model: settings.model,
      temperature,
      persona,
      customSystemPrompt,
      theme
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
              Control Center & Settings
            </h3>
            {/* Future SaaS Auth Plan Badge:
            {userPlan !== 'free' && (
              <span className="text-[9px] px-2 py-0.5 rounded bg-[#a8c7fa]/10 border border-[#a8c7fa]/30 text-[#a8c7fa] font-extrabold uppercase tracking-widest font-mono">
                {userPlan === 'pro_plus' ? 'Pro Plus Member' : 'Pro Member'}
              </span>
            )}
            */}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2d2f31] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-[#303134] bg-[#131314]/30 px-6 shrink-0 text-xs">
          {[
            { id: 'general', label: 'General', Icon: User },
            { id: 'memory', label: 'AI Memory Dashboard', Icon: Brain },
            { id: 'billing', label: 'Usage & Subscriptions', Icon: CreditCard }
          ].map(tab => {
            const Icon = tab.Icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'general' | 'memory' | 'billing')}
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
              {/* API Key */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Gemini API Key
                </label>
                <div className="relative flex items-center">
                  <Key className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-2xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-start gap-1.5 mt-1">
                  <Info className="w-3.5 h-3.5 text-[#a8c7fa] shrink-0 mt-0.5" />
                  <span className="text-[10px] text-slate-500 leading-normal">
                    If left blank, the system automatically uses the pre-configured global backend key.
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
                  <span className="font-bold">Gemma Memory Bank:</span> Cross-chat memories allow the model to retain business goals, tech preferences, and language constraints across all workspace threads permanently.
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
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 select-none">
                  Currently Stored Memories ({memories.length})
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                  {memories.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs italic">
                      No memory facts committed yet. Write statements in chat or add manually.
                    </div>
                  ) : (
                    memories.map(mem => (
                      <div 
                        key={mem.id}
                        className="p-3 bg-[#131314]/30 border border-[#303134]/30 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-300 block text-[10px] uppercase text-[#a8c7fa]">{mem.key}</span>
                          <span className="text-slate-400 leading-normal block mt-0.5">{mem.value}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteMemory(mem.id)}
                          className="p-1.5 rounded-lg border border-[#303134] hover:bg-rose-950/20 text-slate-500 hover:text-rose-450 transition-colors"
                          title="Forget memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              
              {/* Active Plan Dashboard */}
              <div className="p-4 bg-gradient-to-tr from-[#1a1b1c] to-indigo-950/30 border border-[#303134] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Current Subscription</span>
                  <span className="text-lg font-bold text-slate-200 capitalize mt-0.5 block">
                    Unlimited Active Plan
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Free simulated access with zero limits. All features unlocked.
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-850/45 rounded-full px-3 py-1 text-emerald-450 text-[10px] font-extrabold uppercase tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-450" /> Fully Unlocked
                </div>
              </div>

              {/* Workspace Resource Usage Dashboard */}
              <div className="p-4 bg-[#131314] border border-[#303134] rounded-2xl space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pl-1">
                  Workspace Resource Usage
                </span>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Messages Used */}
                  <div className="p-3 bg-[#1e1f20] border border-[#303134] rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-400">Messages Used</span>
                      <span className="font-mono text-[#a8c7fa] font-bold">{messagesCount} / ∞</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#2d2f31] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-[#a8c7fa] rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>

                  {/* Chats Created */}
                  <div className="p-3 bg-[#1e1f20] border border-[#303134] rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-400">Chats Created</span>
                      <span className="font-mono text-[#a8c7fa] font-bold">{sessionsCount} / ∞</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#2d2f31] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-[#a8c7fa] rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>

                  {/* Projects Created */}
                  <div className="p-3 bg-[#1e1f20] border border-[#303134] rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-400">Projects Created</span>
                      <span className="font-mono text-[#a8c7fa] font-bold">{projectsCount} / ∞</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#2d2f31] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-[#a8c7fa] rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>

                  {/* Memory Entries */}
                  <div className="p-3 bg-[#1e1f20] border border-[#303134] rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-400">Memory Count</span>
                      <span className="font-mono text-[#a8c7fa] font-bold">{memories.length} / ∞</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#2d2f31] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-[#a8c7fa] rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>

                  {/* Custom Assistants */}
                  <div className="p-3 bg-[#1e1f20] border border-[#303134] rounded-xl space-y-2 col-span-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-400">Custom Assistants</span>
                      <span className="font-mono text-[#a8c7fa] font-bold">{assistantsCount} / ∞</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#2d2f31] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-[#a8c7fa] rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Pricing Tier Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Pro Card */}
                <div className={`p-4 border rounded-2xl flex flex-col justify-between space-y-4 transition-all ${
                  userPlan === 'pro' 
                    ? 'border-[#a8c7fa] bg-[#a8c7fa]/5 shadow-lg' 
                    : 'border-[#303134] bg-neutral-900/30'
                }`}>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 block">Pro License</span>
                    <span className="text-2xl font-bold text-slate-100 block">
                      ₹99<span className="text-xs text-slate-500">/mo</span>
                    </span>
                    <ul className="space-y-1.5 pt-2 text-[10px] text-slate-400 font-medium leading-relaxed">
                      <li>✓ Unlimited Messages / Day</li>
                      <li>✓ Unlimited Custom Workspaces</li>
                      <li>✓ Full AI Memory Dashboard</li>
                      <li>✓ Priority Workspace Speed</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleUpgradePlan('pro')}
                    disabled={userPlan === 'pro' || upgradeProcessing !== null}
                    className="w-full py-2.5 bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#131314] disabled:opacity-40 disabled:hover:bg-[#a8c7fa] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    {upgradeProcessing === 'pro' ? (
                      <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                    ) : userPlan === 'pro' ? (
                      'Plan Active'
                    ) : (
                      'Upgrade License'
                    )}
                  </button>
                </div>

                {/* Pro Plus Card */}
                <div className={`p-4 border rounded-2xl flex flex-col justify-between space-y-4 transition-all relative overflow-hidden ${
                  userPlan === 'pro_plus' 
                    ? 'border-purple-500 bg-purple-500/5 shadow-lg' 
                    : 'border-[#303134] bg-neutral-900/30'
                }`}>
                  <span className="absolute top-1.5 right-1.5 text-[8px] bg-purple-950/80 border border-purple-800 text-purple-300 font-bold px-1.5 py-0.5 rounded-full select-none">
                    Best Value
                  </span>
                  
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 block">Pro Plus Workspace</span>
                    <span className="text-2xl font-bold text-slate-100 block">
                      ₹199<span className="text-xs text-slate-500">/mo</span>
                    </span>
                    <ul className="space-y-1.5 pt-2 text-[10px] text-slate-400 font-medium leading-relaxed">
                      <li>✓ Everything inside Pro tier</li>
                      <li>✓ Multi-File Sandpack Playgrounds</li>
                      <li>✓ Auto-summarized code insights</li>
                      <li>✓ Priority 24/7 Developer Support</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleUpgradePlan('pro_plus')}
                    disabled={userPlan === 'pro_plus' || upgradeProcessing !== null}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-450 hover:to-indigo-450 text-white disabled:opacity-40 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    {upgradeProcessing === 'pro_plus' ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : userPlan === 'pro_plus' ? (
                      'Plan Active'
                    ) : (
                      'Upgrade Workspace'
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
