'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles, Code, PenTool, BarChart, Heart, Plus, Trash, Check, Edit2, Globe, Briefcase } from 'lucide-react';

export interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'developer' | 'writing' | 'marketing' | 'favorites' | 'seo' | 'business';
  isCustom?: boolean;
}

const PREMADE_PROMPTS: SavedPrompt[] = [
  {
    id: 'p1',
    title: 'Code Reviewer',
    content: 'Review the following code for security issues, optimization, readability, and modern TypeScript best practices. Suggest structural modifications where necessary.',
    category: 'developer'
  },
  {
    id: 'p2',
    title: 'CSS Grid Wizard',
    content: 'Build a fully responsive and clean layout structure using CSS Grid and Flexbox. Provide modern custom properties for responsive typography and spacing rules.',
    category: 'developer'
  },
  {
    id: 'p3',
    title: 'SEO Article Writer',
    content: 'Write a comprehensive, engaging blog post optimized for high-volume SEO keywords. Include clean structure with H2/H3 headers, bullet points, and a catchy FAQ section.',
    category: 'writing'
  },
  {
    id: 'p4',
    title: 'Copywriter Refinement',
    content: 'Rewrite the following marketing copy to make it punchy, conversational, and highly conversion-focused for a SaaS software product target audience.',
    category: 'writing'
  },
  {
    id: 'p5',
    title: 'SaaS Launch Strategy',
    content: 'Draft a comprehensive Phase 1 launch strategy checklist for a developer-oriented SaaS platform on Product Hunt, Hacker News, and Twitter.',
    category: 'marketing'
  },
  {
    id: 'p6',
    title: 'Customer Interview Script',
    content: 'Create a list of 10 open-ended user interview questions designed to validate customer pain points around developer workspace efficiency and subscription costs.',
    category: 'marketing'
  },
  {
    id: 'p7',
    title: 'SEO Meta Tags Generator',
    content: 'Generate optimized SEO meta title, description, and Open Graph tags for the following webpage content. Ensure the title is under 60 chars and description under 160 chars.',
    category: 'seo'
  },
  {
    id: 'p8',
    title: 'Keyword Cluster Builder',
    content: 'Build a comprehensive keyword cluster for the topic below. Group keywords by search intent (informational, navigational, transactional) and provide estimated search volume indicators.',
    category: 'seo'
  },
  {
    id: 'p9',
    title: 'Business Plan Outline',
    content: 'Create a detailed business plan outline for the following startup idea. Include: Executive Summary, Market Analysis, Competitive Landscape, Revenue Model, Go-to-Market Strategy, and Financial Projections.',
    category: 'business'
  },
  {
    id: 'p10',
    title: 'SWOT Analysis Generator',
    content: 'Perform a comprehensive SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for the following business or product idea. Present results in a clean markdown table.',
    category: 'business'
  }
];

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (content: string) => void;
}

