'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import VoiceModeOverlay from './components/VoiceModeOverlay';
import ExploreGptsModal, { CustomGpt } from './components/ExploreGptsModal';
import ProjectModal, { Project } from './components/ProjectModal';
import PromptLibraryModal from './components/PromptLibraryModal';
import SearchModal from './components/SearchModal';

interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 data string
  previewUrl?: string;
  textContent?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

interface ChatSession {
  id: string;
  title: string;
  pinned: boolean;
  persona: string;
  customSystemPrompt: string;
  gptId?: string;
  gptName?: string;
  gptAvatarEmoji?: string;
  gptAvatarBg?: string;
  gptDescription?: string;
  gptStarterPrompts?: string[];
  activeStyle?: string;
  activeSkill?: string;
  thinkingEnabled?: boolean;
  webSearchEnabled?: boolean;
  projectId?: string;
}

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

const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  persona: 'general',
  customSystemPrompt: 'You are a helpful, precise, and knowledgeable AI assistant.',
  theme: 'default',
  appearanceMode: 'dark',
  provider: 'gemini'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sidebar Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Chat Session States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  
  // Messages Maps { [sessionId]: Message[] }
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  
  // Input toolbar toggles
  const [thinkingEnabled, setThinkingEnabled] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  // Streaming state
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Voice mode overlay states
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [voiceActiveResponse, setVoiceActiveResponse] = useState('');
  const [voiceIsLoading, setVoiceIsLoading] = useState(false);
  const [voiceIsFinished, setVoiceIsFinished] = useState(false);

  // Custom GPT States
  const [customGpts, setCustomGpts] = useState<CustomGpt[]>([]);
  const [isExploreGptsOpen, setIsExploreGptsOpen] = useState(false);

  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [activeEditingProject, setActiveEditingProject] = useState<Project | null>(null);

  // Prompt Library & Search Modal States
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [injectedPrompt, setInjectedPrompt] = useState('');

  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setMounted(true);

      // Load Settings
      const savedSettings = localStorage.getItem('gemma_chat_settings');
      let loadedSettings = DEFAULT_SETTINGS;
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          loadedSettings = {
            ...DEFAULT_SETTINGS,
            ...parsed
          };
          setSettings(loadedSettings);
        } catch (e) {
          console.error('Failed to parse settings', e);
        }
      }

      // Load Projects
      const savedProjects = localStorage.getItem('gemma_projects');
      if (savedProjects) {
        try {
          setProjects(JSON.parse(savedProjects));
        } catch (e) {
          console.error('Failed to parse projects', e);
        }
      }

      // Load Sessions
      const savedSessions = localStorage.getItem('gemma_chat_sessions');
      const savedActiveId = localStorage.getItem('gemma_chat_active_id');
      const savedMessages = localStorage.getItem('gemma_chat_messages_map');

      let parsedSessions: ChatSession[] = [];
      let parsedActiveId = '';
      let parsedMessages: Record<string, Message[]> = {};

      if (savedSessions) {
        try {
          const parsed = JSON.parse(savedSessions);
          parsedSessions = parsed.map((s: Partial<ChatSession>) => ({
            id: s.id,
            title: s.title || 'New Chat',
            pinned: s.pinned || false,
            persona: s.persona || loadedSettings.persona || 'general',
            customSystemPrompt: s.customSystemPrompt || loadedSettings.customSystemPrompt || '',
            gptId: s.gptId,
            gptName: s.gptName,
            gptAvatarEmoji: s.gptAvatarEmoji,
            gptAvatarBg: s.gptAvatarBg,
            gptDescription: s.gptDescription,
            gptStarterPrompts: s.gptStarterPrompts,
            activeStyle: s.activeStyle || 'normal',
            activeSkill: s.activeSkill || 'default',
            thinkingEnabled: s.thinkingEnabled ?? false,
            webSearchEnabled: s.webSearchEnabled ?? false,
            projectId: s.projectId
          }));
        } catch (e) {
          console.error('Failed to parse sessions', e);
        }
      }

      // Load Custom GPTs
      const savedCustomGpts = localStorage.getItem('gemma_chat_custom_gpts');
      if (savedCustomGpts) {
        try {
          setCustomGpts(JSON.parse(savedCustomGpts));
        } catch (e) {
          console.error('Failed to parse custom GPTs', e);
        }
      }

      if (savedActiveId) {
        parsedActiveId = savedActiveId;
      }

      if (savedMessages) {
        try {
          parsedMessages = JSON.parse(savedMessages);
        } catch (e) {
          console.error('Failed to parse messages map', e);
        }
      }

      // If no sessions, initialize with a default one
      if (parsedSessions.length === 0) {
        const defaultSessionId = Date.now().toString();
        const defaultSession: ChatSession = {
          id: defaultSessionId,
          title: 'Welcome Conversation',
          pinned: false,
          persona: loadedSettings.persona || 'general',
          customSystemPrompt: loadedSettings.customSystemPrompt || 'You are a helpful, precise, and knowledgeable AI assistant.',
          activeStyle: 'normal',
          activeSkill: 'default',
          thinkingEnabled: false,
          webSearchEnabled: false,
        };
        parsedSessions = [defaultSession];
        parsedActiveId = defaultSessionId;
        parsedMessages = {
          [defaultSessionId]: [],
        };

        localStorage.setItem('gemma_chat_sessions', JSON.stringify(parsedSessions));
        localStorage.setItem('gemma_chat_active_id', defaultSessionId);
        localStorage.setItem('gemma_chat_messages_map', JSON.stringify(parsedMessages));
      }

      setSessions(parsedSessions);
      setActiveSessionId(parsedActiveId);
      setMessagesMap(parsedMessages);

      // Responsive: collapse sidebar on small screens initially
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    }, 0);

    return () => clearTimeout(mountTimer);
  }, []);

  // Apply Light/Dark/System appearance mode
  useEffect(() => {
    const mode = settings.appearanceMode || 'dark';
    const applyMode = (isDark: boolean) => {
      document.documentElement.classList.toggle('light-mode', !isDark);
    };
    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyMode(mq.matches);
      const handler = (e: MediaQueryListEvent) => applyMode(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      applyMode(mode !== 'light');
    }
  }, [settings.appearanceMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside an input/textarea/contenteditable
      const tag = (e.target as HTMLElement).tagName;
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;

      // Ctrl+N or Cmd+N — New Chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleCreateSession();
        return;
      }
      // Ctrl+, — Open Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
        return;
      }
      // Ctrl+/ — Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
        return;
      }
      // Ctrl+K — Toggle Sidebar (also commonly used)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
        return;
      }
      // Ctrl+Shift+F — Open Global Search
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }
      // Escape — Close any open modal
      if (e.key === 'Escape') {
        if (isSettingsOpen) { setIsSettingsOpen(false); return; }
        if (isSearchOpen) { setIsSearchOpen(false); return; }
        if (isPromptLibraryOpen) { setIsPromptLibraryOpen(false); return; }
        if (isExploreGptsOpen) { setIsExploreGptsOpen(false); return; }
        if (isProjectModalOpen) { setIsProjectModalOpen(false); return; }
        if (isVoiceModeOpen) { setIsVoiceModeOpen(false); return; }
      }
      void isEditable;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isSearchOpen, isPromptLibraryOpen, isExploreGptsOpen, isProjectModalOpen, isVoiceModeOpen]);

  // Synchronize thinkingEnabled and webSearchEnabled states when active session changes
  useEffect(() => {
    const activeSession = sessions.find(s => s.id === activeSessionId);
    if (activeSession) {
      const nextThinking = activeSession.thinkingEnabled ?? false;
      const nextWebSearch = activeSession.webSearchEnabled ?? false;
      const syncTimer = setTimeout(() => {
        setThinkingEnabled(prev => prev === nextThinking ? prev : nextThinking);
        setWebSearchEnabled(prev => prev === nextWebSearch ? prev : nextWebSearch);
      }, 0);
      return () => clearTimeout(syncTimer);
    }
  }, [activeSessionId, sessions]);

  // 2. Persists states to LocalStorage when they change
  const saveSessionsToLocalStorage = (newSessions: ChatSession[]) => {
    localStorage.setItem('gemma_chat_sessions', JSON.stringify(newSessions));
  };

  const saveMessagesToLocalStorage = (newMap: Record<string, Message[]>) => {
    localStorage.setItem('gemma_chat_messages_map', JSON.stringify(newMap));
  };

  // 3. Create Session
  const handleCreateSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      pinned: false,
      persona: settings.persona || 'general',
      customSystemPrompt: settings.customSystemPrompt || 'You are a helpful, precise, and knowledgeable AI assistant.',
      activeStyle: 'normal',
      activeSkill: 'default',
      thinkingEnabled: false,
      webSearchEnabled: false,
    };
    const updatedSessions = [newSession, ...sessions];
    const updatedMessagesMap = {
      ...messagesMap,
      [newId]: [],
    };

    setSessions(updatedSessions);
    setActiveSessionId(newId);
    setMessagesMap(updatedMessagesMap);

    saveSessionsToLocalStorage(updatedSessions);
    saveMessagesToLocalStorage(updatedMessagesMap);
    localStorage.setItem('gemma_chat_active_id', newId);

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // 4. Select Session
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    localStorage.setItem('gemma_chat_active_id', id);

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // 5. Delete Session
  const handleDeleteSession = (id: string) => {
    const updatedSessions = sessions.filter((s) => s.id !== id);
    
    const updatedMessagesMap = { ...messagesMap };
    delete updatedMessagesMap[id];

    let newActiveId = activeSessionId;
    if (activeSessionId === id) {
      newActiveId = updatedSessions.length > 0 ? updatedSessions[0].id : '';
    }

    setSessions(updatedSessions);
    setActiveSessionId(newActiveId);
    setMessagesMap(updatedMessagesMap);

    saveSessionsToLocalStorage(updatedSessions);
    saveMessagesToLocalStorage(updatedMessagesMap);
    localStorage.setItem('gemma_chat_active_id', newActiveId);

    if (updatedSessions.length === 0) {
      setTimeout(() => {
        handleCreateSession();
      }, 50);
    }
  };

  // 6. Rename Session
  const handleRenameSession = (id: string, newTitle: string) => {
    const updatedSessions = sessions.map((s) => 
      s.id === id ? { ...s, title: newTitle } : s
    );
    setSessions(updatedSessions);
    saveSessionsToLocalStorage(updatedSessions);
  };

  // 7. Toggle Pin Session
  const handleTogglePinSession = (id: string) => {
    const updatedSessions = sessions.map((s) => 
      s.id === id ? { ...s, pinned: !s.pinned } : s
    );
    setSessions(updatedSessions);
    saveSessionsToLocalStorage(updatedSessions);
  };

  // 8. Save Settings
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('gemma_chat_settings', JSON.stringify(newSettings));

    if (activeSessionId) {
      const updatedSessions = sessions.map((s) => 
        s.id === activeSessionId 
          ? { ...s, persona: newSettings.persona, customSystemPrompt: newSettings.customSystemPrompt } 
          : s
      );
      setSessions(updatedSessions);
      saveSessionsToLocalStorage(updatedSessions);
    }
  };

  // 8.1. Projects Helpers
  const saveProjectsToLocalStorage = (newProjects: Project[]) => {
    localStorage.setItem('gemma_projects', JSON.stringify(newProjects));
  };

  const handleSaveProject = (name: string, description: string, instructions: string) => {
    let updatedProjects: Project[] = [];
    if (activeEditingProject) {
      // Edit mode
      updatedProjects = projects.map(p =>
        p.id === activeEditingProject.id
          ? { ...p, name, description, instructions }
          : p
      );
      setActiveEditingProject(null);
    } else {
      // Create mode
      const newProject: Project = {
        id: Date.now().toString(),
        name,
        description,
        instructions,
        createdAt: Date.now()
      };
      updatedProjects = [newProject, ...projects];
    }
    setProjects(updatedProjects);
    saveProjectsToLocalStorage(updatedProjects);
  };

  const handleDeleteProject = (projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    saveProjectsToLocalStorage(updatedProjects);

    // Remove this project ID from any chats
    const updatedSessions = sessions.map(s =>
      s.projectId === projectId ? { ...s, projectId: undefined } : s
    );
    setSessions(updatedSessions);
    saveSessionsToLocalStorage(updatedSessions);
  };

  const handleMoveSessionToProject = (sessionId: string, projectId?: string) => {
    const updatedSessions = sessions.map(s =>
      s.id === sessionId ? { ...s, projectId } : s
    );
    setSessions(updatedSessions);
    saveSessionsToLocalStorage(updatedSessions);
  };

  // 8.5. Handle quick model switching from input toolbar
  const handleModelChange = (modelId: string) => {
    setSettings(prev => {
      const updated = { ...prev, model: modelId };
      localStorage.setItem('gemma_chat_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleThinkingToggle = (val: boolean) => {
    setThinkingEnabled(val);
    if (activeSessionId) {
      const updatedSessions = sessions.map(s =>
        s.id === activeSessionId ? { ...s, thinkingEnabled: val } : s
      );
      setSessions(updatedSessions);
      saveSessionsToLocalStorage(updatedSessions);
    }
  };

  const handleWebSearchToggle = (val: boolean) => {
    setWebSearchEnabled(val);
    if (activeSessionId) {
      const updatedSessions = sessions.map(s =>
        s.id === activeSessionId 
          ? { ...s, webSearchEnabled: val, thinkingEnabled: val ? false : s.thinkingEnabled } 
          : s
      );
      setSessions(updatedSessions);
      saveSessionsToLocalStorage(updatedSessions);
      if (val) {
        setThinkingEnabled(false);
      }
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // 9. Core Streaming Logic (shared between send, edit, and regenerate)
  const triggerStreaming = async (history: Message[]) => {
    if (!activeSessionId) return;
    setIsLoading(true);

    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Synchronize Voice overlay stream states
    setVoiceActiveResponse('');
    setVoiceIsLoading(true);
    setVoiceIsFinished(false);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };

    // Optimistically push empty assistant message bubble
    setMessagesMap((prev) => ({
      ...prev,
      [activeSessionId]: [...history, assistantMessage],
    }));

    try {
      const activeSession = sessions.find((s) => s.id === activeSessionId);
      
      const STYLE_PROMPTS: Record<string, string> = {
        learning: "\n[STYLE GUIDE: LEARNING]\nAdopt an educational, encouraging tone. Explain technical jargon using simple analogies. Break down difficult concepts into step-by-step paragraphs. Focus on building user comprehension.",
        concise: "\n[STYLE GUIDE: CONCISE]\nProvide extremely brief, direct, and dense responses. Cut all conversational filler, preambles, and introductory/concluding remarks. Answer only what is asked in the shortest readable way.",
        explanatory: "\n[STYLE GUIDE: EXPLANATORY]\nAdopt a deep, academic, explanatory tone. Provide comprehensive step-by-step descriptions, including background theory, structural outline, and edge cases. Ensure no detail is skipped.",
        formal: "\n[STYLE GUIDE: FORMAL]\nAdopt a highly professional, polite, and academic tone. Avoid informal expressions, contractions (e.g. use 'do not' instead of 'don't'), and friendly banter. Structure replies neatly with formal headers."
      };

      const SKILL_PROMPTS: Record<string, string> = {
        debugger: "\n[SPECIAL SKILL: CODE DEBUGGER]\nAct as a senior software architect and diagnostic specialist. When code is requested or presented: debug errors immediately, write comprehensive unit tests, identify security flaws (OWASP), and offer detailed complexity analysis (Big O).",
        inspector: "\n[SPECIAL SKILL: UI/UX INSPECTOR]\nAct as an expert UX Auditor and UI Designer. Focus heavily on visual hierarchy, Material design layouts, accessibility guidelines (WCAG 2.1 AA compliance), responsive breakpoints, and smooth micro-animations. Offer actionable design critiques.",
        tutor: "\n[SPECIAL SKILL: LANGUAGE TUTOR]\nAct as a professional language coach. When translating or replying: explain grammar rules, point out vocabulary variations, check spelling, and offer side-by-side translation comparisons in tables."
      };

      let compiledSystemPrompt = activeSession?.customSystemPrompt || settings.customSystemPrompt || '';
      if (activeSession?.projectId) {
        const project = projects.find(p => p.id === activeSession.projectId);
        if (project?.instructions) {
          compiledSystemPrompt += `\n\n[PROJECT CONTEXT & INSTRUCTIONS: "${project.name}"]\n${project.instructions}`;
        }
      }
      
      // Inject AI memories from Memory Bank
      if (typeof window !== 'undefined') {
        const savedMemories = localStorage.getItem('gemma_memories');
        if (savedMemories) {
          try {
            const parsedMem = JSON.parse(savedMemories);
            if (parsedMem.length > 0) {
              compiledSystemPrompt += `\n\n[USER CONTEXT & MEMORY BANK (Remember these key facts about the user):]\n`;
              parsedMem.forEach((m: { key: string; value: string }) => {
                compiledSystemPrompt += `- ${m.key}: ${m.value}\n`;
              });
            }
          } catch {}
        }
      }
      if (activeSession?.activeStyle && STYLE_PROMPTS[activeSession.activeStyle]) {
        compiledSystemPrompt += STYLE_PROMPTS[activeSession.activeStyle];
      }
      if (activeSession?.activeSkill && SKILL_PROMPTS[activeSession.activeSkill]) {
        compiledSystemPrompt += SKILL_PROMPTS[activeSession.activeSkill];
      }
      compiledSystemPrompt += "\n\n[SANDBOX PLAYGROUND INSTRUCTIONS]\nWhen writing complex, multi-file code, layouts, or components (such as React, HTML, JS, CSS, TSX), separate each file with the following partition syntax:\n---\nFile: path/to/filename.ext\n---\nCode content here\n\nExample:\n---\nFile: components/CustomButton.tsx\n---\nexport const CustomButton = () => { ... }\n\nEnsure there is at least one primary entry file, typically named 'App.tsx' for React or 'index.html' for raw web layouts.";

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history.map(m => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments
          })),
          model: settings.model,
          apiKey: settings.apiKey,
          provider: settings.provider || 'gemini',
          temperature: settings.temperature,
          systemPrompt: compiledSystemPrompt,
          thinkingEnabled,
          webSearchEnabled
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to stream response');
      }

      if (!response.body) {
        throw new Error('Response body is unreadable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamedContent += chunk;

        setVoiceActiveResponse(streamedContent);

        setMessagesMap((prev) => {
          const prevMsgs = prev[activeSessionId] || [];
          const updated = prevMsgs.map((m) =>
            m.id === assistantMessageId ? { ...m, content: streamedContent } : m
          );
          return { ...prev, [activeSessionId]: updated };
        });
      }

      // Save to localStorage once when streaming finishes
      setMessagesMap((prev) => {
        const prevMsgs = prev[activeSessionId] || [];
        const updated = prevMsgs.map((m) =>
          m.id === assistantMessageId ? { ...m, content: streamedContent } : m
        );
        const newMap = { ...prev, [activeSessionId]: updated };
        saveMessagesToLocalStorage(newMap);
        return newMap;
      });

      setVoiceIsFinished(true);

    } catch (error) {
      const err = error as Error;
      // If aborted by user — preserve partial content, don't show error
      if (err.name === 'AbortError') {
        setMessagesMap((prev) => {
          const newMap = { ...prev };
          saveMessagesToLocalStorage(newMap);
          return newMap;
        });
        setVoiceIsFinished(true);
      } else {
        console.error('Error during chat stream:', err);
        const errorMsg = `[ERROR] An error occurred: ${err.message || 'Check your API Key settings.'}`;
        setVoiceActiveResponse(errorMsg);
        setVoiceIsFinished(true);

        setMessagesMap((prev) => {
          const prevMsgs = prev[activeSessionId] || [];
          const updated = prevMsgs.map((m) =>
            m.id === assistantMessageId 
              ? { ...m, content: errorMsg } 
              : m
          );
          const newMap = { ...prev, [activeSessionId]: updated };
          saveMessagesToLocalStorage(newMap);
          return newMap;
        });
      }
    } finally {
      setIsLoading(false);
      setVoiceIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const generateThreadTitle = async (sessionId: string, userPrompt: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Analyze this user query and create an optimized 3-to-4 word title encapsulating this exact request. Return ONLY the raw string value of the title immediately with no quotation marks, no preamble, and no explanation. Query: "${userPrompt}"`
            }
          ],
          model: settings.model,
          apiKey: settings.apiKey,
          temperature: 0.3,
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let titleText = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          titleText += decoder.decode(value, { stream: true });
        }
        
        let cleanTitle = titleText.trim();
        cleanTitle = cleanTitle.replace(/^["']|["']$/g, '').replace(/\.$/, '').trim();
        
        if (cleanTitle && cleanTitle.length < 50 && !cleanTitle.includes('[ERROR]')) {
          setSessions(prevSessions => {
            const next = prevSessions.map(s =>
              s.id === sessionId ? { ...s, title: cleanTitle } : s
            );
            saveSessionsToLocalStorage(next);
            return next;
          });
        }
      }
    } catch (err) {
      console.warn("Failed to generate thread title in background:", err);
    }
  };

  const checkForAutomaticMemory = async (content: string) => {
    try {
      const lower = content.toLowerCase();
      const triggers = [
        'remember', 'prefer', 'favorite', 'always use', 'startup is called', 
        'my name is', 'i live in', 'i work as', 'i am a', 'my tech stack',
        'preferred language', 'use postgresql', 'use supabase', 'use next.js'
      ];
      const matches = triggers.some(t => lower.includes(t));
      if (!matches) return;

      const memoryPrompt = `Analyze the user's statement for any key personal facts, technical preferences, or business details that should be remembered for future conversations.
If you find a fact (e.g. preferred programming language is TypeScript, startup name is NovaAI, database is PostgreSQL), extract it into a key-value format.
Return ONLY a valid JSON object in this format: {"key": "Short Category", "value": "Detailed fact about the user"}.
If no important preference or fact is found, return the word "null".
Do not include any markdown formatting, code block backticks, or extra text.

User Statement: "${content}"`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: memoryPrompt
            }
          ],
          model: 'gemini-2.5-flash',
          apiKey: settings.apiKey,
          temperature: 0.1,
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let resultText = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          resultText += decoder.decode(value, { stream: true });
        }
        
        let cleanResult = resultText.trim();
        cleanResult = cleanResult.replace(/^```json|```$/g, '').trim();
        
        if (cleanResult && cleanResult !== 'null' && !cleanResult.includes('[ERROR]')) {
          const parsed = JSON.parse(cleanResult);
          if (parsed.key && parsed.value) {
            const savedMemories = localStorage.getItem('gemma_memories');
            let currentMemories: { id: string; key: string; value: string }[] = [];
            if (savedMemories) {
              try { currentMemories = JSON.parse(savedMemories); } catch {}
            }
            
            const existsIdx = currentMemories.findIndex(
              (m) => m.key.toLowerCase() === parsed.key.toLowerCase()
            );
            const newMem = {
              id: Date.now().toString(),
              key: parsed.key,
              value: parsed.value
            };
            
            let updated;
            if (existsIdx > -1) {
              updated = [...currentMemories];
              updated[existsIdx] = newMem;
            } else {
              updated = [...currentMemories, newMem];
            }
            
            localStorage.setItem('gemma_memories', JSON.stringify(updated));
          }
        }
      }
    } catch (err) {
      console.warn("Failed automatic memory detection:", err);
    }
  };

  // Send Message
  const handleSendMessage = async (content: string, attachments: Attachment[]) => {
    if (!activeSessionId) return;

    // Filter text files to embed them inline in the message text content
    let finalContent = content;
    const textAttachments = attachments.filter(att => att.textContent);
    
    if (textAttachments.length > 0) {
      if (finalContent) finalContent += '\n\n';
      finalContent += `[CONTEXT ATTACHMENT: SOURCE CODE REFERENCES]\n`;
      textAttachments.forEach(att => {
        finalContent += `======================================================\n`;
        finalContent += `FILE PATH: ${att.name}\n`;
        finalContent += `======================================================\n`;
        finalContent += `${att.textContent}\n`;
        finalContent += `======================================================\n\n`;
      });
    }

    // Binary attachments are sent as actual model attachments
    const binaryAttachments = attachments.filter(att => att.data).map(att => ({
      name: att.name,
      type: att.type,
      data: att.data
    }));

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: finalContent,
      attachments: binaryAttachments.length > 0 ? binaryAttachments : undefined
    };

    const currentMessages = messagesMap[activeSessionId] || [];
    const updatedMessages = [...currentMessages, userMessage];
    
    const updatedMessagesMap = {
      ...messagesMap,
      [activeSessionId]: updatedMessages,
    };

    setMessagesMap(updatedMessagesMap);
    saveMessagesToLocalStorage(updatedMessagesMap);

    // If first user message, generate title based on prompt
    const isFirstUserMessage = currentMessages.length === 0;
    if (isFirstUserMessage) {
      const generatedTitle = content.length > 26 ? content.slice(0, 24) + '...' : content;
      handleRenameSession(activeSessionId, generatedTitle);
      
      // Asynchronously generate optimized contextual title in background without blocking
      generateThreadTitle(activeSessionId, content);
    }

    await triggerStreaming(updatedMessages);
    
    // Background automatic memory check
    checkForAutomaticMemory(content);
  };

  // Edit Message
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!activeSessionId) return;

    const currentMessages = messagesMap[activeSessionId] || [];
    const index = currentMessages.findIndex(m => m.id === messageId);
    if (index === -1) return;

    // Truncate message list and update the user message content
    const truncatedHistory = currentMessages.slice(0, index);
    const updatedUserMsg: Message = {
      ...currentMessages[index],
      content: newContent,
    };
    
    const finalHistory = [...truncatedHistory, updatedUserMsg];
    
    setMessagesMap(prev => ({
      ...prev,
      [activeSessionId]: finalHistory
    }));

    await triggerStreaming(finalHistory);
  };

  // Regenerate Response
  const handleRegenerateMessage = async (messageId: string) => {
    if (!activeSessionId) return;

    const currentMessages = messagesMap[activeSessionId] || [];
    const index = currentMessages.findIndex(m => m.id === messageId);
    if (index === -1) return;

    // Truncate history before this assistant message
    const finalHistory = currentMessages.slice(0, index);
    
    setMessagesMap(prev => ({
      ...prev,
      [activeSessionId]: finalHistory
    }));

    await triggerStreaming(finalHistory);
  };

  // Delete Message
  const handleDeleteMessage = (messageId: string) => {
    if (!activeSessionId) return;
    const currentMessages = messagesMap[activeSessionId] || [];
    const updated = currentMessages.filter(m => m.id !== messageId);
    setMessagesMap(prev => ({
      ...prev,
      [activeSessionId]: updated
    }));
    const newMap = {
      ...messagesMap,
      [activeSessionId]: updated
    };
    saveMessagesToLocalStorage(newMap);
  };

  // Custom GPT handlers
  const handleSaveGpt = (savedGpt: CustomGpt) => {
    setCustomGpts(prev => {
      const exists = prev.some(g => g.id === savedGpt.id);
      let next;
      if (exists) {
        next = prev.map(g => g.id === savedGpt.id ? savedGpt : g);
      } else {
        next = [...prev, savedGpt];
      }
      localStorage.setItem('gemma_chat_custom_gpts', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteGpt = (id: string) => {
    setCustomGpts(prev => {
      const next = prev.filter(g => g.id !== id);
      localStorage.setItem('gemma_chat_custom_gpts', JSON.stringify(next));
      return next;
    });
  };

  const handleSelectGpt = (gpt: CustomGpt) => {
    setIsExploreGptsOpen(false);

    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: gpt.name,
      pinned: false,
      persona: 'custom',
      customSystemPrompt: gpt.systemInstruction,
      gptId: gpt.id,
      gptName: gpt.name,
      gptAvatarEmoji: gpt.avatarEmoji,
      gptAvatarBg: gpt.avatarBg,
      gptDescription: gpt.description,
      gptStarterPrompts: gpt.starterPrompts,
      activeStyle: 'normal',
      activeSkill: 'default',
      thinkingEnabled: false,
      webSearchEnabled: false
    };

    const updatedSessions = [newSession, ...sessions];
    const updatedMessagesMap = {
      ...messagesMap,
      [newId]: [],
    };

    setSessions(updatedSessions);
    setActiveSessionId(newId);
    setMessagesMap(updatedMessagesMap);

    saveSessionsToLocalStorage(updatedSessions);
    saveMessagesToLocalStorage(updatedMessagesMap);
    localStorage.setItem('gemma_chat_active_id', newId);

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleStyleChange = (styleId: string) => {
    if (!activeSessionId) return;
    const updatedSessions = sessions.map(s => 
      s.id === activeSessionId ? { ...s, activeStyle: styleId } : s
    );
    setSessions(updatedSessions);
    saveSessionsToLocalStorage(updatedSessions);
  };

  const handleSkillChange = (skillId: string) => {
    if (!activeSessionId) return;
    const updatedSessions = sessions.map(s => 
      s.id === activeSessionId ? { ...s, activeSkill: skillId } : s
    );
    setSessions(updatedSessions);
    saveSessionsToLocalStorage(updatedSessions);
  };

  const activeMessages = messagesMap[activeSessionId] || [];
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const activeSessionTitle = activeSession ? activeSession.title : 'Chat Session';

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#090d16] text-indigo-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-wider uppercase opacity-80">Loading Workspace...</span>
        </div>
      </div>
    );
  }

  // Force gemini-2.5-flash text label if web search is enabled
  const activeModelFriendlyName = webSearchEnabled 
    ? 'Gemini 2.5 Flash Grounded' 
    : settings.model.includes('gemma-4') 
      ? 'Gemma 4' 
      : settings.model;

  return (
    <div className={`flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans ${
      settings.theme === 'claude' 
        ? 'theme-claude' 
        : settings.theme === 'midnight' 
          ? 'theme-midnight' 
          : settings.theme === 'cyberpunk' 
            ? 'theme-cyberpunk' 
            : settings.theme === 'forest' 
              ? 'theme-forest' 
              : ''
    }`}>
      {/* Sidebar Navigation */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onTogglePinSession={handleTogglePinSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenExploreGpts={() => setIsExploreGptsOpen(true)}
        projects={projects}
        onCreateProject={() => {
          setActiveEditingProject(null);
          setIsProjectModalOpen(true);
        }}
        onEditProject={(project) => {
          setActiveEditingProject(project);
          setIsProjectModalOpen(true);
        }}
        onDeleteProject={handleDeleteProject}
        onMoveSessionToProject={handleMoveSessionToProject}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenPromptLibrary={() => setIsPromptLibraryOpen(true)}
      />

      <ChatArea
        messages={activeMessages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onStopGeneration={handleStopGeneration}
        activeModelName={activeModelFriendlyName}
        onOpenSettings={() => setIsSettingsOpen(true)}
        thinkingEnabled={thinkingEnabled}
        setThinkingEnabled={handleThinkingToggle}
        webSearchEnabled={webSearchEnabled}
        setWebSearchEnabled={handleWebSearchToggle}
        onEditMessage={handleEditMessage}
        onRegenerateMessage={handleRegenerateMessage}
        onDeleteMessage={handleDeleteMessage}
        activeSessionTitle={activeSessionTitle}
        onOpenVoiceMode={() => setIsVoiceModeOpen(true)}
        selectedModel={settings.model}
        onModelChange={handleModelChange}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        gptName={activeSession?.gptName}
        gptAvatarEmoji={activeSession?.gptAvatarEmoji}
        gptAvatarBg={activeSession?.gptAvatarBg}
        gptDescription={activeSession?.gptDescription}
        gptStarterPrompts={activeSession?.gptStarterPrompts}
        activeStyle={activeSession?.activeStyle}
        activeSkill={activeSession?.activeSkill}
        onStyleChange={handleStyleChange}
        onSkillChange={handleSkillChange}
        injectedPrompt={injectedPrompt}
        clearInjectedPrompt={() => setInjectedPrompt('')}
        onOpenPromptLibrary={() => setIsPromptLibraryOpen(true)}
      />

      {/* Configuration Settings Modal Overlay */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* ChatGPT-Style Voice Mode Overlay */}
      <VoiceModeOverlay
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
        onSendMessage={handleSendMessage}
        activeResponseText={voiceActiveResponse}
        isLoading={voiceIsLoading}
        isFinished={voiceIsFinished}
      />

      {/* Explore & Create Custom GPTs Modal Overlay */}
      <ExploreGptsModal
        isOpen={isExploreGptsOpen}
        onClose={() => setIsExploreGptsOpen(false)}
        customGpts={customGpts}
        onSaveGpt={handleSaveGpt}
        onDeleteGpt={handleDeleteGpt}
        onSelectGpt={handleSelectGpt}
      />

      {/* Project Workspace Modal Overlay */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setActiveEditingProject(null);
        }}
        project={activeEditingProject}
        onSave={handleSaveProject}
      />

      {/* Prompt Library Modal Overlay */}
      <PromptLibraryModal
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelectPrompt={(content) => setInjectedPrompt(content)}
      />

      {/* Global Workspace Search Modal Overlay */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        sessions={sessions}
        messagesMap={messagesMap}
        projects={projects}
        onSelectSession={handleSelectSession}
      />
    </div>
  );
}
