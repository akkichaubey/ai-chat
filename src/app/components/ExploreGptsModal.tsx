'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Trash2, Edit3, Plus, Compass } from 'lucide-react';

export interface CustomGpt {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  avatarEmoji: string;
  avatarBg: string;
  starterPrompts: string[];
  temperature: number;
}

interface ExploreGptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customGpts: CustomGpt[];
  onSaveGpt: (gpt: CustomGpt) => void;
  onDeleteGpt: (id: string) => void;
  onSelectGpt: (gpt: CustomGpt) => void;
}

const FEATURED_GPTS: CustomGpt[] = [
  {
    id: 'system-gemma-dev',
    name: 'Gemma Dev Pro',
    description: 'Senior software developer. Explains system architecture and provides clean, modular code.',
    systemInstruction: 'You are Gemma Dev Pro, a senior software architect and senior software engineer. Provide clean, well-documented, modular code examples in React, TypeScript, Python, etc. Explain key concepts and patterns concisely. Focus on performance, security, and best practices.',
    avatarEmoji: '💻',
    avatarBg: 'bg-gradient-to-tr from-emerald-600 to-teal-600',
    starterPrompts: [
      'Write a React custom hook for debouncing state changes.',
      'Explain the difference between SQL and NoSQL database modeling.',
      'How do I implement JSON Web Token (JWT) auth securely in Next.js?'
    ],
    temperature: 1.0
  },
  {
    id: 'system-creative-copy',
    name: 'Creative Copywriter',
    description: 'Copywriting and creative companion. Drafts engaging articles, video scripts, and marketing emails.',
    systemInstruction: 'You are Creative Copywriter, a professional marketer and creative writer. Help the user draft compelling newsletters, essays, blog posts, video outlines, and advertising copy. Focus on voice, structure, engaging hooks, and strong calls-to-action.',
    avatarEmoji: '✍️',
    avatarBg: 'bg-gradient-to-tr from-purple-600 to-pink-600',
    starterPrompts: [
      'Draft a launch email for a new AI-powered chat dashboard.',
      'Brainstorm 5 engaging YouTube video titles about learning programming.',
      'Help me rewrite this boring landing page header to increase conversions.'
    ],
    temperature: 1.0
  },
  {
    id: 'system-product-strat',
    name: 'Product Strategist',
    description: 'UX/UI advisor and startup strategist. Outlines wireframe concepts, user journeys, and pitch ideas.',
    systemInstruction: 'You are Product Strategist, a seasoned startup advisor and UX/UI expert. Help the user brainstorm product feature maps, outline user onboarding flows, sketch basic wireframe ideas (in text or ASCII), and refine product pitch angles.',
    avatarEmoji: '💡',
    avatarBg: 'bg-gradient-to-tr from-orange-500 to-rose-600',
    starterPrompts: [
      'Outline a user registration onboarding flow for a mobile fitness app.',
      'How should I structure a 10-slide startup pitch deck for seed funding?',
      'Suggest key UX improvements for a complicated e-commerce checkout page.'
    ],
    temperature: 1.0
  },
  {
    id: 'system-academic-coach',
    name: 'Academic Coach',
    description: 'Math, physics, and science educator. Breaks down complex theories into simple lessons.',
    systemInstruction: 'You are Academic Coach, a patient and enthusiastic scientific educator. Break down complex theories, equations, or historical events into clear, easy-to-understand step-by-step lessons. Use analogies and verify comprehension at each step.',
    avatarEmoji: '🎓',
    avatarBg: 'bg-gradient-to-tr from-blue-600 to-cyan-500',
    starterPrompts: [
      'Explain the concept of quantum superposition using a simple coin analogy.',
      'Help me solve this chemistry equation: balance the photosynthesis formula.',
      'Explain the historical significance and impact of the printing press.'
    ],
    temperature: 1.0
  }
];

const PRESET_EMOJIS = ['🤖', '💻', '✍️', '💡', '🎓', '🎨', '🚀', '🔬', '🔍', '📊', '🛠️', '🧭', '⚖️', '💬'];

const GRADIENT_THEMES = [
  { id: 'emerald', class: 'bg-gradient-to-tr from-emerald-600 to-teal-600' },
  { id: 'purple', class: 'bg-gradient-to-tr from-purple-600 to-pink-600' },
  { id: 'orange', class: 'bg-gradient-to-tr from-orange-500 to-rose-600' },
  { id: 'blue', class: 'bg-gradient-to-tr from-blue-600 to-cyan-500' },
  { id: 'indigo', class: 'bg-gradient-to-tr from-indigo-600 to-violet-650' },
  { id: 'fuchsia', class: 'bg-gradient-to-tr from-fuchsia-600 to-pink-650' },
  { id: 'amber', class: 'bg-gradient-to-tr from-amber-500 to-orange-600' },
  { id: 'charcoal', class: 'bg-gradient-to-tr from-[#2d2f31] to-[#1e1f20]' }
];

