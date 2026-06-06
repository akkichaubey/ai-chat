import { create } from 'zustand';
import { Project } from '../components/ProjectModal';
import { CustomGpt } from '../components/ExploreGptsModal';

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
}

interface ProjectState {
  projects: Project[];
  customGpts: CustomGpt[];
  memories: MemoryItem[];
  isProjectModalOpen: boolean;
  isExploreGptsOpen: boolean;
  isPromptLibraryOpen: boolean;
  isSearchOpen: boolean;
  isSidebarOpen: boolean;
  activeEditingProject: Project | null;
  injectedPrompt: string;

  // Actions
  initialize: () => void;
  setProjects: (projects: Project[]) => void;
  saveProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  setProjectModalOpen: (isOpen: boolean) => void;
  setActiveEditingProject: (project: Project | null) => void;
  
  setCustomGpts: (gpts: CustomGpt[]) => void;
  saveCustomGpt: (gpt: CustomGpt) => void;
  deleteCustomGpt: (id: string) => void;
  setExploreGptsOpen: (isOpen: boolean) => void;
  
  setPromptLibraryOpen: (isOpen: boolean) => void;
  setSearchOpen: (isOpen: boolean) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setInjectedPrompt: (prompt: string) => void;

  setMemories: (memories: MemoryItem[]) => void;
  saveMemory: (key: string, value: string) => void;
  updateMemory: (id: string, key: string, value: string) => void;
  deleteMemory: (id: string) => void;
  clearAllMemories: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  customGpts: [],
  memories: [],
  isProjectModalOpen: false,
  isExploreGptsOpen: false,
  isPromptLibraryOpen: false,
  isSearchOpen: false,
  isSidebarOpen: true,
  activeEditingProject: null,
  injectedPrompt: '',

  initialize: () => {
    // Load Projects
    try {
      const savedProjects = localStorage.getItem('gemma_projects');
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed)) set({ projects: parsed });
      }
    } catch (e) {
      console.error('Failed to load projects from storage', e);
    }

    // Load Custom GPTs
    try {
      const savedCustomGpts = localStorage.getItem('gemma_chat_custom_gpts');
      if (savedCustomGpts) {
        const parsed = JSON.parse(savedCustomGpts);
        if (Array.isArray(parsed)) set({ customGpts: parsed });
      }
    } catch (e) {
      console.error('Failed to load custom GPTs from storage', e);
    }

    // Load Memories
    try {
      const savedMemories = localStorage.getItem('gemma_memories');
      if (savedMemories) {
        const parsed = JSON.parse(savedMemories);
        if (Array.isArray(parsed)) set({ memories: parsed });
      }
    } catch (e) {
      console.error('Failed to load memories from storage', e);
    }
  },

  setProjects: (projects) => {
    set({ projects });
    localStorage.setItem('gemma_projects', JSON.stringify(projects));
  },

  saveProject: (project) => {
    const { projects } = get();
    const exists = projects.some((p) => p.id === project.id);
    const updated = exists
      ? projects.map((p) => (p.id === project.id ? project : p))
      : [...projects, project];
    get().setProjects(updated);
  },

  deleteProject: (projectId) => {
    const { projects } = get();
    const updated = projects.filter((p) => p.id !== projectId);
    get().setProjects(updated);
  },

  setProjectModalOpen: (isOpen) => set({ isProjectModalOpen: isOpen }),
  setActiveEditingProject: (project) => set({ activeEditingProject: project }),

  setCustomGpts: (customGpts) => {
    set({ customGpts });
    localStorage.setItem('gemma_chat_custom_gpts', JSON.stringify(customGpts));
  },

  saveCustomGpt: (gpt) => {
    const { customGpts } = get();
    const exists = customGpts.some((g) => g.id === gpt.id);
    const updated = exists
      ? customGpts.map((g) => (g.id === gpt.id ? gpt : g))
      : [...customGpts, gpt];
    get().setCustomGpts(updated);
  },

  deleteCustomGpt: (id) => {
    const { customGpts } = get();
    const updated = customGpts.filter((g) => g.id !== id);
    get().setCustomGpts(updated);
  },

  setExploreGptsOpen: (isOpen) => set({ isExploreGptsOpen: isOpen }),
  setPromptLibraryOpen: (isOpen) => set({ isPromptLibraryOpen: isOpen }),
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setInjectedPrompt: (prompt) => set({ injectedPrompt: prompt }),

  setMemories: (memories) => {
    set({ memories });
    localStorage.setItem('gemma_memories', JSON.stringify(memories));
  },

  saveMemory: (key, value) => {
    const { memories } = get();
    const newMemory: MemoryItem = {
      id: Date.now().toString(),
      key,
      value
    };
    get().setMemories([...memories, newMemory]);
  },

  updateMemory: (id, key, value) => {
    const { memories } = get();
    const updated = memories.map((m) => (m.id === id ? { ...m, key, value } : m));
    get().setMemories(updated);
  },

  deleteMemory: (id) => {
    const { memories } = get();
    const updated = memories.filter((m) => m.id !== id);
    get().setMemories(updated);
  },

  clearAllMemories: () => {
    get().setMemories([]);
  }
}));
