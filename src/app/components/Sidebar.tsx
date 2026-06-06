'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Settings, 
  Search,
  Pin,
  Sparkles,
  Brain,
  Code,
  Compass,
  PanelLeftClose,
  SquarePen,
  MoreHorizontal,
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderInput
} from 'lucide-react';

export interface Project {
  id: string;
  name: string;
  description: string;
  instructions: string;
  createdAt: number;
}

import { useChatStore, ChatSession } from '../store/useChatStore';
import { useProjectStore } from '../store/useProjectStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useUsageStore, getTodayKey } from '../store/useUsageStore';
import { useLocalProjectStore, saveDirectoryHandle } from '../store/useLocalProjectStore';

export default function Sidebar() {
  const { stats } = useUsageStore();
  const today = getTodayKey();
  const todayRequests = stats.dailyRequests[today] || 0;
  const todayTokens = stats.dailyTokens[today] || 0;

  const requestLimit = stats.maxDailyRequests;
  const tokenLimit = stats.maxDailyTokens;

  const requestPercent = Math.min(100, (todayRequests / requestLimit) * 100);
  const tokenPercent = Math.min(100, (todayTokens / tokenLimit) * 100);

  const formatTokens = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };
  const {
    sessions,
    activeSessionId,
    setActiveSessionId: onSelectSession,
    createNewSession: onCreateSession,
    deleteSession: onDeleteSession,
    renameSession: onRenameSession,
    pinSession,
    moveSessionToProject: onMoveSessionToProject
  } = useChatStore();

  const {
    projects,
    isSidebarOpen: isOpen,
    setSidebarOpen,
    setProjectModalOpen,
    setActiveEditingProject,
    deleteProject: onDeleteProject,
    setSearchOpen: onOpenSearch,
    setPromptLibraryOpen: onOpenPromptLibrary,
    setExploreGptsOpen: onOpenExploreGpts,
    saveProject
  } = useProjectStore();

  const { toggleSettings: onOpenSettings } = useSettingsStore();

  const onToggleOpen = () => setSidebarOpen(!isOpen);
  const onTogglePinSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      pinSession(id, !session.pinned);
    }
  };

  const onCreateProject = () => {
    setActiveEditingProject(null);
    setProjectModalOpen(true);
  };

  const handleSelectFolderAndCreateProject = async () => {
    if (typeof window === 'undefined' || !(window as any).showDirectoryPicker) {
      alert('Your browser does not support the File System Access API. Please use Chrome, Edge, or Safari.');
      return;
    }
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      const newProjectId = Date.now().toString();
      
      // Save project
      saveProject({
        id: newProjectId,
        name: handle.name,
        description: `Local project workspace for ${handle.name}`,
        instructions: '',
        createdAt: Date.now()
      });

      // Save directory handle
      await saveDirectoryHandle(newProjectId, handle);
      
      // Update local project store state
      useLocalProjectStore.setState({
        activeDirectoryHandle: handle,
        directoryPermissionStatus: 'granted',
        attachedFiles: []
      });

      // Scan directory in background
      useLocalProjectStore.getState().scanDirectory(newProjectId);

      // Create a new session for this project and make it active
      onCreateSession(newProjectId);
      
    } catch (err) {
      console.warn('Directory picker cancelled or failed:', err);
    }
  };

  const onEditProject = (project: Project) => {
    setActiveEditingProject(project);
    setProjectModalOpen(true);
  };

  const onCreateSessionInProject = (projectId: string) => {
    onCreateSession(projectId);
  };
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [isMoveToProjectOpen, setIsMoveToProjectOpen] = useState(false);
  const [activeMoveSessionId, setActiveMoveSessionId] = useState<string | null>(null);

  const handleStartRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setTempTitle(currentTitle);
    setActiveDropdownId(null);
  };

  const handleSaveRename = (e: React.FormEvent | React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (tempTitle.trim()) {
      onRenameSession(id, tempTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const filteredSessions = sessions;

  const pinnedSessions = filteredSessions.filter(s => s.pinned && !s.projectId);
  const unpinnedSessions = filteredSessions.filter(s => !s.pinned && !s.projectId);

  const getChronologicalGroup = (id: string): string => {
    const timestamp = parseInt(id, 10);
    if (isNaN(timestamp)) return 'Recent';

    const now = new Date();
    const date = new Date(timestamp);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (date >= today) return 'Today';
    if (date >= yesterday) return 'Yesterday';
    if (date >= sevenDaysAgo) return 'Previous 7 Days';
    if (date >= thirtyDaysAgo) return 'Previous 30 Days';
    return 'Older';
  };

  const groupsOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'Older'];
  
  const groupedUnpinnedSessions: Record<string, ChatSession[]> = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    'Older': []
  };

  unpinnedSessions.forEach(session => {
    const group = getChronologicalGroup(session.id);
    if (groupedUnpinnedSessions[group]) {
      groupedUnpinnedSessions[group].push(session);
    } else {
      groupedUnpinnedSessions['Older'].push(session);
    }
  });

  const renderPersonaBadge = (persona?: string) => {
    if (!persona || persona === 'general') return null;
    
    let label = '';
    let classes = '';
    let Icon = Compass;

    if (persona === 'writer') {
      label = 'Writer';
      classes = 'text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 dark:text-indigo-300';
      Icon = Compass;
    } else if (persona === 'code') {
      label = 'Code';
      classes = 'text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
      Icon = Code;
    } else if (persona === 'custom') {
      label = 'Custom';
      classes = 'text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400';
      Icon = Sparkles;
    } else {
      return null;
    }

    return (
      <span className={`${classes} flex items-center gap-0.5 shrink-0 ml-1.5`} title={`${label} Persona`}>
        <Icon className="w-2.5 h-2.5" />
        {label}
      </span>
    );
  };

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    const isEditing = session.id === editingSessionId;
    const isDropdownOpen = activeDropdownId === session.id;

    return (
      <div
        key={session.id}
        onClick={() => onSelectSession(session.id)}
        className={`group relative flex items-center justify-between py-2 px-2.5 mx-2 rounded-lg cursor-pointer transition-all duration-155 select-none ${
          isActive 
            ? 'bg-slate-800 text-slate-100 font-semibold shadow-sm' 
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-6">
          <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-200' : 'text-slate-500 opacity-60 group-hover:opacity-100'}`} />
          
          {isEditing ? (
            <form 
              onSubmit={(e) => handleSaveRename(e, session.id)}
              className="flex items-center flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-xs px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-primary text-slate-200 font-sans"
                autoFocus
              />
            </form>
          ) : (
            <div className="flex items-center min-w-0 flex-1">
              <span className="text-sm truncate leading-relaxed">
                {session.title}
              </span>
              {renderPersonaBadge(session.persona)}
            </div>
          )}
        </div>

        {/* Three-dots menu for actions (Pin, Rename, Delete) */}
        {!isEditing && (
          <div className="absolute right-2 flex items-center">
            {session.pinned && !isDropdownOpen && (
              <Pin className="w-3.5 h-3.5 fill-primary text-primary group-hover:opacity-0 transition-opacity mr-1" />
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdownId(isDropdownOpen ? null : session.id);
              }}
              className={`p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-all ${
                isDropdownOpen ? 'opacity-100 text-slate-200 bg-slate-700' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="Options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdownId(null);
                  }}
                />
                <div 
                  className="absolute right-0 top-7 z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 w-36 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePinSession(session.id);
                      setActiveDropdownId(null);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-left text-xs font-semibold text-slate-350 hover:text-slate-100 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
                  >
                    <Pin className={`w-3.5 h-3.5 text-slate-450 ${session.pinned ? 'fill-current text-primary' : ''}`} />
                    {session.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(e, session.id, session.title);
                      setActiveDropdownId(null);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-left text-xs font-semibold text-slate-350 hover:text-slate-100 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-450" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMoveSessionId(session.id);
                      setIsMoveToProjectOpen(true);
                      setActiveDropdownId(null);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-left text-xs font-semibold text-slate-350 hover:text-slate-100 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
                  >
                    <FolderInput className="w-3.5 h-3.5 text-slate-450" />
                    Move to...
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                      setActiveDropdownId(null);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-left text-xs font-semibold text-rose-500 hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {isEditing && (
          <div className="absolute right-2 flex items-center gap-1">
            <button
              onClick={(e) => handleSaveRename(e, session.id)}
              className="p-1 rounded text-emerald-500 hover:bg-emerald-950/20 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCancelRename}
              className="p-1 rounded text-rose-500 hover:bg-rose-950/20 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          onClick={onToggleOpen}
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 flex flex-col h-full bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out sidebar-container ${
          isOpen ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-[68px] overflow-visible'
        }`}
      >
        {isOpen ? (
          <>
        {/* Top Header Row (Close button & New Chat button) */}
        <div className="flex items-center justify-between p-3.5 h-[60px] shrink-0 text-slate-200">
          <button
            onClick={onToggleOpen}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all cursor-pointer"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => onCreateSession()}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all cursor-pointer"
            title="New chat"
          >
            <SquarePen className="w-5 h-5" />
          </button>
        </div>

        {/* Search Session Bar */}
        <div 
          className="px-3.5 mb-2.5 shrink-0 cursor-pointer" 
          onClick={() => onOpenSearch && onOpenSearch(true)}
        >
          <div className="relative flex items-center cursor-pointer">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-550" />
            <input
              type="text"
              placeholder="Search chats & contents..."
              readOnly
              className="w-full bg-slate-900/60 border border-transparent focus:border-slate-700 rounded-lg py-1.5 pl-9 pr-8 text-xs text-slate-100 placeholder-slate-550 cursor-pointer focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Explore GPTs & Prompt Library trigger row */}
        <div className="px-3.5 mb-3.5 shrink-0 grid grid-cols-1 gap-2 select-none">
          <button
            onClick={() => onOpenExploreGpts && onOpenExploreGpts(true)}
            className="group flex flex-col items-center justify-center gap-1.5 w-full py-3 px-2 rounded-xl bg-slate-900/30 hover:bg-slate-800/60 border border-slate-800/45 hover:border-primary/35 transition-all duration-300 cursor-pointer shadow-sm text-center"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Compass className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-200 leading-none group-hover:text-white transition-colors">Explore GPTs</span>
              <span className="text-[8px] text-slate-500 mt-1 font-sans leading-none">Custom Agents</span>
            </div>
          </button>
          <button
            onClick={() => onOpenPromptLibrary && onOpenPromptLibrary(true)}
            className="group flex flex-col items-center justify-center gap-1.5 w-full py-3 px-2 rounded-xl bg-slate-900/30 hover:bg-slate-800/60 border border-slate-800/45 hover:border-primary/35 transition-all duration-300 cursor-pointer shadow-sm text-center"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-200 leading-none group-hover:text-white transition-colors">Prompt Lib</span>
              <span className="text-[8px] text-slate-500 mt-1 font-sans leading-none">Templates</span>
            </div>
          </button>
        </div>

        {/* Chat List Grouped Chronologically */}
        <div className="flex-1 overflow-y-auto px-1 space-y-4 mb-2 scrollbar-thin">
          {filteredSessions.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-8 px-4 font-sans leading-relaxed">
              {'No conversations yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pinned Chats Section */}
              {pinnedSessions.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5 mt-1 select-none">
                    <Pin className="w-2.5 h-2.5 text-primary" /> Pinned
                  </div>
                  {pinnedSessions.map(renderSessionItem)}
                </div>
              )}

              {/* Chronological Chat Sections */}
              {groupsOrder.map(groupName => {
                const groupSessions = groupedUnpinnedSessions[groupName];
                if (!groupSessions || groupSessions.length === 0) return null;

                return (
                  <div key={groupName} className="space-y-0.5">
                    <div className="px-4 text-[10px] font-bold text-slate-500 tracking-wider mb-1.5 mt-2 select-none">
                      {groupName}
                    </div>
                    {groupSessions.map(renderSessionItem)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User Settings Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 shrink-0 space-y-2 sidebar-footer-row">
          {/* Daily Quota Meter */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-2.5 mb-1.5 text-[11px] shadow-inner font-sans select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between text-slate-400 font-semibold mb-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Daily Quota Meter
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Today</span>
            </div>
            
            {/* Requests gauge */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 font-medium text-[10px]">
                <span>Requests</span>
                <span className="font-mono text-slate-350">{todayRequests} / {requestLimit}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/40">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    requestPercent > 90 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                    requestPercent > 70 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                    'bg-primary shadow-[0_0_8px_rgba(168,199,250,0.5)]'
                  }`}
                  style={{ width: `${requestPercent}%` }}
                />
              </div>
            </div>

            {/* Tokens gauge */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 font-medium text-[10px]">
                <span>Estimated Tokens</span>
                <span className="font-mono text-slate-350">{formatTokens(todayTokens)} / {formatTokens(tokenLimit)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/40">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    tokenPercent > 90 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                    tokenPercent > 70 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                    'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]'
                  }`}
                  style={{ width: `${tokenPercent}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenSettings(true)}
            className="flex items-center gap-3 w-full py-2 px-2.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all text-sm cursor-pointer border border-transparent"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-[10px] font-bold text-slate-950 shadow-inner select-none shrink-0 border border-slate-800">
              AI
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs font-semibold text-slate-100 truncate leading-normal">
                AI User
              </div>
              <div className="text-[10px] text-slate-500 truncate leading-none">Settings & Instructions</div>
            </div>
            <Settings className="w-4 h-4 text-slate-500 shrink-0" />
          </button>
        </div>
        </>
        ) : (
          /* ================= COLLAPSED MINI-VIEW ================= */
          <div className="flex flex-col h-full items-center justify-between py-4 select-none shrink-0 w-[68px] bg-slate-950 sidebar-narrow-strip">
            {/* Collapsed top bar items */}
            <div className="flex flex-col items-center gap-5 w-full">
              {/* Gemma/Bot logo with expand panel action */}
              <button
                onClick={onToggleOpen}
                className="p-2 rounded-xl text-primary bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer hover:scale-105"
                title="Expand sidebar"
              >
                <Brain className="w-5.5 h-5.5" />
              </button>

              <div className="w-8 h-px bg-slate-800 my-1" />

              {/* New Chat */}
              <button
                onClick={() => onCreateSession()}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all cursor-pointer"
                title="New chat"
              >
                <SquarePen className="w-5 h-5" />
              </button>

              {/* Search */}
              {onOpenSearch && (
                <button
                  onClick={() => onOpenSearch(true)}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all cursor-pointer"
                  title="Search chats & contents"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Explore GPTs */}
              <button
                onClick={() => onOpenExploreGpts && onOpenExploreGpts(true)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all cursor-pointer"
                title="Explore Custom GPTs"
              >
                <Compass className="w-5 h-5 text-primary" />
              </button>

              {/* Prompt Library */}
              {onOpenPromptLibrary && (
                <button
                  onClick={() => onOpenPromptLibrary(true)}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all cursor-pointer"
                  title="Prompt Library Templates"
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </button>
              )}
            </div>

            {/* Collapsed bottom profile bar */}
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Settings Trigger Icon */}
              <button
                onClick={() => onOpenSettings(true)}
                className="p-2.5 rounded-xl text-slate-500 hover:text-slate-100 hover:bg-slate-900 transition-all cursor-pointer"
                title="Settings & Instructions"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Avatar Circle */}
              <button
                onClick={() => onOpenSettings(true)}
                className="cursor-pointer transition-transform hover:scale-105"
                title="User Profile Settings"
              >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-[10px] font-bold text-slate-955 shadow-md select-none shrink-0 border border-slate-800">
                    AI
                  </div>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Move to Project Modal */}
      {isMoveToProjectOpen && activeMoveSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans select-none animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsMoveToProjectOpen(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 text-slate-100">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <FolderInput className="w-4 h-4 text-primary" /> Move Chat to Project
              </span>
              <button 
                onClick={() => setIsMoveToProjectOpen(false)} 
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="space-y-2 py-1 max-h-60 overflow-y-auto scrollbar-thin">
              {/* Unassigned / Clear project */}
              <button
                onClick={() => {
                  if (onMoveSessionToProject && activeMoveSessionId) {
                    onMoveSessionToProject(activeMoveSessionId, undefined);
                  }
                  setIsMoveToProjectOpen(false);
                }}
                className="w-full text-left text-xs p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 hover:border-slate-650 text-slate-300 transition-all font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Folder className="w-3.5 h-3.5 text-slate-500" />
                Unassigned (Move out of project)
              </button>
              
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => {
                    if (onMoveSessionToProject && activeMoveSessionId) {
                      onMoveSessionToProject(activeMoveSessionId, project.id);
                    }
                    setIsMoveToProjectOpen(false);
                  }}
                  className="w-full text-left text-xs p-2.5 rounded-xl border border-transparent bg-slate-900/60 hover:bg-slate-800 text-slate-200 transition-all font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Folder className="w-3.5 h-3.5 text-primary" />
                  {project.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
