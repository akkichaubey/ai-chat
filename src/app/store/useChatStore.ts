import { create } from 'zustand';
import { useSettingsStore } from './useSettingsStore';
import { useProjectStore } from './useProjectStore';
import { useUsageStore } from './useUsageStore';
import { useLocalProjectStore, getCachedFile } from './useLocalProjectStore';
import { fetchGitHubProfile } from '../lib/githubFetcher';
import { useGitHubRepoStore } from './useGitHubRepoStore';

export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64
  previewUrl?: string;
  textContent?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

export interface ChatSession {
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
  gptTemperature?: number;
  activeStyle?: string;
  activeSkill?: string;
  thinkingEnabled?: boolean;
  webSearchEnabled?: boolean;
  projectId?: string;
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string;
  messagesMap: Record<string, Message[]>;
  thinkingEnabled: boolean;
  webSearchEnabled: boolean;
  isLoading: boolean;
  isVoiceModeOpen: boolean;
  voiceActiveResponse: string;
  voiceIsLoading: boolean;
  voiceIsFinished: boolean;
  abortController: AbortController | null;

  // Actions
  initialize: () => void;
  setSessions: (sessions: ChatSession[]) => void;
  setActiveSessionId: (id: string) => void;
  setMessagesMap: (messagesMap: Record<string, Message[]>) => void;
  createNewSession: (projectId?: string) => void;
  selectGpt: (gpt: any) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  pinSession: (id: string, pinned: boolean) => void;
  moveSessionToProject: (sessionId: string, projectId?: string) => void;
  updateSessionField: <K extends keyof ChatSession>(id: string, field: K, value: ChatSession[K]) => void;
  
  setThinkingEnabled: (val: boolean) => void;
  setWebSearchEnabled: (val: boolean) => void;
  setVoiceModeOpen: (isOpen: boolean) => void;
  setVoiceActiveResponse: (resp: string) => void;
  setVoiceIsLoading: (val: boolean) => void;
  setVoiceIsFinished: (val: boolean) => void;
  setIsLoading: (val: boolean) => void;
  
  sendMessage: (content: string, attachments: Attachment[]) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => void;
  stopGeneration: () => void;
}

