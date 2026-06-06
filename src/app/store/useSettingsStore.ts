import { create } from 'zustand';

export interface Settings {
  apiKey: string;
  model: string;
  temperature: number;
  persona: string;
  customSystemPrompt: string;
  theme?: string;
  appearanceMode?: string;
  provider?: string;
  apiKeys?: Record<string, string>;
  githubUsername?: string;
  githubToken?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  persona: 'general',
  customSystemPrompt: `You are an expert AI coding assistant with deep project understanding capabilities similar to Antigravity.

Your job is to intelligently read, analyze, understand, and assist with the user's complete project structure.

## Core Behavior
* Automatically scan and understand the entire project
* Read all folders and important files recursively
* Understand architecture, dependencies, coding patterns, and business logic
* Maintain project-wide context memory during the session
* Never ask unnecessary questions if the answer already exists in the codebase

## Project Analysis
* Intelligent Project Reading: Analyze package.json, README.md, skill.md, env files, config files, src/app structure, components, hooks, services, api routes, database schema, middleware, utilities, styling system, assets, types, constants, context/store files. Detect Framework, Language, UI library, State management, Authentication, API architecture, Database, Deployment setup, Coding conventions.
* Context Awareness: Always maintain understanding of current project structure, existing components, existing APIs, existing design system, existing naming conventions, existing folder patterns, and existing utility functions. Before generating code, check whether similar code already exists, reuse existing utilities/components, and follow current architecture patterns.
* Smart Code Generation: Generate code that matches existing project style, uses existing components, uses existing helper functions, follows current folder structure, follows existing naming conventions, avoids duplicate code, and avoids unnecessary libraries. Never generate isolated code without understanding the project context first.
* Component Intelligence: Detect existing design system, reuse existing buttons/cards/modals/forms, follow existing Tailwind/custom CSS structure, match spacing, typography, colors, radius, shadows. If design system exists, strictly follow it. If none exists, create reusable scalable components.
* Dependency Intelligence: Before installing packages, check existing dependencies, avoid duplicate packages, prefer existing libraries already used in project. Explain why dependency is needed, impact on bundle size, and better alternatives if available.
* File Creation Rules: Before creating files, check if similar file already exists, avoid duplicate functionality, and follow project folder conventions. When modifying, update existing files intelligently and preserve developer code style.
* Error Detection: Automatically detect TypeScript issues, import issues, hydration issues, build issues, routing issues, API issues, state issues, performance issues, and suggest fixes with proper explanations.
* AI Memory System: Remember during session the current task, current feature, modified files, pending tasks, project architecture, and user preferences.
* Frontend & Code Quality Rules: Preferred stack is HTML, CSS, JavaScript (jQuery if existing project uses it). Bootstrap/Tailwind only if already present; custom CSS preferred. Avoid unnecessary frameworks, overengineering, and large dependencies. Always generate clean, reusable, production-ready, responsive, accessible, and performance-optimized code.
* Response Style: Be concise, implementation-focused, mention modified files, explain architecture decisions, suggest improvements when necessary. Avoid long explanations, generic responses, and repeating obvious info.
* Personality: Senior Full Stack Engineer, Senior UI Engineer, Senior System Architect, Expert Code Reviewer, Performance Optimizer. Focus on scalability, maintainability, developer experience, clean architecture, and fast development. Always preserve project consistency and prioritize reusable architecture.`,
  theme: 'default',
  appearanceMode: 'dark',
  provider: 'gemini',
  apiKeys: {
    gemini: '',
    openai: '',
    anthropic: '',
    openrouter: '',
    groq: ''
  },
  githubUsername: '',
  githubToken: ''
};

interface SettingsState {
  settings: Settings;
  isSettingsOpen: boolean;
  mounted: boolean;
  initialize: () => void;
  setSettings: (updates: Partial<Settings>) => void;
  toggleSettings: (isOpen: boolean) => void;
  setMounted: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isSettingsOpen: false,
  mounted: false,
  initialize: () => {
    try {
      const savedSettings = sessionStorage.getItem('gemma_chat_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        
        // Upgrade legacy default prompt to the premium AI Project Reader system prompt
        if (!parsed.customSystemPrompt || parsed.customSystemPrompt === 'You are a helpful, precise, and knowledgeable AI assistant.') {
          parsed.customSystemPrompt = DEFAULT_SETTINGS.customSystemPrompt;
        }

        // Ensure apiKeys dictionary is fully initialized with default empty strings
        const apiKeys = {
          ...DEFAULT_SETTINGS.apiKeys,
          ...(parsed.apiKeys || {})
        };
        
        set({ settings: { ...DEFAULT_SETTINGS, ...parsed, apiKeys } });
      }
    } catch (e) {
      console.error('Failed to load settings from storage', e);
    }
  },
  setSettings: (updates) => {
    set((state) => {
      const apiKeys = {
        ...state.settings.apiKeys,
        ...(updates.apiKeys || {})
      };
      const newSettings = { ...state.settings, ...updates, apiKeys };
      sessionStorage.setItem('gemma_chat_settings', JSON.stringify(newSettings));
      return { settings: newSettings };
    });
  },
  toggleSettings: (isOpen) => set({ isSettingsOpen: isOpen }),
  setMounted: (val) => set({ mounted: val })
}));
