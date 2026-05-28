'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Info, User, Palette } from 'lucide-react';

interface Settings {
  apiKey: string;
  model: string;
  temperature: number;
  persona: string;
  customSystemPrompt: string;
  theme?: string;
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

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [persona, setPersona] = useState(settings.persona || 'general');
  const [customSystemPrompt, setCustomSystemPrompt] = useState(settings.customSystemPrompt || '');
  const [theme, setTheme] = useState(settings.theme || 'default');

  // Update internal states when settings prop changes (e.g. if settings load late)
  useEffect(() => {
    if (isOpen) {
      setApiKey(settings.apiKey);
      setTemperature(settings.temperature);
      setPersona(settings.persona || 'general');
      setCustomSystemPrompt(settings.customSystemPrompt || '');
      setTheme(settings.theme || 'default');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#1e1f20] border border-[#303134] rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/5 transition-all transform scale-100 z-10 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#303134] bg-[#131314] shrink-0">
          <h3 className="text-base font-semibold text-slate-100 tracking-wide">
            Workspace Settings
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2d2f31] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
          
          {/* API Key */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Gemini API Key
            </label>
            <div className="relative flex items-center">
              <Key className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] transition-colors"
              />
            </div>
            <div className="flex items-start gap-1.5 mt-1.5">
              <Info className="w-3.5 h-3.5 text-[#a8c7fa] shrink-0 mt-0.5" />
              <span className="text-xs text-slate-500 leading-relaxed">
                If left blank, the app will use the server's <code>GEMINI_API_KEY</code> environment variable if configured.
              </span>
            </div>
          </div>

          {/* AI Persona Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" /> AI Persona
            </label>
            <select
              value={persona}
              onChange={(e) => handlePersonaChange(e.target.value)}
              className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] transition-colors cursor-pointer"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#1e1f20] text-slate-200">
                  {p.name} - {p.description}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Customization */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-slate-400" /> Color Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] transition-colors cursor-pointer"
            >
              <option value="default" className="bg-[#1e1f20] text-slate-200">Google AI Studio (Default)</option>
              <option value="claude" className="bg-[#1e1f20] text-slate-200">Claude Charcoal</option>
              <option value="midnight" className="bg-[#1e1f20] text-slate-200">Midnight Cosmic Purple</option>
              <option value="cyberpunk" className="bg-[#1e1f20] text-slate-200">Cyberpunk Neon</option>
              <option value="forest" className="bg-[#1e1f20] text-slate-200">Forest Green</option>
            </select>
          </div>

          {/* Custom System Prompt / Instructions */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              System Instructions
            </label>
            <textarea
              placeholder="Provide instructions to guide the AI's behavior..."
              value={customSystemPrompt}
              onChange={(e) => handlePromptTextChange(e.target.value)}
              rows={4}
              className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-xl py-2.5 px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] transition-colors resize-none font-sans leading-relaxed scrollbar-thin"
            />
            <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Editing the instructions will automatically switch the AI Persona to "Custom Prompt".
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Temperature (Creativity)
              </label>
              <span className="text-xs font-mono font-semibold text-[#a8c7fa] bg-[#2d2f31]/50 px-1.5 py-0.5 rounded border border-[#303134]">
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
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>Precise (0.0)</span>
              <span>Balanced (1.0)</span>
              <span>Creative (2.0)</span>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#303134] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2d2f31] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium rounded-xl bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#131314] shadow-md shadow-black/10 transition-all"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
