'use client';

import React, { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import VoiceModeOverlay from './components/VoiceModeOverlay';
import ExploreGptsModal from './components/ExploreGptsModal';
import ProjectModal from './components/ProjectModal';
import PromptLibraryModal from './components/PromptLibraryModal';
import SearchModal from './components/SearchModal';

import { useChatStore } from './store/useChatStore';
import { useProjectStore } from './store/useProjectStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useUsageStore } from './store/useUsageStore';

export default function Home() {
  const {
    isProjectModalOpen,
    isExploreGptsOpen,
    isPromptLibraryOpen,
    isSearchOpen,
    isSidebarOpen,
    setSidebarOpen,
    setSearchOpen,
    setPromptLibraryOpen,
    setExploreGptsOpen,
    setProjectModalOpen
  } = useProjectStore();

  const {
    isSettingsOpen,
    toggleSettings,
    settings,
    mounted,
    setMounted
  } = useSettingsStore();

  const {
    isVoiceModeOpen,
    setVoiceModeOpen,
    createNewSession
  } = useChatStore();

  // 1. Initialize stores and mount status on client
  useEffect(() => {
    // Load persisted state from storage
    useSettingsStore.getState().initialize();
    useChatStore.getState().initialize();
    useProjectStore.getState().initialize();
    useUsageStore.getState().initialize();
    
    // Mark as mounted
    setMounted(true);

    // Responsive: collapse sidebar on small screens initially
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [setMounted, setSidebarOpen]);

  // 2. Apply Light/Dark/System appearance mode
  useEffect(() => {
    if (!mounted) return;
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
  }, [settings.appearanceMode, mounted]);

  // 3. Global keyboard shortcuts
  useEffect(() => {
    if (!mounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside an input/textarea/contenteditable
      const tag = (e.target as HTMLElement).tagName;
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;

      // Ctrl+N or Cmd+N — New Chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        createNewSession();
        return;
      }
      // Ctrl+, — Open Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        toggleSettings(true);
        return;
      }
      // Ctrl+/ — Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setSidebarOpen(!isSidebarOpen);
        return;
      }
      // Ctrl+K — Toggle Sidebar (also commonly used)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        setSidebarOpen(!isSidebarOpen);
        return;
      }
      // Ctrl+Shift+F — Open Global Search
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      // Escape — Close any open modal
      if (e.key === 'Escape') {
        if (isSettingsOpen) { toggleSettings(false); return; }
        if (isSearchOpen) { setSearchOpen(false); return; }
        if (isPromptLibraryOpen) { setPromptLibraryOpen(false); return; }
        if (isExploreGptsOpen) { setExploreGptsOpen(false); return; }
        if (isProjectModalOpen) { setProjectModalOpen(false); return; }
        if (isVoiceModeOpen) { setVoiceModeOpen(false); return; }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    mounted,
    isSettingsOpen,
    isSearchOpen,
    isPromptLibraryOpen,
    isExploreGptsOpen,
    isProjectModalOpen,
    isVoiceModeOpen,
    isSidebarOpen,
    createNewSession,
    toggleSettings,
    setSidebarOpen,
    setSearchOpen,
    setPromptLibraryOpen,
    setExploreGptsOpen,
    setProjectModalOpen,
    setVoiceModeOpen
  ]);

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
      <Sidebar />
      <ChatArea />
      <SettingsModal />
      <VoiceModeOverlay />
      <ExploreGptsModal />
      <ProjectModal />
      <PromptLibraryModal />
      <SearchModal />
    </div>
  );
}