export default function ExploreGptsModal({
  isOpen,
  onClose,
  customGpts,
  onSaveGpt,
  onDeleteGpt,
  onSelectGpt
}: ExploreGptsModalProps) {
  const [view, setView] = useState<'explore' | 'editor'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor form state
  const [editingGptId, setEditingGptId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('🤖');
  const [avatarBg, setAvatarBg] = useState(GRADIENT_THEMES[0].class);
  const [starters, setStarters] = useState<string[]>(['', '', '']);
  const [gptTemperature, setGptTemperature] = useState(1.0);
  const [error, setError] = useState('');

  const resetEditor = () => {
    setEditingGptId(null);
    setName('');
    setDescription('');
    setSystemInstruction('');
    setAvatarEmoji('🤖');
    setAvatarBg(GRADIENT_THEMES[0].class);
    setStarters(['', '', '']);
    setGptTemperature(1.0);
    setError('');
  };

  // Reset editor state when modal opens/closes or view changes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setView('explore');
        setSearchQuery('');
        resetEditor();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateNew = () => {
    resetEditor();
    setView('editor');
  };

  const handleStartEdit = (e: React.MouseEvent, gpt: CustomGpt) => {
    e.stopPropagation();
    setEditingGptId(gpt.id);
    setName(gpt.name);
    setDescription(gpt.description);
    setSystemInstruction(gpt.systemInstruction);
    setAvatarEmoji(gpt.avatarEmoji);
    setAvatarBg(gpt.avatarBg);
    
    // Ensure starters has exactly 3 slots for inputs
    const loadedStarters = [...gpt.starterPrompts];
    while (loadedStarters.length < 3) {
      loadedStarters.push('');
    }
    setStarters(loadedStarters.slice(0, 3));
    setGptTemperature(gpt.temperature ?? 1.0);
    setError('');
    setView('editor');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (!systemInstruction.trim()) {
      setError('Instructions are required.');
      return;
    }

    const filteredStarters = starters.map(s => s.trim()).filter(Boolean);

    const savedGpt: CustomGpt = {
      id: editingGptId || Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      systemInstruction: systemInstruction.trim(),
      avatarEmoji,
      avatarBg,
      starterPrompts: filteredStarters,
      temperature: gptTemperature
    };

    onSaveGpt(savedGpt);
    setView('explore');
    resetEditor();
  };

  const handleStarterChange = (index: number, val: string) => {
    setStarters(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  // Combine Featured and User GPTs for search/explore
  const allGpts = [...FEATURED_GPTS, ...customGpts];
  const filteredGpts = allGpts.filter(gpt =>
    gpt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gpt.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#1e1f20] border border-[#303134] rounded-2xl overflow-hidden shadow-2xl transition-all transform scale-100 z-10 max-h-[85vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#303134] bg-[#131314] shrink-0">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#a8c7fa]" />
            <h3 className="text-base font-semibold text-slate-100 tracking-wide">
              {view === 'explore' ? 'Explore Custom GPTs' : editingGptId ? 'Edit GPT Builder' : 'Create Custom GPT'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2d2f31] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {view === 'explore' ? (
          /* ================= EXPLORE VIEW ================= */
          <>
            {/* Toolbar row (Search & Create) */}
            <div className="p-5 border-b border-[#303134]/40 bg-[#131314]/40 flex gap-3 items-center shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search GPTs by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] transition-colors"
                />
              </div>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#131314] rounded-xl text-sm font-semibold shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create GPT
              </button>
            </div>

            {/* List Body */}
            <div className="p-6 overflow-y-auto flex-1 scrollbar-thin space-y-6">
              {filteredGpts.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-10">
                  No matching GPTs found. Create your own!
                </div>
              ) : (
                <div className="space-y-6">
                  {/* My GPTs (rendered only if they match query and customGpts list is not empty) */}
                  {customGpts.length > 0 && filteredGpts.some(g => !g.id.startsWith('system-')) && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">My GPTs</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredGpts.filter(g => !g.id.startsWith('system-')).map(gpt => (
                          <div
                            key={gpt.id}
                            onClick={() => onSelectGpt(gpt)}
                            className="group flex gap-4 p-4 rounded-xl border border-[#303134] bg-[#1e1f20] hover:bg-[#2d2f31] hover:border-[#3c4043] transition-all cursor-pointer relative"
                          >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${gpt.avatarBg}`}>
                              {gpt.avatarEmoji}
                            </div>
                            <div className="flex-1 min-w-0 pr-12">
                              <h5 className="text-sm font-semibold text-slate-200 truncate leading-snug">
                                {gpt.name}
                              </h5>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {gpt.description}
                              </p>
                            </div>
                            {/* Hover Actions */}
                            <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleStartEdit(e, gpt)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-colors"
                                title="Edit GPT"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteGpt(gpt.id);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                                title="Delete GPT"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Featured GPTs */}
                  {filteredGpts.some(g => g.id.startsWith('system-')) && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Featured Assistants</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredGpts.filter(g => g.id.startsWith('system-')).map(gpt => (
                          <div
                            key={gpt.id}
                            onClick={() => onSelectGpt(gpt)}
                            className="flex gap-4 p-4 rounded-xl border border-[#303134] bg-[#1e1f20] hover:bg-[#2d2f31] hover:border-[#3c4043] transition-all cursor-pointer"
                          >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${gpt.avatarBg}`}>
                              {gpt.avatarEmoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-semibold text-slate-200 leading-snug">
                                {gpt.name}
                              </h5>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {gpt.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          /* ================= EDITOR VIEW ================= */
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto flex flex-col max-h-[calc(85vh-60px)]">
            <div className="p-6 space-y-5 flex-1 overflow-y-auto scrollbar-thin">
              
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Avatar Builder Panel */}
              <div className="flex items-center gap-5 p-4 rounded-xl border border-[#303134] bg-[#131314]/30">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg ${avatarBg}`}>
                  {avatarEmoji}
                </div>
                <div className="space-y-2.5 flex-1">
                  {/* Emoji selector Presets */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Avatar Symbol / Emoji
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setAvatarEmoji(emoji)}
                          className={`p-1 text-base rounded hover:bg-[#2d2f31] transition-colors ${
                            avatarEmoji === emoji ? 'bg-[#2d2f31] border border-neutral-700' : 'border border-transparent'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                      <input
                        type="text"
                        maxLength={2}
                        value={avatarEmoji}
                        onChange={(e) => setAvatarEmoji(e.target.value.trim() || '🤖')}
                        className="w-8 h-7 text-center text-xs bg-[#131314] border border-[#303134] rounded text-slate-200 focus:outline-none focus:border-[#a8c7fa]"
                        title="Or paste custom emoji"
                      />
                    </div>
                  </div>

                  {/* Gradient Background Presets */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Theme Gradient
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {GRADIENT_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setAvatarBg(theme.class)}
                          className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${theme.class} ${
                            avatarBg === theme.class ? 'scale-125 border-slate-100' : 'border-transparent hover:scale-110'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. React Coach"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Short Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Explains component design systems"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] transition-colors"
                  />
                </div>
              </div>

              {/* System Instructions / Prompt */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Instructions (System Prompt)
                </label>
                <textarea
                  placeholder="How should this GPT behave? What is its role? e.g. You are an expert designer..."
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  rows={4}
                  className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-xl py-2.5 px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] transition-colors resize-none leading-relaxed scrollbar-thin"
                />
              </div>

              {/* Temperature Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Temperature (Creativity)</label>
                  <span className="text-[10px] font-mono text-[#a8c7fa] bg-[#131314] px-1.5 py-0.5 rounded border border-[#303134]">{gptTemperature.toFixed(1)}</span>
                </div>
                <input type="range" min="0" max="2" step="0.1" value={gptTemperature} onChange={(e) => setGptTemperature(parseFloat(e.target.value))} className="w-full h-1 bg-[#2d2f31] rounded-lg appearance-none cursor-pointer accent-[#a8c7fa]" />
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>Precise (0)</span><span>Balanced (1)</span><span>Creative (2)</span>
                </div>
              </div>

              {/* Conversation Starters */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Conversation Starters (Optional)
                </label>
                <div className="space-y-2">
                  {starters.map((starter, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Starter prompt ${idx + 1}...`}
                      value={starter}
                      onChange={(e) => handleStarterChange(idx, e.target.value)}
                      className="w-full bg-[#131314] border border-[#303134] focus:border-slate-600 rounded-xl py-2 px-3 text-xs text-slate-300 placeholder-slate-700 focus:outline-none transition-colors"
                    />
                  ))}
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-[#303134] bg-[#131314] shrink-0">
              <button
                type="button"
                onClick={() => setView('explore')}
                className="px-4 py-2 text-sm font-medium rounded-xl text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2d2f31] transition-colors cursor-pointer"
              >
                Back to Explore
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#131314] shadow-md transition-all cursor-pointer"
              >
                {editingGptId ? 'Save Changes' : 'Create Assistant'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