export const useChatStore = create<ChatState>((set, get) => {
  // Core Streaming logic inside store
  const triggerStreaming = async (history: Message[], attachedFilesCopy?: string[]) => {
    const { activeSessionId, sessions, messagesMap } = get();
    if (!activeSessionId) return;

    set({ isLoading: true, voiceActiveResponse: '', voiceIsLoading: true, voiceIsFinished: false });

    const controller = new AbortController();
    set({ abortController: controller });

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: ''
    };

    const newHistory = [...history, assistantMessage];
    const newMessagesMap = { ...messagesMap, [activeSessionId]: newHistory };

    set({ messagesMap: newMessagesMap });
    localStorage.setItem('gemma_chat_messages_map', JSON.stringify(newMessagesMap));

    try {
      const activeSession = sessions.find((s) => s.id === activeSessionId);
      const settings = useSettingsStore.getState().settings;
      const projects = useProjectStore.getState().projects;

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

        // Codebase context injection
        try {
          const { projectSummary, chatWithCodebase, searchCodebase } = useLocalProjectStore.getState();
          if (projectSummary) {
            compiledSystemPrompt += `\n\n[CONNECTED LOCAL CODEBASE INFO]\nTech Stack: ${projectSummary.framework}\n${projectSummary.structureSummary}`;
          }

          // 1. Manually attached files
          const filesToLoad = attachedFilesCopy || [];
          if (filesToLoad.length > 0) {
            let attachedContent = '';
            for (const filePath of filesToLoad) {
              const cached = await getCachedFile(activeSession.projectId, filePath);
              if (cached) {
                attachedContent += `\n---\nFile: ${filePath}\n---\n${cached.content}\n`;
              }
            }
            if (attachedContent) {
              compiledSystemPrompt += `\n\n[MANUALLY ATTACHED CODE FILES]\n${attachedContent}`;
            }
          }

          // 2. Chat with Codebase (grounding keyword search)
          if (chatWithCodebase) {
            const lastUserMessage = [...history].reverse().find(m => m.role === 'user');
            const userPrompt = lastUserMessage?.content || '';
            if (userPrompt) {
              const searchResults = await searchCodebase(activeSession.projectId, userPrompt);
              if (searchResults.length > 0) {
                let groundingContent = '';
                for (const result of searchResults) {
                  // Avoid double-including if already manually attached
                  if (filesToLoad.includes(result.path)) continue;

                  const cached = await getCachedFile(activeSession.projectId, result.path);
                  if (cached) {
                    groundingContent += `\n---\nFile: ${result.path} (Relevance Score: ${result.score})\n---\n${cached.content}\n`;
                  }
                }
                if (groundingContent) {
                  compiledSystemPrompt += `\n\n[ADDITIONAL CODEBASE CONTEXT (Grounding search matches)]\n${groundingContent}`;
                }
              }
            }
          }
        } catch (err) {
          console.warn('Error reading codebase context during stream:', err);
        }
      }

      // Inject GitHub profile context if configured
      try {
        const { githubUsername, githubToken } = settings;
        if (githubUsername && githubUsername.trim()) {
          const ghData = await fetchGitHubProfile(githubUsername.trim(), githubToken?.trim());
          if (ghData) {
            compiledSystemPrompt += `\n\n[GITHUB PROFILE CONTEXT]\n${ghData.contextMarkdown}`;
          }
        }
      } catch (ghErr) {
        console.warn('Error fetching GitHub profile context:', ghErr);
      }

      // Inject connected GitHub Repo context
      try {
        const { isIndexed, repoSummary, cachedFiles, searchFiles, owner, repo } = useGitHubRepoStore.getState();
        if (isIndexed && repoSummary) {
          compiledSystemPrompt += `\n\n[CONNECTED GITHUB REPOSITORY: ${owner}/${repo}]\n${repoSummary}`;

          // Keyword-search relevant source files based on user's prompt
          const lastUserMsg = [...history].reverse().find(m => m.role === 'user');
          const userPrompt = lastUserMsg?.content || '';
          if (userPrompt) {
            const matchedFiles = searchFiles(userPrompt).slice(0, 8);
            const alreadyIncluded = new Set<string>();
            let fileContext = '';
            for (const item of matchedFiles) {
              const content = cachedFiles[item.path];
              if (content && !alreadyIncluded.has(item.path)) {
                alreadyIncluded.add(item.path);
                fileContext += `\n---\nFile: ${item.path}\n---\n${content}\n`;
              }
            }
            if (fileContext) {
              compiledSystemPrompt += `\n\n[RELEVANT SOURCE FILES FROM REPO]\n${fileContext}`;
            }
          }
        }
      } catch (repoErr) {
        console.warn('Error injecting GitHub repo context:', repoErr);
      }

      // Inject AI memories from Memory Bank
      const memories = useProjectStore.getState().memories;
      if (memories.length > 0) {
        compiledSystemPrompt += `\n\n[USER CONTEXT & MEMORY BANK (Remember these key facts about the user):]\n`;
        memories.forEach((m) => {
          compiledSystemPrompt += `- ${m.key}: ${m.value}\n`;
        });
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
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history.map(m => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments
          })),
          model: settings.model,
          apiKey: settings.apiKeys?.[settings.provider || 'gemini'] || settings.apiKey,
          provider: settings.provider || 'gemini',
          temperature: activeSession?.gptTemperature !== undefined ? activeSession.gptTemperature : settings.temperature,
          systemPrompt: compiledSystemPrompt,
          thinkingEnabled: get().thinkingEnabled,
          webSearchEnabled: get().webSearchEnabled
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorText = errorData.error || 'Failed to stream response';
        const errorMsg = `[ERROR] An error occurred: ${errorText}`;
        
        set({ voiceActiveResponse: errorMsg, voiceIsFinished: true });

        set((state) => {
          const prevMsgs = state.messagesMap[activeSessionId] || [];
          const updated = prevMsgs.map((m) =>
            m.id === assistantMessageId ? { ...m, content: errorMsg } : m
          );
          const finalMap = { ...state.messagesMap, [activeSessionId]: updated };
          localStorage.setItem('gemma_chat_messages_map', JSON.stringify(finalMap));
          return { messagesMap: finalMap };
        });
        
        set({ isLoading: false, voiceIsLoading: false, abortController: null });
        return;
      }

      if (!response.body) {
        const errorMsg = `[ERROR] An error occurred: Response body is unreadable`;
        
        set({ voiceActiveResponse: errorMsg, voiceIsFinished: true });

        set((state) => {
          const prevMsgs = state.messagesMap[activeSessionId] || [];
          const updated = prevMsgs.map((m) =>
            m.id === assistantMessageId ? { ...m, content: errorMsg } : m
          );
          const finalMap = { ...state.messagesMap, [activeSessionId]: updated };
          localStorage.setItem('gemma_chat_messages_map', JSON.stringify(finalMap));
          return { messagesMap: finalMap };
        });
        
        set({ isLoading: false, voiceIsLoading: false, abortController: null });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamedContent += chunk;

        set({ voiceActiveResponse: streamedContent });

        set((state) => {
          const prevMsgs = state.messagesMap[activeSessionId] || [];
          const updated = prevMsgs.map((m) =>
            m.id === assistantMessageId ? { ...m, content: streamedContent } : m
          );
          return { messagesMap: { ...state.messagesMap, [activeSessionId]: updated } };
        });
      }

      // Save complete stream to storage
      set((state) => {
        const prevMsgs = state.messagesMap[activeSessionId] || [];
        const updated = prevMsgs.map((m) =>
          m.id === assistantMessageId ? { ...m, content: streamedContent } : m
        );
        const finalMap = { ...state.messagesMap, [activeSessionId]: updated };
        localStorage.setItem('gemma_chat_messages_map', JSON.stringify(finalMap));
        return { messagesMap: finalMap };
      });

      // Track estimated token/request usage
      const userPrompt = history[history.length - 1]?.content || '';
      useUsageStore.getState().addUsage(userPrompt.length, streamedContent.length);

      set({ voiceIsFinished: true });
    } catch (error) {
      const err = error as Error;
      if (err.name === 'AbortError') {
        set((state) => {
          localStorage.setItem('gemma_chat_messages_map', JSON.stringify(state.messagesMap));
          return {};
        });
        set({ voiceIsFinished: true });
      } else {
        console.warn('Error during chat stream:', err);
        const errorMsg = `[ERROR] An error occurred: ${err.message || 'Check your API Key settings.'}`;
        set({ voiceActiveResponse: errorMsg, voiceIsFinished: true });

        set((state) => {
          const prevMsgs = state.messagesMap[activeSessionId] || [];
          const updated = prevMsgs.map((m) =>
            m.id === assistantMessageId ? { ...m, content: errorMsg } : m
          );
          const finalMap = { ...state.messagesMap, [activeSessionId]: updated };
          localStorage.setItem('gemma_chat_messages_map', JSON.stringify(finalMap));
          return { messagesMap: finalMap };
        });
      }
    } finally {
      set({ isLoading: false, voiceIsLoading: false, abortController: null });
    }
  };

  const generateThreadTitle = async (sessionId: string, userPrompt: string) => {
    try {
      const settings = useSettingsStore.getState().settings;
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Analyze this user query and create an optimized 3-to-4 word title encapsulating this exact request. Return ONLY the raw string value of the title immediately with no quotation marks, no preamble, and no explanation. Query: "${userPrompt}"`
            }
          ],
          model: settings.model,
          apiKey: settings.apiKeys?.[settings.provider || 'gemini'] || settings.apiKey,
          provider: settings.provider || 'gemini',
          temperature: 0.3
        })
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
          get().renameSession(sessionId, cleanTitle);
        }
      }
    } catch (err) {
      console.warn('Failed to generate thread title in background:', err);
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

      const settings = useSettingsStore.getState().settings;
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: memoryPrompt }],
          model: 'gemini-2.5-flash',
          apiKey: settings.apiKeys?.['gemini'] || settings.apiKey,
          provider: 'gemini',
          temperature: 0.1
        })
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
            useProjectStore.getState().saveMemory(parsed.key, parsed.value);
          }
        }
      }
    } catch (err) {
      console.warn('Failed automatic memory detection:', err);
    }
  };

  return {
    sessions: [],
    activeSessionId: '',
    messagesMap: {},
    thinkingEnabled: false,
    webSearchEnabled: false,
    isLoading: false,
    isVoiceModeOpen: false,
    voiceActiveResponse: '',
    voiceIsLoading: false,
    voiceIsFinished: false,
    abortController: null,

    initialize: () => {
      const savedSessions = localStorage.getItem('gemma_chat_sessions');
      const savedActiveId = localStorage.getItem('gemma_chat_active_id');
      const savedMessages = localStorage.getItem('gemma_chat_messages_map');

      let parsedSessions: ChatSession[] = [];
      let parsedActiveId = '';
      let parsedMessages: Record<string, Message[]> = {};

      const settings = useSettingsStore.getState().settings;

      if (savedSessions) {
        try {
          const parsed = JSON.parse(savedSessions);
          if (Array.isArray(parsed)) {
            parsedSessions = parsed.map((s: Partial<ChatSession>) => ({
              id: s.id || Date.now().toString(),
              title: s.title || 'New Chat',
              pinned: s.pinned || false,
              persona: s.persona || settings.persona || 'general',
              customSystemPrompt: s.customSystemPrompt || settings.customSystemPrompt || '',
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
          }
        } catch {}
      }

      if (savedActiveId) {
        parsedActiveId = savedActiveId;
      }

      if (savedMessages) {
        try {
          parsedMessages = JSON.parse(savedMessages);
        } catch {}
      }

      if (parsedSessions.length === 0) {
        const defaultSessionId = Date.now().toString();
        const defaultSession: ChatSession = {
          id: defaultSessionId,
          title: 'Welcome Conversation',
          pinned: false,
          persona: settings.persona || 'general',
          customSystemPrompt: settings.customSystemPrompt || 'You are a helpful, precise, and knowledgeable AI assistant.',
          activeStyle: 'normal',
          activeSkill: 'default',
          thinkingEnabled: false,
          webSearchEnabled: false
        };
        parsedSessions = [defaultSession];
        parsedActiveId = defaultSessionId;
        parsedMessages = { [defaultSessionId]: [] };

        localStorage.setItem('gemma_chat_sessions', JSON.stringify(parsedSessions));
        localStorage.setItem('gemma_chat_active_id', defaultSessionId);
        localStorage.setItem('gemma_chat_messages_map', JSON.stringify(parsedMessages));
      }

      set({
        sessions: parsedSessions,
        activeSessionId: parsedActiveId,
        messagesMap: parsedMessages,
        thinkingEnabled: parsedSessions.find(s => s.id === parsedActiveId)?.thinkingEnabled ?? false,
        webSearchEnabled: parsedSessions.find(s => s.id === parsedActiveId)?.webSearchEnabled ?? false
      });
    },

    setSessions: (sessions) => {
      set({ sessions });
      localStorage.setItem('gemma_chat_sessions', JSON.stringify(sessions));
    },

    setActiveSessionId: (activeSessionId) => {
      set({ activeSessionId });
      localStorage.setItem('gemma_chat_active_id', activeSessionId);

      const activeSession = get().sessions.find(s => s.id === activeSessionId);
      if (activeSession) {
        set({
          thinkingEnabled: activeSession.thinkingEnabled ?? false,
          webSearchEnabled: activeSession.webSearchEnabled ?? false
        });
      }
    },

    setMessagesMap: (messagesMap) => {
      set({ messagesMap });
      localStorage.setItem('gemma_chat_messages_map', JSON.stringify(messagesMap));
    },

    createNewSession: (projectId) => {
      const defaultSessionId = Date.now().toString();
      const settings = useSettingsStore.getState().settings;
      const newSession: ChatSession = {
        id: defaultSessionId,
        title: 'New Chat',
        pinned: false,
        persona: settings.persona || 'general',
        customSystemPrompt: settings.customSystemPrompt || '',
        activeStyle: 'normal',
        activeSkill: 'default',
        thinkingEnabled: false,
        webSearchEnabled: false,
        projectId
      };

      const updatedSessions = [newSession, ...get().sessions];
      const updatedMessagesMap = { ...get().messagesMap, [defaultSessionId]: [] };

      get().setSessions(updatedSessions);
      get().setMessagesMap(updatedMessagesMap);
      get().setActiveSessionId(defaultSessionId);
    },

    selectGpt: (gpt) => {
      const defaultSessionId = Date.now().toString();
      const newSession: ChatSession = {
        id: defaultSessionId,
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
        gptTemperature: gpt.temperature,
        activeStyle: 'normal',
        activeSkill: 'default',
        thinkingEnabled: false,
        webSearchEnabled: false
      };

      const updatedSessions = [newSession, ...get().sessions];
      const updatedMessagesMap = { ...get().messagesMap, [defaultSessionId]: [] };

      get().setSessions(updatedSessions);
      get().setMessagesMap(updatedMessagesMap);
      get().setActiveSessionId(defaultSessionId);
    },

    deleteSession: (id) => {
      const { sessions, activeSessionId, messagesMap } = get();
      const updatedSessions = sessions.filter(s => s.id !== id);
      
      const newMessagesMap = { ...messagesMap };
      delete newMessagesMap[id];

      get().setSessions(updatedSessions);
      get().setMessagesMap(newMessagesMap);

      if (activeSessionId === id) {
        if (updatedSessions.length > 0) {
          get().setActiveSessionId(updatedSessions[0].id);
        } else {
          get().createNewSession();
        }
      }
    },

    renameSession: (id, title) => {
      const updatedSessions = get().sessions.map(s =>
        s.id === id ? { ...s, title } : s
      );
      get().setSessions(updatedSessions);
    },

    pinSession: (id, pinned) => {
      const updatedSessions = get().sessions.map(s =>
        s.id === id ? { ...s, pinned } : s
      );
      get().setSessions(updatedSessions);
    },

    moveSessionToProject: (sessionId, projectId) => {
      const updatedSessions = get().sessions.map(s =>
        s.id === sessionId ? { ...s, projectId } : s
      );
      get().setSessions(updatedSessions);
    },

    updateSessionField: (id, field, value) => {
      const updatedSessions = get().sessions.map(s =>
        s.id === id ? { ...s, [field]: value } : s
      );
      get().setSessions(updatedSessions);
    },

    setThinkingEnabled: (val) => {
      const { activeSessionId } = get();
      set({ thinkingEnabled: val });
      if (activeSessionId) {
        get().updateSessionField(activeSessionId, 'thinkingEnabled', val);
        if (val) {
          set({ webSearchEnabled: false });
          get().updateSessionField(activeSessionId, 'webSearchEnabled', false);
        }
      }
    },

    setWebSearchEnabled: (val) => {
      const { activeSessionId } = get();
      set({ webSearchEnabled: val });
      if (activeSessionId) {
        get().updateSessionField(activeSessionId, 'webSearchEnabled', val);
        if (val) {
          set({ thinkingEnabled: false });
          get().updateSessionField(activeSessionId, 'thinkingEnabled', false);
        }
      }
    },

    setVoiceModeOpen: (isOpen) => set({ isVoiceModeOpen: isOpen }),
    setVoiceActiveResponse: (resp) => set({ voiceActiveResponse: resp }),
    setVoiceIsLoading: (val) => set({ voiceIsLoading: val }),
    setVoiceIsFinished: (val) => set({ voiceIsFinished: val }),
    setIsLoading: (val) => set({ isLoading: val }),

    sendMessage: async (content, attachments) => {
      const { activeSessionId, messagesMap } = get();
      if (!activeSessionId) return;

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

      get().setMessagesMap({ ...messagesMap, [activeSessionId]: updatedMessages });

      const isFirstUserMessage = currentMessages.length === 0;
      if (isFirstUserMessage) {
        const generatedTitle = content.length > 26 ? content.slice(0, 24) + '...' : content;
        get().renameSession(activeSessionId, generatedTitle);
        generateThreadTitle(activeSessionId, content);
      }

      // Capture and clear codebase file attachments immediately for UI feedback
      const attachedFilesCopy = [...(useLocalProjectStore.getState().attachedFiles || [])];
      useLocalProjectStore.getState().clearAttachments();

      await triggerStreaming(updatedMessages, attachedFilesCopy);
      checkForAutomaticMemory(content);
    },

    editMessage: async (messageId, newContent) => {
      const { activeSessionId, messagesMap } = get();
      if (!activeSessionId) return;

      const currentMessages = messagesMap[activeSessionId] || [];
      const index = currentMessages.findIndex(m => m.id === messageId);
      if (index === -1) return;

      const truncatedHistory = currentMessages.slice(0, index);
      const updatedUserMsg: Message = {
        ...currentMessages[index],
        content: newContent
      };
      
      const finalHistory = [...truncatedHistory, updatedUserMsg];
      get().setMessagesMap({ ...messagesMap, [activeSessionId]: finalHistory });

      await triggerStreaming(finalHistory);
    },

    regenerateMessage: async (messageId) => {
      const { activeSessionId, messagesMap } = get();
      if (!activeSessionId) return;

      const currentMessages = messagesMap[activeSessionId] || [];
      const index = currentMessages.findIndex(m => m.id === messageId);
      if (index === -1) return;

      const finalHistory = currentMessages.slice(0, index);
      get().setMessagesMap({ ...messagesMap, [activeSessionId]: finalHistory });

      await triggerStreaming(finalHistory);
    },

    deleteMessage: (messageId) => {
      const { activeSessionId, messagesMap } = get();
      if (!activeSessionId) return;

      const currentMessages = messagesMap[activeSessionId] || [];
      const updated = currentMessages.filter(m => m.id !== messageId);
      
      get().setMessagesMap({ ...messagesMap, [activeSessionId]: updated });
    },

    stopGeneration: () => {
      const { abortController } = get();
      if (abortController) {
        abortController.abort();
        set({ abortController: null });
      }
    }
  };
});