export default function PromptLibraryModal({
  isOpen,
  onClose,
  onSelectPrompt,
}: PromptLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'developer' | 'writing' | 'marketing' | 'seo' | 'business' | 'custom' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom & Favorites State loaded from localStorage
  const [customPrompts, setCustomPrompts] = useState<SavedPrompt[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  
  // Custom Prompt Form States
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'developer' | 'writing' | 'marketing' | 'general' | 'seo' | 'business'>('general');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit custom prompt state
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        const savedCustom = localStorage.getItem('gemma_custom_prompts');
        if (savedCustom) {
          try { setCustomPrompts(JSON.parse(savedCustom)); } catch {}
        }
        const savedFavorites = localStorage.getItem('gemma_favorite_prompts');
        if (savedFavorites) {
          try { setFavoriteIds(JSON.parse(savedFavorites)); } catch {}
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveCustomPromptsToStorage = (updated: SavedPrompt[]) => {
    setCustomPrompts(updated);
    localStorage.setItem('gemma_custom_prompts', JSON.stringify(updated));
  };

  const saveFavoritesToStorage = (updated: string[]) => {
    setFavoriteIds(updated);
    localStorage.setItem('gemma_favorite_prompts', JSON.stringify(updated));
  };

  const toggleFavorite = (id: string) => {
    const next = favoriteIds.includes(id) 
      ? favoriteIds.filter(fId => fId !== id) 
      : [...favoriteIds, id];
    saveFavoritesToStorage(next);
  };

  const handleCreatePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newPrompt: SavedPrompt = {
      id: 'c_' + Date.now().toString(),
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory === 'general' ? 'general' as 'general' | 'developer' | 'writing' | 'marketing' | 'favorites' : newCategory,
      isCustom: true
    };

    const updated = [newPrompt, ...customPrompts];
    saveCustomPromptsToStorage(updated);

    // Reset Form
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  const handleDeleteCustomPrompt = (id: string) => {
    const updated = customPrompts.filter(p => p.id !== id);
    saveCustomPromptsToStorage(updated);
    if (favoriteIds.includes(id)) {
      saveFavoritesToStorage(favoriteIds.filter(fId => fId !== id));
    }
  };

  const handleStartEditPrompt = (prompt: SavedPrompt) => {
    setEditingPromptId(prompt.id);
    setEditTitle(prompt.title);
    setEditContent(prompt.content);
  };

  const handleSaveEditPrompt = () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    const updated = customPrompts.map(p =>
      p.id === editingPromptId ? { ...p, title: editTitle.trim(), content: editContent.trim() } : p
    );
    saveCustomPromptsToStorage(updated);
    setEditingPromptId(null);
    setEditTitle('');
    setEditContent('');
  };

  // Compile prompt list
  const allPrompts = [...PREMADE_PROMPTS, ...customPrompts];

  const filteredPrompts = allPrompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'custom') return prompt.isCustom;
    if (activeTab === 'favorites') return favoriteIds.includes(prompt.id);
    return prompt.category === activeTab;
  });

  const handleCopyPrompt = (prompt: SavedPrompt) => {
    navigator.clipboard.writeText(prompt.content);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl shadow-black/60 space-y-5 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 text-primary">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-100 tracking-tight">Prompt Library</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Search */}
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search library templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-primary rounded-2xl py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-all font-sans"
            />
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="py-2 px-4 rounded-2xl bg-primary text-[#131314] font-semibold text-xs hover:bg-primary/80 transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Prompt
          </button>
        </div>

        {/* Create Custom Prompt Form Drawer */}
        {isCreating && (
          <form onSubmit={handleCreatePrompt} className="p-4 bg-slate-950 border border-slate-700 rounded-2xl space-y-3 shrink-0 animate-in slide-in-from-top-4 duration-200">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Prompt Title (e.g. Email Summarizer)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-primary"
              />
              <select
                value={newCategory}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCategory(e.target.value as 'developer' | 'writing' | 'marketing' | 'general' | 'seo' | 'business')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-400 focus:outline-none focus:border-primary"
              >
                <option value="general">General Category</option>
                <option value="developer">Developer</option>
                <option value="writing">Writing & Copy</option>
                <option value="marketing">Marketing</option>
                <option value="seo">SEO</option>
                <option value="business">Business</option>
              </select>
            </div>
            <textarea
              placeholder="Write your template prompts instructions here..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              required
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-primary resize-none"
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="py-1.5 px-3 border border-slate-700 text-slate-400 rounded-lg hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-1.5 px-3 bg-primary text-[#131314] font-semibold rounded-lg hover:bg-primary/80"
              >
                Save Template
              </button>
            </div>
          </form>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 border-b border-slate-700 pb-2 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Prompts', Icon: Sparkles },
            { id: 'developer', label: 'Developer', Icon: Code },
            { id: 'writing', label: 'Writing', Icon: PenTool },
            { id: 'marketing', label: 'Marketing', Icon: BarChart },
            { id: 'seo', label: 'SEO', Icon: Globe },
            { id: 'business', label: 'Business', Icon: Briefcase },
            { id: 'custom', label: 'My Custom', Icon: Plus },
            { id: 'favorites', label: 'Favorites', Icon: Heart }
          ].map(tab => {
            const Icon = tab.Icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'all' | 'developer' | 'writing' | 'marketing' | 'seo' | 'business' | 'custom' | 'favorites')}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                  active 
                    ? 'bg-slate-800 border-primary/40 text-primary' 
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Prompts Cards Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs italic">
              No matching prompts templates found in this tab.
            </div>
          ) : (
            filteredPrompts.map(prompt => {
              const isFavorited = favoriteIds.includes(prompt.id);
              const isCopied = copiedId === prompt.id;
              
              return (
                <div 
                  key={prompt.id}
                  className="p-4 bg-[#1a1b1c]/80 border border-slate-700/70 hover:border-neutral-700/80 rounded-2xl space-y-3 transition-all hover:scale-[1.002] shadow-sm relative group prompt-library-card"
                >
                  {editingPromptId === prompt.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-1.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-primary"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-1.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-primary resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingPromptId(null)}
                          className="py-1 px-3 text-xs border border-slate-700 text-slate-400 rounded-lg hover:bg-neutral-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEditPrompt}
                          className="py-1 px-3 text-xs bg-primary text-[#131314] font-semibold rounded-lg hover:bg-primary/80"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">{prompt.title}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-neutral-800 text-slate-500 uppercase tracking-widest font-bold">
                            {prompt.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Favorite Button */}
                          <button
                            onClick={() => toggleFavorite(prompt.id)}
                            className={`p-1.5 rounded-lg border border-slate-700 hover:bg-neutral-800 transition-colors ${
                              isFavorited ? 'text-[#ff007f]' : 'text-slate-500 hover:text-slate-300'
                            }`}
                            title="Favorite prompt"
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                          </button>
                          
                          {/* Copy Prompt */}
                          <button
                            onClick={() => handleCopyPrompt(prompt)}
                            className="p-1.5 rounded-lg border border-slate-700 hover:bg-neutral-800 text-slate-400 hover:text-slate-200 transition-colors"
                            title="Copy to clipboard"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-450" /> : <Code className="w-3.5 h-3.5" />}
                          </button>
                          
                          {/* Edit Custom Prompt */}
                          {prompt.isCustom && (
                            <button
                              onClick={() => handleStartEditPrompt(prompt)}
                              className="p-1.5 rounded-lg border border-slate-700 hover:bg-neutral-800 text-slate-500 hover:text-primary transition-colors"
                              title="Edit prompt template"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Custom Prompt */}
                          {prompt.isCustom && (
                            <button
                              onClick={() => handleDeleteCustomPrompt(prompt.id)}
                              className="p-1.5 rounded-lg border border-slate-700 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete prompt template"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        {prompt.content}
                      </p>

                      <button
                        onClick={() => {
                          onSelectPrompt(prompt.content);
                          onClose();
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-primary text-slate-300 hover:text-[#131314] font-semibold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        Inject into Active Chat Input Box
                      </button>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
